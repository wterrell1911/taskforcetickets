/**
 * Scraper for IJOW (Integrated Justice Online Warehouse) Dashboard
 * https://ccre.shinyapps.io/ijow/
 *
 * Extracts THP and Sheriff traffic citation data
 */

import puppeteer from 'puppeteer';
import { writeFile, readFile, mkdir } from 'fs/promises';
import path from 'path';

interface CitationData {
  scrapedAt: string;
  source: 'ijow';
  trafficCitations: {
    week: string;
    year: number;
    agency: string;
    count: number;
  }[];
  summary: {
    totalTHP: number;
    totalSheriff: number;
    dateRange: {
      start: string;
      end: string;
    };
    byMonth: Record<string, { thp: number; sheriff: number }>;
  };
}

async function scrapeIJOW(): Promise<CitationData> {
  console.log('🚀 Starting IJOW scraper...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Set a realistic viewport
    await page.setViewport({ width: 1920, height: 1080 });

    console.log('📡 Navigating to IJOW dashboard...');
    await page.goto('https://ccre.shinyapps.io/ijow/', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Wait for Shiny to fully load
    console.log('⏳ Waiting for Shiny app to initialize...');
    await page.waitForSelector('.shiny-plot-output, .plotly', { timeout: 30000 });

    // Give extra time for all data to render
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Click on Traffic Citations tab if it exists
    console.log('🔍 Looking for Traffic Citations section...');

    // Try to find and click the traffic citations tab
    const tabs = await page.$$('a[data-toggle="tab"], .nav-link, [role="tab"]');
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text && text.toLowerCase().includes('traffic')) {
        console.log('📋 Found Traffic Citations tab, clicking...');
        await tab.click();
        await new Promise(resolve => setTimeout(resolve, 3000));
        break;
      }
    }

    // Extract data from the page
    console.log('📊 Extracting citation data...');

    const data = await page.evaluate(() => {
      const citations: { week: string; year: number; agency: string; count: number }[] = [];

      // Try to find Plotly chart data
      const plotlyCharts = document.querySelectorAll('.js-plotly-plot');
      plotlyCharts.forEach((chart) => {
        // @ts-ignore - Plotly stores data on the element
        const plotData = (chart as any).data;
        const layout = (chart as any).layout;

        if (plotData && layout) {
          // Get x-axis tick labels for date mapping
          const xaxisRange = layout.xaxis?.range || [];
          const ticktext = layout.xaxis?.ticktext || [];
          const tickvals = layout.xaxis?.tickvals || [];

          console.log('Layout xaxis:', JSON.stringify(layout.xaxis));

          plotData.forEach((trace: any) => {
            if (trace.y && trace.name) {
              const agencyName = trace.name || 'Unknown';

              // Check if this is citation-related data
              if (agencyName.includes('Sheriff') || agencyName.includes('Highway') || agencyName.includes('THP')) {
                trace.y.forEach((count: number, i: number) => {
                  if (typeof count === 'number' && count > 0) {
                    // Try to get the date from x value or calculate from index
                    let weekDate = '';

                    if (trace.x && trace.x[i]) {
                      const xVal = trace.x[i];
                      // Check if it's a date string
                      if (typeof xVal === 'string' && xVal.includes('-')) {
                        weekDate = xVal;
                      } else if (typeof xVal === 'number') {
                        // It's likely milliseconds or a date number
                        const date = new Date(xVal);
                        if (date.getFullYear() > 2000) {
                          weekDate = date.toISOString().split('T')[0];
                        }
                      }
                    }

                    // If still no date, estimate based on index (weekly data starting Jan 2025)
                    if (!weekDate || weekDate.includes('1970')) {
                      const startDate = new Date('2025-01-01');
                      startDate.setDate(startDate.getDate() + (i * 7));
                      weekDate = startDate.toISOString().split('T')[0];
                    }

                    citations.push({
                      week: weekDate,
                      year: parseInt(weekDate.split('-')[0]) || 2025,
                      agency: agencyName,
                      count: Math.round(count),
                    });
                  }
                });
              }
            }
          });
        }
      });

      // Also try to extract from tables
      const tables = document.querySelectorAll('table');
      tables.forEach((table) => {
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim().toLowerCase() || '');
        const rows = table.querySelectorAll('tbody tr');

        rows.forEach((row) => {
          const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent?.trim() || '');
          // Try to match citation data patterns
          if (cells.length >= 2) {
            const dateIdx = headers.findIndex(h => h.includes('date') || h.includes('month'));
            const countIdx = headers.findIndex(h => h.includes('count') || h.includes('citation') || h.includes('total'));
            const agencyIdx = headers.findIndex(h => h.includes('agency'));

            if (countIdx >= 0) {
              const count = parseInt(cells[countIdx]?.replace(/,/g, '') || '0');
              if (count > 0) {
                citations.push({
                  week: cells[dateIdx] || new Date().toISOString().slice(0, 10),
                  year: new Date().getFullYear(),
                  agency: cells[agencyIdx] || 'THP',
                  count,
                });
              }
            }
          }
        });
      });

      // Try to extract any visible text data about citations
      const allText = document.body.innerText;
      const thpMatch = allText.match(/THP[:\s]+(\d{1,3}(?:,\d{3})*)/gi);
      const sheriffMatch = allText.match(/Sheriff[:\s]+(\d{1,3}(?:,\d{3})*)/gi);

      return {
        citations,
        rawMatches: {
          thp: thpMatch,
          sheriff: sheriffMatch,
        },
        pageText: allText.substring(0, 5000), // First 5000 chars for debugging
      };
    });

    console.log(`📈 Found ${data.citations.length} citation records`);

    // Take a screenshot for debugging
    const screenshotPath = path.join(process.cwd(), 'data', 'ijow-screenshot.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved to ${screenshotPath}`);

    // Calculate summary
    let totalTHP = 0;
    let totalSheriff = 0;
    const byMonth: Record<string, { thp: number; sheriff: number }> = {};

    data.citations.forEach((c) => {
      const monthKey = c.week.slice(0, 7); // YYYY-MM
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { thp: 0, sheriff: 0 };
      }

      if (c.agency.toLowerCase().includes('thp') || c.agency.toLowerCase().includes('highway')) {
        totalTHP += c.count;
        byMonth[monthKey].thp += c.count;
      } else if (c.agency.toLowerCase().includes('sheriff')) {
        totalSheriff += c.count;
        byMonth[monthKey].sheriff += c.count;
      }
    });

    // Sort citations by date
    const sortedCitations = [...data.citations].sort((a, b) => a.week.localeCompare(b.week));

    const result: CitationData = {
      scrapedAt: new Date().toISOString(),
      source: 'ijow',
      trafficCitations: sortedCitations,
      summary: {
        totalTHP,
        totalSheriff,
        dateRange: {
          start: sortedCitations[0]?.week || '',
          end: sortedCitations[sortedCitations.length - 1]?.week || '',
        },
        byMonth,
      },
    };

    // Log debug info
    console.log('\n📝 Debug info:');
    console.log('Raw THP matches:', data.rawMatches.thp);
    console.log('Raw Sheriff matches:', data.rawMatches.sheriff);
    console.log('\nPage text sample:');
    console.log(data.pageText.substring(0, 1000));

    return result;
  } finally {
    await browser.close();
  }
}

async function main() {
  try {
    const data = await scrapeIJOW();

    // Ensure data directory exists
    const dataDir = path.join(process.cwd(), 'data');
    await mkdir(dataDir, { recursive: true });

    // Save scraped data
    const outputPath = path.join(dataDir, 'ijow-citations.json');
    await writeFile(outputPath, JSON.stringify(data, null, 2));

    console.log('\n✅ Scraping complete!');
    console.log(`📁 Data saved to: ${outputPath}`);
    console.log(`\n📊 Summary:`);
    console.log(`   Total THP Citations: ${data.summary.totalTHP.toLocaleString()}`);
    console.log(`   Total Sheriff Citations: ${data.summary.totalSheriff.toLocaleString()}`);
    console.log(`   Records found: ${data.trafficCitations.length}`);

    // Merge with existing data if any
    const existingPath = path.join(dataDir, 'shelby-citations.json');
    try {
      const existing = JSON.parse(await readFile(existingPath, 'utf-8'));
      // Merge logic here if needed
      console.log(`\n📎 Existing data found with ${existing.trafficCitations?.length || 0} records`);
    } catch {
      // No existing file, save new one
      await writeFile(existingPath, JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error('❌ Scraping failed:', error);
    process.exit(1);
  }
}

main();

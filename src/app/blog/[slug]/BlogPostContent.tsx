'use client';

import Link from 'next/link';

interface BlogPostContentProps {
  content: string;
}

function parseMarkdownToJSX(content: string) {
  const lines = content.trim().split('\n');
  const elements: React.ReactNode[] = [];
  let key = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Horizontal rule
    if (line.trim() === '---') {
      elements.push(
        <hr key={key++} className="border-t border-[#E5E5E5] my-10" />
      );
      i++;
      continue;
    }

    // H2
    if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={key++}
          className="text-2xl md:text-3xl font-bold text-[#1A1A1A] mt-12 mb-4"
        >
          {renderInline(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith('### ')) {
      elements.push(
        <h3
          key={key++}
          className="text-xl md:text-2xl font-bold text-[#1A1A1A] mt-8 mb-3"
        >
          {renderInline(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }

    // Table
    if (line.includes('|') && lines[i + 1]?.includes('---')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      elements.push(renderTable(tableLines, key++));
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line.trim())) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        listItems.push(lines[i].replace(/^\d+\.\s/, '').trim());
        i++;
      }
      elements.push(
        <ol key={key++} className="list-decimal list-outside ml-6 space-y-2 my-6 text-[#4A4A4A] leading-relaxed">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Unordered list
    if (line.trim().startsWith('- ')) {
      const listItems: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('- ')) {
        listItems.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <ul key={key++} className="list-disc list-outside ml-6 space-y-2 my-6 text-[#4A4A4A] leading-relaxed">
          {listItems.map((item, idx) => (
            <li key={idx}>{renderInline(item)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Italic block (disclaimer text starting with *)
    if (line.trim().startsWith('*') && line.trim().endsWith('*') && !line.trim().startsWith('**')) {
      elements.push(
        <p key={key++} className="text-sm text-[#4A4A4A]/60 italic my-6 leading-relaxed">
          {renderInline(line.trim().slice(1, -1))}
        </p>
      );
      i++;
      continue;
    }

    // Regular paragraph
    {
      let paraLines: string[] = [line];
      i++;
      while (
        i < lines.length &&
        lines[i].trim() !== '' &&
        !lines[i].startsWith('#') &&
        !lines[i].startsWith('- ') &&
        !/^\d+\.\s/.test(lines[i].trim()) &&
        lines[i].trim() !== '---' &&
        !lines[i].includes('|')
      ) {
        paraLines.push(lines[i]);
        i++;
      }
      elements.push(
        <p key={key++} className="text-[#4A4A4A] leading-relaxed my-4">
          {renderInline(paraLines.join(' '))}
        </p>
      );
    }
  }

  return elements;
}

function renderTable(lines: string[], key: number) {
  const headers = lines[0]
    .split('|')
    .map((h) => h.trim())
    .filter(Boolean);
  const rows = lines.slice(2).map((row) =>
    row
      .split('|')
      .map((cell) => cell.trim())
      .filter(Boolean)
  );

  return (
    <div key={key} className="overflow-x-auto my-8">
      <table className="w-full border-collapse rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-[#1A1A1A] text-white">
            {headers.map((h, idx) => (
              <th
                key={idx}
                className="px-4 py-3 text-left text-sm font-semibold"
              >
                {renderInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={rowIdx % 2 === 0 ? 'bg-[#F8F8F8]' : 'bg-white'}
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={cellIdx}
                  className="px-4 py-3 text-sm text-[#4A4A4A] border-t border-[#E5E5E5]"
                >
                  {renderInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function renderInline(text: string): React.ReactNode {
  // Process inline markdown: bold, italic, links, inline code
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let inlineKey = 0;

  while (remaining.length > 0) {
    // Link: [text](url)
    const linkMatch = remaining.match(/^(.*?)\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      if (linkMatch[1]) {
        parts.push(...processEmphasis(linkMatch[1], inlineKey));
        inlineKey += 10;
      }
      const href = linkMatch[3];
      const isInternal = href.startsWith('/');
      if (isInternal) {
        parts.push(
          <Link
            key={inlineKey++}
            href={href}
            className="text-[#1A1A1A] font-medium underline decoration-[#FFD100] decoration-2 underline-offset-2 hover:text-[#FFD100] transition-colors"
          >
            {linkMatch[2]}
          </Link>
        );
      } else {
        parts.push(
          <a
            key={inlineKey++}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1A1A1A] font-medium underline decoration-[#FFD100] decoration-2 underline-offset-2 hover:text-[#FFD100] transition-colors"
          >
            {linkMatch[2]}
          </a>
        );
      }
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // No more special tokens — process the rest
    parts.push(...processEmphasis(remaining, inlineKey));
    break;
  }

  return parts.length === 1 ? parts[0] : parts;
}

function processEmphasis(text: string, startKey: number): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = startKey;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/^(.*?)\*\*([^*]+)\*\*/);
    if (boldMatch) {
      if (boldMatch[1]) parts.push(<span key={key++}>{boldMatch[1]}</span>);
      parts.push(
        <strong key={key++} className="font-semibold text-[#1A1A1A]">
          {boldMatch[2]}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic: *text*
    const italicMatch = remaining.match(/^(.*?)\*([^*]+)\*/);
    if (italicMatch) {
      if (italicMatch[1]) parts.push(<span key={key++}>{italicMatch[1]}</span>);
      parts.push(<em key={key++}>{italicMatch[2]}</em>);
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Plain text
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }

  return parts;
}

export function BlogPostContent({ content }: BlogPostContentProps) {
  return (
    <article className="prose-custom">
      {parseMarkdownToJSX(content)}
    </article>
  );
}

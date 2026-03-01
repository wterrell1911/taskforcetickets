'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { TrafficMetricsInput, HotspotInput, COMMON_LOCATIONS, VIOLATION_TYPES } from '@/lib/traffic-data/types';
import { getCurrentWeekStart, getWeekEnd } from '@/lib/traffic-data/calculations';

interface GeneratedContent {
  headline: string;
  summary: string;
  twitterPost: string;
  facebookPost: string;
  instagramCaption: string;
  blogContent: string;
}

export default function TrafficDataPage() {
  const [weekStart, setWeekStart] = useState(getCurrentWeekStart());
  const [metrics, setMetrics] = useState<TrafficMetricsInput>({
    week_start: getCurrentWeekStart(),
    speeding_citations: 0,
    red_light_citations: 0,
    stop_sign_citations: 0,
    reckless_driving_citations: 0,
    no_insurance_citations: 0,
    license_violations: 0,
    other_citations: 0,
    total_court_appearances: 0,
    dismissal_rate: 0,
    average_fine_amount: 0,
    total_traffic_stops: 0,
    dui_arrests: 0,
    taskforce_cases_filed: 0,
    taskforce_dismissals: 0,
  });

  const [hotspots, setHotspots] = useState<HotspotInput[]>([
    { location_name: '', citation_count: 0, primary_violation_type: 'speeding' },
  ]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [activeTab, setActiveTab] = useState<'entry' | 'content'>('entry');

  useEffect(() => {
    loadWeekData(weekStart);
  }, [weekStart]);

  async function loadWeekData(week: string) {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/traffic-data?week_start=${week}`);
      const data = await res.json();

      if (data.metrics) {
        setMetrics({
          week_start: week,
          speeding_citations: data.metrics.speeding_citations || 0,
          red_light_citations: data.metrics.red_light_citations || 0,
          stop_sign_citations: data.metrics.stop_sign_citations || 0,
          reckless_driving_citations: data.metrics.reckless_driving_citations || 0,
          no_insurance_citations: data.metrics.no_insurance_citations || 0,
          license_violations: data.metrics.license_violations || 0,
          other_citations: data.metrics.other_citations || 0,
          total_court_appearances: data.metrics.total_court_appearances || 0,
          dismissal_rate: data.metrics.dismissal_rate || 0,
          average_fine_amount: data.metrics.average_fine_amount || 0,
          total_traffic_stops: data.metrics.total_traffic_stops || 0,
          dui_arrests: data.metrics.dui_arrests || 0,
          taskforce_cases_filed: data.metrics.taskforce_cases_filed || 0,
          taskforce_dismissals: data.metrics.taskforce_dismissals || 0,
        });
      } else {
        // Reset to defaults for new week
        setMetrics((prev) => ({ ...prev, week_start: week }));
      }

      if (data.hotspots && data.hotspots.length > 0) {
        setHotspots(
          data.hotspots.map((h: HotspotInput) => ({
            location_name: h.location_name,
            citation_count: h.citation_count,
            primary_violation_type: h.primary_violation_type,
            notes: h.notes,
          }))
        );
      } else {
        setHotspots([{ location_name: '', citation_count: 0, primary_violation_type: 'speeding' }]);
      }
    } catch (err) {
      console.error('Failed to load week data:', err);
    } finally {
      setLoading(false);
    }
  }

  function updateMetric<K extends keyof TrafficMetricsInput>(field: K, value: TrafficMetricsInput[K]) {
    setMetrics((prev) => ({ ...prev, [field]: value }));
  }

  function addHotspot() {
    setHotspots([...hotspots, { location_name: '', citation_count: 0, primary_violation_type: 'speeding' }]);
  }

  function removeHotspot(index: number) {
    setHotspots(hotspots.filter((_, i) => i !== index));
  }

  function updateHotspot<K extends keyof HotspotInput>(index: number, field: K, value: HotspotInput[K]) {
    const updated = [...hotspots];
    updated[index] = { ...updated[index], [field]: value };
    setHotspots(updated);
  }

  async function handleSave() {
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const res = await fetch('/api/admin/traffic-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: { ...metrics, week_start: weekStart },
          hotspots: hotspots.filter((h) => h.location_name && h.citation_count > 0),
        }),
      });

      if (res.ok) {
        setSuccess('Traffic data saved successfully!');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save data');
      }
    } catch (err) {
      setError('Failed to save data');
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateContent() {
    setGenerating(true);
    setError('');

    try {
      const res = await fetch('/api/admin/traffic-data/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_start: weekStart }),
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedContent(data.content);
        setActiveTab('content');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to generate content');
      }
    } catch (err) {
      setError('Failed to generate content');
    } finally {
      setGenerating(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setSuccess(`${label} copied to clipboard!`);
    setTimeout(() => setSuccess(''), 2000);
  }

  const totalCitations =
    metrics.speeding_citations +
    metrics.red_light_citations +
    metrics.stop_sign_citations +
    metrics.reckless_driving_citations +
    metrics.no_insurance_citations +
    metrics.license_violations +
    metrics.other_citations;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1A1A1A]">Traffic Weather Report</h1>
            <p className="text-[#4A4A4A] mt-1">
              Enter weekly traffic data and generate social media content
            </p>
          </div>
          <div className="flex items-center gap-4">
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
            />
            <span className="text-[#4A4A4A]">to</span>
            <span className="text-[#1A1A1A] font-medium">{getWeekEnd(weekStart)}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-[#E5E5E5]">
          <button
            onClick={() => setActiveTab('entry')}
            className={`pb-3 px-1 font-medium ${
              activeTab === 'entry'
                ? 'text-[#1A1A1A] border-b-2 border-[#FFD100]'
                : 'text-[#4A4A4A] hover:text-[#1A1A1A]'
            }`}
          >
            Data Entry
          </button>
          <button
            onClick={() => setActiveTab('content')}
            className={`pb-3 px-1 font-medium ${
              activeTab === 'content'
                ? 'text-[#1A1A1A] border-b-2 border-[#FFD100]'
                : 'text-[#4A4A4A] hover:text-[#1A1A1A]'
            }`}
          >
            Generated Content
          </button>
        </div>

        {/* Alerts */}
        {success && (
          <div className="p-4 bg-emerald-50 text-emerald-700 rounded-lg">{success}</div>
        )}
        {error && <div className="p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1A1A1A]"></div>
          </div>
        ) : activeTab === 'entry' ? (
          <>
            {/* Summary Card */}
            <div className="bg-[#FFD100]/10 rounded-xl p-6 border border-[#FFD100]/30">
              <div className="grid md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-[#4A4A4A]">Total Citations</p>
                  <p className="text-3xl font-bold text-[#1A1A1A]">{totalCitations.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-[#4A4A4A]">Dismissal Rate</p>
                  <p className="text-3xl font-bold text-[#1A1A1A]">{metrics.dismissal_rate}%</p>
                </div>
                <div>
                  <p className="text-sm text-[#4A4A4A]">Average Fine</p>
                  <p className="text-3xl font-bold text-[#1A1A1A]">${metrics.average_fine_amount}</p>
                </div>
                <div>
                  <p className="text-sm text-[#4A4A4A]">TaskForce Cases</p>
                  <p className="text-3xl font-bold text-[#1A1A1A]">{metrics.taskforce_cases_filed}</p>
                </div>
              </div>
            </div>

            {/* Citation Counts */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
              <h3 className="font-semibold text-[#1A1A1A] mb-4">Citation Counts by Type</h3>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">Speeding</label>
                  <input
                    type="number"
                    value={metrics.speeding_citations || ''}
                    onChange={(e) => updateMetric('speeding_citations', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">Red Light</label>
                  <input
                    type="number"
                    value={metrics.red_light_citations || ''}
                    onChange={(e) => updateMetric('red_light_citations', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">Stop Sign</label>
                  <input
                    type="number"
                    value={metrics.stop_sign_citations || ''}
                    onChange={(e) => updateMetric('stop_sign_citations', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">Reckless Driving</label>
                  <input
                    type="number"
                    value={metrics.reckless_driving_citations || ''}
                    onChange={(e) => updateMetric('reckless_driving_citations', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">No Insurance</label>
                  <input
                    type="number"
                    value={metrics.no_insurance_citations || ''}
                    onChange={(e) => updateMetric('no_insurance_citations', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">License Violations</label>
                  <input
                    type="number"
                    value={metrics.license_violations || ''}
                    onChange={(e) => updateMetric('license_violations', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">Other</label>
                  <input
                    type="number"
                    value={metrics.other_citations || ''}
                    onChange={(e) => updateMetric('other_citations', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                  />
                </div>
              </div>
            </div>

            {/* Court & Enforcement Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
              <h3 className="font-semibold text-[#1A1A1A] mb-4">Court & Enforcement</h3>
              <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">Court Appearances</label>
                  <input
                    type="number"
                    value={metrics.total_court_appearances || ''}
                    onChange={(e) => updateMetric('total_court_appearances', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">Dismissal Rate (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={metrics.dismissal_rate || ''}
                    onChange={(e) => updateMetric('dismissal_rate', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">Average Fine ($)</label>
                  <input
                    type="number"
                    value={metrics.average_fine_amount || ''}
                    onChange={(e) => updateMetric('average_fine_amount', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">Total Traffic Stops</label>
                  <input
                    type="number"
                    value={metrics.total_traffic_stops || ''}
                    onChange={(e) => updateMetric('total_traffic_stops', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">DUI Arrests</label>
                  <input
                    type="number"
                    value={metrics.dui_arrests || ''}
                    onChange={(e) => updateMetric('dui_arrests', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                  />
                </div>
              </div>
            </div>

            {/* TaskForce Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
              <h3 className="font-semibold text-[#1A1A1A] mb-4">TaskForce Tickets Stats</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">Cases Filed</label>
                  <input
                    type="number"
                    value={metrics.taskforce_cases_filed || ''}
                    onChange={(e) => updateMetric('taskforce_cases_filed', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">Dismissals</label>
                  <input
                    type="number"
                    value={metrics.taskforce_dismissals || ''}
                    onChange={(e) => updateMetric('taskforce_dismissals', Number(e.target.value))}
                    className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[#4A4A4A] mb-1">Success Rate</label>
                  <div className="px-4 py-2 bg-[#F8F8F8] rounded-lg font-medium">
                    {metrics.taskforce_cases_filed > 0
                      ? Math.round((metrics.taskforce_dismissals / metrics.taskforce_cases_filed) * 100)
                      : 0}
                    %
                  </div>
                </div>
              </div>
            </div>

            {/* Enforcement Hotspots */}
            <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#1A1A1A]">Enforcement Hotspots</h3>
                <button
                  type="button"
                  onClick={addHotspot}
                  className="text-sm text-[#1A1A1A] hover:text-[#FFD100] font-medium"
                >
                  + Add Hotspot
                </button>
              </div>
              <div className="space-y-4">
                {hotspots.map((h, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="flex-1">
                      <label className="block text-sm text-[#4A4A4A] mb-1">Location</label>
                      <select
                        value={COMMON_LOCATIONS.includes(h.location_name as typeof COMMON_LOCATIONS[number]) ? h.location_name : 'custom'}
                        onChange={(e) => {
                          if (e.target.value !== 'custom') {
                            updateHotspot(i, 'location_name', e.target.value);
                          }
                        }}
                        className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                      >
                        <option value="">Select location...</option>
                        {COMMON_LOCATIONS.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                        <option value="custom">Custom location</option>
                      </select>
                      {!COMMON_LOCATIONS.includes(h.location_name as typeof COMMON_LOCATIONS[number]) && h.location_name !== '' && (
                        <input
                          type="text"
                          value={h.location_name}
                          onChange={(e) => updateHotspot(i, 'location_name', e.target.value)}
                          placeholder="Enter custom location"
                          className="w-full mt-2 px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                        />
                      )}
                    </div>
                    <div className="w-32">
                      <label className="block text-sm text-[#4A4A4A] mb-1">Citations</label>
                      <input
                        type="number"
                        value={h.citation_count || ''}
                        onChange={(e) => updateHotspot(i, 'citation_count', Number(e.target.value))}
                        className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                      />
                    </div>
                    <div className="w-40">
                      <label className="block text-sm text-[#4A4A4A] mb-1">Type</label>
                      <select
                        value={h.primary_violation_type}
                        onChange={(e) => updateHotspot(i, 'primary_violation_type', e.target.value)}
                        className="w-full px-4 py-2 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-[#FFD100]"
                      >
                        {Object.entries(VIOLATION_TYPES).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    {hotspots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeHotspot(i)}
                        className="mt-6 text-[#CF2A27] hover:text-[#CF2A27]/80 px-2"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#1A1A1A] text-white py-3 rounded-lg font-semibold hover:bg-[#1A1A1A]/90 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Data'}
              </button>
              <button
                onClick={handleGenerateContent}
                disabled={generating || totalCitations === 0}
                className="flex-1 bg-[#FFD100] text-[#1A1A1A] py-3 rounded-lg font-semibold hover:bg-[#FFD100]/90 disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate Content'}
              </button>
            </div>
          </>
        ) : (
          /* Content Tab */
          <div className="space-y-6">
            {generatedContent ? (
              <>
                {/* Headline & Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
                  <h3 className="font-semibold text-[#1A1A1A] mb-4">Headline & Summary</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-[#4A4A4A] mb-1">Headline</label>
                      <p className="text-lg font-medium text-[#1A1A1A]">{generatedContent.headline}</p>
                    </div>
                    <div>
                      <label className="block text-sm text-[#4A4A4A] mb-1">Summary</label>
                      <p className="text-[#1A1A1A]">{generatedContent.summary}</p>
                    </div>
                  </div>
                </div>

                {/* Twitter Post */}
                <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#1A1A1A]">Twitter/X Post</h3>
                    <button
                      onClick={() => copyToClipboard(generatedContent.twitterPost, 'Twitter post')}
                      className="text-sm text-[#1A1A1A] hover:text-[#FFD100] font-medium"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-[#1A1A1A] font-sans text-sm bg-[#F8F8F8] p-4 rounded-lg">
                    {generatedContent.twitterPost}
                  </pre>
                  <p className="text-sm text-[#4A4A4A] mt-2">
                    {generatedContent.twitterPost.length}/280 characters
                  </p>
                </div>

                {/* Facebook Post */}
                <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#1A1A1A]">Facebook Post</h3>
                    <button
                      onClick={() => copyToClipboard(generatedContent.facebookPost, 'Facebook post')}
                      className="text-sm text-[#1A1A1A] hover:text-[#FFD100] font-medium"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-[#1A1A1A] font-sans text-sm bg-[#F8F8F8] p-4 rounded-lg max-h-64 overflow-y-auto">
                    {generatedContent.facebookPost}
                  </pre>
                </div>

                {/* Instagram Caption */}
                <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#1A1A1A]">Instagram Caption</h3>
                    <button
                      onClick={() => copyToClipboard(generatedContent.instagramCaption, 'Instagram caption')}
                      className="text-sm text-[#1A1A1A] hover:text-[#FFD100] font-medium"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-[#1A1A1A] font-sans text-sm bg-[#F8F8F8] p-4 rounded-lg max-h-64 overflow-y-auto">
                    {generatedContent.instagramCaption}
                  </pre>
                </div>

                {/* Blog Content */}
                <div className="bg-white rounded-xl shadow-sm border border-[#E5E5E5] p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-[#1A1A1A]">Blog Content (Markdown)</h3>
                    <button
                      onClick={() => copyToClipboard(generatedContent.blogContent, 'Blog content')}
                      className="text-sm text-[#1A1A1A] hover:text-[#FFD100] font-medium"
                    >
                      Copy
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-[#1A1A1A] font-sans text-sm bg-[#F8F8F8] p-4 rounded-lg max-h-96 overflow-y-auto">
                    {generatedContent.blogContent}
                  </pre>
                </div>
              </>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-[#E5E5E5]">
                <p className="text-[#4A4A4A] mb-4">No content generated yet</p>
                <button
                  onClick={handleGenerateContent}
                  disabled={generating || totalCitations === 0}
                  className="bg-[#FFD100] text-[#1A1A1A] px-6 py-3 rounded-lg font-semibold hover:bg-[#FFD100]/90 disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate Content'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

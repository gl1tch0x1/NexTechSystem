'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { getApiUrl } from '@/lib/api-client';
import { StorefrontSectionConfig, BentoFeature } from '@/types';
import {
  Sliders,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Layout,
  ExternalLink,
  Plus,
  Trash2,
  Edit3,
  ShieldCheck,
  Truck,
  Building,
  Bot,
  Award,
  BarChart2,
  Megaphone,
  X,
  Type,
  LayoutGrid
} from 'lucide-react';
import Link from 'next/link';

const ICON_OPTIONS = [
  { id: 'truck', label: 'Logistics Truck', icon: Truck },
  { id: 'shield', label: 'Security Shield', icon: ShieldCheck },
  { id: 'building', label: 'Enterprise Building', icon: Building },
  { id: 'bot', label: 'AI Neural Bot', icon: Bot },
  { id: 'award', label: 'Partner Award', icon: Award },
];

export default function AdminCmsPage() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'bento' | 'sections' | 'announcements'>('bento');

  // Sections State
  const [sections, setSections] = useState<StorefrontSectionConfig[]>([]);
  const [loadingSections, setLoadingSections] = useState(true);

  // Bento Trust Features State
  const [features, setFeatures] = useState<BentoFeature[]>([]);
  const [loadingFeatures, setLoadingFeatures] = useState(true);
  const [editingFeature, setEditingFeature] = useState<BentoFeature | null>(null);
  const [isFeatureModalOpen, setIsFeatureModalOpen] = useState(false);

  // Bento Header Customization (stored on the trust_features section)
  const [bentoTitle, setBentoTitle] = useState('Why Enterprise Tech Teams Trust NexTech');
  const [bentoSubtitle, setBentoSubtitle] = useState('The NexTech Advantage');
  const [bentoDescription, setBentoDescription] = useState('Engineered for mission-critical reliability, transparent procurement, and rapid GCC deployment.');

  // Global Settings State
  const [announcementText, setAnnouncementText] = useState('Free Insured Shipping on Orders over AED 500 across UAE & GCC');
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(true);

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch Storefront Sections Layout
  const fetchLayout = async () => {
    try {
      setLoadingSections(true);
      const res = await fetch(getApiUrl('/admin/cms/layout'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setSections(data.data);
        const trustSec = data.data.find((s: StorefrontSectionConfig) => s.id === 'trust_features');
        if (trustSec) {
          if (trustSec.title) setBentoTitle(trustSec.title);
          if (trustSec.subtitle) setBentoSubtitle(trustSec.subtitle);
          if (trustSec.description) setBentoDescription(trustSec.description);
        }
      }
    } catch (err) {
      console.error('Error fetching layout:', err);
    } finally {
      setLoadingSections(false);
    }
  };

  // Fetch Bento Features
  const fetchFeatures = async () => {
    try {
      setLoadingFeatures(true);
      const res = await fetch(getApiUrl('/admin/cms/features'), {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setFeatures(data.data);
      }
    } catch (err) {
      console.error('Error fetching bento features:', err);
    } finally {
      setLoadingFeatures(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchLayout();
      fetchFeatures();
    }
  }, [token]);

  // Section Ordering
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    const reordered = newSections.map((s, idx) => ({ ...s, order: idx + 1 }));
    setSections(reordered);
  };

  const toggleSectionEnabled = (index: number) => {
    const updated = [...sections];
    const current = updated[index].enabled !== false && updated[index].isVisible !== false;
    updated[index] = { ...updated[index], enabled: !current, isVisible: !current };
    setSections(updated);
  };

  const updateSectionTitle = (index: number, title: string) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], title };
    setSections(updated);
  };

  // Save Storefront Sections Layout
  const handleSaveSections = async () => {
    try {
      setSaving(true);
      setStatusMessage(null);

      // Also ensure trust_features section includes the updated bento header fields
      const updatedSections = sections.map(s => {
        if (s.id === 'trust_features') {
          return {
            ...s,
            title: bentoTitle,
            subtitle: bentoSubtitle,
            description: bentoDescription,
          };
        }
        return s;
      });

      const res = await fetch(getApiUrl('/admin/cms/layout'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sections: updatedSections }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to persist layout');

      setSections(updatedSections);
      setStatusMessage({
        type: 'success',
        text: 'Storefront layout and section customizations saved successfully!',
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to save layout' });
    } finally {
      setSaving(false);
    }
  };

  // Bento Feature Handlers
  const handleOpenAddFeature = () => {
    setEditingFeature({
      id: '',
      title: '',
      subtitle: 'VERIFIED ADVANTAGE',
      description: '',
      tag: 'PROCUREMENT',
      iconName: 'shield',
      gridSpan: 5,
      statusBadge: 'Active Standard',
      stats: [{ label: 'Metric', value: '100%' }],
      order: features.length + 1,
      isActive: true,
    });
    setIsFeatureModalOpen(true);
  };

  const handleOpenEditFeature = (feat: BentoFeature) => {
    setEditingFeature({ ...feat, stats: feat.stats || [] });
    setIsFeatureModalOpen(true);
  };

  const handleSaveFeatureModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFeature) return;

    try {
      setSaving(true);
      setStatusMessage(null);

      const isNew = !editingFeature.id;
      const endpoint = isNew ? getApiUrl('/admin/cms/features') : getApiUrl(`/admin/cms/features/${editingFeature.id}`);
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editingFeature),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to save Bento feature');

      setIsFeatureModalOpen(false);
      setEditingFeature(null);
      fetchFeatures();

      setStatusMessage({
        type: 'success',
        text: `Bento feature "${editingFeature.title}" saved successfully!`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Error saving Bento card' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFeature = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the trust feature "${title}"?`)) return;

    try {
      setSaving(true);
      const res = await fetch(getApiUrl(`/admin/cms/features/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Failed to delete');

      fetchFeatures();
      setStatusMessage({
        type: 'success',
        text: `Bento feature "${title}" removed from storefront.`,
      });
    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to delete card' });
    } finally {
      setSaving(false);
    }
  };

  const getIconComponent = (iconName: string) => {
    const found = ICON_OPTIONS.find(i => i.id === iconName.toLowerCase());
    return found ? found.icon : ShieldCheck;
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-tech-blue dark:text-cyan-400 uppercase tracking-widest">
            <Layout className="w-4 h-4" />
            <span>Storefront Architecture &amp; Dynamic Content</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
            Storefront CMS &amp; Content Customizer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Fully customize the &quot;Why Enterprise Tech Teams Trust NexTech&quot; cards, hero headlines, and landing section layout.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            target="_blank"
            className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5 text-tech-blue" />
            <span>View Live Store</span>
          </Link>

          <button
            onClick={handleSaveSections}
            disabled={saving}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {saving ? <Sparkles className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Publish Changes</span>
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border flex items-start gap-3 text-xs font-medium animate-fadeIn ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/80 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800/80 text-red-800 dark:text-red-300'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <div className="flex-1">{statusMessage.text}</div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
          >
            &times;
          </button>
        </div>
      )}

      {/* Modern Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('bento')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'bento'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Why Tech Teams Trust NexTech (Bento Grid)</span>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-black">
            {features.length} Cards
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sections')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'sections'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Section Arranger &amp; Visibility</span>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-mono font-black">
            {sections.length} Modules
          </span>
        </button>

        <button
          onClick={() => setActiveTab('announcements')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'announcements'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Announcement Bar</span>
        </button>
      </div>

      {/* TAB 1: WHY ENTERPRISE TECH TEAMS TRUST NEXTECH (BENTO GRID) */}
      {activeTab === 'bento' && (
        <div className="space-y-6">
          {/* Section Heading Customizer Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Type className="w-4 h-4 text-tech-blue" />
                  <span>Section Headline &amp; Subtitle Customization</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Controls the top header displayed on the landing page for this section.
                </p>
              </div>
              <button
                onClick={handleSaveSections}
                className="px-3.5 py-1.5 bg-tech-blue hover:bg-blue-600 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
              >
                Save Headline
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Top Eyebrow Tag:</label>
                <input
                  type="text"
                  value={bentoSubtitle}
                  onChange={e => setBentoSubtitle(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-tech-blue"
                  placeholder="e.g. The NexTech Advantage"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Main Section Title:</label>
                <input
                  type="text"
                  value={bentoTitle}
                  onChange={e => setBentoTitle(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-tech-blue font-bold"
                  placeholder="e.g. Why Enterprise Tech Teams Trust NexTech"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Supporting Sub-Text:</label>
                <input
                  type="text"
                  value={bentoDescription}
                  onChange={e => setBentoDescription(e.target.value)}
                  className="w-full text-xs font-medium px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-tech-blue"
                  placeholder="Supporting mission description..."
                />
              </div>
            </div>
          </div>

          {/* Cards Table / Grid */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <span>Trust Advantage Bento Cards</span>
                </h2>
                <p className="text-xs text-slate-500">
                  Manage cards, metrics, descriptions, and grid dimensions rendered on the homepage.
                </p>
              </div>

              <button
                onClick={handleOpenAddFeature}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Trust Card</span>
              </button>
            </div>

            {/* Live Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map(feat => {
                const IconComp = getIconComponent(feat.iconName || 'shield');

                return (
                  <div
                    key={feat.id}
                    className="p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/90 dark:border-slate-700/80 space-y-3 relative group hover:border-tech-blue/50 transition-all shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-tech-blue dark:text-cyan-400 flex items-center justify-center font-bold shrink-0">
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                              {feat.title}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                              Col {feat.gridSpan || 5}
                            </span>
                          </div>
                          <div className="text-[11px] text-tech-blue dark:text-cyan-400 font-mono font-bold">
                            {feat.subtitle}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditFeature(feat)}
                          className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-tech-blue border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
                          title="Edit Card"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFeature(feat.id, feat.title)}
                          className="p-2 rounded-lg bg-white dark:bg-slate-800 text-slate-400 hover:text-red-600 border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
                          title="Delete Card"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {feat.description}
                    </p>

                    {feat.statusBadge && (
                      <div className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{feat.statusBadge}</span>
                      </div>
                    )}

                    {feat.stats && feat.stats.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3 text-[11px] font-mono">
                        {feat.stats.map((st, i) => (
                          <div key={i} className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                            <span className="text-slate-400">{st.label}:</span>
                            <strong className="text-slate-900 dark:text-white font-bold">{st.value}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STOREFRONT SECTIONS & ARRANGEMENT */}
      {activeTab === 'sections' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Storefront Section Order &amp; Visibility Matrix
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Arrange modules from top to bottom. Disabled sections are completely removed from the live page.
              </p>
            </div>
            <div className="text-xs font-mono font-bold text-slate-400">
              {sections.filter(s => s.enabled !== false && s.isVisible !== false).length} of {sections.length} Visible
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 p-4 sm:p-6 space-y-3">
            {sections.map((sec, index) => {
              const isEnabled = sec.enabled !== false && sec.isVisible !== false;

              return (
                <div
                  key={sec.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    isEnabled
                      ? 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 shadow-xs'
                      : 'bg-slate-100/40 dark:bg-slate-900/40 border-dashed border-slate-300 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col gap-1">
                      <button
                        type="button"
                        onClick={() => moveSection(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-tech-blue border border-slate-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(index, 'down')}
                        disabled={index === sections.length - 1}
                        className="p-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-tech-blue border border-slate-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="w-8 h-8 rounded-xl bg-tech-blue/10 text-tech-blue dark:text-cyan-400 font-mono text-xs font-black flex items-center justify-center">
                      #{index + 1}
                    </div>

                    <div className="space-y-0.5">
                      <div className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{sec.name || sec.title}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-500 font-bold">
                          {sec.id}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Slot #{index + 1} on Storefront Landing Page
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-80 flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Storefront Section Title:
                    </label>
                    <input
                      type="text"
                      value={sec.title || ''}
                      onChange={e => updateSectionTitle(index, e.target.value)}
                      placeholder="Enter section title..."
                      className="w-full text-xs font-medium px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-tech-blue"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSectionEnabled(index)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                        isEnabled
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {isEnabled ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4" />}
                      <span>{isEnabled ? 'Section Enabled' : 'Section Hidden'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ANNOUNCEMENT BAR */}
      {activeTab === 'announcements' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 max-w-3xl">
          <div className="space-y-1">
            <h2 className="text-base font-black text-slate-900 dark:text-white">Top Announcement Bar</h2>
            <p className="text-xs text-slate-500">
              Customize the message shown in the top header banner across all customer pages.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Announcement Banner Text:</label>
              <input
                type="text"
                value={announcementText}
                onChange={e => setAnnouncementText(e.target.value)}
                className="w-full text-xs font-medium p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-tech-blue"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isAnnouncementActive"
                checked={isAnnouncementActive}
                onChange={e => setIsAnnouncementActive(e.target.checked)}
                className="rounded text-tech-blue focus:ring-tech-blue h-4 w-4"
              />
              <label htmlFor="isAnnouncementActive" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                Display Announcement Bar on Customer Storefront
              </label>
            </div>

            <button
              onClick={handleSaveSections}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-tech-blue hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Update Announcement Banner
            </button>
          </div>
        </div>
      )}

      {/* EDIT / CREATE BENTO FEATURE MODAL */}
      {isFeatureModalOpen && editingFeature && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-5 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  {editingFeature.id ? 'Edit Trust Advantage Card' : 'Create New Trust Advantage Card'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFeatureModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFeatureModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Card Title:</label>
                  <input
                    type="text"
                    required
                    value={editingFeature.title}
                    onChange={e => setEditingFeature({ ...editingFeature, title: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    placeholder="e.g. GCC Same-Day Air Freight"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Eyebrow Subtitle / Tag:</label>
                  <input
                    type="text"
                    required
                    value={editingFeature.subtitle}
                    onChange={e => setEditingFeature({ ...editingFeature, subtitle: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                    placeholder="e.g. 24-HOUR GCC DISPATCH"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">Detailed Description:</label>
                <textarea
                  required
                  rows={3}
                  value={editingFeature.description}
                  onChange={e => setEditingFeature({ ...editingFeature, description: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white leading-relaxed"
                  placeholder="Explain why enterprise customers count on this capability..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Icon:</label>
                  <select
                    value={editingFeature.iconName || 'shield'}
                    onChange={e => setEditingFeature({ ...editingFeature, iconName: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    {ICON_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Grid Width Span:</label>
                  <select
                    value={editingFeature.gridSpan || 5}
                    onChange={e => setEditingFeature({ ...editingFeature, gridSpan: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  >
                    <option value={7}>Col-7 (Large Highlight Card)</option>
                    <option value={5}>Col-5 (Standard Card)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">Status Badge:</label>
                  <input
                    type="text"
                    value={editingFeature.statusBadge || ''}
                    onChange={e => setEditingFeature({ ...editingFeature, statusBadge: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    placeholder="e.g. 99.4% SLA"
                  />
                </div>
              </div>

              {/* Key Metric Stats */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Key Metrics / Statistics Displayed on Card:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Metric 1 Label:</span>
                    <input
                      type="text"
                      value={editingFeature.stats?.[0]?.label || ''}
                      onChange={e => {
                        const newStats = [...(editingFeature.stats || [])];
                        newStats[0] = { ...(newStats[0] || {}), label: e.target.value, value: newStats[0]?.value || '100%' };
                        setEditingFeature({ ...editingFeature, stats: newStats });
                      }}
                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      placeholder="e.g. Delivery Hubs"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400">Metric 1 Value:</span>
                    <input
                      type="text"
                      value={editingFeature.stats?.[0]?.value || ''}
                      onChange={e => {
                        const newStats = [...(editingFeature.stats || [])];
                        newStats[0] = { ...(newStats[0] || {}), value: e.target.value, label: newStats[0]?.label || 'Metric' };
                        setEditingFeature({ ...editingFeature, stats: newStats });
                      }}
                      className="w-full p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                      placeholder="e.g. 4 GCC Direct"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFeatureModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Bento Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

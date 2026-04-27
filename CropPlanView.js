import React, { useState, useContext } from 'react';
import { AppContext } from '../App';
import { createAsset } from '../lib/supabase';
import { CROPS, STATUS_CONFIG, CROP_PLAN_META } from '../lib/cropPlan';

const ALL_STATUSES = ['active', 'trial', 'viable', 'monitor', 'hard', 'illegal'];
const ALL_CATS = [...new Set(CROPS.map(c => c.cat))].sort();

export default function CropPlanView() {
  const { farmId } = useContext(AppContext);
  const [statusFilter, setStatusFilter] = useState(['active', 'trial', 'viable']);
  const [catFilter, setCatFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [addedIds, setAddedIds] = useState(new Set());
  const [toast, setToast] = useState(null);

  const filtered = CROPS.filter(c => {
    if (statusFilter.length && !statusFilter.includes(c.status)) return false;
    if (catFilter && c.cat !== catFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return c.name.toLowerCase().includes(q) ||
             c.cat.toLowerCase().includes(q) ||
             (c.zone || '').toLowerCase().includes(q) ||
             (c.tags || []).some(t => t.toLowerCase().includes(q));
    }
    return true;
  });

  const toggleStatus = (s) => {
    setStatusFilter(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleAddToAssets = async (crop) => {
    if (!farmId) return;
    setAddingId(crop.id);
    try {
      // Determine asset type
      const typeMap = {
        'Poultry': 'animal', 'Bees': 'hive', 'Aquaculture': 'animal',
        'Tree fruit': 'plant', 'Tree nut': 'plant', 'Tree crop': 'plant',
        'Native citrus': 'plant', 'Native fruit': 'plant', 'Native herb': 'plant',
        'Native spice': 'plant', 'Orchid vine': 'plant', 'Edible flower': 'plant',
        'Annual herb': 'plant', 'Perennial herb': 'plant', 'Rhizome': 'plant',
        'Field crop': 'paddock', 'Vine': 'plant', 'Berry': 'plant',
        'Annual bulb': 'plant', 'Annual veg': 'plant', 'Bromeliad': 'plant',
        'By-product': 'other', 'Fungi': 'other', 'Grass': 'plant',
        'Succulent': 'plant',
      };
      const assetType = typeMap[crop.cat] || 'plant';
      const identifier = crop.qty ? `${crop.qty} ${crop.qtyUnit || ''}`.trim() : '';

      await createAsset({
        farm_id: farmId,
        name: crop.name,
        type: assetType,
        species: crop.cat,
        identifier,
        notes: [
          crop.zone ? `Zone: ${crop.zone}` : '',
          crop.revenue ? `Revenue: ${crop.revenue}` : '',
          crop.timeToIncome ? `Time to income: ${crop.timeToIncome}` : '',
          crop.note || '',
          (crop.tags || []).join(', '),
        ].filter(Boolean).join(' · '),
        active: true,
      });

      setAddedIds(prev => new Set([...prev, crop.id]));
      showToast(`✓ ${crop.name} added to Assets`);
    } catch (e) {
      showToast(`Failed: ${e.message}`, true);
    }
    setAddingId(null);
  };

  const showToast = (msg, error = false) => {
    setToast({ msg, error });
    setTimeout(() => setToast(null), 3000);
  };

  const statCounts = ALL_STATUSES.reduce((acc, s) => {
    acc[s] = CROPS.filter(c => c.status === s).length;
    return acc;
  }, {});

  return (
    <div className="cropplan-view">
      {/* Header */}
      <div className="cropplan-header">
        <div>
          <h1 className="view-title">Crop Plan</h1>
          <div className="cropplan-meta">
            {CROP_PLAN_META.property} · Trial start {CROP_PLAN_META.trialStart} · Y3+ revenue {CROP_PLAN_META.y3Revenue}
          </div>
        </div>
        <div className="cropplan-summary-chips">
          <span className="summary-chip active">{statCounts.active} active</span>
          <span className="summary-chip trial">{statCounts.trial} trial</span>
          <span className="summary-chip viable">{statCounts.viable} viable</span>
          <span className="summary-chip monitor">{statCounts.monitor} watch</span>
        </div>
      </div>

      {/* Filters */}
      <div className="cropplan-filters">
        <div className="filter-status-row">
          {ALL_STATUSES.map(s => {
            const cfg = STATUS_CONFIG[s];
            const active = statusFilter.includes(s);
            return (
              <button
                key={s}
                className={`status-filter-btn ${active ? 'active' : ''}`}
                style={active ? { background: cfg.bg, color: cfg.color, borderColor: cfg.color } : {}}
                onClick={() => toggleStatus(s)}
              >
                {cfg.label} <span className="filter-count">{statCounts[s]}</span>
              </button>
            );
          })}
        </div>
        <div className="filter-row-2">
          <input
            className="filter-input"
            placeholder="Search crops, zones, tags…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select className="form-select cat-select" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="">All categories</option>
            {ALL_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="filter-result-count">{filtered.length} crops</span>
        </div>
      </div>

      {/* Crop grid */}
      <div className="crop-grid">
        {filtered.map(crop => {
          const cfg = STATUS_CONFIG[crop.status];
          const isSelected = selected?.id === crop.id;
          const isAdded = addedIds.has(crop.id);
          const canAdd = crop.status !== 'illegal' && crop.status !== 'hard';

          return (
            <div
              key={crop.id}
              className={`crop-card ${isSelected ? 'selected' : ''} status-${crop.status}`}
              onClick={() => setSelected(isSelected ? null : crop)}
            >
              <div className="crop-card-top">
                <span className="crop-icon">{crop.icon}</span>
                <span
                  className="crop-status-badge"
                  style={{ background: cfg.bg, color: cfg.color }}
                >
                  {cfg.label}
                </span>
              </div>
              <div className="crop-name">{crop.name}</div>
              <div className="crop-cat">{crop.cat}</div>
              <div className="crop-revenue">{crop.revenue !== 'N/A' ? crop.revenue : '—'}</div>

              {crop.zone && crop.status !== 'illegal' && (
                <div className="crop-zone">📍 {crop.zone}</div>
              )}

              {isSelected && (
                <div className="crop-detail" onClick={e => e.stopPropagation()}>
                  {crop.timeToIncome && crop.timeToIncome !== 'N/A' && (
                    <div className="crop-detail-row">
                      <span className="detail-label">Time to income</span>
                      <span>{crop.timeToIncome}</span>
                    </div>
                  )}
                  {crop.setup && crop.setup !== 'N/A' && (
                    <div className="crop-detail-row">
                      <span className="detail-label">Setup cost</span>
                      <span>{crop.setup}</span>
                    </div>
                  )}
                  {crop.qty && (
                    <div className="crop-detail-row">
                      <span className="detail-label">Planned quantity</span>
                      <span>{crop.qty} {crop.qtyUnit}</span>
                    </div>
                  )}
                  {crop.weatherSensitive && (
                    <div className="crop-detail-row">
                      <span className="detail-label">Weather</span>
                      <span>🌧 Sensitive — {crop.weatherCondition?.replace('_', ' ')}</span>
                    </div>
                  )}
                  {crop.note && (
                    <div className="crop-note">💡 {crop.note}</div>
                  )}
                  {(crop.tags || []).length > 0 && (
                    <div className="crop-tags">
                      {crop.tags.map(t => <span key={t} className="crop-tag">{t}</span>)}
                    </div>
                  )}
                  {canAdd && (
                    <button
                      className={`crop-add-btn ${isAdded ? 'added' : ''}`}
                      onClick={() => !isAdded && handleAddToAssets(crop)}
                      disabled={addingId === crop.id || isAdded}
                    >
                      {addingId === crop.id ? 'Adding…' : isAdded ? '✓ Added to Assets' : '+ Add to Assets'}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Toast */}
      {toast && (
        <div className={`crop-toast ${toast.error ? 'error' : ''}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}

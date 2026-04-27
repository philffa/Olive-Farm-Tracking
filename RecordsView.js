import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from '../App';
import { getRecords, createRecord, deleteRecord, getAssets } from '../lib/supabase';

// ─── Section groups (matching all templates in farm_records_v4) ────────────
const SECTION_GROUPS = [
  {
    group: 'Core enterprises',
    sections: [
      { id: 'olive_grove',  label: 'Olive grove',        icon: '🫒' },
      { id: 'eggs',         label: 'Eggs',               icon: '🥚' },
      { id: 'honey',        label: 'Honey / bees',       icon: '🍯' },
      { id: 'hemp',         label: 'Hemp',               icon: '🌿' },
      { id: 'aquaponics',   label: 'Aquaponics',         icon: '🐟' },
    ]
  },
  {
    group: 'Livestock & animals',
    sections: [
      { id: 'waterfowl',    label: 'Waterfowl / geese',  icon: '🪶' },
      { id: 'goats',        label: 'Goats',              icon: '🐐' },
      { id: 'bsfl',         label: 'BSFL',               icon: '🪲' },
      { id: 'health',       label: 'Animal health',      icon: '🩺' },
      { id: 'livestock_movement', label: 'Livestock movement', icon: '🏷️' },
    ]
  },
  {
    group: 'Plants & crops',
    sections: [
      { id: 'high_value',   label: 'High-value crops',   icon: '🌸' },
      { id: 'rhizomes',     label: 'Rhizomes',           icon: '🫛' },
      { id: 'fruit_trees',  label: 'Fruit trees',        icon: '🌳' },
      { id: 'macadamia',    label: 'Macadamia / grafting', icon: '🌰' },
      { id: 'vege_garden',  label: 'Vege garden',        icon: '🥦' },
      { id: 'propagation',  label: 'Propagation',        icon: '🌱' },
    ]
  },
  {
    group: 'Property',
    sections: [
      { id: 'pasture',      label: 'Pasture',            icon: '🌿' },
      { id: 'water',        label: 'Water & irrigation', icon: '💧' },
      { id: 'chemical',     label: 'Chemical register',  icon: '⚗️' },
      { id: 'machinery',    label: 'Machinery',          icon: '🚜' },
      { id: 'infra',        label: 'Infrastructure',     icon: '🔧' },
    ]
  },
  {
    group: 'Sales & finance',
    sections: [
      { id: 'sales_market', label: 'Market / stall',     icon: '🛒' },
      { id: 'sales_resto',  label: 'Restaurant / wholesale', icon: '🍽️' },
    ]
  },
];

// Flat list for lookup
const SECTIONS = SECTION_GROUPS.flatMap(g => g.sections);

export default function RecordsView() {
  const { farmId } = useContext(AppContext);
  const [activeSection, setActiveSection] = useState('geese');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (farmId) loadRecords();
  }, [farmId, activeSection]);

  const loadRecords = async () => {
    setLoading(true);
    const data = await getRecords(farmId, activeSection).catch(() => []);
    setRecords(data || []);
    setLoading(false);
  };

  const section = SECTIONS.find(s => s.id === activeSection);
  const filtered = records.filter(r =>
    !filter || JSON.stringify(r.data).toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="records-view">
      <div className="records-sidebar">
        {SECTION_GROUPS.map(group => (
          <div key={group.group} className="sidebar-group">
            <div className="sidebar-group-label">{group.group}</div>
            {group.sections.map(s => (
              <button
                key={s.id}
                className={`sidebar-btn ${activeSection === s.id ? 'active' : ''}`}
                onClick={() => { setActiveSection(s.id); setFilter(''); }}
              >
                <span className="sidebar-icon">{s.icon}</span>
                <span>{s.label}</span>
              </button>
            ))}
          </div>
        ))}
      </div>

      <div className="records-main">
        <div className="records-header">
          <h2 className="view-title">{section?.icon} {section?.label}</h2>
          <div className="records-controls">
            <input
              className="filter-input"
              placeholder={`Search ${section?.label}…`}
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            <button className="add-task-btn" onClick={() => alert('Full record form coming in Phase 2 — all templates from your existing app will be here.')}>
              + Add entry
            </button>
          </div>
        </div>

        {loading ? (
          <div className="empty-state">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{section?.icon}</div>
            <div>No {section?.label.toLowerCase()} records yet</div>
            <div className="empty-sub">
              Use the templates from your farm records app (v4) to add entries here.
              Full template forms are coming in Phase 2 — templates include:
              olive tree register, harvest log, spray diary, aquaponics water quality,
              BSFL batch log, hemp crop log, macadamia grafting log, rhizome crop log, waterfowl log, and more.
            </div>
          </div>
        ) : (
          <div className="records-list">
            {filtered.map(r => (
              <RecordCard key={r.id} record={r} section={section} onDelete={() => {
                deleteRecord(r.id).then(loadRecords);
              }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RecordCard({ record, section, onDelete }) {
  const data = record.data || {};
  const title = data.name || data.date || data.type || 'Record';
  const keys = Object.keys(data).filter(k => k !== 'notes' && data[k]).slice(0, 4);

  return (
    <div className="record-card">
      <div className="record-main">
        <div className="record-title">{title}</div>
        <div className="record-detail">
          {keys.map(k => (
            <span key={k} className="record-field">
              <span className="field-key">{k}:</span> {String(data[k]).slice(0, 60)}
            </span>
          ))}
        </div>
        {data.notes && <div className="record-notes">{data.notes}</div>}
      </div>
      <div className="record-actions">
        <button className="icon-btn" onClick={() => alert('Edit coming in Phase 2')}>Edit</button>
        <button className="icon-btn delete" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

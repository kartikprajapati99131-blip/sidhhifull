'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

function inr(n) {
  if (!n && n !== 0) return '—';
  return Math.round(n).toLocaleString('en-IN');
}

function calcDomal({ trackType, material, width: W, height: H, rateKg, glassRate, labourRate, otherRate, rLock, rBearing, rClot, rRubber }) {
  if (!W || !H || W <= 0 || H <= 0) return null;
  const sqFt = (W * H) / 144;
  let rows = [], trackCost = 0, shutterCost = 0, interlockCost = 0;

  if (trackType === 2) {
    const tPipes = Math.ceil((4 * W / 180) * 1.15);
    const tRunFt = tPipes * 15;
    const tWt = material === 'regular' ? 3.6 : 4.59;
    trackCost = (tRunFt * tWt / 15) * rateKg;
    rows.push({ section: 'Track' });
    rows.push({ name: `Track pipe (${tWt} kg ${material === 'regular' ? 'Regular' : 'Jindal'})`, qty: tRunFt.toFixed(1), unit: 'ft', rate: rateKg, cost: trackCost });

    const sPipes = Math.ceil((6 * W / 2 / 180) * 1.1);
    const sRunFt = sPipes * 15;
    const sWt = material === 'regular' ? 3.4 : 3.89;
    shutterCost = (sRunFt * sWt / 15) * rateKg * 2;
    rows.push({ section: 'Shutter' });
    rows.push({ name: `Shutter pipe (${sWt} kg ${material === 'regular' ? 'Regular' : 'Jindal'}) × 2`, qty: (sRunFt * 2).toFixed(1), unit: 'ft', rate: rateKg, cost: shutterCost });

    const iPipes = Math.ceil((2 * H / 180) * 1.1);
    const iRunFt = iPipes * 10;
    interlockCost = (iRunFt * 1.35 / 10) * rateKg;
    rows.push({ section: 'Interlock' });
    rows.push({ name: 'Interlock pipe (1.35 kg Regular)', qty: iRunFt.toFixed(1), unit: 'ft', rate: rateKg, cost: interlockCost });

    rows.push({ section: 'Accessories' });
    [{ name: 'Lock', qty: 2, rate: rLock }, { name: 'Bearing', qty: 4, rate: rBearing }, { name: 'Clot', qty: 8, rate: rClot },
     { name: 'L Corner', qty: 16, rate: 1 }, { name: 'M/F', qty: 4, rate: 5 }, { name: 'Long Patti', qty: 4, rate: 5 },
     { name: 'Lock Guide', qty: 4, rate: 5 }, { name: 'Glass', qty: +sqFt.toFixed(2), rate: glassRate, unit: 'sq.ft' },
     { name: 'Rubber', qty: 2, rate: rRubber }, { name: 'Labour', qty: +sqFt.toFixed(2), rate: labourRate, unit: 'sq.ft' },
     { name: 'Other charges', qty: 1, rate: otherRate }]
      .forEach(a => rows.push({ ...a, cost: a.qty * a.rate }));
  } else {
    const tPipes = Math.ceil(((W + H) * 2 + 2 * W) / 180 * 1.4);
    const tRunFt = tPipes * 16.5;
    const tWt = material === 'regular' ? 5.4 : 7.11;
    trackCost = (tRunFt * tWt / 16.5) * rateKg;
    rows.push({ section: 'Track' });
    rows.push({ name: `Track pipe (${tWt} kg ${material === 'regular' ? 'Regular' : 'Jindal'})`, qty: tRunFt.toFixed(1), unit: 'ft', rate: rateKg, cost: trackCost });

    const sPipes = Math.ceil((8 * W / 3 / 180) * 1.4);
    const sRunFt = sPipes * 15;
    const sWt = material === 'regular' ? 3.4 : 3.89;
    shutterCost = (sRunFt * sWt / 15) * rateKg * 3;
    rows.push({ section: 'Shutter' });
    rows.push({ name: `Shutter pipe (${sWt} kg ${material === 'regular' ? 'Regular' : 'Jindal'}) × 3`, qty: (sRunFt * 3).toFixed(1), unit: 'ft', rate: rateKg, cost: shutterCost });

    const iPipes = Math.ceil((2 * H / 180) * 1.4);
    const iRunFt = iPipes * 15;
    interlockCost = (iRunFt * 1.35 / 15) * rateKg;
    rows.push({ section: 'Interlock' });
    rows.push({ name: 'Interlock pipe (1.35 kg Regular)', qty: iRunFt.toFixed(1), unit: 'ft', rate: rateKg, cost: interlockCost });

    rows.push({ section: 'Accessories' });
    [{ name: 'Lock', qty: 3, rate: rLock }, { name: 'Bearing', qty: 6, rate: rBearing }, { name: 'Clot', qty: 12, rate: rClot },
     { name: 'L Corner', qty: 24, rate: 1 }, { name: 'M/F', qty: 6, rate: 5 }, { name: 'Long Patti', qty: 6, rate: 5 },
     { name: 'Lock Guide', qty: 6, rate: 5 }, { name: 'Glass', qty: +sqFt.toFixed(2), rate: glassRate, unit: 'sq.ft' },
     { name: 'Rubber', qty: +(sqFt * 0.1).toFixed(2), rate: rRubber, unit: 'sq.ft' },
     { name: 'Labour', qty: +sqFt.toFixed(2), rate: labourRate, unit: 'sq.ft' },
     { name: 'Other charges', qty: 1, rate: otherRate },
     { name: 'M Net', qty: +(sqFt * 0.5).toFixed(2), rate: 35, unit: 'sq.ft' },
     { name: 'C Channel', qty: 12, rate: 21 }]
      .forEach(a => rows.push({ ...a, cost: a.qty * a.rate }));
  }

  const accessoryCost = rows.filter(r => r.cost && !r.section && !r.name?.includes('pipe')).reduce((s, r) => s + r.cost, 0);
  const grandTotal = trackCost + shutterCost + interlockCost + accessoryCost;
  return { rows, trackCost, shutterCost, interlockCost, accessoryCost, grandTotal, sqFt };
}

const HARD_DEFAULTS = {
  trackType: 2, material: 'regular',
  width: 60, height: 60,
  rateKg: 315, glassRate: 72, labourRate: 50, otherRate: 200,
  rLock: 135, rBearing: 50, rClot: 18, rRubber: 75,
};

export default function CalculatorPage() {
  const router = useRouter();
  const [cfg, setCfg] = useState(HARD_DEFAULTS);
  const [pricesLoaded, setPricesLoaded] = useState(false);
  const [client, setClient] = useState({ clientName: '', clientPhone: '', clientAddress: '', notes: '' });
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  // Mobile: which tab is active — 'config' or 'result'
  const [activeTab, setActiveTab] = useState('config');
  // Mobile: is the client/save drawer open
  const [drawerOpen, setDrawerOpen] = useState(false);

  const set = (k, v) => setCfg(p => ({ ...p, [k]: v }));
  const num = (k) => (e) => set(k, parseFloat(e.target.value) || 0);

  // Load saved prices from server on first mount
  useEffect(() => {
    fetch('/api/prices')
      .then(r => r.json())
      .then(prices => {
        setCfg(prev => ({
          ...prev,
          rateKg:     prices.rateKg     ?? prev.rateKg,
          glassRate:  prices.glassRate  ?? prev.glassRate,
          labourRate: prices.labourRate ?? prev.labourRate,
          otherRate:  prices.otherRate  ?? prev.otherRate,
          rLock:      prices.rLock      ?? prev.rLock,
          rBearing:   prices.rBearing   ?? prev.rBearing,
          rClot:      prices.rClot      ?? prev.rClot,
          rRubber:    prices.rRubber    ?? prev.rRubber,
        }));
        setPricesLoaded(true);
      })
      .catch(() => setPricesLoaded(true)); // fail silently, use hard defaults
  }, []);

  useEffect(() => {
    setResult(calcDomal(cfg));
  }, [cfg]);

  const handleSave = async () => {
    if (!client.clientName.trim()) { setSaveError('Client name is required'); return; }
    if (!client.clientPhone.trim()) { setSaveError('Phone number is required'); return; }
    setSaveError('');
    setSaving(true);
    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cfg, ...client }),
      });
      if (!res.ok) throw new Error('Save failed');
      const doc = await res.json();
      router.push(`/quotations/${doc._id}`);
    } catch {
      setSaveError('Could not save. Check connection.');
      setSaving(false);
    }
  };

  const matLabel = (t, m) => {
    const weights = { 2: { regular: '3.6 kg', jindal: '4.59 kg' }, 3: { regular: '5.4 kg', jindal: '7.11 kg' } };
    return `${weights[t][m]} ${m === 'regular' ? 'Regular' : 'Jindal'}`;
  };

  // ── Shared config panel content (used in both sidebar and mobile tab) ──
  const ConfigPanel = () => (
    <div style={{ padding: '1.25rem' }}>
      <SectionLabel>Track Type</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', border: '1px solid #E5E3DC', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
        {[2, 3].map(t => (
          <button key={t} onClick={() => set('trackType', t)}
            style={{ padding: '11px 0', background: cfg.trackType === t ? '#1B4F8A' : '#fff', color: cfg.trackType === t ? '#fff' : '#888', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', borderRight: t === 2 ? '1px solid #E5E3DC' : 'none', transition: 'all .15s' }}>
            {t} Track
          </button>
        ))}
      </div>

      <SectionLabel>Dimensions (inches)</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
        <Field label="Width"><NumInput value={cfg.width} onChange={num('width')} /></Field>
        <Field label="Height"><NumInput value={cfg.height} onChange={num('height')} /></Field>
      </div>

      <Divider />

      <SectionLabel>Pipe Weight</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
        {['regular', 'jindal'].map(m => (
          <button key={m} onClick={() => set('material', m)}
            style={{ padding: '10px 6px', border: `1px solid ${cfg.material === m ? '#0F6E56' : '#E5E3DC'}`, borderRadius: 8, background: cfg.material === m ? '#E1F5EE' : '#fff', color: cfg.material === m ? '#085041' : '#888', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all .15s', textAlign: 'center' }}>
            {matLabel(cfg.trackType, m)}
          </button>
        ))}
      </div>

      <Divider />

      <SectionLabel>Rates</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <Field label="Rate / kg (₹)"><NumInput value={cfg.rateKg} onChange={num('rateKg')} /></Field>
        <Field label="Glass (₹/sq.ft)"><NumInput value={cfg.glassRate} onChange={num('glassRate')} /></Field>
        <Field label="Labour (₹/sq.ft)"><NumInput value={cfg.labourRate} onChange={num('labourRate')} /></Field>
        <Field label="Other (₹)"><NumInput value={cfg.otherRate} onChange={num('otherRate')} /></Field>
      </div>

      <Divider />

      <SectionLabel>Accessory Rates (₹)</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 4 }}>
        <Field label="Lock"><NumInput value={cfg.rLock} onChange={num('rLock')} /></Field>
        <Field label="Bearing"><NumInput value={cfg.rBearing} onChange={num('rBearing')} /></Field>
        <Field label="Clot"><NumInput value={cfg.rClot} onChange={num('rClot')} /></Field>
        <Field label="Rubber"><NumInput value={cfg.rRubber} onChange={num('rRubber')} /></Field>
      </div>
    </div>
  );

  // ── Result panel content ──
  const ResultPanel = () => (
    <div style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A18', letterSpacing: '-0.02em', margin: 0 }}>Cost Estimate</h2>
        {result && (
          <span style={{ background: '#FEF3C7', color: '#92400E', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
            {result.sqFt.toFixed(2)} sq.ft
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Track',      val: result?.trackCost },
          { label: 'Shutter',    val: result?.shutterCost },
          { label: 'Interlock',  val: result?.interlockCost },
          { label: 'Grand Total', val: result?.grandTotal, highlight: true },
        ].map(c => (
          <div key={c.label} style={{ background: c.highlight ? '#1B4F8A' : '#fff', border: `1px solid ${c.highlight ? '#1B4F8A' : '#E5E3DC'}`, borderRadius: 10, padding: '12px 14px', boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
            <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: c.highlight ? 'rgba(255,255,255,.65)' : '#aaa', fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: c.highlight ? '#fff' : '#1A1A18', letterSpacing: '-0.02em' }}>₹{inr(c.val)}</div>
          </div>
        ))}
      </div>

      {result && (
        <div style={{ background: '#fff', border: '1px solid #E5E3DC', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
          <div style={{ padding: '9px 14px', borderBottom: '1px solid #E5E3DC', background: '#F6F5F1', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Full Breakdown
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 300 }}>
              <thead>
                <tr style={{ background: '#F6F5F1' }}>
                  <th style={thStyle('left')}>Item</th>
                  <th style={thStyle('right')}>Qty</th>
                  <th style={{ ...thStyle('right'), display: 'none' }} className="hide-mobile">Unit</th>
                  <th style={{ ...thStyle('right'), display: 'none' }} className="hide-mobile">Rate</th>
                  <th style={thStyle('right')}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((r, i) => r.section ? (
                  <tr key={i}>
                    <td colSpan={5} style={{ padding: '6px 12px', background: '#F0EFE9', fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.07em' }}>{r.section}</td>
                  </tr>
                ) : (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAF8' }}>
                    <td style={tdStyle('#444')}>{r.name}</td>
                    <td style={{ ...tdStyle('#888'), textAlign: 'right' }}>{r.qty}</td>
                    <td style={{ ...tdStyle('#bbb'), textAlign: 'right', display: 'none' }} className="hide-mobile">{r.unit || 'pcs'}</td>
                    <td style={{ ...tdStyle('#888'), textAlign: 'right', display: 'none' }} className="hide-mobile">₹{inr(r.rate)}</td>
                    <td style={{ ...tdStyle('#1A1A18'), textAlign: 'right', fontWeight: 600 }}>₹{inr(r.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: '#1A1A18', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, fontWeight: 500 }}>Grand Total</span>
            <span style={{ color: '#fff', fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' }}>₹ {inr(result?.grandTotal)}</span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F6F5F1', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        /* ── Responsive breakpoints ── */

        /* Desktop sidebar layout */
        .calc-layout { display: grid; grid-template-columns: 340px 1fr; min-height: calc(100vh - 58px); }
        .calc-sidebar { display: block; }
        .calc-mobile-tabs { display: none; }
        .calc-mobile-bottom { display: none; }
        .calc-desktop-sidebar-scroll { overflow-y: auto; height: calc(100vh - 58px); position: sticky; top: 58px; }
        .calc-main { padding: 1.5rem; overflow-y: auto; }
        .calc-result-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 18px; }
        .hide-xs { display: table-cell !important; }

        /* iPad (≤ 900px): single column, tabs */
        @media (max-width: 900px) {
          .calc-layout { display: block; }
          .calc-sidebar { display: none; }
          .calc-mobile-tabs { display: flex; }
          .calc-main { padding: 0; }
          .calc-result-grid { grid-template-columns: repeat(2, 1fr); }
          .calc-mobile-bottom { display: block; }
          .calc-header-sub { display: none; }
        }

        /* Mobile (≤ 480px): tighter padding */
        @media (max-width: 480px) {
          .calc-header-logo-text { display: none; }
          .calc-result-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
        }

        /* Drawer overlay */
        .drawer-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,.45);
          z-index: 100; display: flex; align-items: flex-end;
          animation: fadeIn .2s ease;
        }
        .drawer-sheet {
          background: #fff; width: 100%; max-height: 85vh;
          border-radius: 20px 20px 0 0; overflow-y: auto;
          animation: slideUp .25s ease;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(60px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>

      {/* ── Header ── */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E5E3DC', padding: '0 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: '#1B4F8A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="21"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A18', letterSpacing: '-0.01em' }}>Domal Calculator</div>
            <div className="calc-header-sub" style={{ fontSize: 11, color: '#999', marginTop: 1 }}>Window quotation system</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => router.push('/prices')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: '#E1F5EE', border: '1px solid #A8DFCE', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#085041' }}
            title="Manage default prices">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
            <span className="calc-header-sub">Prices</span>
          </button>
          <button onClick={() => router.push('/quotations')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: '#F6F5F1', border: '1px solid #E5E3DC', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer', color: '#444' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <span>Quotations</span>
          </button>
        </div>
      </header>

      {/* ── Desktop layout: sidebar + main ── */}
      <div className="calc-layout">

        {/* Sidebar (desktop only) */}
        <aside className="calc-sidebar" style={{ background: '#fff', borderRight: '1px solid #E5E3DC' }}>
          <div className="calc-desktop-sidebar-scroll">
            <ConfigPanel />
            <div style={{ padding: '0 1.25rem 1.25rem' }}>
              <Divider />
              <ClientForm client={client} setClient={setClient} saveError={saveError} />
              {saveError && <p style={{ fontSize: 12, color: '#C0392B', margin: '6px 0' }}>{saveError}</p>}
              <SaveButton saving={saving} onClick={handleSave} />
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="calc-main">

          {/* Mobile tabs (iPad / phone) */}
          <div className="calc-mobile-tabs" style={{ background: '#fff', borderBottom: '1px solid #E5E3DC', padding: '0 1.25rem', gap: 0 }}>
            {['config', 'result'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                style={{ flex: 1, padding: '14px 0', background: 'none', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', color: activeTab === tab ? '#1B4F8A' : '#999', borderBottom: `2px solid ${activeTab === tab ? '#1B4F8A' : 'transparent'}`, transition: 'all .15s' }}>
                {tab === 'config' ? '⚙️  Configure' : `📊  Estimate${result ? '  ₹' + inr(result.grandTotal) : ''}`}
              </button>
            ))}
          </div>

          {/* Tab content (mobile/iPad) — hidden on desktop, show only active tab */}
          <div className="calc-mobile-tabs" style={{ display: 'none' }}>
            {/* rendered via tab logic below */}
          </div>

          {/* Desktop: always show result panel in main */}
          <div className="calc-sidebar" style={{ display: 'block' }}>
            <ResultPanel />
          </div>

          {/* Mobile/iPad: show active tab */}
          <div className="calc-mobile-tabs" style={{ display: 'block' }}>
            {activeTab === 'config' ? <ConfigPanel /> : <ResultPanel />}
          </div>

        </main>
      </div>

      {/* ── Mobile bottom bar ── */}
      <div className="calc-mobile-bottom" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #E5E3DC', padding: '10px 16px', display: 'flex', gap: 10, zIndex: 40 }}>
        {activeTab === 'config' && (
          <button onClick={() => setActiveTab('result')}
            style={{ flex: 1, padding: '12px 0', background: '#F0EFE9', color: '#444', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            View Estimate →
          </button>
        )}
        <button onClick={() => setDrawerOpen(true)}
          style={{ flex: activeTab === 'config' ? 1 : 2, padding: '12px 0', background: '#1B4F8A', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg>
          Save Quotation
        </button>
      </div>

      {/* ── Save drawer (mobile) ── */}
      {drawerOpen && (
        <div className="drawer-overlay" onClick={e => { if (e.target === e.currentTarget) setDrawerOpen(false); }}>
          <div className="drawer-sheet">
            <div style={{ padding: '16px 20px 4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A18' }}>Save Quotation</div>
              <button onClick={() => setDrawerOpen(false)} style={{ background: 'none', border: 'none', fontSize: 22, color: '#aaa', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '0 20px 20px' }}>
              <ClientForm client={client} setClient={setClient} saveError={saveError} />
              {saveError && <p style={{ fontSize: 12, color: '#C0392B', margin: '6px 0' }}>{saveError}</p>}
              <div style={{ height: 16 }} />
              <SaveButton saving={saving} onClick={handleSave} />
              {/* extra scroll room for soft keyboard */}
              <div style={{ height: 40 }} />
            </div>
          </div>
        </div>
      )}

      {/* bottom padding on mobile so content clears the fixed bar */}
      <div className="calc-mobile-bottom" style={{ height: 70 }} />
    </div>
  );
}

// ── Client form (shared between sidebar & drawer) ──────────────────────────
function ClientForm({ client, setClient, saveError }) {
  const set = (k, v) => setClient(p => ({ ...p, [k]: v }));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionLabel>Client Details</SectionLabel>
      <Field label="Client Name *">
        <input value={client.clientName} onChange={e => set('clientName', e.target.value)}
          placeholder="e.g. Sharma Residence"
          style={inputStyle(saveError && !client.clientName)} />
      </Field>
      <Field label="Phone Number *">
        <input value={client.clientPhone} onChange={e => set('clientPhone', e.target.value)}
          placeholder="e.g. 98765 43210" type="tel"
          style={inputStyle(saveError && !client.clientPhone)} />
      </Field>
      <Field label="Address">
        <input value={client.clientAddress} onChange={e => set('clientAddress', e.target.value)}
          placeholder="Site / delivery address" style={inputStyle()} />
      </Field>
      <Field label="Notes">
        <input value={client.notes} onChange={e => set('notes', e.target.value)}
          placeholder="e.g. 2nd floor, bedroom window" style={inputStyle()} />
      </Field>
    </div>
  );
}

function SaveButton({ saving, onClick }) {
  return (
    <button onClick={onClick} disabled={saving}
      style={{ width: '100%', padding: '13px 0', background: saving ? '#999' : '#1B4F8A', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, letterSpacing: '-0.01em' }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
      {saving ? 'Saving…' : 'Save Quotation'}
    </button>
  );
}

// ── helpers ──────────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#aaa', marginBottom: 8 }}>{children}</div>;
}
function Divider() {
  return <div style={{ height: 1, background: '#E5E3DC', margin: '16px 0' }} />;
}
function Field({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 11, color: '#aaa', fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}
function NumInput({ value, onChange }) {
  return <input type="number" value={value} onChange={onChange} min="0" style={inputStyle()} />;
}
function thStyle(align) {
  return { padding: '9px 12px', fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: align, borderBottom: '1px solid #E5E3DC' };
}
function tdStyle(color) {
  return { padding: '9px 12px', fontSize: 13, color };
}
function inputStyle(error) {
  return {
    width: '100%', padding: '9px 11px', border: `1px solid ${error ? '#C0392B' : '#E5E3DC'}`,
    borderRadius: 7, fontSize: 14, color: '#1A1A18', background: '#fff',
    outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  };
}
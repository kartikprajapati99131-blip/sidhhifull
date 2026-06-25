'use client';
// app/prices/page.js
// Admin-only. Password gate: username=admin, password=aluminium

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const ADMIN_USER = 'admin';
const ADMIN_PASS = 'aluminium';

const FIELD_GROUPS = [
  {
    label: 'Pipe & Material',
    fields: [
      { key: 'rateKg', label: 'Rate / kg (₹)', hint: 'Applied to track, shutter & interlock pipe weight' },
    ],
  },
  {
    label: 'Per Sq.Ft Rates',
    fields: [
      { key: 'glassRate',  label: 'Glass (₹ / sq.ft)' },
      { key: 'labourRate', label: 'Labour (₹ / sq.ft)' },
    ],
  },
  {
    label: 'Accessory Rates (₹ per piece)',
    fields: [
      { key: 'rLock',    label: 'Lock' },
      { key: 'rBearing', label: 'Bearing' },
      { key: 'rClot',    label: 'Clot' },
      { key: 'rRubber',  label: 'Rubber' },
    ],
  },
  {
    label: 'Other',
    fields: [
      { key: 'otherRate', label: 'Other Charges (₹, flat)' },
    ],
  },
];

// ── Password gate ──────────────────────────────────────────────
function PasswordGate({ onUnlock }) {
  const router = useRouter();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr]   = useState('');

  const attempt = () => {
    if (user.trim() === ADMIN_USER && pass === ADMIN_PASS) {
      onUnlock();
    } else {
      setErr('Incorrect username or password.');
      setPass('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F6F5F1', fontFamily: "'Inter', -apple-system, sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ background: '#fff', border: '1px solid #E5E3DC', borderRadius: 16, padding: '2rem 1.75rem', width: '100%', maxWidth: 360, boxShadow: '0 4px 24px rgba(0,0,0,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, background: '#0F6E56', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A18' }}>Admin Access</div>
            <div style={{ fontSize: 11, color: '#999' }}>Price Settings are restricted</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>Username</label>
            <input
              type="text" value={user} onChange={e => { setUser(e.target.value); setErr(''); }}
              onKeyDown={e => e.key === 'Enter' && attempt()}
              placeholder="admin"
              autoComplete="username"
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${err ? '#C0392B' : '#E5E3DC'}`, borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#888', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.05em' }}>Password</label>
            <input
              type="password" value={pass} onChange={e => { setPass(e.target.value); setErr(''); }}
              onKeyDown={e => e.key === 'Enter' && attempt()}
              placeholder="••••••••"
              autoComplete="current-password"
              style={{ width: '100%', padding: '10px 12px', border: `1px solid ${err ? '#C0392B' : '#E5E3DC'}`, borderRadius: 8, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
            />
          </div>

          {err && <div style={{ fontSize: 12, color: '#C0392B', fontWeight: 500 }}>{err}</div>}

          <button onClick={attempt}
            style={{ width: '100%', padding: '12px 0', background: '#1B4F8A', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer', marginTop: 4 }}>
            Unlock
          </button>
          <button onClick={() => router.back()}
            style={{ width: '100%', padding: '10px 0', background: 'none', color: '#aaa', border: '1px solid #E5E3DC', borderRadius: 9, fontSize: 13, cursor: 'pointer' }}>
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function PricesPage() {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  // Only fetch prices once the user has passed the gate
  useEffect(() => {
    if (!unlocked) return;
    fetch('/api/prices')
      .then(r => r.json())
      .then(d => { setPrices(d); setLoading(false); })
      .catch(() => { setError('Could not load prices.'); setLoading(false); });
  }, [unlocked]);

  const set = (k, v) => {
    setSaved(false);
    setPrices(p => ({ ...p, [k]: parseFloat(v) || 0 }));
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/prices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prices),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Show gate until unlocked
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;

  return (
    <div style={{ minHeight: '100vh', background: '#F6F5F1', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      {/* Header */}
      <header style={{ background: '#fff', borderBottom: '1px solid #E5E3DC', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#888', fontSize: 13 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <div style={{ width: 1, height: 20, background: '#E5E3DC' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 30, height: 30, background: '#0F6E56', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1A1A18' }}>Price Settings</div>
              <div style={{ fontSize: 11, color: '#999' }}>Default rates for new quotations</div>
            </div>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: saved ? '#0F6E56' : '#1B4F8A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: saving ? 'wait' : 'pointer', transition: 'background .3s' }}>
          {saved ? (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg> Saved!</>
          ) : saving ? 'Saving…' : (
            <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg> Save Prices</>
          )}
        </button>
      </header>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '2rem 1.25rem' }}>
        {/* Info banner */}
        <div style={{ background: '#E8F4FD', border: '1px solid #B8D8F0', borderRadius: 10, padding: '12px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B4F8A" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div style={{ fontSize: 13, color: '#1B4F8A', lineHeight: 1.5 }}>
            These prices are used as <strong>defaults</strong> every time you open the New Quotation page. You can still change them per quotation — this just saves you from re-entering them each time.
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#aaa', fontSize: 14 }}>Loading…</div>
        ) : (
          <>
            {FIELD_GROUPS.map(group => (
              <div key={group.label} style={{ background: '#fff', border: '1px solid #E5E3DC', borderRadius: 12, marginBottom: 16, overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', background: '#F6F5F1', borderBottom: '1px solid #E5E3DC', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.07em' }}>
                  {group.label}
                </div>
                <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {group.fields.map(f => (
                    <div key={f.key}>
                      <label style={{ display: 'block', fontSize: 12, color: '#666', fontWeight: 600, marginBottom: 5 }}>
                        {f.label}
                        {f.hint && <span style={{ fontWeight: 400, color: '#aaa', marginLeft: 6 }}>— {f.hint}</span>}
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E5E3DC', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                        <span style={{ padding: '0 12px', color: '#888', fontSize: 15, borderRight: '1px solid #E5E3DC', background: '#F6F5F1', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>₹</span>
                        <input
                          type="number"
                          value={prices?.[f.key] ?? ''}
                          onChange={e => set(f.key, e.target.value)}
                          min="0"
                          style={{ flex: 1, padding: '10px 12px', border: 'none', outline: 'none', fontSize: 15, color: '#1A1A18', fontFamily: 'inherit', fontWeight: 600 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {error && (
              <div style={{ color: '#C0392B', fontSize: 13, marginBottom: 12 }}>{error}</div>
            )}

            <button onClick={handleSave} disabled={saving}
              style={{ width: '100%', padding: '13px 0', background: saved ? '#0F6E56' : '#1B4F8A', color: '#fff', border: 'none', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'background .3s' }}>
              {saved ? '✓ Prices Saved!' : saving ? 'Saving…' : 'Save Prices'}
            </button>

            <p style={{ textAlign: 'center', fontSize: 12, color: '#aaa', marginTop: 14 }}>
              Next time you create a quotation, these rates will pre-fill automatically.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

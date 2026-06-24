'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

function inr(n) { return n ? Math.round(n).toLocaleString('en-IN') : '—'; }
function fmtDate(d) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }

const ALLOWED_ROLES = ['admin', 'aluminium'];

export default function QuotationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // ── Auth guard ──────────────────────────────────────────────────────────────
  // Still loading session — show nothing yet
  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#aaa', flexDirection: 'column', gap: 12 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
        Loading…
      </div>
    );
  }

  // Not logged in → redirect to sign in
  if (status === 'unauthenticated') {
    router.replace('/api/auth/signin');
    return null;
  }

  // Logged in but wrong role → show access denied
  const role = session?.user?.role;
  if (!ALLOWED_ROLES.includes(role)) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: "'Inter', -apple-system, sans-serif", flexDirection: 'column', gap: 16, background: '#F6F5F1' }}>
        <div style={{ width: 56, height: 56, background: '#FEE2E2', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: '#1A1A18', marginBottom: 6 }}>Access Denied</div>
          <div style={{ fontSize: 13, color: '#888' }}>You don't have permission to view this page.</div>
          {role && <div style={{ fontSize: 12, color: '#bbb', marginTop: 4 }}>Your role: <strong>{role}</strong></div>}
        </div>
        <button onClick={() => router.replace('/')}
          style={{ padding: '9px 20px', background: '#1B4F8A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginTop: 4 }}>
          Go Home
        </button>
      </div>
    );
  }
  // ── End auth guard ──────────────────────────────────────────────────────────

  return <QuotationsContent router={router} />;
}

// Separated so hooks aren't called conditionally above
function QuotationsContent({ router }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/quotations')
      .then(r => r.json())
      .then(d => { setList(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = list.filter(q =>
    q.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    q.clientPhone?.includes(search) ||
    q.quotationNumber?.includes(search)
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F6F5F1', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @media (max-width: 640px) {
          .ql-table-head { display: none !important; }
          .ql-row { grid-template-columns: 1fr auto !important; padding: 12px 14px !important; gap: 6px !important; }
          .ql-col-phone { display: none !important; }
          .ql-col-size  { display: none !important; }
          .ql-col-track { display: none !important; }
          .ql-col-total { text-align: right !important; }
          .ql-col-arrow { display: none !important; }
          .ql-col-qnum  { font-size: 11px !important; }
          .ql-header { padding: 0 1rem !important; }
          .ql-content { padding: 1rem !important; }
        }
      `}</style>

      {/* Header */}
      <header className="ql-header" style={{ background: '#fff', borderBottom: '1px solid #E5E3DC', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, background: '#1B4F8A', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="21"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#1A1A18', letterSpacing: '-0.01em' }}>All Quotations</div>
            <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>{list.length} saved</div>
          </div>
        </div>
        <button onClick={() => router.push('/quotations/new')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#1B4F8A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New
        </button>
      </header>

      <div className="ql-content" style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Search */}
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, phone or quotation no…"
            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid #E5E3DC', borderRadius: 9, fontSize: 14, background: '#fff', outline: 'none', fontFamily: 'inherit', color: '#1A1A18', boxSizing: 'border-box' }} />
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#aaa' }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#aaa' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ddd" strokeWidth="1.5" style={{ marginBottom: 12 }}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            <div style={{ fontSize: 14 }}>No quotations found</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: '#E5E3DC', borderRadius: 12, overflow: 'hidden', border: '1px solid #E5E3DC' }}>
            {/* Table head */}
            <div className="ql-table-head" style={{ display: 'grid', gridTemplateColumns: '130px 1fr 120px 90px 90px 110px 44px', background: '#F0EFE9', padding: '9px 18px', gap: 12 }}>
              {['Quot. No.', 'Client', 'Phone', 'Size', 'Track', 'Total', ''].map((h, i) => (
                <div key={i} style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#aaa', textAlign: i >= 3 ? 'center' : 'left' }}>{h}</div>
              ))}
            </div>

            {filtered.map((q) => (
              <div key={q._id}
                className="ql-row"
                onClick={() => router.push(`/quotations/${q._id}`)}
                style={{ display: 'grid', gridTemplateColumns: '130px 1fr 120px 90px 90px 110px 44px', background: '#fff', padding: '13px 18px', gap: 12, cursor: 'pointer', alignItems: 'center', transition: 'background .1s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
                onMouseLeave={e => e.currentTarget.style.background = '#fff'}>

                <div className="ql-col-qnum" style={{ fontSize: 12, fontWeight: 700, color: '#1B4F8A', fontFamily: 'monospace' }}>{q.quotationNumber}</div>

                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1A1A18' }}>{q.clientName}</div>
                  {q.clientAddress && <div style={{ fontSize: 11, color: '#aaa', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.clientAddress}</div>}
                  {/* Phone shown inline on mobile since phone col is hidden */}
                  <div className="ql-mobile-phone" style={{ fontSize: 11, color: '#888', marginTop: 2, display: 'none' }}>{q.clientPhone}</div>
                </div>

                <div className="ql-col-phone" style={{ fontSize: 13, color: '#555' }}>{q.clientPhone}</div>

                <div className="ql-col-size" style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>{q.width}" × {q.height}"</div>

                <div className="ql-col-track" style={{ textAlign: 'center' }}>
                  <span style={{ background: q.trackType === 3 ? '#EEF2FF' : '#E1F5EE', color: q.trackType === 3 ? '#3730A3' : '#085041', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                    {q.trackType}T {q.material === 'jindal' ? 'J' : 'R'}
                  </span>
                </div>

                <div className="ql-col-total" style={{ fontSize: 15, fontWeight: 700, color: '#1A1A18', textAlign: 'center' }}>₹{inr(q.grandTotal)}</div>

                <div className="ql-col-arrow" style={{ textAlign: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}   
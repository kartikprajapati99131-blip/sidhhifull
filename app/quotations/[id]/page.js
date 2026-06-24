'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

function inr(n) { return n || n === 0 ? Math.round(n).toLocaleString('en-IN') : '—'; }
function fmtDate(d) { return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }

export default function QuotationDetail() {
  const router = useRouter();
  const { id } = useParams();
  const [q, setQ] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    fetch(`/api/quotations/${id}`)
      .then(r => {
        if (!r.ok) throw new Error(`Server returned ${r.status}`);
        return r.json();
      })
      .then(d => {
        if (d?.error) throw new Error(d.error);
        setQ(d);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this quotation?')) return;
    setDeleting(true);
    try {
      await fetch(`/api/quotations/${id}`, { method: 'DELETE' });
      router.push('/quotations');
    } catch {
      setDeleting(false);
    }
  };

  const handlePDF = () => {
    if (!q) return;
    if (window.jspdf) { generatePDF(q); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    script.onload = () => generatePDF(q);
    document.head.appendChild(script);
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', color: '#aaa', flexDirection: 'column', gap: 12 }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      Loading…
    </div>
  );

  if (error || !q?._id) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', flexDirection: 'column', gap: 12, padding: '0 20px', textAlign: 'center' }}>
      <div style={{ color: '#C0392B', fontWeight: 600 }}>{error || 'Quotation not found.'}</div>
      <button onClick={() => router.push('/quotations')}
        style={{ padding: '8px 18px', background: '#1B4F8A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
        Back to Quotations
      </button>
    </div>
  );

  const rows = q.breakdown || [];

  return (
    <div style={{ minHeight: '100vh', background: '#F6F5F1', fontFamily: "'Inter', -apple-system, sans-serif" }}>
      <style>{`
        @media (max-width: 600px) {
          .qd-grid4 { grid-template-columns: repeat(2, 1fr) !important; }
          .qd-client-grid { grid-template-columns: 1fr !important; }
          .qd-header-right { display: none !important; }
          .qd-mobile-meta { display: flex !important; }
          .qd-table-rate { display: none !important; }
          .qd-table-unit { display: none !important; }
          .qd-content { padding: 1rem !important; }
          .qd-header { padding: 0 1rem !important; }
          .qd-qtitle { font-size: 12px !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="qd-header" style={{ background: '#fff', borderBottom: '1px solid #E5E3DC', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58, position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button onClick={() => router.push('/quotations')} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, color: '#888', fontSize: 13, flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <div style={{ width: 1, height: 20, background: '#E5E3DC', flexShrink: 0 }} />
          <div className="qd-qtitle" style={{ fontSize: 14, fontWeight: 700, color: '#1B4F8A', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.quotationNumber}</div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button onClick={handleDelete} disabled={deleting}
            style={{ padding: '7px 14px', background: '#fff', border: '1px solid #FECACA', color: '#C0392B', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1, whiteSpace: 'nowrap' }}>
            {deleting ? 'Deleting…' : 'Delete'}
          </button>
          <button onClick={handlePDF}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', background: '#1B4F8A', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M12 16l-4-4h3V4h2v8h3l-4 4z"/><path d="M4 18h16v2H4z"/></svg>
            <span style={{ display: 'inline' }}>PDF</span>
          </button>
        </div>
      </header>

      <div className="qd-content" style={{ maxWidth: 860, margin: '0 auto', padding: '1.5rem' }}>

        {/* ── Client card ── */}
        <div style={{ background: '#fff', border: '1px solid #E5E3DC', borderRadius: 12, padding: '16px 20px', marginBottom: 14, boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
          <div className="qd-client-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#1A1A18', letterSpacing: '-0.02em', marginBottom: 6 }}>{q.clientName}</div>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: '#555', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81a19.79 19.79 0 01-3.07-8.63A2 2 0 012 1h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 8.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
                  <a href={`tel:${q.clientPhone}`} style={{ color: '#1B4F8A', textDecoration: 'none', fontWeight: 600 }}>{q.clientPhone}</a>
                </span>
                {q.clientAddress && <span style={{ fontSize: 13, color: '#555' }}>📍 {q.clientAddress}</span>}
              </div>
              {q.notes && <div style={{ fontSize: 12, color: '#aaa', marginTop: 6 }}>Note: {q.notes}</div>}
            </div>

            {/* Desktop right side */}
            <div className="qd-header-right" style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#bbb', marginBottom: 2 }}>Created</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>{fmtDate(q.createdAt)}</div>
              <div style={{ marginTop: 8, display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <span style={{ background: q.trackType === 3 ? '#EEF2FF' : '#E1F5EE', color: q.trackType === 3 ? '#3730A3' : '#085041', padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 700 }}>
                  {q.trackType} Track
                </span>
                <span style={{ background: '#F6F5F1', color: '#666', padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600 }}>
                  {q.material === 'regular' ? 'Regular' : 'Jindal'}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile meta row — hidden on desktop via CSS */}
          <div className="qd-mobile-meta" style={{ display: 'none', gap: 8, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#888' }}>{fmtDate(q.createdAt)}</span>
            <span style={{ background: q.trackType === 3 ? '#EEF2FF' : '#E1F5EE', color: q.trackType === 3 ? '#3730A3' : '#085041', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
              {q.trackType} Track
            </span>
            <span style={{ background: '#F6F5F1', color: '#666', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
              {q.material === 'regular' ? 'Regular' : 'Jindal'}
            </span>
          </div>
        </div>

        {/* ── Window info (2×2 on mobile, 4×1 on desktop) ── */}
        <div className="qd-grid4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'Width', val: `${q.width}"` },
            { label: 'Height', val: `${q.height}"` },
            { label: 'Area', val: `${q.sqFt?.toFixed(2)} sq.ft` },
            { label: 'Rate/kg', val: `₹${inr(q.rateKg)}` },
          ].map(c => (
            <div key={c.label} style={{ background: '#fff', border: '1px solid #E5E3DC', borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, color: '#bbb', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600, marginBottom: 4 }}>{c.label}</div>
              <div style={{ fontSize: 17, fontWeight: 700, color: '#1A1A18' }}>{c.val}</div>
            </div>
          ))}
        </div>

        {/* ── Summary totals (2×2 on mobile) ── */}
        <div className="qd-grid4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
          {[
            { label: 'Track', val: q.trackCost },
            { label: 'Shutter', val: q.shutterCost },
            { label: 'Interlock', val: q.interlockCost },
            { label: 'Grand Total', val: q.grandTotal, highlight: true },
          ].map(c => (
            <div key={c.label} style={{ background: c.highlight ? '#1B4F8A' : '#fff', border: `1px solid ${c.highlight ? '#1B4F8A' : '#E5E3DC'}`, borderRadius: 10, padding: '12px 14px' }}>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.06em', color: c.highlight ? 'rgba(255,255,255,.6)' : '#aaa', fontWeight: 600, marginBottom: 5 }}>{c.label}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: c.highlight ? '#fff' : '#1A1A18', letterSpacing: '-0.02em' }}>₹{inr(c.val)}</div>
            </div>
          ))}
        </div>

        {/* ── Breakdown table ── */}
        <div style={{ background: '#fff', border: '1px solid #E5E3DC', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid #E5E3DC', background: '#F6F5F1', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            Full Breakdown
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 340 }}>
              <thead>
                <tr style={{ background: '#F6F5F1' }}>
                  <th style={{ padding: '9px 14px', fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'left', borderBottom: '1px solid #E5E3DC' }}>Item</th>
                  <th style={{ padding: '9px 14px', fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'right', borderBottom: '1px solid #E5E3DC' }}>Qty</th>
                  <th className="qd-table-unit" style={{ padding: '9px 14px', fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'right', borderBottom: '1px solid #E5E3DC' }}>Unit</th>
                  <th className="qd-table-rate" style={{ padding: '9px 14px', fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'right', borderBottom: '1px solid #E5E3DC' }}>Rate</th>
                  <th style={{ padding: '9px 14px', fontSize: 11, fontWeight: 600, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.05em', textAlign: 'right', borderBottom: '1px solid #E5E3DC' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => r.section ? (
                  <tr key={i}>
                    <td colSpan={5} style={{ padding: '7px 14px', background: '#F0EFE9', fontSize: 10, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: '.07em' }}>{r.section}</td>
                  </tr>
                ) : (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#FAFAF8' }}>
                    <td style={{ padding: '9px 14px', fontSize: 13, color: '#444' }}>{r.name}</td>
                    <td style={{ padding: '9px 14px', fontSize: 13, color: '#888', textAlign: 'right' }}>{r.qty}</td>
                    <td className="qd-table-unit" style={{ padding: '9px 14px', fontSize: 12, color: '#bbb', textAlign: 'right' }}>{r.unit || 'pcs'}</td>
                    <td className="qd-table-rate" style={{ padding: '9px 14px', fontSize: 13, color: '#888', textAlign: 'right' }}>₹{inr(r.rate)}</td>
                    <td style={{ padding: '9px 14px', fontSize: 13, fontWeight: 600, color: '#1A1A18', textAlign: 'right' }}>₹{inr(r.cost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ background: '#1A1A18', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '0 0 12px 12px' }}>
            <span style={{ color: 'rgba(255,255,255,.6)', fontSize: 13, fontWeight: 500 }}>Grand Total</span>
            <span style={{ color: '#fff', fontSize: 20, fontWeight: 800, letterSpacing: '-0.03em' }}>₹ {inr(q.grandTotal)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}

// ── PDF generator ─────────────────────────────────────────────────────────────
// NOTE: jsPDF's built-in helvetica font does NOT support the ₹ Unicode glyph.
// It renders as a box/garbage character. We use "Rs." instead which renders perfectly.
function generatePDF(q) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const margin = 14, pageW = 210, cW = pageW - margin * 2;
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  // Use "Rs." — helvetica supports ASCII only; rupee symbol renders as garbage
  const rs = (n) => 'Rs. ' + Math.round(n || 0).toLocaleString('en-IN');
  let y = 0;

  // ── Header bar ──
  doc.setFillColor(27, 79, 138);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('Domal Window Quotation', margin, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(q.quotationNumber || '', margin, 21);
  doc.text(today, pageW - margin, 21, { align: 'right' });
  y = 40;

  // ── Client box ──
  doc.setFillColor(246, 245, 241);
  doc.roundedRect(margin, y, cW, 30, 3, 3, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(26, 26, 24);
  doc.text(q.clientName, margin + 6, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 95);
  doc.text(`Phone: ${q.clientPhone}`, margin + 6, y + 18);
  if (q.clientAddress) doc.text(`Address: ${q.clientAddress}`, margin + 6, y + 24);
  if (q.notes) doc.text(`Note: ${q.notes}`, margin + 6, q.clientAddress ? y + 30 : y + 24);

  // Window specs (right side)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(27, 79, 138);
  doc.text(`${q.trackType} Track  -  ${q.material === 'regular' ? 'Regular' : 'Jindal'}`, pageW - margin, y + 10, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 95);
  doc.text(`${q.width}" x ${q.height}"  -  ${q.sqFt?.toFixed(2)} sq.ft`, pageW - margin, y + 18, { align: 'right' });
  doc.text(`Rate: Rs.${Math.round(q.rateKg || 0).toLocaleString('en-IN')}/kg`, pageW - margin, y + 24, { align: 'right' });
  y += 38;

  // ── Summary metrics ──
  const mW = cW / 4 - 2;
  const metrics = [
    { label: 'Track',     val: rs(q.trackCost) },
    { label: 'Shutter',   val: rs(q.shutterCost) },
    { label: 'Interlock', val: rs(q.interlockCost) },
    { label: 'Grand Total', val: rs(q.grandTotal), hi: true },
  ];
  metrics.forEach((m, i) => {
    const x = margin + i * (mW + 2.5);
    if (m.hi) { doc.setFillColor(27, 79, 138); doc.setTextColor(255, 255, 255); }
    else { doc.setFillColor(225, 235, 248); doc.setTextColor(12, 68, 124); }
    doc.roundedRect(x, y, mW, 20, 2, 2, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
    doc.text(m.label.toUpperCase(), x + mW / 2, y + 7, { align: 'center' });
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text(m.val, x + mW / 2, y + 15, { align: 'center' });
  });
  y += 28;

  // ── Table header ──
  doc.setFillColor(26, 26, 24);
  doc.rect(margin, y, cW, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('Item',       margin + 4,       y + 5.5);
  doc.text('Qty',        margin + 102,     y + 5.5, { align: 'center' });
  doc.text('Unit',       margin + 122,     y + 5.5, { align: 'center' });
  doc.text('Rate',       margin + 145,     y + 5.5, { align: 'center' });
  doc.text('Amount',     margin + cW - 3,  y + 5.5, { align: 'right' });
  y += 10;

  // ── Table rows ──
  (q.breakdown || []).forEach((r, idx) => {
    if (y > 262) { doc.addPage(); y = 20; }
    if (r.section) {
      doc.setFillColor(240, 239, 233);
      doc.rect(margin, y - 1, cW, 7, 'F');
      doc.setTextColor(120, 118, 110); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
      doc.text(r.section.toUpperCase(), margin + 4, y + 4.5);
      y += 8;
    } else {
      doc.setFillColor(...(idx % 2 === 0 ? [255, 255, 255] : [248, 248, 246]));
      doc.rect(margin, y - 1, cW, 7, 'F');
      doc.setTextColor(60, 60, 58); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text(String(r.name), margin + 4, y + 4.5);
      doc.setTextColor(140, 138, 130);
      doc.text(String(r.qty),     margin + 102,    y + 4.5, { align: 'center' });
      doc.text(r.unit || 'pcs',   margin + 122,    y + 4.5, { align: 'center' });
      doc.text('Rs.' + Math.round(r.rate || 0).toLocaleString('en-IN'), margin + 145, y + 4.5, { align: 'center' });
      doc.setTextColor(20, 20, 18); doc.setFont('helvetica', 'bold');
      doc.text('Rs. ' + Math.round(r.cost || 0).toLocaleString('en-IN'), margin + cW - 3, y + 4.5, { align: 'right' });
      y += 7;
    }
  });

  // ── Grand total bar ──
  y += 2;
  doc.setFillColor(27, 79, 138);
  doc.rect(margin, y, cW, 10, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('Grand Total', margin + 4, y + 7);
  doc.text(rs(q.grandTotal), margin + cW - 3, y + 7, { align: 'right' });

  // ── Footer ──
  doc.setTextColor(180, 178, 170); doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.text(`Domal Window Calculator  -  ${today}  -  ${q.quotationNumber || ''}`, pageW / 2, 288, { align: 'center' });

  const fname = `${q.clientName?.replace(/\s+/g, '_') || 'Client'}_${q.quotationNumber || 'Q'}_${q.width}x${q.height}.pdf`;
  doc.save(fname);
}
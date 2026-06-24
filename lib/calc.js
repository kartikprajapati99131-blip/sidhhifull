export function calcDomal({ trackType, material, width: W, height: H, rateKg, glassRate, labourRate, otherRate, rLock, rBearing, rClot, rRubber }) {
  const sqFt = (W * H) / 144;
  let rows = [];
  let trackCost = 0, shutterCost = 0, interlockCost = 0;

  if (trackType === 2) {
    // ── Track ──
    const tCal = 4 * W;
    const tPipeR = tCal / 180;
    const tPipes = Math.ceil(tPipeR * 1.15);
    const tRunFt = tPipes * 15;
    const tWt = material === 'regular' ? 3.6 : 4.59;
    const tTotalWt = (tRunFt * tWt) / 15;
    trackCost = tTotalWt * rateKg;

    rows.push({ section: 'Track' });
    rows.push({ name: `Track pipe (${tWt} kg ${material === 'regular' ? 'Regular' : 'Jindal'})`, qty: tRunFt.toFixed(1), unit: 'ft', rate: rateKg, rateUnit: '/kg', cost: trackCost });

    // ── Shutter × 2 ──
    const sW = W / 2;
    const sCal = 6 * sW;
    const sPipes = Math.ceil(sCal / 180 * 1.1);
    const sRunFt = sPipes * 15;
    const sWt = material === 'regular' ? 3.4 : 3.89;
    const sTotalWt = (sRunFt * sWt) / 15;
    shutterCost = sTotalWt * rateKg * 2;

    rows.push({ section: 'Shutter' });
    rows.push({ name: `Shutter pipe (${sWt} kg ${material === 'regular' ? 'Regular' : 'Jindal'}) × 2`, qty: (sRunFt * 2).toFixed(1), unit: 'ft', rate: rateKg, rateUnit: '/kg', cost: shutterCost });

    // ── Interlock ──
    const iCal = 2 * H;
    const iPipes = Math.ceil(iCal / 180 * 1.1);
    const iRunFt = iPipes * 10;
    const iTotalWt = (iRunFt * 1.35) / 10;
    interlockCost = iTotalWt * rateKg;

    rows.push({ section: 'Interlock' });
    rows.push({ name: 'Interlock pipe (1.35 kg Regular)', qty: iRunFt.toFixed(1), unit: 'ft', rate: rateKg, rateUnit: '/kg', cost: interlockCost });

    // ── Accessories ──
    rows.push({ section: 'Accessories' });
    const accs = [
      { name: 'Lock',         qty: 2,                  rate: rLock },
      { name: 'Bearing',      qty: 4,                  rate: rBearing },
      { name: 'Clot',         qty: 8,                  rate: rClot },
      { name: 'L Corner',     qty: 16,                 rate: 1 },
      { name: 'M/F',          qty: 4,                  rate: 5 },
      { name: 'Long Patti',   qty: 4,                  rate: 5 },
      { name: 'Lock Guide',   qty: 4,                  rate: 5 },
      { name: 'Glass',        qty: +sqFt.toFixed(2),   rate: glassRate, unit: 'sq.ft' },
      { name: 'Rubber',       qty: 2,                  rate: rRubber },
      { name: 'Labour',       qty: +sqFt.toFixed(2),   rate: labourRate, unit: 'sq.ft' },
      { name: 'Other charges',qty: 1,                  rate: otherRate },
    ];
    accs.forEach(a => rows.push({ ...a, cost: a.qty * a.rate }));

  } else {
    // ── 3-Track ──
    const tCal = (W + H) * 2 + 2 * W;
    const tPipes = Math.ceil(tCal / 180 * 1.4);
    const tRunFt = tPipes * 16.5;
    const tWt = material === 'regular' ? 5.4 : 7.11;
    const tTotalWt = (tRunFt * tWt) / 16.5;
    trackCost = tTotalWt * rateKg;

    rows.push({ section: 'Track' });
    rows.push({ name: `Track pipe (${tWt} kg ${material === 'regular' ? 'Regular' : 'Jindal'})`, qty: tRunFt.toFixed(1), unit: 'ft', rate: rateKg, rateUnit: '/kg', cost: trackCost });

    // ── Shutter × 3 ──
    const sW = W / 3;
    const sCal = 8 * sW;
    const sPipes = Math.ceil(sCal / 180 * 1.4);
    const sRunFt = sPipes * 15;
    const sWt = material === 'regular' ? 3.4 : 3.89;
    const sTotalWt = (sRunFt * sWt) / 15;
    shutterCost = sTotalWt * rateKg * 3;

    rows.push({ section: 'Shutter' });
    rows.push({ name: `Shutter pipe (${sWt} kg ${material === 'regular' ? 'Regular' : 'Jindal'}) × 3`, qty: (sRunFt * 3).toFixed(1), unit: 'ft', rate: rateKg, rateUnit: '/kg', cost: shutterCost });

    // ── Interlock ──
    const iCal = 2 * H;
    const iPipes = Math.ceil(iCal / 180 * 1.4);
    const iRunFt = iPipes * 15;
    const iTotalWt = (iRunFt * 1.35) / 15;
    interlockCost = iTotalWt * rateKg;

    rows.push({ section: 'Interlock' });
    rows.push({ name: 'Interlock pipe (1.35 kg Regular)', qty: iRunFt.toFixed(1), unit: 'ft', rate: rateKg, rateUnit: '/kg', cost: interlockCost });

    // ── Accessories ──
    rows.push({ section: 'Accessories' });
    const accs = [
      { name: 'Lock',         qty: 3,                  rate: rLock },
      { name: 'Bearing',      qty: 6,                  rate: rBearing },
      { name: 'Clot',         qty: 12,                 rate: rClot },
      { name: 'L Corner',     qty: 24,                 rate: 1 },
      { name: 'M/F',          qty: 6,                  rate: 5 },
      { name: 'Long Patti',   qty: 6,                  rate: 5 },
      { name: 'Lock Guide',   qty: 6,                  rate: 5 },
      { name: 'Glass',        qty: +sqFt.toFixed(2),   rate: glassRate, unit: 'sq.ft' },
      { name: 'Rubber',       qty: +(sqFt * 0.1).toFixed(2), rate: rRubber, unit: 'sq.ft' },
      { name: 'Labour',       qty: +sqFt.toFixed(2),   rate: labourRate, unit: 'sq.ft' },
      { name: 'Other charges',qty: 1,                  rate: otherRate },
      { name: 'M Net',        qty: +(sqFt * 0.5).toFixed(2), rate: 35, unit: 'sq.ft' },
      { name: 'C Channel',    qty: 12,                 rate: 21 },
    ];
    accs.forEach(a => rows.push({ ...a, cost: a.qty * a.rate }));
  }

  const accessoryCost = rows
    .filter(r => r.cost && !r.section && !r.name?.includes('pipe'))
    .reduce((s, r) => s + r.cost, 0);

  const grandTotal = trackCost + shutterCost + interlockCost + accessoryCost;

  return { rows, trackCost, shutterCost, interlockCost, accessoryCost, grandTotal, sqFt };
}

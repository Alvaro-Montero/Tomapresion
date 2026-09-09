// improved OCR parser with more heuristics and debugging info
function sanitizeNumberString(s) {
  if (!s) return null;
  // Replace common OCR errors
  s = s.replace(/[lI|]/g, '1'); // I, l, | -> 1
  s = s.replace(/[Oo]/g, '0'); // O -> 0
  s = s.replace(/[^0-9]/g, '');
  return s || null;
}

function parseOcrText(text) {
  if (!text) return { systolic: null, diastolic: null, pulse: null };
  const original = String(text);
  const t = original.replace(/\r/g, '\n');
  const lines = t.split(/\n+/).map(s => s.trim()).filter(Boolean);

  let systolic = null, diastolic = null, pulse = null;
  let debug = { attempts: [] };

  // 1) Look for direct patterns like 120/80 or 120 / 80
  for (const line of lines) {
    const m = line.match(/(\d{2,3})\s*[\/:]\s*(\d{2,3})/);
    if (m) {
      systolic = parseInt(m[1].replace(/\D/g, ''), 10);
      diastolic = parseInt(m[2].replace(/\D/g, ''), 10);
      debug.attempts.push({ type: 'slash-pattern', line, match: m.slice(1) });
      break;
    }
  }

  // 2) Look for labelled patterns (Systolic / Diastolic / SYS / DIA) in English and Spanish
  if (systolic == null || diastolic == null) {
    const joined = lines.join(' ');
    // possible forms: SYS:120 DIA:80, Systolic 120 Diastolic 80
    let m = joined.match(/sys(?:tolic)?[^0-9]{0,5}(\d{2,3})[^0-9]{0,6}dia(?:stolic)?[^0-9]{0,5}(\d{2,3})/i);
    if (m) {
      systolic = parseInt(m[1], 10);
      diastolic = parseInt(m[2], 10);
      debug.attempts.push({ type: 'labelled-sys-dia', joined, match: m.slice(1) });
    } else {
      // Spanish labels
      m = joined.match(/sist[oó]lica[^0-9]{0,6}(\d{2,3})[^0-9]{0,6}diast[oó]lica[^0-9]{0,6}(\d{2,3})/i);
      if (m) {
        systolic = parseInt(m[1], 10);
        diastolic = parseInt(m[2], 10);
        debug.attempts.push({ type: 'labelled-sist-diast', joined, match: m.slice(1) });
      }
    }
  }

  // 3) Try to find separate lines for systolic/diastolic or pulse
  for (const line of lines) {
    // pulse
    if (pulse == null) {
      let m = line.match(/(pulse|pulso)[:\s]*?(\d{2,3})/i);
      if (m) { pulse = parseInt(m[2], 10); debug.attempts.push({ type: 'label-pulse', line, match: m.slice(1) }); continue; }
      m = line.match(/(\d{2,3})\s*(bpm)/i);
      if (m) { pulse = parseInt(m[1], 10); debug.attempts.push({ type: 'bpm', line, match: m.slice(1) }); continue; }
    }

    // labelled systolic/diastolic separately
    if ((systolic == null || diastolic == null)) {
      let m = line.match(/syst(?:olic)?[:\s]*(\d{2,3})/i);
      if (m) { systolic = parseInt(m[1], 10); debug.attempts.push({ type: 'label-syst', line, match: m.slice(1) }); }
      m = line.match(/dia(?:stolic)?[:\s]*(\d{2,3})/i);
      if (m) { diastolic = parseInt(m[1], 10); debug.attempts.push({ type: 'label-dia', line, match: m.slice(1) }); }

      // Spanish variants
      m = line.match(/sist[oó]lica[:\s]*(\d{2,3})/i);
      if (m) { systolic = parseInt(m[1], 10); debug.attempts.push({ type: 'label-sist-es', line, match: m.slice(1) }); }
      m = line.match(/diast[oó]lica[:\s]*(\d{2,3})/i);
      if (m) { diastolic = parseInt(m[1], 10); debug.attempts.push({ type: 'label-diast-es', line, match: m.slice(1) }); }
    }
  }

  // 4) If still missing, try to extract all standalone numbers and infer
  if (systolic == null || diastolic == null || pulse == null) {
    const allNumbers = [];
    for (const line of lines) {
      const nums = line.match(/\d{2,3}/g);
      if (nums) nums.forEach(n => allNumbers.push(parseInt(n, 10)));
    }
    debug.attempts.push({ type: 'numbers-found', allNumbers });

    // if we have at least two, try to pick sys>dia
    if ((systolic == null || diastolic == null) && allNumbers.length >= 2) {
      // try pairs in order
      for (let i = 0; i < allNumbers.length - 1; i++) {
        const a = allNumbers[i], b = allNumbers[i+1];
        if (a > b && a > 80 && b >= 40) { systolic = a; diastolic = b; debug.attempts.push({ type: 'pair-infer', pair:[a,b], index:i }); break; }
      }
      // fallback: take first two
      if (systolic == null && diastolic == null) {
        systolic = allNumbers[0];
        diastolic = allNumbers[1];
        debug.attempts.push({ type: 'pair-fallback-first-two', pair:[systolic, diastolic] });
      }
    }

    // For pulse: if not found, pick a single number that looks like pulse (30-200) and not equal to systolic/diastolic
    if (pulse == null && allNumbers.length > 0) {
      for (const n of allNumbers) {
        if (n > 30 && n < 200 && n !== systolic && n !== diastolic) { pulse = n; debug.attempts.push({ type: 'infer-pulse', value:n }); break; }
      }
    }
  }

  // final sanity checks
  if (systolic != null && diastolic != null) {
    if (systolic < diastolic) {
      // swap if OCR caused inversion
      const tmp = systolic; systolic = diastolic; diastolic = tmp;
      debug.attempts.push({ type: 'swap-sanity' });
    }
  }

  // If nothing parsed, include the raw text snippet in debug to help tuning
  if (systolic == null && diastolic == null && pulse == null) {
    debug.warning = 'No values parsed';
    debug.raw = original.slice(0, 1000);
    console.warn('OCR parse failed, sample text:', original.slice(0,500));
  }

  return { systolic, diastolic, pulse };
}

module.exports = { parseOcrText };

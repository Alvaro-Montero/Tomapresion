// simple parser heuristics for OCR text
function parseOcrText(text) {
  if (!text) return {};
  const t = text.replace(/\r/g, '\n');
  const lines = t.split(/\n+/).map(s => s.trim()).filter(Boolean);

  let systolic = null, diastolic = null, pulse = null;

  // try to find patterns like 120/80 or 120 / 80
  for (const line of lines) {
    const m = line.match(/(\d{2,3})\s*[\/:]\s*(\d{2,3})/);
    if (m) {
      systolic = parseInt(m[1], 10);
      diastolic = parseInt(m[2], 10);
      break;
    }
  }

  // try to find pulse (looks for "bpm" or "pulse" or "pulso")
  for (const line of lines) {
    const m = line.match(/(pulse|pulso|bpm|Hz)[:\s]*?(\d{2,3})/i) || line.match(/(\d{2,3})\s*(bpm)/i);
    if (m) {
      const val = m[2] ? parseInt(m[2], 10) : parseInt(m[1], 10);
      if (!isNaN(val)) pulse = val;
      break;
    }
  }

  // fallback: try lines with single numbers that look like pulse
  if (!pulse) {
    for (const line of lines) {
      const m = line.match(/^(\d{2,3})$/);
      if (m) {
        const val = parseInt(m[1], 10);
        if (val > 30 && val < 200) { pulse = val; break; }
      }
    }
  }

  return { systolic, diastolic, pulse };
}

module.exports = { parseOcrText };

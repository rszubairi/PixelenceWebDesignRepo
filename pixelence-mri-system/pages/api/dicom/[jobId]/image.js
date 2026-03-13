/**
 * Mock DICOM slice image endpoint
 * GET /api/dicom/:jobId/image?sequence=T1&slice=1
 *
 * Returns an SVG that visually mimics a grayscale MRI brain slice.
 * Different sequences and slice indices produce distinct visual variations.
 * No external packages required — pure SVG string generation.
 */

// Sequence-specific visual parameters
const SEQUENCE_PARAMS = {
  T1:   { brightness: 160, contrast: 0.85, label: 'T1-weighted',    accent: '#A0A0A0' },
  T2:   { brightness: 210, contrast: 0.60, label: 'T2-weighted',    accent: '#C8C8C8' },
  FLAIR:{ brightness: 130, contrast: 1.10, label: 'FLAIR',          accent: '#888888' },
  T1C:  { brightness: 180, contrast: 0.95, label: 'T1 Contrast',    accent: '#B0B8C0' },
};

function seededRandom(seed) {
  // Simple deterministic PRNG so the same slice always looks the same
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function toHex(val) {
  return Math.min(255, Math.max(0, Math.round(val))).toString(16).padStart(2, '0');
}

function grey(val) {
  const h = toHex(val);
  return `#${h}${h}${h}`;
}

function generateBrainSvg({ sequence, slice, jobId }) {
  const params = SEQUENCE_PARAMS[sequence] || SEQUENCE_PARAMS.T1;
  const { brightness, contrast, label, accent } = params;

  // Slice position (0–1) drives vertical oval cross-section size
  const totalSlices = 20;
  const pos = (slice - 1) / (totalSlices - 1); // 0 at top, 1 at bottom
  const radX = Math.round(140 * Math.sin(Math.PI * pos) + 20);
  const radY = Math.round(170 * Math.sin(Math.PI * pos) + 15);

  const rng = seededRandom(slice * 31 + sequence.charCodeAt(0) * 7);

  // Background — deep grey
  const bg = grey(18);
  const skullVal = Math.round(brightness * 0.4 * contrast);
  const brainVal = Math.round(brightness * 0.72 * contrast);
  const wmVal    = Math.round(brightness * 0.90 * contrast);  // white matter
  const ventVal  = Math.round(brightness * 0.15 * contrast);  // ventricles (dark)

  // Generate 6 random gyrus blobs inside the brain outline
  const gyri = Array.from({ length: 6 }, (_, i) => {
    const angle = (i / 6) * Math.PI * 2 + rng() * 0.5;
    const dist  = 40 + rng() * 70;
    const gx    = 256 + Math.cos(angle) * dist;
    const gy    = 256 + Math.sin(angle) * dist * 1.1;
    const gr    = 18 + rng() * 28;
    const gVal  = Math.round(wmVal * (0.85 + rng() * 0.3));
    return `<ellipse cx="${gx.toFixed(1)}" cy="${gy.toFixed(1)}" rx="${gr.toFixed(1)}" ry="${(gr * 0.75).toFixed(1)}" fill="${grey(gVal)}" opacity="0.7"/>`;
  });

  // Ventricle shape (mid-slices only)
  const showVentricles = pos > 0.3 && pos < 0.75;
  const ventricles = showVentricles ? `
    <ellipse cx="240" cy="248" rx="18" ry="10" fill="${grey(ventVal)}"/>
    <ellipse cx="272" cy="248" rx="18" ry="10" fill="${grey(ventVal)}"/>
    <rect x="240" y="243" width="32" height="10" fill="${grey(ventVal)}"/>
  ` : '';

  // Falx cerebri — midline dark stripe
  const falx = pos > 0.2 && pos < 0.85
    ? `<line x1="256" y1="${(256 - radY * 0.9).toFixed(0)}" x2="256" y2="${(256 + radY * 0.9).toFixed(0)}" stroke="${grey(ventVal)}" stroke-width="3" opacity="0.5"/>`
    : '';

  // Timestamp / metadata overlay values
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <!-- Background -->
  <rect width="512" height="512" fill="${bg}"/>

  <!-- Skull outline -->
  <ellipse cx="256" cy="256" rx="${(radX + 26).toFixed(0)}" ry="${(radY + 22).toFixed(0)}"
    fill="${grey(skullVal)}" stroke="${grey(skullVal + 20)}" stroke-width="2"/>

  <!-- Brain parenchyma -->
  <ellipse cx="256" cy="256" rx="${radX}" ry="${radY}"
    fill="${grey(brainVal)}"/>

  <!-- Gyri / white matter blobs -->
  ${gyri.join('\n  ')}

  <!-- Falx cerebri -->
  ${falx}

  <!-- Ventricles -->
  ${ventricles}

  <!-- Subtle noise texture overlay -->
  <filter id="noise">
    <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
    <feBlend in="SourceGraphic" mode="overlay" result="blend"/>
    <feComposite in="blend" in2="SourceGraphic" operator="in"/>
  </filter>
  <rect width="512" height="512" filter="url(#noise)" opacity="0.06"/>

  <!-- DICOM-style metadata overlay -->
  <rect x="0" y="0" width="512" height="28" fill="rgba(0,0,0,0.55)"/>
  <text x="8" y="18" font-family="monospace" font-size="11" fill="${accent}">PIXELENCE CLINICAL VIEWER</text>
  <text x="330" y="18" font-family="monospace" font-size="11" fill="${accent}">${dateStr}</text>

  <text x="8" y="500" font-family="monospace" font-size="11" fill="${accent}">JOB: ${jobId.slice(0,16).toUpperCase()}</text>
  <text x="330" y="500" font-family="monospace" font-size="11" fill="${accent}">SL: ${slice}/${totalSlices}</text>

  <!-- Sequence label (bottom-left corner) -->
  <rect x="6" y="468" width="140" height="22" rx="3" fill="rgba(0,0,0,0.6)"/>
  <text x="12" y="483" font-family="monospace" font-size="12" font-weight="bold" fill="${accent}">${label}</text>

  <!-- Slice indicator bar (right edge) -->
  <rect x="496" y="0" width="8" height="512" fill="rgba(0,0,0,0.4)"/>
  <rect x="496" y="${Math.round(pos * 512)}" width="8" height="24" rx="2" fill="${accent}"/>
</svg>`;
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { jobId } = req.query;
  const sequence  = (req.query.sequence || 'T1').toUpperCase();
  const slice     = Math.min(20, Math.max(1, parseInt(req.query.slice, 10) || 1));

  const svg = generateBrainSvg({ sequence, slice, jobId });

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).send(svg);
}

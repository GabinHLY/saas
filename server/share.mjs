import sharp from "sharp";
export const escapeHtml = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export async function ogImage(p) {
  const money = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(p.revenue / 100);
  const statuses = {
    PLANNED: "À VENIR",
    BUILDING: "EN CHANTIER",
    SHIPPED: "LANCÉ",
    PROMISING: "PROMETTEUR",
    FAILED: "RATÉ",
    PROFITABLE: "RENTABLE",
    PAUSED: "EN PAUSE",
  };
  const status = statuses[p.status] || p.status;
  const svg = `<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg"><rect width="1200" height="630" fill="#fbfbf8"/><g fill="#1c28a8" font-family="sans-serif"><text x="64" y="84" font-size="34" font-weight="900">what works?</text><path d="M64 118H1136" stroke="#1c28a8" stroke-width="3"/><text x="64" y="190" font-family="serif" font-style="italic" font-size="30" fill="#5d64b0">Jour ${p.day} sur 31 · octobre 2026</text><text x="64" y="${p.name.length > 20 ? 290 : 310}" font-size="${p.name.length > 20 ? 58 : 96}" font-weight="900">${escapeHtml(p.name.slice(0, 38))}</text><g transform="rotate(-3 180 368)"><rect x="66" y="346" width="${status.length * 17 + 36}" height="46" rx="5" fill="none" stroke="${p.status === "FAILED" ? "#d6392c" : "#1c28a8"}" stroke-width="3"/><text x="84" y="378" font-size="24" font-weight="800" letter-spacing="2" fill="${p.status === "FAILED" ? "#d6392c" : "#1c28a8"}">${escapeHtml(status)}</text></g><path d="M64 452H1136" stroke="#1c28a8" stroke-width="1" stroke-dasharray="3 7"/><rect x="58" y="512" width="${money.length * 27 + 16}" height="36" rx="6" fill="#ddfa3e" transform="rotate(-1.5 200 530)"/><text x="64" y="548" font-size="52" font-weight="900">${escapeHtml(money)}</text><text x="64" y="590" font-family="serif" font-style="italic" font-size="24" fill="#5d64b0">de revenus</text><text x="520" y="548" font-size="52" font-weight="900">${p.users}</text><text x="520" y="590" font-family="serif" font-style="italic" font-size="24" fill="#5d64b0">utilisateurs</text><g transform="rotate(-3 1010 330)"><rect x="900" y="170" width="220" height="250" rx="12" fill="#ffffff" stroke="#1c28a8" stroke-width="4"/><path d="M900 182a12 12 0 0 1 12-12h196a12 12 0 0 1 12 12v40H900z" fill="#1c28a8"/><text x="1010" y="206" text-anchor="middle" font-size="22" font-weight="700" letter-spacing="4" fill="#fbfbf8">OCTOBRE</text><text x="1010" y="370" text-anchor="middle" font-size="140" font-weight="900">${p.day}</text></g></g></svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

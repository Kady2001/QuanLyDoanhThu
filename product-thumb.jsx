// Product thumbnail — geometric category-coded placeholder for light theme

function ProductThumb({ cat, size = 38 }) {
  const colors = {
    keyboard:  { fg: '#ff6a3d', bg: '#fff1ea' },
    keycap:    { fg: '#f59e0b', bg: '#fef3c7' },
    phone:     { fg: '#2563eb', bg: '#dbeafe' },
    mouse:     { fg: '#059669', bg: '#d1fae5' },
    cable:     { fg: '#7c3aed', bg: '#ede9fe' },
    monitor:   { fg: '#0f766e', bg: '#ccfbf1' },
    accessory: { fg: '#db2777', bg: '#fce7f3' },
  };
  const { fg, bg } = colors[cat] || { fg: '#6b6b80', bg: '#ebebf2' };

  return (
    <div className="row-img" style={{ width: size, height: size, background: bg, borderColor: fg + '33' }}>
      <svg viewBox="0 0 64 64" width={size * 0.85} height={size * 0.85}>
        <ProductShape cat={cat} fg={fg} />
      </svg>
    </div>
  );
}

function ProductThumbLarge({ cat }) {
  const colors = {
    keyboard:  { fg: '#ff6a3d', bg: '#fff1ea' },
    keycap:    { fg: '#f59e0b', bg: '#fef3c7' },
    phone:     { fg: '#2563eb', bg: '#dbeafe' },
    mouse:     { fg: '#059669', bg: '#d1fae5' },
    cable:     { fg: '#7c3aed', bg: '#ede9fe' },
    monitor:   { fg: '#0f766e', bg: '#ccfbf1' },
    accessory: { fg: '#db2777', bg: '#fce7f3' },
  };
  const { fg, bg } = colors[cat] || { fg: '#6b6b80', bg: '#ebebf2' };
  return (
    <div style={{ width: '100%', height: '100%', display: 'grid', placeItems: 'center', background: `radial-gradient(circle at 50% 50%, ${bg}, transparent 75%)` }}>
      <svg viewBox="0 0 64 64" width="58%" height="58%">
        <ProductShape cat={cat} fg={fg} large />
      </svg>
    </div>
  );
}

function ProductShape({ cat, fg, large }) {
  const sw = large ? 1.8 : 1.5;
  if (cat === 'keyboard') return (
    <g>
      <rect x="8" y="20" width="48" height="24" fill="none" stroke={fg} strokeWidth={sw} />
      {[0,1,2,3,4,5,6,7,8].map(i => <rect key={i} x={10 + i*5} y="23" width="3" height="3" fill={fg} />)}
      {[0,1,2,3,4,5,6,7,8].map(i => <rect key={'b'+i} x={10 + i*5} y="29" width="3" height="3" fill={fg} opacity="0.55" />)}
      <rect x="20" y="36" width="24" height="3" fill={fg} opacity="0.4" />
    </g>
  );
  if (cat === 'keycap') return (
    <g>
      <rect x="18" y="18" width="28" height="28" fill="none" stroke={fg} strokeWidth={sw} />
      <rect x="22" y="22" width="20" height="20" fill={fg} opacity="0.18" />
      <text x="32" y="38" textAnchor="middle" fill={fg} fontSize="14" fontWeight="800" fontFamily="JetBrains Mono">K</text>
    </g>
  );
  if (cat === 'phone') return (
    <g>
      <rect x="20" y="10" width="24" height="44" rx="3" fill="none" stroke={fg} strokeWidth={sw} />
      <rect x="23" y="16" width="18" height="30" fill={fg} opacity="0.15" />
      <circle cx="32" cy="50" r="1.8" fill={fg} />
      <rect x="29" y="13" width="6" height="1" fill={fg} opacity="0.5" />
    </g>
  );
  if (cat === 'mouse') return (
    <g>
      <path d="M18 28 Q18 16 32 16 Q46 16 46 28 L46 44 Q46 52 32 52 Q18 52 18 44 Z" fill="none" stroke={fg} strokeWidth={sw} />
      <line x1="32" y1="18" x2="32" y2="32" stroke={fg} strokeWidth="1.2" opacity="0.5" />
      <rect x="29" y="22" width="6" height="8" fill={fg} opacity="0.3" />
    </g>
  );
  if (cat === 'cable') return (
    <g>
      <rect x="8" y="28" width="10" height="10" fill="none" stroke={fg} strokeWidth={sw} />
      <path d="M18 33 Q28 33 28 40 Q28 47 38 47 Q48 47 48 40" fill="none" stroke={fg} strokeWidth="2.4" strokeLinecap="round" />
      <rect x="46" y="36" width="10" height="8" fill="none" stroke={fg} strokeWidth={sw} />
    </g>
  );
  if (cat === 'monitor') return (
    <g>
      <rect x="10" y="14" width="44" height="30" rx="2" fill="none" stroke={fg} strokeWidth={sw} />
      <rect x="14" y="18" width="36" height="22" fill={fg} opacity="0.14" />
      <line x1="32" y1="44" x2="32" y2="51" stroke={fg} strokeWidth="2" />
      <line x1="22" y1="52" x2="42" y2="52" stroke={fg} strokeWidth="2" strokeLinecap="round" />
    </g>
  );
  return (
    <g>
      <circle cx="32" cy="32" r="18" fill="none" stroke={fg} strokeWidth={sw} />
      <circle cx="32" cy="32" r="9" fill={fg} opacity="0.25" />
      <circle cx="32" cy="32" r="3" fill={fg} />
    </g>
  );
}

window.ProductThumb = ProductThumb;
window.ProductThumbLarge = ProductThumbLarge;

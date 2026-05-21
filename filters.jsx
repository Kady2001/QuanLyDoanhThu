// Polished dropdowns for Dashboard filters

const { useState: useStateDD, useRef: useRefDD, useEffect: useEffectDD } = React;

// Close-on-outside-click helper
function useClickOutside(ref, onClose, active) {
  useEffectDD(() => {
    if (!active) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [active]);
}

const Chevron = () => (
  <svg className="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const MONTHS = ['Th 1','Th 2','Th 3','Th 4','Th 5','Th 6','Th 7','Th 8','Th 9','Th 10','Th 11','Th 12'];

// ===== Revenue period picker =====
// value shapes:
// { kind: 'day', date: 'YYYY-MM-DD' }
// { kind: '7days', end: 'YYYY-MM-DD' }
// { kind: 'month', year: 2026, month: 4 } (0-indexed month)
function pickerIsoDate(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function pickerAddDays(value, days) {
  const d = value ? new Date(value) : new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function DateRangePicker({ value, onChange, dataPoints, today }) {
  const [open, setOpen] = useStateDD(false);
  const ref = useRefDD(null);
  useClickOutside(ref, () => setOpen(false), open);

  const todayD = new Date(today);
  const activeMonthYear = value.kind === 'month' ? value.year : todayD.getFullYear();
  const [viewYear, setViewYear] = useStateDD(activeMonthYear);
  const selectedDate = value.kind === 'day' ? value.date : pickerIsoDate(todayD);
  const selectedEnd = value.kind === '7days' ? value.end : pickerIsoDate(todayD);
  const label = value.kind === 'day'
    ? `1 ngày · ${new Date(selectedDate).toLocaleDateString('vi-VN')}`
    : value.kind === '7days'
      ? `7 ngày · ${pickerAddDays(selectedEnd, -6).toLocaleDateString('vi-VN')} - ${new Date(selectedEnd).toLocaleDateString('vi-VN')}`
      : `${MONTHS[value.month]}, ${value.year}`;

  const monthsWithData = new Set();
  dataPoints.forEach(s => {
    const d = new Date(s.sold || s.date);
    if (d.getFullYear() === viewYear) monthsWithData.add(d.getMonth());
  });

  const yearsAvail = new Set(dataPoints.map(s => new Date(s.sold || s.date).getFullYear()).filter(Number.isFinite));
  const minYear = Math.min(...yearsAvail, todayD.getFullYear());
  const maxYear = Math.max(...yearsAvail, todayD.getFullYear());

  return (
    <div className="dd-wrap" ref={ref}>
      <button className={`dd-trigger ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
        <span className="dd-lead">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        </span>
        <span className="dd-text">
          <span className="dd-label">Khoảng doanh thu</span>
          <span className="dd-value">{label}</span>
        </span>
        <Chevron />
      </button>
      {open && (
        <div className="dd-pop" style={{ minWidth: 330 }}>
          <div className="dd-section-label">Xem nhanh</div>
          <div className="range-mode-row">
            <button className={`dd-mode ${value.kind === 'day' ? 'selected' : ''}`} onClick={() => onChange({ kind: 'day', date: selectedDate })}>1 ngày</button>
            <button className={`dd-mode ${value.kind === '7days' ? 'selected' : ''}`} onClick={() => onChange({ kind: '7days', end: selectedEnd })}>7 ngày</button>
            <button className={`dd-mode ${value.kind === 'month' ? 'selected' : ''}`} onClick={() => onChange({ kind: 'month', year: viewYear, month: value.kind === 'month' ? value.month : todayD.getMonth() })}>Theo tháng</button>
          </div>

          {value.kind === 'day' && (
            <div className="dd-date-row">
              <label>Ngày bán</label>
              <input type="date" value={selectedDate} max={pickerIsoDate(todayD)} onChange={e => onChange({ kind: 'day', date: e.target.value })} />
            </div>
          )}
          {value.kind === '7days' && (
            <div className="dd-date-row">
              <label>Kết thúc ngày</label>
              <input type="date" value={selectedEnd} max={pickerIsoDate(todayD)} onChange={e => onChange({ kind: '7days', end: e.target.value })} />
            </div>
          )}

          <div className="dd-section-label">Chọn theo tháng bán</div>
          <div className="dd-year">
            <button onClick={() => setViewYear(y => y - 1)} disabled={viewYear <= minYear}>{'<'}</button>
            <span className="dd-year-label">{viewYear}</span>
            <button onClick={() => setViewYear(y => y + 1)} disabled={viewYear >= maxYear}>{'>'}</button>
          </div>
          <div className="dd-months">
            {MONTHS.map((m, i) => {
              const has = monthsWithData.has(i);
              const isSelected = value.kind === 'month' && value.year === viewYear && value.month === i;
              const isFuture = viewYear > todayD.getFullYear() || (viewYear === todayD.getFullYear() && i > todayD.getMonth());
              return (
                <button key={i}
                  className={`dd-month ${isSelected ? 'selected' : has ? 'has-data' : 'no-data'}`}
                  disabled={isFuture}
                  onClick={() => { onChange({ kind: 'month', year: viewYear, month: i }); setOpen(false); }}>
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Category picker =====
function CategoryPicker({ value, onChange, counts, categories = window.CATEGORIES }) {
  const [open, setOpen] = useStateDD(false);
  const ref = useRefDD(null);
  useClickOutside(ref, () => setOpen(false), open);

  const selected = value === 'all'
    ? { name: 'Tất cả danh mục', color: '#6b6b80' }
    : categories.find(c => c.id === value);

  return (
    <div className="dd-wrap" ref={ref}>
      <button className={`dd-trigger ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
        <span className="dd-lead">
          {value === 'all' ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
          ) : (
            <span style={{ width: 12, height: 12, background: selected?.color, display: 'inline-block', borderRadius: 2 }}></span>
          )}
        </span>
        <span className="dd-text">
          <span className="dd-label">Danh mục</span>
          <span className="dd-value">{selected?.name}</span>
        </span>
        <Chevron />
      </button>
      {open && (
        <div className="dd-pop">
          <button
            className={`dd-item ${value === 'all' ? 'selected' : ''}`}
            onClick={() => { onChange('all'); setOpen(false); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
            </svg>
            <span>Tất cả danh mục</span>
            <span className="dd-cnt">{counts.all || 0}</span>
          </button>
          <div className="dd-divider"></div>
          {categories.map(c => (
            <button key={c.id}
              className={`dd-item ${value === c.id ? 'selected' : ''}`}
              onClick={() => { onChange(c.id); setOpen(false); }}>
              <span className="dd-dot" style={{ background: c.color }}></span>
              <span>{c.name}</span>
              <span className="dd-cnt">{counts[c.id] || 0}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

Object.assign(window, { DateRangePicker, CategoryPicker });

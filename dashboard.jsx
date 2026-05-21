// Dashboard — list of sold units, charts, KPIs

const { useState: useStateD, useMemo: useMemoD } = React;

const MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

function CatPill({ cat }) {
  const c = window.CATEGORIES.find(x => x.id === cat);
  return (
    <span className={`cat-pill cat-${cat}`}>
      <span className="dot" style={{ background: c?.color || 'var(--muted)' }}></span>
      {c?.name || cat}
    </span>
  );
}

function RateBar({ pct }) {
  const w = Math.min(Math.max((pct - 70) / 90 * 100, 2), 100);
  const cls = pct >= 110 ? '' : pct >= 100 ? 'flat' : 'neg';
  const color = pct >= 110 ? '#10b981' : pct >= 100 ? '#9a9aae' : '#e11d48';
  return (
    <span className="rate-bar">
      <span className="bar"><i className={cls} style={{ width: `${w}%` }}></i></span>
      <span className="mono" style={{ fontSize: 12, fontWeight: 800, color, minWidth: 56, textAlign: 'right' }}>
        {pct.toFixed(1)}%
      </span>
    </span>
  );
}


function dashDateOnly(value) {
  const d = value instanceof Date ? new Date(value) : new Date(value);
  if (Number.isNaN(d.getTime())) return new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function dashDateIso(value) {
  const d = dashDateOnly(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function dashAddDays(value, days) {
  const d = dashDateOnly(value);
  d.setDate(d.getDate() + days);
  return d;
}

function dashboardRangeBounds(range, todayD) {
  if (range.kind === 'day') {
    const start = dashDateOnly(range.date || todayD);
    return { start, end: start, days: 1 };
  }
  if (range.kind === '7days') {
    const end = dashDateOnly(range.end || todayD);
    return { start: dashAddDays(end, -6), end, days: 7 };
  }
  const start = new Date(range.year, range.month, 1);
  const rawEnd = new Date(range.year, range.month + 1, 0);
  const end = rawEnd > todayD ? dashDateOnly(todayD) : rawEnd;
  return { start, end, days: Math.max(1, Math.floor((end - start) / 86400000) + 1) };
}

function dashboardRangeLabel(range, todayD) {
  const bounds = dashboardRangeBounds(range, todayD);
  if (range.kind === 'day') return `Ngày ${bounds.start.toLocaleDateString('vi-VN')}`;
  if (range.kind === '7days') return `7 ngày ${bounds.start.toLocaleDateString('vi-VN')} - ${bounds.end.toLocaleDateString('vi-VN')}`;
  return `${MONTH_NAMES[range.month]} ${range.year}`;
}

function Dashboard({
  units,
  sold,
  affiliateIncomes,
  includePendingAffiliateInProfit,
  catalogLines,
  today,
  importUnits,
  cancelSale,
  updateNote,
  updateUnit,
  onCreateCategory,
  onCreateLine,
  onCreateVariant,
  onAddAffiliateIncome,
  onUpdateAffiliateIncome,
  onRemoveAffiliateIncome,
  onSetIncludePendingAffiliateInProfit,
  readOnly = false,
}) {
  const todayD = new Date(today);
  const [range, setRange] = useStateD(() => ({
    kind: 'month',
    year: todayD.getFullYear(),
    month: todayD.getMonth(),
  }));
  const [catFilter, setCatFilter] = useStateD('all');
  const [confirmCancel, setConfirmCancel] = useStateD(null);
  const [editingUnit, setEditingUnit] = useStateD(null);
  const [showAnalytics, setShowAnalytics] = useStateD(false);
  const [showAffiliateModal, setShowAffiliateModal] = useStateD(false);
  const [detailedMode, setDetailedMode] = useStateD(false);

  // Format function that toggles between compact (M) and detailed (thousands)
  const fmtAmount = (n, detailed = detailedMode) => {
    if (n === 0) return '0';
    const abs = Math.abs(n);
    const sign = n < 0 ? '-' : '';
    if (detailed) {
      return sign + Math.round(abs).toLocaleString('en-US');
    }
    if (abs >= 1000) return sign + (abs / 1000).toFixed(abs >= 10000 ? 1 : 2).replace(/\.0+$/, '') + 'M';
    return sign + Math.round(abs).toLocaleString('vi-VN');
  };
  const moneyUnit = detailedMode ? 'nghìn đ' : 'đ';
  const toggleMoneyDetail = () => setDetailedMode(prev => !prev);
  const moneyToggleTitle = detailedMode
    ? 'Click để thu gọn số tiền'
    : 'Click để xem chi tiết đến đơn vị nghìn đồng';

  // Range label / sub-title
  const rangeBounds = useMemoD(() => dashboardRangeBounds(range, todayD), [range, today]);
  const rangeLabel = dashboardRangeLabel(range, todayD);

  const inPeriod = (d, r = range) => {
    const { start, end } = dashboardRangeBounds(r, todayD);
    const day = dashDateOnly(d);
    return day >= start && day <= end;
  };


  const filtered = useMemoD(() => {
    return sold.filter(s => {
      const d = new Date(s.sold);
      const inCat = catFilter === 'all' || s.cat === catFilter;
      return inPeriod(d, range) && inCat;
    });
  }, [sold, range, catFilter]);

  const periodAffiliateEntries = useMemoD(() => {
    return (affiliateIncomes || []).filter(entry => inPeriod(new Date(entry.receivedAt), range));
  }, [affiliateIncomes, range]);
  const paidAffiliateEntries = periodAffiliateEntries.filter(entry => entry.status !== 'pending');
  const pendingAffiliateEntries = periodAffiliateEntries.filter(entry => entry.status === 'pending');
  const paidAffiliateIncome = paidAffiliateEntries.reduce((sum, entry) => sum + (+entry.amount || 0), 0);
  const pendingAffiliateIncome = pendingAffiliateEntries.reduce((sum, entry) => sum + (+entry.amount || 0), 0);
  const totalAffiliateIncome = paidAffiliateIncome + pendingAffiliateIncome;
  const affiliateIncomeUsedInProfit = paidAffiliateIncome + (includePendingAffiliateInProfit ? pendingAffiliateIncome : 0);
  const includeAffiliateInProfit = catFilter === 'all';
  const totalRev = filtered.reduce((s, x) => s + x.sell, 0);
  const totalBuy = filtered.reduce((s, x) => s + x.buy, 0);
  const salesProfit = totalRev - totalBuy;
  const totalProfit = salesProfit + (includeAffiliateInProfit ? affiliateIncomeUsedInProfit : 0);
  const profitLabel = !includeAffiliateInProfit
    ? 'Lợi nhuận bán hàng'
    : includePendingAffiliateInProfit && pendingAffiliateIncome > 0
      ? 'Lợi nhuận dự kiến sau AFF'
      : pendingAffiliateIncome > 0
        ? 'Lợi nhuận sau AFF đã trả'
        : 'Lợi nhuận sau AFF';
  const itemsSold = filtered.length;
  const lossCount = filtered.filter(x => x.sell < x.buy).length;
  const avgRatio = totalBuy > 0 ? (totalRev / totalBuy) * 100 : 0;
  const periodEndDate = rangeBounds.end;
  const inventoryValueAt = (date) => units
    .filter(u => {
      const arrived = new Date(u.arrived);
      const soldDate = u.sold ? new Date(u.sold) : null;
      const inCat = catFilter === 'all' || u.cat === catFilter;
      return inCat && arrived <= date && (!soldDate || soldDate > date);
    })
    .reduce((sum, u) => sum + u.buy, 0);
  const currentInventoryValue = inventoryValueAt(periodEndDate);

  // prev period delta ? compare against the immediately previous period with the same length.
  const prevDelta = useMemoD(() => {
    const currentStart = rangeBounds.start;
    const currentEnd = rangeBounds.end;
    const prevEnd = dashAddDays(currentStart, -1);
    const prevStart = dashAddDays(prevEnd, -(rangeBounds.days - 1));
    const inPrevRange = (dateValue) => {
      const d = dashDateOnly(dateValue);
      return d >= prevStart && d <= prevEnd;
    };
    const prev = sold.filter(s => {
      const inCat = catFilter === 'all' || s.cat === catFilter;
      return inPrevRange(s.sold) && inCat;
    });
    const pRev = prev.reduce((s, x) => s + x.sell, 0);
    const pSalesProfit = prev.reduce((s, x) => s + (x.sell - x.buy), 0);
    const pAffiliateIncome = (affiliateIncomes || [])
      .filter(entry => {
        const includedByStatus = entry.status !== 'pending' || includePendingAffiliateInProfit;
        return inPrevRange(entry.receivedAt) && includedByStatus;
      })
      .reduce((sum, entry) => sum + (+entry.amount || 0), 0);
    const pProfit = pSalesProfit + (includeAffiliateInProfit ? pAffiliateIncome : 0);
    const prevInventoryValue = inventoryValueAt(prevEnd);
    return {
      rev:    pRev    !== 0 ? ((totalRev    - pRev)    / Math.abs(pRev))    * 100 : null,
      profit: pProfit !== 0 ? ((totalProfit - pProfit) / Math.abs(pProfit)) * 100 : null,
      items:  prev.length    ? ((itemsSold  - prev.length) / prev.length)   * 100 : null,
      inventory: prevInventoryValue !== 0 ? ((currentInventoryValue - prevInventoryValue) / Math.abs(prevInventoryValue)) * 100 : null,
    };
  }, [sold, rangeBounds, catFilter, totalRev, totalProfit, itemsSold, currentInventoryValue, units, affiliateIncomes, includeAffiliateInProfit, includePendingAffiliateInProfit]);


  // Line chart: bucket by day in the selected range.
  const lineData = useMemoD(() => {
    const buckets = [];
    for (let i = 0; i < rangeBounds.days; i++) {
      const d = dashAddDays(rangeBounds.start, i);
      buckets.push({ date: d, rev: 0, salesProfit: 0, affiliate: 0, profit: 0, inventory: inventoryValueAt(d) });
    }
    filtered.forEach(s => {
      const sd = dashDateOnly(s.sold);
      const idx = buckets.findIndex(b => b.date.getTime() === sd.getTime());
      if (idx >= 0) {
        buckets[idx].rev += s.sell;
        buckets[idx].salesProfit += (s.sell - s.buy);
      }
    });
    if (includeAffiliateInProfit) {
      periodAffiliateEntries
        .filter(entry => entry.status !== 'pending' || includePendingAffiliateInProfit)
        .forEach(entry => {
          const receivedAt = dashDateOnly(entry.receivedAt);
          const idx = buckets.findIndex(b => b.date.getTime() === receivedAt.getTime());
          if (idx >= 0) buckets[idx].affiliate += (+entry.amount || 0);
        });
    }
    buckets.forEach(bucket => {
      bucket.profit = bucket.salesProfit + bucket.affiliate;
    });
    return {
      days: buckets.map(b => `${b.date.getDate()}/${b.date.getMonth() + 1}`),
      rev: buckets.map(b => b.rev),
      salesProfit: buckets.map(b => b.salesProfit),
      affiliate: buckets.map(b => b.affiliate),
      profit: buckets.map(b => b.profit),
      inventory: buckets.map(b => b.inventory),
    };
  }, [filtered, rangeBounds, units, catFilter, periodAffiliateEntries, includeAffiliateInProfit, includePendingAffiliateInProfit]);


  // Bar chart: profit by CATEGORY (already aggregated correctly)
  const profitByCat = useMemoD(() => {
    const map = {};
    filtered.forEach(s => {
      map[s.cat] = (map[s.cat] || 0) + (s.sell - s.buy);
    });
    return window.CATEGORIES
      .map(c => ({ label: c.name, value: map[c.id] || 0, color: c.color }))
      .filter(d => d.value !== 0)
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  // Ratio by category for the gauge KPI's mini-breakdown
  const ratioByCat = useMemoD(() => {
    const map = {};
    filtered.forEach(s => {
      if (!map[s.cat]) map[s.cat] = { buy: 0, sell: 0 };
      map[s.cat].buy += s.buy;
      map[s.cat].sell += s.sell;
    });
    return window.CATEGORIES
      .map(c => ({ ...c, ratio: map[c.id] ? (map[c.id].sell / map[c.id].buy) * 100 : null }))
      .filter(c => c.ratio !== null)
      .sort((a, b) => b.ratio - a.ratio);
  }, [filtered]);

  // Counts per category, scoped to current time period only (for picker badges)
  const catCounts = useMemoD(() => {
    const inPeriodSales = sold.filter(s => inPeriod(new Date(s.sold), range));
    const m = { all: inPeriodSales.length };
    inPeriodSales.forEach(s => { m[s.cat] = (m[s.cat] || 0) + 1; });
    return m;
  }, [sold, range]);
  const usedCategoryIds = useMemoD(() => new Set(units.map(unit => unit.cat)), [units]);
  const visibleCategories = useMemoD(
    () => window.CATEGORIES.filter(category => usedCategoryIds.has(category.id)),
    [usedCategoryIds]
  );

  const timelinePoints = useMemoD(() => [
    ...sold.map(s => ({ date: s.sold })),
    ...(affiliateIncomes || []).map(entry => ({ date: entry.receivedAt })),
  ], [sold, affiliateIncomes]);
  const currentInventory = useMemoD(() => (
    units.filter(u => u.status === 'in_stock' && (catFilter === 'all' || u.cat === catFilter))
  ), [units, catFilter]);
  const revenueByCat = useMemoD(() => {
    const map = {};
    filtered.forEach(s => {
      map[s.cat] = (map[s.cat] || 0) + s.sell;
    });
    return window.CATEGORIES
      .map(c => ({ label: c.name, value: map[c.id] || 0, color: c.color }))
      .filter(d => d.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [filtered]);
  const topProducts = useMemoD(() => {
    const map = {};
    filtered.forEach(s => {
      const key = `${s.name}__${s.cat}`;
      if (!map[key]) {
        map[key] = { key, name: s.name, cat: s.cat, qty: 0, revenue: 0, profit: 0 };
      }
      map[key].qty += 1;
      map[key].revenue += s.sell;
      map[key].profit += s.sell - s.buy;
    });
    return Object.values(map)
      .sort((a, b) => b.revenue - a.revenue || b.qty - a.qty)
      .slice(0, 8);
  }, [filtered]);
  const slowInventory = useMemoD(() => currentInventory
    .map(u => ({
      ...u,
      daysInStock: Math.max(0, Math.floor((todayD - new Date(u.arrived)) / 86400000)),
    }))
    .sort((a, b) => b.daysInStock - a.daysInStock || b.buy - a.buy)
    .slice(0, 8), [currentInventory, today]);
  const recentSales = useMemoD(() => filtered
    .slice()
    .sort((a, b) => new Date(b.sold) - new Date(a.sold))
    .slice(0, 8), [filtered]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title"><span className="accent"></span>Tổng quan kinh doanh</h1>
          <div className="page-sub">
            Cập nhật realtime · {todayD.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        <div className="page-controls">
          <ImportDataButton today={today} onImport={importUnits} disabled={readOnly} />
          <ExportDataButton units={units} today={today} />
          <CategoryPicker value={catFilter} onChange={setCatFilter} counts={catCounts} categories={visibleCategories} />
          <DateRangePicker value={range} onChange={setRange} dataPoints={timelinePoints} today={today} />
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <div
          className="kpi kpi-money-toggle"
          onClick={toggleMoneyDetail}
          title={moneyToggleTitle}
        >
          <div className="kpi-label">Doanh thu</div>
          <div className={`kpi-value mono ${detailedMode ? 'detailed' : ''}`}>{fmtAmount(totalRev)}<span className="unit">{moneyUnit}</span></div>
          <div className="kpi-delta">
            {prevDelta.rev !== null ? (
              <>
                <span className={prevDelta.rev >= 0 ? 'up' : 'down'}>
                  {prevDelta.rev >= 0 ? '▲' : '▼'} {Math.abs(prevDelta.rev).toFixed(1)}%
                </span>
                <span>so với kỳ trước</span>
              </>
            ) : (
              <span style={{ color: 'var(--muted-2)' }}>— kỳ trước chưa có dữ liệu</span>
            )}
          </div>
          <div className="kpi-spark"><Sparkline data={lineData.rev} color="#e11d48" /></div>
        </div>

        <div
          className="kpi green kpi-money-toggle"
          onClick={toggleMoneyDetail}
          title={moneyToggleTitle}
        >
          <div className="kpi-label">{profitLabel}</div>
          <div className={`kpi-value mono ${detailedMode ? 'detailed' : ''}`} style={{ color: totalProfit >= 0 ? '#10b981' : '#e11d48' }}>
            {totalProfit < 0 ? '−' : ''}{fmtAmount(Math.abs(totalProfit))}<span className="unit">{moneyUnit}</span>
          </div>
          <div className="kpi-delta">
            {prevDelta.profit !== null ? (
              <>
                <span className={prevDelta.profit >= 0 ? 'up' : 'down'}>
                  {prevDelta.profit >= 0 ? '▲' : '▼'} {Math.abs(prevDelta.profit).toFixed(1)}%
                </span>
                <span>so với kỳ trước</span>
              </>
            ) : (
              <span style={{ color: 'var(--muted-2)' }}>— kỳ trước chưa có dữ liệu</span>
            )}
          </div>
          <div className="kpi-spark"><Sparkline data={lineData.profit} color="#10b981" /></div>
        </div>

        <div
          className="kpi aff"
          onClick={() => setShowAffiliateModal(true)}
          title="Quản lý các khoản hoa hồng AFF trong tháng"
        >
          <div className="kpi-label">Hoa hồng AFF</div>
          {periodAffiliateEntries.length > 0 ? (
            <>
              <div className={`kpi-value mono ${detailedMode ? 'detailed' : ''}`}>
                {fmtAmount(totalAffiliateIncome)}<span className="unit">{moneyUnit}</span>
              </div>
              <div className="kpi-delta">
                <span className="aff-chip paid">Đã trả {fmtAmount(paidAffiliateIncome)}</span>
                <span className="aff-chip pending">Chờ {fmtAmount(pendingAffiliateIncome)}</span>
              </div>
            </>
          ) : (
            <button type="button" className="aff-empty-btn" disabled={readOnly}>
              Nhập AFF
            </button>
          )}
          <label className={`aff-profit-toggle ${includePendingAffiliateInProfit ? 'active' : ''}`} onClick={e => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={includePendingAffiliateInProfit}
              onChange={e => onSetIncludePendingAffiliateInProfit(e.target.checked)}
              disabled={readOnly}
            />
            <span>Tính cả AFF đang chờ vào lãi</span>
          </label>
          {!includeAffiliateInProfit && (
            <div className="aff-filter-note">AFF chỉ cộng vào lãi khi xem tất cả danh mục</div>
          )}
        </div>

        <div className="kpi amber">
          <div className="kpi-label">Đã bán / Lỗ</div>
          <div className="kpi-value mono">
            {itemsSold}<span className="unit">đơn</span>
            {lossCount > 0 && (
              <span style={{ fontSize: 14, color: '#e11d48', marginLeft: 10, fontWeight: 700 }}>
                · {lossCount} lỗ
              </span>
            )}
          </div>
          <div className="kpi-delta">
            {prevDelta.items !== null ? (
              <>
                <span className={prevDelta.items >= 0 ? 'up' : 'down'}>
                  {prevDelta.items >= 0 ? '▲' : '▼'} {Math.abs(prevDelta.items).toFixed(1)}%
                </span>
                <span>số đơn so với kỳ trước</span>
              </>
            ) : (
              <span style={{ color: 'var(--muted-2)' }}>— kỳ trước chưa có dữ liệu</span>
            )}
          </div>
        </div>

        <div
          className="kpi blue kpi-money-toggle"
          onClick={toggleMoneyDetail}
          title={moneyToggleTitle}
        >
          <div className="kpi-label">Vốn hàng tồn</div>
          <div className={`kpi-value mono ${detailedMode ? 'detailed' : ''}`}>{fmtAmount(currentInventoryValue)}<span className="unit">{moneyUnit}</span></div>
          <div className="kpi-delta">
            {prevDelta.inventory !== null ? (
              <>
                <span className={prevDelta.inventory >= 0 ? 'up' : 'down'}>
                  {prevDelta.inventory >= 0 ? '▲' : '▼'} {Math.abs(prevDelta.inventory).toFixed(1)}%
                </span>
                <span>so với cuối kỳ trước</span>
              </>
            ) : (
              <span style={{ color: 'var(--muted-2)' }}>— kỳ trước chưa có dữ liệu</span>
            )}
          </div>
          <div className="kpi-spark"><Sparkline data={lineData.inventory} color="#2563eb" /></div>
        </div>

        <div className="kpi purple">
          <div className="kpi-label">Tỉ lệ bán / mua trung bình</div>
          <div className="kpi-gauge" style={{ marginTop: 6 }}>
            <Gauge value={avgRatio} label="bán/mua" />
            <div>
              <div style={{ fontSize: 10, color: '#9a9aae', fontWeight: 800, letterSpacing: '0.08em' }}>
                {!includeAffiliateInProfit
                  ? 'BIÊN LỢI NHUẬN'
                  : includePendingAffiliateInProfit && pendingAffiliateIncome > 0
                    ? 'BIÊN LÃI DỰ KIẾN'
                    : 'BIÊN LÃI SAU AFF'}
              </div>
              <div className="mono" style={{ fontSize: 18, fontWeight: 800, color: totalProfit >= 0 ? '#10b981' : '#e11d48', marginTop: 4 }}>
                {totalRev > 0 ? ((totalProfit / totalRev) * 100).toFixed(1) : 0}%
              </div>
              <div style={{ fontSize: 11, color: '#9a9aae', marginTop: 6, fontWeight: 600 }}>
                Vốn{' '}
                <button
                  type="button"
                  className="inline-money-toggle mono"
                  onClick={toggleMoneyDetail}
                  title={moneyToggleTitle}
                >
                  {fmtAmount(totalBuy)} {moneyUnit}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="charts-row">
        <div className="card">
          <div className="card-head">
            <div>
              <button className="card-title analytics-title-btn" onClick={() => setShowAnalytics(true)}>
                Doanh thu & {profitLabel}
              </button>
              <div className="card-sub">Theo ngày · {rangeLabel}</div>
            </div>
            <div className="legend">
              <span><i className="swatch" style={{ background: '#e11d48' }}></i>Doanh thu</span>
              <span><i className="swatch" style={{ background: '#10b981' }}></i>{profitLabel}</span>
            </div>
          </div>
          <div className="card-body">
            <LineChart
              series={[
                { name: 'Doanh thu', color: '#e11d48', data: lineData.rev },
                { name: profitLabel, color: '#10b981', data: lineData.profit },
              ]}
              days={lineData.days}
            />
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Lợi nhuận bán hàng theo danh mục</div>
              <div className="card-sub">Tính theo phân loại · nghìn đồng</div>
            </div>
          </div>
          <div className="card-body" style={{ paddingTop: 6 }}>
            {profitByCat.length > 0 ? (
              <BarChart data={profitByCat} height={240} />
            ) : (
              <div className="empty">Chưa có giao dịch trong kỳ này</div>
            )}
          </div>
        </div>
      </div>

      {/* Ratio by category strip */}
      {ratioByCat.length > 0 && (
        <div className="charts-row" style={{ gridTemplateColumns: '1fr' }}>
          <div className="card">
            <div className="card-head">
              <div>
                <div className="card-title">Tỉ lệ bán/mua theo danh mục</div>
                <div className="card-sub">So sánh hiệu suất từng nhóm sản phẩm</div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${ratioByCat.length}, 1fr)`, gap: 1, background: 'var(--border-soft)' }}>
              {ratioByCat.map(c => {
                const color = c.ratio >= 130 ? '#10b981' : c.ratio >= 110 ? '#f59e0b' : c.ratio >= 100 ? '#ff6a3d' : '#e11d48';
                return (
                  <div key={c.id} style={{ background: '#fff', padding: '16px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      <i style={{ width: 8, height: 8, background: c.color, display: 'inline-block' }}></i>
                      {c.name}
                    </div>
                    <div className="mono" style={{ fontSize: 22, fontWeight: 800, marginTop: 6, color }}>{c.ratio.toFixed(1)}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Transactions table */}
      <div className="card tbl-card">
        <div className="card-head">
          <div>
            <div className="card-title">Sổ giao dịch đã bán</div>
            <div className="card-sub">{filtered.length} đơn hàng · giá theo nghìn đồng</div>
          </div>
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Mã GD</th>
                <th>Sản phẩm</th>
                <th>Danh mục</th>
                <th className="num">Giá mua</th>
                <th className="num">Giá bán</th>
                <th>Ngày về</th>
                <th>Ngày bán</th>
                <th className="num">Lợi nhuận</th>
                <th>Tỉ lệ</th>
                <th>Ghi chú</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .slice()
                .sort((a, b) => new Date(b.sold) - new Date(a.sold))
                .map(s => {
                  const profit = s.sell - s.buy;
                  const ratio = (s.sell / s.buy) * 100;
                  const isLoss = profit < 0;
                  return (
                    <tr key={s.id}>
                      <td className="mono txn-code">{s.transactionCode}</td>
                      <td>
                        <div style={{ minWidth: 200 }}>
                          <div style={{ fontWeight: 700 }}>{s.name}</div>
                          {s.variant && <span className="variant">{s.variant}</span>}
                        </div>
                      </td>
                      <td><CatPill cat={s.cat} /></td>
                      <td className="num mono">{s.buy.toLocaleString('vi-VN')}</td>
                      <td className="num mono" style={{ fontWeight: 700 }}>{s.sell.toLocaleString('vi-VN')}</td>
                      <td className="mono" style={{ color: '#6b6b80', fontSize: 12 }}>
                        {new Date(s.arrived).toLocaleDateString('vi-VN')}
                      </td>
                      <td className="mono" style={{ fontSize: 12, fontWeight: 600 }}>
                        {new Date(s.sold).toLocaleDateString('vi-VN')}
                      </td>
                      <td className={`num mono ${isLoss ? 'profit-neg' : profit > 0 ? 'profit-pos' : 'profit-zero'}`}>
                        {isLoss ? '−' : profit > 0 ? '+' : ''}{Math.abs(profit).toLocaleString('vi-VN')}
                        {isLoss && <span className="loss-tag">LỖ</span>}
                      </td>
                      <td><RateBar pct={ratio} /></td>
                      <td>
                        <textarea
                          className="note-input"
                          value={s.note || ''}
                          placeholder="thêm ghi chú..."
                          onChange={e => updateNote(s.id, e.target.value)}
                          disabled={readOnly}
                        />
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="ctl ghost sm" onClick={() => setEditingUnit(s)} disabled={readOnly}>
                            SỬA
                          </button>
                          <button className="ctl danger sm" onClick={() => setConfirmCancel(s)} title="Huỷ giao dịch, trả về kho" disabled={readOnly}>
                            ↺ HUỶ
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              {filtered.length === 0 && (
                <tr><td colSpan="11" className="empty">Không có giao dịch trong kỳ đang xem</td></tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3">TỔNG ({filtered.length} đơn)</td>
                <td className="num mono">{totalBuy.toLocaleString('vi-VN')}</td>
                <td className="num mono">{totalRev.toLocaleString('vi-VN')}</td>
                <td colSpan="2"></td>
                <td className={`num mono ${salesProfit >= 0 ? 'profit-pos' : 'profit-neg'}`}>
                  {salesProfit < 0 ? '−' : '+'}{Math.abs(salesProfit).toLocaleString('vi-VN')}
                </td>
                <td className="mono" style={{ color: salesProfit >= 0 ? '#10b981' : '#e11d48', fontWeight: 800 }}>
                  {avgRatio.toFixed(1)}%
                </td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {confirmCancel && (
        <ConfirmCancelModal
          unit={confirmCancel}
          onClose={() => setConfirmCancel(null)}
          onConfirm={() => { cancelSale(confirmCancel.id); setConfirmCancel(null); }}
        />
      )}
      {editingUnit && (
        <EditUnitModal
          unit={editingUnit}
          catalogLines={catalogLines}
          today={today}
          onCreateCategory={onCreateCategory}
          onCreateLine={onCreateLine}
          onCreateVariant={onCreateVariant}
          onClose={() => setEditingUnit(null)}
          onSave={(id, patch) => {
            updateUnit(id, patch);
            setEditingUnit(null);
          }}
        />
      )}
      {showAnalytics && (
        <SalesAnalyticsModal
          rangeLabel={rangeLabel}
          totalRev={totalRev}
          totalProfit={totalProfit}
          salesProfit={salesProfit}
          profitLabel={profitLabel}
          affiliateEntries={periodAffiliateEntries}
          totalAffiliateIncome={totalAffiliateIncome}
          paidAffiliateIncome={paidAffiliateIncome}
          pendingAffiliateIncome={pendingAffiliateIncome}
          affiliateIncomeUsedInProfit={affiliateIncomeUsedInProfit}
          includeAffiliateInProfit={includeAffiliateInProfit}
          includePendingAffiliateInProfit={includePendingAffiliateInProfit}
          totalBuy={totalBuy}
          itemsSold={itemsSold}
          lossCount={lossCount}
          avgRatio={avgRatio}
          currentInventoryValue={currentInventoryValue}
          currentInventory={currentInventory}
          lineData={lineData}
          profitByCat={profitByCat}
          revenueByCat={revenueByCat}
          ratioByCat={ratioByCat}
          topProducts={topProducts}
          slowInventory={slowInventory}
          recentSales={recentSales}
          onClose={() => setShowAnalytics(false)}
        />
      )}
      {showAffiliateModal && (
        <AffiliateIncomeModal
          entries={periodAffiliateEntries}
          range={range}
          rangeLabel={rangeLabel}
          today={today}
          readOnly={readOnly}
          onAdd={onAddAffiliateIncome}
          onUpdate={onUpdateAffiliateIncome}
          onDelete={onRemoveAffiliateIncome}
          onClose={() => setShowAffiliateModal(false)}
        />
      )}
    </div>
  );
}

function SalesAnalyticsModal({
  rangeLabel,
  totalRev,
  totalProfit,
  salesProfit,
  profitLabel,
  affiliateEntries,
  totalAffiliateIncome,
  paidAffiliateIncome,
  pendingAffiliateIncome,
  affiliateIncomeUsedInProfit,
  includeAffiliateInProfit,
  includePendingAffiliateInProfit,
  totalBuy,
  itemsSold,
  lossCount,
  avgRatio,
  currentInventoryValue,
  currentInventory,
  lineData,
  profitByCat,
  revenueByCat,
  ratioByCat,
  topProducts,
  slowInventory,
  recentSales,
  onClose,
}) {
  const avgOrderValue = itemsSold > 0 ? totalRev / itemsSold : 0;
  const margin = totalRev > 0 ? (totalProfit / totalRev) * 100 : 0;

  return (
    <div className="modal-bg analytics-modal-bg" onClick={onClose}>
      <div className="modal analytics-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head analytics-head">
          <div>
            <div className="modal-title"><span className="accent"></span>TRUNG TÂM PHÂN TÍCH BÁN HÀNG</div>
            <div className="card-sub">Theo tháng bán · {rangeLabel}</div>
          </div>
          <button className="close-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body analytics-body">
          <div className="analytics-kpi-grid">
            <AnalyticsMetric label="Doanh thu" value={`${window.fmtK(totalRev)}đ`} tone="red" />
            <AnalyticsMetric label={profitLabel} value={`${totalProfit < 0 ? '−' : '+'}${window.fmtK(Math.abs(totalProfit))}đ`} tone={totalProfit >= 0 ? 'green' : 'red'} />
            <AnalyticsMetric
              label="Hoa hồng AFF"
              value={affiliateEntries.length > 0 ? `${window.fmtK(totalAffiliateIncome)}đ` : '—'}
              sub={`Đã trả ${window.fmtK(paidAffiliateIncome)}đ · Chờ ${window.fmtK(pendingAffiliateIncome)}đ`}
              tone="blue"
            />
            <AnalyticsMetric label="Đơn đã bán" value={`${itemsSold}`} sub={`${lossCount} đơn lỗ`} tone="amber" />
            <AnalyticsMetric label="Giá trị đơn TB" value={`${window.fmtK(avgOrderValue)}đ`} sub={`Vốn bán ${window.fmtK(totalBuy)}đ`} tone="purple" />
            <AnalyticsMetric
              label={!includeAffiliateInProfit
                ? 'Biên lợi nhuận'
                : includePendingAffiliateInProfit && pendingAffiliateIncome > 0
                  ? 'Biên lãi dự kiến'
                  : 'Biên lãi sau AFF'}
              value={`${margin.toFixed(1)}%`}
              sub={`AFF tính vào lãi ${window.fmtK(affiliateIncomeUsedInProfit)}đ`}
              tone="green"
            />
            <AnalyticsMetric label="Vốn tồn cuối kỳ" value={`${window.fmtK(currentInventoryValue)}đ`} sub={`${currentInventory.length} món đang tồn`} tone="blue" />
          </div>

          <div className="analytics-grid two">
            <AnalyticsPanel title={`Doanh thu & ${profitLabel.toLowerCase()} theo ngày`} subtitle={rangeLabel}>
              <LineChart
                series={[
                  { name: 'Doanh thu', color: '#e11d48', data: lineData.rev },
                  { name: profitLabel, color: '#10b981', data: lineData.profit },
                ]}
                days={lineData.days}
              />
            </AnalyticsPanel>
            <AnalyticsPanel title="Vốn tồn theo ngày" subtitle="Giá trị kho tại từng ngày">
              <LineChart
                series={[
                  { name: 'Vốn tồn', color: '#2563eb', data: lineData.inventory },
                ]}
                days={lineData.days}
              />
            </AnalyticsPanel>
          </div>

          <div className="analytics-grid two">
            <AnalyticsPanel title="Lợi nhuận bán hàng theo danh mục" subtitle="Nhóm nào đang tạo tiền từ đơn bán">
              {profitByCat.length > 0 ? <BarChart data={profitByCat} height={220} /> : <div className="empty">Chưa có giao dịch trong kỳ này</div>}
            </AnalyticsPanel>
            <AnalyticsPanel title="Cơ cấu doanh thu" subtitle="Tỷ trọng theo danh mục">
              {revenueByCat.length > 0 ? (
                <div className="analytics-donut-wrap">
                  <Donut data={revenueByCat} size={170} />
                  <div className="analytics-legend-list">
                    {revenueByCat.map(item => (
                      <div key={item.label}>
                        <span><i style={{ background: item.color }}></i>{item.label}</span>
                        <strong>{window.fmtK(item.value)}đ</strong>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty">Chưa có doanh thu trong kỳ này</div>
              )}
            </AnalyticsPanel>
          </div>

          {ratioByCat.length > 0 && (
            <AnalyticsPanel title="Hiệu suất bán / mua theo danh mục" subtitle="Nhìn nhanh nhóm nào có tỷ lệ khỏe">
              <div className="analytics-ratio-grid">
                {ratioByCat.map(c => {
                  const color = c.ratio >= 130 ? '#10b981' : c.ratio >= 110 ? '#f59e0b' : c.ratio >= 100 ? '#ff6a3d' : '#e11d48';
                  return (
                    <div key={c.id}>
                      <span><i style={{ background: c.color }}></i>{c.name}</span>
                      <strong style={{ color }}>{c.ratio.toFixed(1)}%</strong>
                    </div>
                  );
                })}
              </div>
            </AnalyticsPanel>
          )}

          <div className="analytics-grid tables">
            <AnalyticsPanel title="Thu nhập AFF" subtitle="Đã thanh toán và đang chờ về">
              <table className="tbl analytics-table">
                <thead>
                  <tr><th>Ngày ghi nhận</th><th>Trạng thái</th><th className="num">Số tiền</th><th>Ghi chú</th></tr>
                </thead>
                <tbody>
                  {affiliateEntries
                    .slice()
                    .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
                    .map(entry => (
                      <tr key={entry.id}>
                        <td className="mono">{new Date(entry.receivedAt).toLocaleDateString('vi-VN')}</td>
                        <td><AffiliateStatusPill status={entry.status} /></td>
                        <td className="num mono profit-pos">+{(+entry.amount || 0).toLocaleString('vi-VN')}</td>
                        <td>{entry.note || '—'}</td>
                      </tr>
                    ))}
                  {affiliateEntries.length === 0 && <tr><td colSpan="4" className="empty">Tháng này chưa có khoản AFF</td></tr>}
                </tbody>
              </table>
            </AnalyticsPanel>

            <AnalyticsPanel title="Top sản phẩm" subtitle="Theo doanh thu tháng">
              <table className="tbl analytics-table">
                <thead>
                  <tr><th>Sản phẩm</th><th className="num">SL</th><th className="num">Doanh thu</th><th className="num">Lợi nhuận</th></tr>
                </thead>
                <tbody>
                  {topProducts.map(item => (
                    <tr key={item.key}>
                      <td>{item.name}</td>
                      <td className="num mono">{item.qty}</td>
                      <td className="num mono">{item.revenue.toLocaleString('vi-VN')}</td>
                      <td className={`num mono ${item.profit >= 0 ? 'profit-pos' : 'profit-neg'}`}>
                        {item.profit < 0 ? '−' : '+'}{Math.abs(item.profit).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  ))}
                  {topProducts.length === 0 && <tr><td colSpan="4" className="empty">Chưa có đơn bán trong kỳ này</td></tr>}
                </tbody>
              </table>
            </AnalyticsPanel>

            <AnalyticsPanel title="Tồn kho cần chú ý" subtitle="Món nằm kho lâu nhất hiện tại">
              <table className="tbl analytics-table">
                <thead>
                  <tr><th>Sản phẩm</th><th className="num">Ngày tồn</th><th className="num">Vốn</th></tr>
                </thead>
                <tbody>
                  {slowInventory.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div>{item.name}</div>
                        {item.variant && <span className="variant">{item.variant}</span>}
                      </td>
                      <td className="num mono">{item.daysInStock}</td>
                      <td className="num mono">{item.buy.toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                  {slowInventory.length === 0 && <tr><td colSpan="3" className="empty">Kho đang trống</td></tr>}
                </tbody>
              </table>
            </AnalyticsPanel>

            <AnalyticsPanel title="Giao dịch gần nhất" subtitle="Trong tháng đang xem">
              <table className="tbl analytics-table">
                <thead>
                  <tr><th>Mã GD</th><th>Sản phẩm</th><th>Ngày bán</th><th className="num">Lãi</th></tr>
                </thead>
                <tbody>
                  {recentSales.map(item => {
                    const profit = item.sell - item.buy;
                    return (
                      <tr key={item.id}>
                        <td className="mono txn-code">{item.transactionCode}</td>
                        <td>{item.name}</td>
                        <td className="mono">{new Date(item.sold).toLocaleDateString('vi-VN')}</td>
                        <td className={`num mono ${profit >= 0 ? 'profit-pos' : 'profit-neg'}`}>
                          {profit < 0 ? '−' : '+'}{Math.abs(profit).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    );
                  })}
                  {recentSales.length === 0 && <tr><td colSpan="4" className="empty">Chưa có giao dịch trong kỳ này</td></tr>}
                </tbody>
              </table>
            </AnalyticsPanel>
          </div>
        </div>
      </div>
    </div>
  );
}

function AnalyticsMetric({ label, value, sub, tone }) {
  return (
    <div className={`analytics-metric ${tone || ''}`}>
      <div>{label}</div>
      <strong className="mono">{value}</strong>
      {sub && <span>{sub}</span>}
    </div>
  );
}

function AnalyticsPanel({ title, subtitle, children }) {
  return (
    <div className="card analytics-panel">
      <div className="card-head">
        <div>
          <div className="card-title">{title}</div>
          {subtitle && <div className="card-sub">{subtitle}</div>}
        </div>
      </div>
      <div className="card-body">{children}</div>
    </div>
  );
}

function defaultAffiliateDate(range, today) {
  const todayD = dashDateOnly(today);
  const { start, end } = dashboardRangeBounds(range, todayD);
  if (todayD >= start && todayD <= end) return dashDateIso(todayD);
  return dashDateIso(start);
}


function AffiliateStatusPill({ status }) {
  const pending = status === 'pending';
  return (
    <span className={`aff-status ${pending ? 'pending' : 'paid'}`}>
      {pending ? 'Đang chờ về' : 'Đã thanh toán'}
    </span>
  );
}

function AffiliateIncomeModal({
  entries,
  range,
  rangeLabel,
  today,
  readOnly,
  onAdd,
  onUpdate,
  onDelete,
  onClose,
}) {
  const affBounds = dashboardRangeBounds(range, dashDateOnly(today));
  const monthStart = dashDateIso(affBounds.start);
  const monthEnd = dashDateIso(affBounds.end);
  const emptyForm = () => ({
    amount: '',
    receivedAt: defaultAffiliateDate(range, today),
    status: 'pending',
    note: '',
  });
  const [form, setForm] = useStateD(emptyForm);
  const [editingId, setEditingId] = useStateD(null);
  const total = entries.reduce((sum, entry) => sum + (+entry.amount || 0), 0);
  const paidTotal = entries
    .filter(entry => entry.status !== 'pending')
    .reduce((sum, entry) => sum + (+entry.amount || 0), 0);
  const pendingTotal = entries
    .filter(entry => entry.status === 'pending')
    .reduce((sum, entry) => sum + (+entry.amount || 0), 0);
  const orderedEntries = entries
    .slice()
    .sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
  const valid = +form.amount > 0 && form.receivedAt;

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm());
  };
  const save = () => {
    if (!valid || readOnly) return;
    const payload = {
      amount: +form.amount,
      receivedAt: form.receivedAt,
      status: form.status,
      note: form.note,
    };
    if (editingId) onUpdate(editingId, payload);
    else onAdd(payload);
    resetForm();
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal affiliate-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title"><span className="accent"></span>THU NHẬP AFF</div>
            <div className="card-sub">{rangeLabel} · lưu từng khoản AFF riêng</div>
          </div>
          <button className="close-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="affiliate-summary">
            <div>
              <span>Tổng AFF tháng</span>
              <strong className="mono">{entries.length > 0 ? `${window.fmtK(total)}đ` : '—'}</strong>
            </div>
            <div>
              <span>Đã thanh toán</span>
              <strong className="mono">{window.fmtK(paidTotal)}đ</strong>
            </div>
            <div>
              <span>Đang chờ về</span>
              <strong className="mono">{window.fmtK(pendingTotal)}đ</strong>
            </div>
          </div>

          <div className="field-row four affiliate-form-row">
            <div className="field">
              <label>Số tiền AFF (nghìn)</label>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={e => setForm(prev => ({ ...prev, amount: e.target.value }))}
                disabled={readOnly}
                placeholder="vd. 1250"
              />
            </div>
            <div className="field">
              <label>Ngày ghi nhận</label>
              <input
                type="date"
                value={form.receivedAt}
                min={monthStart}
                max={monthEnd}
                onChange={e => setForm(prev => ({ ...prev, receivedAt: e.target.value }))}
                disabled={readOnly}
              />
            </div>
            <div className="field">
              <label>Trạng thái</label>
              <select
                value={form.status}
                onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                disabled={readOnly}
              >
                <option value="pending">Đang chờ về</option>
                <option value="paid">Đã thanh toán</option>
              </select>
            </div>
            <div className="field affiliate-save-field">
              <label>&nbsp;</label>
              <div className="row-actions">
                {editingId && <button className="ctl ghost" onClick={resetForm}>HUỶ SỬA</button>}
                <button className="ctl primary" onClick={save} disabled={!valid || readOnly}>
                  {editingId ? 'LƯU AFF' : '+ NHẬP AFF'}
                </button>
              </div>
            </div>
          </div>
          <div className="field">
            <label>Ghi chú</label>
            <textarea
              value={form.note}
              onChange={e => setForm(prev => ({ ...prev, note: e.target.value }))}
              disabled={readOnly}
              placeholder="vd. TikTok Shop đợt 1..."
            />
          </div>

          <div className="tbl-wrap affiliate-table-wrap">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Ngày ghi nhận</th>
                  <th>Trạng thái</th>
                  <th className="num">Số tiền</th>
                  <th>Ghi chú</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orderedEntries.map(entry => (
                  <tr key={entry.id}>
                    <td className="mono">{new Date(entry.receivedAt).toLocaleDateString('vi-VN')}</td>
                    <td><AffiliateStatusPill status={entry.status} /></td>
                    <td className="num mono profit-pos">+{(+entry.amount || 0).toLocaleString('vi-VN')}</td>
                    <td>{entry.note || '—'}</td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="ctl ghost sm"
                          disabled={readOnly}
                          onClick={() => {
                            setEditingId(entry.id);
                            setForm({
                              amount: entry.amount,
                              receivedAt: entry.receivedAt,
                              status: entry.status === 'pending' ? 'pending' : 'paid',
                              note: entry.note || '',
                            });
                          }}
                        >
                          SỬA
                        </button>
                        <button
                          className="ctl danger sm"
                          disabled={readOnly}
                          onClick={() => {
                            if (confirm('Xoá khoản AFF này?')) onDelete(entry.id);
                          }}
                        >
                          XOÁ
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {orderedEntries.length === 0 && (
                  <tr><td colSpan="5" className="empty">Tháng này chưa có khoản AFF nào. Hãy nhập khoản đầu tiên ở phía trên.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="modal-foot">
          <button className="ctl ghost" onClick={onClose}>ĐÓNG</button>
        </div>
      </div>
    </div>
  );
}

function ConfirmCancelModal({ unit, onClose, onConfirm }) {
  const profit = unit.sell - unit.buy;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-head">
          <div className="modal-title"><span className="accent"></span>HUỶ GIAO DỊCH</div>
          <button className="close-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <p style={{ margin: '0 0 14px', fontSize: 14, color: 'var(--text-2)', lineHeight: 1.5 }}>
            Huỷ giao dịch này sẽ <strong>trả sản phẩm về kho hàng</strong> và xoá khỏi sổ doanh thu.
          </p>
          <div className="unit-summary">
            <div className="row">
              <span className="lbl">Mã GD</span>
              <span className="mono" style={{ fontWeight: 700 }}>{unit.transactionCode}</span>
            </div>
            <div className="row">
              <span className="lbl">Sản phẩm</span>
              <span style={{ fontWeight: 700 }}>{unit.name}{unit.variant ? ` · ${unit.variant}` : ''}</span>
            </div>
            <div className="row">
              <span className="lbl">Giá bán</span>
              <span className="mono" style={{ fontWeight: 700 }}>{unit.sell.toLocaleString('vi-VN')}K</span>
            </div>
            <div className="row">
              <span className="lbl">Lợi nhuận sẽ bị xoá</span>
              <span className={`mono ${profit >= 0 ? 'profit-pos' : 'profit-neg'}`}>
                {profit < 0 ? '−' : '+'}{Math.abs(profit).toLocaleString('vi-VN')}K
              </span>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="ctl ghost" onClick={onClose}>QUAY LẠI</button>
          <button className="ctl primary" onClick={onConfirm}>XÁC NHẬN HUỶ</button>
        </div>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
window.CatPill = CatPill;

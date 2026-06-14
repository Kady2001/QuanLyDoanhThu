// Inventory — list of individual in-stock units

const { useState: useStateI, useMemo: useMemoI, useEffect: useEffectI, useRef: useRefI } = React;

function formatLocalDateInput(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function defaultArrivalDate(now = new Date()) {
  const date = new Date(now);
  if (date.getHours() < 6) date.setDate(date.getDate() - 1);
  return formatLocalDateInput(date);
}

function InventoryNoteInput({ value, placeholder, disabled, onCommit }) {
  const [draft, setDraft] = useStateI(value || '');
  const committedRef = useRefI(value || '');
  const timerRef = useRefI(null);
  const mountedRef = useRefI(false);

  useEffectI(() => {
    const next = value || '';
    committedRef.current = next;
    setDraft(next);
  }, [value]);

  const flush = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    if (disabled || draft === committedRef.current) return;
    committedRef.current = draft;
    onCommit(draft);
  };

  useEffectI(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return undefined;
    }
    if (disabled || draft === committedRef.current) return undefined;
    timerRef.current = setTimeout(flush, 350);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [draft, disabled]);

  return (
    <textarea
      className="note-input"
      value={draft}
      placeholder={placeholder}
      onChange={e => setDraft(e.target.value)}
      onBlur={flush}
      disabled={disabled}
    />
  );
}

function Inventory({
  units,
  inStock,
  catalogLines,
  sellUnit,
  updateNote,
  updateUnit,
  addUnit,
  importUnits,
  removeUnit,
  today,
  onCreateCategory,
  onCreateLine,
  onCreateVariant,
  readOnly = false,
}) {
  const [search, setSearch] = useStateI('');
  const [cat, setCat] = useStateI('all');
  const [sort, setSort] = useStateI('arrived_desc');
  const [arrivalFrom, setArrivalFrom] = useStateI('');
  const [arrivalTo, setArrivalTo] = useStateI('');
  const [showAdd, setShowAdd] = useStateI(false);
  const [sellingUnit, setSellingUnit] = useStateI(null);
  const [bulkSellingUnits, setBulkSellingUnits] = useStateI(null);
  const [editingUnit, setEditingUnit] = useStateI(null);
  const [selectedStructureCategoryId, setSelectedStructureCategoryId] = useStateI(null);
  const [lastAddedSelection, setLastAddedSelection] = useStateI(null);
  const [selectedUnitIds, setSelectedUnitIds] = useStateI([]);

  const activeStock = useMemoI(() => inStock.filter(unit => unit.status === 'in_stock'), [inStock]);
  const returnedCount = inStock.filter(unit => unit.status === 'returned').length;
  const filtered = useMemoI(() => {
    let r = inStock.filter(p => {
      const s = search.toLowerCase();
      const matchSearch = !s
        || p.name.toLowerCase().includes(s)
        || (p.variant || '').toLowerCase().includes(s)
        || (p.transactionCode || '').toLowerCase().includes(s);
      const matchCat = cat === 'all' || p.cat === cat;
      const arrived = p.arrived || '';
      const matchDateFrom = !arrivalFrom || arrived >= arrivalFrom;
      const matchDateTo = !arrivalTo || arrived <= arrivalTo;
      return matchSearch && matchCat && matchDateFrom && matchDateTo;
    });
    r = r.slice().sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'price_asc') return a.expectedSell - b.expectedSell;
      if (sort === 'price_desc') return b.expectedSell - a.expectedSell;
      if (sort === 'buy_desc') return b.buy - a.buy;
      if (sort === 'arrived_desc') return new Date(b.arrived) - new Date(a.arrived);
      if (sort === 'arrived_asc') return new Date(a.arrived) - new Date(b.arrived);
      return 0;
    });
    return r;
  }, [inStock, search, cat, sort, arrivalFrom, arrivalTo]);
  const selectedUnits = useMemoI(() => {
    const selected = new Set(selectedUnitIds);
    return activeStock.filter(unit => selected.has(unit.id));
  }, [activeStock, selectedUnitIds]);
  const filteredActive = filtered.filter(unit => unit.status === 'in_stock');
  const filteredIds = filteredActive.map(unit => unit.id);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every(id => selectedUnitIds.includes(id));
  const someFilteredSelected = filteredIds.some(id => selectedUnitIds.includes(id));
  const toggleUnitSelection = (id) => {
    if (!activeStock.some(unit => unit.id === id)) return;
    setSelectedUnitIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };
  const toggleFilteredSelection = () => {
    setSelectedUnitIds(prev => {
      const filteredSet = new Set(filteredIds);
      if (filteredIds.length > 0 && filteredIds.every(id => prev.includes(id))) {
        return prev.filter(id => !filteredSet.has(id));
      }
      return [...new Set([...prev, ...filteredIds])];
    });
  };
  const markReturned = (unit) => {
    if (confirm(`Đánh dấu "${unit.name}${unit.variant ? ' · ' + unit.variant : ''}" là hàng hoàn? Món này sẽ không tính vào thống kê tiền.`)) {
      updateUnit(unit.id, { status: 'returned' }, 'Đánh dấu hàng hoàn');
      setSelectedUnitIds(prev => prev.filter(id => id !== unit.id));
    }
  };
  const restoreReturned = (unit) => {
    if (confirm(`Hủy hoàn "${unit.name}${unit.variant ? ' · ' + unit.variant : ''}" và đưa món này về tồn kho?`)) {
      updateUnit(unit.id, { status: 'in_stock' }, 'Hủy hoàn hàng');
    }
  };

  // Summary
  const totalUnits = activeStock.length;
  const totalValue = activeStock.reduce((s, p) => s + p.buy, 0);
  const totalSellValue = activeStock.reduce((s, p) => s + (p.expectedSell || p.buy), 0);
  const expectedProfit = totalSellValue - totalValue;

  // Cat counts
  const catCounts = useMemoI(() => {
    const m = { all: activeStock.length };
    activeStock.forEach(p => { m[p.cat] = (m[p.cat] || 0) + 1; });
    return m;
  }, [activeStock]);
  const usedCategoryIds = useMemoI(() => new Set(units.map(unit => unit.cat)), [units]);
  const visibleCategories = useMemoI(
    () => window.CATEGORIES.filter(category => usedCategoryIds.has(category.id)),
    [usedCategoryIds]
  );

  // Inventory composition: quantity + capital by category.
  const categoryStructure = useMemoI(() => {
    return window.CATEGORIES
      .map(category => {
        const rows = activeStock.filter(unit => unit.cat === category.id);
        const units = rows.length;
        const capital = rows.reduce((sum, unit) => sum + (+unit.buy || 0), 0);
        const expectedSell = rows.reduce((sum, unit) => sum + (+(unit.expectedSell || unit.buy) || 0), 0);
        return {
          ...category,
          units,
          capital,
          expectedSell,
          capitalShare: totalValue > 0 ? (capital / totalValue) * 100 : 0,
          unitShare: totalUnits > 0 ? (units / totalUnits) * 100 : 0,
        };
      })
      .filter(item => item.units > 0 || item.capital > 0);
  }, [activeStock, totalUnits, totalValue]);
  const quantityDonutData = categoryStructure.map(item => ({
    categoryId: item.id,
    label: item.name,
    value: item.units,
    color: item.color,
  }));
  const capitalDonutData = categoryStructure
    .filter(item => item.capital > 0)
    .map(item => ({
      categoryId: item.id,
      label: item.name,
      value: item.capital,
      color: item.color,
    }));
  const selectedStructureCategory = categoryStructure.find(item => item.id === selectedStructureCategoryId) || null;
  const selectedCategoryLines = useMemoI(() => {
    if (!selectedStructureCategoryId) return [];
    const grouped = new Map();
    activeStock
      .filter(unit => unit.cat === selectedStructureCategoryId)
      .forEach(unit => {
        const line = window.findCatalogLine(catalogLines, unit);
        const key = line?.id || `${unit.cat}__${unit.name}`;
        const current = grouped.get(key) || {
          id: key,
          name: line?.name || unit.name,
          quantity: 0,
          capital: 0,
          expectedSell: 0,
        };
        current.quantity += 1;
        current.capital += (+unit.buy || 0);
        current.expectedSell += (+(unit.expectedSell || unit.buy) || 0);
        grouped.set(key, current);
      });
    return [...grouped.values()]
      .map(line => ({
        ...line,
        expectedProfit: line.expectedSell - line.capital,
        capitalShare: selectedStructureCategory?.capital > 0 ? (line.capital / selectedStructureCategory.capital) * 100 : 0,
      }))
      .sort((a, b) => b.capital - a.capital || b.quantity - a.quantity || a.name.localeCompare(b.name));
  }, [selectedStructureCategoryId, selectedStructureCategory, activeStock, catalogLines]);

  // Days in stock helper
  const daysInStock = (arrived) => {
    const d1 = new Date(today), d2 = new Date(arrived);
    return Math.floor((d1 - d2) / (1000 * 60 * 60 * 24));
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title"><span className="accent"></span>Quản lý kho hàng</h1>
          <div className="page-sub">{totalUnits} đơn vị đang tính kho{returnedCount > 0 ? ` · ${returnedCount} hàng hoàn không tính tiền` : ''} · mỗi dòng = 1 món riêng biệt</div>
        </div>
        <div className="page-controls">
          <div className="search">
            <span className="search-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </span>
            <input type="text" placeholder="Tìm theo mã / tên / variant..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="date-range-filter">
            <label>
              <span>Từ ngày</span>
              <input type="date" value={arrivalFrom} onChange={e => setArrivalFrom(e.target.value)} />
            </label>
            <label>
              <span>Đến ngày</span>
              <input type="date" value={arrivalTo} onChange={e => setArrivalTo(e.target.value)} />
            </label>
            {(arrivalFrom || arrivalTo) && (
              <button className="ctl ghost sm" type="button" onClick={() => {
                setArrivalFrom('');
                setArrivalTo('');
              }}>
                XÓA NGÀY
              </button>
            )}
          </div>
          <select className="ctl" value={sort} onChange={e => setSort(e.target.value)}>
            <option value="arrived_desc">MỚI VỀ TRƯỚC</option>
            <option value="arrived_asc">CŨ VỀ TRƯỚC</option>
            <option value="name">TÊN A-Z</option>
            <option value="price_asc">GIÁ BÁN TĂNG</option>
            <option value="price_desc">GIÁ BÁN GIẢM</option>
            <option value="buy_desc">VỐN CAO NHẤT</option>
          </select>
          <ImportDataButton today={today} onImport={importUnits} disabled={readOnly} />
          <ExportDataButton units={units} today={today} />
          <button className="ctl primary" onClick={() => setShowAdd(true)} disabled={readOnly}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> NHẬP HÀNG MỚI
          </button>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="inv-sum">
        <div className="kpi">
          <div className="kpi-label">Tổng đơn vị tồn</div>
          <div className="kpi-value mono">{totalUnits}<span className="unit">món</span></div>
        </div>
        <div className="kpi blue">
          <div className="kpi-label">Giá trị kho (vốn)</div>
          <div className="kpi-value mono" style={{ color: '#2563eb' }}>{window.fmtK(totalValue)}<span className="unit">đ</span></div>
        </div>
        <div className="kpi purple">
          <div className="kpi-label">Giá bán dự kiến</div>
          <div className="kpi-value mono" style={{ color: '#7c3aed' }}>{window.fmtK(totalSellValue)}<span className="unit">đ</span></div>
        </div>
        <div className="kpi green">
          <div className="kpi-label">Lợi nhuận dự kiến</div>
          <div className="kpi-value mono" style={{ color: '#10b981' }}>+{window.fmtK(expectedProfit)}<span className="unit">đ</span></div>
          <div className="kpi-delta">
            <span className="up">▲ {totalValue > 0 ? ((expectedProfit / totalValue) * 100).toFixed(1) : 0}%</span>
            <span>biên dự kiến</span>
          </div>
        </div>
      </div>

      {/* Category chips */}
      <div className="chips">
        <button className={`chip ${cat === 'all' ? 'active' : ''}`} onClick={() => setCat('all')}>
          TẤT CẢ <span className="chip-count">{catCounts.all || 0}</span>
        </button>
        {visibleCategories.map(c => (
          <button key={c.id} className={`chip ${cat === c.id ? 'active' : ''}`} onClick={() => setCat(c.id)}>
            <i style={{ width: 7, height: 7, background: c.color, display: 'inline-block' }}></i>
            {c.name.toUpperCase()} <span className="chip-count">{catCounts[c.id] || 0}</span>
          </button>
        ))}
      </div>

      <div className="charts-row inventory-layout">
        <div className="card">
          <div className="card-head">
            <div>
              <div className="card-title">Tồn kho chi tiết</div>
              <div className="card-sub">{filtered.length} món · hàng hoàn vẫn lưu lịch sử nhưng không tính vào tiền kho/doanh thu</div>
            </div>
            <div className="bulk-actions">
              <button
                className="ctl ghost sm"
                onClick={toggleFilteredSelection}
                disabled={readOnly || filteredActive.length === 0}
              >
                {allFilteredSelected ? 'Bỏ chọn đang lọc' : someFilteredSelected ? 'Chọn thêm đang lọc' : 'Chọn tất cả'}
              </button>
              <button
                className="ctl primary sm"
                onClick={() => setBulkSellingUnits(selectedUnits)}
                disabled={readOnly || selectedUnits.length === 0}
              >
                BÁN {selectedUnits.length > 0 ? `${selectedUnits.length} MÓN` : 'ĐÃ CHỌN'}
              </button>
            </div>
          </div>
          <div className="tbl-wrap">
            <table className="tbl inventory-mobile-table">
              <thead>
                <tr>
                  <th className="select-col">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      disabled={readOnly || filteredActive.length === 0}
                      onChange={toggleFilteredSelection}
                      title="Chọn tất cả dòng đang lọc"
                    />
                  </th>
                  <th>Mã GD</th>
                  <th>Sản phẩm</th>
                  <th>Danh mục</th>
                  <th className="num">Giá mua</th>
                  <th className="num">Giá bán DK</th>
                  <th>Ngày về</th>
                  <th>Tồn</th>
                  <th>Ghi chú</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const days = daysInStock(p.arrived);
                  const isAged = days > 14;
                  const isReturned = p.status === 'returned';
                  const selected = selectedUnitIds.includes(p.id);
                  return (
                    <tr key={p.id} className={`${selected ? 'selected-row' : ''} ${isReturned ? 'returned-row' : ''}`}>
                      <td className="select-col">
                        <input
                          type="checkbox"
                          checked={selected}
                          disabled={readOnly || isReturned}
                          onChange={() => toggleUnitSelection(p.id)}
                          title="Chọn để bán theo lô"
                        />
                      </td>
                      <td className="mono txn-code">{p.transactionCode}</td>
                      <td>
                        <div className="product-cell">
                          <ProductThumb cat={p.cat} size={38} />
                          <div>
                            <div className="name">{p.name}</div>
                            {p.variant && <span className="variant">{p.variant}</span>}
                          </div>
                        </div>
                      </td>
                      <td><CatPill cat={p.cat} /></td>
                      <td className={`num mono ${isReturned ? 'returned-money' : ''}`}>{p.buy.toLocaleString('vi-VN')}</td>
                      <td className={`num mono ${isReturned ? 'returned-money' : ''}`} style={{ fontWeight: 700, color: isReturned ? undefined : '#7c3aed' }}>
                        {(p.expectedSell || 0).toLocaleString('vi-VN')}
                      </td>
                      <td className="mono" style={{ fontSize: 12, color: '#6b6b80' }}>
                        {new Date(p.arrived).toLocaleDateString('vi-VN')}
                      </td>
                      <td>
                        <span className={`status-tag ${isReturned ? 'status-returned' : isAged ? 'status-low' : 'status-ok'}`}>
                          <span className="d"></span>
                          {isReturned ? 'HÀNG HOÀN' : `${days}N`}
                        </span>
                      </td>
                      <td>
                        <InventoryNoteInput
                          value={p.note || ''}
                          placeholder={'ghi ch\u00fa...'}
                          onCommit={value => updateNote(p.id, value)}
                          disabled={readOnly}
                        />
                      </td>
                      <td>
                        <div className="row-actions">
                          <button className="ctl ghost sm" onClick={() => setEditingUnit(p)} disabled={readOnly}>
                            SỬA
                          </button>
                          {isReturned ? (
                            <button className="ctl primary sm" onClick={() => restoreReturned(p)} disabled={readOnly}>
                              HỦY HOÀN
                            </button>
                          ) : (
                            <>
                              <button className="ctl ghost sm" onClick={() => markReturned(p)} disabled={readOnly}>
                                HÀNG HOÀN
                              </button>
                              <button className="ctl primary sm" onClick={() => setSellingUnit(p)} disabled={readOnly}>
                                BÁN →
                              </button>
                            </>
                          )}
                          <button className="ctl ghost sm" disabled={readOnly} onClick={() => {
                            if (confirm(`Xoá "${p.name}${p.variant ? ' · ' + p.variant : ''}" khỏi kho?`)) removeUnit(p.id);
                          }} title="Xoá khỏi kho">
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan="10" className="empty">Không tìm thấy sản phẩm phù hợp</td></tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan="4">TỔNG ĐANG TÍNH ({filteredActive.length} món)</td>
                  <td className="num mono">{filteredActive.reduce((s, p) => s + p.buy, 0).toLocaleString('vi-VN')}</td>
                  <td className="num mono profit-pos">
                    {filteredActive.reduce((s, p) => s + (p.expectedSell || 0), 0).toLocaleString('vi-VN')}
                  </td>
                  <td colSpan="4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="card stock-composition-card">
          <div className="card-head">
            <div>
              <div className="card-title">Cơ cấu kho</div>
              <div className="card-sub">Bấm vào danh mục để xem chi tiết theo dòng sản phẩm</div>
            </div>
          </div>
          <div className="card-body stock-composition-body">
            <div className="stock-composition-section">
              <div className="stock-composition-head">
                <strong>Theo số lượng</strong>
                <span>Mỗi lát = % số món</span>
              </div>
              <div className="stock-composition-visual">
                <Donut
                  data={quantityDonutData}
                  size={150}
                  centerLabel="MÓN"
                  centerValue={totalUnits}
                  onSegmentClick={segment => setSelectedStructureCategoryId(segment.categoryId)}
                />
                <div className="stock-composition-legend">
                  {categoryStructure.map(item => (
                    <button key={item.id} onClick={() => setSelectedStructureCategoryId(item.id)}>
                      <span>
                        <i style={{ background: item.color }}></i>
                        {item.name}
                      </span>
                      <strong className="mono">{item.units} · {item.unitShare.toFixed(1)}%</strong>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="stock-composition-section">
              <div className="stock-composition-head">
                <strong>Theo vốn</strong>
                <span>Tỉ trọng vốn đang nằm trong kho</span>
              </div>
              <div className="stock-composition-visual">
                <Donut
                  data={capitalDonutData}
                  size={150}
                  centerLabel="VỐN"
                  centerValue={window.fmtK(totalValue)}
                  onSegmentClick={segment => setSelectedStructureCategoryId(segment.categoryId)}
                />
                <div className="capital-share-list">
                  {categoryStructure.map(item => (
                    <button key={item.id} onClick={() => setSelectedStructureCategoryId(item.id)}>
                      <span>
                        <i style={{ background: item.color }}></i>
                        {item.name}
                      </span>
                      <em>
                        <b style={{ width: `${item.capitalShare}%`, background: item.color }}></b>
                      </em>
                      <strong className="mono">{window.fmtK(item.capital)} · {item.capitalShare.toFixed(1)}%</strong>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {categoryStructure.length === 0 && <div className="empty" style={{ padding: 20 }}>Kho trống</div>}
          </div>
        </div>
      </div>

      {showAdd && (
        <AddProductModal
          catalogLines={catalogLines}
          today={today}
          initialSelection={lastAddedSelection}
          onCreateLine={onCreateLine}
          onCreateVariant={onCreateVariant}
          onClose={() => setShowAdd(false)}
          onSave={(p) => {
            addUnit(p);
            setLastAddedSelection({ productLineId: p.productLineId, variantId: p.variantId });
            setShowAdd(false);
          }}
        />
      )}
      {sellingUnit && (
        <SellModal
          unit={sellingUnit}
          today={today}
          onClose={() => setSellingUnit(null)}
          onConfirm={(sellPrice, soldDate, note) => {
            sellUnit(sellingUnit.id, sellPrice, soldDate, note);
            setSelectedUnitIds(prev => prev.filter(id => id !== sellingUnit.id));
            setSellingUnit(null);
          }}
        />
      )}
      {bulkSellingUnits && (
        <BulkSellModal
          units={bulkSellingUnits}
          today={today}
          onClose={() => setBulkSellingUnits(null)}
          onConfirm={(sales, soldDate, note) => {
            sales.forEach(sale => sellUnit(sale.id, sale.sellPrice, soldDate, note));
            setSelectedUnitIds(prev => prev.filter(id => !sales.some(sale => sale.id === id)));
            setBulkSellingUnits(null);
          }}
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
      {selectedStructureCategory && (
        <StockCategoryDetailModal
          category={selectedStructureCategory}
          lines={selectedCategoryLines}
          onClose={() => setSelectedStructureCategoryId(null)}
        />
      )}
    </div>
  );
}

function StockCategoryDetailModal({ category, lines, onClose }) {
  const expectedProfit = category.expectedSell - category.capital;
  const capitalByLine = lines.map(line => ({
    label: line.name,
    value: line.capital,
    color: category.color,
  }));

  return (
    <div className="modal-bg analytics-modal-bg" onClick={onClose}>
      <div className="modal stock-detail-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head analytics-head">
          <div>
            <div className="modal-title"><span className="accent"></span>CHI TIẾT CƠ CẤU KHO · {category.name}</div>
            <div className="card-sub">{category.units} món · chiếm {category.capitalShare.toFixed(1)}% vốn kho hiện tại</div>
          </div>
          <button className="close-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body stock-detail-body">
          <div className="stock-detail-kpis">
            <div>
              <span>Số lượng</span>
              <strong className="mono">{category.units}</strong>
            </div>
            <div>
              <span>Vốn đang chiếm</span>
              <strong className="mono">{window.fmtK(category.capital)}đ</strong>
            </div>
            <div>
              <span>Giá bán dự kiến</span>
              <strong className="mono">{window.fmtK(category.expectedSell)}đ</strong>
            </div>
            <div>
              <span>Lãi dự kiến</span>
              <strong className={`mono ${expectedProfit >= 0 ? 'profit-pos' : 'profit-neg'}`}>
                {expectedProfit < 0 ? '−' : '+'}{window.fmtK(Math.abs(expectedProfit))}đ
              </strong>
            </div>
          </div>

          <div className="stock-detail-grid">
            <div className="card analytics-panel">
              <div className="card-head">
                <div>
                  <div className="card-title">Vốn theo dòng sản phẩm</div>
                  <div className="card-sub">Dòng nào đang giữ nhiều tiền nhất</div>
                </div>
              </div>
              <div className="card-body">
                {capitalByLine.length > 0 ? (
                  <BarChart
                    data={capitalByLine}
                    height={Math.max(220, lines.length * 42)}
                    labelWidth={180}
                    valueGutter={58}
                    width={560}
                  />
                ) : (
                  <div className="empty">Chưa có dữ liệu</div>
                )}
              </div>
            </div>

            <div className="card analytics-panel">
              <div className="card-head">
                <div>
                  <div className="card-title">Chi tiết từng dòng sản phẩm</div>
                  <div className="card-sub">Số lượng và vốn hiện đang nằm trong kho</div>
                </div>
              </div>
              <div className="tbl-wrap">
                <table className="tbl analytics-table">
                  <thead>
                    <tr>
                      <th>Dòng sản phẩm</th>
                      <th className="num">SL</th>
                      <th className="num">Vốn</th>
                      <th className="num">% vốn</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map(line => (
                      <tr key={line.id}>
                        <td>{line.name}</td>
                        <td className="num mono">{line.quantity}</td>
                        <td className="num mono">{line.capital.toLocaleString('vi-VN')}</td>
                        <td className="num mono">{line.capitalShare.toFixed(1)}%</td>
                      </tr>
                    ))}
                    {lines.length === 0 && <tr><td colSpan="4" className="empty">Chưa có dòng sản phẩm nào</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BulkSellModal({ units, today, onClose, onConfirm }) {
  const [soldDate, setSoldDate] = useStateI(today);
  const [note, setNote] = useStateI('');
  const [samePrice, setSamePrice] = useStateI(false);
  const [commonPrice, setCommonPrice] = useStateI(units[0]?.expectedSell || units[0]?.buy || '');
  const [prices, setPrices] = useStateI(() => {
    const initial = {};
    units.forEach(unit => {
      initial[unit.id] = unit.expectedSell || unit.buy || '';
    });
    return initial;
  });

  const effectivePrices = units.map(unit => +(samePrice ? commonPrice : prices[unit.id]) || 0);
  const totalBuy = units.reduce((sum, unit) => sum + (+unit.buy || 0), 0);
  const totalSell = effectivePrices.reduce((sum, price) => sum + price, 0);
  const profit = totalSell - totalBuy;
  const allValid = units.length > 0 && effectivePrices.every(price => price > 0);

  const applyCommonPrice = () => {
    const value = commonPrice || '';
    setPrices(prev => {
      const next = { ...prev };
      units.forEach(unit => { next[unit.id] = value; });
      return next;
    });
  };

  const confirm = () => {
    if (!allValid) return;
    const sales = units.map(unit => ({
      id: unit.id,
      sellPrice: samePrice ? commonPrice : prices[unit.id],
    }));
    onConfirm(sales, soldDate, note);
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal bulk-sell-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div className="modal-title"><span className="accent"></span>GHI NHẬN BÁN THEO LÔ</div>
            <div className="card-sub">{units.length} món đang chọn</div>
          </div>
          <button className="close-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="bulk-sell-toolbar">
            <label className="bulk-sell-check">
              <input type="checkbox" checked={samePrice} onChange={e => setSamePrice(e.target.checked)} />
              <span>Bán tất cả cùng 1 giá</span>
            </label>
            <div className="bulk-sell-common">
              <label>Giá chung (nghìn)</label>
              <input
                type="number"
                value={commonPrice}
                onChange={e => setCommonPrice(e.target.value)}
                disabled={!samePrice}
              />
              <button className="ctl ghost sm" onClick={applyCommonPrice} disabled={!samePrice}>ÁP GIÁ</button>
            </div>
            <div className="bulk-sell-date">
              <label>Ngày bán</label>
              <input type="date" value={soldDate} onChange={e => setSoldDate(e.target.value)} />
            </div>
          </div>

          <div className="tbl-wrap bulk-sell-table-wrap">
            <table className="tbl bulk-sell-table">
              <thead>
                <tr>
                  <th>Mã GD</th>
                  <th>Sản phẩm</th>
                  <th className="num">Giá mua</th>
                  <th className="num">Giá bán</th>
                  <th className="num">Lãi</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit, index) => {
                  const sellPrice = effectivePrices[index];
                  const rowProfit = sellPrice - (+unit.buy || 0);
                  return (
                    <tr key={unit.id}>
                      <td className="mono txn-code">{unit.transactionCode}</td>
                      <td>
                        <div className="name">{unit.name}</div>
                        {unit.variant && <span className="variant">{unit.variant}</span>}
                      </td>
                      <td className="num mono">{(+unit.buy || 0).toLocaleString('vi-VN')}</td>
                      <td className="num">
                        <input
                          className="bulk-price-input"
                          type="number"
                          value={samePrice ? commonPrice : prices[unit.id]}
                          disabled={samePrice}
                          onChange={e => setPrices(prev => ({ ...prev, [unit.id]: e.target.value }))}
                        />
                      </td>
                      <td className={`num mono ${rowProfit >= 0 ? 'profit-pos' : 'profit-neg'}`}>
                        {rowProfit < 0 ? '−' : '+'}{Math.abs(rowProfit).toLocaleString('vi-VN')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="field">
            <label>Ghi chú chung</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="vd. đơn gom, khách quen, đã ship..." />
          </div>
          <div className="unit-summary">
            <div className="row">
              <span className="lbl">Tổng giá bán</span>
              <span className="mono">{totalSell.toLocaleString('vi-VN')}K</span>
            </div>
            <div className="row">
              <span className="lbl">Lợi nhuận lô</span>
              <span className={`mono ${profit >= 0 ? 'profit-pos' : 'profit-neg'}`}>
                {profit < 0 ? '−' : '+'}{Math.abs(profit).toLocaleString('vi-VN')}K
              </span>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="ctl ghost" onClick={onClose}>HUỶ</button>
          <button className="ctl primary" onClick={confirm} disabled={!allValid} style={{ opacity: allValid ? 1 : 0.5 }}>
            XÁC NHẬN BÁN {units.length} MÓN
          </button>
        </div>
      </div>
    </div>
  );
}

function SellModal({ unit, today, onClose, onConfirm }) {
  const [sellPrice, setSellPrice] = useStateI(unit.expectedSell || unit.buy);
  const [soldDate, setSoldDate] = useStateI(today);
  const [note, setNote] = useStateI(unit.note || '');

  const profit = (+sellPrice || 0) - unit.buy;
  const ratio = unit.buy > 0 ? ((+sellPrice || 0) / unit.buy) * 100 : 0;
  const showRatio = unit.cat !== 'accessory';
  const isLoss = profit < 0;

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title"><span className="accent"></span>GHI NHẬN BÁN HÀNG</div>
          <button className="close-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', padding: '12px 14px', marginBottom: 18 }}>
            <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Đang bán</div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 4 }}>{unit.name}</div>
            {unit.variant && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Variant: {unit.variant}</div>}
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
              Mã GD <span className="mono" style={{ color: 'var(--text)', fontWeight: 700 }}>{unit.transactionCode}</span> ·
              Đã nhập <span className="mono" style={{ color: 'var(--text)', fontWeight: 700 }}>{unit.buy.toLocaleString('vi-VN')}K</span> ·
              Ngày về <span className="mono" style={{ color: 'var(--text)', fontWeight: 700 }}>{new Date(unit.arrived).toLocaleDateString('vi-VN')}</span>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Giá bán thực tế (nghìn)</label>
              <input
                type="number"
                value={sellPrice}
                onChange={e => setSellPrice(e.target.value)}
                onKeyDown={e => {
                  // Keep Backspace inside the price field; some browsers/webviews
                  // otherwise treat it as a page-back action and dismiss the modal.
                  if (e.key === 'Backspace') e.stopPropagation();
                }}
                autoFocus
              />
            </div>
            <div className="field">
              <label>Ngày bán</label>
              <input type="date" value={soldDate} onChange={e => setSoldDate(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label>Ghi chú</label>
            <input type="text" value={note} onChange={e => setNote(e.target.value)} placeholder="vd. KH Hà Nội, ship 13/5, BH 15 ngày..." />
          </div>

          <div className="unit-summary">
            <div className="row">
              <span className="lbl">Lợi nhuận</span>
              <span className={`mono ${isLoss ? 'profit-neg' : 'profit-pos'}`} style={{ fontSize: 16 }}>
                {isLoss ? '−' : '+'}{Math.abs(profit).toLocaleString('vi-VN')}K
                {isLoss && <span className="loss-tag">LỖ</span>}
              </span>
            </div>
            {showRatio && (
              <div className="row">
                <span className="lbl">Tỉ lệ bán/mua</span>
                <span className="mono" style={{ fontWeight: 800, color: ratio >= 110 ? '#10b981' : ratio >= 100 ? '#f59e0b' : '#e11d48' }}>
                  {ratio.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="modal-foot">
          <button className="ctl ghost" onClick={onClose}>HUỶ</button>
          <button className="ctl primary" onClick={() => onConfirm(sellPrice, soldDate, note)}>
            XÁC NHẬN BÁN
          </button>
        </div>
      </div>
    </div>
  );
}

function normalizePriceExpression(value) {
  return String(value || '')
    .replace(/\s+/g, '')
    .replace(/,/g, '.');
}

function evaluatePriceExpression(value) {
  const normalized = normalizePriceExpression(value);
  if (!normalized) return null;
  if (!/^[0-9.+\-*/()]+$/.test(normalized)) return null;
  try {
    const result = Function(`"use strict"; return (${normalized});`)();
    return Number.isFinite(result) && result >= 0 ? result : null;
  } catch {
    return null;
  }
}

function settlePriceInput(value) {
  const result = evaluatePriceExpression(value);
  return result === null ? normalizePriceExpression(value) : String(result);
}

function SearchableSelect({ value, selectedLabel, placeholder, searchValue, onSearch, options, onSelect, open, onOpen, onClose, emptyText }) {
  const selected = options.find(option => option.value === value) || (selectedLabel ? { label: selectedLabel } : null);
  return (
    <div
      className="search-select"
      onBlur={e => {
        if (!e.currentTarget.contains(e.relatedTarget)) onClose();
      }}
    >
      <button
        type="button"
        className={`search-select-trigger ${open ? 'open' : ''}`}
        onClick={() => open ? onClose() : onOpen()}
        onKeyDown={e => {
          if (e.key === 'Escape') onClose();
        }}
      >
        <span>{selected?.label || placeholder}</span>
        <span className="chev">⌄</span>
      </button>
      {open && (
        <div className="search-select-pop">
          <input
            type="text"
            value={searchValue}
            onChange={e => onSearch(e.target.value)}
            placeholder={placeholder}
            onKeyDown={e => {
              if (e.key === 'Escape') onClose();
            }}
            autoFocus
          />
          <div className="search-select-list">
            {options.length > 0 ? options.map(option => (
              <button
                key={option.value}
                type="button"
                className={`search-select-item ${option.value === value ? 'selected' : ''}`}
                onClick={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                <span>{option.label}</span>
                {option.meta && <small>{option.meta}</small>}
              </button>
            )) : (
              <div className="search-select-empty">{emptyText}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddProductModal({ catalogLines, today, initialSelection, onCreateLine, onCreateVariant, onClose, onSave }) {
  const preferredLine = catalogLines.find(line => line.id === initialSelection?.productLineId);
  const firstLine = preferredLine || catalogLines[0];
  const preferredVariant = firstLine?.variants?.find(variant => variant.id === initialSelection?.variantId);
  const firstVariant = preferredVariant || firstLine?.variants?.[0];
  const [form, setForm] = useStateI({
    productLineId: firstLine?.id || '',
    variantId: firstVariant?.id || '',
    buy: '', expectedSell: '', quantity: 1, arrived: defaultArrivalDate(), note: '',
  });
  const [showQuickLine, setShowQuickLine] = useStateI(false);
  const [showQuickVariant, setShowQuickVariant] = useStateI(false);
  const [lineDropdownOpen, setLineDropdownOpen] = useStateI(false);
  const [variantDropdownOpen, setVariantDropdownOpen] = useStateI(false);
  const [lineSearch, setLineSearch] = useStateI('');
  const [variantSearch, setVariantSearch] = useStateI('');
  const selectedLine = catalogLines.find(line => line.id === form.productLineId);
  const selectedVariant = selectedLine?.variants.find(v => v.id === form.variantId);
  const normalizedLineSearch = lineSearch.trim().toLowerCase();
  const visibleCatalogLines = normalizedLineSearch
    ? catalogLines.filter(line => [line.name, line.brand, window.CATEGORIES.find(c => c.id === line.cat)?.name]
        .some(value => String(value || '').toLowerCase().includes(normalizedLineSearch)))
    : catalogLines;
  const lineOptions = visibleCatalogLines.map(line => ({
    value: line.id,
    label: line.name,
    meta: window.CATEGORIES.find(c => c.id === line.cat)?.name || '',
  }));
  const normalizedVariantSearch = variantSearch.trim().toLowerCase();
  const variantOptions = (selectedLine?.variants || [])
    .filter(variant => !normalizedVariantSearch || String(variant.name || '').toLowerCase().includes(normalizedVariantSearch))
    .map(variant => ({ value: variant.id, label: variant.name }));
  const set = (k, v) => setForm({ ...form, [k]: v });
  const selectLine = (lineId) => {
    const line = catalogLines.find(x => x.id === lineId);
    setForm({ ...form, productLineId: lineId, variantId: line?.variants?.[0]?.id || '' });
    setVariantSearch('');
  };
  const computedBuy = evaluatePriceExpression(form.buy);
  const computedExpectedSell = form.expectedSell === '' ? computedBuy : evaluatePriceExpression(form.expectedSell);
  const effectiveExpectedSell = computedExpectedSell ?? 0;
  const valid = selectedLine && selectedVariant && computedBuy !== null;
  const save = () => {
    if (!valid) return;
    onSave({
      productLineId: selectedLine.id,
      variantId: selectedVariant.id,
      name: selectedLine.name,
      cat: selectedLine.cat,
      variant: selectedVariant.name,
      buy: computedBuy,
      expectedSell: effectiveExpectedSell,
      quantity: Math.max(1, Math.floor(+form.quantity || 1)),
      arrived: form.arrived,
      note: form.note,
    });
  };

  const profit = effectiveExpectedSell - (computedBuy || 0);
  const ratio = computedBuy > 0 ? (effectiveExpectedSell / computedBuy) * 100 : 0;

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title"><span className="accent"></span>NHẬP HÀNG MỚI</div>
          <button className="close-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="field-row">
            <div className="field">
              <label className="field-label-actions">
                Dòng sản phẩm
                <button type="button" onClick={() => setShowQuickLine(true)}>+ tạo nhanh</button>
              </label>
              <SearchableSelect
                value={form.productLineId}
                selectedLabel={selectedLine?.name}
                placeholder="Tìm dòng sản phẩm theo tên..."
                searchValue={lineSearch}
                onSearch={setLineSearch}
                options={lineOptions}
                onSelect={selectLine}
                open={lineDropdownOpen}
                onOpen={() => {
                  setLineDropdownOpen(true);
                  setVariantDropdownOpen(false);
                }}
                onClose={() => setLineDropdownOpen(false)}
                emptyText="Không tìm thấy dòng sản phẩm phù hợp"
              />
            </div>
            <div className="field">
              <label className="field-label-actions">
                Phân loại
                <button type="button" onClick={() => setShowQuickVariant(true)} disabled={!selectedLine}>+ tạo nhanh</button>
              </label>
              <SearchableSelect
                value={form.variantId}
                selectedLabel={selectedVariant?.name}
                placeholder="Tìm phân loại..."
                searchValue={variantSearch}
                onSearch={setVariantSearch}
                options={variantOptions}
                onSelect={value => set('variantId', value)}
                open={variantDropdownOpen}
                onOpen={() => {
                  setVariantDropdownOpen(true);
                  setLineDropdownOpen(false);
                }}
                onClose={() => setVariantDropdownOpen(false)}
                emptyText="Không tìm thấy phân loại phù hợp"
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Danh mục</label>
              <input type="text" value={window.CATEGORIES.find(c => c.id === selectedLine?.cat)?.name || ''} disabled />
            </div>
            <div className="field">
              <label>Ngày về hàng</label>
              <input type="date" value={form.arrived} onChange={e => set('arrived', e.target.value)} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Giá mua (nghìn)</label>
              <input
                type="text"
                inputMode="decimal"
                value={form.buy}
                onChange={e => set('buy', e.target.value)}
                onBlur={e => set('buy', settlePriceInput(e.target.value))}
                placeholder="vd. 580 hoặc 8 + 10"
              />
            </div>
            <div className="field">
              <label>Giá bán dự kiến (nghìn)</label>
              <input type="number" value={form.expectedSell} onChange={e => set('expectedSell', e.target.value)} placeholder={form.buy ? `mặc định ${form.buy}` : 'để trống = giá mua'} />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Số lượng nhập</label>
              <input type="number" min="1" value={form.quantity} onChange={e => set('quantity', e.target.value)} />
            </div>
            <div className="field">
              <label>Mã giao dịch sẽ tạo</label>
              <input type="text" value={`${Math.max(1, Math.floor(+form.quantity || 1))} mã riêng biệt`} disabled />
            </div>
          </div>
          <div className="field">
            <label>Ghi chú</label>
            <input type="text" value={form.note} onChange={e => set('note', e.target.value)} placeholder="tuỳ chọn" />
          </div>
          {computedBuy !== null && (
            <div className="unit-summary">
              <div className="row">
                <span className="lbl">Lợi nhuận dự kiến</span>
                <span className={`mono ${profit >= 0 ? 'profit-pos' : 'profit-neg'}`}>
                  {profit < 0 ? '−' : '+'}{Math.abs(profit).toLocaleString('vi-VN')}K
                </span>
              </div>
              <div className="row">
                <span className="lbl">Tỉ lệ dự kiến</span>
                <span className="mono" style={{ fontWeight: 800, color: ratio >= 110 ? '#10b981' : '#f59e0b' }}>
                  {ratio.toFixed(1)}%
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="ctl ghost" onClick={onClose}>HUỶ</button>
          <button className="ctl primary" onClick={save} disabled={!valid} style={{ opacity: valid ? 1 : 0.5, cursor: valid ? 'pointer' : 'not-allowed' }}>
            LƯU VÀO KHO
          </button>
        </div>
      </div>
      {showQuickLine && (
        <QuickCreateLineModal
          onClose={() => setShowQuickLine(false)}
          onSave={({ name, cat, variant }) => {
            const line = onCreateLine(name, cat);
            if (!line) return;
            const createdVariant = variant.trim() && variant.trim() !== 'Mặc định'
              ? onCreateVariant(line, variant)
              : line.variants?.[0];
            setForm(prev => ({
              ...prev,
              productLineId: line.id,
              variantId: createdVariant?.id || line.variants?.[0]?.id || '',
            }));
            setShowQuickLine(false);
          }}
        />
      )}
      {showQuickVariant && selectedLine && (
        <QuickCreateVariantModal
          line={selectedLine}
          onClose={() => setShowQuickVariant(false)}
          onSave={(name) => {
            const variant = onCreateVariant(selectedLine, name);
            if (!variant) return;
            set('variantId', variant.id);
            setShowQuickVariant(false);
          }}
        />
      )}
    </div>
  );
}

function QuickCreateLineModal({ onClose, onSave }) {
  const [form, setForm] = useStateI({ name: '', cat: window.CATEGORIES[0]?.id || '', variant: '' });
  const valid = form.name.trim() && form.cat;
  return (
    <div className="modal-bg nested" onClick={onClose}>
      <div className="modal quick-catalog-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title"><span className="accent"></span>TẠO NHANH DÒNG SẢN PHẨM</div>
          <button className="close-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="field"><label>Tên dòng sản phẩm</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} autoFocus /></div>
          <div className="field-row">
            <div className="field"><label>Danh mục</label><select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })}>{window.CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="field"><label>Phân loại đầu tiên</label><input value={form.variant} onChange={e => setForm({ ...form, variant: e.target.value })} placeholder="để trống = Mặc định" /></div>
          </div>
        </div>
        <div className="modal-foot"><button className="ctl ghost" onClick={onClose}>HUỶ</button><button className="ctl primary" disabled={!valid} onClick={() => onSave(form)}>TẠO</button></div>
      </div>
    </div>
  );
}

function QuickCreateVariantModal({ line, onClose, onSave }) {
  const [name, setName] = useStateI('');
  return (
    <div className="modal-bg nested" onClick={onClose}>
      <div className="modal quick-catalog-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head"><div className="modal-title"><span className="accent"></span>TẠO NHANH PHÂN LOẠI</div><button className="close-x" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <div className="unit-summary" style={{ marginBottom: 16 }}><div className="row"><span className="lbl">Dòng sản phẩm</span><span>{line.name}</span></div></div>
          <div className="field"><label>Tên phân loại</label><input value={name} onChange={e => setName(e.target.value)} autoFocus /></div>
        </div>
        <div className="modal-foot"><button className="ctl ghost" onClick={onClose}>HUỶ</button><button className="ctl primary" disabled={!name.trim()} onClick={() => onSave(name)}>TẠO</button></div>
      </div>
    </div>
  );
}

window.Inventory = Inventory;



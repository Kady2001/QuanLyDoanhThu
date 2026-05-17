// Shared unit editor — every field is editable except the immutable transaction code.

const { useState: useStateUE } = React;
const ADD_NEW_LINE = '__add_new_line__';
const ADD_NEW_VARIANT = '__add_new_variant__';
const ADD_NEW_CATEGORY = '__add_new_category__';

function EditUnitModal({
  unit,
  catalogLines,
  today,
  onCreateCategory,
  onCreateLine,
  onCreateVariant,
  onClose,
  onSave,
}) {
  const initialLine = window.findCatalogLine(catalogLines, unit) || catalogLines[0] || null;
  const initialVariant = window.findCatalogVariant(initialLine, unit) || initialLine?.variants?.[0] || null;
  const [form, setForm] = useStateUE({
    productLineId: initialLine?.id || '',
    variantId: initialVariant?.id || '',
    cat: unit.cat || initialLine?.cat || 'keyboard',
    buy: unit.buy ?? '',
    expectedSell: unit.expectedSell ?? unit.buy ?? '',
    arrived: unit.arrived || today,
    status: unit.status || 'in_stock',
    sell: unit.sell ?? unit.expectedSell ?? unit.buy ?? '',
    sold: unit.sold || today,
    note: unit.note || '',
  });
  const [showNewLine, setShowNewLine] = useStateUE(false);
  const [showNewVariant, setShowNewVariant] = useStateUE(false);
  const [showNewCategory, setShowNewCategory] = useStateUE(false);
  const [newLineName, setNewLineName] = useStateUE('');
  const [newVariantName, setNewVariantName] = useStateUE('');
  const [newCategoryName, setNewCategoryName] = useStateUE('');

  const set = (key, value) => setForm(prev => ({ ...prev, [key]: value }));
  const selectedLine = catalogLines.find(line => line.id === form.productLineId) || null;
  const selectedVariant = selectedLine?.variants.find(variant => variant.id === form.variantId) || null;
  const selectLine = (lineId) => {
    const line = catalogLines.find(item => item.id === lineId);
    setForm(prev => ({
      ...prev,
      productLineId: lineId,
      variantId: line?.variants?.[0]?.id || '',
      cat: line?.cat || prev.cat,
    }));
  };
  const handleLineChange = (value) => {
    if (value === ADD_NEW_LINE) {
      setShowNewLine(true);
      return;
    }
    setShowNewLine(false);
    selectLine(value);
  };
  const handleVariantChange = (value) => {
    if (value === ADD_NEW_VARIANT) {
      setShowNewVariant(true);
      return;
    }
    setShowNewVariant(false);
    set('variantId', value);
  };
  const handleCategoryChange = (value) => {
    if (value === ADD_NEW_CATEGORY) {
      setShowNewCategory(true);
      return;
    }
    setShowNewCategory(false);
    set('cat', value);
  };
  const createLine = () => {
    const line = onCreateLine?.(newLineName, form.cat);
    if (!line) return;
    setForm(prev => ({
      ...prev,
      productLineId: line.id,
      variantId: line.variants?.[0]?.id || '',
      cat: line.cat,
    }));
    setNewLineName('');
    setShowNewLine(false);
  };
  const createVariant = () => {
    const variant = onCreateVariant?.(selectedLine, newVariantName);
    if (!variant) return;
    set('variantId', variant.id);
    setNewVariantName('');
    setShowNewVariant(false);
  };
  const createCategory = () => {
    const category = onCreateCategory?.(newCategoryName);
    if (!category) return;
    set('cat', category.id);
    setNewCategoryName('');
    setShowNewCategory(false);
  };
  const isSold = form.status === 'sold';
  const valid = selectedLine
    && selectedVariant
    && form.buy !== ''
    && form.expectedSell !== ''
    && +form.buy >= 0
    && +form.expectedSell >= 0
    && form.arrived
    && (!isSold || (form.sell !== '' && +form.sell >= 0 && form.sold));

  const save = () => {
    if (!valid) return;
    const next = {
      productLineId: selectedLine.id,
      variantId: selectedVariant.id,
      name: selectedLine.name,
      cat: form.cat,
      variant: selectedVariant.name,
      buy: +form.buy,
      expectedSell: +form.expectedSell,
      arrived: form.arrived,
      note: form.note,
      status: form.status,
    };

    if (isSold) {
      next.sell = +form.sell;
      next.sold = new Date(form.sold) < new Date(form.arrived) ? form.arrived : form.sold;
    }

    onSave(unit.id, next);
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal edit-unit-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title"><span className="accent"></span>SỬA GIAO DỊCH</div>
          <button className="close-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="field">
            <label>Mã giao dịch</label>
            <input type="text" value={unit.transactionCode} disabled />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Dòng sản phẩm</label>
              <select value={form.productLineId} onChange={e => handleLineChange(e.target.value)} autoFocus>
                {catalogLines.map(line => <option key={line.id} value={line.id}>{line.name}</option>)}
                <option value={ADD_NEW_LINE}>+ Thêm dòng sản phẩm mới</option>
              </select>
              {showNewLine && (
                <InlineCreateRow
                  value={newLineName}
                  onChange={setNewLineName}
                  onCreate={createLine}
                  placeholder="Tên dòng sản phẩm mới"
                />
              )}
            </div>
            <div className="field">
              <label>Phân loại</label>
              <select value={form.variantId} onChange={e => handleVariantChange(e.target.value)}>
                {(selectedLine?.variants || []).map(variant => (
                  <option key={variant.id} value={variant.id}>{variant.name}</option>
                ))}
                <option value={ADD_NEW_VARIANT}>+ Thêm phân loại mới</option>
              </select>
              {showNewVariant && (
                <InlineCreateRow
                  value={newVariantName}
                  onChange={setNewVariantName}
                  onCreate={createVariant}
                  placeholder="Tên phân loại mới"
                />
              )}
            </div>
          </div>

          <div className="field-row three">
            <div className="field">
              <label>Danh mục</label>
              <select value={form.cat} onChange={e => handleCategoryChange(e.target.value)}>
                {window.CATEGORIES.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
                <option value={ADD_NEW_CATEGORY}>+ Thêm danh mục mới</option>
              </select>
              {showNewCategory && (
                <InlineCreateRow
                  value={newCategoryName}
                  onChange={setNewCategoryName}
                  onCreate={createCategory}
                  placeholder="Tên danh mục mới"
                />
              )}
            </div>
            <div className="field">
              <label>Trạng thái</label>
              <select value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="in_stock">Tồn kho</option>
                <option value="sold">Đã bán</option>
              </select>
            </div>
            <div className="field">
              <label>Ngày nhập</label>
              <input type="date" value={form.arrived} onChange={e => set('arrived', e.target.value)} />
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label>Giá mua (nghìn)</label>
              <input type="number" min="0" value={form.buy} onChange={e => set('buy', e.target.value)} />
            </div>
            <div className="field">
              <label>Giá bán dự kiến (nghìn)</label>
              <input type="number" min="0" value={form.expectedSell} onChange={e => set('expectedSell', e.target.value)} />
            </div>
          </div>

          {isSold && (
            <div className="field-row">
              <div className="field">
                <label>Giá bán thực tế (nghìn)</label>
                <input type="number" min="0" value={form.sell} onChange={e => set('sell', e.target.value)} />
              </div>
              <div className="field">
                <label>Ngày bán</label>
                <input type="date" value={form.sold} onChange={e => set('sold', e.target.value)} />
              </div>
            </div>
          )}

          <div className="field">
            <label>Ghi chú</label>
            <textarea value={form.note} onChange={e => set('note', e.target.value)} placeholder="Không giới hạn ký tự..." />
          </div>

          <div className="unit-summary">
            <div className="row">
              <span className="lbl">Mã giữ nguyên</span>
              <span className="mono" style={{ fontWeight: 800 }}>{unit.transactionCode}</span>
            </div>
            <div className="row">
              <span className="lbl">Sau khi lưu</span>
              <span style={{ fontWeight: 700 }}>{isSold ? 'Hiện ở Tổng quan' : 'Hiện ở Kho hàng'}</span>
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="ctl ghost" onClick={onClose}>HUỶ</button>
          <button
            className="ctl primary"
            onClick={save}
            disabled={!valid}
            style={{ opacity: valid ? 1 : 0.5, cursor: valid ? 'pointer' : 'not-allowed' }}
          >
            LƯU THAY ĐỔI
          </button>
        </div>
      </div>
    </div>
  );
}

function InlineCreateRow({ value, onChange, onCreate, placeholder }) {
  const valid = value.trim();
  return (
    <div className="inline-create-row">
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onCreate();
          }
        }}
        placeholder={placeholder}
      />
      <button className="ctl primary sm" onClick={onCreate} disabled={!valid}>
        THÊM
      </button>
    </div>
  );
}

window.EditUnitModal = EditUnitModal;

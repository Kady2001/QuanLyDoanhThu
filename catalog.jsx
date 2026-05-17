// Product catalog — category -> product line -> classifications / variants.

const { useState: useStateC, useMemo: useMemoC } = React;

function catalogSlug(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mergeCatalogWithUnits(productLines, units) {
  const map = {};
  productLines.forEach(line => {
    map[line.id] = { ...line, variants: (line.variants || []).map(v => ({ ...v })) };
  });

  units.forEach(unit => {
    const knownLine = unit.productLineId && map[unit.productLineId];
    const byName = Object.values(map).find(line => line.name === unit.name && line.cat === unit.cat);
    const lineId = knownLine?.id || byName?.id || `line-${catalogSlug(unit.name)}`;
    if (!map[lineId]) {
      map[lineId] = {
        id: lineId,
        cat: unit.cat,
        brand: '',
        name: unit.name,
        variants: [],
        discovered: true,
      };
    }
    const line = map[lineId];
    const variantName = unit.variant || 'Mặc định';
    const variantId = unit.variantId || `variant-${catalogSlug(line.name)}-${catalogSlug(variantName)}`;
    if (!line.variants.some(v => v.id === variantId || v.name === variantName)) {
      line.variants.push({ id: variantId, name: variantName, discovered: true });
    }
  });

  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
}

function findCatalogLine(catalogLines, unit) {
  return catalogLines.find(line => line.id === unit.productLineId)
    || catalogLines.find(line => line.name === unit.name && line.cat === unit.cat)
    || null;
}

function findCatalogVariant(line, unit) {
  if (!line) return null;
  return line.variants.find(v => v.id === unit.variantId)
    || line.variants.find(v => v.name === (unit.variant || 'Mặc định'))
    || null;
}

function attachCatalogRefs(rows, catalogLines) {
  return rows.map(unit => {
    const line = findCatalogLine(catalogLines, unit);
    const variant = findCatalogVariant(line, unit);
    return line && variant
      ? {
          ...unit,
          productLineId: line.id,
          variantId: variant.id,
          name: line.name,
          cat: line.cat,
          variant: variant.name,
        }
      : unit;
  });
}

function Catalog({ productLines, units, onAddLine, onAddVariant, onUpdateLine, onUpdateVariant, readOnly = false }) {
  const catalogLines = useMemoC(() => mergeCatalogWithUnits(productLines, units), [productLines, units]);
  const [cat, setCat] = useStateC('all');
  const [showLineForm, setShowLineForm] = useStateC(false);
  const [variantTarget, setVariantTarget] = useStateC(null);
  const [editingLine, setEditingLine] = useStateC(null);
  const [editingVariant, setEditingVariant] = useStateC(null);

  const visibleLines = catalogLines.filter(line => cat === 'all' || line.cat === cat);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title"><span className="accent"></span>Danh mục sản phẩm</h1>
          <div className="page-sub">
            {catalogLines.length} dòng sản phẩm · mỗi giao dịch phải chọn đúng dòng sản phẩm và phân loại nhỏ
          </div>
        </div>
        <div className="page-controls">
          <button className="ctl primary" onClick={() => setShowLineForm(true)} disabled={readOnly}>+ THÊM DÒNG SẢN PHẨM</button>
        </div>
      </div>

      <div className="chips">
        <button className={`chip ${cat === 'all' ? 'active' : ''}`} onClick={() => setCat('all')}>
          TẤT CẢ
        </button>
        {window.CATEGORIES.map(c => (
          <button key={c.id} className={`chip ${cat === c.id ? 'active' : ''}`} onClick={() => setCat(c.id)}>
            <i style={{ width: 7, height: 7, background: c.color, display: 'inline-block' }}></i>
            {c.name.toUpperCase()}
          </button>
        ))}
      </div>

      <div className="catalog-grid">
        {visibleLines.map(line => {
          const category = window.CATEGORIES.find(c => c.id === line.cat);
          const count = units.filter(u => u.productLineId === line.id || (u.name === line.name && u.cat === line.cat)).length;
          return (
            <div key={line.id} className="card catalog-card">
              <div className="catalog-card-head">
                <div>
                  <div className="catalog-line-name">{line.name}</div>
                  <div className="catalog-line-meta">
                    <CatPill cat={line.cat} /> {line.brand ? `· ${line.brand}` : ''} · {count} giao dịch
                  </div>
                </div>
                <div className="catalog-card-actions">
                  <button className="ctl ghost sm" onClick={() => setEditingLine(line)} disabled={readOnly}>SỬA</button>
                  <button className="ctl ghost sm" onClick={() => setVariantTarget(line)} disabled={readOnly}>+ PHÂN LOẠI</button>
                </div>
              </div>
              <div className="catalog-variants">
                {line.variants.map(v => (
                  <div key={v.id} className="catalog-variant">
                    <span>{v.name}</span>
                    <div className="catalog-variant-actions">
                      {v.discovered && <span className="catalog-discovered">từ dữ liệu</span>}
                      <button
                        className="ctl ghost sm"
                        onClick={() => setEditingVariant({ line, variant: v })}
                        disabled={readOnly}
                      >
                        SỬA
                      </button>
                    </div>
                  </div>
                ))}
                {line.variants.length === 0 && <div className="empty">Chưa có phân loại</div>}
              </div>
            </div>
          );
        })}
      </div>

      {showLineForm && (
        <AddProductLineModal
          onClose={() => setShowLineForm(false)}
          onSave={(line) => {
            onAddLine(line);
            setShowLineForm(false);
          }}
        />
      )}
      {variantTarget && (
        <AddVariantModal
          line={variantTarget}
          onClose={() => setVariantTarget(null)}
          onSave={(variant) => {
            onAddVariant(variantTarget, variant);
            setVariantTarget(null);
          }}
        />
      )}
      {editingLine && (
        <EditProductLineModal
          line={editingLine}
          catalogLines={catalogLines}
          onClose={() => setEditingLine(null)}
          onSave={(patch) => {
            onUpdateLine(editingLine, patch);
            setEditingLine(null);
          }}
        />
      )}
      {editingVariant && (
        <EditVariantModal
          line={editingVariant.line}
          variant={editingVariant.variant}
          onClose={() => setEditingVariant(null)}
          onSave={(patch) => {
            onUpdateVariant(editingVariant.line, editingVariant.variant, patch);
            setEditingVariant(null);
          }}
        />
      )}
    </div>
  );
}

function AddProductLineModal({ onClose, onSave }) {
  const [form, setForm] = useStateC({ name: '', brand: '', cat: 'keyboard', firstVariant: '' });
  const valid = form.name.trim() && form.firstVariant.trim();
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title"><span className="accent"></span>THÊM DÒNG SẢN PHẨM</div>
          <button className="close-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="field-row">
            <div className="field">
              <label>Tên dòng sản phẩm</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="vd. AULA F75" autoFocus />
            </div>
            <div className="field">
              <label>Thương hiệu</label>
              <input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="vd. AULA" />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Danh mục</label>
              <select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })}>
                {window.CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Phân loại đầu tiên</label>
              <input value={form.firstVariant} onChange={e => setForm({ ...form, firstVariant: e.target.value })} placeholder="vd. Trắng xanh · Switch Reaper" />
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="ctl ghost" onClick={onClose}>HUỶ</button>
          <button
            className="ctl primary"
            disabled={!valid}
            onClick={() => {
              const id = catalogSlug(form.name);
              onSave({
                id,
                cat: form.cat,
                brand: form.brand.trim(),
                name: form.name.trim(),
                variants: [{ id: `${id}-${catalogSlug(form.firstVariant)}`, name: form.firstVariant.trim() }],
              });
            }}
          >
            LƯU DÒNG SẢN PHẨM
          </button>
        </div>
      </div>
    </div>
  );
}

function AddVariantModal({ line, onClose, onSave }) {
  const [name, setName] = useStateC('');
  const valid = name.trim();
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title"><span className="accent"></span>THÊM PHÂN LOẠI</div>
          <button className="close-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="unit-summary" style={{ marginBottom: 16 }}>
            <div className="row"><span className="lbl">Dòng sản phẩm</span><span>{line.name}</span></div>
          </div>
          <div className="field">
            <label>Tên phân loại</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="vd. Trắng xanh · Switch Leobog Reaper" autoFocus />
          </div>
        </div>
        <div className="modal-foot">
          <button className="ctl ghost" onClick={onClose}>HUỶ</button>
          <button className="ctl primary" disabled={!valid} onClick={() => onSave({ id: `${line.id}-${catalogSlug(name)}`, name: name.trim() })}>
            LƯU PHÂN LOẠI
          </button>
        </div>
      </div>
    </div>
  );
}

function EditProductLineModal({ line, catalogLines, onClose, onSave }) {
  const [form, setForm] = useStateC({
    name: line.name || '',
    brand: line.brand || '',
    cat: line.cat || 'keyboard',
  });
  const trimmedName = form.name.trim();
  const duplicate = catalogLines.some(item =>
    item.id !== line.id
    && item.cat === form.cat
    && item.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );
  const valid = trimmedName && !duplicate;

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title"><span className="accent"></span>SỬA DÒNG SẢN PHẨM</div>
          <button className="close-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="unit-summary" style={{ marginBottom: 16 }}>
            <div className="row"><span className="lbl">Mã dòng</span><span className="mono">{line.id}</span></div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Tên dòng sản phẩm</label>
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                autoFocus
              />
            </div>
            <div className="field">
              <label>Thương hiệu</label>
              <input
                value={form.brand}
                onChange={e => setForm({ ...form, brand: e.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label>Danh mục</label>
            <select value={form.cat} onChange={e => setForm({ ...form, cat: e.target.value })}>
              {window.CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {duplicate && <div className="form-warning">Đã có một dòng sản phẩm trùng tên trong danh mục này.</div>}
        </div>
        <div className="modal-foot">
          <button className="ctl ghost" onClick={onClose}>HUỶ</button>
          <button
            className="ctl primary"
            disabled={!valid}
            onClick={() => onSave({
              name: trimmedName,
              brand: form.brand.trim(),
              cat: form.cat,
            })}
          >
            LƯU THAY ĐỔI
          </button>
        </div>
      </div>
    </div>
  );
}

function EditVariantModal({ line, variant, onClose, onSave }) {
  const [name, setName] = useStateC(variant.name || '');
  const trimmedName = name.trim();
  const duplicate = line.variants.some(item =>
    item.id !== variant.id
    && item.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );
  const valid = trimmedName && !duplicate;

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title"><span className="accent"></span>SỬA PHÂN LOẠI</div>
          <button className="close-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="unit-summary" style={{ marginBottom: 16 }}>
            <div className="row"><span className="lbl">Dòng sản phẩm</span><span>{line.name}</span></div>
            <div className="row"><span className="lbl">Mã phân loại</span><span className="mono">{variant.id}</span></div>
          </div>
          <div className="field">
            <label>Tên phân loại</label>
            <input value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          {duplicate && <div className="form-warning">Đã có một phân loại trùng tên trong dòng sản phẩm này.</div>}
        </div>
        <div className="modal-foot">
          <button className="ctl ghost" onClick={onClose}>HUỶ</button>
          <button
            className="ctl primary"
            disabled={!valid}
            onClick={() => onSave({ name: trimmedName })}
          >
            LƯU THAY ĐỔI
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  Catalog,
  mergeCatalogWithUnits,
  findCatalogLine,
  findCatalogVariant,
  attachCatalogRefs,
});

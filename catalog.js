(() => {
  const { useState: useStateC, useMemo: useMemoC } = React;
  function catalogSlug(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function mergeCatalogWithUnits(productLines, units) {
    const map = {};
    productLines.forEach((line) => {
      map[line.id] = { ...line, variants: (line.variants || []).map((v) => ({ ...v })) };
    });
    units.forEach((unit) => {
      const knownLine = unit.productLineId && map[unit.productLineId];
      const byName = Object.values(map).find((line2) => line2.name === unit.name && line2.cat === unit.cat);
      const lineId = knownLine?.id || byName?.id || `line-${catalogSlug(unit.name)}`;
      if (!map[lineId]) {
        map[lineId] = {
          id: lineId,
          cat: unit.cat,
          brand: "",
          name: unit.name,
          variants: [],
          discovered: true
        };
      }
      const line = map[lineId];
      const variantName = unit.variant || "M\u1EB7c \u0111\u1ECBnh";
      const variantId = unit.variantId || `variant-${catalogSlug(line.name)}-${catalogSlug(variantName)}`;
      if (!line.variants.some((v) => v.id === variantId || v.name === variantName)) {
        line.variants.push({ id: variantId, name: variantName, discovered: true });
      }
    });
    return Object.values(map).sort((a, b) => a.name.localeCompare(b.name));
  }
  function findCatalogLine(catalogLines, unit) {
    return catalogLines.find((line) => line.id === unit.productLineId) || catalogLines.find((line) => line.name === unit.name && line.cat === unit.cat) || null;
  }
  function findCatalogVariant(line, unit) {
    if (!line) return null;
    return line.variants.find((v) => v.id === unit.variantId) || line.variants.find((v) => v.name === (unit.variant || "M\u1EB7c \u0111\u1ECBnh")) || null;
  }
  function attachCatalogRefs(rows, catalogLines) {
    return rows.map((unit) => {
      const line = findCatalogLine(catalogLines, unit);
      const variant = findCatalogVariant(line, unit);
      return line && variant ? {
        ...unit,
        productLineId: line.id,
        variantId: variant.id,
        name: line.name,
        cat: line.cat,
        variant: variant.name
      } : unit;
    });
  }
  function Catalog({
    productLines,
    units,
    onAddLine,
    onAddVariant,
    onUpdateLine,
    onUpdateVariant,
    onDeleteLine,
    onDeleteVariant,
    readOnly = false
  }) {
    const catalogLines = useMemoC(() => mergeCatalogWithUnits(productLines, units), [productLines, units]);
    const usedCategoryIds = useMemoC(() => new Set(units.map((unit) => unit.cat)), [units]);
    const visibleCategories = useMemoC(
      () => window.CATEGORIES.filter((category) => usedCategoryIds.has(category.id)),
      [usedCategoryIds]
    );
    const [cat, setCat] = useStateC("all");
    const [showLineForm, setShowLineForm] = useStateC(false);
    const [variantTarget, setVariantTarget] = useStateC(null);
    const [editingLine, setEditingLine] = useStateC(null);
    const [editingVariant, setEditingVariant] = useStateC(null);
    const [editMode, setEditMode] = useStateC(false);
    const visibleLines = catalogLines.filter((line) => cat === "all" || line.cat === cat);
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "page-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "Danh m\u1EE5c s\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("div", { className: "page-sub" }, catalogLines.length, " d\xF2ng s\u1EA3n ph\u1EA9m \xB7 m\u1ED7i giao d\u1ECBch ph\u1EA3i ch\u1ECDn \u0111\xFAng d\xF2ng s\u1EA3n ph\u1EA9m v\xE0 ph\xE2n lo\u1EA1i nh\u1ECF")), /* @__PURE__ */ React.createElement("div", { className: "page-controls" }, /* @__PURE__ */ React.createElement("label", { className: `catalog-edit-toggle ${editMode ? "active" : ""}` }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: editMode, onChange: (e) => setEditMode(e.target.checked) }), "EDIT MODE"), /* @__PURE__ */ React.createElement("button", { className: "ctl primary", onClick: () => setShowLineForm(true), disabled: readOnly }, "+ TH\xCAM D\xD2NG S\u1EA2N PH\u1EA8M"))), /* @__PURE__ */ React.createElement("div", { className: "chips" }, /* @__PURE__ */ React.createElement("button", { className: `chip ${cat === "all" ? "active" : ""}`, onClick: () => setCat("all") }, "T\u1EA4T C\u1EA2"), visibleCategories.map((c) => /* @__PURE__ */ React.createElement("button", { key: c.id, className: `chip ${cat === c.id ? "active" : ""}`, onClick: () => setCat(c.id) }, /* @__PURE__ */ React.createElement("i", { style: { width: 7, height: 7, background: c.color, display: "inline-block" } }), c.name.toUpperCase()))), /* @__PURE__ */ React.createElement("div", { className: "catalog-grid" }, visibleLines.map((line) => {
      const category = window.CATEGORIES.find((c) => c.id === line.cat);
      const count = units.filter((u) => u.productLineId === line.id || u.name === line.name && u.cat === line.cat).length;
      return /* @__PURE__ */ React.createElement("div", { key: line.id, className: "card catalog-card" }, /* @__PURE__ */ React.createElement("div", { className: "catalog-card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "catalog-line-name" }, line.name), /* @__PURE__ */ React.createElement("div", { className: "catalog-line-meta" }, /* @__PURE__ */ React.createElement(CatPill, { cat: line.cat }), " ", line.brand ? `\xB7 ${line.brand}` : "", " \xB7 ", count, " giao d\u1ECBch")), /* @__PURE__ */ React.createElement("div", { className: "catalog-card-actions" }, /* @__PURE__ */ React.createElement("button", { className: "ctl ghost sm", onClick: () => setEditingLine(line), disabled: readOnly }, "S\u1EECA"), /* @__PURE__ */ React.createElement("button", { className: "ctl ghost sm", onClick: () => setVariantTarget(line), disabled: readOnly }, "+ PH\xC2N LO\u1EA0I"), editMode && /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "ctl danger sm",
          onClick: () => window.confirm(`X\xF3a d\xF2ng s\u1EA3n ph\u1EA9m "${line.name}"?`) && onDeleteLine(line),
          disabled: readOnly
        },
        "X\xD3A"
      ))), /* @__PURE__ */ React.createElement("div", { className: "catalog-variants" }, line.variants.map((v) => /* @__PURE__ */ React.createElement("div", { key: v.id, className: "catalog-variant" }, /* @__PURE__ */ React.createElement("span", null, v.name), /* @__PURE__ */ React.createElement("div", { className: "catalog-variant-actions" }, v.discovered && /* @__PURE__ */ React.createElement("span", { className: "catalog-discovered" }, "t\u1EEB d\u1EEF li\u1EC7u"), /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "ctl ghost sm",
          onClick: () => setEditingVariant({ line, variant: v }),
          disabled: readOnly
        },
        "S\u1EECA"
      ), editMode && /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "ctl danger sm",
          onClick: () => window.confirm(`X\xF3a ph\xE2n lo\u1EA1i "${v.name}"?`) && onDeleteVariant(line, v),
          disabled: readOnly
        },
        "X\xD3A"
      )))), line.variants.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "empty" }, "Ch\u01B0a c\xF3 ph\xE2n lo\u1EA1i")));
    })), showLineForm && /* @__PURE__ */ React.createElement(
      AddProductLineModal,
      {
        onClose: () => setShowLineForm(false),
        onSave: (line) => {
          onAddLine(line);
          setShowLineForm(false);
        }
      }
    ), variantTarget && /* @__PURE__ */ React.createElement(
      AddVariantModal,
      {
        line: variantTarget,
        onClose: () => setVariantTarget(null),
        onSave: (variant) => {
          onAddVariant(variantTarget, variant);
          setVariantTarget(null);
        }
      }
    ), editingLine && /* @__PURE__ */ React.createElement(
      EditProductLineModal,
      {
        line: editingLine,
        catalogLines,
        onClose: () => setEditingLine(null),
        onSave: (patch) => {
          onUpdateLine(editingLine, patch);
          setEditingLine(null);
        }
      }
    ), editingVariant && /* @__PURE__ */ React.createElement(
      EditVariantModal,
      {
        line: editingVariant.line,
        variant: editingVariant.variant,
        onClose: () => setEditingVariant(null),
        onSave: (patch) => {
          onUpdateVariant(editingVariant.line, editingVariant.variant, patch);
          setEditingVariant(null);
        }
      }
    ));
  }
  function AddProductLineModal({ onClose, onSave }) {
    const [form, setForm] = useStateC({ name: "", brand: "", cat: "keyboard", firstVariant: "" });
    const valid = form.name.trim() && form.firstVariant.trim();
    return /* @__PURE__ */ React.createElement("div", { className: "modal-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "TH\xCAM D\xD2NG S\u1EA2N PH\u1EA8M"), /* @__PURE__ */ React.createElement("button", { className: "close-x", onClick: onClose }, "\xD7")), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "T\xEAn d\xF2ng s\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("input", { value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), placeholder: "vd. AULA F75", autoFocus: true })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Th\u01B0\u01A1ng hi\u1EC7u"), /* @__PURE__ */ React.createElement("input", { value: form.brand, onChange: (e) => setForm({ ...form, brand: e.target.value }), placeholder: "vd. AULA" }))), /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Danh m\u1EE5c"), /* @__PURE__ */ React.createElement("select", { value: form.cat, onChange: (e) => setForm({ ...form, cat: e.target.value }) }, window.CATEGORIES.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.name)))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Ph\xE2n lo\u1EA1i \u0111\u1EA7u ti\xEAn"), /* @__PURE__ */ React.createElement("input", { value: form.firstVariant, onChange: (e) => setForm({ ...form, firstVariant: e.target.value }), placeholder: "vd. Tr\u1EAFng xanh \xB7 Switch Reaper" })))), /* @__PURE__ */ React.createElement("div", { className: "modal-foot" }, /* @__PURE__ */ React.createElement("button", { className: "ctl ghost", onClick: onClose }, "HU\u1EF6"), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "ctl primary",
        disabled: !valid,
        onClick: () => {
          const id = catalogSlug(form.name);
          onSave({
            id,
            cat: form.cat,
            brand: form.brand.trim(),
            name: form.name.trim(),
            variants: [{ id: `${id}-${catalogSlug(form.firstVariant)}`, name: form.firstVariant.trim() }]
          });
        }
      },
      "L\u01AFU D\xD2NG S\u1EA2N PH\u1EA8M"
    ))));
  }
  function AddVariantModal({ line, onClose, onSave }) {
    const [name, setName] = useStateC("");
    const valid = name.trim();
    return /* @__PURE__ */ React.createElement("div", { className: "modal-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "TH\xCAM PH\xC2N LO\u1EA0I"), /* @__PURE__ */ React.createElement("button", { className: "close-x", onClick: onClose }, "\xD7")), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "unit-summary", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "D\xF2ng s\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("span", null, line.name))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "T\xEAn ph\xE2n lo\u1EA1i"), /* @__PURE__ */ React.createElement("input", { value: name, onChange: (e) => setName(e.target.value), placeholder: "vd. Tr\u1EAFng xanh \xB7 Switch Leobog Reaper", autoFocus: true }))), /* @__PURE__ */ React.createElement("div", { className: "modal-foot" }, /* @__PURE__ */ React.createElement("button", { className: "ctl ghost", onClick: onClose }, "HU\u1EF6"), /* @__PURE__ */ React.createElement("button", { className: "ctl primary", disabled: !valid, onClick: () => onSave({ id: `${line.id}-${catalogSlug(name)}`, name: name.trim() }) }, "L\u01AFU PH\xC2N LO\u1EA0I"))));
  }
  function EditProductLineModal({ line, catalogLines, onClose, onSave }) {
    const [form, setForm] = useStateC({
      name: line.name || "",
      brand: line.brand || "",
      cat: line.cat || "keyboard"
    });
    const trimmedName = form.name.trim();
    const duplicate = catalogLines.some(
      (item) => item.id !== line.id && item.cat === form.cat && item.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    const valid = trimmedName && !duplicate;
    return /* @__PURE__ */ React.createElement("div", { className: "modal-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "S\u1EECA D\xD2NG S\u1EA2N PH\u1EA8M"), /* @__PURE__ */ React.createElement("button", { className: "close-x", onClick: onClose }, "\xD7")), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "unit-summary", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "M\xE3 d\xF2ng"), /* @__PURE__ */ React.createElement("span", { className: "mono" }, line.id))), /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "T\xEAn d\xF2ng s\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement(
      "input",
      {
        value: form.name,
        onChange: (e) => setForm({ ...form, name: e.target.value }),
        autoFocus: true
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Th\u01B0\u01A1ng hi\u1EC7u"), /* @__PURE__ */ React.createElement(
      "input",
      {
        value: form.brand,
        onChange: (e) => setForm({ ...form, brand: e.target.value })
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Danh m\u1EE5c"), /* @__PURE__ */ React.createElement("select", { value: form.cat, onChange: (e) => setForm({ ...form, cat: e.target.value }) }, window.CATEGORIES.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.name)))), duplicate && /* @__PURE__ */ React.createElement("div", { className: "form-warning" }, "\u0110\xE3 c\xF3 m\u1ED9t d\xF2ng s\u1EA3n ph\u1EA9m tr\xF9ng t\xEAn trong danh m\u1EE5c n\xE0y.")), /* @__PURE__ */ React.createElement("div", { className: "modal-foot" }, /* @__PURE__ */ React.createElement("button", { className: "ctl ghost", onClick: onClose }, "HU\u1EF6"), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "ctl primary",
        disabled: !valid,
        onClick: () => onSave({
          name: trimmedName,
          brand: form.brand.trim(),
          cat: form.cat
        })
      },
      "L\u01AFU THAY \u0110\u1ED4I"
    ))));
  }
  function EditVariantModal({ line, variant, onClose, onSave }) {
    const [name, setName] = useStateC(variant.name || "");
    const trimmedName = name.trim();
    const duplicate = line.variants.some(
      (item) => item.id !== variant.id && item.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    const valid = trimmedName && !duplicate;
    return /* @__PURE__ */ React.createElement("div", { className: "modal-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "S\u1EECA PH\xC2N LO\u1EA0I"), /* @__PURE__ */ React.createElement("button", { className: "close-x", onClick: onClose }, "\xD7")), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "unit-summary", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "D\xF2ng s\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("span", null, line.name)), /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "M\xE3 ph\xE2n lo\u1EA1i"), /* @__PURE__ */ React.createElement("span", { className: "mono" }, variant.id))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "T\xEAn ph\xE2n lo\u1EA1i"), /* @__PURE__ */ React.createElement("input", { value: name, onChange: (e) => setName(e.target.value), autoFocus: true })), duplicate && /* @__PURE__ */ React.createElement("div", { className: "form-warning" }, "\u0110\xE3 c\xF3 m\u1ED9t ph\xE2n lo\u1EA1i tr\xF9ng t\xEAn trong d\xF2ng s\u1EA3n ph\u1EA9m n\xE0y.")), /* @__PURE__ */ React.createElement("div", { className: "modal-foot" }, /* @__PURE__ */ React.createElement("button", { className: "ctl ghost", onClick: onClose }, "HU\u1EF6"), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "ctl primary",
        disabled: !valid,
        onClick: () => onSave({ name: trimmedName })
      },
      "L\u01AFU THAY \u0110\u1ED4I"
    ))));
  }
  Object.assign(window, {
    Catalog,
    mergeCatalogWithUnits,
    findCatalogLine,
    findCatalogVariant,
    attachCatalogRefs
  });
})();

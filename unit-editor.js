(() => {
  const { useState: useStateUE } = React;
  const ADD_NEW_LINE = "__add_new_line__";
  const ADD_NEW_VARIANT = "__add_new_variant__";
  const ADD_NEW_CATEGORY = "__add_new_category__";
  function UnitSearchableSelect({ value, selectedLabel, placeholder, searchValue, onSearch, options, onSelect, open, onOpen, onClose, emptyText, autoFocus = false }) {
    const selected = options.find((option) => option.value === value) || (selectedLabel ? { label: selectedLabel } : null);
    return /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "search-select",
        onBlur: (e) => {
          if (!e.currentTarget.contains(e.relatedTarget)) onClose();
        }
      },
      /* @__PURE__ */ React.createElement(
        "button",
        {
          type: "button",
          className: `search-select-trigger ${open ? "open" : ""}`,
          onClick: () => open ? onClose() : onOpen(),
          onKeyDown: (e) => {
            if (e.key === "Escape") onClose();
          },
          autoFocus
        },
        /* @__PURE__ */ React.createElement("span", null, selected?.label || placeholder),
        /* @__PURE__ */ React.createElement("span", { className: "chev" }, "\u2304")
      ),
      open && /* @__PURE__ */ React.createElement("div", { className: "search-select-pop" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "text",
          value: searchValue,
          onChange: (e) => onSearch(e.target.value),
          placeholder,
          onKeyDown: (e) => {
            if (e.key === "Escape") onClose();
          },
          autoFocus: true
        }
      ), /* @__PURE__ */ React.createElement("div", { className: "search-select-list" }, options.length > 0 ? options.map((option) => /* @__PURE__ */ React.createElement(
        "button",
        {
          key: option.value,
          type: "button",
          className: `search-select-item ${option.value === value ? "selected" : ""}`,
          onClick: () => {
            onSelect(option.value);
            onClose();
          }
        },
        /* @__PURE__ */ React.createElement("span", null, option.label),
        option.meta && /* @__PURE__ */ React.createElement("small", null, option.meta)
      )) : /* @__PURE__ */ React.createElement("div", { className: "search-select-empty" }, emptyText)))
    );
  }
  function EditUnitModal({
    unit,
    catalogLines,
    today,
    onCreateCategory,
    onCreateLine,
    onCreateVariant,
    onClose,
    onSave
  }) {
    const initialLine = window.findCatalogLine(catalogLines, unit) || catalogLines[0] || null;
    const initialVariant = window.findCatalogVariant(initialLine, unit) || initialLine?.variants?.[0] || null;
    const [form, setForm] = useStateUE({
      productLineId: initialLine?.id || "",
      variantId: initialVariant?.id || "",
      cat: unit.cat || initialLine?.cat || "keyboard",
      buy: unit.buy ?? "",
      expectedSell: unit.expectedSell ?? unit.buy ?? "",
      arrived: unit.arrived || today,
      status: unit.status || "in_stock",
      sell: unit.sell ?? unit.expectedSell ?? unit.buy ?? "",
      sold: unit.sold || today,
      note: unit.note || ""
    });
    const [showNewLine, setShowNewLine] = useStateUE(false);
    const [showNewVariant, setShowNewVariant] = useStateUE(false);
    const [showNewCategory, setShowNewCategory] = useStateUE(false);
    const [showQuickLine, setShowQuickLine] = useStateUE(false);
    const [showQuickVariant, setShowQuickVariant] = useStateUE(false);
    const [newLineName, setNewLineName] = useStateUE("");
    const [newVariantName, setNewVariantName] = useStateUE("");
    const [newCategoryName, setNewCategoryName] = useStateUE("");
    const [lineDropdownOpen, setLineDropdownOpen] = useStateUE(false);
    const [variantDropdownOpen, setVariantDropdownOpen] = useStateUE(false);
    const [lineSearch, setLineSearch] = useStateUE("");
    const [variantSearch, setVariantSearch] = useStateUE("");
    const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
    const selectedLine = catalogLines.find((line) => line.id === form.productLineId) || null;
    const selectedVariant = selectedLine?.variants.find((variant) => variant.id === form.variantId) || null;
    const normalizedLineSearch = lineSearch.trim().toLowerCase();
    const lineOptions = catalogLines.filter((line) => !normalizedLineSearch || [line.name, line.brand, window.CATEGORIES.find((category) => category.id === line.cat)?.name].some((value) => String(value || "").toLowerCase().includes(normalizedLineSearch))).map((line) => ({
      value: line.id,
      label: line.name,
      meta: window.CATEGORIES.find((category) => category.id === line.cat)?.name || ""
    }));
    const normalizedVariantSearch = variantSearch.trim().toLowerCase();
    const variantOptions = (selectedLine?.variants || []).filter((variant) => !normalizedVariantSearch || String(variant.name || "").toLowerCase().includes(normalizedVariantSearch)).map((variant) => ({ value: variant.id, label: variant.name }));
    const selectLine = (lineId) => {
      const line = catalogLines.find((item) => item.id === lineId);
      setForm((prev) => ({
        ...prev,
        productLineId: lineId,
        variantId: line?.variants?.[0]?.id || "",
        cat: line?.cat || prev.cat
      }));
      setVariantSearch("");
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
      set("variantId", value);
    };
    const handleCategoryChange = (value) => {
      if (value === ADD_NEW_CATEGORY) {
        setShowNewCategory(true);
        return;
      }
      setShowNewCategory(false);
      set("cat", value);
    };
    const createLine = () => {
      const line = onCreateLine?.(newLineName, form.cat);
      if (!line) return;
      setForm((prev) => ({
        ...prev,
        productLineId: line.id,
        variantId: line.variants?.[0]?.id || "",
        cat: line.cat
      }));
      setNewLineName("");
      setShowNewLine(false);
    };
    const createVariant = () => {
      const variant = onCreateVariant?.(selectedLine, newVariantName);
      if (!variant) return;
      set("variantId", variant.id);
      setNewVariantName("");
      setShowNewVariant(false);
    };
    const createCategory = () => {
      const category = onCreateCategory?.(newCategoryName);
      if (!category) return;
      set("cat", category.id);
      setNewCategoryName("");
      setShowNewCategory(false);
    };
    const isSold = form.status === "sold";
    const valid = selectedLine && selectedVariant && form.buy !== "" && form.expectedSell !== "" && +form.buy >= 0 && +form.expectedSell >= 0 && form.arrived && (!isSold || form.sell !== "" && +form.sell >= 0 && form.sold);
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
        status: form.status
      };
      if (isSold) {
        next.sell = +form.sell;
        next.sold = new Date(form.sold) < new Date(form.arrived) ? form.arrived : form.sold;
      }
      onSave(unit.id, next);
    };
    return /* @__PURE__ */ React.createElement("div", { className: "modal-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal edit-unit-modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "S\u1EECA GIAO D\u1ECACH"), /* @__PURE__ */ React.createElement("button", { className: "close-x", onClick: onClose }, "\xD7")), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "M\xE3 giao d\u1ECBch"), /* @__PURE__ */ React.createElement("input", { type: "text", value: unit.transactionCode, disabled: true })), /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label-actions" }, "D\xF2ng s\u1EA3n ph\u1EA9m", /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setShowQuickLine(true) }, "+ t\u1EA1o nhanh")), /* @__PURE__ */ React.createElement(
      UnitSearchableSelect,
      {
        value: form.productLineId,
        selectedLabel: selectedLine?.name,
        placeholder: "T\xECm d\xF2ng s\u1EA3n ph\u1EA9m theo t\xEAn...",
        searchValue: lineSearch,
        onSearch: setLineSearch,
        options: lineOptions,
        onSelect: selectLine,
        open: lineDropdownOpen,
        onOpen: () => {
          setLineDropdownOpen(true);
          setVariantDropdownOpen(false);
        },
        onClose: () => setLineDropdownOpen(false),
        emptyText: "Kh\xF4ng t\xECm th\u1EA5y d\xF2ng s\u1EA3n ph\u1EA9m ph\xF9 h\u1EE3p",
        autoFocus: true
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", { className: "field-label-actions" }, "Ph\xE2n lo\u1EA1i", /* @__PURE__ */ React.createElement("button", { type: "button", onClick: () => setShowQuickVariant(true), disabled: !selectedLine }, "+ t\u1EA1o nhanh")), /* @__PURE__ */ React.createElement(
      UnitSearchableSelect,
      {
        value: form.variantId,
        selectedLabel: selectedVariant?.name,
        placeholder: "T\xECm ph\xE2n lo\u1EA1i...",
        searchValue: variantSearch,
        onSearch: setVariantSearch,
        options: variantOptions,
        onSelect: (value) => set("variantId", value),
        open: variantDropdownOpen,
        onOpen: () => {
          setVariantDropdownOpen(true);
          setLineDropdownOpen(false);
        },
        onClose: () => setVariantDropdownOpen(false),
        emptyText: "Kh\xF4ng t\xECm th\u1EA5y ph\xE2n lo\u1EA1i ph\xF9 h\u1EE3p"
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "field-row three" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Danh m\u1EE5c"), /* @__PURE__ */ React.createElement("select", { value: form.cat, onChange: (e) => handleCategoryChange(e.target.value) }, window.CATEGORIES.map((category) => /* @__PURE__ */ React.createElement("option", { key: category.id, value: category.id }, category.name)), /* @__PURE__ */ React.createElement("option", { value: ADD_NEW_CATEGORY }, "+ Th\xEAm danh m\u1EE5c m\u1EDBi")), showNewCategory && /* @__PURE__ */ React.createElement(
      InlineCreateRow,
      {
        value: newCategoryName,
        onChange: setNewCategoryName,
        onCreate: createCategory,
        placeholder: "T\xEAn danh m\u1EE5c m\u1EDBi"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Tr\u1EA1ng th\xE1i"), /* @__PURE__ */ React.createElement("select", { value: form.status, onChange: (e) => set("status", e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "in_stock" }, "T\u1ED3n kho"), /* @__PURE__ */ React.createElement("option", { value: "sold" }, "\u0110\xE3 b\xE1n"))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Ng\xE0y nh\u1EADp"), /* @__PURE__ */ React.createElement("input", { type: "date", value: form.arrived, onChange: (e) => set("arrived", e.target.value) }))), /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Gi\xE1 mua (ngh\xECn)"), /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", value: form.buy, onChange: (e) => set("buy", e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Gi\xE1 b\xE1n d\u1EF1 ki\u1EBFn (ngh\xECn)"), /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", value: form.expectedSell, onChange: (e) => set("expectedSell", e.target.value) }))), isSold && /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Gi\xE1 b\xE1n th\u1EF1c t\u1EBF (ngh\xECn)"), /* @__PURE__ */ React.createElement("input", { type: "number", min: "0", value: form.sell, onChange: (e) => set("sell", e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Ng\xE0y b\xE1n"), /* @__PURE__ */ React.createElement("input", { type: "date", value: form.sold, onChange: (e) => set("sold", e.target.value) }))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Ghi ch\xFA"), /* @__PURE__ */ React.createElement("textarea", { value: form.note, onChange: (e) => set("note", e.target.value), placeholder: "Kh\xF4ng gi\u1EDBi h\u1EA1n k\xFD t\u1EF1..." })), /* @__PURE__ */ React.createElement("div", { className: "unit-summary" }, /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "M\xE3 gi\u1EEF nguy\xEAn"), /* @__PURE__ */ React.createElement("span", { className: "mono", style: { fontWeight: 800 } }, unit.transactionCode)), /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Sau khi l\u01B0u"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700 } }, isSold ? "Hi\u1EC7n \u1EDF T\u1ED5ng quan" : "Hi\u1EC7n \u1EDF Kho h\xE0ng")))), /* @__PURE__ */ React.createElement("div", { className: "modal-foot" }, /* @__PURE__ */ React.createElement("button", { className: "ctl ghost", onClick: onClose }, "HU\u1EF6"), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "ctl primary",
        onClick: save,
        disabled: !valid,
        style: { opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed" }
      },
      "L\u01AFU THAY \u0110\u1ED4I"
    ))), showQuickLine && /* @__PURE__ */ React.createElement(
      EditQuickCreateLineModal,
      {
        defaultCategoryId: form.cat,
        onClose: () => setShowQuickLine(false),
        onSave: ({ name, cat, variant }) => {
          const line = onCreateLine?.(name, cat);
          if (!line) return;
          const createdVariant = variant.trim() && variant.trim() !== "M\u1EB7c \u0111\u1ECBnh" ? onCreateVariant?.(line, variant) : line.variants?.[0];
          setForm((prev) => ({
            ...prev,
            productLineId: line.id,
            variantId: createdVariant?.id || line.variants?.[0]?.id || "",
            cat: line.cat
          }));
          setShowQuickLine(false);
        }
      }
    ), showQuickVariant && selectedLine && /* @__PURE__ */ React.createElement(
      EditQuickCreateVariantModal,
      {
        line: selectedLine,
        onClose: () => setShowQuickVariant(false),
        onSave: (name) => {
          const variant = onCreateVariant?.(selectedLine, name);
          if (!variant) return;
          set("variantId", variant.id);
          setShowQuickVariant(false);
        }
      }
    ));
  }
  function EditQuickCreateLineModal({ defaultCategoryId, onClose, onSave }) {
    const [form, setForm] = useStateUE({ name: "", cat: defaultCategoryId || window.CATEGORIES[0]?.id || "", variant: "" });
    const valid = form.name.trim() && form.cat;
    return /* @__PURE__ */ React.createElement("div", { className: "modal-bg nested", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal quick-catalog-modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "T\u1EA0O NHANH D\xD2NG S\u1EA2N PH\u1EA8M"), /* @__PURE__ */ React.createElement("button", { className: "close-x", onClick: onClose }, "\xD7")), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "T\xEAn d\xF2ng s\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("input", { value: form.name, onChange: (e) => setForm({ ...form, name: e.target.value }), autoFocus: true })), /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Danh m\u1EE5c"), /* @__PURE__ */ React.createElement("select", { value: form.cat, onChange: (e) => setForm({ ...form, cat: e.target.value }) }, window.CATEGORIES.map((c) => /* @__PURE__ */ React.createElement("option", { key: c.id, value: c.id }, c.name)))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Ph\xE2n lo\u1EA1i \u0111\u1EA7u ti\xEAn"), /* @__PURE__ */ React.createElement("input", { value: form.variant, onChange: (e) => setForm({ ...form, variant: e.target.value }), placeholder: "\u0111\u1EC3 tr\u1ED1ng = M\u1EB7c \u0111\u1ECBnh" })))), /* @__PURE__ */ React.createElement("div", { className: "modal-foot" }, /* @__PURE__ */ React.createElement("button", { className: "ctl ghost", onClick: onClose }, "HU\u1EF6"), /* @__PURE__ */ React.createElement("button", { className: "ctl primary", disabled: !valid, onClick: () => onSave(form) }, "T\u1EA0O"))));
  }
  function EditQuickCreateVariantModal({ line, onClose, onSave }) {
    const [name, setName] = useStateUE("");
    return /* @__PURE__ */ React.createElement("div", { className: "modal-bg nested", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal quick-catalog-modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "T\u1EA0O NHANH PH\xC2N LO\u1EA0I"), /* @__PURE__ */ React.createElement("button", { className: "close-x", onClick: onClose }, "\xD7")), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "unit-summary", style: { marginBottom: 16 } }, /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "D\xF2ng s\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("span", null, line.name))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "T\xEAn ph\xE2n lo\u1EA1i"), /* @__PURE__ */ React.createElement("input", { value: name, onChange: (e) => setName(e.target.value), autoFocus: true }))), /* @__PURE__ */ React.createElement("div", { className: "modal-foot" }, /* @__PURE__ */ React.createElement("button", { className: "ctl ghost", onClick: onClose }, "HU\u1EF6"), /* @__PURE__ */ React.createElement("button", { className: "ctl primary", disabled: !name.trim(), onClick: () => onSave(name) }, "T\u1EA0O"))));
  }
  function InlineCreateRow({ value, onChange, onCreate, placeholder }) {
    const valid = value.trim();
    return /* @__PURE__ */ React.createElement("div", { className: "inline-create-row" }, /* @__PURE__ */ React.createElement(
      "input",
      {
        value,
        onChange: (e) => onChange(e.target.value),
        onKeyDown: (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onCreate();
          }
        },
        placeholder
      }
    ), /* @__PURE__ */ React.createElement("button", { className: "ctl primary sm", onClick: onCreate, disabled: !valid }, "TH\xCAM"));
  }
  window.EditUnitModal = EditUnitModal;
})();

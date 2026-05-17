(() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  const { useState: useStateUE } = React;
  const ADD_NEW_LINE = "__add_new_line__";
  const ADD_NEW_VARIANT = "__add_new_variant__";
  const ADD_NEW_CATEGORY = "__add_new_category__";
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
    var _a, _b, _c, _d, _e, _f, _g;
    const initialLine = window.findCatalogLine(catalogLines, unit) || catalogLines[0] || null;
    const initialVariant = window.findCatalogVariant(initialLine, unit) || ((_a = initialLine == null ? void 0 : initialLine.variants) == null ? void 0 : _a[0]) || null;
    const [form, setForm] = useStateUE({
      productLineId: (initialLine == null ? void 0 : initialLine.id) || "",
      variantId: (initialVariant == null ? void 0 : initialVariant.id) || "",
      cat: unit.cat || (initialLine == null ? void 0 : initialLine.cat) || "keyboard",
      buy: (_b = unit.buy) != null ? _b : "",
      expectedSell: (_d = (_c = unit.expectedSell) != null ? _c : unit.buy) != null ? _d : "",
      arrived: unit.arrived || today,
      status: unit.status || "in_stock",
      sell: (_g = (_f = (_e = unit.sell) != null ? _e : unit.expectedSell) != null ? _f : unit.buy) != null ? _g : "",
      sold: unit.sold || today,
      note: unit.note || ""
    });
    const [showNewLine, setShowNewLine] = useStateUE(false);
    const [showNewVariant, setShowNewVariant] = useStateUE(false);
    const [showNewCategory, setShowNewCategory] = useStateUE(false);
    const [newLineName, setNewLineName] = useStateUE("");
    const [newVariantName, setNewVariantName] = useStateUE("");
    const [newCategoryName, setNewCategoryName] = useStateUE("");
    const set = (key, value) => setForm((prev) => __spreadProps(__spreadValues({}, prev), { [key]: value }));
    const selectedLine = catalogLines.find((line) => line.id === form.productLineId) || null;
    const selectedVariant = (selectedLine == null ? void 0 : selectedLine.variants.find((variant) => variant.id === form.variantId)) || null;
    const selectLine = (lineId) => {
      const line = catalogLines.find((item) => item.id === lineId);
      setForm((prev) => {
        var _a2, _b2;
        return __spreadProps(__spreadValues({}, prev), {
          productLineId: lineId,
          variantId: ((_b2 = (_a2 = line == null ? void 0 : line.variants) == null ? void 0 : _a2[0]) == null ? void 0 : _b2.id) || "",
          cat: (line == null ? void 0 : line.cat) || prev.cat
        });
      });
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
      const line = onCreateLine == null ? void 0 : onCreateLine(newLineName, form.cat);
      if (!line) return;
      setForm((prev) => {
        var _a2, _b2;
        return __spreadProps(__spreadValues({}, prev), {
          productLineId: line.id,
          variantId: ((_b2 = (_a2 = line.variants) == null ? void 0 : _a2[0]) == null ? void 0 : _b2.id) || "",
          cat: line.cat
        });
      });
      setNewLineName("");
      setShowNewLine(false);
    };
    const createVariant = () => {
      const variant = onCreateVariant == null ? void 0 : onCreateVariant(selectedLine, newVariantName);
      if (!variant) return;
      set("variantId", variant.id);
      setNewVariantName("");
      setShowNewVariant(false);
    };
    const createCategory = () => {
      const category = onCreateCategory == null ? void 0 : onCreateCategory(newCategoryName);
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
    return /* @__PURE__ */ React.createElement("div", { className: "modal-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal edit-unit-modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "S\u1EECA GIAO D\u1ECACH"), /* @__PURE__ */ React.createElement("button", { className: "close-x", onClick: onClose }, "\xD7")), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "M\xE3 giao d\u1ECBch"), /* @__PURE__ */ React.createElement("input", { type: "text", value: unit.transactionCode, disabled: true })), /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "D\xF2ng s\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("select", { value: form.productLineId, onChange: (e) => handleLineChange(e.target.value), autoFocus: true }, catalogLines.map((line) => /* @__PURE__ */ React.createElement("option", { key: line.id, value: line.id }, line.name)), /* @__PURE__ */ React.createElement("option", { value: ADD_NEW_LINE }, "+ Th\xEAm d\xF2ng s\u1EA3n ph\u1EA9m m\u1EDBi")), showNewLine && /* @__PURE__ */ React.createElement(
      InlineCreateRow,
      {
        value: newLineName,
        onChange: setNewLineName,
        onCreate: createLine,
        placeholder: "T\xEAn d\xF2ng s\u1EA3n ph\u1EA9m m\u1EDBi"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Ph\xE2n lo\u1EA1i"), /* @__PURE__ */ React.createElement("select", { value: form.variantId, onChange: (e) => handleVariantChange(e.target.value) }, ((selectedLine == null ? void 0 : selectedLine.variants) || []).map((variant) => /* @__PURE__ */ React.createElement("option", { key: variant.id, value: variant.id }, variant.name)), /* @__PURE__ */ React.createElement("option", { value: ADD_NEW_VARIANT }, "+ Th\xEAm ph\xE2n lo\u1EA1i m\u1EDBi")), showNewVariant && /* @__PURE__ */ React.createElement(
      InlineCreateRow,
      {
        value: newVariantName,
        onChange: setNewVariantName,
        onCreate: createVariant,
        placeholder: "T\xEAn ph\xE2n lo\u1EA1i m\u1EDBi"
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
    ))));
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

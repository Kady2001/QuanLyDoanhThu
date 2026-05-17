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
  const { useState: useStateI, useMemo: useMemoI } = React;
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
    readOnly = false
  }) {
    const [search, setSearch] = useStateI("");
    const [cat, setCat] = useStateI("all");
    const [sort, setSort] = useStateI("arrived_desc");
    const [showAdd, setShowAdd] = useStateI(false);
    const [sellingUnit, setSellingUnit] = useStateI(null);
    const [editingUnit, setEditingUnit] = useStateI(null);
    const [selectedStructureCategoryId, setSelectedStructureCategoryId] = useStateI(null);
    const filtered = useMemoI(() => {
      let r = inStock.filter((p) => {
        const s = search.toLowerCase();
        const matchSearch = !s || p.name.toLowerCase().includes(s) || (p.variant || "").toLowerCase().includes(s) || (p.transactionCode || "").toLowerCase().includes(s);
        const matchCat = cat === "all" || p.cat === cat;
        return matchSearch && matchCat;
      });
      r = r.slice().sort((a, b) => {
        if (sort === "name") return a.name.localeCompare(b.name);
        if (sort === "price_asc") return a.expectedSell - b.expectedSell;
        if (sort === "price_desc") return b.expectedSell - a.expectedSell;
        if (sort === "buy_desc") return b.buy - a.buy;
        if (sort === "arrived_desc") return new Date(b.arrived) - new Date(a.arrived);
        if (sort === "arrived_asc") return new Date(a.arrived) - new Date(b.arrived);
        return 0;
      });
      return r;
    }, [inStock, search, cat, sort]);
    const totalUnits = inStock.length;
    const totalValue = inStock.reduce((s, p) => s + p.buy, 0);
    const totalSellValue = inStock.reduce((s, p) => s + (p.expectedSell || p.buy), 0);
    const expectedProfit = totalSellValue - totalValue;
    const catCounts = useMemoI(() => {
      const m = { all: inStock.length };
      inStock.forEach((p) => {
        m[p.cat] = (m[p.cat] || 0) + 1;
      });
      return m;
    }, [inStock]);
    const categoryStructure = useMemoI(() => {
      return window.CATEGORIES.map((category) => {
        const rows = inStock.filter((unit) => unit.cat === category.id);
        const units2 = rows.length;
        const capital = rows.reduce((sum, unit) => sum + (+unit.buy || 0), 0);
        const expectedSell = rows.reduce((sum, unit) => sum + (+(unit.expectedSell || unit.buy) || 0), 0);
        return __spreadProps(__spreadValues({}, category), {
          units: units2,
          capital,
          expectedSell,
          capitalShare: totalValue > 0 ? capital / totalValue * 100 : 0,
          unitShare: totalUnits > 0 ? units2 / totalUnits * 100 : 0
        });
      }).filter((item) => item.units > 0 || item.capital > 0);
    }, [inStock, totalUnits, totalValue]);
    const quantityDonutData = categoryStructure.map((item) => ({
      categoryId: item.id,
      label: item.name,
      value: item.units,
      color: item.color
    }));
    const capitalDonutData = categoryStructure.filter((item) => item.capital > 0).map((item) => ({
      categoryId: item.id,
      label: item.name,
      value: item.capital,
      color: item.color
    }));
    const selectedStructureCategory = categoryStructure.find((item) => item.id === selectedStructureCategoryId) || null;
    const selectedCategoryLines = useMemoI(() => {
      if (!selectedStructureCategoryId) return [];
      const grouped = /* @__PURE__ */ new Map();
      inStock.filter((unit) => unit.cat === selectedStructureCategoryId).forEach((unit) => {
        const line = window.findCatalogLine(catalogLines, unit);
        const key = (line == null ? void 0 : line.id) || `${unit.cat}__${unit.name}`;
        const current = grouped.get(key) || {
          id: key,
          name: (line == null ? void 0 : line.name) || unit.name,
          quantity: 0,
          capital: 0,
          expectedSell: 0
        };
        current.quantity += 1;
        current.capital += +unit.buy || 0;
        current.expectedSell += +(unit.expectedSell || unit.buy) || 0;
        grouped.set(key, current);
      });
      return [...grouped.values()].map((line) => __spreadProps(__spreadValues({}, line), {
        expectedProfit: line.expectedSell - line.capital,
        capitalShare: (selectedStructureCategory == null ? void 0 : selectedStructureCategory.capital) > 0 ? line.capital / selectedStructureCategory.capital * 100 : 0
      })).sort((a, b) => b.capital - a.capital || b.quantity - a.quantity || a.name.localeCompare(b.name));
    }, [selectedStructureCategoryId, selectedStructureCategory, inStock, catalogLines]);
    const daysInStock = (arrived) => {
      const d1 = new Date(today), d2 = new Date(arrived);
      return Math.floor((d1 - d2) / (1e3 * 60 * 60 * 24));
    };
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "page-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "Qu\u1EA3n l\xFD kho h\xE0ng"), /* @__PURE__ */ React.createElement("div", { className: "page-sub" }, totalUnits, " \u0111\u01A1n v\u1ECB trong kho \xB7 m\u1ED7i d\xF2ng = 1 m\xF3n ri\xEAng bi\u1EC7t")), /* @__PURE__ */ React.createElement("div", { className: "page-controls" }, /* @__PURE__ */ React.createElement("div", { className: "search" }, /* @__PURE__ */ React.createElement("span", { className: "search-icon" }, /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "8" }), /* @__PURE__ */ React.createElement("path", { d: "m21 21-4.3-4.3" }))), /* @__PURE__ */ React.createElement("input", { type: "text", placeholder: "T\xECm theo m\xE3 / t\xEAn / variant...", value: search, onChange: (e) => setSearch(e.target.value) })), /* @__PURE__ */ React.createElement("select", { className: "ctl", value: sort, onChange: (e) => setSort(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "arrived_desc" }, "M\u1EDAI V\u1EC0 TR\u01AF\u1EDAC"), /* @__PURE__ */ React.createElement("option", { value: "arrived_asc" }, "C\u0168 V\u1EC0 TR\u01AF\u1EDAC"), /* @__PURE__ */ React.createElement("option", { value: "name" }, "T\xCAN A-Z"), /* @__PURE__ */ React.createElement("option", { value: "price_asc" }, "GI\xC1 B\xC1N T\u0102NG"), /* @__PURE__ */ React.createElement("option", { value: "price_desc" }, "GI\xC1 B\xC1N GI\u1EA2M"), /* @__PURE__ */ React.createElement("option", { value: "buy_desc" }, "V\u1ED0N CAO NH\u1EA4T")), /* @__PURE__ */ React.createElement(ImportDataButton, { today, onImport: importUnits, disabled: readOnly }), /* @__PURE__ */ React.createElement(ExportDataButton, { units, today }), /* @__PURE__ */ React.createElement("button", { className: "ctl primary", onClick: () => setShowAdd(true), disabled: readOnly }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 16, lineHeight: 1 } }, "+"), " NH\u1EACP H\xC0NG M\u1EDAI"))), /* @__PURE__ */ React.createElement("div", { className: "inv-sum" }, /* @__PURE__ */ React.createElement("div", { className: "kpi" }, /* @__PURE__ */ React.createElement("div", { className: "kpi-label" }, "T\u1ED5ng \u0111\u01A1n v\u1ECB t\u1ED3n"), /* @__PURE__ */ React.createElement("div", { className: "kpi-value mono" }, totalUnits, /* @__PURE__ */ React.createElement("span", { className: "unit" }, "m\xF3n"))), /* @__PURE__ */ React.createElement("div", { className: "kpi blue" }, /* @__PURE__ */ React.createElement("div", { className: "kpi-label" }, "Gi\xE1 tr\u1ECB kho (v\u1ED1n)"), /* @__PURE__ */ React.createElement("div", { className: "kpi-value mono", style: { color: "#2563eb" } }, window.fmtK(totalValue), /* @__PURE__ */ React.createElement("span", { className: "unit" }, "\u0111"))), /* @__PURE__ */ React.createElement("div", { className: "kpi purple" }, /* @__PURE__ */ React.createElement("div", { className: "kpi-label" }, "Gi\xE1 b\xE1n d\u1EF1 ki\u1EBFn"), /* @__PURE__ */ React.createElement("div", { className: "kpi-value mono", style: { color: "#7c3aed" } }, window.fmtK(totalSellValue), /* @__PURE__ */ React.createElement("span", { className: "unit" }, "\u0111"))), /* @__PURE__ */ React.createElement("div", { className: "kpi green" }, /* @__PURE__ */ React.createElement("div", { className: "kpi-label" }, "L\u1EE3i nhu\u1EADn d\u1EF1 ki\u1EBFn"), /* @__PURE__ */ React.createElement("div", { className: "kpi-value mono", style: { color: "#10b981" } }, "+", window.fmtK(expectedProfit), /* @__PURE__ */ React.createElement("span", { className: "unit" }, "\u0111")), /* @__PURE__ */ React.createElement("div", { className: "kpi-delta" }, /* @__PURE__ */ React.createElement("span", { className: "up" }, "\u25B2 ", totalValue > 0 ? (expectedProfit / totalValue * 100).toFixed(1) : 0, "%"), /* @__PURE__ */ React.createElement("span", null, "bi\xEAn d\u1EF1 ki\u1EBFn")))), /* @__PURE__ */ React.createElement("div", { className: "chips" }, /* @__PURE__ */ React.createElement("button", { className: `chip ${cat === "all" ? "active" : ""}`, onClick: () => setCat("all") }, "T\u1EA4T C\u1EA2 ", /* @__PURE__ */ React.createElement("span", { className: "chip-count" }, catCounts.all || 0)), window.CATEGORIES.map((c) => /* @__PURE__ */ React.createElement("button", { key: c.id, className: `chip ${cat === c.id ? "active" : ""}`, onClick: () => setCat(c.id) }, /* @__PURE__ */ React.createElement("i", { style: { width: 7, height: 7, background: c.color, display: "inline-block" } }), c.name.toUpperCase(), " ", /* @__PURE__ */ React.createElement("span", { className: "chip-count" }, catCounts[c.id] || 0)))), /* @__PURE__ */ React.createElement("div", { className: "charts-row inventory-layout" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, "T\u1ED3n kho chi ti\u1EBFt"), /* @__PURE__ */ React.createElement("div", { className: "card-sub" }, filtered.length, " m\xF3n \xB7 b\u1EA5m B\xC1N \u0111\u1EC3 chuy\u1EC3n sang s\u1ED5 doanh thu"))), /* @__PURE__ */ React.createElement("div", { className: "tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "tbl" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "M\xE3 GD"), /* @__PURE__ */ React.createElement("th", null, "S\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("th", null, "Danh m\u1EE5c"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "Gi\xE1 mua"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "Gi\xE1 b\xE1n DK"), /* @__PURE__ */ React.createElement("th", null, "Ng\xE0y v\u1EC1"), /* @__PURE__ */ React.createElement("th", null, "T\u1ED3n"), /* @__PURE__ */ React.createElement("th", null, "Ghi ch\xFA"), /* @__PURE__ */ React.createElement("th", null))), /* @__PURE__ */ React.createElement("tbody", null, filtered.map((p) => {
      const days = daysInStock(p.arrived);
      const isAged = days > 14;
      return /* @__PURE__ */ React.createElement("tr", { key: p.id }, /* @__PURE__ */ React.createElement("td", { className: "mono txn-code" }, p.transactionCode), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { className: "product-cell" }, /* @__PURE__ */ React.createElement(ProductThumb, { cat: p.cat, size: 38 }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "name" }, p.name), p.variant && /* @__PURE__ */ React.createElement("span", { className: "variant" }, p.variant)))), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(CatPill, { cat: p.cat })), /* @__PURE__ */ React.createElement("td", { className: "num mono" }, p.buy.toLocaleString("vi-VN")), /* @__PURE__ */ React.createElement("td", { className: "num mono", style: { fontWeight: 700, color: "#7c3aed" } }, (p.expectedSell || 0).toLocaleString("vi-VN")), /* @__PURE__ */ React.createElement("td", { className: "mono", style: { fontSize: 12, color: "#6b6b80" } }, new Date(p.arrived).toLocaleDateString("vi-VN")), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: `status-tag ${isAged ? "status-low" : "status-ok"}` }, /* @__PURE__ */ React.createElement("span", { className: "d" }), days, "N")), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(
        "textarea",
        {
          className: "note-input",
          value: p.note || "",
          placeholder: "ghi ch\xFA...",
          onChange: (e) => updateNote(p.id, e.target.value),
          disabled: readOnly
        }
      )), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { className: "row-actions" }, /* @__PURE__ */ React.createElement("button", { className: "ctl ghost sm", onClick: () => setEditingUnit(p), disabled: readOnly }, "S\u1EECA"), /* @__PURE__ */ React.createElement("button", { className: "ctl primary sm", onClick: () => setSellingUnit(p), disabled: readOnly }, "B\xC1N \u2192"), /* @__PURE__ */ React.createElement("button", { className: "ctl ghost sm", disabled: readOnly, onClick: () => {
        if (confirm(`Xo\xE1 "${p.name}${p.variant ? " \xB7 " + p.variant : ""}" kh\u1ECFi kho?`)) removeUnit(p.id);
      }, title: "Xo\xE1 kh\u1ECFi kho" }, "\u{1F5D1}"))));
    }), filtered.length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "9", className: "empty" }, "Kh\xF4ng t\xECm th\u1EA5y s\u1EA3n ph\u1EA9m ph\xF9 h\u1EE3p"))), /* @__PURE__ */ React.createElement("tfoot", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "3" }, "T\u1ED4NG (", filtered.length, " m\xF3n)"), /* @__PURE__ */ React.createElement("td", { className: "num mono" }, filtered.reduce((s, p) => s + p.buy, 0).toLocaleString("vi-VN")), /* @__PURE__ */ React.createElement("td", { className: "num mono profit-pos" }, filtered.reduce((s, p) => s + (p.expectedSell || 0), 0).toLocaleString("vi-VN")), /* @__PURE__ */ React.createElement("td", { colSpan: "4" })))))), /* @__PURE__ */ React.createElement("div", { className: "card stock-composition-card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, "C\u01A1 c\u1EA5u kho"), /* @__PURE__ */ React.createElement("div", { className: "card-sub" }, "B\u1EA5m v\xE0o danh m\u1EE5c \u0111\u1EC3 xem chi ti\u1EBFt theo d\xF2ng s\u1EA3n ph\u1EA9m"))), /* @__PURE__ */ React.createElement("div", { className: "card-body stock-composition-body" }, /* @__PURE__ */ React.createElement("div", { className: "stock-composition-section" }, /* @__PURE__ */ React.createElement("div", { className: "stock-composition-head" }, /* @__PURE__ */ React.createElement("strong", null, "Theo s\u1ED1 l\u01B0\u1EE3ng"), /* @__PURE__ */ React.createElement("span", null, "M\u1ED7i l\xE1t = % s\u1ED1 m\xF3n")), /* @__PURE__ */ React.createElement("div", { className: "stock-composition-visual" }, /* @__PURE__ */ React.createElement(
      Donut,
      {
        data: quantityDonutData,
        size: 150,
        centerLabel: "M\xD3N",
        centerValue: totalUnits,
        onSegmentClick: (segment) => setSelectedStructureCategoryId(segment.categoryId)
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "stock-composition-legend" }, categoryStructure.map((item) => /* @__PURE__ */ React.createElement("button", { key: item.id, onClick: () => setSelectedStructureCategoryId(item.id) }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { style: { background: item.color } }), item.name), /* @__PURE__ */ React.createElement("strong", { className: "mono" }, item.units, " \xB7 ", item.unitShare.toFixed(1), "%")))))), /* @__PURE__ */ React.createElement("div", { className: "stock-composition-section" }, /* @__PURE__ */ React.createElement("div", { className: "stock-composition-head" }, /* @__PURE__ */ React.createElement("strong", null, "Theo v\u1ED1n"), /* @__PURE__ */ React.createElement("span", null, "T\u1EC9 tr\u1ECDng v\u1ED1n \u0111ang n\u1EB1m trong kho")), /* @__PURE__ */ React.createElement("div", { className: "stock-composition-visual" }, /* @__PURE__ */ React.createElement(
      Donut,
      {
        data: capitalDonutData,
        size: 150,
        centerLabel: "V\u1ED0N",
        centerValue: window.fmtK(totalValue),
        onSegmentClick: (segment) => setSelectedStructureCategoryId(segment.categoryId)
      }
    ), /* @__PURE__ */ React.createElement("div", { className: "capital-share-list" }, categoryStructure.map((item) => /* @__PURE__ */ React.createElement("button", { key: item.id, onClick: () => setSelectedStructureCategoryId(item.id) }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { style: { background: item.color } }), item.name), /* @__PURE__ */ React.createElement("em", null, /* @__PURE__ */ React.createElement("b", { style: { width: `${item.capitalShare}%`, background: item.color } })), /* @__PURE__ */ React.createElement("strong", { className: "mono" }, window.fmtK(item.capital), " \xB7 ", item.capitalShare.toFixed(1), "%")))))), categoryStructure.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "empty", style: { padding: 20 } }, "Kho tr\u1ED1ng")))), showAdd && /* @__PURE__ */ React.createElement(
      AddProductModal,
      {
        catalogLines,
        today,
        onClose: () => setShowAdd(false),
        onSave: (p) => {
          addUnit(p);
          setShowAdd(false);
        }
      }
    ), sellingUnit && /* @__PURE__ */ React.createElement(
      SellModal,
      {
        unit: sellingUnit,
        today,
        onClose: () => setSellingUnit(null),
        onConfirm: (sellPrice, soldDate, note) => {
          sellUnit(sellingUnit.id, sellPrice, soldDate, note);
          setSellingUnit(null);
        }
      }
    ), editingUnit && /* @__PURE__ */ React.createElement(
      EditUnitModal,
      {
        unit: editingUnit,
        catalogLines,
        today,
        onCreateCategory,
        onCreateLine,
        onCreateVariant,
        onClose: () => setEditingUnit(null),
        onSave: (id, patch) => {
          updateUnit(id, patch);
          setEditingUnit(null);
        }
      }
    ), selectedStructureCategory && /* @__PURE__ */ React.createElement(
      StockCategoryDetailModal,
      {
        category: selectedStructureCategory,
        lines: selectedCategoryLines,
        onClose: () => setSelectedStructureCategoryId(null)
      }
    ));
  }
  function StockCategoryDetailModal({ category, lines, onClose }) {
    const expectedProfit = category.expectedSell - category.capital;
    const capitalByLine = lines.map((line) => ({
      label: line.name,
      value: line.capital,
      color: category.color
    }));
    return /* @__PURE__ */ React.createElement("div", { className: "modal-bg analytics-modal-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal stock-detail-modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head analytics-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "CHI TI\u1EBET C\u01A0 C\u1EA4U KHO \xB7 ", category.name), /* @__PURE__ */ React.createElement("div", { className: "card-sub" }, category.units, " m\xF3n \xB7 chi\u1EBFm ", category.capitalShare.toFixed(1), "% v\u1ED1n kho hi\u1EC7n t\u1EA1i")), /* @__PURE__ */ React.createElement("button", { className: "close-x", onClick: onClose }, "\xD7")), /* @__PURE__ */ React.createElement("div", { className: "modal-body stock-detail-body" }, /* @__PURE__ */ React.createElement("div", { className: "stock-detail-kpis" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "S\u1ED1 l\u01B0\u1EE3ng"), /* @__PURE__ */ React.createElement("strong", { className: "mono" }, category.units)), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "V\u1ED1n \u0111ang chi\u1EBFm"), /* @__PURE__ */ React.createElement("strong", { className: "mono" }, window.fmtK(category.capital), "\u0111")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "Gi\xE1 b\xE1n d\u1EF1 ki\u1EBFn"), /* @__PURE__ */ React.createElement("strong", { className: "mono" }, window.fmtK(category.expectedSell), "\u0111")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "L\xE3i d\u1EF1 ki\u1EBFn"), /* @__PURE__ */ React.createElement("strong", { className: `mono ${expectedProfit >= 0 ? "profit-pos" : "profit-neg"}` }, expectedProfit < 0 ? "\u2212" : "+", window.fmtK(Math.abs(expectedProfit)), "\u0111"))), /* @__PURE__ */ React.createElement("div", { className: "stock-detail-grid" }, /* @__PURE__ */ React.createElement("div", { className: "card analytics-panel" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, "V\u1ED1n theo d\xF2ng s\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("div", { className: "card-sub" }, "D\xF2ng n\xE0o \u0111ang gi\u1EEF nhi\u1EC1u ti\u1EC1n nh\u1EA5t"))), /* @__PURE__ */ React.createElement("div", { className: "card-body" }, capitalByLine.length > 0 ? /* @__PURE__ */ React.createElement(
      BarChart,
      {
        data: capitalByLine,
        height: Math.max(220, lines.length * 42),
        labelWidth: 180,
        valueGutter: 58,
        width: 560
      }
    ) : /* @__PURE__ */ React.createElement("div", { className: "empty" }, "Ch\u01B0a c\xF3 d\u1EEF li\u1EC7u"))), /* @__PURE__ */ React.createElement("div", { className: "card analytics-panel" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, "Chi ti\u1EBFt t\u1EEBng d\xF2ng s\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("div", { className: "card-sub" }, "S\u1ED1 l\u01B0\u1EE3ng v\xE0 v\u1ED1n hi\u1EC7n \u0111ang n\u1EB1m trong kho"))), /* @__PURE__ */ React.createElement("div", { className: "tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "tbl analytics-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "D\xF2ng s\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "SL"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "V\u1ED1n"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "% v\u1ED1n"))), /* @__PURE__ */ React.createElement("tbody", null, lines.map((line) => /* @__PURE__ */ React.createElement("tr", { key: line.id }, /* @__PURE__ */ React.createElement("td", null, line.name), /* @__PURE__ */ React.createElement("td", { className: "num mono" }, line.quantity), /* @__PURE__ */ React.createElement("td", { className: "num mono" }, line.capital.toLocaleString("vi-VN")), /* @__PURE__ */ React.createElement("td", { className: "num mono" }, line.capitalShare.toFixed(1), "%"))), lines.length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "4", className: "empty" }, "Ch\u01B0a c\xF3 d\xF2ng s\u1EA3n ph\u1EA9m n\xE0o"))))))))));
  }
  function SellModal({ unit, today, onClose, onConfirm }) {
    const [sellPrice, setSellPrice] = useStateI(unit.expectedSell || unit.buy);
    const [soldDate, setSoldDate] = useStateI(today);
    const [note, setNote] = useStateI(unit.note || "");
    const profit = (+sellPrice || 0) - unit.buy;
    const ratio = unit.buy > 0 ? (+sellPrice || 0) / unit.buy * 100 : 0;
    const isLoss = profit < 0;
    return /* @__PURE__ */ React.createElement("div", { className: "modal-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "GHI NH\u1EACN B\xC1N H\xC0NG"), /* @__PURE__ */ React.createElement("button", { className: "close-x", onClick: onClose }, "\xD7")), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { style: { background: "var(--bg-2)", border: "1px solid var(--border)", padding: "12px 14px", marginBottom: 18 } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" } }, "\u0110ang b\xE1n"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, fontWeight: 800, marginTop: 4 } }, unit.name), unit.variant && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--muted)", marginTop: 2 } }, "Variant: ", unit.variant), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 12, color: "var(--muted)", marginTop: 6 } }, "M\xE3 GD ", /* @__PURE__ */ React.createElement("span", { className: "mono", style: { color: "var(--text)", fontWeight: 700 } }, unit.transactionCode), " \xB7 \u0110\xE3 nh\u1EADp ", /* @__PURE__ */ React.createElement("span", { className: "mono", style: { color: "var(--text)", fontWeight: 700 } }, unit.buy.toLocaleString("vi-VN"), "K"), " \xB7 Ng\xE0y v\u1EC1 ", /* @__PURE__ */ React.createElement("span", { className: "mono", style: { color: "var(--text)", fontWeight: 700 } }, new Date(unit.arrived).toLocaleDateString("vi-VN")))), /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Gi\xE1 b\xE1n th\u1EF1c t\u1EBF (ngh\xECn)"), /* @__PURE__ */ React.createElement("input", { type: "number", value: sellPrice, onChange: (e) => setSellPrice(e.target.value), autoFocus: true })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Ng\xE0y b\xE1n"), /* @__PURE__ */ React.createElement("input", { type: "date", value: soldDate, onChange: (e) => setSoldDate(e.target.value) }))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Ghi ch\xFA"), /* @__PURE__ */ React.createElement("input", { type: "text", value: note, onChange: (e) => setNote(e.target.value), placeholder: "vd. KH H\xE0 N\u1ED9i, ship 13/5, BH 15 ng\xE0y..." })), /* @__PURE__ */ React.createElement("div", { className: "unit-summary" }, /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "L\u1EE3i nhu\u1EADn"), /* @__PURE__ */ React.createElement("span", { className: `mono ${isLoss ? "profit-neg" : "profit-pos"}`, style: { fontSize: 16 } }, isLoss ? "\u2212" : "+", Math.abs(profit).toLocaleString("vi-VN"), "K", isLoss && /* @__PURE__ */ React.createElement("span", { className: "loss-tag" }, "L\u1ED6"))), /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "T\u1EC9 l\u1EC7 b\xE1n/mua"), /* @__PURE__ */ React.createElement("span", { className: "mono", style: { fontWeight: 800, color: ratio >= 110 ? "#10b981" : ratio >= 100 ? "#f59e0b" : "#e11d48" } }, ratio.toFixed(1), "%")))), /* @__PURE__ */ React.createElement("div", { className: "modal-foot" }, /* @__PURE__ */ React.createElement("button", { className: "ctl ghost", onClick: onClose }, "HU\u1EF6"), /* @__PURE__ */ React.createElement("button", { className: "ctl primary", onClick: () => onConfirm(sellPrice, soldDate, note) }, "X\xC1C NH\u1EACN B\xC1N"))));
  }
  function AddProductModal({ catalogLines, today, onClose, onSave }) {
    var _a, _b;
    const firstLine = catalogLines[0];
    const firstVariant = (_a = firstLine == null ? void 0 : firstLine.variants) == null ? void 0 : _a[0];
    const [form, setForm] = useStateI({
      productLineId: (firstLine == null ? void 0 : firstLine.id) || "",
      variantId: (firstVariant == null ? void 0 : firstVariant.id) || "",
      buy: "",
      expectedSell: "",
      quantity: 1,
      arrived: today,
      note: ""
    });
    const selectedLine = catalogLines.find((line) => line.id === form.productLineId);
    const selectedVariant = selectedLine == null ? void 0 : selectedLine.variants.find((v) => v.id === form.variantId);
    const set = (k, v) => setForm(__spreadProps(__spreadValues({}, form), { [k]: v }));
    const selectLine = (lineId) => {
      var _a2, _b2;
      const line = catalogLines.find((x) => x.id === lineId);
      setForm(__spreadProps(__spreadValues({}, form), { productLineId: lineId, variantId: ((_b2 = (_a2 = line == null ? void 0 : line.variants) == null ? void 0 : _a2[0]) == null ? void 0 : _b2.id) || "" }));
    };
    const valid = selectedLine && selectedVariant && form.buy && form.expectedSell;
    const save = () => {
      if (!valid) return;
      onSave({
        productLineId: selectedLine.id,
        variantId: selectedVariant.id,
        name: selectedLine.name,
        cat: selectedLine.cat,
        variant: selectedVariant.name,
        buy: +form.buy,
        expectedSell: +form.expectedSell,
        quantity: Math.max(1, Math.floor(+form.quantity || 1)),
        arrived: form.arrived,
        note: form.note
      });
    };
    const profit = (+form.expectedSell || 0) - (+form.buy || 0);
    const ratio = +form.buy > 0 ? +form.expectedSell / +form.buy * 100 : 0;
    return /* @__PURE__ */ React.createElement("div", { className: "modal-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "NH\u1EACP H\xC0NG M\u1EDAI"), /* @__PURE__ */ React.createElement("button", { className: "close-x", onClick: onClose }, "\xD7")), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "D\xF2ng s\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("select", { value: form.productLineId, onChange: (e) => selectLine(e.target.value), autoFocus: true }, catalogLines.map((line) => /* @__PURE__ */ React.createElement("option", { key: line.id, value: line.id }, line.name)))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Ph\xE2n lo\u1EA1i"), /* @__PURE__ */ React.createElement("select", { value: form.variantId, onChange: (e) => set("variantId", e.target.value) }, ((selectedLine == null ? void 0 : selectedLine.variants) || []).map((v) => /* @__PURE__ */ React.createElement("option", { key: v.id, value: v.id }, v.name))))), /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Danh m\u1EE5c"), /* @__PURE__ */ React.createElement("input", { type: "text", value: ((_b = window.CATEGORIES.find((c) => c.id === (selectedLine == null ? void 0 : selectedLine.cat))) == null ? void 0 : _b.name) || "", disabled: true })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Ng\xE0y v\u1EC1 h\xE0ng"), /* @__PURE__ */ React.createElement("input", { type: "date", value: form.arrived, onChange: (e) => set("arrived", e.target.value) }))), /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Gi\xE1 mua (ngh\xECn)"), /* @__PURE__ */ React.createElement("input", { type: "number", value: form.buy, onChange: (e) => set("buy", e.target.value), placeholder: "vd. 580" })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Gi\xE1 b\xE1n d\u1EF1 ki\u1EBFn (ngh\xECn)"), /* @__PURE__ */ React.createElement("input", { type: "number", value: form.expectedSell, onChange: (e) => set("expectedSell", e.target.value), placeholder: "vd. 720" }))), /* @__PURE__ */ React.createElement("div", { className: "field-row" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "S\u1ED1 l\u01B0\u1EE3ng nh\u1EADp"), /* @__PURE__ */ React.createElement("input", { type: "number", min: "1", value: form.quantity, onChange: (e) => set("quantity", e.target.value) })), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "M\xE3 giao d\u1ECBch s\u1EBD t\u1EA1o"), /* @__PURE__ */ React.createElement("input", { type: "text", value: `${Math.max(1, Math.floor(+form.quantity || 1))} m\xE3 ri\xEAng bi\u1EC7t`, disabled: true }))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Ghi ch\xFA"), /* @__PURE__ */ React.createElement("input", { type: "text", value: form.note, onChange: (e) => set("note", e.target.value), placeholder: "tu\u1EF3 ch\u1ECDn" })), form.buy && form.expectedSell && /* @__PURE__ */ React.createElement("div", { className: "unit-summary" }, /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "L\u1EE3i nhu\u1EADn d\u1EF1 ki\u1EBFn"), /* @__PURE__ */ React.createElement("span", { className: `mono ${profit >= 0 ? "profit-pos" : "profit-neg"}` }, profit < 0 ? "\u2212" : "+", Math.abs(profit).toLocaleString("vi-VN"), "K")), /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "T\u1EC9 l\u1EC7 d\u1EF1 ki\u1EBFn"), /* @__PURE__ */ React.createElement("span", { className: "mono", style: { fontWeight: 800, color: ratio >= 110 ? "#10b981" : "#f59e0b" } }, ratio.toFixed(1), "%")))), /* @__PURE__ */ React.createElement("div", { className: "modal-foot" }, /* @__PURE__ */ React.createElement("button", { className: "ctl ghost", onClick: onClose }, "HU\u1EF6"), /* @__PURE__ */ React.createElement("button", { className: "ctl primary", onClick: save, disabled: !valid, style: { opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed" } }, "L\u01AFU V\xC0O KHO"))));
  }
  window.Inventory = Inventory;
})();

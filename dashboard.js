(() => {
  const { useState: useStateD, useMemo: useMemoD } = React;
  const MONTH_NAMES = ["Th\xE1ng 1", "Th\xE1ng 2", "Th\xE1ng 3", "Th\xE1ng 4", "Th\xE1ng 5", "Th\xE1ng 6", "Th\xE1ng 7", "Th\xE1ng 8", "Th\xE1ng 9", "Th\xE1ng 10", "Th\xE1ng 11", "Th\xE1ng 12"];
  function CatPill({ cat }) {
    const c = window.CATEGORIES.find((x) => x.id === cat);
    return /* @__PURE__ */ React.createElement("span", { className: `cat-pill cat-${cat}` }, /* @__PURE__ */ React.createElement("span", { className: "dot", style: { background: c?.color || "var(--muted)" } }), c?.name || cat);
  }
  function RateBar({ pct }) {
    const w = Math.min(Math.max((pct - 70) / 90 * 100, 2), 100);
    const cls = pct >= 110 ? "" : pct >= 100 ? "flat" : "neg";
    const color = pct >= 110 ? "#10b981" : pct >= 100 ? "#9a9aae" : "#e11d48";
    return /* @__PURE__ */ React.createElement("span", { className: "rate-bar" }, /* @__PURE__ */ React.createElement("span", { className: "bar" }, /* @__PURE__ */ React.createElement("i", { className: cls, style: { width: `${w}%` } })), /* @__PURE__ */ React.createElement("span", { className: "mono", style: { fontSize: 12, fontWeight: 800, color, minWidth: 56, textAlign: "right" } }, pct.toFixed(1), "%"));
  }
  function dashDateOnly(value) {
    const d = value instanceof Date ? new Date(value) : new Date(value);
    if (Number.isNaN(d.getTime())) return /* @__PURE__ */ new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }
  function dashDateIso(value) {
    const d = dashDateOnly(value);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  function dashAddDays(value, days) {
    const d = dashDateOnly(value);
    d.setDate(d.getDate() + days);
    return d;
  }
  function dashboardRangeBounds(range, todayD) {
    if (range.kind === "day") {
      const start2 = dashDateOnly(range.date || todayD);
      return { start: start2, end: start2, days: 1 };
    }
    if (range.kind === "7days") {
      const end2 = dashDateOnly(range.end || todayD);
      return { start: dashAddDays(end2, -6), end: end2, days: 7 };
    }
    const start = new Date(range.year, range.month, 1);
    const rawEnd = new Date(range.year, range.month + 1, 0);
    const end = rawEnd > todayD ? dashDateOnly(todayD) : rawEnd;
    return { start, end, days: Math.max(1, Math.floor((end - start) / 864e5) + 1) };
  }
  function dashboardRangeLabel(range, todayD) {
    const bounds = dashboardRangeBounds(range, todayD);
    if (range.kind === "day") return `Ng\xE0y ${bounds.start.toLocaleDateString("vi-VN")}`;
    if (range.kind === "7days") return `7 ng\xE0y ${bounds.start.toLocaleDateString("vi-VN")} - ${bounds.end.toLocaleDateString("vi-VN")}`;
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
    readOnly = false
  }) {
    const todayD = new Date(today);
    const [range, setRange] = useStateD(() => ({
      kind: "month",
      year: todayD.getFullYear(),
      month: todayD.getMonth()
    }));
    const [catFilter, setCatFilter] = useStateD("all");
    const [confirmCancel, setConfirmCancel] = useStateD(null);
    const [editingUnit, setEditingUnit] = useStateD(null);
    const [showAnalytics, setShowAnalytics] = useStateD(false);
    const [showAffiliateModal, setShowAffiliateModal] = useStateD(false);
    const [detailedMode, setDetailedMode] = useStateD(false);
    const fmtAmount = (n, detailed = detailedMode) => {
      if (n === 0) return "0";
      const abs = Math.abs(n);
      const sign = n < 0 ? "-" : "";
      if (detailed) {
        return sign + Math.round(abs).toLocaleString("en-US");
      }
      if (abs >= 1e3) return sign + (abs / 1e3).toFixed(abs >= 1e4 ? 1 : 2).replace(/\.0+$/, "") + "M";
      return sign + Math.round(abs).toLocaleString("vi-VN");
    };
    const moneyUnit = detailedMode ? "ngh\xECn \u0111" : "\u0111";
    const toggleMoneyDetail = () => setDetailedMode((prev) => !prev);
    const moneyToggleTitle = detailedMode ? "Click \u0111\u1EC3 thu g\u1ECDn s\u1ED1 ti\u1EC1n" : "Click \u0111\u1EC3 xem chi ti\u1EBFt \u0111\u1EBFn \u0111\u01A1n v\u1ECB ngh\xECn \u0111\u1ED3ng";
    const rangeBounds = useMemoD(() => dashboardRangeBounds(range, todayD), [range, today]);
    const rangeLabel = dashboardRangeLabel(range, todayD);
    const inPeriod = (d, r = range) => {
      const { start, end } = dashboardRangeBounds(r, todayD);
      const day = dashDateOnly(d);
      return day >= start && day <= end;
    };
    const filtered = useMemoD(() => {
      return sold.filter((s) => {
        const d = new Date(s.sold);
        const inCat = catFilter === "all" || s.cat === catFilter;
        return inPeriod(d, range) && inCat;
      });
    }, [sold, range, catFilter]);
    const periodAffiliateEntries = useMemoD(() => {
      return (affiliateIncomes || []).filter((entry) => inPeriod(new Date(entry.receivedAt), range));
    }, [affiliateIncomes, range]);
    const paidAffiliateEntries = periodAffiliateEntries.filter((entry) => entry.status !== "pending");
    const pendingAffiliateEntries = periodAffiliateEntries.filter((entry) => entry.status === "pending");
    const paidAffiliateIncome = paidAffiliateEntries.reduce((sum, entry) => sum + (+entry.amount || 0), 0);
    const pendingAffiliateIncome = pendingAffiliateEntries.reduce((sum, entry) => sum + (+entry.amount || 0), 0);
    const totalAffiliateIncome = paidAffiliateIncome + pendingAffiliateIncome;
    const affiliateIncomeUsedInProfit = paidAffiliateIncome + (includePendingAffiliateInProfit ? pendingAffiliateIncome : 0);
    const includeAffiliateInProfit = catFilter === "all";
    const totalRev = filtered.reduce((s, x) => s + x.sell, 0);
    const totalBuy = filtered.reduce((s, x) => s + x.buy, 0);
    const salesProfit = totalRev - totalBuy;
    const totalProfit = salesProfit + (includeAffiliateInProfit ? affiliateIncomeUsedInProfit : 0);
    const profitLabel = !includeAffiliateInProfit ? "L\u1EE3i nhu\u1EADn b\xE1n h\xE0ng" : includePendingAffiliateInProfit && pendingAffiliateIncome > 0 ? "L\u1EE3i nhu\u1EADn d\u1EF1 ki\u1EBFn sau AFF" : pendingAffiliateIncome > 0 ? "L\u1EE3i nhu\u1EADn sau AFF \u0111\xE3 tr\u1EA3" : "L\u1EE3i nhu\u1EADn sau AFF";
    const itemsSold = filtered.length;
    const lossCount = filtered.filter((x) => x.sell < x.buy).length;
    const avgRatio = totalBuy > 0 ? totalRev / totalBuy * 100 : 0;
    const periodEndDate = rangeBounds.end;
    const inventoryValueAt = (date) => units.filter((u) => {
      const arrived = new Date(u.arrived);
      const soldDate = u.sold ? new Date(u.sold) : null;
      const inCat = catFilter === "all" || u.cat === catFilter;
      return inCat && arrived <= date && (!soldDate || soldDate > date);
    }).reduce((sum, u) => sum + u.buy, 0);
    const currentInventoryValue = inventoryValueAt(periodEndDate);
    const prevDelta = useMemoD(() => {
      const currentStart = rangeBounds.start;
      const currentEnd = rangeBounds.end;
      const prevEnd = dashAddDays(currentStart, -1);
      const prevStart = dashAddDays(prevEnd, -(rangeBounds.days - 1));
      const inPrevRange = (dateValue) => {
        const d = dashDateOnly(dateValue);
        return d >= prevStart && d <= prevEnd;
      };
      const prev = sold.filter((s) => {
        const inCat = catFilter === "all" || s.cat === catFilter;
        return inPrevRange(s.sold) && inCat;
      });
      const pRev = prev.reduce((s, x) => s + x.sell, 0);
      const pSalesProfit = prev.reduce((s, x) => s + (x.sell - x.buy), 0);
      const pAffiliateIncome = (affiliateIncomes || []).filter((entry) => {
        const includedByStatus = entry.status !== "pending" || includePendingAffiliateInProfit;
        return inPrevRange(entry.receivedAt) && includedByStatus;
      }).reduce((sum, entry) => sum + (+entry.amount || 0), 0);
      const pProfit = pSalesProfit + (includeAffiliateInProfit ? pAffiliateIncome : 0);
      const prevInventoryValue = inventoryValueAt(prevEnd);
      return {
        rev: pRev !== 0 ? (totalRev - pRev) / Math.abs(pRev) * 100 : null,
        profit: pProfit !== 0 ? (totalProfit - pProfit) / Math.abs(pProfit) * 100 : null,
        items: prev.length ? (itemsSold - prev.length) / prev.length * 100 : null,
        inventory: prevInventoryValue !== 0 ? (currentInventoryValue - prevInventoryValue) / Math.abs(prevInventoryValue) * 100 : null
      };
    }, [sold, rangeBounds, catFilter, totalRev, totalProfit, itemsSold, currentInventoryValue, units, affiliateIncomes, includeAffiliateInProfit, includePendingAffiliateInProfit]);
    const lineData = useMemoD(() => {
      const buckets = [];
      for (let i = 0; i < rangeBounds.days; i++) {
        const d = dashAddDays(rangeBounds.start, i);
        buckets.push({ date: d, rev: 0, salesProfit: 0, affiliate: 0, profit: 0, inventory: inventoryValueAt(d) });
      }
      filtered.forEach((s) => {
        const sd = dashDateOnly(s.sold);
        const idx = buckets.findIndex((b) => b.date.getTime() === sd.getTime());
        if (idx >= 0) {
          buckets[idx].rev += s.sell;
          buckets[idx].salesProfit += s.sell - s.buy;
        }
      });
      if (includeAffiliateInProfit) {
        periodAffiliateEntries.filter((entry) => entry.status !== "pending" || includePendingAffiliateInProfit).forEach((entry) => {
          const receivedAt = dashDateOnly(entry.receivedAt);
          const idx = buckets.findIndex((b) => b.date.getTime() === receivedAt.getTime());
          if (idx >= 0) buckets[idx].affiliate += +entry.amount || 0;
        });
      }
      buckets.forEach((bucket) => {
        bucket.profit = bucket.salesProfit + bucket.affiliate;
      });
      return {
        days: buckets.map((b) => `${b.date.getDate()}/${b.date.getMonth() + 1}`),
        rev: buckets.map((b) => b.rev),
        salesProfit: buckets.map((b) => b.salesProfit),
        affiliate: buckets.map((b) => b.affiliate),
        profit: buckets.map((b) => b.profit),
        inventory: buckets.map((b) => b.inventory)
      };
    }, [filtered, rangeBounds, units, catFilter, periodAffiliateEntries, includeAffiliateInProfit, includePendingAffiliateInProfit]);
    const profitByCat = useMemoD(() => {
      const map = {};
      filtered.forEach((s) => {
        map[s.cat] = (map[s.cat] || 0) + (s.sell - s.buy);
      });
      return window.CATEGORIES.map((c) => ({ label: c.name, value: map[c.id] || 0, color: c.color })).filter((d) => d.value !== 0).sort((a, b) => b.value - a.value);
    }, [filtered]);
    const ratioByCat = useMemoD(() => {
      const map = {};
      filtered.forEach((s) => {
        if (!map[s.cat]) map[s.cat] = { buy: 0, sell: 0 };
        map[s.cat].buy += s.buy;
        map[s.cat].sell += s.sell;
      });
      return window.CATEGORIES.map((c) => ({ ...c, ratio: map[c.id] ? map[c.id].sell / map[c.id].buy * 100 : null })).filter((c) => c.ratio !== null).sort((a, b) => b.ratio - a.ratio);
    }, [filtered]);
    const catCounts = useMemoD(() => {
      const inPeriodSales = sold.filter((s) => inPeriod(new Date(s.sold), range));
      const m = { all: inPeriodSales.length };
      inPeriodSales.forEach((s) => {
        m[s.cat] = (m[s.cat] || 0) + 1;
      });
      return m;
    }, [sold, range]);
    const usedCategoryIds = useMemoD(() => new Set(units.map((unit) => unit.cat)), [units]);
    const visibleCategories = useMemoD(
      () => window.CATEGORIES.filter((category) => usedCategoryIds.has(category.id)),
      [usedCategoryIds]
    );
    const timelinePoints = useMemoD(() => [
      ...sold.map((s) => ({ date: s.sold })),
      ...(affiliateIncomes || []).map((entry) => ({ date: entry.receivedAt }))
    ], [sold, affiliateIncomes]);
    const currentInventory = useMemoD(() => units.filter((u) => u.status === "in_stock" && (catFilter === "all" || u.cat === catFilter)), [units, catFilter]);
    const revenueByCat = useMemoD(() => {
      const map = {};
      filtered.forEach((s) => {
        map[s.cat] = (map[s.cat] || 0) + s.sell;
      });
      return window.CATEGORIES.map((c) => ({ label: c.name, value: map[c.id] || 0, color: c.color })).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);
    }, [filtered]);
    const topProducts = useMemoD(() => {
      const map = {};
      filtered.forEach((s) => {
        const key = `${s.name}__${s.cat}`;
        if (!map[key]) {
          map[key] = { key, name: s.name, cat: s.cat, qty: 0, revenue: 0, profit: 0 };
        }
        map[key].qty += 1;
        map[key].revenue += s.sell;
        map[key].profit += s.sell - s.buy;
      });
      return Object.values(map).sort((a, b) => b.revenue - a.revenue || b.qty - a.qty).slice(0, 8);
    }, [filtered]);
    const slowInventory = useMemoD(() => currentInventory.map((u) => ({
      ...u,
      daysInStock: Math.max(0, Math.floor((todayD - new Date(u.arrived)) / 864e5))
    })).sort((a, b) => b.daysInStock - a.daysInStock || b.buy - a.buy).slice(0, 8), [currentInventory, today]);
    const recentSales = useMemoD(() => filtered.slice().sort((a, b) => new Date(b.sold) - new Date(a.sold)).slice(0, 8), [filtered]);
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "page-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "T\u1ED5ng quan kinh doanh"), /* @__PURE__ */ React.createElement("div", { className: "page-sub" }, "C\u1EADp nh\u1EADt realtime \xB7 ", todayD.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" }))), /* @__PURE__ */ React.createElement("div", { className: "page-controls" }, /* @__PURE__ */ React.createElement(ImportDataButton, { today, onImport: importUnits, disabled: readOnly }), /* @__PURE__ */ React.createElement(ExportDataButton, { units, today }), /* @__PURE__ */ React.createElement(CategoryPicker, { value: catFilter, onChange: setCatFilter, counts: catCounts, categories: visibleCategories }), /* @__PURE__ */ React.createElement(DateRangePicker, { value: range, onChange: setRange, dataPoints: timelinePoints, today }))), /* @__PURE__ */ React.createElement("div", { className: "kpi-grid" }, /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "kpi kpi-money-toggle",
        onClick: toggleMoneyDetail,
        title: moneyToggleTitle
      },
      /* @__PURE__ */ React.createElement("div", { className: "kpi-label" }, "Doanh thu"),
      /* @__PURE__ */ React.createElement("div", { className: `kpi-value mono ${detailedMode ? "detailed" : ""}` }, fmtAmount(totalRev), /* @__PURE__ */ React.createElement("span", { className: "unit" }, moneyUnit)),
      /* @__PURE__ */ React.createElement("div", { className: "kpi-delta" }, prevDelta.rev !== null ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: prevDelta.rev >= 0 ? "up" : "down" }, prevDelta.rev >= 0 ? "\u25B2" : "\u25BC", " ", Math.abs(prevDelta.rev).toFixed(1), "%"), /* @__PURE__ */ React.createElement("span", null, "so v\u1EDBi k\u1EF3 tr\u01B0\u1EDBc")) : /* @__PURE__ */ React.createElement("span", { style: { color: "var(--muted-2)" } }, "\u2014 k\u1EF3 tr\u01B0\u1EDBc ch\u01B0a c\xF3 d\u1EEF li\u1EC7u")),
      /* @__PURE__ */ React.createElement("div", { className: "kpi-spark" }, /* @__PURE__ */ React.createElement(Sparkline, { data: lineData.rev, color: "#e11d48" }))
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "kpi green kpi-money-toggle",
        onClick: toggleMoneyDetail,
        title: moneyToggleTitle
      },
      /* @__PURE__ */ React.createElement("div", { className: "kpi-label" }, profitLabel),
      /* @__PURE__ */ React.createElement("div", { className: `kpi-value mono ${detailedMode ? "detailed" : ""}`, style: { color: totalProfit >= 0 ? "#10b981" : "#e11d48" } }, totalProfit < 0 ? "\u2212" : "", fmtAmount(Math.abs(totalProfit)), /* @__PURE__ */ React.createElement("span", { className: "unit" }, moneyUnit)),
      /* @__PURE__ */ React.createElement("div", { className: "kpi-delta" }, prevDelta.profit !== null ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: prevDelta.profit >= 0 ? "up" : "down" }, prevDelta.profit >= 0 ? "\u25B2" : "\u25BC", " ", Math.abs(prevDelta.profit).toFixed(1), "%"), /* @__PURE__ */ React.createElement("span", null, "so v\u1EDBi k\u1EF3 tr\u01B0\u1EDBc")) : /* @__PURE__ */ React.createElement("span", { style: { color: "var(--muted-2)" } }, "\u2014 k\u1EF3 tr\u01B0\u1EDBc ch\u01B0a c\xF3 d\u1EEF li\u1EC7u")),
      /* @__PURE__ */ React.createElement("div", { className: "kpi-spark" }, /* @__PURE__ */ React.createElement(Sparkline, { data: lineData.profit, color: "#10b981" }))
    ), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "kpi aff",
        onClick: () => setShowAffiliateModal(true),
        title: "Qu\u1EA3n l\xFD c\xE1c kho\u1EA3n hoa h\u1ED3ng AFF trong th\xE1ng"
      },
      /* @__PURE__ */ React.createElement("div", { className: "kpi-label" }, "Hoa h\u1ED3ng AFF"),
      periodAffiliateEntries.length > 0 ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("div", { className: `kpi-value mono ${detailedMode ? "detailed" : ""}` }, fmtAmount(totalAffiliateIncome), /* @__PURE__ */ React.createElement("span", { className: "unit" }, moneyUnit)), /* @__PURE__ */ React.createElement("div", { className: "kpi-delta" }, /* @__PURE__ */ React.createElement("span", { className: "aff-chip paid" }, "\u0110\xE3 tr\u1EA3 ", fmtAmount(paidAffiliateIncome)), /* @__PURE__ */ React.createElement("span", { className: "aff-chip pending" }, "Ch\u1EDD ", fmtAmount(pendingAffiliateIncome)))) : /* @__PURE__ */ React.createElement("button", { type: "button", className: "aff-empty-btn", disabled: readOnly }, "Nh\u1EADp AFF"),
      /* @__PURE__ */ React.createElement("label", { className: `aff-profit-toggle ${includePendingAffiliateInProfit ? "active" : ""}`, onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "checkbox",
          checked: includePendingAffiliateInProfit,
          onChange: (e) => onSetIncludePendingAffiliateInProfit(e.target.checked),
          disabled: readOnly
        }
      ), /* @__PURE__ */ React.createElement("span", null, "T\xEDnh c\u1EA3 AFF \u0111ang ch\u1EDD v\xE0o l\xE3i")),
      !includeAffiliateInProfit && /* @__PURE__ */ React.createElement("div", { className: "aff-filter-note" }, "AFF ch\u1EC9 c\u1ED9ng v\xE0o l\xE3i khi xem t\u1EA5t c\u1EA3 danh m\u1EE5c")
    ), /* @__PURE__ */ React.createElement("div", { className: "kpi amber" }, /* @__PURE__ */ React.createElement("div", { className: "kpi-label" }, "\u0110\xE3 b\xE1n / L\u1ED7"), /* @__PURE__ */ React.createElement("div", { className: "kpi-value mono" }, itemsSold, /* @__PURE__ */ React.createElement("span", { className: "unit" }, "\u0111\u01A1n"), lossCount > 0 && /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, color: "#e11d48", marginLeft: 10, fontWeight: 700 } }, "\xB7 ", lossCount, " l\u1ED7")), /* @__PURE__ */ React.createElement("div", { className: "kpi-delta" }, prevDelta.items !== null ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: prevDelta.items >= 0 ? "up" : "down" }, prevDelta.items >= 0 ? "\u25B2" : "\u25BC", " ", Math.abs(prevDelta.items).toFixed(1), "%"), /* @__PURE__ */ React.createElement("span", null, "s\u1ED1 \u0111\u01A1n so v\u1EDBi k\u1EF3 tr\u01B0\u1EDBc")) : /* @__PURE__ */ React.createElement("span", { style: { color: "var(--muted-2)" } }, "\u2014 k\u1EF3 tr\u01B0\u1EDBc ch\u01B0a c\xF3 d\u1EEF li\u1EC7u"))), /* @__PURE__ */ React.createElement(
      "div",
      {
        className: "kpi blue kpi-money-toggle",
        onClick: toggleMoneyDetail,
        title: moneyToggleTitle
      },
      /* @__PURE__ */ React.createElement("div", { className: "kpi-label" }, "V\u1ED1n h\xE0ng t\u1ED3n"),
      /* @__PURE__ */ React.createElement("div", { className: `kpi-value mono ${detailedMode ? "detailed" : ""}` }, fmtAmount(currentInventoryValue), /* @__PURE__ */ React.createElement("span", { className: "unit" }, moneyUnit)),
      /* @__PURE__ */ React.createElement("div", { className: "kpi-delta" }, prevDelta.inventory !== null ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: prevDelta.inventory >= 0 ? "up" : "down" }, prevDelta.inventory >= 0 ? "\u25B2" : "\u25BC", " ", Math.abs(prevDelta.inventory).toFixed(1), "%"), /* @__PURE__ */ React.createElement("span", null, "so v\u1EDBi cu\u1ED1i k\u1EF3 tr\u01B0\u1EDBc")) : /* @__PURE__ */ React.createElement("span", { style: { color: "var(--muted-2)" } }, "\u2014 k\u1EF3 tr\u01B0\u1EDBc ch\u01B0a c\xF3 d\u1EEF li\u1EC7u")),
      /* @__PURE__ */ React.createElement("div", { className: "kpi-spark" }, /* @__PURE__ */ React.createElement(Sparkline, { data: lineData.inventory, color: "#2563eb" }))
    ), /* @__PURE__ */ React.createElement("div", { className: "kpi purple" }, /* @__PURE__ */ React.createElement("div", { className: "kpi-label" }, "T\u1EC9 l\u1EC7 b\xE1n / mua trung b\xECnh"), /* @__PURE__ */ React.createElement("div", { className: "kpi-gauge", style: { marginTop: 6 } }, /* @__PURE__ */ React.createElement(Gauge, { value: avgRatio, label: "b\xE1n/mua" }), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 10, color: "#9a9aae", fontWeight: 800, letterSpacing: "0.08em" } }, !includeAffiliateInProfit ? "BI\xCAN L\u1EE2I NHU\u1EACN" : includePendingAffiliateInProfit && pendingAffiliateIncome > 0 ? "BI\xCAN L\xC3I D\u1EF0 KI\u1EBEN" : "BI\xCAN L\xC3I SAU AFF"), /* @__PURE__ */ React.createElement("div", { className: "mono", style: { fontSize: 18, fontWeight: 800, color: totalProfit >= 0 ? "#10b981" : "#e11d48", marginTop: 4 } }, totalRev > 0 ? (totalProfit / totalRev * 100).toFixed(1) : 0, "%"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "#9a9aae", marginTop: 6, fontWeight: 600 } }, "V\u1ED1n", " ", /* @__PURE__ */ React.createElement(
      "button",
      {
        type: "button",
        className: "inline-money-toggle mono",
        onClick: toggleMoneyDetail,
        title: moneyToggleTitle
      },
      fmtAmount(totalBuy),
      " ",
      moneyUnit
    )))))), /* @__PURE__ */ React.createElement("div", { className: "charts-row" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("button", { className: "card-title analytics-title-btn", onClick: () => setShowAnalytics(true) }, "Doanh thu & ", profitLabel), /* @__PURE__ */ React.createElement("div", { className: "card-sub" }, "Theo ng\xE0y \xB7 ", rangeLabel)), /* @__PURE__ */ React.createElement("div", { className: "legend" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "swatch", style: { background: "#e11d48" } }), "Doanh thu"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { className: "swatch", style: { background: "#10b981" } }), profitLabel))), /* @__PURE__ */ React.createElement("div", { className: "card-body" }, /* @__PURE__ */ React.createElement(
      LineChart,
      {
        series: [
          { name: "Doanh thu", color: "#e11d48", data: lineData.rev },
          { name: profitLabel, color: "#10b981", data: lineData.profit }
        ],
        days: lineData.days
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, "L\u1EE3i nhu\u1EADn b\xE1n h\xE0ng theo danh m\u1EE5c"), /* @__PURE__ */ React.createElement("div", { className: "card-sub" }, "T\xEDnh theo ph\xE2n lo\u1EA1i \xB7 ngh\xECn \u0111\u1ED3ng"))), /* @__PURE__ */ React.createElement("div", { className: "card-body", style: { paddingTop: 6 } }, profitByCat.length > 0 ? /* @__PURE__ */ React.createElement(BarChart, { data: profitByCat, height: 240 }) : /* @__PURE__ */ React.createElement("div", { className: "empty" }, "Ch\u01B0a c\xF3 giao d\u1ECBch trong k\u1EF3 n\xE0y")))), ratioByCat.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "charts-row", style: { gridTemplateColumns: "1fr" } }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, "T\u1EC9 l\u1EC7 b\xE1n/mua theo danh m\u1EE5c"), /* @__PURE__ */ React.createElement("div", { className: "card-sub" }, "So s\xE1nh hi\u1EC7u su\u1EA5t t\u1EEBng nh\xF3m s\u1EA3n ph\u1EA9m"))), /* @__PURE__ */ React.createElement("div", { style: { display: "grid", gridTemplateColumns: `repeat(${ratioByCat.length}, 1fr)`, gap: 1, background: "var(--border-soft)" } }, ratioByCat.map((c) => {
      const color = c.ratio >= 130 ? "#10b981" : c.ratio >= 110 ? "#f59e0b" : c.ratio >= 100 ? "#ff6a3d" : "#e11d48";
      return /* @__PURE__ */ React.createElement("div", { key: c.id, style: { background: "#fff", padding: "16px 18px" } }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" } }, /* @__PURE__ */ React.createElement("i", { style: { width: 8, height: 8, background: c.color, display: "inline-block" } }), c.name), /* @__PURE__ */ React.createElement("div", { className: "mono", style: { fontSize: 22, fontWeight: 800, marginTop: 6, color } }, c.ratio.toFixed(1), "%"));
    })))), /* @__PURE__ */ React.createElement("div", { className: "card tbl-card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, "S\u1ED5 giao d\u1ECBch \u0111\xE3 b\xE1n"), /* @__PURE__ */ React.createElement("div", { className: "card-sub" }, filtered.length, " \u0111\u01A1n h\xE0ng \xB7 gi\xE1 theo ngh\xECn \u0111\u1ED3ng"))), /* @__PURE__ */ React.createElement("div", { className: "tbl-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "tbl" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "M\xE3 GD"), /* @__PURE__ */ React.createElement("th", null, "S\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("th", null, "Danh m\u1EE5c"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "Gi\xE1 mua"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "Gi\xE1 b\xE1n"), /* @__PURE__ */ React.createElement("th", null, "Ng\xE0y v\u1EC1"), /* @__PURE__ */ React.createElement("th", null, "Ng\xE0y b\xE1n"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "L\u1EE3i nhu\u1EADn"), /* @__PURE__ */ React.createElement("th", null, "T\u1EC9 l\u1EC7"), /* @__PURE__ */ React.createElement("th", null, "Ghi ch\xFA"), /* @__PURE__ */ React.createElement("th", null))), /* @__PURE__ */ React.createElement("tbody", null, filtered.slice().sort((a, b) => new Date(b.sold) - new Date(a.sold)).map((s) => {
      const profit = s.sell - s.buy;
      const ratio = s.sell / s.buy * 100;
      const isLoss = profit < 0;
      return /* @__PURE__ */ React.createElement("tr", { key: s.id }, /* @__PURE__ */ React.createElement("td", { className: "mono txn-code" }, s.transactionCode), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { style: { minWidth: 200 } }, /* @__PURE__ */ React.createElement("div", { style: { fontWeight: 700 } }, s.name), s.variant && /* @__PURE__ */ React.createElement("span", { className: "variant" }, s.variant))), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(CatPill, { cat: s.cat })), /* @__PURE__ */ React.createElement("td", { className: "num mono" }, s.buy.toLocaleString("vi-VN")), /* @__PURE__ */ React.createElement("td", { className: "num mono", style: { fontWeight: 700 } }, s.sell.toLocaleString("vi-VN")), /* @__PURE__ */ React.createElement("td", { className: "mono", style: { color: "#6b6b80", fontSize: 12 } }, new Date(s.arrived).toLocaleDateString("vi-VN")), /* @__PURE__ */ React.createElement("td", { className: "mono", style: { fontSize: 12, fontWeight: 600 } }, new Date(s.sold).toLocaleDateString("vi-VN")), /* @__PURE__ */ React.createElement("td", { className: `num mono ${isLoss ? "profit-neg" : profit > 0 ? "profit-pos" : "profit-zero"}` }, isLoss ? "\u2212" : profit > 0 ? "+" : "", Math.abs(profit).toLocaleString("vi-VN"), isLoss && /* @__PURE__ */ React.createElement("span", { className: "loss-tag" }, "L\u1ED6")), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(RateBar, { pct: ratio })), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(
        "textarea",
        {
          className: "note-input",
          value: s.note || "",
          placeholder: "th\xEAm ghi ch\xFA...",
          onChange: (e) => updateNote(s.id, e.target.value),
          disabled: readOnly
        }
      )), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { className: "row-actions" }, /* @__PURE__ */ React.createElement("button", { className: "ctl ghost sm", onClick: () => setEditingUnit(s), disabled: readOnly }, "S\u1EECA"), /* @__PURE__ */ React.createElement("button", { className: "ctl danger sm", onClick: () => setConfirmCancel(s), title: "Hu\u1EF7 giao d\u1ECBch, tr\u1EA3 v\u1EC1 kho", disabled: readOnly }, "\u21BA HU\u1EF6"))));
    }), filtered.length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "11", className: "empty" }, "Kh\xF4ng c\xF3 giao d\u1ECBch trong k\u1EF3 \u0111ang xem"))), /* @__PURE__ */ React.createElement("tfoot", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "3" }, "T\u1ED4NG (", filtered.length, " \u0111\u01A1n)"), /* @__PURE__ */ React.createElement("td", { className: "num mono" }, totalBuy.toLocaleString("vi-VN")), /* @__PURE__ */ React.createElement("td", { className: "num mono" }, totalRev.toLocaleString("vi-VN")), /* @__PURE__ */ React.createElement("td", { colSpan: "2" }), /* @__PURE__ */ React.createElement("td", { className: `num mono ${salesProfit >= 0 ? "profit-pos" : "profit-neg"}` }, salesProfit < 0 ? "\u2212" : "+", Math.abs(salesProfit).toLocaleString("vi-VN")), /* @__PURE__ */ React.createElement("td", { className: "mono", style: { color: salesProfit >= 0 ? "#10b981" : "#e11d48", fontWeight: 800 } }, avgRatio.toFixed(1), "%"), /* @__PURE__ */ React.createElement("td", { colSpan: "2" })))))), confirmCancel && /* @__PURE__ */ React.createElement(
      ConfirmCancelModal,
      {
        unit: confirmCancel,
        onClose: () => setConfirmCancel(null),
        onConfirm: () => {
          cancelSale(confirmCancel.id);
          setConfirmCancel(null);
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
    ), showAnalytics && /* @__PURE__ */ React.createElement(
      SalesAnalyticsModal,
      {
        rangeLabel,
        totalRev,
        totalProfit,
        salesProfit,
        profitLabel,
        affiliateEntries: periodAffiliateEntries,
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
        onClose: () => setShowAnalytics(false)
      }
    ), showAffiliateModal && /* @__PURE__ */ React.createElement(
      AffiliateIncomeModal,
      {
        entries: periodAffiliateEntries,
        range,
        rangeLabel,
        today,
        readOnly,
        onAdd: onAddAffiliateIncome,
        onUpdate: onUpdateAffiliateIncome,
        onDelete: onRemoveAffiliateIncome,
        onClose: () => setShowAffiliateModal(false)
      }
    ));
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
    onClose
  }) {
    const avgOrderValue = itemsSold > 0 ? totalRev / itemsSold : 0;
    const margin = totalRev > 0 ? totalProfit / totalRev * 100 : 0;
    return /* @__PURE__ */ React.createElement("div", { className: "modal-bg analytics-modal-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal analytics-modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head analytics-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "TRUNG T\xC2M PH\xC2N T\xCDCH B\xC1N H\xC0NG"), /* @__PURE__ */ React.createElement("div", { className: "card-sub" }, "Theo th\xE1ng b\xE1n \xB7 ", rangeLabel)), /* @__PURE__ */ React.createElement("button", { className: "close-x", onClick: onClose }, "\xD7")), /* @__PURE__ */ React.createElement("div", { className: "modal-body analytics-body" }, /* @__PURE__ */ React.createElement("div", { className: "analytics-kpi-grid" }, /* @__PURE__ */ React.createElement(AnalyticsMetric, { label: "Doanh thu", value: `${window.fmtK(totalRev)}\u0111`, tone: "red" }), /* @__PURE__ */ React.createElement(AnalyticsMetric, { label: profitLabel, value: `${totalProfit < 0 ? "\u2212" : "+"}${window.fmtK(Math.abs(totalProfit))}\u0111`, tone: totalProfit >= 0 ? "green" : "red" }), /* @__PURE__ */ React.createElement(
      AnalyticsMetric,
      {
        label: "Hoa h\u1ED3ng AFF",
        value: affiliateEntries.length > 0 ? `${window.fmtK(totalAffiliateIncome)}\u0111` : "\u2014",
        sub: `\u0110\xE3 tr\u1EA3 ${window.fmtK(paidAffiliateIncome)}\u0111 \xB7 Ch\u1EDD ${window.fmtK(pendingAffiliateIncome)}\u0111`,
        tone: "blue"
      }
    ), /* @__PURE__ */ React.createElement(AnalyticsMetric, { label: "\u0110\u01A1n \u0111\xE3 b\xE1n", value: `${itemsSold}`, sub: `${lossCount} \u0111\u01A1n l\u1ED7`, tone: "amber" }), /* @__PURE__ */ React.createElement(AnalyticsMetric, { label: "Gi\xE1 tr\u1ECB \u0111\u01A1n TB", value: `${window.fmtK(avgOrderValue)}\u0111`, sub: `V\u1ED1n b\xE1n ${window.fmtK(totalBuy)}\u0111`, tone: "purple" }), /* @__PURE__ */ React.createElement(
      AnalyticsMetric,
      {
        label: !includeAffiliateInProfit ? "Bi\xEAn l\u1EE3i nhu\u1EADn" : includePendingAffiliateInProfit && pendingAffiliateIncome > 0 ? "Bi\xEAn l\xE3i d\u1EF1 ki\u1EBFn" : "Bi\xEAn l\xE3i sau AFF",
        value: `${margin.toFixed(1)}%`,
        sub: `AFF t\xEDnh v\xE0o l\xE3i ${window.fmtK(affiliateIncomeUsedInProfit)}\u0111`,
        tone: "green"
      }
    ), /* @__PURE__ */ React.createElement(AnalyticsMetric, { label: "V\u1ED1n t\u1ED3n cu\u1ED1i k\u1EF3", value: `${window.fmtK(currentInventoryValue)}\u0111`, sub: `${currentInventory.length} m\xF3n \u0111ang t\u1ED3n`, tone: "blue" })), /* @__PURE__ */ React.createElement("div", { className: "analytics-grid two" }, /* @__PURE__ */ React.createElement(AnalyticsPanel, { title: `Doanh thu & ${profitLabel.toLowerCase()} theo ng\xE0y`, subtitle: rangeLabel }, /* @__PURE__ */ React.createElement(
      LineChart,
      {
        series: [
          { name: "Doanh thu", color: "#e11d48", data: lineData.rev },
          { name: profitLabel, color: "#10b981", data: lineData.profit }
        ],
        days: lineData.days
      }
    )), /* @__PURE__ */ React.createElement(AnalyticsPanel, { title: "V\u1ED1n t\u1ED3n theo ng\xE0y", subtitle: "Gi\xE1 tr\u1ECB kho t\u1EA1i t\u1EEBng ng\xE0y" }, /* @__PURE__ */ React.createElement(
      LineChart,
      {
        series: [
          { name: "V\u1ED1n t\u1ED3n", color: "#2563eb", data: lineData.inventory }
        ],
        days: lineData.days
      }
    ))), /* @__PURE__ */ React.createElement("div", { className: "analytics-grid two" }, /* @__PURE__ */ React.createElement(AnalyticsPanel, { title: "L\u1EE3i nhu\u1EADn b\xE1n h\xE0ng theo danh m\u1EE5c", subtitle: "Nh\xF3m n\xE0o \u0111ang t\u1EA1o ti\u1EC1n t\u1EEB \u0111\u01A1n b\xE1n" }, profitByCat.length > 0 ? /* @__PURE__ */ React.createElement(BarChart, { data: profitByCat, height: 220 }) : /* @__PURE__ */ React.createElement("div", { className: "empty" }, "Ch\u01B0a c\xF3 giao d\u1ECBch trong k\u1EF3 n\xE0y")), /* @__PURE__ */ React.createElement(AnalyticsPanel, { title: "C\u01A1 c\u1EA5u doanh thu", subtitle: "T\u1EF7 tr\u1ECDng theo danh m\u1EE5c" }, revenueByCat.length > 0 ? /* @__PURE__ */ React.createElement("div", { className: "analytics-donut-wrap" }, /* @__PURE__ */ React.createElement(Donut, { data: revenueByCat, size: 170 }), /* @__PURE__ */ React.createElement("div", { className: "analytics-legend-list" }, revenueByCat.map((item) => /* @__PURE__ */ React.createElement("div", { key: item.label }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { style: { background: item.color } }), item.label), /* @__PURE__ */ React.createElement("strong", null, window.fmtK(item.value), "\u0111"))))) : /* @__PURE__ */ React.createElement("div", { className: "empty" }, "Ch\u01B0a c\xF3 doanh thu trong k\u1EF3 n\xE0y"))), ratioByCat.length > 0 && /* @__PURE__ */ React.createElement(AnalyticsPanel, { title: "Hi\u1EC7u su\u1EA5t b\xE1n / mua theo danh m\u1EE5c", subtitle: "Nh\xECn nhanh nh\xF3m n\xE0o c\xF3 t\u1EF7 l\u1EC7 kh\u1ECFe" }, /* @__PURE__ */ React.createElement("div", { className: "analytics-ratio-grid" }, ratioByCat.map((c) => {
      const color = c.ratio >= 130 ? "#10b981" : c.ratio >= 110 ? "#f59e0b" : c.ratio >= 100 ? "#ff6a3d" : "#e11d48";
      return /* @__PURE__ */ React.createElement("div", { key: c.id }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("i", { style: { background: c.color } }), c.name), /* @__PURE__ */ React.createElement("strong", { style: { color } }, c.ratio.toFixed(1), "%"));
    }))), /* @__PURE__ */ React.createElement("div", { className: "analytics-grid tables" }, /* @__PURE__ */ React.createElement(AnalyticsPanel, { title: "Thu nh\u1EADp AFF", subtitle: "\u0110\xE3 thanh to\xE1n v\xE0 \u0111ang ch\u1EDD v\u1EC1" }, /* @__PURE__ */ React.createElement("table", { className: "tbl analytics-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Ng\xE0y ghi nh\u1EADn"), /* @__PURE__ */ React.createElement("th", null, "Tr\u1EA1ng th\xE1i"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "S\u1ED1 ti\u1EC1n"), /* @__PURE__ */ React.createElement("th", null, "Ghi ch\xFA"))), /* @__PURE__ */ React.createElement("tbody", null, affiliateEntries.slice().sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)).map((entry) => /* @__PURE__ */ React.createElement("tr", { key: entry.id }, /* @__PURE__ */ React.createElement("td", { className: "mono" }, new Date(entry.receivedAt).toLocaleDateString("vi-VN")), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(AffiliateStatusPill, { status: entry.status })), /* @__PURE__ */ React.createElement("td", { className: "num mono profit-pos" }, "+", (+entry.amount || 0).toLocaleString("vi-VN")), /* @__PURE__ */ React.createElement("td", null, entry.note || "\u2014"))), affiliateEntries.length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "4", className: "empty" }, "Th\xE1ng n\xE0y ch\u01B0a c\xF3 kho\u1EA3n AFF"))))), /* @__PURE__ */ React.createElement(AnalyticsPanel, { title: "Top s\u1EA3n ph\u1EA9m", subtitle: "Theo doanh thu th\xE1ng" }, /* @__PURE__ */ React.createElement("table", { className: "tbl analytics-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "S\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "SL"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "Doanh thu"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "L\u1EE3i nhu\u1EADn"))), /* @__PURE__ */ React.createElement("tbody", null, topProducts.map((item) => /* @__PURE__ */ React.createElement("tr", { key: item.key }, /* @__PURE__ */ React.createElement("td", null, item.name), /* @__PURE__ */ React.createElement("td", { className: "num mono" }, item.qty), /* @__PURE__ */ React.createElement("td", { className: "num mono" }, item.revenue.toLocaleString("vi-VN")), /* @__PURE__ */ React.createElement("td", { className: `num mono ${item.profit >= 0 ? "profit-pos" : "profit-neg"}` }, item.profit < 0 ? "\u2212" : "+", Math.abs(item.profit).toLocaleString("vi-VN")))), topProducts.length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "4", className: "empty" }, "Ch\u01B0a c\xF3 \u0111\u01A1n b\xE1n trong k\u1EF3 n\xE0y"))))), /* @__PURE__ */ React.createElement(AnalyticsPanel, { title: "T\u1ED3n kho c\u1EA7n ch\xFA \xFD", subtitle: "M\xF3n n\u1EB1m kho l\xE2u nh\u1EA5t hi\u1EC7n t\u1EA1i" }, /* @__PURE__ */ React.createElement("table", { className: "tbl analytics-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "S\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "Ng\xE0y t\u1ED3n"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "V\u1ED1n"))), /* @__PURE__ */ React.createElement("tbody", null, slowInventory.map((item) => /* @__PURE__ */ React.createElement("tr", { key: item.id }, /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", null, item.name), item.variant && /* @__PURE__ */ React.createElement("span", { className: "variant" }, item.variant)), /* @__PURE__ */ React.createElement("td", { className: "num mono" }, item.daysInStock), /* @__PURE__ */ React.createElement("td", { className: "num mono" }, item.buy.toLocaleString("vi-VN")))), slowInventory.length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "3", className: "empty" }, "Kho \u0111ang tr\u1ED1ng"))))), /* @__PURE__ */ React.createElement(AnalyticsPanel, { title: "Giao d\u1ECBch g\u1EA7n nh\u1EA5t", subtitle: "Trong th\xE1ng \u0111ang xem" }, /* @__PURE__ */ React.createElement("table", { className: "tbl analytics-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "M\xE3 GD"), /* @__PURE__ */ React.createElement("th", null, "S\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("th", null, "Ng\xE0y b\xE1n"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "L\xE3i"))), /* @__PURE__ */ React.createElement("tbody", null, recentSales.map((item) => {
      const profit = item.sell - item.buy;
      return /* @__PURE__ */ React.createElement("tr", { key: item.id }, /* @__PURE__ */ React.createElement("td", { className: "mono txn-code" }, item.transactionCode), /* @__PURE__ */ React.createElement("td", null, item.name), /* @__PURE__ */ React.createElement("td", { className: "mono" }, new Date(item.sold).toLocaleDateString("vi-VN")), /* @__PURE__ */ React.createElement("td", { className: `num mono ${profit >= 0 ? "profit-pos" : "profit-neg"}` }, profit < 0 ? "\u2212" : "+", Math.abs(profit).toLocaleString("vi-VN")));
    }), recentSales.length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "4", className: "empty" }, "Ch\u01B0a c\xF3 giao d\u1ECBch trong k\u1EF3 n\xE0y")))))))));
  }
  function AnalyticsMetric({ label, value, sub, tone }) {
    return /* @__PURE__ */ React.createElement("div", { className: `analytics-metric ${tone || ""}` }, /* @__PURE__ */ React.createElement("div", null, label), /* @__PURE__ */ React.createElement("strong", { className: "mono" }, value), sub && /* @__PURE__ */ React.createElement("span", null, sub));
  }
  function AnalyticsPanel({ title, subtitle, children }) {
    return /* @__PURE__ */ React.createElement("div", { className: "card analytics-panel" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, title), subtitle && /* @__PURE__ */ React.createElement("div", { className: "card-sub" }, subtitle))), /* @__PURE__ */ React.createElement("div", { className: "card-body" }, children));
  }
  function defaultAffiliateDate(range, today) {
    const todayD = dashDateOnly(today);
    const { start, end } = dashboardRangeBounds(range, todayD);
    if (todayD >= start && todayD <= end) return dashDateIso(todayD);
    return dashDateIso(start);
  }
  function AffiliateStatusPill({ status }) {
    const pending = status === "pending";
    return /* @__PURE__ */ React.createElement("span", { className: `aff-status ${pending ? "pending" : "paid"}` }, pending ? "\u0110ang ch\u1EDD v\u1EC1" : "\u0110\xE3 thanh to\xE1n");
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
    onClose
  }) {
    const affBounds = dashboardRangeBounds(range, dashDateOnly(today));
    const monthStart = dashDateIso(affBounds.start);
    const monthEnd = dashDateIso(affBounds.end);
    const emptyForm = () => ({
      amount: "",
      receivedAt: defaultAffiliateDate(range, today),
      status: "pending",
      note: ""
    });
    const [form, setForm] = useStateD(emptyForm);
    const [editingId, setEditingId] = useStateD(null);
    const total = entries.reduce((sum, entry) => sum + (+entry.amount || 0), 0);
    const paidTotal = entries.filter((entry) => entry.status !== "pending").reduce((sum, entry) => sum + (+entry.amount || 0), 0);
    const pendingTotal = entries.filter((entry) => entry.status === "pending").reduce((sum, entry) => sum + (+entry.amount || 0), 0);
    const orderedEntries = entries.slice().sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
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
        note: form.note
      };
      if (editingId) onUpdate(editingId, payload);
      else onAdd(payload);
      resetForm();
    };
    return /* @__PURE__ */ React.createElement("div", { className: "modal-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal affiliate-modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "THU NH\u1EACP AFF"), /* @__PURE__ */ React.createElement("div", { className: "card-sub" }, rangeLabel, " \xB7 l\u01B0u t\u1EEBng kho\u1EA3n AFF ri\xEAng")), /* @__PURE__ */ React.createElement("button", { className: "close-x", onClick: onClose }, "\xD7")), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "affiliate-summary" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "T\u1ED5ng AFF th\xE1ng"), /* @__PURE__ */ React.createElement("strong", { className: "mono" }, entries.length > 0 ? `${window.fmtK(total)}\u0111` : "\u2014")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "\u0110\xE3 thanh to\xE1n"), /* @__PURE__ */ React.createElement("strong", { className: "mono" }, window.fmtK(paidTotal), "\u0111")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("span", null, "\u0110ang ch\u1EDD v\u1EC1"), /* @__PURE__ */ React.createElement("strong", { className: "mono" }, window.fmtK(pendingTotal), "\u0111"))), /* @__PURE__ */ React.createElement("div", { className: "field-row four affiliate-form-row" }, /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "S\u1ED1 ti\u1EC1n AFF (ngh\xECn)"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "number",
        min: "0",
        value: form.amount,
        onChange: (e) => setForm((prev) => ({ ...prev, amount: e.target.value })),
        disabled: readOnly,
        placeholder: "vd. 1250"
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Ng\xE0y ghi nh\u1EADn"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "date",
        value: form.receivedAt,
        min: monthStart,
        max: monthEnd,
        onChange: (e) => setForm((prev) => ({ ...prev, receivedAt: e.target.value })),
        disabled: readOnly
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Tr\u1EA1ng th\xE1i"), /* @__PURE__ */ React.createElement(
      "select",
      {
        value: form.status,
        onChange: (e) => setForm((prev) => ({ ...prev, status: e.target.value })),
        disabled: readOnly
      },
      /* @__PURE__ */ React.createElement("option", { value: "pending" }, "\u0110ang ch\u1EDD v\u1EC1"),
      /* @__PURE__ */ React.createElement("option", { value: "paid" }, "\u0110\xE3 thanh to\xE1n")
    )), /* @__PURE__ */ React.createElement("div", { className: "field affiliate-save-field" }, /* @__PURE__ */ React.createElement("label", null, "\xA0"), /* @__PURE__ */ React.createElement("div", { className: "row-actions" }, editingId && /* @__PURE__ */ React.createElement("button", { className: "ctl ghost", onClick: resetForm }, "HU\u1EF6 S\u1EECA"), /* @__PURE__ */ React.createElement("button", { className: "ctl primary", onClick: save, disabled: !valid || readOnly }, editingId ? "L\u01AFU AFF" : "+ NH\u1EACP AFF")))), /* @__PURE__ */ React.createElement("div", { className: "field" }, /* @__PURE__ */ React.createElement("label", null, "Ghi ch\xFA"), /* @__PURE__ */ React.createElement(
      "textarea",
      {
        value: form.note,
        onChange: (e) => setForm((prev) => ({ ...prev, note: e.target.value })),
        disabled: readOnly,
        placeholder: "vd. TikTok Shop \u0111\u1EE3t 1..."
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "tbl-wrap affiliate-table-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "tbl" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Ng\xE0y ghi nh\u1EADn"), /* @__PURE__ */ React.createElement("th", null, "Tr\u1EA1ng th\xE1i"), /* @__PURE__ */ React.createElement("th", { className: "num" }, "S\u1ED1 ti\u1EC1n"), /* @__PURE__ */ React.createElement("th", null, "Ghi ch\xFA"), /* @__PURE__ */ React.createElement("th", null))), /* @__PURE__ */ React.createElement("tbody", null, orderedEntries.map((entry) => /* @__PURE__ */ React.createElement("tr", { key: entry.id }, /* @__PURE__ */ React.createElement("td", { className: "mono" }, new Date(entry.receivedAt).toLocaleDateString("vi-VN")), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement(AffiliateStatusPill, { status: entry.status })), /* @__PURE__ */ React.createElement("td", { className: "num mono profit-pos" }, "+", (+entry.amount || 0).toLocaleString("vi-VN")), /* @__PURE__ */ React.createElement("td", null, entry.note || "\u2014"), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("div", { className: "row-actions" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "ctl ghost sm",
        disabled: readOnly,
        onClick: () => {
          setEditingId(entry.id);
          setForm({
            amount: entry.amount,
            receivedAt: entry.receivedAt,
            status: entry.status === "pending" ? "pending" : "paid",
            note: entry.note || ""
          });
        }
      },
      "S\u1EECA"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "ctl danger sm",
        disabled: readOnly,
        onClick: () => {
          if (confirm("Xo\xE1 kho\u1EA3n AFF n\xE0y?")) onDelete(entry.id);
        }
      },
      "XO\xC1"
    ))))), orderedEntries.length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "5", className: "empty" }, "Th\xE1ng n\xE0y ch\u01B0a c\xF3 kho\u1EA3n AFF n\xE0o. H\xE3y nh\u1EADp kho\u1EA3n \u0111\u1EA7u ti\xEAn \u1EDF ph\xEDa tr\xEAn.")))))), /* @__PURE__ */ React.createElement("div", { className: "modal-foot" }, /* @__PURE__ */ React.createElement("button", { className: "ctl ghost", onClick: onClose }, "\u0110\xD3NG"))));
  }
  function ConfirmCancelModal({ unit, onClose, onConfirm }) {
    const profit = unit.sell - unit.buy;
    return /* @__PURE__ */ React.createElement("div", { className: "modal-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal", onClick: (e) => e.stopPropagation(), style: { maxWidth: 460 } }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "HU\u1EF6 GIAO D\u1ECACH"), /* @__PURE__ */ React.createElement("button", { className: "close-x", onClick: onClose }, "\xD7")), /* @__PURE__ */ React.createElement("div", { className: "modal-body" }, /* @__PURE__ */ React.createElement("p", { style: { margin: "0 0 14px", fontSize: 14, color: "var(--text-2)", lineHeight: 1.5 } }, "Hu\u1EF7 giao d\u1ECBch n\xE0y s\u1EBD ", /* @__PURE__ */ React.createElement("strong", null, "tr\u1EA3 s\u1EA3n ph\u1EA9m v\u1EC1 kho h\xE0ng"), " v\xE0 xo\xE1 kh\u1ECFi s\u1ED5 doanh thu."), /* @__PURE__ */ React.createElement("div", { className: "unit-summary" }, /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "M\xE3 GD"), /* @__PURE__ */ React.createElement("span", { className: "mono", style: { fontWeight: 700 } }, unit.transactionCode)), /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "S\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("span", { style: { fontWeight: 700 } }, unit.name, unit.variant ? ` \xB7 ${unit.variant}` : "")), /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "Gi\xE1 b\xE1n"), /* @__PURE__ */ React.createElement("span", { className: "mono", style: { fontWeight: 700 } }, unit.sell.toLocaleString("vi-VN"), "K")), /* @__PURE__ */ React.createElement("div", { className: "row" }, /* @__PURE__ */ React.createElement("span", { className: "lbl" }, "L\u1EE3i nhu\u1EADn s\u1EBD b\u1ECB xo\xE1"), /* @__PURE__ */ React.createElement("span", { className: `mono ${profit >= 0 ? "profit-pos" : "profit-neg"}` }, profit < 0 ? "\u2212" : "+", Math.abs(profit).toLocaleString("vi-VN"), "K")))), /* @__PURE__ */ React.createElement("div", { className: "modal-foot" }, /* @__PURE__ */ React.createElement("button", { className: "ctl ghost", onClick: onClose }, "QUAY L\u1EA0I"), /* @__PURE__ */ React.createElement("button", { className: "ctl primary", onClick: onConfirm }, "X\xC1C NH\u1EACN HU\u1EF6"))));
  }
  window.Dashboard = Dashboard;
  window.CatPill = CatPill;
})();

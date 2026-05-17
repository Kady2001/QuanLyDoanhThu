(() => {
  const { useState: useStateDD, useRef: useRefDD, useEffect: useEffectDD } = React;
  function useClickOutside(ref, onClose, active) {
    useEffectDD(() => {
      if (!active) return;
      const handler = (e) => {
        if (ref.current && !ref.current.contains(e.target)) onClose();
      };
      const esc = (e) => {
        if (e.key === "Escape") onClose();
      };
      document.addEventListener("mousedown", handler);
      document.addEventListener("keydown", esc);
      return () => {
        document.removeEventListener("mousedown", handler);
        document.removeEventListener("keydown", esc);
      };
    }, [active]);
  }
  const Chevron = () => /* @__PURE__ */ React.createElement("svg", { className: "chev", width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("polyline", { points: "6 9 12 15 18 9" }));
  const MONTHS = ["Th 1", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7", "Th 8", "Th 9", "Th 10", "Th 11", "Th 12"];
  function DateRangePicker({ value, onChange, dataPoints, today }) {
    const [open, setOpen] = useStateDD(false);
    const ref = useRefDD(null);
    useClickOutside(ref, () => setOpen(false), open);
    const todayD = new Date(today);
    const [viewYear, setViewYear] = useStateDD(value.kind === "month" ? value.year : todayD.getFullYear());
    const label = `${MONTHS[value.month]}, ${value.year}`;
    const monthsWithData = /* @__PURE__ */ new Set();
    dataPoints.forEach((s) => {
      const d = new Date(s.sold || s.date);
      if (d.getFullYear() === viewYear) monthsWithData.add(d.getMonth());
    });
    const yearsAvail = new Set(dataPoints.map((s) => new Date(s.sold || s.date).getFullYear()));
    const minYear = Math.min(...yearsAvail, todayD.getFullYear());
    const maxYear = Math.max(...yearsAvail, todayD.getFullYear());
    return /* @__PURE__ */ React.createElement("div", { className: "dd-wrap", ref }, /* @__PURE__ */ React.createElement("button", { className: `dd-trigger ${open ? "open" : ""}`, onClick: () => setOpen(!open) }, /* @__PURE__ */ React.createElement("span", { className: "dd-lead" }, /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "4", width: "18", height: "18", rx: "2" }), /* @__PURE__ */ React.createElement("line", { x1: "16", y1: "2", x2: "16", y2: "6" }), /* @__PURE__ */ React.createElement("line", { x1: "8", y1: "2", x2: "8", y2: "6" }), /* @__PURE__ */ React.createElement("line", { x1: "3", y1: "10", x2: "21", y2: "10" }))), /* @__PURE__ */ React.createElement("span", { className: "dd-text" }, /* @__PURE__ */ React.createElement("span", { className: "dd-label" }, "Th\xE1ng b\xE1n h\xE0ng"), /* @__PURE__ */ React.createElement("span", { className: "dd-value" }, label)), /* @__PURE__ */ React.createElement(Chevron, null)), open && /* @__PURE__ */ React.createElement("div", { className: "dd-pop", style: { minWidth: 300 } }, /* @__PURE__ */ React.createElement("div", { className: "dd-section-label" }, "Ch\u1ECDn theo th\xE1ng b\xE1n"), /* @__PURE__ */ React.createElement("div", { className: "dd-year" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setViewYear((y) => y - 1),
        disabled: viewYear <= minYear
      },
      "\u2039"
    ), /* @__PURE__ */ React.createElement("span", { className: "dd-year-label" }, viewYear), /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: () => setViewYear((y) => y + 1),
        disabled: viewYear >= maxYear
      },
      "\u203A"
    )), /* @__PURE__ */ React.createElement("div", { className: "dd-months" }, MONTHS.map((m, i) => {
      const has = monthsWithData.has(i);
      const isSelected = value.year === viewYear && value.month === i;
      const isFuture = viewYear > todayD.getFullYear() || viewYear === todayD.getFullYear() && i > todayD.getMonth();
      return /* @__PURE__ */ React.createElement(
        "button",
        {
          key: i,
          className: `dd-month ${isSelected ? "selected" : has ? "has-data" : "no-data"}`,
          disabled: isFuture,
          onClick: () => {
            onChange({ kind: "month", year: viewYear, month: i });
            setOpen(false);
          }
        },
        m
      );
    }))));
  }
  function CategoryPicker({ value, onChange, counts }) {
    const [open, setOpen] = useStateDD(false);
    const ref = useRefDD(null);
    useClickOutside(ref, () => setOpen(false), open);
    const selected = value === "all" ? { name: "T\u1EA5t c\u1EA3 danh m\u1EE5c", color: "#6b6b80" } : window.CATEGORIES.find((c) => c.id === value);
    return /* @__PURE__ */ React.createElement("div", { className: "dd-wrap", ref }, /* @__PURE__ */ React.createElement("button", { className: `dd-trigger ${open ? "open" : ""}`, onClick: () => setOpen(!open) }, /* @__PURE__ */ React.createElement("span", { className: "dd-lead" }, value === "all" ? /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "3", width: "7", height: "7" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "3", width: "7", height: "7" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "14", width: "7", height: "7" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "14", width: "7", height: "7" })) : /* @__PURE__ */ React.createElement("span", { style: { width: 12, height: 12, background: selected == null ? void 0 : selected.color, display: "inline-block", borderRadius: 2 } })), /* @__PURE__ */ React.createElement("span", { className: "dd-text" }, /* @__PURE__ */ React.createElement("span", { className: "dd-label" }, "Danh m\u1EE5c"), /* @__PURE__ */ React.createElement("span", { className: "dd-value" }, selected == null ? void 0 : selected.name)), /* @__PURE__ */ React.createElement(Chevron, null)), open && /* @__PURE__ */ React.createElement("div", { className: "dd-pop" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        className: `dd-item ${value === "all" ? "selected" : ""}`,
        onClick: () => {
          onChange("all");
          setOpen(false);
        }
      },
      /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("rect", { x: "3", y: "3", width: "7", height: "7" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "3", width: "7", height: "7" }), /* @__PURE__ */ React.createElement("rect", { x: "3", y: "14", width: "7", height: "7" }), /* @__PURE__ */ React.createElement("rect", { x: "14", y: "14", width: "7", height: "7" })),
      /* @__PURE__ */ React.createElement("span", null, "T\u1EA5t c\u1EA3 danh m\u1EE5c"),
      /* @__PURE__ */ React.createElement("span", { className: "dd-cnt" }, counts.all || 0)
    ), /* @__PURE__ */ React.createElement("div", { className: "dd-divider" }), window.CATEGORIES.map((c) => /* @__PURE__ */ React.createElement(
      "button",
      {
        key: c.id,
        className: `dd-item ${value === c.id ? "selected" : ""}`,
        onClick: () => {
          onChange(c.id);
          setOpen(false);
        }
      },
      /* @__PURE__ */ React.createElement("span", { className: "dd-dot", style: { background: c.color } }),
      /* @__PURE__ */ React.createElement("span", null, c.name),
      /* @__PURE__ */ React.createElement("span", { className: "dd-cnt" }, counts[c.id] || 0)
    ))));
  }
  Object.assign(window, { DateRangePicker, CategoryPicker });
})();

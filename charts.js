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
  const { useState, useMemo } = React;
  const fmtK = (n) => {
    if (n === 0) return "0";
    const abs = Math.abs(n);
    const sign = n < 0 ? "-" : "";
    if (abs >= 1e3) return sign + (abs / 1e3).toFixed(abs >= 1e4 ? 1 : 2).replace(/\.0+$/, "") + "M";
    return sign + Math.round(abs).toLocaleString("vi-VN");
  };
  const fmtVND = (n) => Math.round(n).toLocaleString("vi-VN");
  function Sparkline({ data, color = "#e11d48", width = 80, height = 28 }) {
    if (!data || data.length < 2) return null;
    const max = Math.max(...data), min = Math.min(...data);
    const range = max - min || 1;
    const stepX = width / (data.length - 1);
    const pts = data.map((v, i) => [i * stepX, height - (v - min) / range * height]);
    const d = "M " + pts.map((p) => p.join(",")).join(" L ");
    const area = d + ` L ${width},${height} L 0,${height} Z`;
    const id = "sg-" + color.replace("#", "");
    return /* @__PURE__ */ React.createElement("svg", { width, height, style: { display: "block" } }, /* @__PURE__ */ React.createElement("defs", null, /* @__PURE__ */ React.createElement("linearGradient", { id, x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: color, stopOpacity: "0.3" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: color, stopOpacity: "0" }))), /* @__PURE__ */ React.createElement("path", { d: area, fill: `url(#${id})` }), /* @__PURE__ */ React.createElement("path", { d, fill: "none", stroke: color, strokeWidth: "1.5" }));
  }
  function Gauge({ value, label = "T\u1EC9 l\u1EC7" }) {
    const target = Math.min(Math.max(value, 0), 200);
    const radius = 44;
    const stroke = 8;
    const C = 2 * Math.PI * radius;
    const arc = 0.75;
    const dash = target / 200 * arc * C;
    const rest = C - dash;
    const color = value >= 130 ? "#10b981" : value >= 110 ? "#f59e0b" : value >= 100 ? "#ff6a3d" : "#e11d48";
    return /* @__PURE__ */ React.createElement("div", { className: "gauge-vis" }, /* @__PURE__ */ React.createElement("svg", { viewBox: "0 0 110 110", width: "110", height: "110" }, /* @__PURE__ */ React.createElement(
      "circle",
      {
        cx: "55",
        cy: "55",
        r: radius,
        fill: "none",
        stroke: "#ebebf2",
        strokeWidth: stroke,
        strokeDasharray: `${arc * C} ${C}`,
        transform: "rotate(135 55 55)"
      }
    ), /* @__PURE__ */ React.createElement(
      "circle",
      {
        cx: "55",
        cy: "55",
        r: radius,
        fill: "none",
        stroke: color,
        strokeWidth: stroke,
        strokeLinecap: "butt",
        strokeDasharray: `${dash} ${rest}`,
        transform: "rotate(135 55 55)",
        style: { transition: "all 0.6s" }
      }
    )), /* @__PURE__ */ React.createElement("div", { className: "gauge-num" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "val mono", style: { color } }, value.toFixed(1), "%"), /* @__PURE__ */ React.createElement("div", { className: "lbl" }, label))));
  }
  function LineChart({ series, height = 240, days }) {
    const pad = { l: 52, r: 18, t: 14, b: 30 };
    const width = 700;
    const innerW = width - pad.l - pad.r;
    const innerH = height - pad.t - pad.b;
    const n = days.length;
    const allVals = series.flatMap((s) => s.data);
    const rawMin = Math.min(...allVals, 0);
    const rawMax = Math.max(...allVals, 0, 1);
    const maxAbs = Math.max(Math.abs(rawMin), Math.abs(rawMax), 1);
    const roughStep = maxAbs / 4;
    const magnitude = 10 ** Math.floor(Math.log10(roughStep || 1));
    const normalized = roughStep / magnitude;
    const stepBase = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
    const tickStep = stepBase * magnitude;
    const niceMin = Math.floor(rawMin / tickStep) * tickStep;
    const niceMax = Math.ceil(rawMax / tickStep) * tickStep || tickStep;
    const domain = niceMax - niceMin || 1;
    const stepX = innerW / Math.max(n - 1, 1);
    const yTicks = 4;
    const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => niceMin + domain / yTicks * i);
    const zeroY = pad.t + innerH - (0 - niceMin) / domain * innerH;
    const toPath = (data) => {
      const pts = data.map((v, i) => [pad.l + i * stepX, pad.t + innerH - (v - niceMin) / domain * innerH]);
      return "M " + pts.map((p) => p.join(",")).join(" L ");
    };
    return /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${width} ${height}`, width: "100%", height, style: { display: "block" } }, /* @__PURE__ */ React.createElement("defs", null, series.map((s, i) => /* @__PURE__ */ React.createElement("linearGradient", { key: i, id: `lg-${i}`, x1: "0", y1: "0", x2: "0", y2: "1" }, /* @__PURE__ */ React.createElement("stop", { offset: "0%", stopColor: s.color, stopOpacity: "0.22" }), /* @__PURE__ */ React.createElement("stop", { offset: "100%", stopColor: s.color, stopOpacity: "0" })))), tickVals.map((v, i) => {
      const y = pad.t + innerH - (v - niceMin) / domain * innerH;
      return /* @__PURE__ */ React.createElement("g", { key: i }, /* @__PURE__ */ React.createElement("line", { x1: pad.l, x2: width - pad.r, y1: y, y2: y, stroke: "#ebebf2", strokeDasharray: "2 4" }), /* @__PURE__ */ React.createElement("text", { x: pad.l - 8, y: y + 4, textAnchor: "end", fill: "#9a9aae", fontSize: "10", fontFamily: "JetBrains Mono" }, fmtK(v)));
    }), niceMin < 0 && niceMax > 0 && /* @__PURE__ */ React.createElement("line", { x1: pad.l, x2: width - pad.r, y1: zeroY, y2: zeroY, stroke: "#d0d0db", strokeWidth: "1" }), days.map((d, i) => {
      const skip = n > 14 ? 3 : n > 7 ? 2 : 1;
      if (i % skip !== 0 && i !== n - 1) return null;
      return /* @__PURE__ */ React.createElement("text", { key: i, x: pad.l + i * stepX, y: height - 8, textAnchor: "middle", fill: "#9a9aae", fontSize: "10", fontWeight: "600" }, d);
    }), series.map((s, i) => {
      const path = toPath(s.data);
      const area = path + ` L ${pad.l + (n - 1) * stepX},${zeroY} L ${pad.l},${zeroY} Z`;
      return /* @__PURE__ */ React.createElement("g", { key: i }, /* @__PURE__ */ React.createElement("path", { d: area, fill: `url(#lg-${i})` }), /* @__PURE__ */ React.createElement("path", { d: path, fill: "none", stroke: s.color, strokeWidth: "2.2", strokeLinejoin: "round" }), s.data.map((v, j) => /* @__PURE__ */ React.createElement(
        "circle",
        {
          key: j,
          cx: pad.l + j * stepX,
          cy: pad.t + innerH - (v - niceMin) / domain * innerH,
          r: "2.5",
          fill: "#fff",
          stroke: s.color,
          strokeWidth: "1.5"
        }
      )));
    }));
  }
  function BarChart({ data, height = 240, labelWidth = 110, valueGutter = 48, width = 440 }) {
    const pad = { l: labelWidth, r: valueGutter, t: 8, b: 8 };
    const innerW = width - pad.l - pad.r;
    const innerH = height - pad.t - pad.b;
    const maxAbs = Math.max(...data.map((d) => Math.abs(d.value)), 1);
    const niceMax = Math.ceil(maxAbs / 500) * 500 || 1;
    const rowH = innerH / data.length;
    const barH = Math.min(rowH - 12, 22);
    const zeroX = pad.l + (data.some((d) => d.value < 0) ? innerW * 0.3 : 0);
    const posW = data.some((d) => d.value < 0) ? innerW - (zeroX - pad.l) : innerW;
    const negW = zeroX - pad.l;
    return /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${width} ${height}`, width: "100%", height, style: { display: "block" } }, data.some((d) => d.value < 0) && /* @__PURE__ */ React.createElement("line", { x1: zeroX, x2: zeroX, y1: pad.t, y2: height - pad.b, stroke: "#d0d0db", strokeWidth: "1" }), data.map((d, i) => {
      const y = pad.t + i * rowH + rowH / 2;
      const isNeg = d.value < 0;
      const w = Math.abs(d.value) / niceMax * (isNeg ? negW : posW);
      const x = isNeg ? zeroX - w : zeroX;
      return /* @__PURE__ */ React.createElement("g", { key: i }, /* @__PURE__ */ React.createElement("text", { x: pad.l - 12, y: y + 4, textAnchor: "end", fill: "#2a2a3a", fontSize: "11", fontWeight: "700" }, d.label), /* @__PURE__ */ React.createElement("rect", { x: pad.l, y: y - barH / 2, width: innerW, height: barH, fill: "#f4f4f8" }), /* @__PURE__ */ React.createElement("rect", { x, y: y - barH / 2, width: w, height: barH, fill: isNeg ? "#e11d48" : d.color }), /* @__PURE__ */ React.createElement(
        "text",
        {
          x: isNeg ? x - 6 : width - pad.r + 8,
          y: y + 4,
          textAnchor: isNeg ? "end" : "start",
          fill: isNeg ? "#e11d48" : "#2a2a3a",
          fontSize: "11",
          fontWeight: "800",
          fontFamily: "JetBrains Mono"
        },
        fmtK(d.value)
      ));
    }));
  }
  function Donut({ data, size = 160, onSegmentClick, centerLabel = "T\u1ED4NG", centerValue }) {
    const r = size / 2;
    const inner = r - 22;
    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    let acc = 0;
    const segs = data.map((d) => {
      const start = acc / total * 2 * Math.PI - Math.PI / 2;
      acc += d.value;
      const end = acc / total * 2 * Math.PI - Math.PI / 2;
      const large = end - start > Math.PI ? 1 : 0;
      const x1 = r + r * Math.cos(start), y1 = r + r * Math.sin(start);
      const x2 = r + r * Math.cos(end), y2 = r + r * Math.sin(end);
      const xi1 = r + inner * Math.cos(end), yi1 = r + inner * Math.sin(end);
      const xi2 = r + inner * Math.cos(start), yi2 = r + inner * Math.sin(start);
      return __spreadProps(__spreadValues({}, d), {
        path: `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${inner} ${inner} 0 ${large} 0 ${xi2} ${yi2} Z`
      });
    });
    return /* @__PURE__ */ React.createElement("svg", { viewBox: `0 0 ${size} ${size}`, width: size, height: size }, segs.map((s, i) => /* @__PURE__ */ React.createElement(
      "path",
      {
        key: i,
        d: s.path,
        fill: s.color,
        stroke: "#fff",
        strokeWidth: "2",
        style: { cursor: onSegmentClick ? "pointer" : "default" },
        onClick: () => onSegmentClick == null ? void 0 : onSegmentClick(s)
      }
    )), /* @__PURE__ */ React.createElement("text", { x: r, y: r - 4, textAnchor: "middle", fill: "#9a9aae", fontSize: "10", letterSpacing: "1", fontWeight: "700", pointerEvents: "none" }, centerLabel), /* @__PURE__ */ React.createElement("text", { x: r, y: r + 14, textAnchor: "middle", fill: "#0f0f1a", fontSize: "16", fontWeight: "800", fontFamily: "JetBrains Mono", pointerEvents: "none" }, centerValue != null ? centerValue : total));
  }
  Object.assign(window, { Sparkline, Gauge, LineChart, BarChart, Donut, fmtK, fmtVND });
})();

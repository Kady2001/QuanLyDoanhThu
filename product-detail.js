(() => {
  const { useMemo: useMemoPD } = React;
  const PRODUCT_META = {
    keyboard: {
      tagline: "B\xE0n ph\xEDm c\u01A1 tu\u1EF3 bi\u1EBFn \u2014 g\xF5 \u0111\xE3, d\xF9ng b\u1EC1n",
      specs: [
        { label: "Lo\u1EA1i switch", value: "HE / Magnetic / Tactile" },
        { label: "K\u1EBFt n\u1ED1i", value: "USB-C / Bluetooth 5.0 / 2.4GHz" },
        { label: "Layout", value: "75% / 60% / Full-size" },
        { label: "Plate", value: "FR4 / Polycarbonate / Aluminum" },
        { label: "Pin", value: "4000mAh (b\u1EA3n wireless)" },
        { label: "Ph\u1EE5 ki\u1EC7n", value: "H\u1ED9p, c\xE1p, keypuller, v\xEDt" }
      ],
      desc: "B\xE0n ph\xEDm c\u01A1 v\u1EDBi c\u1EA3m gi\xE1c g\xF5 premium, c\xF3 hot-swap socket, RGB south-facing, \u0111\u01B0\u1EE3c build k\u1EF9 t\u1EA1i x\u01B0\u1EDFng. Ph\xF9 h\u1EE3p cho c\u1EA3 gaming v\xE0 l\xE0m vi\u1EC7c l\xE2u d\xE0i."
    },
    keycap: {
      tagline: "Keycap PBT ch\u1EA5t l\u01B0\u1EE3ng cao, \u0111a profile",
      specs: [
        { label: "Ch\u1EA5t li\u1EC7u", value: "PBT dye-sub / Doubleshot" },
        { label: "Profile", value: "XDA / Cherry / SA" },
        { label: "S\u1ED1 ph\xEDm", value: "132 ph\xEDm (\u0111\u1EE7 layout)" },
        { label: "Thickness", value: "1.5mm" },
        { label: "T\u01B0\u01A1ng th\xEDch", value: "MX-style switch (Cherry, Gateron, Kailh)" },
        { label: "Ph\u1EE5 ki\u1EC7n", value: "Keypuller, h\u1ED9p \u0111\u1EF1ng" }
      ],
      desc: "Set keycap PBT in ch\xECm b\u1EB1ng c\xF4ng ngh\u1EC7 dye-sublimation, m\xE0u s\u1EAFc b\u1EC1n kh\xF4ng phai, font in s\u1EAFc n\xE9t. H\u1ED7 tr\u1EE3 \u0111\u1EA7y \u0111\u1EE7 layout t\u1EEB 60% \u0111\u1EBFn full-size."
    },
    phone: {
      tagline: "\u0110i\u1EC7n tho\u1EA1i ch\xEDnh h\xE3ng \u2014 nguy\xEAn seal, b\u1EA3o h\xE0nh VN",
      specs: [
        { label: "T\xECnh tr\u1EA1ng", value: "New 100% \u2014 nguy\xEAn seal" },
        { label: "B\u1EA3o h\xE0nh", value: "12 th\xE1ng ch\xEDnh h\xE3ng" },
        { label: "Ph\u1EE5 ki\u1EC7n", value: "\u0110\u1EA7y \u0111\u1EE7 trong h\u1ED9p (c\xE1p, t\xE0i li\u1EC7u)" },
        { label: "Phi\xEAn b\u1EA3n", value: "Qu\u1ED1c t\u1EBF / Vi\u1EC7t Nam" },
        { label: "Kh\u1EA3 n\u0103ng k\u1EBFt n\u1ED1i", value: "5G / Wi-Fi 6 / Bluetooth 5.3" },
        { label: "H\u1ED7 tr\u1EE3 tr\u1EA3 g\xF3p", value: "0% qua th\u1EBB t\xEDn d\u1EE5ng" }
      ],
      desc: "M\xE1y m\u1EDBi 100% nguy\xEAn seal, k\xEDch ho\u1EA1t b\u1EA3o h\xE0nh ch\xEDnh h\xE3ng t\u1EA1i trung t\xE2m u\u1EF7 quy\u1EC1n. \u0110\u1EA7y \u0111\u1EE7 ph\u1EE5 ki\u1EC7n, h\u1ED9p seal c\u1EE9ng. H\u1ED7 tr\u1EE3 \u0111\u1ED5i m\u1EDBi trong 7 ng\xE0y n\u1EBFu ph\xE1t hi\u1EC7n l\u1ED7i nh\xE0 s\u1EA3n xu\u1EA5t."
    },
    mouse: {
      tagline: "Chu\u1ED9t gaming si\xEAu nh\u1EB9, sensor flagship",
      specs: [
        { label: "Sensor", value: "PixArt PAW3950 / Razer Focus Pro 35K" },
        { label: "DPI", value: "50\u201332000 DPI" },
        { label: "Polling rate", value: "8000Hz wireless" },
        { label: "Tr\u1ECDng l\u01B0\u1EE3ng", value: "49\u201365g" },
        { label: "Pin", value: "95 gi\u1EDD" },
        { label: "Switch", value: "Optical, 90 tri\u1EC7u l\u1EA7n click" }
      ],
      desc: "Chu\u1ED9t wireless si\xEAu nh\u1EB9 v\u1EDBi sensor flagship, polling rate 8K, switch quang h\u1ECDc b\u1EC1n b\u1EC9. D\xE1ng ergonomic cho ph\xE9p c\u1EA7m tho\u1EA3i m\xE1i c\u1EA3 ng\xE0y, latency c\u1EF1c th\u1EA5p cho gaming competitive."
    },
    cable: {
      tagline: "S\u1EA1c nhanh & c\xE1p chu\u1EA9n ch\u1EA5t, \u0111i k\xE8m b\u1EA3o h\xE0nh",
      specs: [
        { label: "C\xF4ng ngh\u1EC7", value: "GaN II / PD 3.0 / PPS" },
        { label: "C\xF4ng su\u1EA5t", value: "65W / 100W" },
        { label: "C\u1ED5ng", value: "USB-C \xD7 2, USB-A \xD7 1" },
        { label: "Ch\u1EA5t li\u1EC7u c\xE1p", value: "Nylon braided, l\xF5i \u0111\u1ED3ng nguy\xEAn ch\u1EA5t" },
        { label: "Chi\u1EC1u d\xE0i", value: "1m / 2m / Coiled" },
        { label: "Ch\u1EE9ng nh\u1EADn", value: "CE, FCC, ROHS" }
      ],
      desc: "C\u1EE7 s\u1EA1c nhanh s\u1EED d\u1EE5ng chip GaN II gi\xFAp gi\u1EA3m 50% k\xEDch th\u01B0\u1EDBc. H\u1ED7 tr\u1EE3 \u0111\u1EA7y \u0111\u1EE7 chu\u1EA9n PD 3.0, PPS, s\u1EA1c nhanh cho h\u1EA7u h\u1EBFt thi\u1EBFt b\u1ECB t\u1EEB iPhone, Samsung t\u1EDBi MacBook."
    },
    monitor: {
      tagline: "M\xE0n h\xECnh s\u1EAFc n\xE9t cho gaming, \u0111\u1ED3 ho\u1EA1 v\xE0 l\xE0m vi\u1EC7c",
      specs: [
        { label: "K\xEDch th\u01B0\u1EDBc", value: "24 / 27 / 32 inch" },
        { label: "\u0110\u1ED9 ph\xE2n gi\u1EA3i", value: "Full HD / 2K / 4K" },
        { label: "T\u1EA7n s\u1ED1 qu\xE9t", value: "75Hz / 144Hz / 165Hz" },
        { label: "T\u1EA5m n\u1EC1n", value: "IPS / VA / OLED" },
        { label: "C\u1ED5ng k\u1EBFt n\u1ED1i", value: "HDMI / DisplayPort / USB-C" },
        { label: "B\u1EA3o h\xE0nh", value: "12\u201336 th\xE1ng ch\xEDnh h\xE3ng" }
      ],
      desc: "M\xE0n h\xECnh ch\xEDnh h\xE3ng v\u1EDBi m\xE0u s\u1EAFc c\xE2n b\u1EB1ng, t\u1EA7n s\u1ED1 qu\xE9t m\u01B0\u1EE3t v\xE0 nhi\u1EC1u l\u1EF1a ch\u1ECDn theo nhu c\u1EA7u gaming, thi\u1EBFt k\u1EBF ho\u1EB7c v\u0103n ph\xF2ng. D\u1EC5 ph\u1ED1i v\xE0o setup hi\u1EC7n \u0111\u1EA1i v\xE0 c\xF3 \u0111\u1EA7y \u0111\u1EE7 c\u1ED5ng k\u1EBFt n\u1ED1i ph\u1ED5 bi\u1EBFn."
    },
    accessory: {
      tagline: "Ph\u1EE5 ki\u1EC7n t\u0103ng tr\u1EA3i nghi\u1EC7m b\xE0n l\xE0m vi\u1EC7c",
      specs: [
        { label: "Ch\u1EA5t li\u1EC7u", value: "V\u1EA3i / Kim lo\u1EA1i / G\u1ED7 t\u1EF1 nhi\xEAn" },
        { label: "K\xEDch th\u01B0\u1EDBc", value: "\u0110a k\xEDch th\u01B0\u1EDBc (xem variant)" },
        { label: "Ho\xE0n thi\u1EC7n", value: "Premium handmade / CNC" },
        { label: "Ph\xF9 h\u1EE3p", value: "Setup gaming / Office / Stream" },
        { label: "B\u1EA3o h\xE0nh", value: "6 th\xE1ng \u0111\u1ED5i m\u1EDBi 1-1" }
      ],
      desc: "Ph\u1EE5 ki\u1EC7n \u0111\u01B0\u1EE3c ch\u1ECDn l\u1ECDc k\u1EF9 \u2014 ch\u1EA5t li\u1EC7u cao c\u1EA5p, ho\xE0n thi\u1EC7n t\u1EC9 m\u1EC9. N\xE2ng t\u1EA7m setup desk c\u1EE7a b\u1EA1n c\u1EA3 v\u1EC1 th\u1EA9m m\u1EF9 l\u1EABn tr\u1EA3i nghi\u1EC7m s\u1EED d\u1EE5ng h\xE0ng ng\xE0y."
    }
  };
  function ProductDetail({ productName, inStock, onBack, onSelectProduct }) {
    const variants = useMemoPD(() => inStock.filter((u) => u.name === productName), [inStock, productName]);
    const main = variants[0];
    if (!main) {
      return /* @__PURE__ */ React.createElement("div", { style: { padding: "60px 28px", textAlign: "center", color: "var(--muted)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, marginBottom: 16 } }, "S\u1EA3n ph\u1EA9m kh\xF4ng c\xF2n trong kho"), /* @__PURE__ */ React.createElement("button", { className: "ctl primary", onClick: onBack }, "\u2190 Quay l\u1EA1i c\u1EEDa h\xE0ng"));
    }
    const cat = window.CATEGORIES.find((c) => c.id === main.cat);
    const meta = PRODUCT_META[main.cat] || PRODUCT_META.accessory;
    const prices = variants.map((v) => v.expectedSell);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const newestArrived = variants.map((v) => new Date(v.arrived)).sort((a, b) => b - a)[0];
    const related = useMemoPD(() => {
      const map = {};
      inStock.forEach((u) => {
        if (u.name === productName || u.cat !== main.cat) return;
        if (!map[u.name]) {
          map[u.name] = { name: u.name, cat: u.cat, minPrice: u.expectedSell, stock: 0, newest: u.arrived };
        }
        map[u.name].minPrice = Math.min(map[u.name].minPrice, u.expectedSell);
        map[u.name].stock += 1;
        if (new Date(u.arrived) > new Date(map[u.name].newest)) map[u.name].newest = u.arrived;
      });
      return Object.values(map).sort((a, b) => new Date(b.newest) - new Date(a.newest)).slice(0, 4);
    }, [inStock, main.cat, productName]);
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { style: { padding: "20px 28px 0", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--muted)", fontWeight: 600 } }, /* @__PURE__ */ React.createElement(
      "button",
      {
        onClick: onBack,
        style: { background: "transparent", border: "none", color: "var(--muted)", cursor: "pointer", fontWeight: 600, fontSize: 12, padding: 0 }
      },
      "C\u1EEDa h\xE0ng"
    ), /* @__PURE__ */ React.createElement("span", null, "/"), /* @__PURE__ */ React.createElement("span", { style: { color: cat.color, fontWeight: 700 } }, cat.name), /* @__PURE__ */ React.createElement("span", null, "/"), /* @__PURE__ */ React.createElement("span", { style: { color: "var(--text)" } }, main.name)), /* @__PURE__ */ React.createElement("div", { className: "pd-main" }, /* @__PURE__ */ React.createElement("div", { className: "pd-gallery" }, /* @__PURE__ */ React.createElement("div", { className: "pd-thumb-lg" }, /* @__PURE__ */ React.createElement(ProductThumbLarge, { cat: main.cat }), /* @__PURE__ */ React.createElement("div", { className: "pd-stock-badge" }, variants.length <= 2 ? `CH\u1EC8 C\xD2N ${variants.length}` : `C\xD2N ${variants.length} M\xD3N`)), /* @__PURE__ */ React.createElement("div", { className: "pd-thumb-row" }, [0, 1, 2, 3].map((i) => /* @__PURE__ */ React.createElement("div", { key: i, className: `pd-thumb-sm ${i === 0 ? "active" : ""}` }, /* @__PURE__ */ React.createElement(ProductThumbLarge, { cat: main.cat }))))), /* @__PURE__ */ React.createElement("div", { className: "pd-info" }, /* @__PURE__ */ React.createElement("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 } }, /* @__PURE__ */ React.createElement(CatPill, { cat: main.cat }), /* @__PURE__ */ React.createElement("span", { style: { fontSize: 11, color: "var(--muted)", fontWeight: 600 } }, "M\u1EDAI V\u1EC0 ", newestArrived.toLocaleDateString("vi-VN"))), /* @__PURE__ */ React.createElement("h1", { className: "pd-name" }, main.name), /* @__PURE__ */ React.createElement("div", { className: "pd-tagline" }, meta.tagline), /* @__PURE__ */ React.createElement("div", { className: "pd-price-row" }, /* @__PURE__ */ React.createElement("div", { className: "pd-price" }, minPrice === maxPrice ? /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "mono" }, minPrice.toLocaleString("vi-VN")), /* @__PURE__ */ React.createElement("span", { className: "pd-price-suffix" }, ".000\u0111")) : /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("span", { className: "mono" }, minPrice.toLocaleString("vi-VN"), "\u2013", maxPrice.toLocaleString("vi-VN")), /* @__PURE__ */ React.createElement("span", { className: "pd-price-suffix" }, ".000\u0111"))), /* @__PURE__ */ React.createElement("div", { className: "pd-price-meta" }, /* @__PURE__ */ React.createElement("div", null, "Tr\u1EA3 g\xF3p 0%"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--muted)" } }, "ch\u1EC9 t\u1EEB ", /* @__PURE__ */ React.createElement("span", { className: "mono", style: { color: "var(--text)", fontWeight: 700 } }, Math.round(minPrice / 6).toLocaleString("vi-VN"), "K/th\xE1ng")))), variants.length > 1 && /* @__PURE__ */ React.createElement("div", { className: "pd-variants" }, /* @__PURE__ */ React.createElement("div", { className: "pd-section-h" }, "CH\u1ECCN PHI\xCAN B\u1EA2N"), /* @__PURE__ */ React.createElement("div", { className: "pd-variant-list" }, variants.map((v, i) => /* @__PURE__ */ React.createElement("button", { key: v.id, className: `pd-variant ${i === 0 ? "active" : ""}` }, /* @__PURE__ */ React.createElement("span", { className: "v-name" }, v.variant || "\u2014"), /* @__PURE__ */ React.createElement("span", { className: "v-price mono" }, v.expectedSell.toLocaleString("vi-VN"), "K"))))), /* @__PURE__ */ React.createElement("div", { className: "pd-cta" }, /* @__PURE__ */ React.createElement("button", { className: "ctl primary pd-buy" }, "MUA NGAY"), /* @__PURE__ */ React.createElement("button", { className: "ctl pd-cart" }, /* @__PURE__ */ React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("circle", { cx: "9", cy: "21", r: "1" }), /* @__PURE__ */ React.createElement("circle", { cx: "20", cy: "21", r: "1" }), /* @__PURE__ */ React.createElement("path", { d: "M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" })), "TH\xCAM V\xC0O GI\u1ECE")), /* @__PURE__ */ React.createElement("div", { className: "pd-badges" }, /* @__PURE__ */ React.createElement("div", { className: "pd-badge" }, /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "b-t" }, "B\u1EA3o h\xE0nh 12 th\xE1ng"), /* @__PURE__ */ React.createElement("div", { className: "b-s" }, "1 \u0111\u1ED5i 1 trong 7 ng\xE0y"))), /* @__PURE__ */ React.createElement("div", { className: "pd-badge" }, /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("rect", { x: "1", y: "3", width: "15", height: "13" }), /* @__PURE__ */ React.createElement("path", { d: "M16 8h4l3 3v5h-7" }), /* @__PURE__ */ React.createElement("circle", { cx: "5.5", cy: "18.5", r: "2.5" }), /* @__PURE__ */ React.createElement("circle", { cx: "18.5", cy: "18.5", r: "2.5" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "b-t" }, "Giao to\xE0n qu\u1ED1c"), /* @__PURE__ */ React.createElement("div", { className: "b-s" }, "Freeship n\u1ED9i th\xE0nh"))), /* @__PURE__ */ React.createElement("div", { className: "pd-badge" }, /* @__PURE__ */ React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /* @__PURE__ */ React.createElement("path", { d: "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" })), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "b-t" }, "\u0110\u1ED5i tr\u1EA3 7 ng\xE0y"), /* @__PURE__ */ React.createElement("div", { className: "b-s" }, "Kh\xF4ng c\u1EA7n l\xFD do")))))), /* @__PURE__ */ React.createElement("div", { className: "pd-secondary" }, /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, "Gi\u1EDBi thi\u1EC7u s\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("div", { className: "card-sub" }, "M\xF4 t\u1EA3 chi ti\u1EBFt \xB7 ", cat.name))), /* @__PURE__ */ React.createElement("div", { className: "card-body" }, /* @__PURE__ */ React.createElement("p", { style: { fontSize: 14, lineHeight: 1.7, color: "var(--text-2)", margin: 0 } }, meta.desc), /* @__PURE__ */ React.createElement("div", { style: { marginTop: 20, display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 } }, [
      { ico: "\u26A1", t: "Hi\u1EC7u n\u0103ng cao", s: "Build t\u1EEB linh ki\u1EC7n cao c\u1EA5p, t\u1ED1i \u01B0u cho c\u1EA3 gaming v\xE0 l\xE0m vi\u1EC7c." },
      { ico: "\u2726", t: "Ho\xE0n thi\u1EC7n t\u1EC9 m\u1EC9", s: "Test k\u1EF9 tr\u01B0\u1EDBc khi giao \u2014 ch\u1EC9 ship h\xE0ng \u0111\u1EA1t chu\u1EA9n." },
      { ico: "\u25C8", t: "T\u01B0\u01A1ng th\xEDch r\u1ED9ng", s: "Ho\u1EA1t \u0111\u1ED9ng v\u1EDBi m\u1ECDi h\u1EC7 \u0111i\u1EC1u h\xE0nh ph\u1ED5 bi\u1EBFn." },
      { ico: "\u21BB", t: "H\u1ED7 tr\u1EE3 tr\u1ECDn \u0111\u1EDDi", s: "T\u01B0 v\u1EA5n k\u1EF9 thu\u1EADt mi\u1EC5n ph\xED ngay c\u1EA3 khi h\u1EBFt b\u1EA3o h\xE0nh." }
    ].map((f, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "pd-feature" }, /* @__PURE__ */ React.createElement("div", { className: "pd-feature-ico", style: { color: cat.color } }, f.ico), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "pd-feature-t" }, f.t), /* @__PURE__ */ React.createElement("div", { className: "pd-feature-s" }, f.s))))))), /* @__PURE__ */ React.createElement("div", { className: "card" }, /* @__PURE__ */ React.createElement("div", { className: "card-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, "Th\xF4ng s\u1ED1 k\u1EF9 thu\u1EADt"), /* @__PURE__ */ React.createElement("div", { className: "card-sub" }, "Chi ti\u1EBFt s\u1EA3n ph\u1EA9m"))), /* @__PURE__ */ React.createElement("div", { className: "pd-specs" }, meta.specs.map((s, i) => /* @__PURE__ */ React.createElement("div", { key: i, className: "pd-spec" }, /* @__PURE__ */ React.createElement("span", { className: "pd-spec-l" }, s.label), /* @__PURE__ */ React.createElement("span", { className: "pd-spec-v" }, s.value))), /* @__PURE__ */ React.createElement("div", { className: "pd-spec" }, /* @__PURE__ */ React.createElement("span", { className: "pd-spec-l" }, "T\xECnh tr\u1EA1ng kho"), /* @__PURE__ */ React.createElement("span", { className: "pd-spec-v" }, /* @__PURE__ */ React.createElement("span", { className: "status-tag status-ok" }, /* @__PURE__ */ React.createElement("span", { className: "d" }), "C\xD2N ", variants.length, " M\xD3N")))))), related.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "pd-related" }, /* @__PURE__ */ React.createElement("div", { className: "pd-related-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card-title", style: { fontSize: 16 } }, "S\u1EA3n ph\u1EA9m li\xEAn quan"), /* @__PURE__ */ React.createElement("div", { className: "card-sub" }, "C\xF9ng danh m\u1EE5c ", cat.name.toLowerCase())), /* @__PURE__ */ React.createElement("button", { className: "ctl ghost", onClick: onBack }, "XEM T\u1EA4T C\u1EA2 \u2192")), /* @__PURE__ */ React.createElement("div", { className: "store-grid", style: { padding: 0 } }, related.map((p) => {
      const status = p.stock <= 2 ? "warn" : "ok";
      const cName = window.CATEGORIES.find((c) => c.id === p.cat)?.name;
      return /* @__PURE__ */ React.createElement("div", { key: p.name, className: "prod-card", onClick: () => onSelectProduct(p.name) }, /* @__PURE__ */ React.createElement("div", { className: "prod-thumb" }, /* @__PURE__ */ React.createElement("div", { className: "cat-tag" }, /* @__PURE__ */ React.createElement(CatPill, { cat: p.cat })), /* @__PURE__ */ React.createElement("div", { className: `stock-tag ${status}` }, p.stock <= 2 ? `CH\u1EC8 C\xD2N ${p.stock}` : `C\xD2N ${p.stock}`), /* @__PURE__ */ React.createElement(ProductThumbLarge, { cat: p.cat })), /* @__PURE__ */ React.createElement("div", { className: "prod-info" }, /* @__PURE__ */ React.createElement("div", { className: "prod-name" }, p.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 } }, cName), /* @__PURE__ */ React.createElement("div", { className: "prod-price" }, /* @__PURE__ */ React.createElement("span", { className: "sell mono" }, p.minPrice.toLocaleString("vi-VN"), /* @__PURE__ */ React.createElement("span", { className: "unit" }, " .000\u0111")))));
    }))));
  }
  window.ProductDetail = ProductDetail;
})();

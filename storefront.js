const { useState: useStateS, useMemo: useMemoS, useEffect: useEffectS } = React;
function FloatingContact() {
  const [expanded, setExpanded] = useStateS(false);
  const contacts = [
    { name: "Messenger", icon: "\u{1F464}", color: "#0084FF", url: "https://m.me/nexusgear" },
    { name: "Zalo", icon: "\u{1F4AC}", color: "#0084FF", url: "https://zalo.me/0901234567" },
    { name: "Telegram", icon: "\u2708\uFE0F", color: "#0088cc", url: "https://t.me/nexusgear" }
  ];
  return /* @__PURE__ */ React.createElement("div", { style: { position: "fixed", bottom: 24, right: 24, zIndex: 1e3, fontFamily: "inherit" } }, /* @__PURE__ */ React.createElement("div", { style: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    alignItems: "flex-end",
    marginBottom: expanded ? 16 : 0
  } }, expanded && contacts.map((c, i) => /* @__PURE__ */ React.createElement(
    "a",
    {
      key: i,
      href: c.url,
      target: "_blank",
      rel: "noopener noreferrer",
      title: c.name,
      style: {
        width: 48,
        height: 48,
        borderRadius: "50%",
        backgroundColor: c.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        color: "#fff",
        textDecoration: "none",
        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
        transition: "transform 0.2s",
        cursor: "pointer"
      },
      onMouseEnter: (e) => e.target.style.transform = "scale(1.1)",
      onMouseLeave: (e) => e.target.style.transform = "scale(1)"
    },
    c.icon
  ))), /* @__PURE__ */ React.createElement(
    "button",
    {
      onClick: () => setExpanded(!expanded),
      style: {
        width: 56,
        height: 56,
        borderRadius: "50%",
        backgroundColor: "var(--red)",
        border: "none",
        color: "#fff",
        fontSize: 24,
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        transition: "transform 0.2s"
      },
      onMouseEnter: (e) => e.target.style.transform = "scale(1.1)",
      onMouseLeave: (e) => e.target.style.transform = "scale(1)",
      title: "Li\xEAn h\u1EC7"
    },
    "\u{1F4AC}"
  ));
}
function Storefront({ inStock }) {
  const [view, setView] = useStateS("list");
  const [selectedProduct, setSelectedProduct] = useStateS(null);
  useEffectS(() => {
    const currentState = window.history.state;
    if (!currentState || currentState.scope !== "storefront") {
      window.history.replaceState(
        { scope: "storefront", view: "list", productName: null },
        "",
        window.location.href
      );
    }
    const handlePopState = (event) => {
      const nextState = event.state;
      if (!nextState || nextState.scope !== "storefront") {
        setView("list");
        setSelectedProduct(null);
        window.scrollTo({ top: 0, behavior: "instant" });
        return;
      }
      setView(nextState.view || "list");
      setSelectedProduct(nextState.productName || null);
      window.scrollTo({ top: 0, behavior: "instant" });
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
  const goDetail = (name) => {
    setSelectedProduct(name);
    setView("detail");
    window.history.pushState(
      { scope: "storefront", view: "detail", productName: name },
      "",
      window.location.href
    );
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const goList = () => {
    setView("list");
    setSelectedProduct(null);
    window.history.pushState(
      { scope: "storefront", view: "list", productName: null },
      "",
      window.location.href
    );
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  const goInfo = () => {
    setView("info");
    setSelectedProduct(null);
    window.history.pushState(
      { scope: "storefront", view: "info", productName: null },
      "",
      window.location.href
    );
    window.scrollTo({ top: 0, behavior: "instant" });
  };
  if (view === "detail" && selectedProduct) {
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(
      ProductDetail,
      {
        productName: selectedProduct,
        inStock,
        onBack: goList,
        onSelectProduct: goDetail
      }
    ), /* @__PURE__ */ React.createElement(StoreFooter, { onInfo: goInfo }), /* @__PURE__ */ React.createElement(FloatingContact, null));
  }
  if (view === "info") {
    return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(ShopInfo, { onBack: goList }), /* @__PURE__ */ React.createElement(StoreFooter, { onInfo: goInfo }), /* @__PURE__ */ React.createElement(FloatingContact, null));
  }
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement(StoreList, { inStock, onSelectProduct: goDetail, onInfo: goInfo }), /* @__PURE__ */ React.createElement(StoreFooter, { onInfo: goInfo }), /* @__PURE__ */ React.createElement(FloatingContact, null));
}
function StoreList({ inStock, onSelectProduct, onInfo }) {
  const [search, setSearch] = useStateS("");
  const [cat, setCat] = useStateS("all");
  const [sort, setSort] = useStateS("newest");
  const products = useMemoS(() => {
    const map = {};
    inStock.forEach((u) => {
      const key = u.name;
      if (!map[key]) {
        map[key] = {
          name: u.name,
          cat: u.cat,
          minPrice: u.expectedSell,
          maxPrice: u.expectedSell,
          stock: 0,
          variants: [],
          newestArrived: u.arrived
        };
      }
      const g = map[key];
      g.minPrice = Math.min(g.minPrice, u.expectedSell);
      g.maxPrice = Math.max(g.maxPrice, u.expectedSell);
      g.stock += 1;
      g.variants.push(u.variant || "\u2014");
      if (new Date(u.arrived) > new Date(g.newestArrived)) g.newestArrived = u.arrived;
    });
    return Object.values(map);
  }, [inStock]);
  const filtered = useMemoS(() => {
    let r = products.filter((p) => {
      const ms = p.name.toLowerCase().includes(search.toLowerCase());
      const mc = cat === "all" || p.cat === cat;
      return ms && mc;
    });
    r = r.slice().sort((a, b) => {
      if (sort === "price_asc") return a.minPrice - b.minPrice;
      if (sort === "price_desc") return b.maxPrice - a.maxPrice;
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "newest") return new Date(b.newestArrived) - new Date(a.newestArrived);
      return 0;
    });
    return r;
  }, [products, search, cat, sort]);
  return /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "page-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("h1", { className: "page-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "C\u1EEDa h\xE0ng"), /* @__PURE__ */ React.createElement("div", { className: "page-sub" }, "Gear ch\xEDnh h\xE3ng \xB7 Giao h\xE0ng to\xE0n qu\u1ED1c \xB7 ", products.length, " s\u1EA3n ph\u1EA9m c\xF3 s\u1EB5n")), /* @__PURE__ */ React.createElement("div", { className: "page-controls" }, /* @__PURE__ */ React.createElement("button", { className: "ctl ghost", onClick: onInfo }, /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("circle", { cx: "12", cy: "12", r: "10" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "16", x2: "12", y2: "12" }), /* @__PURE__ */ React.createElement("line", { x1: "12", y1: "8", x2: "12.01", y2: "8" })), "V\u1EC0 C\u1EECA H\xC0NG"), /* @__PURE__ */ React.createElement("div", { className: "search" }, /* @__PURE__ */ React.createElement("span", { className: "search-icon" }, /* @__PURE__ */ React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, /* @__PURE__ */ React.createElement("circle", { cx: "11", cy: "11", r: "8" }), /* @__PURE__ */ React.createElement("path", { d: "m21 21-4.3-4.3" }))), /* @__PURE__ */ React.createElement("input", { type: "text", placeholder: "T\xECm theo t\xEAn...", value: search, onChange: (e) => setSearch(e.target.value) })), /* @__PURE__ */ React.createElement("select", { className: "ctl", value: sort, onChange: (e) => setSort(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "newest" }, "M\u1EDAI V\u1EC0 NH\u1EA4T"), /* @__PURE__ */ React.createElement("option", { value: "price_asc" }, "GI\xC1 T\u0102NG D\u1EA6N"), /* @__PURE__ */ React.createElement("option", { value: "price_desc" }, "GI\xC1 GI\u1EA2M D\u1EA6N"), /* @__PURE__ */ React.createElement("option", { value: "name" }, "T\xCAN A-Z")))), /* @__PURE__ */ React.createElement("div", { className: "chips" }, /* @__PURE__ */ React.createElement("button", { className: `chip ${cat === "all" ? "active" : ""}`, onClick: () => setCat("all") }, "T\u1EA4T C\u1EA2"), window.CATEGORIES.map((c) => /* @__PURE__ */ React.createElement("button", { key: c.id, className: `chip ${cat === c.id ? "active" : ""}`, onClick: () => setCat(c.id) }, /* @__PURE__ */ React.createElement("i", { style: { width: 7, height: 7, background: c.color, display: "inline-block" } }), c.name.toUpperCase()))), /* @__PURE__ */ React.createElement("div", { className: "store-grid" }, filtered.map((p) => {
    const status = p.stock <= 2 ? "warn" : "ok";
    const cName = window.CATEGORIES.find((c) => c.id === p.cat)?.name;
    const priceTxt = p.minPrice === p.maxPrice ? p.minPrice.toLocaleString("vi-VN") : `${p.minPrice.toLocaleString("vi-VN")}\u2013${p.maxPrice.toLocaleString("vi-VN")}`;
    return /* @__PURE__ */ React.createElement("div", { key: p.name, className: "prod-card", onClick: () => onSelectProduct(p.name) }, /* @__PURE__ */ React.createElement("div", { className: "prod-thumb" }, /* @__PURE__ */ React.createElement("div", { className: "cat-tag" }, /* @__PURE__ */ React.createElement(CatPill, { cat: p.cat })), /* @__PURE__ */ React.createElement("div", { className: `stock-tag ${status}` }, p.stock <= 2 ? `CH\u1EC8 C\xD2N ${p.stock}` : `C\xD2N ${p.stock}`), /* @__PURE__ */ React.createElement(ProductThumbLarge, { cat: p.cat })), /* @__PURE__ */ React.createElement("div", { className: "prod-info" }, /* @__PURE__ */ React.createElement("div", { className: "prod-name" }, p.name), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 } }, cName), p.variants.length > 1 && /* @__PURE__ */ React.createElement("div", { style: { fontSize: 11, color: "var(--muted)" } }, [...new Set(p.variants)].slice(0, 3).join(" \xB7 ")), /* @__PURE__ */ React.createElement("div", { className: "prod-price" }, /* @__PURE__ */ React.createElement("span", { className: "sell mono" }, priceTxt, /* @__PURE__ */ React.createElement("span", { className: "unit" }, " .000\u0111"))), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "ctl primary",
        style: { width: "100%", justifyContent: "center", marginTop: 6 },
        onClick: (e) => {
          e.stopPropagation();
          onSelectProduct(p.name);
        }
      },
      "XEM CHI TI\u1EBET"
    )));
  }), filtered.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "empty", style: { gridColumn: "1 / -1" } }, "Kh\xF4ng c\xF3 s\u1EA3n ph\u1EA9m ph\xF9 h\u1EE3p")));
}
function StoreFooter({ onInfo }) {
  return /* @__PURE__ */ React.createElement("footer", { className: "sf-footer" }, /* @__PURE__ */ React.createElement("div", { className: "sf-footer-grid" }, /* @__PURE__ */ React.createElement("div", { className: "sf-footer-brand" }, /* @__PURE__ */ React.createElement("div", { className: "logo" }, /* @__PURE__ */ React.createElement("div", { className: "logo-mark" }, "N"), /* @__PURE__ */ React.createElement("div", { className: "logo-name" }, "NEXUS", /* @__PURE__ */ React.createElement("span", null, "GEAR"))), /* @__PURE__ */ React.createElement("p", { className: "sf-footer-p" }, "Gear ch\xEDnh h\xE3ng cho ng\u01B0\u1EDDi y\xEAu c\xF4ng ngh\u1EC7. B\xE0n ph\xEDm custom, chu\u1ED9t flagship, \u0111i\u1EC7n tho\u1EA1i \u0111\u1EC9nh nh\u1EA5t.")), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "sf-footer-h" }, "C\u1EEDa h\xE0ng"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("a", { onClick: onInfo }, "V\u1EC1 Nexus Gear")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("a", { onClick: onInfo }, "Ch\xEDnh s\xE1ch b\u1EA3o h\xE0nh")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("a", { onClick: onInfo }, "V\u1EADn chuy\u1EC3n")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("a", { onClick: onInfo }, "Thanh to\xE1n")))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "sf-footer-h" }, "H\u1ED7 tr\u1EE3"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("a", { onClick: onInfo }, "Li\xEAn h\u1EC7")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("a", { onClick: onInfo }, "FAQ")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("a", { onClick: onInfo }, "\u0110\u1ED5i tr\u1EA3")), /* @__PURE__ */ React.createElement("li", null, /* @__PURE__ */ React.createElement("a", { onClick: onInfo }, "H\u01B0\u1EDBng d\u1EABn mua h\xE0ng")))), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "sf-footer-h" }, "Li\xEAn h\u1EC7"), /* @__PURE__ */ React.createElement("ul", null, /* @__PURE__ */ React.createElement("li", null, "12 Tr\u1EA7n \u0110\u1EA1i Ngh\u0129a, H\xE0 N\u1ED9i"), /* @__PURE__ */ React.createElement("li", { className: "mono" }, "0901 234 567"), /* @__PURE__ */ React.createElement("li", { className: "mono" }, "hello@nexusgear.vn")))), /* @__PURE__ */ React.createElement("div", { className: "sf-footer-bot" }, /* @__PURE__ */ React.createElement("span", null, "\xA9 2026 Nexus Gear. All rights reserved."), /* @__PURE__ */ React.createElement("span", null, "Made with passion in Hanoi.")));
}
window.Storefront = Storefront;

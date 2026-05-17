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
  var __objRest = (source, exclude) => {
    var target = {};
    for (var prop in source)
      if (__hasOwnProp.call(source, prop) && exclude.indexOf(prop) < 0)
        target[prop] = source[prop];
    if (source != null && __getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(source)) {
        if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
          target[prop] = source[prop];
      }
    return target;
  };
  const { useState: useStateA, useEffect: useEffectA, useRef: useRefA } = React;
  const DEV_BYPASS_AUTH = true;
  const DEV_SESSION = {
    user: { username: "dev", role: "admin", name: "Dev mode" },
    loginTime: Date.now(),
    expiresAt: Number.MAX_SAFE_INTEGER
  };
  function codeDatePart(dateValue) {
    const d = dateValue ? new Date(dateValue) : /* @__PURE__ */ new Date();
    const safe = Number.isNaN(d.getTime()) ? /* @__PURE__ */ new Date() : d;
    return `${safe.getFullYear()}${String(safe.getMonth() + 1).padStart(2, "0")}${String(safe.getDate()).padStart(2, "0")}`;
  }
  function nextTransactionCode(existingCodes, dateValue) {
    const prefix = `NG-${codeDatePart(dateValue)}-`;
    const maxSeq = [...existingCodes].reduce((max, code) => {
      if (!String(code || "").startsWith(prefix)) return max;
      const seq = Number(String(code).slice(prefix.length));
      return Number.isFinite(seq) ? Math.max(max, seq) : max;
    }, 0);
    return `${prefix}${String(maxSeq + 1).padStart(4, "0")}`;
  }
  function ensureTransactionCodes(rows) {
    const usedCodes = /* @__PURE__ */ new Set();
    return rows.map((unit) => {
      const current = unit.transactionCode;
      const transactionCode = current && !usedCodes.has(current) ? current : nextTransactionCode(usedCodes, unit.arrived);
      usedCodes.add(transactionCode);
      return __spreadProps(__spreadValues({}, unit), { transactionCode });
    });
  }
  function buildUnitsWithCodes(rows, existingUnits, idPrefix) {
    const usedCodes = new Set(existingUnits.map((u) => u.transactionCode).filter(Boolean));
    const stamp = Date.now();
    return rows.map((unit, index) => {
      const transactionCode = nextTransactionCode(usedCodes, unit.arrived);
      usedCodes.add(transactionCode);
      return __spreadProps(__spreadValues({}, unit), {
        id: `${idPrefix}_${stamp}_${index}`,
        transactionCode
      });
    });
  }
  function loadSnapshots() {
    try {
      const saved = localStorage.getItem("nexus_gear_snapshots");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to load snapshots from localStorage:", e);
      return [];
    }
  }
  function loadAffiliateIncomes() {
    try {
      const saved = localStorage.getItem("nexus_gear_affiliate_incomes");
      const parsed = saved ? JSON.parse(saved) : [];
      return normalizeAffiliateIncomes(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      console.error("Failed to load affiliate incomes from localStorage:", e);
      return [];
    }
  }
  function normalizeAffiliateStatus(value) {
    return value === "pending" ? "pending" : "paid";
  }
  function normalizeAffiliateIncomes(entries) {
    return (entries || []).map((entry) => __spreadProps(__spreadValues({}, entry), {
      amount: Math.max(0, Math.round(+entry.amount || 0)),
      status: normalizeAffiliateStatus(entry.status)
    }));
  }
  function loadDashboardSettings() {
    try {
      const saved = localStorage.getItem("nexus_gear_dashboard_settings");
      const parsed = saved ? JSON.parse(saved) : {};
      return {
        includePendingAffiliateInProfit: Boolean(parsed == null ? void 0 : parsed.includePendingAffiliateInProfit)
      };
    } catch (e) {
      console.error("Failed to load dashboard settings from localStorage:", e);
      return { includePendingAffiliateInProfit: false };
    }
  }
  function loadProductLines() {
    try {
      const saved = localStorage.getItem("nexus_gear_product_lines");
      const parsed = saved ? JSON.parse(saved) : [];
      const existing = Array.isArray(parsed) ? parsed : [];
      const byId = new Map(existing.map((line) => [line.id, line]));
      window.INITIAL_PRODUCT_LINES.forEach((line) => {
        if (!byId.has(line.id)) {
          byId.set(line.id, __spreadProps(__spreadValues({}, line), {
            variants: (line.variants || []).map((variant) => __spreadValues({}, variant))
          }));
        }
      });
      return [...byId.values()];
    } catch (e) {
      console.error("Failed to load product lines from localStorage:", e);
      return window.INITIAL_PRODUCT_LINES;
    }
  }
  function loadCategories() {
    try {
      const initial = (window.INITIAL_CATEGORIES || window.CATEGORIES || []).map((category) => __spreadValues({}, category));
      const saved = localStorage.getItem("nexus_gear_categories");
      const parsed = saved ? JSON.parse(saved) : [];
      const existing = Array.isArray(parsed) ? parsed : [];
      const byId = new Map(initial.map((category) => [category.id, category]));
      existing.forEach((category) => {
        if ((category == null ? void 0 : category.id) && (category == null ? void 0 : category.name)) {
          byId.set(category.id, __spreadValues({}, category));
        }
      });
      return [...byId.values()];
    } catch (e) {
      console.error("Failed to load categories from localStorage:", e);
      return (window.INITIAL_CATEGORIES || window.CATEGORIES || []).map((category) => __spreadValues({}, category));
    }
  }
  function loadUnits() {
    try {
      const saved = localStorage.getItem("nexus_gear_units");
      const parsed = saved ? JSON.parse(saved) : window.INITIAL_UNITS;
      const rows = Array.isArray(parsed) ? parsed : window.INITIAL_UNITS;
      const seededMonitorSamples = localStorage.getItem("nexus_gear_monitor_seed_v1") === "1";
      const monitorSamples = window.INITIAL_UNITS.filter((unit) => unit.cat === "monitor");
      const alreadyHasMonitorUnits = rows.some((unit) => unit.cat === "monitor");
      if (saved && !seededMonitorSamples) {
        localStorage.setItem("nexus_gear_monitor_seed_v1", "1");
        if (!alreadyHasMonitorUnits) {
          return ensureTransactionCodes([
            ...rows,
            ...monitorSamples.map((unit) => __spreadValues({}, unit))
          ]);
        }
      }
      return ensureTransactionCodes(rows);
    } catch (e) {
      console.error("Failed to load units from localStorage:", e);
      return ensureTransactionCodes(window.INITIAL_UNITS);
    }
  }
  function createSnapshot(units, productLines, categories, affiliateIncomes, dashboardSettings, tab, name, kind = "manual") {
    const createdAt = (/* @__PURE__ */ new Date()).toISOString();
    return {
      id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: name || `B\u1EA3n l\u01B0u ${new Date(createdAt).toLocaleString("vi-VN")}`,
      kind,
      createdAt,
      tab,
      units: ensureTransactionCodes(units).map((u) => __spreadValues({}, u)),
      productLines: productLines.map((line) => __spreadProps(__spreadValues({}, line), { variants: (line.variants || []).map((v) => __spreadValues({}, v)) })),
      categories: categories.map((category) => __spreadValues({}, category)),
      affiliateIncomes: normalizeAffiliateIncomes(affiliateIncomes).map((entry) => __spreadValues({}, entry)),
      dashboardSettings: {
        includePendingAffiliateInProfit: Boolean(dashboardSettings == null ? void 0 : dashboardSettings.includePendingAffiliateInProfit)
      },
      summary: window.summarizeUnits(units)
    };
  }
  function formatSnapshotStamp(dateValue = /* @__PURE__ */ new Date()) {
    const d = dateValue instanceof Date ? dateValue : new Date(dateValue);
    return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}_${String(d.getHours()).padStart(2, "0")}-${String(d.getMinutes()).padStart(2, "0")}-${String(d.getSeconds()).padStart(2, "0")}`;
  }
  function makeAutoSnapshotName(sourceName) {
    const now = /* @__PURE__ */ new Date();
    return `${now.getTime()}_${sourceName}_sao-luu_${formatSnapshotStamp(now)}`;
  }
  function catalogEntitySlug(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function makeUniqueCatalogId(base, existingIds, fallback) {
    const safeBase = base || fallback;
    if (!existingIds.has(safeBase)) return safeBase;
    let index = 2;
    while (existingIds.has(`${safeBase}-${index}`)) index += 1;
    return `${safeBase}-${index}`;
  }
  const EXTRA_CATEGORY_COLORS = [
    "#0ea5e9",
    "#8b5cf6",
    "#14b8a6",
    "#f97316",
    "#ec4899",
    "#84cc16",
    "#6366f1"
  ];
  const SHARED_POLL_MS = 2500;
  const LOCK_HEARTBEAT_MS = 1e4;
  function getOrCreateClientId() {
    try {
      const saved = localStorage.getItem("nexus_gear_client_id");
      if (saved) return saved;
      const generated = `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("nexus_gear_client_id", generated);
      return generated;
    } catch (e) {
      return `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
  }
  function makeClientName(clientId) {
    const shortId = clientId.slice(-4).toUpperCase();
    return `Thi\u1EBFt b\u1ECB ${shortId}`;
  }
  function buildSharedState(units, productLines, categories, affiliateIncomes, dashboardSettings, snapshots) {
    return {
      units: ensureTransactionCodes(units).map((unit) => __spreadValues({}, unit)),
      productLines: productLines.map((line) => cloneProductLine(line)),
      categories: categories.map((category) => __spreadValues({}, category)),
      affiliateIncomes: normalizeAffiliateIncomes(affiliateIncomes).map((entry) => __spreadValues({}, entry)),
      dashboardSettings: {
        includePendingAffiliateInProfit: Boolean(dashboardSettings == null ? void 0 : dashboardSettings.includePendingAffiliateInProfit)
      },
      snapshots: snapshots.map((snapshot) => {
        var _a;
        return __spreadProps(__spreadValues({}, snapshot), {
          units: ensureTransactionCodes(snapshot.units || []).map((unit) => __spreadValues({}, unit)),
          productLines: (snapshot.productLines || []).map((line) => cloneProductLine(line)),
          categories: (snapshot.categories || []).map((category) => __spreadValues({}, category)),
          affiliateIncomes: normalizeAffiliateIncomes(snapshot.affiliateIncomes || []).map((entry) => __spreadValues({}, entry)),
          dashboardSettings: {
            includePendingAffiliateInProfit: Boolean((_a = snapshot.dashboardSettings) == null ? void 0 : _a.includePendingAffiliateInProfit)
          }
        });
      })
    };
  }
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function cloneProductLine(line) {
    return __spreadProps(__spreadValues({}, line), {
      variants: (line.variants || []).map((variant) => __spreadValues({}, variant))
    });
  }
  function upsertProductLine(lines, line) {
    const cleanLine = cloneProductLine(line);
    return lines.some((item) => item.id === cleanLine.id) ? lines.map((item) => item.id === cleanLine.id ? cleanLine : item) : [...lines, cleanLine];
  }
  function App() {
    var _a;
    const [session, setSession] = useStateA(DEV_BYPASS_AUTH ? DEV_SESSION : null);
    const [initialized, setInitialized] = useStateA(false);
    const [tab, setTab] = useStateA(DEV_BYPASS_AUTH ? "dashboard" : "storefront");
    const [snapshots, setSnapshots] = useStateA(() => loadSnapshots());
    const [toasts, setToasts] = useStateA([]);
    const [categories, setCategories] = useStateA(() => loadCategories());
    const [productLines, setProductLines] = useStateA(() => loadProductLines());
    const [affiliateIncomes, setAffiliateIncomes] = useStateA(() => loadAffiliateIncomes());
    const [dashboardSettings, setDashboardSettings] = useStateA(() => loadDashboardSettings());
    const [units, setUnits] = useStateA(() => loadUnits());
    const [syncMode, setSyncMode] = useStateA("probing");
    const [syncReady, setSyncReady] = useStateA(false);
    const [serverVersion, setServerVersion] = useStateA(0);
    const [editLock, setEditLock] = useStateA({ owned: false, lock: null });
    const clientIdRef = useRefA(getOrCreateClientId());
    const clientNameRef = useRefA(makeClientName(clientIdRef.current));
    const suppressRemoteSaveRef = useRefA(false);
    const saveTimerRef = useRefA(null);
    const serverVersionRef = useRefA(0);
    window.CATEGORIES = categories;
    useEffectA(() => {
      if (DEV_BYPASS_AUTH) {
        setInitialized(true);
        return;
      }
      try {
        const saved = localStorage.getItem("nexus_gear_session");
        if (saved) {
          const sess = JSON.parse(saved);
          if (window.isSessionValid(sess)) {
            setSession(sess);
          } else {
            localStorage.removeItem("nexus_gear_session");
          }
        }
      } catch (e) {
        console.error("Failed to load session:", e);
      }
      setInitialized(true);
    }, []);
    const pushToast = (toast) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const nextToast = __spreadValues({ id }, toast);
      setToasts((prev) => [...prev, nextToast].slice(-3));
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 5e3);
    };
    const applySharedPayload = (payload) => {
      var _a2, _b;
      if (!(payload == null ? void 0 : payload.state)) return;
      suppressRemoteSaveRef.current = true;
      setUnits(ensureTransactionCodes(payload.state.units || []));
      setProductLines(payload.state.productLines || []);
      setCategories(((_a2 = payload.state.categories) == null ? void 0 : _a2.length) ? payload.state.categories : loadCategories());
      setAffiliateIncomes(normalizeAffiliateIncomes(payload.state.affiliateIncomes || []));
      setDashboardSettings({
        includePendingAffiliateInProfit: Boolean((_b = payload.state.dashboardSettings) == null ? void 0 : _b.includePendingAffiliateInProfit)
      });
      setSnapshots(payload.state.snapshots || []);
      serverVersionRef.current = payload.version || 0;
      setServerVersion(payload.version || 0);
    };
    const acquireEditLock = async ({ silent = false } = {}) => {
      var _a2;
      try {
        const res = await fetch("/api/lock/acquire", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: clientIdRef.current,
            clientName: clientNameRef.current
          })
        });
        const payload = await res.json();
        const owned = Boolean(payload.granted);
        setEditLock({ owned, lock: payload.lock || null });
        if (!silent) {
          pushToast(
            owned ? { type: "success", title: "\u0110\xE3 nh\u1EADn quy\u1EC1n s\u1EEDa", message: "Phi\xEAn n\xE0y \u0111ang gi\u1EEF quy\u1EC1n ch\u1EC9nh s\u1EEDa d\u1EEF li\u1EC7u chung." } : { type: "warning", title: "Ch\u1EC9 xem", message: `${((_a2 = payload.lock) == null ? void 0 : _a2.ownerName) || "Thi\u1EBFt b\u1ECB kh\xE1c"} \u0111ang ch\u1EC9nh s\u1EEDa d\u1EEF li\u1EC7u.` }
          );
        }
        return owned;
      } catch (error) {
        console.error("Failed to acquire edit lock:", error);
        return false;
      }
    };
    const releaseEditLock = async ({ silent = false } = {}) => {
      try {
        await fetch("/api/lock/release", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId: clientIdRef.current }),
          keepalive: true
        });
      } catch (error) {
        console.error("Failed to release edit lock:", error);
      } finally {
        setEditLock({ owned: false, lock: null });
        if (!silent) {
          pushToast({ type: "warning", title: "\u0110\xE3 tr\u1EA3 quy\u1EC1n s\u1EEDa", message: "Phi\xEAn n\xE0y chuy\u1EC3n sang ch\u1EBF \u0111\u1ED9 ch\u1EC9 xem." });
        }
      }
    };
    useEffectA(() => {
      let cancelled = false;
      const initializeSharedSync = async () => {
        try {
          const res = await fetch("/api/state", { cache: "no-store" });
          if (!res.ok) throw new Error(`state endpoint returned ${res.status}`);
          let payload = await res.json();
          if (cancelled) return;
          setSyncMode("shared");
          if (payload.initialized) {
            applySharedPayload(payload);
          } else {
            const ownsLock = await acquireEditLock({ silent: true });
            if (ownsLock) {
              const bootstrapRes = await fetch("/api/bootstrap", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  clientId: clientIdRef.current,
                  state: buildSharedState(units, productLines, categories, affiliateIncomes, dashboardSettings, snapshots)
                })
              });
              payload = await bootstrapRes.json();
              if (bootstrapRes.ok || bootstrapRes.status === 409) {
                applySharedPayload(payload);
              }
            } else {
              for (let attempt = 0; attempt < 20 && !payload.initialized; attempt += 1) {
                await sleep(250);
                payload = await (await fetch("/api/state", { cache: "no-store" })).json();
              }
              if (!payload.initialized) throw new Error("shared database was not initialized in time");
              applySharedPayload(payload);
            }
          }
          if (!editLock.owned) {
            await acquireEditLock({ silent: true });
          }
          if (!cancelled) setSyncReady(true);
        } catch (error) {
          console.warn("Shared backend unavailable; entering offline read-only mode.", error);
          if (!cancelled) {
            setSyncMode("offline");
            setSyncReady(true);
          }
        }
      };
      initializeSharedSync();
      return () => {
        cancelled = true;
      };
    }, []);
    useEffectA(() => {
      try {
        localStorage.setItem("nexus_gear_units", JSON.stringify(units));
      } catch (e) {
        console.error("Failed to save units to localStorage:", e);
      }
    }, [units]);
    useEffectA(() => {
      try {
        localStorage.setItem("nexus_gear_categories", JSON.stringify(categories));
      } catch (e) {
        console.error("Failed to save categories to localStorage:", e);
      }
    }, [categories]);
    useEffectA(() => {
      try {
        localStorage.setItem("nexus_gear_product_lines", JSON.stringify(productLines));
      } catch (e) {
        console.error("Failed to save product lines to localStorage:", e);
      }
    }, [productLines]);
    useEffectA(() => {
      try {
        localStorage.setItem("nexus_gear_affiliate_incomes", JSON.stringify(affiliateIncomes));
      } catch (e) {
        console.error("Failed to save affiliate incomes to localStorage:", e);
      }
    }, [affiliateIncomes]);
    useEffectA(() => {
      try {
        localStorage.setItem("nexus_gear_dashboard_settings", JSON.stringify(dashboardSettings));
      } catch (e) {
        console.error("Failed to save dashboard settings to localStorage:", e);
      }
    }, [dashboardSettings]);
    useEffectA(() => {
      try {
        localStorage.setItem("nexus_gear_snapshots", JSON.stringify(snapshots));
      } catch (e) {
        console.error("Failed to save snapshots to localStorage:", e);
      }
    }, [snapshots]);
    useEffectA(() => {
      if (!syncReady || syncMode !== "shared" || !editLock.owned) return;
      if (suppressRemoteSaveRef.current) {
        suppressRemoteSaveRef.current = false;
        return;
      }
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch("/api/state", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              clientId: clientIdRef.current,
              version: serverVersionRef.current,
              state: buildSharedState(units, productLines, categories, affiliateIncomes, dashboardSettings, snapshots)
            })
          });
          const payload = await res.json();
          if (res.ok) {
            serverVersionRef.current = payload.version || serverVersionRef.current;
            setServerVersion(payload.version);
            return;
          }
          if (res.status === 409) {
            applySharedPayload(payload);
            pushToast({
              type: "warning",
              title: "\u0110\xE3 n\u1EA1p b\u1EA3n m\u1EDBi h\u01A1n",
              message: "M\xE1y ch\u1EE7 c\xF3 d\u1EEF li\u1EC7u m\u1EDBi h\u01A1n; m\xE0n h\xECnh \u0111\xE3 t\u1EF1 \u0111\u1ED3ng b\u1ED9 l\u1EA1i."
            });
          }
          if (res.status === 423) {
            setEditLock({ owned: false, lock: payload.lock || null });
            pushToast({
              type: "warning",
              title: "M\u1EA5t quy\u1EC1n s\u1EEDa",
              message: "Phi\xEAn n\xE0y kh\xF4ng c\xF2n gi\u1EEF kh\xF3a ch\u1EC9nh s\u1EEDa."
            });
          }
        } catch (error) {
          console.error("Failed to save shared state:", error);
          pushToast({
            type: "warning",
            title: "Ch\u01B0a \u0111\u1ED3ng b\u1ED9",
            message: "Kh\xF4ng g\u1EEDi \u0111\u01B0\u1EE3c thay \u0111\u1ED5i l\xEAn m\xE1y ch\u1EE7; h\xE3y ki\u1EC3m tra k\u1EBFt n\u1ED1i."
          });
        }
      }, 250);
      return () => {
        if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      };
    }, [units, productLines, categories, affiliateIncomes, dashboardSettings, snapshots, syncReady, syncMode, editLock.owned]);
    useEffectA(() => {
      if (!syncReady || syncMode !== "shared") return;
      const interval = setInterval(async () => {
        try {
          const payload = await (await fetch("/api/state", { cache: "no-store" })).json();
          setEditLock((prev) => {
            var _a2;
            return { owned: prev.owned && ((_a2 = payload.lock) == null ? void 0 : _a2.ownerId) === clientIdRef.current, lock: payload.lock || null };
          });
          if (payload.initialized && payload.version > serverVersionRef.current) {
            applySharedPayload(payload);
          }
        } catch (error) {
          console.error("Failed to poll shared state:", error);
        }
      }, SHARED_POLL_MS);
      return () => clearInterval(interval);
    }, [syncReady, syncMode]);
    useEffectA(() => {
      if (!syncReady || syncMode !== "shared" || !editLock.owned) return;
      const heartbeat = async () => {
        try {
          const res = await fetch("/api/lock/heartbeat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientId: clientIdRef.current })
          });
          const payload = await res.json();
          if (!res.ok || !payload.granted) {
            setEditLock({ owned: false, lock: payload.lock || null });
          } else {
            setEditLock({ owned: true, lock: payload.lock || null });
          }
        } catch (error) {
          console.error("Failed to heartbeat edit lock:", error);
        }
      };
      const interval = setInterval(heartbeat, LOCK_HEARTBEAT_MS);
      return () => clearInterval(interval);
    }, [syncReady, syncMode, editLock.owned]);
    useEffectA(() => {
      const releaseOnUnload = () => {
        var _a2;
        if (!editLock.owned || syncMode !== "shared") return;
        (_a2 = navigator.sendBeacon) == null ? void 0 : _a2.call(
          navigator,
          "/api/lock/release",
          new Blob([JSON.stringify({ clientId: clientIdRef.current })], { type: "application/json" })
        );
      };
      window.addEventListener("beforeunload", releaseOnUnload);
      return () => window.removeEventListener("beforeunload", releaseOnUnload);
    }, [editLock.owned, syncMode]);
    useEffectA(() => {
      if (session) {
        try {
          localStorage.setItem("nexus_gear_session", JSON.stringify(session));
        } catch (e) {
          console.error("Failed to save session:", e);
        }
      }
    }, [session]);
    useEffectA(() => {
      if (DEV_BYPASS_AUTH) return;
      const interval = setInterval(() => {
        if (session && !window.isSessionValid(session)) {
          setSession(null);
          localStorage.removeItem("nexus_gear_session");
        }
      }, 6e4);
      return () => clearInterval(interval);
    }, [session]);
    useEffectA(() => {
      const handlePopState = (e) => {
      };
      window.addEventListener("popstate", handlePopState);
      return () => window.removeEventListener("popstate", handlePopState);
    }, []);
    const handleLogin = (newSession) => {
      setSession(newSession);
      setTab("dashboard");
    };
    const handleLogout = () => {
      if (DEV_BYPASS_AUTH) return;
      setSession(null);
      localStorage.removeItem("nexus_gear_session");
      setTab("storefront");
    };
    const canAccess = (tabName) => {
      if (DEV_BYPASS_AUTH) return true;
      if (!session) {
        return tabName === "storefront";
      }
      return window.hasPermission(session.user.role, tabName);
    };
    const canEditSharedData = syncMode === "shared" && editLock.owned;
    const ensureCanEdit = () => {
      var _a2;
      if (canEditSharedData) return true;
      pushToast({
        type: "warning",
        title: syncMode === "offline" ? "Ch\u01B0a c\xF3 m\xE1y ch\u1EE7 chung" : "Ch\u1EBF \u0111\u1ED9 ch\u1EC9 xem",
        message: syncMode === "offline" ? "H\xE3y m\u1EDF trang qua m\xE1y ch\u1EE7 \u0111\u1ED3ng b\u1ED9 \u0111\u1EC3 ch\u1EC9nh s\u1EEDa d\u1EEF li\u1EC7u chung." : `${((_a2 = editLock.lock) == null ? void 0 : _a2.ownerName) || "Thi\u1EBFt b\u1ECB kh\xE1c"} \u0111ang gi\u1EEF quy\u1EC1n ch\u1EC9nh s\u1EEDa.`
      });
      return false;
    };
    if (!initialized || !syncReady) {
      return React.createElement("div", {
        style: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh"
        }
      }, React.createElement("div", null, !syncReady ? "\u0110ang k\u1EBFt n\u1ED1i d\u1EEF li\u1EC7u chung..." : "\u0110ang t\u1EA3i..."));
    }
    if (syncMode === "offline") {
      return /* @__PURE__ */ React.createElement("div", { className: "sync-blocked-screen" }, /* @__PURE__ */ React.createElement("div", { className: "sync-blocked-card" }, /* @__PURE__ */ React.createElement("div", { className: "sync-blocked-kicker" }, "KH\xD4NG C\xD3 NGU\u1ED2N D\u1EEE LI\u1EC6U CHUNG"), /* @__PURE__ */ React.createElement("h1", null, "Kh\xF4ng m\u1EDF d\u1EEF li\u1EC7u c\u1EE5c b\u1ED9 \u0111\u1EC3 tr\xE1nh l\u1EC7ch gi\u1EEFa c\xE1c thi\u1EBFt b\u1ECB."), /* @__PURE__ */ React.createElement("p", null, "H\xE3y ch\u1EA1y ", /* @__PURE__ */ React.createElement("span", { className: "mono" }, "node server.js"), " r\u1ED3i truy c\u1EADp c\xF9ng m\u1ED9t \u0111\u1ECBa ch\u1EC9 m\xE1y ch\u1EE7 tr\xEAn m\u1ECDi tr\xECnh duy\u1EC7t.")));
    }
    if (!DEV_BYPASS_AUTH && !session) {
      return React.createElement(window.LoginScreen, { onLogin: handleLogin });
    }
    const now = /* @__PURE__ */ new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const sellUnit = (id, sell, soldDate, note) => {
      if (!ensureCanEdit()) return;
      setUnits((prev) => prev.map(
        (u) => u.id === id ? __spreadProps(__spreadValues({}, u), { status: "sold", sell: +sell, sold: soldDate, note: note != null ? note : u.note }) : u
      ));
    };
    const cancelSale = (id) => {
      if (!ensureCanEdit()) return;
      setUnits((prev) => prev.map(
        (u) => u.id === id ? __spreadProps(__spreadValues({}, u), { status: "in_stock", sell: void 0, sold: void 0 }) : u
      ));
    };
    const updateNote = (id, note) => {
      if (!canEditSharedData) return;
      setUnits((prev) => prev.map((u) => u.id === id ? __spreadProps(__spreadValues({}, u), { note }) : u));
    };
    const updateUnit = (id, patch) => {
      if (!ensureCanEdit()) return;
      setUnits((prev) => prev.map((u) => {
        if (u.id !== id) return u;
        const next = __spreadProps(__spreadValues(__spreadValues({}, u), patch), {
          id: u.id,
          transactionCode: u.transactionCode
        });
        if (next.status === "in_stock") {
          delete next.sell;
          delete next.sold;
        }
        return next;
      }));
    };
    const addUnit = (u) => {
      if (!ensureCanEdit()) return;
      const quantity = Math.max(1, Math.floor(+u.quantity || 1));
      const _a2 = u, { quantity: _quantity } = _a2, base = __objRest(_a2, ["quantity"]);
      const rows = Array.from({ length: quantity }, () => __spreadProps(__spreadValues({}, base), { status: "in_stock" }));
      setUnits((prev) => [...buildUnitsWithCodes(rows, prev, "manual"), ...prev]);
    };
    const importUnits = (rows, options = {}) => {
      if (!ensureCanEdit()) return;
      const catalogLines2 = window.mergeCatalogWithUnits(productLines, units);
      const normalizedRows = window.attachCatalogRefs(rows, catalogLines2);
      setUnits(
        (prev) => options.replaceExisting ? buildUnitsWithCodes(normalizedRows, [], "imp") : [...buildUnitsWithCodes(normalizedRows, prev, "imp"), ...prev]
      );
    };
    const addAffiliateIncome = (entry) => {
      if (!ensureCanEdit()) return;
      const amount = Math.max(0, Math.round(+entry.amount || 0));
      if (!amount || !entry.receivedAt) return;
      setAffiliateIncomes((prev) => [
        {
          id: `aff_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          amount,
          receivedAt: entry.receivedAt,
          status: normalizeAffiliateStatus(entry.status),
          note: String(entry.note || "").trim()
        },
        ...prev
      ]);
    };
    const updateAffiliateIncome = (id, patch) => {
      if (!ensureCanEdit()) return;
      setAffiliateIncomes((prev) => prev.map((entry) => {
        if (entry.id !== id) return entry;
        return __spreadProps(__spreadValues({}, entry), {
          amount: Math.max(0, Math.round(+patch.amount || 0)),
          receivedAt: patch.receivedAt || entry.receivedAt,
          status: normalizeAffiliateStatus(patch.status),
          note: String(patch.note || "").trim()
        });
      }));
    };
    const removeAffiliateIncome = (id) => {
      if (!ensureCanEdit()) return;
      setAffiliateIncomes((prev) => prev.filter((entry) => entry.id !== id));
    };
    const setIncludePendingAffiliateInProfit = (value) => {
      if (!ensureCanEdit()) return;
      setDashboardSettings((prev) => __spreadProps(__spreadValues({}, prev), {
        includePendingAffiliateInProfit: Boolean(value)
      }));
    };
    const removeUnit = (id) => {
      if (!ensureCanEdit()) return;
      setUnits((prev) => prev.filter((u) => u.id !== id));
    };
    const saveSnapshot = (name) => {
      if (!ensureCanEdit()) return;
      setSnapshots((prev) => [createSnapshot(units, productLines, categories, affiliateIncomes, dashboardSettings, tab, name), ...prev]);
      pushToast({
        type: "success",
        title: "\u0110\xE3 sao l\u01B0u",
        message: (name == null ? void 0 : name.trim()) ? `\u0110\xE3 l\u01B0u "${name.trim()}".` : "\u0110\xE3 l\u01B0u tr\u1EA1ng th\xE1i hi\u1EC7n t\u1EA1i."
      });
    };
    const restoreSnapshot = (id) => {
      var _a2;
      if (!ensureCanEdit()) return;
      const snapshot = snapshots.find((s) => s.id === id);
      if (!snapshot) return;
      const safetyCopy = createSnapshot(
        units,
        productLines,
        categories,
        affiliateIncomes,
        dashboardSettings,
        tab,
        makeAutoSnapshotName(snapshot.name),
        "auto"
      );
      setSnapshots((prev) => [safetyCopy, ...prev]);
      setUnits(ensureTransactionCodes(snapshot.units || []));
      setCategories(snapshot.categories || categories);
      setProductLines(snapshot.productLines || productLines);
      setAffiliateIncomes(normalizeAffiliateIncomes(snapshot.affiliateIncomes || []));
      setDashboardSettings({
        includePendingAffiliateInProfit: Boolean((_a2 = snapshot.dashboardSettings) == null ? void 0 : _a2.includePendingAffiliateInProfit)
      });
      setTab(snapshot.tab || "dashboard");
      pushToast({
        type: "restore",
        title: "\u0110\xE3 kh\xF4i ph\u1EE5c",
        message: `\u0110\xE3 m\u1EDF l\u1EA1i "${snapshot.name}".`
      });
    };
    const deleteSnapshots = (ids) => {
      if (!ensureCanEdit()) return;
      const idsSet = new Set(Array.isArray(ids) ? ids : [ids]);
      setSnapshots((prev) => prev.filter((s) => !idsSet.has(s.id)));
    };
    const addProductLine = (line) => {
      if (!ensureCanEdit()) return;
      setProductLines((prev) => prev.some((x) => x.id === line.id) ? prev : [...prev, line]);
    };
    const addProductVariant = (line, variant) => {
      if (!ensureCanEdit()) return;
      setProductLines((prev) => {
        const existing = prev.find((item) => item.id === line.id);
        if (!existing) {
          return [
            ...prev,
            {
              id: line.id,
              cat: line.cat,
              brand: line.brand || "",
              name: line.name,
              variants: [...line.variants || [], variant]
            }
          ];
        }
        return prev.map((item) => item.id === line.id ? __spreadProps(__spreadValues({}, item), {
          variants: item.variants.some((v) => v.id === variant.id || v.name === variant.name) ? item.variants : [...item.variants, variant]
        }) : item);
      });
    };
    const createCategoryFromName = (name) => {
      if (!ensureCanEdit()) return null;
      const trimmedName = String(name || "").trim();
      if (!trimmedName) return null;
      const existing = categories.find(
        (category2) => category2.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (existing) return existing;
      const usedIds = new Set(categories.map((category2) => category2.id));
      const id = makeUniqueCatalogId(catalogEntitySlug(trimmedName), usedIds, "danh-muc");
      const category = {
        id,
        name: trimmedName,
        color: EXTRA_CATEGORY_COLORS[categories.length % EXTRA_CATEGORY_COLORS.length]
      };
      setCategories((prev) => [...prev, category]);
      return category;
    };
    const createProductLineFromName = (name, catId) => {
      var _a2;
      if (!ensureCanEdit()) return null;
      const trimmedName = String(name || "").trim();
      if (!trimmedName) return null;
      const safeCat = categories.some((category) => category.id === catId) ? catId : ((_a2 = categories[0]) == null ? void 0 : _a2.id) || "accessory";
      const currentCatalog = window.mergeCatalogWithUnits(productLines, units);
      const existing = currentCatalog.find(
        (line2) => line2.cat === safeCat && line2.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (existing) return existing;
      const usedIds = new Set(currentCatalog.map((line2) => line2.id));
      const id = makeUniqueCatalogId(catalogEntitySlug(trimmedName), usedIds, "dong-san-pham");
      const line = {
        id,
        cat: safeCat,
        brand: "",
        name: trimmedName,
        variants: [{ id: `${id}-mac-dinh`, name: "M\u1EB7c \u0111\u1ECBnh" }]
      };
      setProductLines((prev) => [...prev, line]);
      return line;
    };
    const createProductVariantFromName = (line, name) => {
      if (!ensureCanEdit()) return null;
      const trimmedName = String(name || "").trim();
      if (!line || !trimmedName) return null;
      const existing = (line.variants || []).find(
        (variant2) => variant2.name.trim().toLowerCase() === trimmedName.toLowerCase()
      );
      if (existing) return existing;
      const usedIds = new Set((line.variants || []).map((variant2) => variant2.id));
      const base = `${line.id}-${catalogEntitySlug(trimmedName)}`;
      const variant = {
        id: makeUniqueCatalogId(base, usedIds, `${line.id}-phan-loai`),
        name: trimmedName
      };
      addProductVariant(line, variant);
      return variant;
    };
    const updateProductLine = (line, patch) => {
      if (!ensureCanEdit()) return;
      const updatedLine = __spreadProps(__spreadValues(__spreadValues({}, line), patch), {
        id: line.id,
        variants: (line.variants || []).map((variant) => __spreadValues({}, variant))
      });
      setProductLines((prev) => upsertProductLine(prev, updatedLine));
      setUnits((prev) => prev.map((unit) => {
        const belongsToLine = unit.productLineId === line.id || unit.name === line.name && unit.cat === line.cat;
        return belongsToLine ? __spreadProps(__spreadValues({}, unit), {
          productLineId: line.id,
          name: updatedLine.name,
          cat: updatedLine.cat
        }) : unit;
      }));
    };
    const updateProductVariant = (line, variant, patch) => {
      if (!ensureCanEdit()) return;
      const updatedLine = __spreadProps(__spreadValues({}, line), {
        variants: (line.variants || []).map((item) => item.id === variant.id ? __spreadProps(__spreadValues(__spreadValues({}, item), patch), { id: item.id }) : __spreadValues({}, item))
      });
      setProductLines((prev) => upsertProductLine(prev, updatedLine));
      setUnits((prev) => prev.map((unit) => {
        var _a2;
        const belongsToLine = unit.productLineId === line.id || unit.name === line.name && unit.cat === line.cat;
        const belongsToVariant = unit.variantId === variant.id || belongsToLine && (unit.variant || "M\u1EB7c \u0111\u1ECBnh") === variant.name;
        return belongsToLine && belongsToVariant ? __spreadProps(__spreadValues({}, unit), {
          productLineId: line.id,
          variantId: variant.id,
          variant: (_a2 = patch.name) != null ? _a2 : variant.name
        }) : unit;
      }));
    };
    const inStock = units.filter((u) => u.status === "in_stock");
    const sold = units.filter((u) => u.status === "sold");
    const catalogLines = window.mergeCatalogWithUnits(productLines, units);
    const remainingTime = !DEV_BYPASS_AUTH && session ? Math.ceil((session.expiresAt - Date.now()) / 1e3 / 60) : 0;
    return /* @__PURE__ */ React.createElement("div", { className: "app" }, /* @__PURE__ */ React.createElement("header", { className: "topbar" }, /* @__PURE__ */ React.createElement("div", { className: "logo" }, /* @__PURE__ */ React.createElement("div", { className: "logo-mark" }, "N"), /* @__PURE__ */ React.createElement("div", { className: "logo-name" }, "NEXUS", /* @__PURE__ */ React.createElement("span", null, "GEAR"))), /* @__PURE__ */ React.createElement("nav", { className: "tabs" }, /* @__PURE__ */ React.createElement(
      "button",
      {
        className: `tab ${tab === "dashboard" ? "active" : ""} ${!canAccess("dashboard") ? "disabled" : ""}`,
        onClick: () => canAccess("dashboard") && setTab("dashboard"),
        disabled: !canAccess("dashboard"),
        title: !canAccess("dashboard") ? "Ch\u1EC9 admin c\xF3 th\u1EC3 truy c\u1EADp" : ""
      },
      "T\u1ED5ng quan"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: `tab ${tab === "inventory" ? "active" : ""} ${!canAccess("inventory") ? "disabled" : ""}`,
        onClick: () => canAccess("inventory") && setTab("inventory"),
        disabled: !canAccess("inventory"),
        title: !canAccess("inventory") ? "Ch\u1EC9 admin c\xF3 th\u1EC3 truy c\u1EADp" : ""
      },
      "Kho h\xE0ng"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: `tab ${tab === "catalog" ? "active" : ""} ${!canAccess("catalog") ? "disabled" : ""}`,
        onClick: () => canAccess("catalog") && setTab("catalog"),
        disabled: !canAccess("catalog"),
        title: !canAccess("catalog") ? "Ch\u1EC9 admin c\xF3 th\u1EC3 truy c\u1EADp" : ""
      },
      "Danh m\u1EE5c"
    ), /* @__PURE__ */ React.createElement(
      "button",
      {
        className: `tab ${tab === "storefront" ? "active" : ""}`,
        onClick: () => setTab("storefront")
      },
      "C\u1EEDa h\xE0ng"
    )), /* @__PURE__ */ React.createElement("div", { className: "top-spacer" }), /* @__PURE__ */ React.createElement("div", { className: "top-meta" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("span", { className: "live-dot" }), "LIVE"), /* @__PURE__ */ React.createElement("span", null, new Date(today).toLocaleDateString("vi-VN")), /* @__PURE__ */ React.createElement("span", { className: `sync-chip ${syncMode === "offline" ? "offline" : canEditSharedData ? "editor" : "viewer"}` }, syncMode === "offline" ? "KH\xD4NG \u0110\u1ED2NG B\u1ED8" : canEditSharedData ? "\u0110ANG S\u1EECA" : "CH\u1EC8 XEM"), DEV_BYPASS_AUTH ? /* @__PURE__ */ React.createElement("span", { style: { color: "var(--red)", fontWeight: 800 } }, "DEV MODE \xB7 FULL ACCESS") : remainingTime > 0 && /* @__PURE__ */ React.createElement("span", { style: {
      fontSize: 11,
      color: remainingTime < 5 ? "var(--red)" : "var(--muted)",
      marginLeft: 12
    } }, "Session: ", remainingTime, "m")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center" } }, /* @__PURE__ */ React.createElement(
      BackupManagerButton,
      {
        backups: snapshots,
        units,
        readOnly: !canEditSharedData,
        onSave: saveSnapshot,
        onRestore: restoreSnapshot,
        onDelete: deleteSnapshots
      }
    ), syncMode === "shared" && (canEditSharedData ? /* @__PURE__ */ React.createElement("button", { className: "ctl ghost", onClick: () => releaseEditLock() }, "TR\u1EA2 QUY\u1EC0N S\u1EECA") : /* @__PURE__ */ React.createElement("button", { className: "ctl ghost", onClick: () => acquireEditLock() }, "NH\u1EACN QUY\u1EC0N S\u1EECA")), /* @__PURE__ */ React.createElement("div", { className: "user-chip", title: `${session.user.name}` }, session.user.username.substring(0, 2).toUpperCase()), !DEV_BYPASS_AUTH && /* @__PURE__ */ React.createElement(
      "button",
      {
        className: "ctl ghost",
        onClick: handleLogout,
        style: { fontSize: 12, padding: "6px 12px" },
        title: "\u0110\u0103ng xu\u1EA5t"
      },
      "\u0110\u0103ng xu\u1EA5t"
    ))), !canEditSharedData ? /* @__PURE__ */ React.createElement("div", { className: "sync-banner viewer" }, "Ch\u1EBF \u0111\u1ED9 ch\u1EC9 xem \xB7 ", ((_a = editLock.lock) == null ? void 0 : _a.ownerName) || "Thi\u1EBFt b\u1ECB kh\xE1c", " \u0111ang gi\u1EEF quy\u1EC1n ch\u1EC9nh s\u1EEDa. D\u1EEF li\u1EC7u v\u1EABn t\u1EF1 \u0111\u1ED3ng b\u1ED9 t\u1EEB m\xE1y ch\u1EE7 chung.") : /* @__PURE__ */ React.createElement("div", { className: "sync-banner editor" }, "Phi\xEAn n\xE0y \u0111ang gi\u1EEF quy\u1EC1n ch\u1EC9nh s\u1EEDa \u0111\u1ED9c quy\u1EC1n. C\xE1c thi\u1EBFt b\u1ECB kh\xE1c ch\u1EC9 xem v\xE0 t\u1EF1 nh\u1EADn d\u1EEF li\u1EC7u m\u1EDBi."), /* @__PURE__ */ React.createElement("main", { "data-screen-label": tab === "dashboard" ? "01 Dashboard" : tab === "inventory" ? "02 Inventory" : tab === "catalog" ? "03 Catalog" : "04 Storefront" }, !canAccess(tab) ? /* @__PURE__ */ React.createElement("div", { style: { padding: "60px 28px", textAlign: "center", color: "var(--muted)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, marginBottom: 16 } }, "\u274C B\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp trang n\xE0y"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginBottom: 24 } }, "Ch\u1EC9 qu\u1EA3n tr\u1ECB vi\xEAn (admin) m\u1EDBi c\xF3 th\u1EC3 xem trang n\xE0y."), /* @__PURE__ */ React.createElement("button", { className: "ctl primary", onClick: () => setTab("storefront") }, "\u2190 Quay v\u1EC1 C\u1EEDa h\xE0ng")) : /* @__PURE__ */ React.createElement(React.Fragment, null, tab === "dashboard" && /* @__PURE__ */ React.createElement(
      Dashboard,
      {
        units,
        sold,
        affiliateIncomes,
        includePendingAffiliateInProfit: dashboardSettings.includePendingAffiliateInProfit,
        catalogLines,
        today,
        importUnits,
        cancelSale,
        updateNote,
        updateUnit,
        onCreateCategory: createCategoryFromName,
        onCreateLine: createProductLineFromName,
        onCreateVariant: createProductVariantFromName,
        onAddAffiliateIncome: addAffiliateIncome,
        onUpdateAffiliateIncome: updateAffiliateIncome,
        onRemoveAffiliateIncome: removeAffiliateIncome,
        onSetIncludePendingAffiliateInProfit: setIncludePendingAffiliateInProfit,
        readOnly: !canEditSharedData
      }
    ), tab === "inventory" && /* @__PURE__ */ React.createElement(
      Inventory,
      {
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
        onCreateCategory: createCategoryFromName,
        onCreateLine: createProductLineFromName,
        onCreateVariant: createProductVariantFromName,
        readOnly: !canEditSharedData
      }
    ), tab === "catalog" && /* @__PURE__ */ React.createElement(
      Catalog,
      {
        productLines,
        units,
        onAddLine: addProductLine,
        onAddVariant: addProductVariant,
        onUpdateLine: updateProductLine,
        onUpdateVariant: updateProductVariant,
        readOnly: !canEditSharedData
      }
    ), tab === "storefront" && /* @__PURE__ */ React.createElement(Storefront, { inStock }))), toasts.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "app-toast-stack" }, toasts.map((toast) => /* @__PURE__ */ React.createElement(AppToast, { key: toast.id, toast }))));
  }
  function AppToast({ toast }) {
    return /* @__PURE__ */ React.createElement("div", { className: `app-toast ${toast.type}` }, /* @__PURE__ */ React.createElement("div", { className: "app-toast-icon" }, toast.type === "restore" ? "\u21BA" : toast.type === "warning" ? "!" : "\u2713"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "app-toast-title" }, toast.title), /* @__PURE__ */ React.createElement("div", { className: "app-toast-message" }, toast.message)));
  }
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(/* @__PURE__ */ React.createElement(App, null));
})();

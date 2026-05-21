(() => {
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
      return { ...unit, transactionCode };
    });
  }
  function buildUnitsWithCodes(rows, existingUnits, idPrefix) {
    const usedCodes = new Set(existingUnits.map((u) => u.transactionCode).filter(Boolean));
    const stamp = Date.now();
    return rows.map((unit, index) => {
      const transactionCode = nextTransactionCode(usedCodes, unit.arrived);
      usedCodes.add(transactionCode);
      return {
        ...unit,
        id: `${idPrefix}_${stamp}_${index}`,
        transactionCode
      };
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
    return (entries || []).map((entry) => ({
      ...entry,
      amount: Math.max(0, Math.round(+entry.amount || 0)),
      status: normalizeAffiliateStatus(entry.status)
    }));
  }
  function loadDashboardSettings() {
    try {
      const saved = localStorage.getItem("nexus_gear_dashboard_settings");
      const parsed = saved ? JSON.parse(saved) : {};
      return {
        includePendingAffiliateInProfit: Boolean(parsed?.includePendingAffiliateInProfit)
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
      if (existing.length) {
        return existing.map((line) => ({
          ...line,
          variants: (line.variants || []).map((variant) => ({ ...variant }))
        }));
      }
      return window.INITIAL_PRODUCT_LINES.map((line) => ({
        ...line,
        variants: (line.variants || []).map((variant) => ({ ...variant }))
      }));
    } catch (e) {
      console.error("Failed to load product lines from localStorage:", e);
      return window.INITIAL_PRODUCT_LINES;
    }
  }
  function loadCategories() {
    try {
      const initial = (window.INITIAL_CATEGORIES || window.CATEGORIES || []).map((category) => ({ ...category }));
      const saved = localStorage.getItem("nexus_gear_categories");
      const parsed = saved ? JSON.parse(saved) : [];
      const existing = Array.isArray(parsed) ? parsed : [];
      const validExisting = existing.filter((category) => category?.id && category?.name);
      return validExisting.length ? validExisting.map((category) => ({ ...category })) : initial;
    } catch (e) {
      console.error("Failed to load categories from localStorage:", e);
      return (window.INITIAL_CATEGORIES || window.CATEGORIES || []).map((category) => ({ ...category }));
    }
  }
  function loadUnits() {
    try {
      const saved = localStorage.getItem("nexus_gear_units");
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];
      }
      return ensureTransactionCodes(window.INITIAL_UNITS.map((unit) => ({ ...unit })));
    } catch (e) {
      console.error("Failed to load units from localStorage:", e);
      return ensureTransactionCodes(window.INITIAL_UNITS.map((unit) => ({ ...unit })));
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
      units: units.map((u) => ({ ...u })),
      productLines: productLines.map((line) => ({ ...line, variants: (line.variants || []).map((v) => ({ ...v })) })),
      categories: categories.map((category) => ({ ...category })),
      affiliateIncomes: normalizeAffiliateIncomes(affiliateIncomes).map((entry) => ({ ...entry })),
      dashboardSettings: {
        includePendingAffiliateInProfit: Boolean(dashboardSettings?.includePendingAffiliateInProfit)
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
  function capitalizeWordInitials(value) {
    return String(value || "").replace(/(^|\s)(\S)/gu, (match, space, firstChar) => `${space}${firstChar.toLocaleUpperCase("vi-VN")}`);
  }
  function normalizeUnitText(unit) {
    return {
      ...unit,
      name: capitalizeWordInitials(unit.name),
      variant: capitalizeWordInitials(unit.variant),
      note: capitalizeWordInitials(unit.note)
    };
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
  const UNIT_HISTORY_FIELDS = [
    { key: "productLineId", label: "D\xF2ng s\u1EA3n ph\u1EA9m" },
    { key: "variantId", label: "Ph\xE2n lo\u1EA1i" },
    { key: "name", label: "T\xEAn s\u1EA3n ph\u1EA9m" },
    { key: "cat", label: "Danh m\u1EE5c" },
    { key: "variant", label: "T\xEAn ph\xE2n lo\u1EA1i" },
    { key: "buy", label: "Gi\xE1 mua" },
    { key: "expectedSell", label: "Gi\xE1 b\xE1n d\u1EF1 ki\u1EBFn" },
    { key: "arrived", label: "Ng\xE0y nh\u1EADp" },
    { key: "status", label: "Tr\u1EA1ng th\xE1i" },
    { key: "sell", label: "Gi\xE1 b\xE1n th\u1EF1c t\u1EBF" },
    { key: "sold", label: "Ng\xE0y b\xE1n" },
    { key: "note", label: "Ghi ch\xFA" }
  ];
  function unitHistoryValue(value) {
    if (value === void 0 || value === null || value === "") return "\u2014";
    if (value === "in_stock") return "T\u1ED3n kho";
    if (value === "sold") return "\u0110\xE3 b\xE1n";
    return String(value);
  }
  function buildUnitHistoryEntries(before, after, action, changedAt = (/* @__PURE__ */ new Date()).toISOString()) {
    return UNIT_HISTORY_FIELDS.filter((field) => before?.[field.key] !== after?.[field.key]).map((field) => ({
      id: `hist_${Date.now()}_${field.key}_${Math.random().toString(36).slice(2, 7)}`,
      unitId: after.id,
      transactionCode: after.transactionCode,
      productName: after.name,
      action,
      field: field.key,
      fieldLabel: field.label,
      before: unitHistoryValue(before?.[field.key]),
      after: unitHistoryValue(after?.[field.key]),
      changedAt
    }));
  }
  function getOrCreateClientId() {
    try {
      const saved = localStorage.getItem("nexus_gear_client_id");
      if (saved) return saved;
      const generated = `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      localStorage.setItem("nexus_gear_client_id", generated);
      return generated;
    } catch {
      return `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
  }
  function makeClientName(clientId) {
    const shortId = clientId.slice(-4).toUpperCase();
    return `Thi\u1EBFt b\u1ECB ${shortId}`;
  }
  function buildSharedState(units, productLines, categories, affiliateIncomes, dashboardSettings, snapshots) {
    return {
      units: units.map((unit) => ({ ...unit })),
      productLines: productLines.map((line) => cloneProductLine(line)),
      categories: categories.map((category) => ({ ...category })),
      affiliateIncomes: normalizeAffiliateIncomes(affiliateIncomes).map((entry) => ({ ...entry })),
      dashboardSettings: {
        includePendingAffiliateInProfit: Boolean(dashboardSettings?.includePendingAffiliateInProfit)
      },
      snapshots: snapshots.map((snapshot) => ({
        ...snapshot,
        units: (snapshot.units || []).map((unit) => ({ ...unit })),
        productLines: (snapshot.productLines || []).map((line) => cloneProductLine(line)),
        categories: (snapshot.categories || []).map((category) => ({ ...category })),
        affiliateIncomes: normalizeAffiliateIncomes(snapshot.affiliateIncomes || []).map((entry) => ({ ...entry })),
        dashboardSettings: {
          includePendingAffiliateInProfit: Boolean(snapshot.dashboardSettings?.includePendingAffiliateInProfit)
        }
      }))
    };
  }
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  function cloneProductLine(line) {
    return {
      ...line,
      variants: (line.variants || []).map((variant) => ({ ...variant }))
    };
  }
  function upsertProductLine(lines, line) {
    const cleanLine = cloneProductLine(line);
    return lines.some((item) => item.id === cleanLine.id) ? lines.map((item) => item.id === cleanLine.id ? cleanLine : item) : [...lines, cleanLine];
  }
  function App() {
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
    const [unitChangeHistory, setUnitChangeHistory] = useStateA([]);
    const [showUnitHistory, setShowUnitHistory] = useStateA(false);
    const historyStartedAtRef = useRefA((/* @__PURE__ */ new Date()).toISOString());
    const clientIdRef = useRefA(getOrCreateClientId());
    const clientNameRef = useRefA(makeClientName(clientIdRef.current));
    const suppressRemoteSaveRef = useRefA(false);
    const saveTimerRef = useRefA(null);
    const serverVersionRef = useRefA(0);
    const localSaveReadyRef = useRefA({ units: false, categories: false, productLines: false, affiliateIncomes: false, dashboardSettings: false, snapshots: false });
    const userDataDirtyRef = useRefA(false);
    window.CATEGORIES = categories;
    const markUserDataChanged = () => {
      userDataDirtyRef.current = true;
    };
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
      const nextToast = { id, ...toast };
      setToasts((prev) => [...prev, nextToast].slice(-3));
      setTimeout(() => {
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, 5e3);
    };
    const applySharedPayload = (payload) => {
      if (!payload?.state) return;
      suppressRemoteSaveRef.current = true;
      setUnits((payload.state.units || []).map((unit) => ({ ...unit })));
      setProductLines((payload.state.productLines || []).map((line) => cloneProductLine(line)));
      setCategories(payload.state.categories?.length ? payload.state.categories : loadCategories());
      setAffiliateIncomes(normalizeAffiliateIncomes(payload.state.affiliateIncomes || []));
      setDashboardSettings({
        includePendingAffiliateInProfit: Boolean(payload.state.dashboardSettings?.includePendingAffiliateInProfit)
      });
      setSnapshots(payload.state.snapshots || []);
      serverVersionRef.current = payload.version || 0;
      setServerVersion(payload.version || 0);
    };
    const acquireEditLock = async ({ silent = false } = {}) => {
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
            owned ? { type: "success", title: "\u0110\xE3 nh\u1EADn quy\u1EC1n s\u1EEDa", message: "Phi\xEAn n\xE0y \u0111ang gi\u1EEF quy\u1EC1n ch\u1EC9nh s\u1EEDa d\u1EEF li\u1EC7u chung." } : { type: "warning", title: "Ch\u1EC9 xem", message: `${payload.lock?.ownerName || "Thi\u1EBFt b\u1ECB kh\xE1c"} \u0111ang ch\u1EC9nh s\u1EEDa d\u1EEF li\u1EC7u.` }
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
      if (!localSaveReadyRef.current.units) {
        localSaveReadyRef.current.units = true;
        return;
      }
      try {
        localStorage.setItem("nexus_gear_units", JSON.stringify(units));
      } catch (e) {
        console.error("Failed to save units to localStorage:", e);
      }
    }, [units]);
    useEffectA(() => {
      if (!localSaveReadyRef.current.categories) {
        localSaveReadyRef.current.categories = true;
        return;
      }
      try {
        localStorage.setItem("nexus_gear_categories", JSON.stringify(categories));
      } catch (e) {
        console.error("Failed to save categories to localStorage:", e);
      }
    }, [categories]);
    useEffectA(() => {
      if (!localSaveReadyRef.current.productLines) {
        localSaveReadyRef.current.productLines = true;
        return;
      }
      try {
        localStorage.setItem("nexus_gear_product_lines", JSON.stringify(productLines));
      } catch (e) {
        console.error("Failed to save product lines to localStorage:", e);
      }
    }, [productLines]);
    useEffectA(() => {
      if (!localSaveReadyRef.current.affiliateIncomes) {
        localSaveReadyRef.current.affiliateIncomes = true;
        return;
      }
      try {
        localStorage.setItem("nexus_gear_affiliate_incomes", JSON.stringify(affiliateIncomes));
      } catch (e) {
        console.error("Failed to save affiliate incomes to localStorage:", e);
      }
    }, [affiliateIncomes]);
    useEffectA(() => {
      if (!localSaveReadyRef.current.dashboardSettings) {
        localSaveReadyRef.current.dashboardSettings = true;
        return;
      }
      try {
        localStorage.setItem("nexus_gear_dashboard_settings", JSON.stringify(dashboardSettings));
      } catch (e) {
        console.error("Failed to save dashboard settings to localStorage:", e);
      }
    }, [dashboardSettings]);
    useEffectA(() => {
      if (!localSaveReadyRef.current.snapshots) {
        localSaveReadyRef.current.snapshots = true;
        return;
      }
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
      if (!userDataDirtyRef.current) return;
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
            userDataDirtyRef.current = false;
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
          setEditLock((prev) => ({ owned: prev.owned && payload.lock?.ownerId === clientIdRef.current, lock: payload.lock || null }));
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
        if (!editLock.owned || syncMode !== "shared") return;
        navigator.sendBeacon?.(
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
      if (canEditSharedData) {
        markUserDataChanged();
        return true;
      }
      pushToast({
        type: "warning",
        title: syncMode === "offline" ? "Ch\u01B0a c\xF3 m\xE1y ch\u1EE7 chung" : "Ch\u1EBF \u0111\u1ED9 ch\u1EC9 xem",
        message: syncMode === "offline" ? "H\xE3y m\u1EDF trang qua m\xE1y ch\u1EE7 \u0111\u1ED3ng b\u1ED9 \u0111\u1EC3 ch\u1EC9nh s\u1EEDa d\u1EEF li\u1EC7u chung." : `${editLock.lock?.ownerName || "Thi\u1EBFt b\u1ECB kh\xE1c"} \u0111ang gi\u1EEF quy\u1EC1n ch\u1EC9nh s\u1EEDa.`
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
      setUnits((prev) => prev.map((u) => {
        if (u.id !== id) return u;
        const next = { ...u, status: "sold", sell: +sell, sold: soldDate, note: capitalizeWordInitials(note ?? u.note) };
        appendUnitHistory(buildUnitHistoryEntries(u, next, "Ghi nh\u1EADn b\xE1n h\xE0ng"));
        return next;
      }));
    };
    const appendUnitHistory = (entries) => {
      if (!entries.length) return;
      setUnitChangeHistory((prev) => {
        const next = [...prev];
        entries.forEach((entry) => {
          const last = next[next.length - 1];
          const nearSameEdit = last && last.transactionCode === entry.transactionCode && last.field === entry.field && new Date(entry.changedAt) - new Date(last.changedAt) < 1500;
          if (nearSameEdit) {
            next[next.length - 1] = { ...entry, id: last.id, before: last.before };
          } else {
            next.push(entry);
          }
        });
        return next;
      });
    };
    const cancelSale = (id, action = "Hu\u1EF7 giao d\u1ECBch b\xE1n") => {
      if (!ensureCanEdit()) return;
      setUnits((prev) => prev.map((u) => {
        if (u.id !== id) return u;
        const next = { ...u, status: "in_stock", sell: void 0, sold: void 0 };
        appendUnitHistory(buildUnitHistoryEntries(u, next, action));
        return next;
      }));
    };
    const updateNote = (id, note, action = "S\u1EEDa ghi ch\xFA") => {
      if (!canEditSharedData) return;
      setUnits((prev) => prev.map((u) => {
        if (u.id !== id) return u;
        const next = { ...u, note: capitalizeWordInitials(note) };
        appendUnitHistory(buildUnitHistoryEntries(u, next, action));
        return next;
      }));
    };
    const updateUnit = (id, patch, action = "S\u1EEDa giao d\u1ECBch") => {
      if (!ensureCanEdit()) return;
      setUnits((prev) => prev.map((u) => {
        if (u.id !== id) return u;
        const next = {
          ...u,
          ...patch,
          note: patch.note === void 0 ? u.note : capitalizeWordInitials(patch.note),
          id: u.id,
          transactionCode: u.transactionCode
        };
        if (next.status === "in_stock") {
          delete next.sell;
          delete next.sold;
        }
        appendUnitHistory(buildUnitHistoryEntries(u, next, action));
        return next;
      }));
    };
    const addUnit = (u) => {
      if (!ensureCanEdit()) return;
      const quantity = Math.max(1, Math.floor(+u.quantity || 1));
      const { quantity: _quantity, ...base } = u;
      const rows = Array.from({ length: quantity }, () => normalizeUnitText({ ...base, status: "in_stock" }));
      setUnits((prev) => {
        const createdRows = buildUnitsWithCodes(rows, prev, "manual");
        appendUnitHistory(createdRows.flatMap((unit) => buildUnitHistoryEntries({}, unit, "Nh\u1EADp h\xE0ng m\u1EDBi")));
        return [...createdRows, ...prev];
      });
    };
    const importUnits = (rows, options = {}) => {
      if (!ensureCanEdit()) return;
      const catalogLines2 = window.mergeCatalogWithUnits(productLines, units);
      const normalizedRows = window.attachCatalogRefs(rows, catalogLines2).map((unit) => normalizeUnitText(unit));
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
        return {
          ...entry,
          amount: Math.max(0, Math.round(+patch.amount || 0)),
          receivedAt: patch.receivedAt || entry.receivedAt,
          status: normalizeAffiliateStatus(patch.status),
          note: String(patch.note || "").trim()
        };
      }));
    };
    const removeAffiliateIncome = (id) => {
      if (!ensureCanEdit()) return;
      setAffiliateIncomes((prev) => prev.filter((entry) => entry.id !== id));
    };
    const setIncludePendingAffiliateInProfit = (value) => {
      if (!ensureCanEdit()) return;
      setDashboardSettings((prev) => ({
        ...prev,
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
        message: name?.trim() ? `\u0110\xE3 l\u01B0u "${name.trim()}".` : "\u0110\xE3 l\u01B0u tr\u1EA1ng th\xE1i hi\u1EC7n t\u1EA1i."
      });
    };
    const restoreSnapshot = (id) => {
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
      setUnits((snapshot.units || []).map((unit) => ({ ...unit })));
      setCategories(snapshot.categories || categories);
      setProductLines((snapshot.productLines || productLines).map((line) => cloneProductLine(line)));
      setAffiliateIncomes(normalizeAffiliateIncomes(snapshot.affiliateIncomes || []));
      setDashboardSettings({
        includePendingAffiliateInProfit: Boolean(snapshot.dashboardSettings?.includePendingAffiliateInProfit)
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
        return prev.map((item) => item.id === line.id ? {
          ...item,
          variants: item.variants.some((v) => v.id === variant.id || v.name === variant.name) ? item.variants : [...item.variants, variant]
        } : item);
      });
    };
    const deleteProductLine = (line) => {
      if (!ensureCanEdit()) return;
      const hasTransactions = units.some(
        (unit) => unit.productLineId === line.id || unit.name === line.name && unit.cat === line.cat
      );
      if (hasTransactions) {
        pushToast({
          type: "warning",
          title: "Ch\u01B0a th\u1EC3 x\xF3a d\xF2ng s\u1EA3n ph\u1EA9m",
          message: "D\xF2ng n\xE0y \u0111\xE3 c\xF3 giao d\u1ECBch trong kho ho\u1EB7c l\u1ECBch s\u1EED b\xE1n."
        });
        return;
      }
      setProductLines((prev) => prev.filter((item) => item.id !== line.id));
    };
    const deleteProductVariant = (line, variant) => {
      if (!ensureCanEdit()) return;
      const hasTransactions = units.some((unit) => {
        const belongsToLine = unit.productLineId === line.id || unit.name === line.name && unit.cat === line.cat;
        const belongsToVariant = unit.variantId === variant.id || belongsToLine && (unit.variant || "M\u1EB7c \u0111\u1ECBnh") === variant.name;
        return belongsToLine && belongsToVariant;
      });
      if (hasTransactions) {
        pushToast({
          type: "warning",
          title: "Ch\u01B0a th\u1EC3 x\xF3a ph\xE2n lo\u1EA1i",
          message: "Ph\xE2n lo\u1EA1i n\xE0y \u0111\xE3 c\xF3 giao d\u1ECBch trong kho ho\u1EB7c l\u1ECBch s\u1EED b\xE1n."
        });
        return;
      }
      const updatedLine = {
        ...line,
        variants: (line.variants || []).filter((item) => item.id !== variant.id)
      };
      setProductLines((prev) => upsertProductLine(prev, updatedLine));
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
      if (!ensureCanEdit()) return null;
      const trimmedName = capitalizeWordInitials(String(name || "").trim());
      if (!trimmedName) return null;
      const safeCat = categories.some((category) => category.id === catId) ? catId : categories[0]?.id || "accessory";
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
      const trimmedName = capitalizeWordInitials(String(name || "").trim());
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
      const updatedLine = {
        ...line,
        ...patch,
        name: patch.name === void 0 ? line.name : capitalizeWordInitials(patch.name),
        id: line.id,
        variants: (line.variants || []).map((variant) => ({ ...variant }))
      };
      setProductLines((prev) => upsertProductLine(prev, updatedLine));
      setUnits((prev) => prev.map((unit) => {
        const belongsToLine = unit.productLineId === line.id || unit.name === line.name && unit.cat === line.cat;
        return belongsToLine ? {
          ...unit,
          productLineId: line.id,
          name: updatedLine.name,
          cat: updatedLine.cat
        } : unit;
      }));
    };
    const updateProductVariant = (line, variant, patch) => {
      if (!ensureCanEdit()) return;
      const updatedLine = {
        ...line,
        variants: (line.variants || []).map((item) => item.id === variant.id ? { ...item, ...patch, name: patch.name === void 0 ? item.name : capitalizeWordInitials(patch.name), id: item.id } : { ...item })
      };
      setProductLines((prev) => upsertProductLine(prev, updatedLine));
      setUnits((prev) => prev.map((unit) => {
        const belongsToLine = unit.productLineId === line.id || unit.name === line.name && unit.cat === line.cat;
        const belongsToVariant = unit.variantId === variant.id || belongsToLine && (unit.variant || "M\u1EB7c \u0111\u1ECBnh") === variant.name;
        return belongsToLine && belongsToVariant ? {
          ...unit,
          productLineId: line.id,
          variantId: variant.id,
          variant: patch.name === void 0 ? variant.name : capitalizeWordInitials(patch.name)
        } : unit;
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
    } }, "Session: ", remainingTime, "m")), /* @__PURE__ */ React.createElement("div", { style: { display: "flex", gap: 12, alignItems: "center" } }, /* @__PURE__ */ React.createElement("button", { className: "ctl ghost history-open-btn", onClick: () => setShowUnitHistory(true) }, "L\u1ECACH S\u1EEC S\u1EECA \u0110\u1ED4I"), /* @__PURE__ */ React.createElement(
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
    ))), !canEditSharedData ? /* @__PURE__ */ React.createElement("div", { className: "sync-banner viewer" }, "Ch\u1EBF \u0111\u1ED9 ch\u1EC9 xem \xB7 ", editLock.lock?.ownerName || "Thi\u1EBFt b\u1ECB kh\xE1c", " \u0111ang gi\u1EEF quy\u1EC1n ch\u1EC9nh s\u1EEDa. D\u1EEF li\u1EC7u v\u1EABn t\u1EF1 \u0111\u1ED3ng b\u1ED9 t\u1EEB m\xE1y ch\u1EE7 chung.") : /* @__PURE__ */ React.createElement("div", { className: "sync-banner editor" }, "Phi\xEAn n\xE0y \u0111ang gi\u1EEF quy\u1EC1n ch\u1EC9nh s\u1EEDa \u0111\u1ED9c quy\u1EC1n. C\xE1c thi\u1EBFt b\u1ECB kh\xE1c ch\u1EC9 xem v\xE0 t\u1EF1 nh\u1EADn d\u1EEF li\u1EC7u m\u1EDBi."), /* @__PURE__ */ React.createElement("main", { "data-screen-label": tab === "dashboard" ? "01 Dashboard" : tab === "inventory" ? "02 Inventory" : tab === "catalog" ? "03 Catalog" : "04 Storefront" }, !canAccess(tab) ? /* @__PURE__ */ React.createElement("div", { style: { padding: "60px 28px", textAlign: "center", color: "var(--muted)" } }, /* @__PURE__ */ React.createElement("div", { style: { fontSize: 16, marginBottom: 16 } }, "\u274C B\u1EA1n kh\xF4ng c\xF3 quy\u1EC1n truy c\u1EADp trang n\xE0y"), /* @__PURE__ */ React.createElement("div", { style: { fontSize: 13, marginBottom: 24 } }, "Ch\u1EC9 qu\u1EA3n tr\u1ECB vi\xEAn (admin) m\u1EDBi c\xF3 th\u1EC3 xem trang n\xE0y."), /* @__PURE__ */ React.createElement("button", { className: "ctl primary", onClick: () => setTab("storefront") }, "\u2190 Quay v\u1EC1 C\u1EEDa h\xE0ng")) : /* @__PURE__ */ React.createElement(React.Fragment, null, tab === "dashboard" && /* @__PURE__ */ React.createElement(
      Dashboard,
      {
        units,
        sold,
        affiliateIncomes,
        includePendingAffiliateInProfit: dashboardSettings.includePendingAffiliateInProfit,
        catalogLines,
        today,
        importUnits,
        cancelSale: (id) => cancelSale(id, "Hu\u1EF7 giao d\u1ECBch \u1EDF b\u1EA3ng b\xE1n"),
        updateNote: (id, note) => updateNote(id, note, "S\u1EEDa ghi ch\xFA \u1EDF b\u1EA3ng b\xE1n"),
        updateUnit: (id, patch) => updateUnit(id, patch, "S\u1EEDa giao d\u1ECBch \u1EDF b\u1EA3ng b\xE1n"),
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
        updateNote: (id, note) => updateNote(id, note, "S\u1EEDa ghi ch\xFA \u1EDF kho"),
        updateUnit: (id, patch) => updateUnit(id, patch, "S\u1EEDa giao d\u1ECBch \u1EDF kho"),
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
        onDeleteLine: deleteProductLine,
        onDeleteVariant: deleteProductVariant,
        readOnly: !canEditSharedData
      }
    ), tab === "storefront" && /* @__PURE__ */ React.createElement(Storefront, { inStock }))), showUnitHistory && /* @__PURE__ */ React.createElement(
      UnitChangeHistoryModal,
      {
        entries: unitChangeHistory,
        startedAt: historyStartedAtRef.current,
        onClose: () => setShowUnitHistory(false)
      }
    ), toasts.length > 0 && /* @__PURE__ */ React.createElement("div", { className: "app-toast-stack" }, toasts.map((toast) => /* @__PURE__ */ React.createElement(AppToast, { key: toast.id, toast }))));
  }
  function UnitChangeHistoryModal({ entries, startedAt, onClose }) {
    const [search, setSearch] = useStateA("");
    const [actionFilter, setActionFilter] = useStateA("all");
    const [fieldFilter, setFieldFilter] = useStateA("all");
    const actions = [...new Set(entries.map((entry) => entry.action).filter(Boolean))];
    const fields = [...new Set(entries.map((entry) => entry.fieldLabel).filter(Boolean))];
    const query = search.trim().toLowerCase();
    const filteredEntries = entries.filter((entry) => {
      const matchesSearch = !query || [entry.transactionCode, entry.productName, entry.action, entry.fieldLabel, entry.before, entry.after].some((value) => String(value || "").toLowerCase().includes(query));
      const matchesAction = actionFilter === "all" || entry.action === actionFilter;
      const matchesField = fieldFilter === "all" || entry.fieldLabel === fieldFilter;
      return matchesSearch && matchesAction && matchesField;
    });
    return /* @__PURE__ */ React.createElement("div", { className: "modal-bg history-modal-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal history-modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "L\u1ECACH S\u1EEC S\u1EECA \u0110\u1ED4I PHI\xCAN HI\u1EC6N T\u1EA0I"), /* @__PURE__ */ React.createElement("div", { className: "card-sub" }, "Theo d\xF5i t\u1EEB l\xFAc t\u1EA3i d\u1EEF li\u1EC7u ", " ", startedAt ? new Date(startedAt).toLocaleString("vi-VN") : "")), /* @__PURE__ */ React.createElement("button", { className: "close-x", onClick: onClose }, "\xD7")), /* @__PURE__ */ React.createElement("div", { className: "history-filterbar" }, /* @__PURE__ */ React.createElement("input", { value: search, onChange: (e) => setSearch(e.target.value), placeholder: "T\xECm m\xE3 GD, s\u1EA3n ph\u1EA9m, gi\xE1 tr\u1ECB..." }), /* @__PURE__ */ React.createElement("select", { value: actionFilter, onChange: (e) => setActionFilter(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "T\u1EA5t c\u1EA3 h\xE0nh \u0111\u1ED9ng"), actions.map((action) => /* @__PURE__ */ React.createElement("option", { key: action, value: action }, action))), /* @__PURE__ */ React.createElement("select", { value: fieldFilter, onChange: (e) => setFieldFilter(e.target.value) }, /* @__PURE__ */ React.createElement("option", { value: "all" }, "T\u1EA5t c\u1EA3 tr\u01B0\u1EDDng"), fields.map((field) => /* @__PURE__ */ React.createElement("option", { key: field, value: field }, field))), /* @__PURE__ */ React.createElement("span", { className: "history-count mono" }, filteredEntries.length, "/", entries.length)), /* @__PURE__ */ React.createElement("div", { className: "modal-body history-modal-body" }, /* @__PURE__ */ React.createElement("div", { className: "tbl-wrap history-modal-table-wrap" }, /* @__PURE__ */ React.createElement("table", { className: "tbl change-history-table" }, /* @__PURE__ */ React.createElement("thead", null, /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("th", null, "Th\u1EDDi \u0111i\u1EC3m"), /* @__PURE__ */ React.createElement("th", null, "H\xE0nh \u0111\u1ED9ng"), /* @__PURE__ */ React.createElement("th", null, "M\xE3 GD"), /* @__PURE__ */ React.createElement("th", null, "S\u1EA3n ph\u1EA9m"), /* @__PURE__ */ React.createElement("th", null, "Tr\u01B0\u1EDDng thay \u0111\u1ED5i"), /* @__PURE__ */ React.createElement("th", null, "Gi\xE1 tr\u1ECB c\u0169"), /* @__PURE__ */ React.createElement("th", null, "Gi\xE1 tr\u1ECB m\u1EDBi"))), /* @__PURE__ */ React.createElement("tbody", null, filteredEntries.slice().sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt)).map((entry) => /* @__PURE__ */ React.createElement("tr", { key: entry.id }, /* @__PURE__ */ React.createElement("td", { className: "mono", style: { fontSize: 12 } }, new Date(entry.changedAt).toLocaleString("vi-VN")), /* @__PURE__ */ React.createElement("td", null, /* @__PURE__ */ React.createElement("span", { className: "history-action" }, entry.action)), /* @__PURE__ */ React.createElement("td", { className: "mono txn-code" }, entry.transactionCode), /* @__PURE__ */ React.createElement("td", null, entry.productName), /* @__PURE__ */ React.createElement("td", null, entry.fieldLabel), /* @__PURE__ */ React.createElement("td", { className: "history-before" }, entry.before), /* @__PURE__ */ React.createElement("td", { className: "history-after" }, entry.after))), filteredEntries.length === 0 && /* @__PURE__ */ React.createElement("tr", null, /* @__PURE__ */ React.createElement("td", { colSpan: "7", className: "empty" }, "Kh\xF4ng c\xF3 l\u1ECBch s\u1EED ph\xF9 h\u1EE3p v\u1EDBi b\u1ED9 l\u1ECDc hi\u1EC7n t\u1EA1i."))))))));
  }
  function AppToast({ toast }) {
    return /* @__PURE__ */ React.createElement("div", { className: `app-toast ${toast.type}` }, /* @__PURE__ */ React.createElement("div", { className: "app-toast-icon" }, toast.type === "restore" ? "\u21BA" : toast.type === "warning" ? "!" : "\u2713"), /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "app-toast-title" }, toast.title), /* @__PURE__ */ React.createElement("div", { className: "app-toast-message" }, toast.message)));
  }
  const root = ReactDOM.createRoot(document.getElementById("root"));
  root.render(/* @__PURE__ */ React.createElement(App, null));
})();

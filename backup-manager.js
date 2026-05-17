(() => {
  const { useState: useStateBM } = React;
  function summarizeUnits(units) {
    const inStock = units.filter((u) => u.status === "in_stock");
    const sold = units.filter((u) => u.status === "sold");
    return {
      total: units.length,
      inStock: inStock.length,
      sold: sold.length,
      stockValue: inStock.reduce((sum, u) => sum + (+u.buy || 0), 0),
      revenue: sold.reduce((sum, u) => sum + (+u.sell || 0), 0)
    };
  }
  function formatBackupTime(value) {
    return new Date(value).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  function BackupManagerButton({ backups, units, readOnly = false, onSave, onRestore, onDelete }) {
    const [open, setOpen] = useStateBM(false);
    return /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement("button", { className: "ctl", onClick: () => setOpen(true) }, /* @__PURE__ */ React.createElement("span", { style: { fontSize: 14, lineHeight: 1 } }, "\u25A3"), " SAO L\u01AFU"), open && /* @__PURE__ */ React.createElement(
      BackupManagerModal,
      {
        backups,
        units,
        readOnly,
        onClose: () => setOpen(false),
        onSave,
        onRestore,
        onDelete
      }
    ));
  }
  function BackupManagerModal({ backups, units, readOnly = false, onClose, onSave, onRestore, onDelete }) {
    const [name, setName] = useStateBM("");
    const [selectedIds, setSelectedIds] = useStateBM([]);
    const current = summarizeUnits(units);
    const save = () => {
      onSave(name.trim());
      setName("");
    };
    const allSelected = backups.length > 0 && selectedIds.length === backups.length;
    const toggleOne = (id) => {
      setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    };
    const toggleAll = () => {
      setSelectedIds(allSelected ? [] : backups.map((s) => s.id));
    };
    const deleteSelected = () => {
      if (!selectedIds.length) return;
      if (confirm(`Xo\xE1 ${selectedIds.length} b\u1EA3n l\u01B0u \u0111\xE3 ch\u1ECDn?`)) {
        onDelete(selectedIds);
        setSelectedIds([]);
      }
    };
    return /* @__PURE__ */ React.createElement("div", { className: "modal-bg", onClick: onClose }, /* @__PURE__ */ React.createElement("div", { className: "modal backup-modal", onClick: (e) => e.stopPropagation() }, /* @__PURE__ */ React.createElement("div", { className: "modal-head" }, /* @__PURE__ */ React.createElement("div", { className: "modal-title" }, /* @__PURE__ */ React.createElement("span", { className: "accent" }), "SAO L\u01AFU D\u1EEE LI\u1EC6U"), /* @__PURE__ */ React.createElement("button", { className: "close-x", onClick: onClose }, "\xD7")), /* @__PURE__ */ React.createElement("div", { className: "modal-body backup-body" }, /* @__PURE__ */ React.createElement("div", { className: "backup-current" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "backup-current-title" }, "Tr\u1EA1ng th\xE1i hi\u1EC7n t\u1EA1i"), /* @__PURE__ */ React.createElement("div", { className: "backup-current-sub" }, "L\u01B0u m\u1ED9t m\u1ED1c \u0111\u1EC3 sau n\xE0y m\u1EDF l\u1EA1i \u0111\xFAng d\u1EEF li\u1EC7u c\u1EE7a th\u1EDDi \u0111i\u1EC3m n\xE0y.")), /* @__PURE__ */ React.createElement("div", { className: "backup-metrics" }, /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, current.inStock), " t\u1ED3n kho"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, current.sold), " \u0111\xE3 b\xE1n"), /* @__PURE__ */ React.createElement("span", null, /* @__PURE__ */ React.createElement("strong", null, window.fmtK(current.stockValue), "\u0111"), " v\u1ED1n t\u1ED3n"))), /* @__PURE__ */ React.createElement("div", { className: "backup-save-row" }, /* @__PURE__ */ React.createElement("div", { className: "field", style: { marginBottom: 0, flex: 1 } }, /* @__PURE__ */ React.createElement("label", null, "T\xEAn b\u1EA3n l\u01B0u"), /* @__PURE__ */ React.createElement(
      "input",
      {
        type: "text",
        value: name,
        onChange: (e) => setName(e.target.value),
        placeholder: "vd. Tr\u01B0\u1EDBc khi nh\u1EADp l\xF4 th\xE1ng 5"
      }
    )), /* @__PURE__ */ React.createElement("button", { className: "ctl primary", onClick: save, disabled: readOnly }, "L\u01AFU TR\u1EA0NG TH\xC1I HI\u1EC6N T\u1EA0I")), /* @__PURE__ */ React.createElement("div", { className: "backup-note" }, "Khi m\u1EDF l\u1EA1i m\u1ED9t b\u1EA3n c\u0169, h\u1EC7 th\u1ED1ng s\u1EBD t\u1EF1 l\u01B0u tr\u1EA1ng th\xE1i hi\u1EC7n t\u1EA1i tr\u01B0\u1EDBc \u0111\u1EC3 b\u1EA1n lu\xF4n c\xF2n \u0111\u01B0\u1EDDng quay v\u1EC1."), /* @__PURE__ */ React.createElement("div", { className: "backup-history-head" }, /* @__PURE__ */ React.createElement("div", null, /* @__PURE__ */ React.createElement("div", { className: "card-title" }, "L\u1ECBch s\u1EED b\u1EA3n l\u01B0u"), /* @__PURE__ */ React.createElement("div", { className: "card-sub" }, backups.length, " b\u1EA3n ghi \xB7 ", selectedIds.length, " \u0111ang ch\u1ECDn")), /* @__PURE__ */ React.createElement("div", { className: "row-actions" }, /* @__PURE__ */ React.createElement("label", { className: "backup-select-all" }, /* @__PURE__ */ React.createElement("input", { type: "checkbox", checked: allSelected, onChange: toggleAll }), "Ch\u1ECDn t\u1EA5t c\u1EA3"), /* @__PURE__ */ React.createElement("button", { className: "ctl ghost sm", onClick: deleteSelected, disabled: readOnly || !selectedIds.length }, "XO\xC1 \u0110\xC3 CH\u1ECCN"))), /* @__PURE__ */ React.createElement("div", { className: "backup-list" }, backups.map((snapshot) => {
      const summary = snapshot.summary || summarizeUnits(snapshot.units || []);
      return /* @__PURE__ */ React.createElement("div", { key: snapshot.id, className: `backup-item ${snapshot.kind === "auto" ? "auto" : ""}` }, /* @__PURE__ */ React.createElement("label", { className: "backup-check" }, /* @__PURE__ */ React.createElement(
        "input",
        {
          type: "checkbox",
          checked: selectedIds.includes(snapshot.id),
          onChange: () => toggleOne(snapshot.id)
        }
      )), /* @__PURE__ */ React.createElement("div", { className: "backup-item-main" }, /* @__PURE__ */ React.createElement("div", { className: "backup-item-name" }, snapshot.name, snapshot.kind === "auto" && /* @__PURE__ */ React.createElement("span", { className: "backup-tag" }, "t\u1EF1 \u0111\u1ED9ng")), /* @__PURE__ */ React.createElement("div", { className: "backup-item-meta" }, formatBackupTime(snapshot.createdAt), " \xB7 ", summary.inStock, " t\u1ED3n kho \xB7 ", summary.sold, " \u0111\xE3 b\xE1n \xB7 v\u1ED1n t\u1ED3n ", window.fmtK(summary.stockValue), "\u0111")), /* @__PURE__ */ React.createElement("div", { className: "row-actions" }, /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "ctl primary sm",
          disabled: readOnly,
          onClick: () => {
            if (confirm(`M\u1EDF l\u1EA1i b\u1EA3n "${snapshot.name}"? Tr\u1EA1ng th\xE1i hi\u1EC7n t\u1EA1i s\u1EBD \u0111\u01B0\u1EE3c t\u1EF1 \u0111\u1ED9ng sao l\u01B0u tr\u01B0\u1EDBc.`)) {
              onRestore(snapshot.id);
            }
          }
        },
        "M\u1EDE L\u1EA0I"
      ), /* @__PURE__ */ React.createElement(
        "button",
        {
          className: "ctl ghost sm",
          disabled: readOnly,
          onClick: () => {
            if (confirm(`Xo\xE1 b\u1EA3n l\u01B0u "${snapshot.name}"?`)) {
              onDelete([snapshot.id]);
              setSelectedIds((prev) => prev.filter((id) => id !== snapshot.id));
            }
          }
        },
        "XO\xC1"
      )));
    }), backups.length === 0 && /* @__PURE__ */ React.createElement("div", { className: "empty backup-empty" }, "Ch\u01B0a c\xF3 b\u1EA3n l\u01B0u n\xE0o. H\xE3y l\u01B0u tr\u1EA1ng th\xE1i hi\u1EC7n t\u1EA1i \u0111\u1EC3 b\u1EAFt \u0111\u1EA7u d\xF2ng th\u1EDDi gian d\u1EEF li\u1EC7u."))), /* @__PURE__ */ React.createElement("div", { className: "modal-foot" }, /* @__PURE__ */ React.createElement("button", { className: "ctl ghost", onClick: onClose }, "\u0110\xD3NG"))));
  }
  window.BackupManagerButton = BackupManagerButton;
  window.summarizeUnits = summarizeUnits;
})();

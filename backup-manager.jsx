// Snapshot manager — save and reopen historical database states from localStorage.

const { useState: useStateBM } = React;

function summarizeUnits(units) {
  const inStock = units.filter(u => u.status === 'in_stock');
  const sold = units.filter(u => u.status === 'sold');
  return {
    total: units.length,
    inStock: inStock.length,
    sold: sold.length,
    stockValue: inStock.reduce((sum, u) => sum + (+u.buy || 0), 0),
    revenue: sold.reduce((sum, u) => sum + (+u.sell || 0), 0),
  };
}

function formatBackupTime(value) {
  return new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function BackupManagerButton({ backups, units, readOnly = false, onSave, onRestore, onDelete }) {
  const [open, setOpen] = useStateBM(false);
  return (
    <>
      <button className="ctl" onClick={() => setOpen(true)}>
        <span style={{ fontSize: 14, lineHeight: 1 }}>▣</span> SAO LƯU
      </button>
      {open && (
        <BackupManagerModal
          backups={backups}
          units={units}
          readOnly={readOnly}
          onClose={() => setOpen(false)}
          onSave={onSave}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      )}
    </>
  );
}

function BackupManagerModal({ backups, units, readOnly = false, onClose, onSave, onRestore, onDelete }) {
  const [name, setName] = useStateBM('');
  const [selectedIds, setSelectedIds] = useStateBM([]);
  const current = summarizeUnits(units);

  const save = () => {
    onSave(name.trim());
    setName('');
  };
  const allSelected = backups.length > 0 && selectedIds.length === backups.length;
  const toggleOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleAll = () => {
    setSelectedIds(allSelected ? [] : backups.map(s => s.id));
  };
  const deleteSelected = () => {
    if (!selectedIds.length) return;
    if (confirm(`Xoá ${selectedIds.length} bản lưu đã chọn?`)) {
      onDelete(selectedIds);
      setSelectedIds([]);
    }
  };

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal backup-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title"><span className="accent"></span>SAO LƯU DỮ LIỆU</div>
          <button className="close-x" onClick={onClose}>×</button>
        </div>
        <div className="modal-body backup-body">
          <div className="backup-current">
            <div>
              <div className="backup-current-title">Trạng thái hiện tại</div>
              <div className="backup-current-sub">
                Lưu một mốc để sau này mở lại đúng dữ liệu của thời điểm này.
              </div>
            </div>
            <div className="backup-metrics">
              <span><strong>{current.inStock}</strong> tồn kho</span>
              <span><strong>{current.sold}</strong> đã bán</span>
              <span><strong>{window.fmtK(current.stockValue)}đ</strong> vốn tồn</span>
            </div>
          </div>

          <div className="backup-save-row">
            <div className="field" style={{ marginBottom: 0, flex: 1 }}>
              <label>Tên bản lưu</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="vd. Trước khi nhập lô tháng 5"
              />
            </div>
            <button className="ctl primary" onClick={save} disabled={readOnly}>
              LƯU TRẠNG THÁI HIỆN TẠI
            </button>
          </div>

          <div className="backup-note">
            Khi mở lại một bản cũ, hệ thống sẽ tự lưu trạng thái hiện tại trước để bạn luôn còn đường quay về.
          </div>

          <div className="backup-history-head">
            <div>
              <div className="card-title">Lịch sử bản lưu</div>
              <div className="card-sub">{backups.length} bản ghi · {selectedIds.length} đang chọn</div>
            </div>
            <div className="row-actions">
              <label className="backup-select-all">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} />
                Chọn tất cả
              </label>
              <button className="ctl ghost sm" onClick={deleteSelected} disabled={readOnly || !selectedIds.length}>
                XOÁ ĐÃ CHỌN
              </button>
            </div>
          </div>

          <div className="backup-list">
            {backups.map(snapshot => {
              const summary = snapshot.summary || summarizeUnits(snapshot.units || []);
              return (
                <div key={snapshot.id} className={`backup-item ${snapshot.kind === 'auto' ? 'auto' : ''}`}>
                  <label className="backup-check">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(snapshot.id)}
                      onChange={() => toggleOne(snapshot.id)}
                    />
                  </label>
                  <div className="backup-item-main">
                    <div className="backup-item-name">
                      {snapshot.name}
                      {snapshot.kind === 'auto' && <span className="backup-tag">tự động</span>}
                    </div>
                    <div className="backup-item-meta">
                      {formatBackupTime(snapshot.createdAt)} · {summary.inStock} tồn kho · {summary.sold} đã bán · vốn tồn {window.fmtK(summary.stockValue)}đ
                    </div>
                  </div>
                  <div className="row-actions">
                    <button
                      className="ctl primary sm"
                      disabled={readOnly}
                      onClick={() => {
                        if (confirm(`Mở lại bản "${snapshot.name}"? Trạng thái hiện tại sẽ được tự động sao lưu trước.`)) {
                          onRestore(snapshot.id);
                        }
                      }}
                    >
                      MỞ LẠI
                    </button>
                    <button
                      className="ctl ghost sm"
                      disabled={readOnly}
                      onClick={() => {
                        if (confirm(`Xoá bản lưu "${snapshot.name}"?`)) {
                          onDelete([snapshot.id]);
                          setSelectedIds(prev => prev.filter(id => id !== snapshot.id));
                        }
                      }}
                    >
                      XOÁ
                    </button>
                  </div>
                </div>
              );
            })}
            {backups.length === 0 && (
              <div className="empty backup-empty">
                Chưa có bản lưu nào. Hãy lưu trạng thái hiện tại để bắt đầu dòng thời gian dữ liệu.
              </div>
            )}
          </div>
        </div>
        <div className="modal-foot">
          <button className="ctl ghost" onClick={onClose}>ĐÓNG</button>
        </div>
      </div>
    </div>
  );
}

window.BackupManagerButton = BackupManagerButton;
window.summarizeUnits = summarizeUnits;

import { useEffect, useState, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Dialog } from "primereact/dialog";
import { Badge } from "primereact/badge";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { HeartHandshake, CheckCircle2, Plus, Baby, Flag, Trash2 } from "lucide-react";
import api from "../../apis/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import {
  RecordServiceDialog,
  ConfirmPregnancyDialog,
  ClosePregnancyDialog,
  RecordBirthDialog,
  AddKidDialog,
  RegisterKidDialog,
} from "./BreedingDialogs";

const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
  * { font-family: 'Inter', sans-serif; }
  .font-display { font-family: 'Fraunces', serif; }
  .p-datatable { background: var(--bg-card) !important; border: 1px solid var(--border) !important; border-radius: 0.75rem; overflow: hidden; }
  .p-datatable .p-datatable-thead > tr > th {
    background: var(--bg-muted) !important; color: var(--text-muted) !important;
    font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.03em;
    border-color: var(--border) !important; padding: 0.75rem 1rem;
  }
  .p-datatable .p-datatable-tbody > tr > td {
    background: var(--bg-card) !important; border-color: var(--border) !important;
    padding: 0.75rem 1rem; font-size: 0.88rem; color: var(--text) !important;
  }
  .p-datatable .p-datatable-tbody > tr:hover > td { background: var(--bg-muted) !important; }
  .p-paginator { background: transparent !important; border: none !important; color: var(--text-muted) !important; }
  .p-paginator .p-highlight { background: var(--primary) !important; border-color: var(--primary) !important; color: #fff !important; }
  /* Global datepicker (renders to document.body) — match the app theme */
  .p-datepicker, .p-datepicker.p-datepicker-inline {
    background: var(--bg-card) !important; color: var(--text) !important;
    border: 1px solid var(--border) !important; border-radius: 0.6rem;
  }
  .p-datepicker .p-datepicker-header { background: var(--bg-card) !important; color: var(--text-heading) !important; border-bottom: 1px solid var(--border) !important; }
  .p-datepicker .p-datepicker-header .p-datepicker-title { color: var(--text-heading) !important; }
  .p-datepicker .p-datepicker-header .p-datepicker-prev, .p-datepicker .p-datepicker-header .p-datepicker-next { color: var(--text) !important; }
  .p-datepicker table th, .p-datepicker table td span {
    color: var(--text) !important;
  }
  .p-datepicker table td > span.p-highlight { background: var(--primary) !important; color: #fff !important; }
  .p-datepicker table td > span:not(.p-disabled):hover { background: var(--bg-muted) !important; color: var(--text) !important; }
  .p-datepicker .p-datepicker-buttonbar { border-top: 1px solid var(--border) !important; }
  .p-datepicker .p-timepicker { border-top: 1px solid var(--border) !important; }
`;

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

const outcomeLabel = (o) =>
  ({
    LIVE_BIRTH: "Live birth",
    STILLBIRTH: "Stillbirth",
    ABORTED: "Aborted",
    NOT_PREGNANT: "Not pregnant",
  }[o] || o || "—");

function BreedingPage() {
  const { user } = useAuth();
  const showToast = useToast();
  const canManage = ["owner", "manager"].includes(user?.role);

  const [animals, setAnimals] = useState([]);
  const [genders, setGenders] = useState([]);
  const [pregnancies, setPregnancies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [upcoming, setUpcoming] = useState([]);
  const [successRate, setSuccessRate] = useState(null);
  const [birthOutcomes, setBirthOutcomes] = useState(null);
  const [maturityAlerts, setMaturityAlerts] = useState([]);

  // Dialog state
  const [serviceOpen, setServiceOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [closeTarget, setCloseTarget] = useState(null);
  const [birthTarget, setBirthTarget] = useState(null);
  const [kidTarget, setKidTarget] = useState(null);
  const [birthDetail, setBirthDetail] = useState(null);
  const [kidToRegister, setKidToRegister] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadReports = useCallback(async () => {
    // Fetch each report independently so one failure never blocks the others.
    const tasks = [
      { key: "upcoming", url: "/breeding/api/reports/breeding/upcoming-deliveries", set: setUpcoming, def: [] },
      { key: "success", url: "/breeding/api/reports/breeding/success-rate", set: setSuccessRate, def: null },
      { key: "birth", url: "/breeding/api/reports/breeding/birth-outcomes", set: setBirthOutcomes, def: null },
      { key: "maturity", url: "/breeding/api/reports/breeding/maturity-alerts", set: setMaturityAlerts, def: [] },
    ];

    await Promise.all(
      tasks.map(async (t) => {
        try {
          const res = await api.get(t.url);
          t.set(res.data.data ?? t.def);
        } catch (err) {
          console.error(`Failed to load ${t.key}:`, err);
          // keep the card showing its previous value instead of blocking others
        }
      })
    );
  }, []);

  const loadPregnancies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/breeding/api/pregnancies");
      setPregnancies(res.data.data || []);
    } catch (err) {
      showToast({ severity: "error", summary: "Failed to load", detail: err.response?.data?.message || "Could not load pregnancies" });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const refreshAll = useCallback(async () => {
    // Reload the table and all four report cards together after a mutation.
    await Promise.all([loadPregnancies(), loadReports()]);
  }, [loadPregnancies, loadReports]);

  const loadReferences = useCallback(async () => {
    try {
      const [a, g] = await Promise.all([
        api.get("/animal/api/animals"),
        api.get("/animal/api/genders"),
      ]);
      setAnimals(a.data.data || []);
      setGenders(g.data.data || []);
    } catch (err) {
      showToast({ severity: "error", summary: "Failed to load", detail: err.response?.data?.message || "Could not load reference data" });
    }
  }, [showToast]);

  useEffect(() => {
    loadPregnancies();
    loadReports();
    if (canManage) loadReferences();
  }, [loadPregnancies, loadReports, loadReferences, canManage]);

const handleCreateService = async (payload) => {
    setSaving(true);
    try {
      await api.post("/breeding/api/pregnancies", payload);
      showToast({ severity: "success", summary: "Saved", detail: "Service recorded." });
      setServiceOpen(false);
      await refreshAll();
    } catch (err) {
      showToast({ severity: "error", summary: "Save failed", detail: err.response?.data?.message || "Could not record service" });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async (payload) => {
    setSaving(true);
    try {
      await api.put(`/breeding/api/pregnancies/${confirmTarget.id}/confirm`, payload);
      showToast({ severity: "success", summary: "Confirmed", detail: "Pregnancy confirmed." });
      setConfirmTarget(null);
      await refreshAll();
    } catch (err) {
      showToast({ severity: "error", summary: "Save failed", detail: err.response?.data?.message || "Could not confirm pregnancy" });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (payload) => {
    setSaving(true);
    try {
      await api.put(`/breeding/api/pregnancies/${closeTarget.id}/close`, payload);
      showToast({ severity: "success", summary: "Closed", detail: "Pregnancy closed." });
      setCloseTarget(null);
      await refreshAll();
    } catch (err) {
      showToast({ severity: "error", summary: "Save failed", detail: err.response?.data?.message || "Could not close pregnancy" });
    } finally {
      setSaving(false);
    }
  };

  const handleBirth = async (payload) => {
    setSaving(true);
    try {
      await api.post("/breeding/api/births", { pregnancy_id: birthTarget.id, ...payload });
      showToast({ severity: "success", summary: "Saved", detail: "Birth recorded." });
      setBirthTarget(null);
      await refreshAll();
    } catch (err) {
      showToast({ severity: "error", summary: "Save failed", detail: err.response?.data?.message || "Could not record birth" });
    } finally {
      setSaving(false);
    }
  };

  const openKids = async (row) => {
    if (!row.birth) {
      showToast({ severity: "warn", summary: "No birth yet", detail: "Record a birth for this pregnancy first." });
      return;
    }
    try {
      const res = await api.get(`/breeding/api/births/${row.birth.id}`);
      setBirthDetail(res.data.data);
    } catch (err) {
      showToast({ severity: "error", summary: "Failed to load", detail: err.response?.data?.message || "Could not load birth details" });
    }
  };

  const handleAddKid = async (payload) => {
    setSaving(true);
    try {
      await api.post(`/breeding/api/births/${kidTarget.id}/kids`, payload);
      showToast({ severity: "success", summary: "Added", detail: "Offspring registered." });
      setKidTarget(null);
      if (birthDetail) {
        const res = await api.get(`/breeding/api/births/${birthDetail.id}`);
        setBirthDetail(res.data.data);
      }
      await refreshAll();
    } catch (err) {
      showToast({ severity: "error", summary: "Save failed", detail: err.response?.data?.message || "Could not add offspring" });
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterKid = async (payload) => {
    setSaving(true);
    try {
      await api.post(`/breeding/api/birth-kids/${kidToRegister.id}/register-animal`, payload);
      showToast({ severity: "success", summary: "Registered", detail: "Offspring registered as a new animal." });
      setKidToRegister(null);
      if (birthDetail) {
        const res = await api.get(`/breeding/api/births/${birthDetail.id}`);
        setBirthDetail(res.data.data);
      }
      await refreshAll();
    } catch (err) {
      showToast({ severity: "error", summary: "Save failed", detail: err.response?.data?.message || "Could not register animal" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDeletePregnancy = (row) => {
    confirmDialog({
      message: `Delete the service record for "${row.dam?.tag_number}"? This can't be undone.`,
      header: "Confirm deletion",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "!bg-[var(--danger)] !border-[var(--danger)]",
      accept: async () => {
        try {
          await api.delete(`/breeding/api/pregnancies/${row.id}`);
          showToast({ severity: "success", summary: "Deleted", detail: "Service record removed." });
          await refreshAll();
        } catch (err) {
          showToast({
            severity: "error",
            summary: "Delete failed",
            detail: err.response?.data?.message || "Could not delete this record",
          });
        }
      },
    });
  };

  const statusBody = (row) => {
    if (row.outcome) return <Badge value={outcomeLabel(row.outcome)} severity="info" />;
    if (row.is_confirmed) return <Badge value="Confirmed" severity="success" />;
    return <Badge value="Service / Open" severity="warn" />;
  };

  const actionsBody = (row) => {
    const canConfirm = !row.outcome && !row.is_confirmed && canManage;
    const canLifecycle = !row.outcome && canManage;
    return (
      <div className="flex items-center gap-1">
        {canConfirm && (
          <Button
            title="Confirm pregnancy"
            icon={<CheckCircle2 size={15} style={{ color: "var(--success)" }} />}
            size="small"
            text
            className="!h-8 !w-8 !rounded-lg !p-0"
            onClick={() => setConfirmTarget(row)}
          />
        )}
        {canLifecycle && (
          <>
            <Button
              title="Record birth"
              icon={<Baby size={15} style={{ color: "var(--primary)" }} />}
              size="small"
              text
              className="!h-8 !w-8 !rounded-lg !p-0"
              onClick={() => setBirthTarget(row)}
            />
            <Button
              title="Close pregnancy"
              icon={<Flag size={15} style={{ color: "var(--text-muted)" }} />}
              size="small"
              text
              className="!h-8 !w-8 !rounded-lg !p-0"
              onClick={() => setCloseTarget(row)}
            />
          </>
        )}
        <Button
          title="View offspring"
          icon={<HeartHandshake size={15} style={{ color: "var(--info)" }} />}
          size="small"
          text
          className="!h-8 !w-8 !rounded-lg !p-0"
          onClick={() => openKids(row)}
        />
        {canManage && (
          <span className="mx-0.5 h-5 w-px" style={{ backgroundColor: "var(--border)" }} />
        )}
        {canManage && (
          <Button
            title="Delete record"
            icon={<Trash2 size={15} style={{ color: "var(--danger)" }} />}
            size="small"
            text
            className="!h-8 !w-8 !rounded-lg !p-0 !hover:bg-red-50"
            onClick={() => confirmDeletePregnancy(row)}
          />
        )}
      </div>
    );
  };

  const sireLabel = (row) => (row.sire ? `${row.sire.tag_number}${row.sire.name ? ` — ${row.sire.name}` : ""}` : row.sire_ref || "—");
  const damLabel = (row) => `${row.dam?.tag_number}${row.dam?.name ? ` — ${row.dam.name}` : ""}`;

  return (
    <div className="font-sans">
      <style>{pageStyles}</style>

      <ConfirmDialog />

      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display mb-1 text-2xl font-semibold" style={{ color: "var(--text-heading)" }}>
            Breeding &amp; Reproduction
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Services, confirmations, births and offspring tracking.
          </p>
        </div>
        {canManage && (
          <Button
            label="Record Service"
            icon={<Plus size={16} className="mr-1.5" />}
            onClick={() => setServiceOpen(true)}
            className="!rounded-lg !px-4 !py-2 !text-sm !font-semibold !text-white"
            style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
          />
        )}
      </div>

      {/* Report / alert cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <p className="text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Upcoming deliveries</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: "var(--primary)" }}>{upcoming.length}</p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>due within 30 days</p>

          {upcoming.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              {upcoming.map((u) => (
                <div
                  key={u.pregnancy_id}
                  className="flex items-center justify-between gap-2 rounded-lg border p-2"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="min-w-0 text-xs">
                    <p className="truncate font-semibold" style={{ color: "var(--text-heading)" }}>
                      {u.dam?.tag_number}{u.dam?.name ? ` — ${u.dam.name}` : ""}
                    </p>
                    <p className="truncate" style={{ color: "var(--text-muted)" }}>
                      {u.is_confirmed
                        ? `Due ${fmtDate(u.expected_delivery_date)} · set at confirmation`
                        : `Expected delivery ${fmtDate(u.expected_delivery_date)}`}
                    </p>
                  </div>
                  {u.is_confirmed
                    ? <Badge value="Confirmed" severity="success" />
                    : <Badge value="Expected Delivery" severity="warning" />}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <p className="text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Confirmation rate</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: "var(--primary)" }}>{successRate?.rate ?? 0}%</p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {successRate?.confirmed ?? 0}/{successRate?.total ?? 0} confirmed
          </p>
        </div>
        <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <p className="text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Live offspring</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: "var(--primary)" }}>{birthOutcomes?.live_kids ?? 0}</p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            avg litter {birthOutcomes?.avg_litter_size ?? 0}
          </p>
        </div>
        <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <p className="text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Maturity alerts</p>
          <p className="mt-1 text-2xl font-bold" style={{ color: "var(--danger)" }}>{maturityAlerts.length}</p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>ready to breed soon</p>
        </div>
      </div>

      <DataTable
        value={pregnancies}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        emptyMessage="No breeding records yet. Record a service to get started."
      >
        <Column header="Female" body={(r) => damLabel(r)} sortable sortField="dam_id" />
        <Column header="Male" body={sireLabel} />
        <Column field="service_date" header="Service date" sortable body={(r) => fmtDate(r.service_date)} />
        <Column field="expected_delivery_date" header="Expected delivery" sortable body={(r) => fmtDate(r.expected_delivery_date)} />
        <Column header="Status" body={statusBody} />
        {canManage && <Column header="Actions" body={actionsBody} align="center" style={{ width: "190px" }} />}
      </DataTable>

<RecordServiceDialog
        open={serviceOpen}
        onHide={() => setServiceOpen(false)}
        saving={saving}
        animals={animals}
        onSubmitForm={handleCreateService}
      />

      <ConfirmPregnancyDialog
        open={!!confirmTarget}
        onHide={() => setConfirmTarget(null)}
        saving={saving}
        onSubmitForm={handleConfirm}
      />

      <ClosePregnancyDialog
        open={!!closeTarget}
        onHide={() => setCloseTarget(null)}
        saving={saving}
        onSubmitForm={handleClose}
      />

      <RecordBirthDialog
        open={!!birthTarget}
        onHide={() => setBirthTarget(null)}
        saving={saving}
        onSubmitForm={handleBirth}
      />

      <AddKidDialog
        open={!!kidTarget}
        onHide={() => setKidTarget(null)}
        saving={saving}
        onSubmitForm={handleAddKid}
      />

      <RegisterKidDialog
        open={!!kidToRegister}
        onHide={() => setKidToRegister(null)}
        saving={saving}
        genders={genders}
        onSubmitForm={handleRegisterKid}
      />

      {/* Birth detail → kids */}
      <Dialog
        header="Birth Details"
        visible={!!birthDetail}
        onHide={() => setBirthDetail(null)}
        style={{ width: "34rem" }}
        className="br-dialog"
      >
        {birthDetail && (
          <div className="flex flex-col gap-4 pt-1">
            <div className="rounded-lg p-3 text-sm" style={{ backgroundColor: "var(--bg-muted)" }}>
              <p><strong>Female:</strong> {birthDetail.pregnancy?.dam?.tag_number}</p>
              <p><strong>Male:</strong> {birthDetail.pregnancy?.sire?.tag_number || birthDetail.pregnancy?.sire_ref || "—"}</p>
              <p><strong>Birth date:</strong> {fmtDate(birthDetail.birth_date)}</p>
              {birthDetail.notes && <p><strong>Notes:</strong> {birthDetail.notes}</p>}
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
                Offspring ({birthDetail.kids?.length || 0})
              </p>
              {canManage && (
                <Button
                  label="Add Offspring"
                  icon={<Plus size={14} className="mr-1" />}
                  size="small"
                  onClick={() => setKidTarget(birthDetail)}
                />
              )}
            </div>

            <div className="flex flex-col gap-2">
              {(birthDetail.kids || []).map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="text-sm">
                    <span className="font-semibold">{k.gender || "Offspring"}</span>
                    {k.is_stillborn && <Badge value="Stillborn" severity="danger" className="ml-2" />}
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {k.birth_weight_kg != null ? `${k.birth_weight_kg} kg` : "weight n/a"}
                    </div>
                    {k.animal && (
                      <div className="text-xs" style={{ color: "var(--primary)" }}>
                        Registered: {k.animal.tag_number}
                      </div>
                    )}
                  </div>
                  {canManage && !k.animal && !k.is_stillborn && (
                    <Button label="Register Animal" size="small" onClick={() => setKidToRegister(k)} />
                  )}
                </div>
              ))}
              {(!birthDetail.kids || birthDetail.kids.length === 0) && (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>No offspring recorded yet.</p>
              )}
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

export default BreedingPage;
import { useEffect, useState, useCallback } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { TabView, TabPanel } from "primereact/tabview";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import {
  Syringe,
  CalendarClock,
  CheckCircle2,
  Banknote,
  Plus,
  Pencil,
  Trash2,
  Search,
  FileDown,
} from "lucide-react";
import api from "../../apis/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import {
  generateVaccinationSeasonalPdf,
  generateVaccinationCostPdf,
  generateVaccinationDuePdf,
} from "../../utils/reportPdf";
import {
  VaccinationDialog,
  VaccinationTypeDialog,
} from "./VaccinationDialogs";

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
  .p-datepicker, .p-datepicker.p-datepicker-inline { background: var(--bg-card) !important; color: var(--text) !important; border: 1px solid var(--border) !important; border-radius: 0.6rem; }
  .p-datepicker .p-datepicker-header { background: var(--bg-card) !important; color: var(--text-heading) !important; border-bottom: 1px solid var(--border) !important; }
  .p-datepicker table th, .p-datepicker table td span { color: var(--text) !important; }
  .p-datepicker table td > span.p-highlight { background: var(--primary) !important; color: #fff !important; }
  .p-tabview .p-tabview-nav { background: transparent !important; border-color: var(--border) !important; }
  .p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link { background: var(--bg-card) !important; border-color: var(--primary) !important; color: var(--primary) !important; }
  .p-tabview .p-tabview-nav li .p-tabview-nav-link { color: var(--text-muted) !important; }
  .p-inputtext, .p-dropdown { background: var(--bg-card) !important; border: 1px solid var(--border) !important; color: var(--text) !important; }
`;

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");
const money = (n) => (n == null ? "—" : `Rs. ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`);
const categoryOptions = [
  { label: "All categories", value: "ALL" },
  { label: "Normal", value: "NORMAL" },
  { label: "Seasonal", value: "SEASONAL" },
];
function VaccinationPage() {
  const { user } = useAuth();
  const showToast = useToast();
  const canManage = ["owner", "manager"].includes(user?.role);

  const [animals, setAnimals] = useState([]);
  const [vaccinationTypes, setVaccinationTypes] = useState([]);
  const [records, setRecords] = useState([]);
  const [dosesDue, setDosesDue] = useState([]);
  const [seasonal, setSeasonal] = useState(null);
  const [costData, setCostData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState({});

  const [recordOpen, setRecordOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [typeOpen, setTypeOpen] = useState(false);
  const [typeEditing, setTypeEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [recordsFilter, setRecordsFilter] = useState("");
  const [dueFilter, setDueFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const loadReferences = useCallback(async () => {
    try {
      const [a, vt] = await Promise.all([
        api.get("/animal/api/animals"),
        api.get("/vaccination/api/vaccination-types"),
      ]);
      setAnimals(a.data.data || []);
      setVaccinationTypes(vt.data.data || []);
    } catch (err) {
      showToast({ severity: "error", summary: "Failed to load", detail: err.response?.data?.message || "Could not load reference data" });
    }
  }, [showToast]);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/vaccination/api/vaccinations");
      setRecords(res.data.data || []);
    } catch (err) {
      showToast({ severity: "error", summary: "Failed to load", detail: err.response?.data?.message || "Could not load vaccination records" });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadReports = useCallback(async () => {
    const tasks = [
      { key: "due", url: "/vaccination/api/doses-due", set: setDosesDue, def: [] },
      { key: "seasonal", url: "/vaccination/api/reports/vaccination/seasonal", set: setSeasonal, def: null },
      { key: "cost", url: "/vaccination/api/reports/vaccination/cost", set: setCostData, def: null },
    ];
    await Promise.all(
      tasks.map(async (t) => {
        try {
          const res = await api.get(t.url);
          t.set(res.data.data ?? t.def);
        } catch (err) {
          console.error(`Failed to load ${t.key}:`, err);
        }
      })
    );
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadRecords(), loadReports(), loadReferences()]);
  }, [loadRecords, loadReports, loadReferences]);

  const reloadMaster = useCallback(async () => {
    try {
      const vt = await api.get("/vaccination/api/vaccination-types");
      setVaccinationTypes(vt.data.data || []);
    } catch (err) {
      showToast({ severity: "error", summary: "Failed to load", detail: err.response?.data?.message || "Could not load master data" });
    }
  }, [showToast]);

  useEffect(() => {
    loadRecords();
    loadReports();
    loadReferences();
  }, [loadRecords, loadReports, loadReferences, canManage]);
const handleRecord = async (payload) => {
    setSaving(true);
    try {
      if (editingRecord) {
        await api.put(`/vaccination/api/vaccinations/${editingRecord.id}`, payload);
        showToast({ severity: "success", summary: "Updated", detail: "Vaccination record updated." });
      } else {
        await api.post("/vaccination/api/vaccinations", payload);
        showToast({ severity: "success", summary: "Recorded", detail: "Vaccination recorded." });
      }
      setEditingRecord(null);
      setRecordOpen(false);
      await refreshAll();
    } catch (err) {
      showToast({ severity: "error", summary: "Save failed", detail: err.response?.data?.message || "Something went wrong" });
    } finally {
      setSaving(false);
    }
  };

  const handleTypeSubmit = async (payload) => {
    setSaving(true);
    try {
      if (typeEditing) {
        await api.put(`/vaccination/api/vaccination-types/${typeEditing.id}`, payload);
        showToast({ severity: "success", summary: "Updated", detail: "Vaccination type updated." });
      } else {
        await api.post("/vaccination/api/vaccination-types", payload);
        showToast({ severity: "success", summary: "Created", detail: "Vaccination type created." });
      }
      setTypeOpen(false);
      await reloadMaster();
      await loadRecords();
    } catch (err) {
      showToast({ severity: "error", summary: "Save failed", detail: err.response?.data?.message || "Something went wrong" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteRecord = (row) => {
    confirmDialog({
      message: `Delete ${row.vaccinationType?.name || "this vaccination"} for ${row.animal?.tag_number}?`,
      header: "Confirm deletion",
      icon: <Trash2 size={18} />,
      acceptLabel: "Delete",
      rejectLabel: "Cancel",
      accept: async () => {
        try {
          await api.delete(`/vaccination/api/vaccinations/${row.id}`);
          showToast({ severity: "success", summary: "Deleted", detail: "Vaccination record deleted." });
          await refreshAll();
        } catch (err) {
          showToast({ severity: "error", summary: "Delete failed", detail: err.response?.data?.message || "Something went wrong" });
        }
      },
    });
  };

  const confirmDeleteType = (row) => {
    confirmDialog({
      message: `Delete "${row.name}"?`,
      header: "Confirm deletion",
      icon: <Trash2 size={18} />,
      acceptLabel: "Delete",
      rejectLabel: "Cancel",
      accept: async () => {
        try {
          await api.delete(`/vaccination/api/vaccination-types/${row.id}`);
          showToast({ severity: "success", summary: "Deleted", detail: "Vaccination type deleted." });
          await reloadMaster();
          await loadRecords();
        } catch (err) {
          showToast({ severity: "error", summary: "Delete failed", detail: err.response?.data?.message || "Something went wrong" });
        }
      },
    });
  };

const handleSeasonalPdf = async () => {
    setPdfLoading((p) => ({ ...p, seasonal: true }));
    try {
      generateVaccinationSeasonalPdf({ data: seasonal, generatedBy: user?.name });
    } catch (err) {
      showToast({ severity: "error", summary: "PDF failed", detail: err.message });
    } finally {
      setPdfLoading((p) => ({ ...p, seasonal: false }));
    }
  };

  const handleCostPdf = async () => {
    setPdfLoading((p) => ({ ...p, cost: true }));
    try {
      generateVaccinationCostPdf({ data: costData, generatedBy: user?.name });
    } catch (err) {
      showToast({ severity: "error", summary: "PDF failed", detail: err.message });
    } finally {
      setPdfLoading((p) => ({ ...p, cost: false }));
    }
  };

  const handleDuePdf = async () => {
    setPdfLoading((p) => ({ ...p, due: true }));
    try {
      generateVaccinationDuePdf({ data: dosesDue, generatedBy: user?.name });
    } catch (err) {
      showToast({ severity: "error", summary: "PDF failed", detail: err.message });
    } finally {
      setPdfLoading((p) => ({ ...p, due: false }));
    }
  };

  const animalCell = (r) => (
    <div className="flex flex-col">
      <span className="text-sm font-semibold" style={{ color: "var(--text-heading)" }}>{r.animal?.tag_number || "—"}</span>
      {r.animal?.name && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{r.animal.name}</span>}
    </div>
  );

  const recordActions = (r) => (
    <div className="flex items-center gap-2">
      {canManage && (
        <>
          <button onClick={() => { setEditingRecord(r); setRecordOpen(true); }} title="Edit" className="p-1.5 transition-colors" style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
            <Pencil size={16} />
          </button>
          <button onClick={() => confirmDeleteRecord(r)} title="Delete" className="p-1.5 transition-colors" style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
            <Trash2 size={16} />
          </button>
        </>
      )}
    </div>
  );

  const filteredRecords = records.filter((r) => {
    if (categoryFilter === "ALL") return true;
    return (r.category || "NORMAL") === categoryFilter;
  });

  const typeCell = (r) => r.vaccinationType?.name || "—";
  const dueStatus = (r) =>
    r.days_from_now < 0
      ? <Badge value={`${-r.days_from_now}d overdue`} severity="danger" />
      : r.days_from_now === 0
      ? <Badge value="Due today" severity="warning" />
      : <Badge value={`${r.days_from_now}d`} severity="success" />;
return (
    <>
      <style>{pageStyles}</style>

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: "var(--text-heading)" }}>Vaccination &amp; Immunization</h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Track doses, schedules and herd vaccination status.</p>
        </div>
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button label="Vaccine Types" icon={<Plus size={16} className="mr-1.5" />} onClick={() => { setTypeEditing(null); setTypeOpen(true); }}
              className="!rounded-lg !px-3 !py-2 !text-sm !font-semibold" outlined severity="secondary" />
            <Button label="Record Vaccination" icon={<Plus size={16} className="mr-1.5" />} onClick={() => { setEditingRecord(null); setRecordOpen(true); }}
              className="!rounded-lg !px-4 !py-2 !text-sm !font-semibold !text-white" style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }} />
          </div>
        )}
      </div>

      {/* Report / alert cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Vaccinations recorded</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: "var(--primary)" }}>{records.length}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>doses administered</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)" }}>
              <Syringe size={18} style={{ color: "var(--primary)" }} />
            </span>
          </div>
        </div>

        <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Seasonal vaccinations</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: "var(--primary)" }}>{seasonal?.summary?.seasonal ?? 0}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{seasonal?.summary?.pct ?? 0}% of {seasonal?.summary?.total ?? 0} total doses</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)" }}>
              <CheckCircle2 size={18} style={{ color: "var(--primary)" }} />
            </span>
          </div>
        </div>

        <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Doses due</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: dosesDue.length ? "var(--danger)" : "var(--primary)" }}>{dosesDue.length}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>within 30 days</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)" }}>
              <CalendarClock size={18} style={{ color: "var(--primary)" }} />
            </span>
          </div>
        </div>

        <div className="rounded-xl border p-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Total spend</p>
              <p className="mt-1 text-2xl font-bold" style={{ color: "var(--primary)" }}>{money(costData?.total_cost ?? 0)}</p>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>{costData?.dose_count ?? 0} costed doses</p>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)" }}>
              <Banknote size={18} style={{ color: "var(--primary)" }} />
            </span>
          </div>
        </div>
      </div>
<TabView>
        <TabPanel header="Vaccination Records">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold" style={{ color: "var(--text-heading)" }}>Administered doses</h2>
            <span className="relative w-full sm:w-72">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <InputText value={recordsFilter} onChange={(e) => setRecordsFilter(e.target.value)} placeholder="Search tag, animal, vaccine, batch…"
                className="!w-full !rounded-lg !border !py-2 !pl-9 !text-sm" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)" }} />
            </span>
            <Dropdown value={categoryFilter} onChange={(e) => setCategoryFilter(e.value)} options={categoryOptions}
              placeholder="All categories" className="!w-full sm:!w-44" />
          </div>
          <DataTable value={filteredRecords} loading={loading} globalFilter={recordsFilter}
            globalFilterFields={["animal.tag_number", "animal.name", "vaccinationType.name", "category", "batch_number", "administered_by"]}
            paginator rows={10} rowsPerPageOptions={[5, 10, 25]} emptyMessage="No vaccinations recorded yet.">
            <Column header="Animal" body={animalCell} sortable sortField="animal.tag_number" />
            <Column header="Vaccine" body={typeCell} sortable />
            <Column header="Category" body={(r) => (r.category === "SEASONAL" ? "Seasonal" : "Normal")} sortable sortField="category" />
            <Column field="dose_number" header="Dose" sortable />
            <Column field="administered_date" header="Date" sortable body={(r) => fmtDate(r.administered_date)} />
            <Column field="batch_number" header="Batch" sortable />
            <Column field="administered_by" header="By" sortable />
            <Column header="Next due" body={(r) => fmtDate(r.next_due_date)} sortable />
            {canManage && <Column header="Actions" body={recordActions} align="center" style={{ width: "70px" }} />}
          </DataTable>
        </TabPanel>

        <TabPanel header="Due / Overdue">
          <div className="mb-3">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Doses due or overdue within the next 30 days, based on the due date you enter on each vaccination record.
            </p>
          </div>
          <DataTable value={dosesDue} globalFilter={dueFilter} globalFilterFields={["tag_number", "name", "vaccine", "animal_type"]}
            paginator rows={10} rowsPerPageOptions={[5, 10, 25]} emptyMessage="No due dates recorded yet. Enter a due date when recording a vaccination.">
            <Column header="Animal" body={(r) => (
              <div className="flex flex-col">
                <span className="text-sm font-semibold" style={{ color: "var(--text-heading)" }}>{r.tag_number || "—"}</span>
                {r.name && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{r.name}</span>}
              </div>
            )} sortable />
            <Column field="vaccine" header="Vaccine" sortable />
            <Column field="animal_type" header="Type" sortable />
            <Column field="dose_number" header="Dose" sortable />
            <Column header="Due date" body={(r) => fmtDate(r.due_date)} sortable />
            <Column header="Status" body={dueStatus} />
          </DataTable>
        </TabPanel>
{canManage && (
          <TabPanel header="Vaccine Types">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold" style={{ color: "var(--text-heading)" }}>Vaccination types</h2>
              <Button label="Add Type" icon={<Plus size={16} className="mr-1.5" />} onClick={() => { setTypeEditing(null); setTypeOpen(true); }}
                className="!rounded-lg !px-3 !py-2 !text-sm !font-semibold !text-white" style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }} />
            </div>
            <DataTable value={vaccinationTypes} paginator rows={10} emptyMessage="No vaccination types yet.">
              <Column field="code" header="Code" sortable />
              <Column field="name" header="Name" sortable />
              <Column field="description" header="Description" />
              <Column header="Active" body={(r) => r.is_active ? <Badge value="Active" severity="success" /> : <Badge value="Inactive" severity="secondary" />} />
              <Column header="" body={(r) => (
                <div className="flex items-center gap-2">
                  <button onClick={() => { setTypeEditing(r); setTypeOpen(true); }} className="p-1.5 transition-colors" style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => confirmDeleteType(r)} className="p-1.5 transition-colors" style={{ color: "var(--text-muted)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )} />
            </DataTable>
          </TabPanel>
        )}
      </TabView>
{/* Reports / PDF downloads */}
      <div className="mb-4 mt-5 rounded-xl border p-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="mb-1 flex items-center gap-2">
          <FileDown size={18} style={{ color: "var(--primary)" }} />
          <h2 className="font-display text-lg font-semibold" style={{ color: "var(--text-heading)" }}>Reports</h2>
        </div>
        <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>Generate a PDF for each vaccination report.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Button label={pdfLoading.due ? "Generating…" : "Due / Overdue Doses"} icon={<FileDown size={15} className="mr-1.5" />} loading={pdfLoading.due} onClick={handleDuePdf}
            className="!justify-start !rounded-lg !px-4 !py-2.5 !text-sm !font-semibold !text-white" style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }} />
          <Button label={pdfLoading.seasonal ? "Generating…" : "Seasonal Vaccinations"} icon={<FileDown size={15} className="mr-1.5" />} loading={pdfLoading.seasonal} onClick={handleSeasonalPdf}
            className="!justify-start !rounded-lg !px-4 !py-2.5 !text-sm !font-semibold !text-white" style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }} />
          <Button label={pdfLoading.cost ? "Generating…" : "Vaccination Cost"} icon={<FileDown size={15} className="mr-1.5" />} loading={pdfLoading.cost} onClick={handleCostPdf}
            className="!justify-start !rounded-lg !px-4 !py-2.5 !text-sm !font-semibold !text-white" style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }} />
        </div>
      </div>

      <ConfirmDialog />

      <VaccinationDialog open={recordOpen} onHide={() => { setEditingRecord(null); setRecordOpen(false); }} saving={saving} editing={editingRecord} animals={animals} vaccinationTypes={vaccinationTypes} onSubmitForm={handleRecord} />
      <VaccinationTypeDialog open={typeOpen} onHide={() => setTypeOpen(false)} saving={saving} editing={typeEditing} onSubmitForm={handleTypeSubmit} />
    </>
  );
}

export default VaccinationPage;
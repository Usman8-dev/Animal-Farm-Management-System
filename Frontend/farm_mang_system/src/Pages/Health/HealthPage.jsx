import { useEffect, useState, useCallback, useMemo } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { TabView, TabPanel } from "primereact/tabview";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import {
  ClipboardList,
  ShieldAlert,
  HeartPulse,
  Banknote,
  Bug,
  Pill,
  Plus,
  Pencil,
  Trash2,
  Search,
  FileDown,
  Eye,
} from "lucide-react";
import api from "../../apis/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import {
  generateHealthOverviewPdf,
  generateDiseaseFrequencyPdf,
  generateHealthActiveCasesPdf,
  generateHealthTreatmentCostPdf,
} from "../../utils/reportPdf";
import {
  HealthCaseDialog,
  CaseStatusDialog,
  TreatmentDialog,
  DiseaseDialog,
  MedicineDialog,
  CaseDetailDialog,
} from "./HealthDialogs";
import { statusSeverity, severitySeverity, caseStatusLabel } from "./healthDisplay";
import {
  STATUS_FILTER_OPTIONS,
  SEVERITY_FILTER_OPTIONS,
  CATEGORY_FILTER_OPTIONS,
  DISEASE_CATEGORY_OPTIONS,
  labelFor,
} from "../../validations/HealthSchema";

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
  .p-tabview .p-tabview-nav li .p-tabview-nav-link { background: transparent !important; border-color: var(--border) !important; color: var(--text-muted) !important; }
  .p-tabview .p-tabview-nav li:not(.p-highlight) .p-tabview-nav-link:hover { background: var(--bg-muted) !important; color: var(--text) !important; }
  .p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link { background: var(--bg-card) !important; border-color: var(--primary) !important; color: var(--primary) !important; }
  .p-tabview .p-tabview-panels { background: var(--bg-card) !important; border: 1px solid var(--border) !important; border-top: none !important; color: var(--text) !important; }
  .p-inputtext, .p-dropdown { background: var(--bg-card) !important; border: 1px solid var(--border) !important; color: var(--text) !important; }
`;

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");
const money = (n) =>
  n == null ? "—" : `Rs. ${Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const num = (n, digits = 1) =>
  n == null ? "—" : Number(n).toLocaleString(undefined, { maximumFractionDigits: digits });

function HealthPage() {
  const { user } = useAuth();
  const showToast = useToast();
  const canManage = ["owner", "manager"].includes(user?.role);
  const canRecord = ["owner", "manager", "worker"].includes(user?.role);

  const [cases, setCases] = useState([]);
  const [overview, setOverview] = useState(null);
  const [activeReport, setActiveReport] = useState(null);
  const [quarantineReport, setQuarantineReport] = useState(null);
  const [withdrawalReport, setWithdrawalReport] = useState(null);
  const [costReport, setCostReport] = useState(null);
  const [frequencyReport, setFrequencyReport] = useState(null);

  const [animals, setAnimals] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [medicines, setMedicines] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pdfLoading, setPdfLoading] = useState({});

  const [caseOpen, setCaseOpen] = useState(false);
  const [editingCaseRow, setEditingCaseRow] = useState(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusCaseRow, setStatusCaseRow] = useState(null);
  const [diseaseOpen, setDiseaseOpen] = useState(false);
  const [editingDisease, setEditingDisease] = useState(null);
  const [medicineOpen, setMedicineOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [treatmentOpen, setTreatmentOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState(null);
  const [treatmentCase, setTreatmentCase] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [severityFilter, setSeverityFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState(null);

  const loadReferences = useCallback(async () => {
    try {
      const [a, d, m] = await Promise.all([
        api.get("/animal/api/animals"),
        api.get("/health/api/diseases"),
        api.get("/health/api/medicines"),
      ]);
      setAnimals(a.data.data || []);
      setDiseases(d.data.data || []);
      setMedicines(m.data.data || []);
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail: err.response?.data?.message || "Could not load reference data",
      });
    }
  }, [showToast]);

  const loadCases = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/health/api/cases");
      setCases(res.data.data || []);
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail: err.response?.data?.message || "Could not load health cases",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const loadReports = useCallback(async () => {
    const tasks = [
      { key: "overview", url: "/health/api/reports/health/overview", set: setOverview, def: null },
      { key: "active", url: "/health/api/reports/health/active-cases", set: setActiveReport, def: null },
      { key: "quarantine", url: "/health/api/reports/health/quarantine", set: setQuarantineReport, def: null },
      {
        key: "withdrawal",
        url: "/health/api/reports/health/withdrawal?days=30",
        set: setWithdrawalReport,
        def: null,
      },
      { key: "cost", url: "/health/api/reports/health/treatment-cost", set: setCostReport, def: null },
      {
        key: "frequency",
        url: "/health/api/reports/health/disease-frequency",
        set: setFrequencyReport,
        def: null,
      },
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
    await Promise.all([loadCases(), loadReports()]);
  }, [loadCases, loadReports]);

  const openDetail = useCallback(
    async (caseId) => {
      setDetailOpen(true);
      setDetailLoading(true);
      try {
        const res = await api.get(`/health/api/cases/${caseId}`);
        setDetail(res.data.data || null);
      } catch (err) {
        showToast({
          severity: "error",
          summary: "Failed to load",
          detail: err.response?.data?.message || "Could not load the case",
        });
      } finally {
        setDetailLoading(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    loadReferences();
    loadCases();
    loadReports();
  }, [loadReferences, loadCases, loadReports]);

  const handleCaseSubmit = async (payload) => {
    setSaving(true);
    try {
      if (editingCaseRow) {
        await api.put(`/health/api/cases/${editingCaseRow.id}`, payload);
        showToast({ severity: "success", summary: "Updated", detail: "Health case updated." });
      } else {
        await api.post("/health/api/cases", payload);
        showToast({ severity: "success", summary: "Logged", detail: "Health case logged." });
      }
      setEditingCaseRow(null);
      setCaseOpen(false);
      await refreshAll();
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Save failed",
        detail:
          err.response?.data?.message ||
          (err.response?.data?.errors || []).join(", ") ||
          "Something went wrong",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOutcomeSubmit = async (payload) => {
    if (!statusCaseRow) return;
    setSaving(true);
    try {
      await api.put(`/health/api/cases/${statusCaseRow.id}/status`, payload);
      showToast({ severity: "success", summary: "Outcome saved", detail: "Case status updated." });
      const caseId = statusCaseRow.id;
      setStatusOpen(false);
      setStatusCaseRow(null);
      await refreshAll();
      if (detail?.id === caseId) await openDetail(caseId);
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Save failed",
        detail: err.response?.data?.message || "Something went wrong",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDiseaseSubmit = async (payload) => {
    setSaving(true);
    try {
      if (editingDisease) {
        await api.put(`/health/api/diseases/${editingDisease.id}`, payload);
        showToast({ severity: "success", summary: "Updated", detail: "Disease updated." });
      } else {
        await api.post("/health/api/diseases", payload);
        showToast({ severity: "success", summary: "Created", detail: "Disease added." });
      }
      setDiseaseOpen(false);
      setEditingDisease(null);
      await loadReferences();
      await loadCases();
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Save failed",
        detail: err.response?.data?.message || "Something went wrong",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMedicineSubmit = async (payload) => {
    setSaving(true);
    try {
      if (editingMedicine) {
        await api.put(`/health/api/medicines/${editingMedicine.id}`, payload);
        showToast({ severity: "success", summary: "Updated", detail: "Medicine updated." });
      } else {
        await api.post("/health/api/medicines", payload);
        showToast({ severity: "success", summary: "Created", detail: "Medicine added." });
      }
      setMedicineOpen(false);
      setEditingMedicine(null);
      await loadReferences();
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Save failed",
        detail: err.response?.data?.message || "Something went wrong",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTreatmentSubmit = async (payload) => {
    const caseId = treatmentCase?.case_id || treatmentCase?.id;
    setSaving(true);
    try {
      if (editingTreatment) {
        await api.put(`/health/api/treatments/${editingTreatment.id}`, payload);
        showToast({ severity: "success", summary: "Updated", detail: "Treatment updated." });
      } else {
        await api.post(`/health/api/cases/${caseId}/treatments`, payload);
        showToast({ severity: "success", summary: "Added", detail: "Treatment recorded." });
      }
      const openCaseId = detail?.id;
      setTreatmentOpen(false);
      setEditingTreatment(null);
      setTreatmentCase(null);
      await refreshAll();
      if (openCaseId) await openDetail(openCaseId);
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Save failed",
        detail:
          err.response?.data?.message ||
          (err.response?.data?.errors || []).join(", ") ||
          "Something went wrong",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteTreatment = (row) => {
    confirmDialog({
      message: `Delete the ${row.medicine_name || "treatment"} record?`,
      header: "Confirm deletion",
      icon: <Trash2 size={18} />,
      acceptLabel: "Delete",
      rejectLabel: "Cancel",
      accept: async () => {
        try {
          await api.delete(`/health/api/treatments/${row.id}`);
          showToast({ severity: "success", summary: "Deleted", detail: "Treatment deleted." });
          const openCaseId = detail?.id;
          await refreshAll();
          if (openCaseId) await openDetail(openCaseId);
        } catch (err) {
          showToast({
            severity: "error",
            summary: "Delete failed",
            detail: err.response?.data?.message || "Something went wrong",
          });
        }
      },
    });
  };

  const confirmDeleteCase = (row) => {
    confirmDialog({
      message: `Delete the ${row.diagnosis} case for ${row.tag_number}? Its treatments are removed too.`,
      header: "Confirm deletion",
      icon: <Trash2 size={18} />,
      acceptLabel: "Delete",
      rejectLabel: "Cancel",
      accept: async () => {
        try {
          await api.delete(`/health/api/cases/${row.id}`);
          showToast({ severity: "success", summary: "Deleted", detail: "Health case deleted." });
          await refreshAll();
        } catch (err) {
          showToast({
            severity: "error",
            summary: "Delete failed",
            detail: err.response?.data?.message || "Something went wrong",
          });
        }
      },
    });
  };

  const confirmDeleteDisease = (row) => {
    confirmDialog({
      message: `Delete "${row.name}" from the disease catalogue?`,
      header: "Confirm deletion",
      icon: <Trash2 size={18} />,
      acceptLabel: "Delete",
      rejectLabel: "Cancel",
      accept: async () => {
        try {
          await api.delete(`/health/api/diseases/${row.id}`);
          showToast({ severity: "success", summary: "Deleted", detail: "Disease deleted." });
          await loadReferences();
        } catch (err) {
          showToast({
            severity: "error",
            summary: "Delete failed",
            detail: err.response?.data?.message || "Something went wrong",
          });
        }
      },
    });
  };

  const confirmDeleteMedicine = (row) => {
    confirmDialog({
      message: `Delete "${row.name}" from the medicine catalogue?`,
      header: "Confirm deletion",
      icon: <Trash2 size={18} />,
      acceptLabel: "Delete",
      rejectLabel: "Cancel",
      accept: async () => {
        try {
          await api.delete(`/health/api/medicines/${row.id}`);
          showToast({ severity: "success", summary: "Deleted", detail: "Medicine deleted." });
          await loadReferences();
        } catch (err) {
          showToast({
            severity: "error",
            summary: "Delete failed",
            detail: err.response?.data?.message || "Something went wrong",
          });
        }
      },
    });
  };

  const runPdf = async (key, fn, payload) => {
    setPdfLoading((p) => ({ ...p, [key]: true }));
    try {
      fn(payload);
    } catch (err) {
      showToast({ severity: "error", summary: "PDF failed", detail: err.message });
    } finally {
      setPdfLoading((p) => ({ ...p, [key]: false }));
    }
  };

  const handleOverviewPdf = () =>
    runPdf("overview", generateHealthOverviewPdf, { data: overview, generatedBy: user?.name });

  const handleFrequencyPdf = () =>
    runPdf("frequency", generateDiseaseFrequencyPdf, {
      data: frequencyReport,
      generatedBy: user?.name,
    });

  const handleActivePdf = () =>
    runPdf("active", generateHealthActiveCasesPdf, {
      data: { active: activeReport, quarantine: quarantineReport },
      generatedBy: user?.name,
    });

  const handleCostPdf = () =>
    runPdf("cost", generateHealthTreatmentCostPdf, { data: costReport, generatedBy: user?.name });

  const filteredCases = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cases.filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (severityFilter && c.severity !== severityFilter) return false;
      if (categoryFilter && c.category !== categoryFilter) return false;
      if (!q) return true;
      return [c.tag_number, c.animal_name, c.diagnosis, c.category, c.diagnosed_by]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [cases, search, statusFilter, severityFilter, categoryFilter]);

  const openCases = activeReport?.cases || [];
  const quarantinedCases = quarantineReport?.cases || [];
  const withdrawalRows = withdrawalReport?.records || [];

  const animalCell = (r) => (
    <div
      className="flex cursor-pointer flex-col"
      onClick={() => openDetail(r.id)}
      title="Open case detail"
    >
      <span className="text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
        {r.tag_number || "—"}
      </span>
      {r.animal_name && (
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          {r.animal_name}
        </span>
      )}
    </div>
  );

  const diagnosisCell = (r) => (
    <div className="flex flex-col">
      <span className="text-sm" style={{ color: "var(--text)" }}>
        {r.diagnosis || "—"}
      </span>
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
        {labelFor(DISEASE_CATEGORY_OPTIONS, r.category)}
        {r.is_contagious ? " · contagious" : ""}
      </span>
    </div>
  );

  const iconBtn = (onClick, title, Icon, hoverColor) => (
    <button
      onClick={onClick}
      title={title}
      className="p-1.5 transition-colors"
      style={{ color: "var(--text-muted)" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = hoverColor)}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
    >
      <Icon size={16} />
    </button>
  );

  const caseActions = (r) => (
    <div className="flex items-center gap-2">
      {iconBtn(() => openDetail(r.id), "View case & treatments", Eye, "var(--primary)")}
      {canRecord &&
        iconBtn(
          () => {
            setTreatmentCase({ case_id: r.id, label: `${r.tag_number} — ${r.diagnosis}` });
            setEditingTreatment(null);
            setTreatmentOpen(true);
          },
          "Add treatment",
          Pill,
          "var(--primary)"
        )}
      {canManage && (
        <>
          {iconBtn(
            () => {
              setStatusCaseRow(r);
              setStatusOpen(true);
            },
            "Update outcome / close case",
            HeartPulse,
            "var(--primary)"
          )}
          {iconBtn(
            () => {
              setEditingCaseRow(r);
              setCaseOpen(true);
            },
            "Edit case",
            Pencil,
            "var(--primary)"
          )}
          {iconBtn(() => confirmDeleteCase(r), "Delete case", Trash2, "var(--danger)")}
        </>
      )}
    </div>
  );

  const kpi = (label, value, hint, Icon, tone) => (
    <div
      className="rounded-xl border p-4"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p
            className="text-[0.7rem] font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold" style={{ color: tone || "var(--primary)" }}>
            {value}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {hint}
          </p>
        </div>
        <span
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)" }}
        >
          <Icon size={18} style={{ color: tone || "var(--primary)" }} />
        </span>
      </div>
    </div>
  );

  return (
    <>
      <style>{pageStyles}</style>

      {/* Header */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-bold" style={{ color: "var(--text-heading)" }}>
            Health &amp; Disease Management
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Log illnesses, track treatments, and stay ahead of quarantine and withdrawal periods.
          </p>
        </div>
        {canRecord && (
          <div className="flex flex-wrap gap-2">
            {canManage && (
              <>
                <Button
                  label="Disease Catalogue"
                  icon={<Bug size={16} className="mr-1.5" />}
                  onClick={() => {
                    setEditingDisease(null);
                    setDiseaseOpen(true);
                  }}
                  className="!rounded-lg !px-3 !py-2 !text-sm !font-semibold"
                  outlined
                  severity="secondary"
                />
                <Button
                  label="Medicines"
                  icon={<Pill size={16} className="mr-1.5" />}
                  onClick={() => {
                    setEditingMedicine(null);
                    setMedicineOpen(true);
                  }}
                  className="!rounded-lg !px-3 !py-2 !text-sm !font-semibold"
                  outlined
                  severity="secondary"
                />
              </>
            )}
            <Button
              label="Log Health Case"
              icon={<Plus size={16} className="mr-1.5" />}
              onClick={() => {
                setEditingCaseRow(null);
                setCaseOpen(true);
              }}
              className="!rounded-lg !px-4 !py-2 !text-sm !font-semibold !text-white"
              style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
            />
          </div>
        )}
      </div>

      {/* KPI cards */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpi(
          "Active cases",
          `${overview?.open_cases ?? 0}`,
          `${overview?.under_treatment ?? 0} under treatment · ${overview?.total_cases ?? 0} recorded`,
          ClipboardList,
          overview?.open_cases ? "var(--danger)" : "var(--primary)"
        )}
        {kpi(
          "Quarantined animals",
          `${overview?.quarantined ?? 0}`,
          `${quarantineReport?.contagious ?? 0} with a contagious disease`,
          ShieldAlert,
          overview?.quarantined ? "#c9a227" : "var(--primary)"
        )}
        {kpi(
          "Recovery rate",
          `${overview?.recovery_rate ?? 0}%`,
          overview?.avg_recovery_days == null
            ? "no completed cases yet"
            : `avg ${num(overview.avg_recovery_days)} days to recover`,
          HeartPulse
        )}
        {kpi(
          "Treatment cost",
          money(overview?.treatment_cost ?? 0),
          `${money(overview?.avg_cost_per_case ?? 0)} average per case`,
          Banknote
        )}
      </div>

      <div
        className="mb-6 grid grid-cols-2 gap-3 rounded-xl border p-3 sm:grid-cols-4"
        style={{ backgroundColor: "var(--bg-muted)", borderColor: "var(--border)" }}
      >
        <div>
          <p
            className="text-[0.68rem] uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            New this month
          </p>
          <p className="text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
            {overview?.new_this_month ?? 0}
          </p>
        </div>
        <div>
          <p
            className="text-[0.68rem] uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Recovered this month
          </p>
          <p className="text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
            {overview?.recovered_this_month ?? 0}
          </p>
        </div>
        <div>
          <p
            className="text-[0.68rem] uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Animals affected
          </p>
          <p className="text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
            {overview?.affected_animals ?? 0} / {overview?.total_animals ?? 0}
          </p>
        </div>
        <div>
          <p
            className="text-[0.68rem] uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Losses (died + culled)
          </p>
          <p className="text-sm font-semibold" style={{ color: "var(--danger)" }}>
            {(overview?.died ?? 0) + (overview?.culled ?? 0)}
          </p>
        </div>
      </div>

      {/* Health cases — every diagnosis, filterable */}
      <div className="mb-5">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold" style={{ color: "var(--text-heading)" }}>
              Health cases
            </h2>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Click an animal or the eye icon to open a case, add treatments and close it when the
              animal recovers.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="relative">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <InputText
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tag, animal, diagnosis…"
                className="!w-full !rounded-lg !py-2 !pl-9 !pr-3 !text-sm sm:!w-64"
                style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </span>
            <Dropdown
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.value)}
              options={STATUS_FILTER_OPTIONS}
              optionLabel="label"
              optionValue="value"
              placeholder="All statuses"
              className="!w-full sm:!w-40"
            />
            <Dropdown
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.value)}
              options={SEVERITY_FILTER_OPTIONS}
              optionLabel="label"
              optionValue="value"
              placeholder="All severities"
              className="!w-full sm:!w-40"
            />
            <Dropdown
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.value)}
              options={CATEGORY_FILTER_OPTIONS}
              optionLabel="label"
              optionValue="value"
              placeholder="All categories"
              className="!w-full sm:!w-40"
            />
          </div>
        </div>

        <DataTable
          value={filteredCases}
          loading={loading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 100]}
          emptyMessage="No health cases recorded yet."
          sortField="diagnosed_on"
          sortOrder={-1}
        >
          <Column header="Animal" body={animalCell} sortable sortField="tag_number" />
          <Column header="Diagnosis" body={diagnosisCell} sortable sortField="diagnosis" />
          <Column
            header="Severity"
            sortable
            sortField="severity"
            body={(r) => <Badge value={r.severity || "—"} severity={severitySeverity(r.severity)} />}
          />
          <Column
            header="Status"
            sortable
            sortField="status"
            body={(r) => <Badge value={caseStatusLabel(r.status)} severity={statusSeverity(r.status)} />}
          />
          <Column
            header="Quarantine"
            body={(r) =>
              r.is_quarantined ? <Badge value="Isolated" severity="warning" /> : <span style={{ color: "var(--text-muted)" }}>—</span>
            }
          />
          <Column header="Diagnosed" body={(r) => fmtDate(r.diagnosed_on)} sortable sortField="diagnosed_on" />
          <Column
            header={statusFilter && ["OPEN", "UNDER_TREATMENT"].includes(statusFilter) ? "Days open" : "Days"}
            body={(r) => (r.open_days == null ? "—" : r.open_days)}
            sortable
            sortField="open_days"
          />
          <Column header="Treatments" body={(r) => r.treatment_count ?? 0} sortable sortField="treatment_count" />
          <Column
            header="Cost"
            body={(r) => money(r.treatment_cost)}
            sortable
            sortField="treatment_cost"
          />
          <Column header="Actions" body={caseActions} style={{ width: "150px" }} />
        </DataTable>
      </div>

      <TabView className="mb-5">
        <TabPanel header="Active cases">
          <div className="mb-3">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Open and under-treatment cases, most urgent first — {openCases.length} case
              {openCases.length === 1 ? "" : "s"} needing attention
              {activeReport?.quarantined ? ` · ${activeReport.quarantined} in isolation` : ""}.
            </p>
          </div>
          <DataTable
            value={openCases}
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            emptyMessage="No open cases — the herd is clear."
          >
            <Column
              header="Animal"
              body={(r) => (
                <div className="flex flex-col">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
                    {r.tag_number || "—"}
                  </span>
                  {r.animal_name && (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {r.animal_name}
                    </span>
                  )}
                </div>
              )}
            />
            <Column field="diagnosis" header="Diagnosis" />
            <Column
              header="Severity"
              body={(r) => <Badge value={r.severity} severity={severitySeverity(r.severity)} />}
            />
            <Column
              header="Status"
              body={(r) => (
                <Badge value={caseStatusLabel(r.status)} severity={statusSeverity(r.status)} />
              )}
            />
            <Column header="Days open" body={(r) => (r.open_days == null ? "—" : r.open_days)} />
            <Column
              header="Isolated"
              body={(r) =>
                r.is_quarantined ? (
                  <Badge value="Isolated" severity="warning" />
                ) : (
                  <span style={{ color: "var(--text-muted)" }}>—</span>
                )
              }
            />
            <Column header="Treatments" body={(r) => r.treatment_count ?? 0} />
            <Column header="Cost" body={(r) => money(r.treatment_cost)} />
            <Column
              header=""
              style={{ width: "60px" }}
              body={(r) => iconBtn(() => openDetail(r.id), "Open case", Eye, "var(--primary)")}
            />
          </DataTable>
        </TabPanel>

        <TabPanel header="Quarantine & withdrawal">
          <div className="mb-5">
            <h3 className="font-display text-base font-semibold" style={{ color: "var(--text-heading)" }}>
              Quarantined animals
            </h3>
            <p className="mb-3 text-sm" style={{ color: "var(--text-muted)" }}>
              {quarantineReport?.total ?? 0} case{quarantineReport?.total === 1 ? "" : "s"} in
              isolation across {quarantineReport?.animals ?? 0} animal
              {quarantineReport?.animals === 1 ? "" : "s"}.
            </p>
            <DataTable
              value={quarantinedCases}
              paginator
              rows={5}
              emptyMessage="No animal is under quarantine."
            >
              <Column
                header="Animal"
                body={(r) => `${r.tag_number || "—"}${r.animal_name ? ` — ${r.animal_name}` : ""}`}
              />
              <Column field="diagnosis" header="Diagnosis" />
              <Column
                header="Severity"
                body={(r) => <Badge value={r.severity} severity={severitySeverity(r.severity)} />}
              />
              <Column
                header="Contagious"
                body={(r) =>
                  r.is_contagious ? (
                    <Badge value="Contagious" severity="danger" />
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>—</span>
                  )
                }
              />
              <Column header="Since" body={(r) => fmtDate(r.diagnosed_on)} />
              <Column
                header="Days isolated"
                body={(r) => (r.days_isolated == null ? "—" : r.days_isolated)}
              />
              <Column
                header=""
                style={{ width: "60px" }}
                body={(r) => iconBtn(() => openDetail(r.id), "Open case", Eye, "var(--primary)")}
              />
            </DataTable>
          </div>

          <div>
            <h3 className="font-display text-base font-semibold" style={{ color: "var(--text-heading)" }}>
              Withdrawal / clearance (next 30 days)
            </h3>
            <p className="mb-3 text-sm" style={{ color: "var(--text-muted)" }}>
              {withdrawalReport?.total ?? 0} treatment
              {withdrawalReport?.total === 1 ? "" : "s"} still inside the withdrawal window
              {withdrawalReport?.pending ? ` · ${withdrawalReport.pending} pending` : ""}. Do not sell
              milk or meat before the clearance date.
            </p>
            <DataTable
              value={withdrawalRows}
              paginator
              rows={5}
              emptyMessage="No withdrawal periods are open."
            >
              <Column
                header="Animal"
                body={(r) => `${r.tag_number || "—"}${r.animal_name ? ` — ${r.animal_name}` : ""}`}
              />
              <Column field="diagnosis" header="Diagnosis" />
              <Column field="medicine" header="Medicine" />
              <Column header="Started" body={(r) => fmtDate(r.start_date)} />
              <Column header="Ended" body={(r) => fmtDate(r.end_date)} />
              <Column header="Clearance" body={(r) => fmtDate(r.withdrawal_end_date)} />
              <Column
                header="Days left"
                body={(r) =>
                  r.cleared ? (
                    <Badge value="Cleared" severity="success" />
                  ) : (
                    <Badge value={`${r.days_remaining}d`} severity="warning" />
                  )
                }
              />
            </DataTable>
          </div>
        </TabPanel>

        {canManage && (
          <TabPanel header="Disease catalogue">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-base font-semibold" style={{ color: "var(--text-heading)" }}>
                Diseases
              </h3>
              <Button
                label="Add Disease"
                icon={<Plus size={16} className="mr-1.5" />}
                onClick={() => {
                  setEditingDisease(null);
                  setDiseaseOpen(true);
                }}
                className="!rounded-lg !px-3 !py-2 !text-sm !font-semibold !text-white"
                style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
              />
            </div>
            <DataTable
              value={diseases}
              paginator
              rows={10}
              emptyMessage="No diseases in the catalogue yet."
            >
              <Column field="code" header="Code" sortable />
              <Column field="name" header="Name" sortable />
              <Column
                header="Category"
                body={(r) => labelFor(DISEASE_CATEGORY_OPTIONS, r.category)}
                sortable
                sortField="category"
              />
              <Column header="Symptoms" body={(r) => r.symptoms || "—"} />
              <Column
                header="Contagious"
                body={(r) =>
                  r.is_contagious ? (
                    <Badge value="Yes" severity="danger" />
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>No</span>
                  )
                }
              />
              <Column header="Cases" body={(r) => r.case_count ?? 0} sortable sortField="case_count" />
              <Column
                header="Active"
                body={(r) => (
                  <Badge
                    value={r.is_active ? "Active" : "Inactive"}
                    severity={r.is_active ? "success" : "secondary"}
                  />
                )}
              />
              <Column
                header=""
                style={{ width: "90px" }}
                body={(r) => (
                  <div className="flex items-center gap-2">
                    {iconBtn(
                      () => {
                        setEditingDisease(r);
                        setDiseaseOpen(true);
                      },
                      "Edit disease",
                      Pencil,
                      "var(--primary)"
                    )}
                    {iconBtn(() => confirmDeleteDisease(r), "Delete disease", Trash2, "var(--danger)")}
                  </div>
                )}
              />
            </DataTable>
          </TabPanel>
        )}

        {canManage && (
          <TabPanel header="Medicines">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-base font-semibold" style={{ color: "var(--text-heading)" }}>
                Medicines
              </h3>
              <Button
                label="Add Medicine"
                icon={<Plus size={16} className="mr-1.5" />}
                onClick={() => {
                  setEditingMedicine(null);
                  setMedicineOpen(true);
                }}
                className="!rounded-lg !px-3 !py-2 !text-sm !font-semibold !text-white"
                style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
              />
            </div>
            <DataTable
              value={medicines}
              paginator
              rows={10}
              emptyMessage="No medicines in the catalogue yet."
            >
              <Column field="code" header="Code" sortable />
              <Column field="name" header="Name" sortable />
              <Column field="unit" header="Unit" body={(r) => r.unit || "—"} />
              <Column
                header="Withdrawal"
                body={(r) => (r.withdrawal_days == null ? "—" : `${r.withdrawal_days} days`)}
                sortable
                sortField="withdrawal_days"
              />
              <Column
                header="Treatments"
                body={(r) => r.treatment_count ?? 0}
                sortable
                sortField="treatment_count"
              />
              <Column
                header="Active"
                body={(r) => (
                  <Badge
                    value={r.is_active ? "Active" : "Inactive"}
                    severity={r.is_active ? "success" : "secondary"}
                  />
                )}
              />
              <Column
                header=""
                style={{ width: "90px" }}
                body={(r) => (
                  <div className="flex items-center gap-2">
                    {iconBtn(
                      () => {
                        setEditingMedicine(r);
                        setMedicineOpen(true);
                      },
                      "Edit medicine",
                      Pencil,
                      "var(--primary)"
                    )}
                    {iconBtn(
                      () => confirmDeleteMedicine(r),
                      "Delete medicine",
                      Trash2,
                      "var(--danger)"
                    )}
                  </div>
                )}
              />
            </DataTable>
          </TabPanel>
        )}
      </TabView>

      {/* Reports / PDF downloads */}
      <div
        className="mb-4 rounded-xl border p-4"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="mb-1 flex items-center gap-2">
          <FileDown size={18} style={{ color: "var(--primary)" }} />
          <h2 className="font-display text-lg font-semibold" style={{ color: "var(--text-heading)" }}>
            Reports
          </h2>
        </div>
        <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
          Generate a branded PDF for each herd health report.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button
            label={pdfLoading.overview ? "Generating…" : "Herd Health Overview"}
            icon={<FileDown size={15} className="mr-1.5" />}
            loading={pdfLoading.overview}
            onClick={handleOverviewPdf}
            className="!justify-start !rounded-lg !px-4 !py-2.5 !text-sm !font-semibold !text-white"
            style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
          />
          <Button
            label={pdfLoading.frequency ? "Generating…" : "Disease Frequency"}
            icon={<FileDown size={15} className="mr-1.5" />}
            loading={pdfLoading.frequency}
            onClick={handleFrequencyPdf}
            className="!justify-start !rounded-lg !px-4 !py-2.5 !text-sm !font-semibold !text-white"
            style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
          />
          <Button
            label={pdfLoading.active ? "Generating…" : "Active Cases & Quarantine"}
            icon={<FileDown size={15} className="mr-1.5" />}
            loading={pdfLoading.active}
            onClick={handleActivePdf}
            className="!justify-start !rounded-lg !px-4 !py-2.5 !text-sm !font-semibold !text-white"
            style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
          />
          <Button
            label={pdfLoading.cost ? "Generating…" : "Treatment Cost"}
            icon={<FileDown size={15} className="mr-1.5" />}
            loading={pdfLoading.cost}
            onClick={handleCostPdf}
            className="!justify-start !rounded-lg !px-4 !py-2.5 !text-sm !font-semibold !text-white"
            style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
          />
        </div>
      </div>

      <ConfirmDialog />

      <DiseaseDialog
        open={diseaseOpen}
        onHide={() => setDiseaseOpen(false)}
        saving={saving}
        editing={editingDisease}
        onSubmitForm={handleDiseaseSubmit}
      />

      <MedicineDialog
        open={medicineOpen}
        onHide={() => setMedicineOpen(false)}
        saving={saving}
        editing={editingMedicine}
        onSubmitForm={handleMedicineSubmit}
      />

      {/* Mounted before the child dialogs so those stack above it */}
      <CaseDetailDialog
        open={detailOpen}
        onHide={() => {
          setDetailOpen(false);
          setDetail(null);
        }}
        detail={detail}
        loading={detailLoading}
        canManage={canManage}
        onEdit={(d) => {
          setEditingCaseRow(d);
          setCaseOpen(true);
        }}
        onOutcome={(d) => {
          setStatusCaseRow(d);
          setStatusOpen(true);
        }}
        onAddTreatment={(d) => {
          setTreatmentCase({ case_id: d.id, label: `${d.tag_number} — ${d.diagnosis}` });
          setEditingTreatment(null);
          setTreatmentOpen(true);
        }}
        onEditTreatment={(t) => {
          setTreatmentCase({
            case_id: t.case_id,
            label: `${detail?.tag_number || ""} — ${detail?.diagnosis || ""}`,
          });
          setEditingTreatment(t);
          setTreatmentOpen(true);
        }}
        onDeleteTreatment={confirmDeleteTreatment}
      />

      <HealthCaseDialog
        open={caseOpen}
        onHide={() => {
          setEditingCaseRow(null);
          setCaseOpen(false);
        }}
        saving={saving}
        editing={editingCaseRow}
        animals={animals}
        diseases={diseases}
        onSubmitForm={handleCaseSubmit}
      />

      <CaseStatusDialog
        open={statusOpen}
        onHide={() => {
          setStatusCaseRow(null);
          setStatusOpen(false);
        }}
        saving={saving}
        caseRow={statusCaseRow}
        onSubmitForm={handleOutcomeSubmit}
      />

      <TreatmentDialog
        open={treatmentOpen}
        onHide={() => {
          setEditingTreatment(null);
          setTreatmentCase(null);
          setTreatmentOpen(false);
        }}
        saving={saving}
        editing={editingTreatment}
        medicines={medicines}
        caseLabel={treatmentCase?.label}
        onSubmitForm={handleTreatmentSubmit}
      />
    </>
  );
}

export default HealthPage;


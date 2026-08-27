import { useEffect, useState, useCallback } from "react";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { TabView, TabPanel } from "primereact/tabview";
import { Scale, Plus, Pencil, Trash2, FileDown } from "lucide-react";
import api from "../../apis/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { LogWeightDialog, LogValuationDialog } from "./WeightValuation";
import {
  generateGrowthTrendPdf,
  generateTotalHerdValuePdf,
  generateHerdOverviewPdf,
} from "../../utils/reportPdf";

const pageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
  * { font-family: 'Inter', sans-serif; }
  .font-display { font-family: 'Fraunces', serif; }

  .p-datatable {
    background: var(--bg-card) !important;
    border: 1px solid var(--border) !important;
    border-radius: 0.75rem;
    overflow: hidden;
  }
  .p-datatable .p-datatable-thead > tr > th {
    background: var(--bg-muted) !important;
    color: var(--text-muted) !important;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    border-color: var(--border) !important;
    padding: 0.75rem 1rem;
  }
  .p-datatable .p-datatable-tbody > tr > td {
    background: var(--bg-card) !important;
    border-color: var(--border) !important;
    padding: 0.75rem 1rem;
    font-size: 0.88rem;
    color: var(--text) !important;
  }
  .p-datatable .p-datatable-tbody > tr:hover > td {
    background: var(--bg-muted) !important;
  }
  .p-paginator {
    background: transparent !important;
    border: none !important;
    color: var(--text-muted) !important;
  }
  .p-paginator .p-highlight {
    background: var(--primary) !important;
    border-color: var(--primary) !important;
    color: #fff !important;
  }

  .field-input {
    background: var(--bg-card) !important;
    border: 1px solid var(--border) !important;
    color: var(--text) !important;
  }
  .field-input::placeholder { color: var(--text-muted) !important; }
  .field-input:focus {
    outline: none;
    border-color: var(--primary-hover) !important;
    box-shadow: 0 0 0 3px rgba(60, 102, 80, 0.14) !important;
  }

  .animal-dropdown.p-dropdown {
    background: var(--bg-card) !important;
    border: 1px solid var(--border) !important;
    border-radius: 0.5rem;
    width: 100%;
  }
  .animal-dropdown .p-dropdown-label {
    color: var(--text) !important;
    padding: 0.625rem 0.75rem;
    font-size: 0.875rem;
  }
  .animal-dropdown.p-dropdown.p-focus {
    border-color: var(--primary-hover) !important;
    box-shadow: 0 0 0 3px rgba(60, 102, 80, 0.14) !important;
  }
  .p-dropdown-panel {
    background: var(--bg-card) !important;
    border-color: var(--border) !important;
    color: var(--text) !important;
  }
  .p-dropdown-item { color: var(--text) !important; }
  .p-dropdown-item:hover,
  .p-dropdown-item.p-highlight {
    background: var(--bg-muted) !important;
    color: var(--text) !important;
  }

  .wv-tabs.p-tabview .p-tabview-nav {
    background: transparent;
    border-bottom: 1px solid var(--border) !important;
  }
  .wv-tabs.p-tabview .p-tabview-nav li .p-tabview-nav-link {
    background: transparent;
    border: none;
    color: var(--text-muted);
    font-weight: 500;
    padding: 0.75rem 1rem;
  }
  .wv-tabs.p-tabview .p-tabview-nav li .p-tabview-nav-link:not(.p-disabled):focus {
    box-shadow: none;
  }
  .wv-tabs.p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link {
    color: var(--primary);
    border-bottom: 2px solid var(--primary);
  }
  .wv-tabs.p-tabview .p-tabview-panels {
    background: transparent;
    padding: 1.25rem 0 0;
  }
`;

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

const formatNumber = (value, digits = 2) => {
  const n = Number(value);
  return Number.isNaN(n) ? "—" : n.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
};

// Lightweight dependency-free vertical bar chart (SVG/CSS).
function BarChart({ data, color, formatter, height = 170 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Scale size={22} style={{ color: "var(--text-muted)" }} />
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          No records to chart yet.
        </p>
      </div>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-3 overflow-x-auto pb-1">
      {data.map((d) => (
        <div
          key={d.label}
          className="flex min-w-[3rem] flex-col items-center justify-end"
        >
          <span className="mb-1 whitespace-nowrap text-xs font-semibold" style={{ color: "var(--text)" }}>
            {formatter ? formatter(d.value) : d.value}
          </span>
          <div
            className="w-8 rounded-t"
            style={{
              height: `${Math.max((d.value / max) * height, 4)}px`,
              backgroundColor: color || "var(--primary)",
              transition: "height 0.3s ease",
            }}
            title={d.label}
          />
          <span className="mt-1 truncate text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function WeightValuationPage() {
  const showToast = useToast();
  const { user } = useAuth();
  const canManage = user?.role === "owner" || user?.role === "manager";
  const canOwner = user?.role === "owner";


  // Animals
  const [animals, setAnimals] = useState([]);
  const [selectedAnimal, setSelectedAnimal] = useState(null);

  // Weights
  const [weights, setWeights] = useState([]);
  const [weightsLoading, setWeightsLoading] = useState(false);
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [editingWeight, setEditingWeight] = useState(null);
  const [savingWeight, setSavingWeight] = useState(false);
  const [weightFilter, setWeightFilter] = useState("");

  // Valuations
  const [valuations, setValuations] = useState([]);
  const [valuationsLoading, setValuationsLoading] = useState(false);
  const [valuationDialogOpen, setValuationDialogOpen] = useState(false);
  const [editingValuation, setEditingValuation] = useState(null);
  const [savingValuation, setSavingValuation] = useState(false);
  const [valuationFilter, setValuationFilter] = useState("");

  // Reports / overview
  const [herdValue, setHerdValue] = useState(null);
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  // PDF generation loading states
  const [growthPdfLoading, setGrowthPdfLoading] = useState(false);
  const [herdValuePdfLoading, setHerdValuePdfLoading] = useState(false);
  const [overviewPdfLoading, setOverviewPdfLoading] = useState(false);

  const fetchAnimals = useCallback(async () => {
    try {
      const res = await api.get("/animal/api/animals", { params: { limit: 100 } });
      setAnimals(res.data.data || []);
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail: err.response?.data?.message || "Could not load animals",
      });
    }
  }, [showToast]);

  useEffect(() => {
    fetchAnimals();
  }, [fetchAnimals]);

  const fetchWeights = useCallback(async (animalId) => {
    try {
      setWeightsLoading(true);
      const res = await api.get(`/weight/api/animals/${animalId}/weights`);
      setWeights(res.data.data || []);
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail: err.response?.data?.message || "Could not load weights",
      });
    } finally {
      setWeightsLoading(false);
    }
  }, [showToast]);

  const fetchValuations = useCallback(async (animalId) => {
    try {
      setValuationsLoading(true);
      const res = await api.get(`/weight/api/animals/${animalId}/valuations`);
      setValuations(res.data.data || []);
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail: err.response?.data?.message || "Could not load valuations",
      });
    } finally {
      setValuationsLoading(false);
    }
  }, [showToast]);

  const fetchHerdOverview = useCallback(async () => {
    try {
      setOverviewLoading(true);
      const res = await api.get("/weight/api/reports/herd-overview");
      setOverview(res.data.data);
      // Keep the legacy single-value report in sync as a fallback.
      setHerdValue({ total: res.data.data?.totalHerdValue ?? 0, count: res.data.data?.valuedAnimals ?? 0 });
    } catch {
      setOverview(null);
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAnimal) {
      fetchWeights(selectedAnimal.id);
      fetchValuations(selectedAnimal.id);
    }
  }, [selectedAnimal, fetchWeights, fetchValuations]);

  useEffect(() => {
    fetchHerdOverview();
  }, [fetchHerdOverview]);

  const handleAnimalChange = (animal) => {
    setSelectedAnimal(animal);
    setWeights([]);
    setValuations([]);
    if (animal) {
      fetchWeights(animal.id);
      fetchValuations(animal.id);
    }
  };

  const toastError = (err, fallback) =>
    err?.response?.data?.message || fallback;

  const handleGrowthTrendPdf = async () => {
    if (!selectedAnimal) {
      showToast({
        severity: "warn",
        summary: "Select an animal",
        detail: "Please select an animal to generate a growth trend report.",
      });
      return;
    }
    try {
      setGrowthPdfLoading(true);
      const res = await api.get("/weight/api/reports/weight/growth-trend", {
        params: { animal_id: selectedAnimal.id },
      });
      generateGrowthTrendPdf({
        animal: selectedAnimal,
        rows: res.data.data,
        generatedBy: user?.name,
      });
      showToast({ severity: "success", summary: "PDF ready", detail: "Growth trend PDF downloaded." });
    } catch (err) {
      showToast({
        severity: "error",
        summary: "PDF failed",
        detail: toastError(err, "Could not generate the growth trend report."),
      });
    } finally {
      setGrowthPdfLoading(false);
    }
  };

  const handleTotalHerdValuePdf = async () => {
    try {
      setHerdValuePdfLoading(true);
      const res = await api.get("/weight/api/reports/valuation/total-herd-value");
      generateTotalHerdValuePdf({ data: res.data.data, generatedBy: user?.name });
      showToast({ severity: "success", summary: "PDF ready", detail: "Total herd value PDF downloaded." });
    } catch (err) {
      showToast({
        severity: "error",
        summary: "PDF failed",
        detail: toastError(err, "Could not generate the total herd value report."),
      });
    } finally {
      setHerdValuePdfLoading(false);
    }
  };

  const handleHerdOverviewPdf = async () => {
    try {
      setOverviewPdfLoading(true);
      const res = await api.get("/weight/api/reports/herd-overview");
      generateHerdOverviewPdf({ data: res.data.data, generatedBy: user?.name });
      showToast({ severity: "success", summary: "PDF ready", detail: "Herd overview PDF downloaded." });
    } catch (err) {
      showToast({
        severity: "error",
        summary: "PDF failed",
        detail: toastError(err, "Could not generate the herd overview report."),
      });
    } finally {
      setOverviewPdfLoading(false);
    }
  };

  const openCreateWeight = () => {
    setEditingWeight(null);
    setWeightDialogOpen(true);
  };

  const openEditWeight = (row) => {
    setEditingWeight(row);
    setWeightDialogOpen(true);
  };

  const handleSubmitWeight = async (payload) => {
    try {
      setSavingWeight(true);
      if (editingWeight) {
        await api.put(`/weight/api/weights/${editingWeight.id}`, payload);
        showToast({ severity: "success", summary: "Updated", detail: "Weight record updated." });
      } else {
        await api.post(`/weight/api/animals/${selectedAnimal.id}/weights`, payload);
        showToast({ severity: "success", summary: "Logged", detail: "Weight recorded." });
      }
      setWeightDialogOpen(false);
      fetchWeights(selectedAnimal.id);
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Save failed",
        detail: err.response?.data?.message || "Something went wrong",
      });
    } finally {
      setSavingWeight(false);
    }
  };

  const confirmDeleteWeight = (row) => {
    confirmDialog({
      message: "Delete this weight record? This can't be undone.",
      header: "Confirm deletion",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "!bg-[var(--danger)] !border-[var(--danger)]",
      accept: async () => {
        try {
          await api.delete(`/weight/api/weights/${row.id}`);
          showToast({ severity: "success", summary: "Deleted", detail: "Weight record removed." });
          fetchWeights(selectedAnimal.id);
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

  const openCreateValuation = () => {
    setEditingValuation(null);
    setValuationDialogOpen(true);
  };

  const openEditValuation = (row) => {
    setEditingValuation(row);
    setValuationDialogOpen(true);
  };

  const handleSubmitValuation = async (payload) => {
    try {
      setSavingValuation(true);
      if (editingValuation) {
        await api.put(`/weight/api/valuations/${editingValuation.id}`, payload);
        showToast({ severity: "success", summary: "Updated", detail: "Valuation updated." });
      } else {
        await api.post(`/weight/api/animals/${selectedAnimal.id}/valuations`, payload);
        showToast({ severity: "success", summary: "Logged", detail: "Valuation recorded." });
      }
      setValuationDialogOpen(false);
      fetchValuations(selectedAnimal.id);
      fetchHerdOverview();
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Save failed",
        detail: err.response?.data?.message || "Something went wrong",
      });
    } finally {
      setSavingValuation(false);
    }
  };

  const confirmDeleteValuation = (row) => {
    confirmDialog({
      message: "Delete this valuation? This can't be undone.",
      header: "Confirm deletion",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "!bg-[var(--danger)] !border-[var(--danger)]",
      accept: async () => {
        try {
          await api.delete(`/weight/api/valuations/${row.id}`);
          showToast({ severity: "success", summary: "Deleted", detail: "Valuation removed." });
          fetchValuations(selectedAnimal.id);
          fetchHerdOverview();
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

  const weightActions = (row) => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => openEditWeight(row)}
        className="p-1.5 transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <Pencil size={16} />
      </button>
      <button
        onClick={() => confirmDeleteWeight(row)}
        className="p-1.5 transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  const valuationActions = (row) => (
    <div className="flex items-center gap-1">
      <button
        onClick={() => openEditValuation(row)}
        className="p-1.5 transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <Pencil size={16} />
      </button>
      <button
        onClick={() => confirmDeleteValuation(row)}
        className="p-1.5 transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );

  const latestWeight = weights[0];
  const latestValuation = valuations[0];

  const weightChartData = (overview?.animals || [])
    .filter((a) => a.latest_weight != null)
    .map((a) => ({ label: a.tag_number, value: a.latest_weight }));
  const valuationChartData = (overview?.animals || [])
    .filter((a) => a.latest_value != null)
    .map((a) => ({ label: a.tag_number, value: a.latest_value }));

  const animalOptionTemplate = (option) =>
    option ? (
      <div className="flex items-center gap-2">
        <span className="font-semibold">{option.tag_number}</span>
        {option.name && (
          <span style={{ color: "var(--text-muted)" }}>— {option.name}</span>
        )}
      </div>
    ) : null;

  return (
    <div className="font-sans">
      <style>{pageStyles}</style>

      <ConfirmDialog />

      <div className="mb-6">
        <h1
          className="font-display mb-1 text-2xl font-semibold"
          style={{ color: "var(--text-heading)" }}
        >
          Weight &amp; Valuation
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Track each animal&apos;s weight over time and keep its market value up to date.
        </p>
      </div>

      {/* Farm-wide summary cards — always visible */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {canOwner && (
        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Total Herd Value
          </p>
          <p className="mt-1 text-xl font-semibold" style={{ color: "var(--text-heading)" }}>
            {overview ? `Rs. ${formatNumber(overview.totalHerdValue)}` : "—"}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            {overview
              ? `${overview.valuedAnimals} animal${overview.valuedAnimals === 1 ? "" : "s"} valued`
              : overviewLoading
              ? "Loading…"
              : "Sum of latest valuations across the herd"}
          </p>
        </div>
        )}

        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Valued Animals
          </p>
          <p className="mt-1 text-xl font-semibold" style={{ color: "var(--text-heading)" }}>
            {overview ? `${overview.valuedAnimals} / ${overview.totalAnimals}` : "—"}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            {overview?.totalAnimals
              ? `${Math.round((overview.valuedAnimals / overview.totalAnimals) * 100)}% of the herd`
              : "of the herd have a valuation"}
          </p>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Weighted Animals
          </p>
          <p className="mt-1 text-xl font-semibold" style={{ color: "var(--text-heading)" }}>
            {overview ? `${overview.weightedAnimals} / ${overview.totalAnimals}` : "—"}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            {overview?.totalAnimals
              ? `${Math.round((overview.weightedAnimals / overview.totalAnimals) * 100)}% of the herd`
              : "of the herd have a weight record"}
          </p>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Avg Latest Weight
          </p>
          <p className="mt-1 text-xl font-semibold" style={{ color: "var(--text-heading)" }}>
            {overview?.avgLatestWeight != null
              ? `${formatNumber(overview.avgLatestWeight, 1)} kg`
              : "—"}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            {overview?.weightedAnimals
              ? `across ${overview.weightedAnimals} weighted animal${overview.weightedAnimals === 1 ? "" : "s"}`
              : "no weight records yet"}
          </p>
        </div>
      </div>

      {/* Progress charts — always visible */}
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <p className="mb-3 text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
            Latest Weight by Animal (kg)
          </p>
          <BarChart
            data={weightChartData}
            color="var(--primary)"
            formatter={(v) => `${formatNumber(v, 1)} kg`}
          />
        </div>

        {canOwner && (
        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <p className="mb-3 text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
            Latest Valuation by Animal (Rs.)
          </p>
          <BarChart
            data={valuationChartData}
            color="var(--primary-hover)"
            formatter={(v) => `Rs. ${formatNumber(v, 0)}`}
          />
        </div>
        )}
      </div>

      {/* Reports / PDF downloads */}
      <div className="mb-6 rounded-xl border p-4" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
        <div className="mb-1 flex items-center gap-2">
          <FileDown size={18} style={{ color: "var(--primary)" }} />
          <h2 className="font-display text-lg font-semibold" style={{ color: "var(--text-heading)" }}>
            Reports
          </h2>
        </div>
        <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
          Generate a beautiful PDF for each farm report.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Button
            label={growthPdfLoading ? "Generating…" : "Growth Trend"}
            icon={<FileDown size={15} className="mr-1.5" />}
            loading={growthPdfLoading}
            disabled={!selectedAnimal}
            onClick={handleGrowthTrendPdf}
            className="!justify-start !rounded-lg !px-4 !py-2.5 !text-sm !font-semibold !text-white"
            style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
            tooltip={selectedAnimal ? undefined : "Select an animal first"}
            tooltipOptions={{ position: "top" }}
          />
        {canOwner && (
          <Button
            label={herdValuePdfLoading ? "Generating…" : "Total Herd Value"}
            icon={<FileDown size={15} className="mr-1.5" />}
            loading={herdValuePdfLoading}
            onClick={handleTotalHerdValuePdf}
            className="!justify-start !rounded-lg !px-4 !py-2.5 !text-sm !font-semibold !text-white"
            style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
          />
          )}
        {canOwner && (
          <Button
            label={overviewPdfLoading ? "Generating…" : "Herd Overview"}
            icon={<FileDown size={15} className="mr-1.5" />}
            loading={overviewPdfLoading}
            onClick={handleHerdOverviewPdf}
            className="!justify-start !rounded-lg !px-4 !py-2.5 !text-sm !font-semibold !text-white"
            style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
          />
        )}
        </div>
      </div>


      {/* Animal records section */}
      <div className="mb-5 border-t pt-6">
        <h2
          className="font-display mb-1 text-lg font-semibold"
          style={{ color: "var(--text-heading)" }}
        >
          Animal Records
        </h2>
        <p className="mb-3 text-sm" style={{ color: "var(--text-muted)" }}>
          Select an animal to view and manage its weight &amp; valuation history.
        </p>
        <div className="max-w-md">
          <Dropdown
            value={selectedAnimal}
            onChange={(e) => handleAnimalChange(e.value)}
            options={animals}
            optionLabel="tag_number"
            itemTemplate={animalOptionTemplate}
            placeholder="Select an animal…"
            showClear
            filter
            filterBy="tag_number,name"
            filterPlaceholder="Search by tag or name"
            className="animal-dropdown"
          />
        </div>
      </div>

      {selectedAnimal ? (
        <TabView className="wv-tabs">
          <TabPanel header="Weights">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Body weight history for {selectedAnimal.tag_number}.
              </p>
              {canManage && (
                <Button
                  label="Log Weight"
                  icon={<Plus size={16} className="mr-1.5" />}
                  onClick={openCreateWeight}
                  className="!rounded-lg !px-4 !py-2 !text-sm !font-semibold !text-white"
                  style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
                />
              )}
            </div>

            <div className="mb-4 max-w-xs">
              <InputText
                value={weightFilter}
                onChange={(e) => setWeightFilter(e.target.value)}
                placeholder="Search weights…"
                className="field-input w-full rounded-lg py-2.5 pl-3 pr-3 text-sm"
              />
            </div>

            <DataTable
              value={weights}
              loading={weightsLoading}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25]}
              globalFilter={weightFilter}
              globalFilterFields={["weight_kg", "source", "notes"]}
              emptyMessage="No weights logged yet for this animal."
            >
              <Column
                field="weight_kg"
                header="Weight (kg)"
                sortable
                body={(row) => formatNumber(row.weight_kg, 1)}
              />
              <Column
                field="effective_from"
                header="Date"
                sortable
                body={(row) => formatDate(row.effective_from)}
              />
              <Column
                field="source"
                header="Source"
                sortable
                body={(row) => row.source || "—"}
              />
              <Column
                field="notes"
                header="Notes"
                body={(row) => row.notes || "—"}
              />
              {canManage && (
                <Column header="Actions" style={{ width: "100px" }} body={weightActions} />
              )}
            </DataTable>
          </TabPanel>

          <TabPanel header="Valuations">
            <div className="mb-4 flex items-center justify-between gap-3">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Market value history for {selectedAnimal.tag_number}.
              </p>
              {canManage && (
                <Button
                  label="Log Valuation"
                  icon={<Plus size={16} className="mr-1.5" />}
                  onClick={openCreateValuation}
                  className="!rounded-lg !px-4 !py-2 !text-sm !font-semibold !text-white"
                  style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
                />
              )}
            </div>

            <div className="mb-4 max-w-xs">
              <InputText
                value={valuationFilter}
                onChange={(e) => setValuationFilter(e.target.value)}
                placeholder="Search valuations…"
                className="field-input w-full rounded-lg py-2.5 pl-3 pr-3 text-sm"
              />
            </div>

            <DataTable
              value={valuations}
              loading={valuationsLoading}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 25]}
              globalFilter={valuationFilter}
              globalFilterFields={["value_amount", "basis", "notes"]}
              emptyMessage="No valuations logged yet for this animal."
            >
              <Column
                field="value_amount"
                header="Value (Rs.)"
                sortable
                body={(row) => `Rs. ${formatNumber(row.value_amount)}`}
              />
              <Column
                field="effective_from"
                header="Date"
                sortable
                body={(row) => formatDate(row.effective_from)}
              />
              <Column
                field="basis"
                header="Basis"
                sortable
                body={(row) => row.basis || "—"}
              />
              <Column
                field="notes"
                header="Notes"
                body={(row) => row.notes || "—"}
              />
              {canManage && (
                <Column header="Actions" style={{ width: "100px" }} body={valuationActions} />
              )}
            </DataTable>
          </TabPanel>
        </TabView>
      ) : null}

      <LogWeightDialog
        visible={weightDialogOpen}
        onHide={() => setWeightDialogOpen(false)}
        saving={savingWeight}
        initial={editingWeight}
        onSubmitForm={handleSubmitWeight}
      />
      <LogValuationDialog
        visible={valuationDialogOpen}
        onHide={() => setValuationDialogOpen(false)}
        saving={savingValuation}
        initial={editingValuation}
        onSubmitForm={handleSubmitValuation}
      />
    </div>
  );
}

export default WeightValuationPage;
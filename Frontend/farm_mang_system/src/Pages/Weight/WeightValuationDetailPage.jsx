import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { TabView, TabPanel } from "primereact/tabview";
import {
  ArrowLeft,
  Scale,
  Banknote,
  Plus,
  Pencil,
  Trash2,
  FileDown,
} from "lucide-react";
import api from "../../apis/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { LogWeightDialog, LogValuationDialog } from "./WeightValuation";
import { generateGrowthTrendPdf } from "../../utils/reportPdf";

const pageStyles = `
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
  return Number.isNaN(n)
    ? "—"
    : n.toLocaleString(undefined, {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      });
};

// Movement against the previous (older) record, e.g. "▲ 4.5 kg".
function Delta({ current, previous, unit = "", digits = 1 }) {
  if (current == null || previous == null) {
    return <span style={{ color: "var(--text-muted)" }}>—</span>;
  }
  const diff = Number(current) - Number(previous);
  if (Number.isNaN(diff) || diff === 0) {
    return <span style={{ color: "var(--text-muted)" }}>no change</span>;
  }
  const up = diff > 0;
  return (
    <span
      className="font-medium"
      style={{ color: up ? "var(--success)" : "var(--danger)" }}
    >
      {up ? "▲" : "▼"} {formatNumber(Math.abs(diff), digits)}
      {unit ? ` ${unit}` : ""}
    </span>
  );
}

const toastError = (err, fallback) => err?.response?.data?.message || fallback;

function WeightValuationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const { user } = useAuth();
  const canManage = user?.role === "owner" || user?.role === "manager";

  const [animal, setAnimal] = useState(null);
  const [animalLoading, setAnimalLoading] = useState(true);

  // Complete weight log for this animal (newest first).
  const [weights, setWeights] = useState([]);
  const [weightsLoading, setWeightsLoading] = useState(false);
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [editingWeight, setEditingWeight] = useState(null);
  const [savingWeight, setSavingWeight] = useState(false);
  const [weightFilter, setWeightFilter] = useState("");

  // Complete valuation log for this animal (newest first).
  const [valuations, setValuations] = useState([]);
  const [valuationsLoading, setValuationsLoading] = useState(false);
  const [valuationDialogOpen, setValuationDialogOpen] = useState(false);
  const [editingValuation, setEditingValuation] = useState(null);
  const [savingValuation, setSavingValuation] = useState(false);
  const [valuationFilter, setValuationFilter] = useState("");

  const [growthPdfLoading, setGrowthPdfLoading] = useState(false);

  const fetchAnimal = useCallback(async () => {
    try {
      setAnimalLoading(true);
      const res = await api.get(`/animal/api/animals/${id}`);
      setAnimal(res.data.data || null);
    } catch (err) {
      setAnimal(null);
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail: toastError(err, "Could not load this animal"),
      });
    } finally {
      setAnimalLoading(false);
    }
  }, [id, showToast]);

  const fetchWeights = useCallback(async () => {
    try {
      setWeightsLoading(true);
      const res = await api.get(`/weight/api/animals/${id}/weights`);
      setWeights(res.data.data || []);
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail: toastError(err, "Could not load the weight history"),
      });
    } finally {
      setWeightsLoading(false);
    }
  }, [id, showToast]);

  const fetchValuations = useCallback(async () => {
    try {
      setValuationsLoading(true);
      const res = await api.get(`/weight/api/animals/${id}/valuations`);
      setValuations(res.data.data || []);
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail: toastError(err, "Could not load the valuation history"),
      });
    } finally {
      setValuationsLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    if (!id) return;
    fetchAnimal();
    fetchWeights();
    fetchValuations();
  }, [id, fetchAnimal, fetchWeights, fetchValuations]);

  // ── Weight log actions ─────────────────────────────────────
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
        await api.post(`/weight/api/animals/${id}/weights`, payload);
        showToast({ severity: "success", summary: "Logged", detail: "Weight recorded." });
      }
      setWeightDialogOpen(false);
      await fetchWeights();
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Save failed",
        detail: toastError(err, "Something went wrong"),
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
          await fetchWeights();
        } catch (err) {
          showToast({
            severity: "error",
            summary: "Delete failed",
            detail: toastError(err, "Could not delete this record"),
          });
        }
      },
    });
  };

  // ── Valuation log actions ──────────────────────────────────
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
        await api.post(`/weight/api/animals/${id}/valuations`, payload);
        showToast({ severity: "success", summary: "Logged", detail: "Valuation recorded." });
      }
      setValuationDialogOpen(false);
      await fetchValuations();
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Save failed",
        detail: toastError(err, "Something went wrong"),
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
          await fetchValuations();
        } catch (err) {
          showToast({
            severity: "error",
            summary: "Delete failed",
            detail: toastError(err, "Could not delete this record"),
          });
        }
      },
    });
  };

  // ── Growth trend PDF (used by the report card below) ───────
  const handleGrowthTrendPdf = async () => {
    try {
      setGrowthPdfLoading(true);
      const res = await api.get("/weight/api/reports/weight/growth-trend", {
        params: { animal_id: id },
      });
      generateGrowthTrendPdf({
        animal: animal || { tag_number: id, name: "" },
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

  // ── Derived values (both logs arrive newest first) ─────────
  const latestWeight = weights[0] || null;
  const previousWeight = weights[1] || null;
  const latestValuation = valuations[0] || null;
  const previousValuation = valuations[1] || null;

  const weightActions = (row) => (
    <div className="flex items-center gap-1">
      <button
        title="Edit this weight"
        onClick={() => openEditWeight(row)}
        className="p-1.5 transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <Pencil size={16} />
      </button>
      <button
        title="Delete this weight"
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
        title="Edit this valuation"
        onClick={() => openEditValuation(row)}
        className="p-1.5 transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <Pencil size={16} />
      </button>
      <button
        title="Delete this valuation"
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

  const animalTitle = animal
    ? [animal.tag_number, animal.name].filter(Boolean).join(" — ")
    : `Animal #${id}`;

  return (
    <div className="font-sans">
      <style>{pageStyles}</style>

      <ConfirmDialog />

      <button
        onClick={() => navigate("/weight")}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
        style={{ color: "var(--text-muted)" }}
      >
        <ArrowLeft size={16} /> Back to Weight &amp; Valuation
      </button>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1
            className="font-display mb-1 text-2xl font-semibold"
            style={{ color: "var(--text-heading)" }}
          >
            {animalLoading ? "Loading…" : animalTitle}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Complete history — every weight and valuation with the date it applies from.
          </p>
          {animal && (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              {[animal.animalType?.name, animal.breed?.name, animal.gender?.name]
                .filter(Boolean)
                .map((label) => (
                  <span
                    key={label}
                    className="rounded-full px-2.5 py-0.5 font-medium"
                    style={{
                      backgroundColor:
                        "color-mix(in srgb, var(--primary) 12%, transparent)",
                      color: "var(--primary)",
                    }}
                  >
                    {label}
                  </span>
                ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            label={growthPdfLoading ? "Generating…" : "Growth Trend PDF"}
            icon={<FileDown size={15} className="mr-1.5" />}
            loading={growthPdfLoading}
            onClick={handleGrowthTrendPdf}
            disabled={!animal}
            className="!rounded-lg !px-4 !py-2.5 !text-sm !font-semibold !text-white"
            style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
          />
          {canManage && (
            <>
              <Button
                label="Log Weight"
                icon={<Plus size={16} className="mr-1.5" />}
                onClick={openCreateWeight}
                className="!rounded-lg !px-4 !py-2.5 !text-sm !font-semibold"
                style={{
                  backgroundColor: "var(--bg-muted)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              />
              <Button
                label="Log Valuation"
                icon={<Banknote size={16} className="mr-1.5" />}
                onClick={openCreateValuation}
                className="!rounded-lg !px-4 !py-2.5 !text-sm !font-semibold"
                style={{
                  backgroundColor: "var(--bg-muted)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Current position, with movement against the previous record */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Current Weight
          </p>
          <p
            className="mt-1 flex items-center gap-2 text-xl font-semibold"
            style={{ color: "var(--text-heading)" }}
          >
            <Scale size={18} style={{ color: "var(--primary)" }} />
            {latestWeight ? `${formatNumber(latestWeight.weight_kg, 1)} kg` : "—"}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            {latestWeight
              ? `as of ${formatDate(latestWeight.effective_from)}`
              : "no weight recorded yet"}
          </p>
          <p className="mt-1 text-xs">
            <Delta
              current={latestWeight?.weight_kg}
              previous={previousWeight?.weight_kg}
              unit="kg"
            />
          </p>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Current Valuation
          </p>
          <p
            className="mt-1 flex items-center gap-2 text-xl font-semibold"
            style={{ color: "var(--text-heading)" }}
          >
            <Banknote size={18} style={{ color: "var(--primary)" }} />
            {latestValuation ? `Rs. ${formatNumber(latestValuation.value_amount)}` : "—"}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            {latestValuation
              ? `as of ${formatDate(latestValuation.effective_from)}`
              : "no valuation recorded yet"}
          </p>
          <p className="mt-1 text-xs">
            <Delta
              current={latestValuation?.value_amount}
              previous={previousValuation?.value_amount}
              digits={0}
            />
          </p>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            Log Entries
          </p>
          <p className="mt-1 text-xl font-semibold" style={{ color: "var(--text-heading)" }}>
            {weights.length} / {valuations.length}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
            weight and valuation records on file
          </p>
        </div>
      </div>

      {/* Complete history logs */}
      <TabView className="wv-tabs">
        <TabPanel header={`Weight log (${weights.length})`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Every recorded weight for {animal?.tag_number || "this animal"}, newest first.
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
              header="#"
              style={{ width: "3rem" }}
              body={(_, opts) => opts.rowIndex + 1}
            />
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
              header="Change"
              body={(row, opts) => (
                <Delta
                  current={row.weight_kg}
                  previous={weights[opts.rowIndex + 1]?.weight_kg}
                  unit="kg"
                />
              )}
            />
            <Column
              field="source"
              header="Source"
              sortable
              body={(row) => row.source || "—"}
            />
            <Column field="notes" header="Notes" body={(row) => row.notes || "—"} />
            {canManage && (
              <Column header="Actions" style={{ width: "100px" }} body={weightActions} />
            )}
          </DataTable>
        </TabPanel>

        <TabPanel header={`Valuation log (${valuations.length})`}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Every recorded valuation for {animal?.tag_number || "this animal"}, newest first.
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
              header="#"
              style={{ width: "3rem" }}
              body={(_, opts) => opts.rowIndex + 1}
            />
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
              header="Change"
              body={(row, opts) => (
                <Delta
                  current={row.value_amount}
                  previous={valuations[opts.rowIndex + 1]?.value_amount}
                  digits={0}
                />
              )}
            />
            <Column
              field="basis"
              header="Basis"
              sortable
              body={(row) => row.basis || "—"}
            />
            <Column field="notes" header="Notes" body={(row) => row.notes || "—"} />
            {canManage && (
              <Column header="Actions" style={{ width: "100px" }} body={valuationActions} />
            )}
          </DataTable>
        </TabPanel>
      </TabView>

      <LogWeightDialog
        visible={weightDialogOpen}
        onHide={() => setWeightDialogOpen(false)}
        saving={savingWeight}
        initial={editingWeight}
        animalLabel={animal?.tag_number}
        onSubmitForm={handleSubmitWeight}
      />
      <LogValuationDialog
        visible={valuationDialogOpen}
        onHide={() => setValuationDialogOpen(false)}
        saving={savingValuation}
        initial={editingValuation}
        animalLabel={animal?.tag_number}
        onSubmitForm={handleSubmitValuation}
      />
    </div>
  );
}

export default WeightValuationDetailPage;

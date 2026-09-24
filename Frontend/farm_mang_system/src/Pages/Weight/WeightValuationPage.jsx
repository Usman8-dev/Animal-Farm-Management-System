import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Scale, FileDown, Banknote, History } from "lucide-react";
import api from "../../apis/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { LogWeightDialog, LogValuationDialog } from "./WeightValuation";
import {
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
  const navigate = useNavigate();

  // Herd-wide overview: a single API call returns every animal on the farm with
  // its latest weight, latest valuation and the dates those were recorded on.
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [animalFilter, setAnimalFilter] = useState("");

  // Quick-log dialogs in the listing work against the clicked row.
  const [logTarget, setLogTarget] = useState(null);
  const [logKind, setLogKind] = useState(null); // "weight" | "valuation"
  const [savingWeight, setSavingWeight] = useState(false);
  const [savingValuation, setSavingValuation] = useState(false);

  // PDF generation loading states
  const [herdValuePdfLoading, setHerdValuePdfLoading] = useState(false);
  const [overviewPdfLoading, setOverviewPdfLoading] = useState(false);

  // One request feeds the whole listing: every animal on the farm with its latest
  // weight, latest valuation and the dates they were recorded, so users never have
  // to look animals up one by one.
  const fetchHerdOverview = useCallback(async () => {
    try {
      setOverviewLoading(true);
      const res = await api.get("/weight/api/reports/herd-overview");
      setOverview(res.data.data);
    } catch (err) {
      setOverview(null);
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail: err.response?.data?.message || "Could not load the herd overview",
      });
    } finally {
      setOverviewLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchHerdOverview();
  }, [fetchHerdOverview]);

  const rows = overview?.animals || [];

  // Quick-log dialogs open already scoped to the clicked animal.
  const openLogWeight = (animal) => {
    setLogTarget(animal);
    setLogKind("weight");
  };

  const openLogValuation = (animal) => {
    setLogTarget(animal);
    setLogKind("valuation");
  };

  const closeLogDialog = () => {
    setLogKind(null);
    setLogTarget(null);
  };

  const handleSubmitWeight = async (payload) => {
    try {
      setSavingWeight(true);
      await api.post(`/weight/api/animals/${logTarget.animal_id}/weights`, payload);
      showToast({ severity: "success", summary: "Logged", detail: "Weight recorded." });
      closeLogDialog();
      await fetchHerdOverview();
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

  const handleSubmitValuation = async (payload) => {
    try {
      setSavingValuation(true);
      await api.post(`/weight/api/animals/${logTarget.animal_id}/valuations`, payload);
      showToast({ severity: "success", summary: "Logged", detail: "Valuation recorded." });
      closeLogDialog();
      await fetchHerdOverview();
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

  const toastError = (err, fallback) =>
    err?.response?.data?.message || fallback;

  // Growth Trend PDF moved to the animal history page, where an animal is
  // already in context (no need to select one first).
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

  // Listing row actions — log straight from the table, or open the animal's
  // full history page.
  const animalActions = (row) => (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      {canManage && (
        <>
          <button
            title="Log weight"
            onClick={() => openLogWeight(row)}
            className="p-1.5 transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <Scale size={16} />
          </button>
          <button
            title="Log valuation"
            onClick={() => openLogValuation(row)}
            className="p-1.5 transition-colors"
            style={{ color: "var(--text-muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
          >
            <Banknote size={16} />
          </button>
        </>
      )}
      <button
        title="View weight &amp; valuation history"
        onClick={() => navigate(`/weight/animals/${row.animal_id}`)}
        className="p-1.5 transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <History size={16} />
      </button>
    </div>
  );

  // Editing and deleting individual records happens on the animal history page
  // (/weight/animals/:id) — this listing only logs new entries.



  const weightChartData = (overview?.animals || [])
    .filter((a) => a.latest_weight != null)
    .map((a) => ({ label: a.tag_number, value: a.latest_weight }));
  const valuationChartData = (overview?.animals || [])
    .filter((a) => a.latest_value != null)
    .map((a) => ({ label: a.tag_number, value: a.latest_value }));

  // List rows are rendering plain herd-overview entries — nothing else to map here.

  return (
    <div className="font-sans">
      <style>{pageStyles}</style>

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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Growth Trend is per animal, so it moved to the animal's history page —
              open it by clicking a row in the table above. */}
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


      {/* Herd-wide listing — every animal with its current weight & valuation, so
          nobody has to look animals up one by one. */}
      <div className="mb-5 border-t pt-6">
        <h2
          className="font-display mb-1 text-lg font-semibold"
          style={{ color: "var(--text-heading)" }}
        >
          Animal Records
        </h2>
        <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
          Every animal on the farm with its current weight and valuation. Click a row for the
          complete log of previous weights, valuations and their dates.
        </p>

        <div className="mb-4 max-w-xs">
          <InputText
            value={animalFilter}
            onChange={(e) => setAnimalFilter(e.target.value)}
            placeholder="Search by tag or name…"
            className="field-input w-full rounded-lg py-2.5 pl-3 pr-3 text-sm"
          />
        </div>

        <DataTable
          value={rows}
          loading={overviewLoading}
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25, 100]}
          globalFilter={animalFilter}
          globalFilterFields={["tag_number", "name"]}
          emptyMessage="No animals registered yet."
          onRowClick={(e) => navigate(`/weight/animals/${e.data.animal_id}`)}
          rowClassName={() => "cursor-pointer"}
        >
          <Column
            field="name"
            header="Name"
            sortable
            body={(row) => row.name || "—"}
          />
          <Column
            field="tag_number"
            header="Tag #"
            sortable
            style={{ width: "14%" }}
          />
          <Column
            header="Current Weight"
            sortable
            sortField="latest_weight"
            style={{ width: "18%" }}
            body={(row) => (
              <div>
                <span>
                  {row.latest_weight != null
                    ? `${formatNumber(row.latest_weight, 1)} kg`
                    : "—"}
                </span>
                <p className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
                  {row.latest_weight != null
                    ? `as of ${formatDate(row.latest_weight_date)}`
                    : "no weight recorded"}
                </p>
              </div>
            )}
          />
          <Column
            header="Current Valuation"
            sortable
            sortField="latest_value"
            style={{ width: "18%" }}
            body={(row) => (
              <div>
                <span>
                  {row.latest_value != null
                    ? `Rs. ${formatNumber(row.latest_value)}`
                    : "—"}
                </span>
                <p className="text-[0.7rem]" style={{ color: "var(--text-muted)" }}>
                  {row.latest_value != null
                    ? `as of ${formatDate(row.latest_value_date)}`
                    : "no valuation recorded"}
                </p>
              </div>
            )}
          />
          <Column header="Actions" style={{ width: "130px" }} body={animalActions} />
        </DataTable>
      </div>


      <LogWeightDialog
        visible={logKind === "weight"}
        onHide={closeLogDialog}
        saving={savingWeight}
        initial={null}
        animalLabel={logTarget?.tag_number}
        onSubmitForm={handleSubmitWeight}
      />
      <LogValuationDialog
        visible={logKind === "valuation"}
        onHide={closeLogDialog}
        saving={savingValuation}
        initial={null}
        animalLabel={logTarget?.tag_number}
        onSubmitForm={handleSubmitValuation}
      />
    </div>
  );
}

export default WeightValuationPage;

import { useEffect, useState, useCallback } from "react";
import { Dropdown } from "primereact/dropdown";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { TabView, TabPanel } from "primereact/tabview";
import { Scale, Plus, Pencil, Trash2 } from "lucide-react";
import api from "../../apis/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { LogWeightDialog, LogValuationDialog } from "./WeightValuation";

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

function WeightValuationPage() {
  const showToast = useToast();
  const { user } = useAuth();
  const canManage = user?.role === "owner" || user?.role === "manager";

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

  // Reports
  const [herdValue, setHerdValue] = useState(null);

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

  const fetchHerdValue = useCallback(async () => {
    try {
      const res = await api.get("/weight/api/reports/valuation/total-herd-value");
      setHerdValue(res.data.data);
    } catch {
      setHerdValue(null);
    }
  }, []);

  useEffect(() => {
    if (selectedAnimal) {
      fetchWeights(selectedAnimal.id);
      fetchValuations(selectedAnimal.id);
    }
  }, [selectedAnimal, fetchWeights, fetchValuations]);

  useEffect(() => {
    fetchHerdValue();
  }, [fetchHerdValue]);

  const handleAnimalChange = (animal) => {
    setSelectedAnimal(animal);
    setWeights([]);
    setValuations([]);
    if (animal) {
      fetchWeights(animal.id);
      fetchValuations(animal.id);
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
      fetchHerdValue();
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
          fetchHerdValue();
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

      <div className="mb-5 max-w-md">
        <label className="mb-1.5 block text-[0.8rem] font-semibold" style={{ color: "var(--text)" }}>
          Animal
        </label>
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

      {selectedAnimal && (
        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Latest Weight
            </p>
            <p className="mt-1 text-xl font-semibold" style={{ color: "var(--text-heading)" }}>
              {latestWeight ? `${formatNumber(latestWeight.weight_kg, 1)} kg` : "—"}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
              {latestWeight ? formatDate(latestWeight.effective_from) : "No weight logged yet"}
            </p>
          </div>

          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Latest Valuation
            </p>
            <p className="mt-1 text-xl font-semibold" style={{ color: "var(--text-heading)" }}>
              {latestValuation ? `Rs. ${formatNumber(latestValuation.value_amount)}` : "—"}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
              {latestValuation ? formatDate(latestValuation.effective_from) : "No valuation logged yet"}
            </p>
          </div>

          <div
            className="rounded-xl border p-4"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Total Herd Value
            </p>
            <p className="mt-1 text-xl font-semibold" style={{ color: "var(--text-heading)" }}>
              {herdValue ? `Rs. ${formatNumber(herdValue.total)}` : "—"}
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
              {herdValue?.count != null
                ? `${herdValue.count} animal${herdValue.count === 1 ? "" : "s"} valued`
                : "Sum of latest valuations across the herd"}
            </p>
          </div>
        </div>
      )}

      {!selectedAnimal ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center"
          style={{ borderColor: "var(--border)" }}
        >
          <Scale size={36} style={{ color: "var(--text-muted)" }} />
          <p className="mt-3 text-sm font-medium" style={{ color: "var(--text-heading)" }}>
            Select an animal to view its records
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Weight history and valuations are stored per animal.
          </p>
        </div>
      ) : (
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
                header="Value ($)"
                sortable
                body={(row) => `$${formatNumber(row.value_amount)}`}
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
      )}

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
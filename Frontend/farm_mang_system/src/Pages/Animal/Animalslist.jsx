import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Pencil, Trash2, Plus, Search, Eye } from "lucide-react";
import api from "../../apis/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import AnimalFormDialog from "./Animalformdialog";

function AnimalsList() {
  const showToast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
   const canManage =
    user?.role === "owner" || user?.role === "manager";
  const canDelete = user?.role === "owner";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");

  const [animalTypes, setAnimalTypes] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [genders, setGenders] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchAnimals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/animal/api/animals", {
        params: { limit: 50 },
      });
      setRows(res.data.data);
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail: err.response?.data?.message || "Could not load animals",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchRefData = useCallback(async () => {
    try {
      const [typesRes, breedsRes, gendersRes] = await Promise.all([
        api.get("/animal/api/animal-types"),
        api.get("/animal/api/breeds"),
        api.get("/animal/api/genders"),
      ]);
      setAnimalTypes(typesRes.data.data);
      setBreeds(breedsRes.data.data);
      setGenders(gendersRes.data.data);
    } catch {
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail: "Could not load reference data",
      });
    }
  }, [showToast]);

  useEffect(() => {
    fetchAnimals();
    fetchRefData();
  }, [fetchAnimals, fetchRefData]);

  const openCreate = () => {
    setEditingAnimal(null);
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditingAnimal(row);
    setDialogOpen(true);
  };

  const handleSubmitForm = async (payload, editingId) => {
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/animal/api/animals/${editingId}`, payload);
        showToast({
          severity: "success",
          summary: "Updated",
          detail: "Animal updated.",
        });
      } else {
        await api.post("/animal/api/animals", payload);
        showToast({
          severity: "success",
          summary: "Created",
          detail: "Animal registered.",
        });
      }
      setDialogOpen(false);
      fetchAnimals();
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Save failed",
        detail:
          err.response?.data?.message ||
          err.response?.data?.errors?.[0] ||
          "Something went wrong",
      });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (row) => {
    confirmDialog({
      message: `Delete "${row.tag_number}"? This can't be undone.`,
      header: "Confirm deletion",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "!bg-[var(--danger)] !border-[var(--danger)]",
      accept: async () => {
        try {
          await api.delete(`/animal/api/animals/${row.id}`);
          showToast({
            severity: "success",
            summary: "Deleted",
            detail: "Animal removed.",
          });
          fetchAnimals();
        } catch (err) {
          showToast({
            severity: "error",
            summary: "Delete failed",
            detail:
              err.response?.data?.message || "Could not delete this animal",
          });
        }
      },
    });
  };

  return (
    <div className="font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Fraunces', serif; }

        .p-datatable .p-datatable-thead > tr > th {
          background: var(--bg-muted);
          color: var(--text-muted);
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          border-color: var(--border);
          padding: 0.75rem 1rem;
        }
        .p-datatable .p-datatable-tbody > tr > td {
          border-color: var(--border);
          padding: 0.75rem 1rem;
          font-size: 0.88rem;
          color: var(--text);
          background: var(--bg-card);
        }
        .p-datatable .p-datatable-tbody > tr:hover > td {
          background: var(--bg-muted);
        }
        .p-datatable .p-datatable-tbody > tr {
          background: var(--bg-card);
        }
        .p-datatable {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          overflow: hidden;
        }
       /* Paginator */
.p-paginator {
  background: transparent !important;
  border: none !important;
  padding-top: 1rem;
  color: var(--text-muted) !important;
}

.p-paginator .p-paginator-page,
.p-paginator .p-paginator-prev,
.p-paginator .p-paginator-next,
.p-paginator .p-paginator-first,
.p-paginator .p-paginator-last,
.p-paginator .p-dropdown,
.p-paginator .p-dropdown-label {
  background: var(--bg-card) !important;
  color: var(--text) !important;
  border-color: var(--border) !important;
}

.p-paginator .p-highlight {
  background: var(--primary) !important;
  border-color: var(--primary) !important;
  color: #fff !important;
}
        .field-input {
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text);
        }
        .field-input::placeholder {
          color: var(--text-muted);
        }
        .field-input:focus {
          outline: none;
          border-color: var(--primary-hover) !important;
          box-shadow: 0 0 0 3px rgba(60, 102, 80, 0.14) !important;
        }
        html.dark .field-input:focus {
          box-shadow: 0 0 0 3px rgba(74, 124, 98, 0.25) !important;
        }
      `}</style>

      <ConfirmDialog />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1
            className="font-display mb-1 text-2xl font-semibold"
            style={{ color: "var(--text-heading)" }}
          >
            Animals
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            All animals registered on your farm.
          </p>
        </div>

        {canManage && (

          <Button
            label="Add Animal"
            icon={<Plus size={16} className="mr-1.5" />}
            onClick={openCreate}
            className="!rounded-lg !px-4 !py-2 !text-sm !font-semibold !text-white"
            style={{
              backgroundColor: "var(--primary)",
              borderColor: "var(--primary)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "var(--primary-hover)";
              e.currentTarget.style.borderColor = "var(--primary-hover)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "var(--primary)";
              e.currentTarget.style.borderColor = "var(--primary)";
            }}
          />
        )}

      </div>

      <div className="relative mb-4 max-w-xs">
        {/* <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }}
        /> */}
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search by tag or name…"
          className="field-input w-full rounded-lg py-2.5 pl-9 pr-3 text-sm"
        />
      </div>

      <DataTable
        value={rows}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 100]}
        globalFilter={globalFilter}
        globalFilterFields={["tag_number", "name"]}
        emptyMessage="No animals registered yet."
        onRowClick={(e) => navigate(`/animals/${e.data.id}`)}
        rowClassName={() => "cursor-pointer"}
      >
        <Column
          field="tag_number"
          header="Tag #"
          sortable
          style={{ width: "12%" }}
        />
        <Column
          field="name"
          header="Name"
          sortable
          body={(row) => row.name || "—"}
        />
        <Column
          field="animalType.name"
          header="Type"
          sortable
          style={{ width: "14%" }}
        />
        <Column
          field="breed.name"
          header="Breed"
          sortable
          style={{ width: "14%" }}
        />
        <Column
          field="gender.name"
          header="Gender"
          sortable
          style={{ width: "12%" }}
        />
        <Column
          field="acquisition_type"
          header="Acquired"
          sortable
          style={{ width: "14%" }}
          body={(row) => (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={
                row.acquisition_type === "BORN_IN_FARM"
                  ? {
                      backgroundColor:
                        "color-mix(in srgb, var(--primary) 12%, transparent)",
                      color: "var(--primary)",
                    }
                  : {
                      backgroundColor: "rgba(201, 162, 39, 0.15)",
                      color: "#8a6d1a",
                    }
              }
            >
              {row.acquisition_type === "BORN_IN_FARM"
                ? "Born in Farm"
                : "Purchased"}
            </span>
          )}
        />
        <Column
          header="Actions"
          style={{ width: "110px" }}
          body={(row) => (
            <div
              className="flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => navigate(`/animals/${row.id}`)}
                className="p-1.5 transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-muted)")
                }
              >
                <Eye size={16} />
              </button>
              
            {canManage && (

              <button
                onClick={() => openEdit(row)}
                className="p-1.5 transition-colors"
                style={{ color: "var(--text-muted)" }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--text-muted)")
                }
              >
                <Pencil size={16} />
              </button>
             )}

              {canDelete && (
                <button
                  onClick={() => confirmDelete(row)}
                  className="p-1.5 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "var(--danger)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "var(--text-muted)")
                  }
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}
        />
      </DataTable>

      <AnimalFormDialog
        visible={dialogOpen}
        onHide={() => setDialogOpen(false)}
        editingAnimal={editingAnimal}
        animalTypes={animalTypes}
        breeds={breeds}
        genders={genders}
        allAnimals={rows}
        saving={saving}
        onSubmitForm={handleSubmitForm}
      />
    </div>
  );
}

export default AnimalsList;

import { useEffect, useState, useCallback } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, Controller } from "react-hook-form";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputNumber } from "primereact/inputnumber";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import api from "../../apis/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { BreedSchema } from "../../validations/MasterDataSchemas";

function BreedsTab() {
  const showToast = useToast();
  const { user } = useAuth();
  const canManage = user?.role === "owner" || user?.role === "manager";

  const [rows, setRows] = useState([]);
  const [animalTypes, setAnimalTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(BreedSchema),
    defaultValues: {
      animal_type_id: null,
      code: "",
      name: "",
      gestation_days: null,
      maturity_days: null,
      is_active: true,
    },
  });

  const isActive = watch("is_active");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [breedsRes, typesRes] = await Promise.all([
        api.get("/animal/api/breeds"),
        api.get("/animal/api/animal-types"),
      ]);
      setRows(breedsRes.data.data);
      setAnimalTypes(typesRes.data.data);
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail: err.response?.data?.message || "Could not load breeds",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const typeOptions = animalTypes.map((t) => ({ label: t.name, value: t.id }));

  const openCreate = () => {
    setEditingId(null);
    reset({
      animal_type_id: null,
      code: "",
      name: "",
      gestation_days: null,
      maturity_days: null,
      is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    reset({
      animal_type_id: row.animal_type_id,
      code: row.code,
      name: row.name,
      gestation_days: row.gestation_days,
      maturity_days: row.maturity_days,
      is_active: row.is_active,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/animal/api/breeds/${editingId}`, data);
        showToast({
          severity: "success",
          summary: "Updated",
          detail: "Breed updated.",
        });
      } else {
        await api.post("/animal/api/breeds", data);
        showToast({
          severity: "success",
          summary: "Created",
          detail: "Breed created.",
        });
      }
      setDialogOpen(false);
      fetchData();
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
      message: `Delete "${row.name}"? This can't be undone.`,
      header: "Confirm deletion",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "!bg-[var(--danger)] !border-[var(--danger)]",
      accept: async () => {
        try {
          await api.delete(`/animal/api/breeds/${row.id}`);
          showToast({
            severity: "success",
            summary: "Deleted",
            detail: "Breed removed.",
          });
          fetchData();
        } catch (err) {
          showToast({
            severity: "error",
            summary: "Delete failed",
            detail:
              err.response?.data?.message || "Could not delete this breed",
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
        .field-input,
        .field-input.p-inputnumber-input {
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text);
        }
        .field-input::placeholder { color: var(--text-muted); }
        .field-input:focus {
          outline: none;
          border-color: var(--primary-hover) !important;
          box-shadow: 0 0 0 3px rgba(60, 102, 80, 0.14) !important;
        }
        html.dark .field-input:focus {
          box-shadow: 0 0 0 3px rgba(74, 124, 98, 0.25) !important;
        }
        .field-invalid { border-color: var(--danger) !important; }
        .dropdown-field.p-dropdown {
          background: var(--bg-muted);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          color: var(--text);
        }
        .dropdown-field.p-dropdown.p-focus {
          border-color: var(--primary-hover) !important;
          box-shadow: 0 0 0 3px rgba(60, 102, 80, 0.14) !important;
        }
        .dropdown-field .p-dropdown-label {
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: var(--text);
        }
        .p-dropdown-panel {
          background: var(--bg-card);
          border-color: var(--border);
          color: var(--text);
        }
        .p-dropdown-item { color: var(--text); }
        .p-dropdown-item:hover,
        .p-dropdown-item.p-highlight {
          background: var(--bg-muted);
          color: var(--text);
        }
        .p-inputswitch.p-inputswitch-checked .p-inputswitch-slider {
          background: var(--primary) !important;
        }

        .breeds-dialog .p-dialog-header {
          background: var(--bg-card);
          color: var(--text-heading);
          border-bottom: 1px solid var(--border);
        }
        .breeds-dialog .p-dialog-content {
          background: var(--bg-card);
          color: var(--text);
        }
        .breeds-dialog .p-dialog-header-icon {
          color: var(--text-muted);
        }
      `}</style>

      <ConfirmDialog />

      <div className="mb-6">
        <h1
          className="font-display mb-1 text-2xl font-semibold"
          style={{ color: "var(--text-heading)" }}
        >
          Breeds
        </h1>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Breeds within each animal type, including gestation and maturity
          timelines.
        </p>
        {canManage && (
          <Button
            label="Add Breed"
            icon={<Plus size={16} className="mr-1.5" />}
            onClick={openCreate}
            className="!rounded-lg !px-4 !py-2 !text-sm !font-semibold !text-white"
            style={{
              backgroundColor: "var(--primary)",
              borderColor: "var(--primary)",
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
          placeholder="Search"
          className="field-input w-full rounded-lg py-2.5 pl-9 pr-3 text-sm"
        />
      </div>

      <DataTable
        value={rows}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        globalFilter={globalFilter}
        globalFilterFields={["name", "code", "animalType.name"]}
        emptyMessage="No breeds yet."
        tableStyle={{ tableLayout: "fixed" }}
      >
        <Column field="name" header="Name" sortable style={{ width: "22%" }} />
        <Column
          field="animalType.name"
          header="Animal Type"
          sortable
          style={{ width: "18%" }}
        />
        <Column
          field="gestation_days"
          header="Gestation"
          sortable
          style={{ width: "18%" }}
        />
        <Column
          field="maturity_days"
          header="Maturity"
          sortable
          style={{ width: "18%" }}
        />
        <Column
          field="is_active"
          header="Status"
          style={{ width: "12%" }}
          body={(row) => (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={
                row.is_active
                  ? {
                      backgroundColor:
                        "color-mix(in srgb, var(--primary) 12%, transparent)",
                      color: "var(--primary)",
                    }
                  : {
                      backgroundColor:
                        "color-mix(in srgb, var(--text-muted) 12%, transparent)",
                      color: "var(--text-muted)",
                    }
              }
            >
              {row.is_active ? "Active" : "Inactive"}
            </span>
          )}
        />
        {canManage && (
          <Column
            header="Actions"
            style={{ width: "100px" }}
            body={(row) => (
              <div className="flex items-center gap-1">
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
              </div>
            )}
          />
        )}
      </DataTable>

      <Dialog
        header={editingId ? "Edit Breed" : "Add Breed"}
        visible={dialogOpen}
        onHide={() => setDialogOpen(false)}
        style={{ width: "30rem" }}
        className="breeds-dialog"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 pt-2"
        >
          <div className="flex flex-col gap-1.5">
            <label
              className="text-[0.8rem] font-semibold"
              style={{ color: "var(--text)" }}
            >
              Animal Type
            </label>
            <Controller
              name="animal_type_id"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={typeOptions}
                  placeholder="Select animal type"
                  className={`dropdown-field w-full ${
                    errors.animal_type_id ? "field-invalid" : ""
                  }`}
                />
              )}
            />
            {errors.animal_type_id && (
              <small className="text-xs" style={{ color: "var(--danger)" }}>
                {errors.animal_type_id.message}
              </small>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[0.8rem] font-semibold"
                style={{ color: "var(--text)" }}
              >
                Code
              </label>
              <InputText
                placeholder="e.g. BOER"
                {...register("code")}
                className={`field-input w-full rounded-lg px-3 py-2.5 text-sm ${
                  errors.code ? "field-invalid" : ""
                }`}
              />
              {errors.code && (
                <small className="text-xs" style={{ color: "var(--danger)" }}>
                  {errors.code.message}
                </small>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[0.8rem] font-semibold"
                style={{ color: "var(--text)" }}
              >
                Name
              </label>
              <InputText
                placeholder="e.g. Boer Goat"
                {...register("name")}
                className={`field-input w-full rounded-lg px-3 py-2.5 text-sm ${
                  errors.name ? "field-invalid" : ""
                }`}
              />
              {errors.name && (
                <small className="text-xs" style={{ color: "var(--danger)" }}>
                  {errors.name.message}
                </small>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[0.8rem] font-semibold"
                style={{ color: "var(--text)" }}
              >
                Gestation (days)
              </label>
              <Controller
                name="gestation_days"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    className={`field-input w-full ${
                      errors.gestation_days ? "field-invalid" : ""
                    }`}
                    inputClassName="w-full rounded-lg px-3 py-2.5 text-sm"
                  />
                )}
              />
              {errors.gestation_days && (
                <small className="text-xs" style={{ color: "var(--danger)" }}>
                  {errors.gestation_days.message}
                </small>
              )}
              <small className="text-xs" style={{ color: "var(--text-muted)" }}>
                Used to estimate the expected delivery date when a service is recorded
              </small>
            </div>
            <div className="flex flex-col gap-1.5">
              <label
                className="text-[0.8rem] font-semibold"
                style={{ color: "var(--text)" }}
              >
                Maturity (days)
              </label>
              <Controller
                name="maturity_days"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    value={field.value}
                    onValueChange={(e) => field.onChange(e.value)}
                    className={`field-input w-full ${
                      errors.maturity_days ? "field-invalid" : ""
                    }`}
                    inputClassName="w-full rounded-lg px-3 py-2.5 text-sm"
                  />
                )}
              />
              {errors.maturity_days && (
                <small className="text-xs" style={{ color: "var(--danger)" }}>
                  {errors.maturity_days.message}
                </small>
              )}
              <small className="text-xs" style={{ color: "var(--text-muted)" }}>
                Age when females are ready to breed — drives maturity alerts
              </small>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label
              className="text-[0.8rem] font-semibold"
              style={{ color: "var(--text)" }}
            >
              Active
            </label>
            <InputSwitch
              checked={isActive}
              onChange={(e) => setValue("is_active", e.value)}
            />
          </div>

          <Button
            type="submit"
            label={saving ? "Saving…" : "Save"}
            loading={saving}
            className="!mt-2 !w-full !justify-center !rounded-lg !py-2.5 !text-sm !font-semibold !text-white"
            style={{
              backgroundColor: "var(--primary)",
              borderColor: "var(--primary)",
            }}
          />
        </form>
      </Dialog>
    </div>
  );
}

export default BreedsTab;

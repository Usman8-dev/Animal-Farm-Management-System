import { useEffect, useState, useCallback } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, Controller } from "react-hook-form";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import api from "../../apis/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { AnimalStatusSchema } from "../../validations/AnimalStatusSchema";

const CATEGORY_OPTIONS = [
  { label: "Presence", value: "PRESENCE" },
  { label: "Reproductive", value: "REPRODUCTIVE" },
  { label: "Health", value: "HEALTH" },
];

const CATEGORY_STYLE = {
  PRESENCE: {
    backgroundColor: "color-mix(in srgb, var(--primary) 14%, transparent)",
    color: "var(--primary)",
  },
  REPRODUCTIVE: {
    backgroundColor: "rgba(201, 162, 39, 0.18)",
    color: "#c9a227",
  },
  HEALTH: {
    backgroundColor: "color-mix(in srgb, var(--danger) 14%, transparent)",
    color: "var(--danger)",
  },
};

function AnimalStatusesTab() {
  const showToast = useToast();
  const { user } = useAuth();
  const canManage = user?.role === "owner" || user?.role === "manager";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(AnimalStatusSchema),
    defaultValues: { code: "", name: "", category: null, is_active: true },
  });

  const isActive = watch("is_active");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/status/api/animal-statuses");
      setRows(res.data.data);
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail: err.response?.data?.message || "Could not load statuses",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setEditingId(null);
    reset({ code: "", name: "", category: null, is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    reset({
      code: row.code,
      name: row.name,
      category: row.category,
      is_active: row.is_active,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/status/api/animal-statuses/${editingId}`, data);
        showToast({ severity: "success", summary: "Updated", detail: "Status updated." });
      } else {
        await api.post("/status/api/animal-statuses", data);
        showToast({ severity: "success", summary: "Created", detail: "Status created." });
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
          await api.delete(`/status/api/animal-statuses/${row.id}`);
          showToast({ severity: "success", summary: "Deleted", detail: "Status removed." });
          fetchData();
        } catch (err) {
          showToast({
            severity: "error",
            summary: "Delete failed",
            detail: err.response?.data?.message || "Could not delete this status",
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
        .field-invalid { border-color: var(--danger) !important; }

        .dropdown-field.p-dropdown {
          background: var(--bg-muted) !important;
          border: 1px solid var(--border) !important;
          border-radius: 0.5rem;
          color: var(--text) !important;
        }
        .dropdown-field.p-dropdown.p-focus {
          border-color: var(--primary-hover) !important;
          box-shadow: 0 0 0 3px rgba(60, 102, 80, 0.14) !important;
        }
        .dropdown-field .p-dropdown-label {
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: var(--text) !important;
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

        .p-inputswitch.p-inputswitch-checked .p-inputswitch-slider {
          background: var(--primary) !important;
        }

        .status-dialog .p-dialog-header {
          background: var(--bg-card) !important;
          color: var(--text-heading) !important;
          border-bottom: 1px solid var(--border) !important;
        }
        .status-dialog .p-dialog-content {
          background: var(--bg-card) !important;
          color: var(--text) !important;
        }
        .status-dialog .p-dialog-header-icon {
          color: var(--text-muted) !important;
        }
      `}</style>

      <ConfirmDialog />

      <div className="mb-6">
        <h1
          className="font-display mb-1 text-2xl font-semibold"
          style={{ color: "var(--text-heading)" }}
        >
          Animal Statuses
        </h1>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Status options used to track each animal&apos;s current state.
        </p>
        {canManage && (
          <Button
            label="Add Status"
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

      <DataTable
        value={rows}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 100]}
        emptyMessage="No statuses yet."
      >
        <Column field="code" header="Code" sortable style={{ width: "15%" }} />
        <Column field="name" header="Name" sortable />
        <Column
          field="category"
          header="Category"
          sortable
          style={{ width: "18%" }}
          body={(row) => (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={CATEGORY_STYLE[row.category] || CATEGORY_STYLE.PRESENCE}
            >
              {row.category
                ? row.category.charAt(0) + row.category.slice(1).toLowerCase()
                : "—"}
            </span>
          )}
        />
        <Column
          field="is_active"
          header="Status"
          style={{ width: "15%" }}
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
            header=""
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
        header={editingId ? "Edit Status" : "Add Status"}
        visible={dialogOpen}
        onHide={() => setDialogOpen(false)}
        style={{ width: "28rem" }}
        className="status-dialog"
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
              Code
            </label>
            <InputText
              placeholder="e.g. SICK"
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
              placeholder="e.g. Sick"
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

          <div className="flex flex-col gap-1.5">
            <label
              className="text-[0.8rem] font-semibold"
              style={{ color: "var(--text)" }}
            >
              Category
            </label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={CATEGORY_OPTIONS}
                  placeholder="Select"
                  className={`dropdown-field w-full ${
                    errors.category ? "field-invalid" : ""
                  }`}
                />
              )}
            />
            {errors.category && (
              <small className="text-xs" style={{ color: "var(--danger)" }}>
                {errors.category.message}
              </small>
            )}
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

export default AnimalStatusesTab;
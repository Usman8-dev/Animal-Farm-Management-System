import { useEffect, useState, useCallback } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import api from "../../apis/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { GenderSchema } from "../../validations/MasterDataSchemas";

function GendersTab() {
  const showToast = useToast();
  const { user } = useAuth();
  const canManage = user?.role === "owner" || user?.role === "manager";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [globalFilter, setGlobalFilter] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(GenderSchema),
    defaultValues: { code: "", name: "" },
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/animal/api/genders");
      setRows(res.data.data);
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail: err.response?.data?.message || "Could not load genders",
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
    reset({ code: "", name: "" });
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    reset({ code: row.code, name: row.name });
    setDialogOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/animal/api/genders/${editingId}`, data);
        showToast({
          severity: "success",
          summary: "Updated",
          detail: "Gender updated.",
        });
      } else {
        await api.post("/animal/api/genders", data);
        showToast({
          severity: "success",
          summary: "Created",
          detail: "Gender created.",
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
          await api.delete(`/animal/api/genders/${row.id}`);
          showToast({
            severity: "success",
            summary: "Deleted",
            detail: "Gender removed.",
          });
          fetchData();
        } catch (err) {
          showToast({
            severity: "error",
            summary: "Delete failed",
            detail:
              err.response?.data?.message || "Could not delete this gender",
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

       /* Table shell */
.p-datatable {
  background: var(--bg-card) !important;
  border: 1px solid var(--border) !important;
  border-radius: 0.75rem;
  overflow: hidden;
}

.p-datatable .p-datatable-wrapper {
  background: var(--bg-card) !important;
}

/* Header */
.p-datatable .p-datatable-thead > tr > th {
  background: var(--bg-muted) !important;
  color: var(--text-muted) !important;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-color: var(--border) !important;
  padding: 0.75rem 1rem;
}

/* Body cells */
.p-datatable .p-datatable-tbody > tr {
  background: var(--bg-card) !important;
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

/* Empty message row */
.p-datatable .p-datatable-tbody > tr.p-datatable-emptymessage > td {
  background: var(--bg-card) !important;
  color: var(--text-muted) !important;
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

/* Search input */
.field-input {
  background: var(--bg-card) !important;
  border: 1px solid var(--border) !important;
  color: var(--text) !important;
}
.field-input::placeholder {
  color: var(--text-muted) !important;
}
.field-input:focus {
  outline: none;
  border-color: var(--primary-hover) !important;
  box-shadow: 0 0 0 3px rgba(60, 102, 80, 0.14) !important;
}
.genders-dialog.p-dialog {
  background: var(--bg-card) !important;
  border: 1px solid var(--border) !important;
  color: var(--text) !important;
}

.genders-dialog .p-dialog-header {
  background: var(--bg-card) !important;
  color: var(--text-heading) !important;
  border-bottom: 1px solid var(--border) !important;
  padding: 1.25rem 1.5rem !important;
}

.genders-dialog .p-dialog-header .p-dialog-title {
  color: var(--text-heading) !important;
  font-weight: 600;
}

.genders-dialog .p-dialog-header-icons .p-dialog-header-icon {
  color: var(--text-muted) !important;
}

.genders-dialog .p-dialog-header-icons .p-dialog-header-icon:hover {
  background: var(--bg-muted) !important;
  color: var(--text) !important;
}

.genders-dialog .p-dialog-content {
  background: var(--bg-card) !important;
  color: var(--text) !important;
  padding: 0 1.5rem 1.5rem !important;
}

.genders-dialog .p-dialog-footer {
  background: var(--bg-card) !important;
  border-top: 1px solid var(--border) !important;
}

/* Inputs inside dialog */
.genders-dialog .field-input {
  background: var(--bg-muted) !important;
  border: 1px solid var(--border) !important;
  color: var(--text) !important;
}

.genders-dialog .field-input::placeholder {
  color: var(--text-muted) !important;
}

.genders-dialog .field-input:focus {
  border-color: var(--primary-hover) !important;
  box-shadow: 0 0 0 3px rgba(60, 102, 80, 0.14) !important;
}

.genders-dialog .field-invalid {
  border-color: var(--danger) !important;
}

/* Mask / overlay behind dialog */
.p-dialog-mask {
  background-color: rgba(0, 0, 0, 0.55) !important;
}
      `}</style>

      <ConfirmDialog />

      <div className="mb-6">
        <h1
          className="font-display mb-1 text-2xl font-semibold"
          style={{ color: "var(--text-heading)" }}
        >
          Genders
        </h1>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Gender options used when registering animals.
        </p>
        {canManage && (
          <Button
            label="Add Gender"
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
          placeholder="Search by name or code…"
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
        globalFilterFields={["name", "code"]}
        emptyMessage="No genders yet."
        tableStyle={{ tableLayout: "fixed" }}
      >
        <Column field="name" header="Name" sortable style={{ width: "35%" }} />
        <Column
          field="created_at"
          header="Date"
          sortable
          style={{ width: "35%" }}
          body={(rowData) =>
            rowData.created_at ? rowData.created_at.split("T")[0] : ""
          }
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
        header={editingId ? "Edit Gender" : "Add Gender"}
        visible={dialogOpen}
        onHide={() => setDialogOpen(false)}
        style={{ width: "24rem" }}
        className="genders-dialog"
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
              placeholder="e.g. M"
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
              placeholder="e.g. Male"
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

export default GendersTab;

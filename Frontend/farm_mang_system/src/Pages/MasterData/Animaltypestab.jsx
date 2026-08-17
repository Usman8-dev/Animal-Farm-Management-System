import { useEffect, useState, useCallback } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { InputSwitch } from "primereact/inputswitch";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import api from "../../apis/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { AnimalTypeSchema } from "../../validations/MasterDataSchemas";
import { Search } from "lucide-react";

function AnimalTypesTab() {
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
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(AnimalTypeSchema),
    defaultValues: { code: "", name: "", is_active: true },
  });

  const isActive = watch("is_active");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/animal/api/animal-types");
      setRows(res.data.data);
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail: err.response?.data?.message || "Could not load animal types",
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
    reset({ code: "", name: "", is_active: true });
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    reset({ code: row.code, name: row.name, is_active: row.is_active });
    setDialogOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/animal/api/animal-types/${editingId}`, data);
        showToast({
          severity: "success",
          summary: "Updated",
          detail: "Animal type updated.",
        });
      } else {
        await api.post("/animal/api/animal-types", data);
        showToast({
          severity: "success",
          summary: "Created",
          detail: "Animal type created.",
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
      acceptClassName: "!bg-[#b3452d] !border-[#b3452d]",
      accept: async () => {
        try {
          await api.delete(`/animal/api/animal-types/${row.id}`);
          showToast({
            severity: "success",
            summary: "Deleted",
            detail: "Animal type removed.",
          });
          fetchData();
        } catch (err) {
          showToast({
            severity: "error",
            summary: "Delete failed",
            detail:
              err.response?.data?.message ||
              "Could not delete this animal type",
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
          background: #faf8f2;
          color: #66716a;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          border-color: #e6e2d6;
          padding: 0.75rem 1rem;
        }
        .p-datatable .p-datatable-tbody > tr > td {
          border-color: #e6e2d6;
          padding: 0.75rem 1rem;
          font-size: 0.88rem;
          color: #1b241d;
        }
        .p-datatable .p-datatable-tbody > tr:hover {
          background: #faf8f2;
        }
        .p-paginator {
          background: transparent;
          border: none;
          padding-top: 1rem;
        }
        .field-input { background: #fdfcf9; border: 1px solid #e6e2d6; }
        .field-input:focus { outline: none; border-color: #3c6650 !important; box-shadow: 0 0 0 3px rgba(60,102,80,0.14) !important; }
        .field-invalid { border-color: #b3452d !important; }
        .p-inputswitch.p-inputswitch-checked .p-inputswitch-slider { background: #1f3d2e !important; }
      `}</style>

      <ConfirmDialog />

      <div className="mb-6">
        <h1 className="font-display font-semibold text-2xl text-[#14261d] mb-1">
          Animal Types
        </h1>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#66716a]">
          Species/type classifications used across your animal records.
        </p>
        {canManage && (
          <Button
            label="Add Animal Type"
            icon={<Plus size={16} className="mr-1.5" />}
            onClick={openCreate}
            className="!bg-[#1f3d2e] !border-[#1f3d2e] hover:!bg-[#3c6650] !rounded-lg !text-sm !font-semibold !px-4 !py-2"
          />
        )}
      </div>

      <div className="relative mb-4 max-w-xs">
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search by name or code…"
          className="field-input w-full rounded-lg pl-9 pr-3 py-2.5 text-sm"
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
        emptyMessage="No animal types yet."
      >
        {/* <Column field="code" header="Code" sortable style={{ width: "25%" }} /> */}
        <Column field="name" header="Name" sortable style={{ width: "35%" }}/>
        <Column
          field="is_active"
          header="Status"
          style={{ width: "25%" }}
          body={(row) => (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                row.is_active
                  ? "bg-[#1f3d2e]/10 text-[#1f3d2e]"
                  : "bg-[#66716a]/10 text-[#66716a]"
              }`}
            >
              {row.is_active ? "Active" : "Inactive"}
            </span>
          )}
        />
        <Column field="created_at" header="Date" sortable style={{ width: "25%" }} body={(rowData) => rowData.created_at ? rowData.created_at.split('T')[0] : ''}/>
        {canManage && (
          <Column
            header="Actions"
            style={{ width: "100px" }}
            body={(row) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(row)}
                  className="p-1.5 text-[#66716a] hover:text-[#1f3d2e] transition-colors"
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => confirmDelete(row)}
                  className="p-1.5 text-[#66716a] hover:text-[#b3452d] transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          />
        )}
      </DataTable>

      <Dialog
        header={editingId ? "Edit Animal Type" : "Add Animal Type"}
        visible={dialogOpen}
        onHide={() => setDialogOpen(false)}
        style={{ width: "28rem" }}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-4 pt-2"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold text-[#1b241d]">
              Code
            </label>
            <InputText
              placeholder="e.g. GOAT"
              {...register("code")}
              className={`field-input w-full rounded-lg px-3 py-2.5 text-sm ${errors.code ? "field-invalid" : ""}`}
            />
            {errors.code && (
              <small className="text-[#b3452d] text-xs">
                {errors.code.message}
              </small>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold text-[#1b241d]">
              Name
            </label>
            <InputText
              placeholder="e.g. Goat"
              {...register("name")}
              className={`field-input w-full rounded-lg px-3 py-2.5 text-sm ${errors.name ? "field-invalid" : ""}`}
            />
            {errors.name && (
              <small className="text-[#b3452d] text-xs">
                {errors.name.message}
              </small>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="text-[0.8rem] font-semibold text-[#1b241d]">
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
            className="!mt-2 !w-full !justify-center !bg-[#1f3d2e] !border-[#1f3d2e] hover:!bg-[#3c6650] !rounded-lg !py-2.5 !font-semibold !text-sm"
          />
        </form>
      </Dialog>
    </div>
  );
}

export default AnimalTypesTab;

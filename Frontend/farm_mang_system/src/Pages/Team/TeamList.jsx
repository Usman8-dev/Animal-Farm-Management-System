import { useEffect, useState, useCallback } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, Controller } from "react-hook-form";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import api from "../../apis/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { TeamMemberCreateSchema, TeamMemberUpdateSchema } from "../../validations/TeamSchemas";

const ROLE_OPTIONS = [
  { label: "Manager", value: "manager" },
  { label: "Worker", value: "worker" },
];

const GENDER_OPTIONS = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

function TeamList() {
  const showToast = useToast();
  const { user } = useAuth();
  const isOwner = user?.role === "owner";
  const canView = user?.role === "owner" || user?.role === "manager";

  const [rows, setRows] = useState([]);
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
    formState: { errors },
  } = useForm({
    resolver: yupResolver(editingId ? TeamMemberUpdateSchema : TeamMemberCreateSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      gender: null,
      cnic_number: "",
      role: "worker",
    },
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/team/api/team");
      setRows(res.data.data || []);
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail: err.response?.data?.message || "Could not load team",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (canView) fetchData();
  }, [fetchData, canView]);

  const openCreate = () => {
    setEditingId(null);
    reset({
      name: "",
      email: "",
      password: "",
      gender: null,
      cnic_number: "",
      role: "worker",
    });
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    reset({
      name: row.name || "",
      email: row.email || "",
      password: "",
      gender: row.gender || null,
      cnic_number: row.cnic_number || "",
      role: row.role || "worker",
    });
    setDialogOpen(true);
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      if (editingId) {
        const payload = {
          name: data.name,
          gender: data.gender,
          cnic_number: data.cnic_number || null,
          role: data.role,
        };
        if (data.password) payload.password = data.password;

        await api.put(`/team/api/team/${editingId}`, payload);
        showToast({ severity: "success", summary: "Updated", detail: "Team member updated." });
      } else {
        await api.post("/team/api/team", {
          name: data.name,
          email: data.email,
          password: data.password,
          gender: data.gender,
          cnic_number: data.cnic_number || null,
          role: data.role,
        });
        showToast({ severity: "success", summary: "Created", detail: "Team member added." });
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
      message: `Remove "${row.name}" from the farm? They will no longer be able to log in.`,
      header: "Confirm removal",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "!bg-[var(--danger)] !border-[var(--danger)]",
      accept: async () => {
        try {
          await api.delete(`/team/api/team/${row.id}`);
          showToast({ severity: "success", summary: "Removed", detail: "Team member removed." });
          fetchData();
        } catch (err) {
          showToast({
            severity: "error",
            summary: "Remove failed",
            detail: err.response?.data?.message || "Could not remove this member",
          });
        }
      },
    });
  };

  if (!canView) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        You don’t have access to the team list.
      </p>
    );
  }

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
          border-color: var(--primary-hover) !important;
          box-shadow: 0 0 0 3px rgba(60, 102, 80, 0.14) !important;
        }
        .field-invalid { border-color: var(--danger) !important; }
        .dropdown-field.p-dropdown {
          background: var(--bg-muted) !important;
          border: 1px solid var(--border) !important;
          border-radius: 0.5rem;
          width: 100%;
        }
        .dropdown-field .p-dropdown-label { color: var(--text) !important; }
        .p-password, .p-password input {
          width: 100%;
        }
        .p-password input {
          background: var(--bg-card) !important;
          border: 1px solid var(--border) !important;
          color: var(--text) !important;
          border-radius: 0.5rem;
          padding: 0.625rem 0.75rem;
        }

        .team-dialog .p-dialog-header {
          background: var(--bg-card) !important;
          color: var(--text-heading) !important;
          border-bottom: 1px solid var(--border) !important;
        }
        .team-dialog .p-dialog-content {
          background: var(--bg-card) !important;
          color: var(--text) !important;
        }
        .team-dialog .p-dialog-header-icon {
          color: var(--text-muted) !important;
        }
      `}</style>

      <ConfirmDialog />

      <div className="mb-6">
        <h1
          className="font-display mb-1 text-2xl font-semibold"
          style={{ color: "var(--text-heading)" }}
        >
          Team
        </h1>
      </div>

      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Managers and workers who can access this farm.
        </p>
        {isOwner && (
          <Button
            label="Add Member"
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
          placeholder="Search by name or email…"
          className="field-input w-full rounded-lg py-2.5 pl-9 pr-3 text-sm"
        />
      </div>

      <DataTable
        value={rows}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25]}
        globalFilter={globalFilter}
        globalFilterFields={["name", "email", "role"]}
        emptyMessage="No team members yet."
      >
        <Column field="name" header="Name" sortable />
        <Column field="email" header="Email" sortable />
        <Column
          field="role"
          header="Role"
          sortable
          body={(row) => (
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
              style={{
                backgroundColor:
                  row.role === "manager"
                    ? "color-mix(in srgb, var(--primary) 14%, transparent)"
                    : "color-mix(in srgb, var(--text-muted) 14%, transparent)",
                color: row.role === "manager" ? "var(--primary)" : "var(--text-muted)",
              }}
            >
              {row.role}
            </span>
          )}
        />
        <Column field="gender" header="Gender" />
        <Column
          field="status"
          header="Status"
          body={(row) => (
            <span
              className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize"
              style={{
                backgroundColor:
                  row.status === "active"
                    ? "color-mix(in srgb, var(--primary) 12%, transparent)"
                    : "color-mix(in srgb, var(--text-muted) 12%, transparent)",
                color: row.status === "active" ? "var(--primary)" : "var(--text-muted)",
              }}
            >
              {row.status}
            </span>
          )}
        />
        {isOwner && (
          <Column
            header="Actions"
            style={{ width: "100px" }}
            body={(row) => (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => openEdit(row)}
                  className="p-1.5 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => confirmDelete(row)}
                  className="p-1.5 transition-colors"
                  style={{ color: "var(--text-muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          />
        )}
      </DataTable>

      <Dialog
        header={editingId ? "Edit Member" : "Add Member"}
        visible={dialogOpen}
        onHide={() => setDialogOpen(false)}
        style={{ width: "28rem" }}
        className="team-dialog"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold" style={{ color: "var(--text)" }}>
              Name
            </label>
            <InputText
              {...register("name")}
              className={`field-input w-full rounded-lg px-3 py-2.5 text-sm ${
                errors.name ? "field-invalid" : ""
              }`}
              placeholder="Full name"
            />
            {errors.name && (
              <small className="text-xs" style={{ color: "var(--danger)" }}>
                {errors.name.message}
              </small>
            )}
          </div>

          {!editingId && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] font-semibold" style={{ color: "var(--text)" }}>
                Email
              </label>
              <InputText
                {...register("email")}
                className={`field-input w-full rounded-lg px-3 py-2.5 text-sm ${
                  errors.email ? "field-invalid" : ""
                }`}
                placeholder="email@example.com"
              />
              {errors.email && (
                <small className="text-xs" style={{ color: "var(--danger)" }}>
                  {errors.email.message}
                </small>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold" style={{ color: "var(--text)" }}>
              {editingId ? "New password (optional)" : "Password"}
            </label>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Password
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  feedback={false}
                  toggleMask
                  className="w-full"
                  inputClassName={`field-input w-full text-sm ${
                    errors.password ? "field-invalid" : ""
                  }`}
                  placeholder={editingId ? "Leave blank to keep current" : "Min 6 characters"}
                />
              )}
            />
            {errors.password && (
              <small className="text-xs" style={{ color: "var(--danger)" }}>
                {errors.password.message}
              </small>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] font-semibold" style={{ color: "var(--text)" }}>
                Gender
              </label>
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={GENDER_OPTIONS}
                    placeholder="Select"
                    className={`dropdown-field ${errors.gender ? "field-invalid" : ""}`}
                  />
                )}
              />
              {errors.gender && (
                <small className="text-xs" style={{ color: "var(--danger)" }}>
                  {errors.gender.message}
                </small>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] font-semibold" style={{ color: "var(--text)" }}>
                Role
              </label>
              <Controller
                name="role"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={ROLE_OPTIONS}
                    placeholder="Select role"
                    className={`dropdown-field ${errors.role ? "field-invalid" : ""}`}
                  />
                )}
              />
              {errors.role && (
                <small className="text-xs" style={{ color: "var(--danger)" }}>
                  {errors.role.message}
                </small>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold" style={{ color: "var(--text)" }}>
              CNIC (optional)
            </label>
            <InputText
              {...register("cnic_number")}
              className="field-input w-full rounded-lg px-3 py-2.5 text-sm"
              placeholder="Optional"
            />
          </div>

          <Button
            type="submit"
            label={saving ? "Saving…" : editingId ? "Save Changes" : "Add Member"}
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

export default TeamList;
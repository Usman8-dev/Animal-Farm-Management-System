import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { InputSwitch } from "primereact/inputswitch";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { Badge } from "primereact/badge";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  DiseaseSchema,
  MedicineSchema,
  HealthCaseSchema,
  CaseStatusSchema,
  TreatmentSchema,
  DISEASE_CATEGORY_OPTIONS,
  SEVERITY_OPTIONS,
  CASE_STATUS_OPTIONS,
  ROUTE_OPTIONS,
  labelFor,
} from "../../validations/HealthSchema";
import { statusSeverity, severitySeverity, caseStatusLabel } from "./healthDisplay";

const dialogStyles = `
  .hl-dialog.p-dialog, .hl-dialog .p-dialog-header, .hl-dialog .p-dialog-content { background: var(--bg-card) !important; }
  .hl-dialog.p-dialog { border: 1px solid var(--border) !important; }
  .hl-dialog .p-dialog-header { color: var(--text-heading) !important; border-bottom: 1px solid var(--border) !important; }
  .hl-dialog .p-dialog-title { color: var(--text-heading) !important; font-weight: 600; }
  .hl-dialog .p-dialog-header-icon { color: var(--text-muted) !important; }
  .hl-dialog .p-dialog-content { color: var(--text) !important; }
  .hl-dialog .p-inputtext, .hl-dialog .p-inputnumber-input, .hl-dialog .p-inputtextarea,
  .hl-dialog .p-dropdown, .hl-dialog .p-calendar {
    background: var(--bg-muted) !important; border: 1px solid var(--border) !important;
    color: var(--text) !important; border-radius: 0.5rem; width: 100%;
  }
  .hl-dialog .p-dropdown-label, .hl-dialog .p-dropdown-item { color: var(--text) !important; }
  .hl-dialog .p-dropdown-panel { background: var(--bg-card) !important; border-color: var(--border) !important; }
  .hl-dialog .p-dropdown-item.p-highlight, .hl-dialog .p-dropdown-item:hover { background: var(--bg-muted) !important; }
  .hl-dialog label { color: var(--text); }
  .hl-dialog .err { color: var(--danger); }
  .hl-dialog .p-button { background: var(--primary) !important; border-color: var(--primary) !important; color: #fff !important; }
  .hl-dialog .p-datatable .p-datatable-thead > tr > th {
    background: var(--bg-muted) !important; color: var(--text-muted) !important;
    font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.03em;
    border-color: var(--border) !important; padding: 0.55rem 0.7rem;
  }
  .hl-dialog .p-datatable .p-datatable-tbody > tr > td {
    background: var(--bg-card) !important; border-color: var(--border) !important;
    padding: 0.55rem 0.7rem; font-size: 0.82rem; color: var(--text) !important;
  }
`;

const fmtDate = (v) => {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

const animalLabel = (a) => `${a.tag_number}${a.name ? ` — ${a.name}` : ""}`;

// Badge colours and status labels live in ./healthDisplay (shared with the page).

// ── Disease (master data) ────────────────────────────────────

export function DiseaseDialog({ open, onHide, saving, editing, onSubmitForm }) {
  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({
    resolver: yupResolver(DiseaseSchema),
    defaultValues: {
      code: "",
      name: "",
      category: "OTHER",
      symptoms: "",
      description: "",
      is_contagious: false,
      is_active: true,
    },
  });

  const contagious = watch("is_contagious");
  const active = watch("is_active");

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            code: editing.code,
            name: editing.name,
            category: editing.category || "OTHER",
            symptoms: editing.symptoms || "",
            description: editing.description || "",
            is_contagious: !!editing.is_contagious,
            is_active: !!editing.is_active,
          }
        : {
            code: "",
            name: "",
            category: "OTHER",
            symptoms: "",
            description: "",
            is_contagious: false,
            is_active: true,
          }
    );
  }, [open, editing, reset]);

  return (
    <Dialog
      header={editing ? "Edit Disease" : "Add Disease"}
      visible={open}
      onHide={onHide}
      style={{ width: "32rem" }}
      className="hl-dialog"
    >
      <style>{dialogStyles}</style>
      <form
        onSubmit={handleSubmit((d) =>
          onSubmitForm({
            code: d.code.trim(),
            name: d.name.trim(),
            category: d.category || "OTHER",
            symptoms: d.symptoms?.trim() || null,
            description: d.description?.trim() || null,
            is_contagious: !!d.is_contagious,
            is_active: !!d.is_active,
          })
        )}
        className="flex flex-col gap-4 pt-2"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">
              Code <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <InputText {...register("code")} placeholder="e.g. FMD" className="w-full" />
            {errors.code && <p className="err text-xs">{errors.code.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">
              Category <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={DISEASE_CATEGORY_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Select category"
                  className="w-full"
                />
              )}
            />
            {errors.category && <p className="err text-xs">{errors.category.message}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">
            Name <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <InputText
            {...register("name")}
            placeholder="e.g. Foot & Mouth Disease"
            className="w-full"
          />
          {errors.name && <p className="err text-xs">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Typical symptoms</label>
          <InputTextarea
            rows={2}
            {...register("symptoms")}
            placeholder="Shown as a hint when logging a case"
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Notes</label>
          <InputTextarea rows={2} {...register("description")} className="w-full" />
        </div>

        <div
          className="flex items-center justify-between rounded-lg border px-3 py-2.5"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-sm">Contagious — flag cases for isolation</span>
          <Controller
            name="is_contagious"
            control={control}
            render={({ field }) => (
              <InputSwitch checked={!!contagious} onChange={(e) => field.onChange(e.value)} />
            )}
          />
        </div>

        <div
          className="flex items-center justify-between rounded-lg border px-3 py-2.5"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-sm">Active — available when logging cases</span>
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <InputSwitch checked={!!active} onChange={(e) => field.onChange(e.value)} />
            )}
          />
        </div>

        <Button
          type="submit"
          label={saving ? "Saving…" : editing ? "Save Changes" : "Add Disease"}
          loading={saving}
          className="!w-full !justify-center !rounded-lg !py-2.5 !text-sm !font-semibold"
        />
      </form>
    </Dialog>
  );
}

// ── Medicine (master data) ───────────────────────────────────

export function MedicineDialog({ open, onHide, saving, editing, onSubmitForm }) {
  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm({
    resolver: yupResolver(MedicineSchema),
    defaultValues: {
      code: "",
      name: "",
      unit: "",
      withdrawal_days: null,
      description: "",
      is_active: true,
    },
  });

  const active = watch("is_active");

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            code: editing.code,
            name: editing.name,
            unit: editing.unit || "",
            withdrawal_days: editing.withdrawal_days ?? null,
            description: editing.description || "",
            is_active: !!editing.is_active,
          }
        : { code: "", name: "", unit: "", withdrawal_days: null, description: "", is_active: true }
    );
  }, [open, editing, reset]);

  return (
    <Dialog
      header={editing ? "Edit Medicine" : "Add Medicine"}
      visible={open}
      onHide={onHide}
      style={{ width: "32rem" }}
      className="hl-dialog"
    >
      <style>{dialogStyles}</style>
      <form
        onSubmit={handleSubmit((d) =>
          onSubmitForm({
            code: d.code.trim(),
            name: d.name.trim(),
            unit: d.unit?.trim() || null,
            withdrawal_days: d.withdrawal_days ?? null,
            description: d.description?.trim() || null,
            is_active: !!d.is_active,
          })
        )}
        className="flex flex-col gap-4 pt-2"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">
              Code <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <InputText {...register("code")} placeholder="e.g. OXY-20" className="w-full" />
            {errors.code && <p className="err text-xs">{errors.code.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">Unit</label>
            <InputText {...register("unit")} placeholder="ml / mg / tablet" className="w-full" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">
            Name <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <InputText {...register("name")} placeholder="e.g. Oxytetracycline" className="w-full" />
          {errors.name && <p className="err text-xs">{errors.name.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Withdrawal period (days)</label>
          <Controller
            name="withdrawal_days"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                min={0}
                maxFractionDigits={0}
                placeholder="Milk / meat clearance window"
                className="w-full"
                inputClassName="w-full"
              />
            )}
          />
          {errors.withdrawal_days && (
            <p className="err text-xs">{errors.withdrawal_days.message}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Notes</label>
          <InputTextarea rows={2} {...register("description")} className="w-full" />
        </div>

        <div
          className="flex items-center justify-between rounded-lg border px-3 py-2.5"
          style={{ borderColor: "var(--border)" }}
        >
          <span className="text-sm">Active — available when recording treatments</span>
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <InputSwitch checked={!!active} onChange={(e) => field.onChange(e.value)} />
            )}
          />
        </div>

        <Button
          type="submit"
          label={saving ? "Saving…" : editing ? "Save Changes" : "Add Medicine"}
          loading={saving}
          className="!w-full !justify-center !rounded-lg !py-2.5 !text-sm !font-semibold"
        />
      </form>
    </Dialog>
  );
}

// ── Health case (log / edit a diagnosis) ─────────────────────

const blankCase = () => ({
  animal_id: null,
  disease_id: null,
  diagnosis: "",
  category: "OTHER",
  severity: "MODERATE",
  diagnosed_on: new Date(),
  diagnosed_by: "",
  is_contagious: false,
  is_quarantined: false,
  symptoms: "",
  notes: "",
});

export function HealthCaseDialog({ open, onHide, saving, editing, onSubmitForm, animals, diseases }) {
  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(HealthCaseSchema),
    defaultValues: blankCase(),
  });

  const contagious = watch("is_contagious");
  const quarantined = watch("is_quarantined");
  const pickedDiseaseId = watch("disease_id");

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            animal_id: editing.animal_id ?? null,
            disease_id: editing.disease_id ?? null,
            diagnosis: editing.diagnosis || "",
            category: editing.category || "OTHER",
            severity: editing.severity || "MODERATE",
            diagnosed_on: editing.diagnosed_on ? new Date(editing.diagnosed_on) : new Date(),
            diagnosed_by: editing.diagnosed_by || "",
            is_contagious: !!editing.is_contagious,
            is_quarantined: !!editing.is_quarantined,
            symptoms: editing.symptoms || "",
            notes: editing.notes || "",
          }
        : blankCase()
    );
  }, [open, editing, reset]);

  // Picking a catalogue disease pre-fills wording, category, flags and symptoms.
  const handleDiseasePick = (id, onChange) => {
    onChange(id ?? null);
    const picked = (diseases || []).find((d) => d.id === id);
    if (!picked) return;
    setValue("diagnosis", picked.name);
    setValue("category", picked.category || "OTHER");
    setValue("is_contagious", !!picked.is_contagious);
    if (picked.symptoms) setValue("symptoms", picked.symptoms);
  };

  const animalOptions = (animals || []).map((a) => ({ label: animalLabel(a), value: a.id }));
  const diseaseOptions = (diseases || []).map((d) => ({
    label: `${d.name}${d.is_contagious ? " (contagious)" : ""}`,
    value: d.id,
  }));
  const pickedDisease = (diseases || []).find((d) => d.id === pickedDiseaseId);

  return (
    <Dialog
      header={editing ? "Edit Health Case" : "Log Health Case"}
      visible={open}
      onHide={onHide}
      style={{ width: "44rem" }}
      className="hl-dialog"
    >
      <style>{dialogStyles}</style>
      <form
        onSubmit={handleSubmit((d) =>
          onSubmitForm({
            animal_id: d.animal_id,
            disease_id: d.disease_id ?? null,
            diagnosis: d.diagnosis?.trim() || null,
            category: d.category || "OTHER",
            severity: d.severity || "MODERATE",
            diagnosed_on: d.diagnosed_on,
            diagnosed_by: d.diagnosed_by?.trim() || null,
            is_contagious: !!d.is_contagious,
            is_quarantined: !!d.is_quarantined,
            symptoms: d.symptoms?.trim() || null,
            notes: d.notes?.trim() || null,
          })
        )}
        className="flex flex-col gap-4 pt-2"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">
              Animal <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <Controller
              name="animal_id"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={animalOptions}
                  filter
                  placeholder="Select animal"
                  className="w-full"
                />
              )}
            />
            {errors.animal_id && <p className="err text-xs">{errors.animal_id.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">Disease (catalogue)</label>
            <Controller
              name="disease_id"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(e) => handleDiseasePick(e.value, field.onChange)}
                  options={diseaseOptions}
                  filter
                  showClear
                  placeholder="Optional — or type a diagnosis"
                  className="w-full"
                />
              )}
            />
            {pickedDisease?.symptoms && (
              <p className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
                Typical: {pickedDisease.symptoms}
              </p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">Diagnosis</label>
            <InputText
              {...register("diagnosis")}
              placeholder="Required when no disease is selected"
              className="w-full"
            />
            {errors.diagnosis && <p className="err text-xs">{errors.diagnosis.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">Category</label>
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={DISEASE_CATEGORY_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  className="w-full"
                />
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">
              Severity <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <Controller
              name="severity"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={SEVERITY_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  className="w-full"
                />
              )}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">
              Diagnosed on <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <Controller
              name="diagnosed_on"
              control={control}
              render={({ field }) => (
                <Calendar
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  appendTo={document.body}
                  className="w-full"
                />
              )}
            />
            {errors.diagnosed_on && <p className="err text-xs">{errors.diagnosed_on.message}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Diagnosed by (vet / staff)</label>
          <InputText {...register("diagnosed_by")} placeholder="e.g. Dr. Ahmed" className="w-full" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Observed symptoms</label>
          <InputTextarea rows={2} {...register("symptoms")} className="w-full" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div
            className="flex items-center justify-between rounded-lg border px-3 py-2.5"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-sm">Contagious</span>
            <Controller
              name="is_contagious"
              control={control}
              render={({ field }) => (
                <InputSwitch checked={!!contagious} onChange={(e) => field.onChange(e.value)} />
              )}
            />
          </div>
          <div
            className="flex items-center justify-between rounded-lg border px-3 py-2.5"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-sm">Quarantine this animal</span>
            <Controller
              name="is_quarantined"
              control={control}
              render={({ field }) => (
                <InputSwitch checked={!!quarantined} onChange={(e) => field.onChange(e.value)} />
              )}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Notes</label>
          <InputTextarea rows={2} {...register("notes")} className="w-full" />
        </div>

        <Button
          type="submit"
          label={saving ? "Saving…" : editing ? "Save Changes" : "Log Case"}
          loading={saving}
          className="!w-full !justify-center !rounded-lg !py-2.5 !text-sm !font-semibold"
        />
      </form>
    </Dialog>
  );
}

// ── Case outcome (close / reopen a case) ─────────────────────

const CLOSING_STATUSES = ["RECOVERED", "CHRONIC", "DIED", "CULLED"];

export function CaseStatusDialog({ open, onHide, saving, caseRow, onSubmitForm }) {
  const { handleSubmit, reset, control, watch } = useForm({
    resolver: yupResolver(CaseStatusSchema),
    defaultValues: {
      status: "RECOVERED",
      outcome_date: new Date(),
      outcome_notes: "",
      is_quarantined: false,
    },
  });

  const status = watch("status");
  const quarantined = watch("is_quarantined");
  const closing = CLOSING_STATUSES.includes(status);

  useEffect(() => {
    if (!open) return;
    reset({
      status: CLOSING_STATUSES.includes(caseRow?.status) ? caseRow.status : "RECOVERED",
      outcome_date: caseRow?.outcome_date ? new Date(caseRow.outcome_date) : new Date(),
      outcome_notes: caseRow?.outcome_notes || "",
      is_quarantined: !!caseRow?.is_quarantined,
    });
  }, [open, caseRow, reset]);

  return (
    <Dialog
      header="Update Case Outcome"
      visible={open}
      onHide={onHide}
      style={{ width: "30rem" }}
      className="hl-dialog"
    >
      <style>{dialogStyles}</style>
      <form
        onSubmit={handleSubmit((d) =>
          onSubmitForm({
            status: d.status,
            outcome_date: closing ? d.outcome_date : null,
            outcome_notes: d.outcome_notes?.trim() || null,
            is_quarantined: !!d.is_quarantined,
          })
        )}
        className="flex flex-col gap-4 pt-2"
      >
        {caseRow && (
          <div className="rounded-lg border px-3 py-2.5" style={{ borderColor: "var(--border)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
              {caseRow.tag_number} {caseRow.animal_name ? `— ${caseRow.animal_name}` : ""}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {caseRow.diagnosis} · {caseRow.severity} · since {fmtDate(caseRow.diagnosed_on)}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">
            New status <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={CASE_STATUS_OPTIONS}
                optionLabel="label"
                optionValue="value"
                className="w-full"
              />
            )}
          />
        </div>

        {closing && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">Outcome date</label>
            <Controller
              name="outcome_date"
              control={control}
              render={({ field }) => (
                <Calendar
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  appendTo={document.body}
                  className="w-full"
                />
              )}
            />
            <p className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
              Recovery / loss date — used for recovery time and mortality reports.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Outcome notes</label>
          <Controller
            name="outcome_notes"
            control={control}
            render={({ field }) => (
              <InputTextarea
                rows={2}
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder="e.g. Completed 5-day course, milk cleared"
                className="w-full"
              />
            )}
          />
        </div>

        {closing ? (
          <div
            className="flex items-center justify-between rounded-lg border px-3 py-2.5"
            style={{ borderColor: "var(--border)" }}
          >
            <span className="text-sm">Keep animal in quarantine</span>
            <Controller
              name="is_quarantined"
              control={control}
              render={({ field }) => (
                <InputSwitch checked={!!quarantined} onChange={(e) => field.onChange(e.value)} />
              )}
            />
          </div>
        ) : null}

        <Button
          type="submit"
          label={saving ? "Saving…" : "Update Outcome"}
          loading={saving}
          className="!w-full !justify-center !rounded-lg !py-2.5 !text-sm !font-semibold"
        />
      </form>
    </Dialog>
  );
}

// ── Treatment (medicine given for a case) ────────────────────

const blankTreatment = () => ({
  medicine_id: null,
  medicine_name: "",
  dosage: "",
  route: null,
  frequency: "",
  start_date: new Date(),
  end_date: null,
  administered_by: "",
  withdrawal_days: null,
  cost: null,
  notes: "",
});

export function TreatmentDialog({ open, onHide, saving, editing, medicines, caseLabel, onSubmitForm }) {
  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(TreatmentSchema),
    defaultValues: blankTreatment(),
  });

  const pickedMedicineId = watch("medicine_id");

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            medicine_id: editing.medicine_id ?? null,
            medicine_name: editing.medicine_id ? "" : editing.medicine_name || "",
            dosage: editing.dosage || "",
            route: editing.route || null,
            frequency: editing.frequency || "",
            start_date: editing.start_date ? new Date(editing.start_date) : new Date(),
            end_date: editing.end_date ? new Date(editing.end_date) : null,
            administered_by: editing.administered_by || "",
            withdrawal_days: editing.withdrawal_days ?? null,
            cost: editing.cost ?? null,
            notes: editing.notes || "",
          }
        : blankTreatment()
    );
  }, [open, editing, reset]);

  // Catalogue medicine pre-fills its withdrawal window.
  const handleMedicinePick = (id, onChange) => {
    onChange(id ?? null);
    const picked = (medicines || []).find((m) => m.id === id);
    if (!picked) return;
    if (picked.withdrawal_days != null) setValue("withdrawal_days", picked.withdrawal_days);
    setValue("medicine_name", "");
  };

  const medicineOptions = (medicines || []).map((m) => ({
    label: `${m.name}${m.unit ? ` (${m.unit})` : ""}${m.withdrawal_days ? ` · ${m.withdrawal_days}d withdrawal` : ""}`,
    value: m.id,
  }));
  const pickedMedicine = (medicines || []).find((m) => m.id === pickedMedicineId);

  return (
    <Dialog
      header={editing ? "Edit Treatment" : "Add Treatment"}
      visible={open}
      onHide={onHide}
      style={{ width: "40rem" }}
      className="hl-dialog"
    >
      <style>{dialogStyles}</style>
      <form
        onSubmit={handleSubmit((d) =>
          onSubmitForm({
            medicine_id: d.medicine_id ?? null,
            medicine_name: d.medicine_id ? null : d.medicine_name?.trim() || null,
            dosage: d.dosage?.trim() || null,
            route: d.route || null,
            frequency: d.frequency?.trim() || null,
            start_date: d.start_date,
            end_date: d.end_date,
            administered_by: d.administered_by?.trim() || null,
            withdrawal_days: d.withdrawal_days ?? null,
            cost: d.cost ?? null,
            notes: d.notes?.trim() || null,
          })
        )}
        className="flex flex-col gap-4 pt-2"
      >
        {caseLabel && (
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Case: <span style={{ color: "var(--text)" }}>{caseLabel}</span>
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">Medicine (catalogue)</label>
            <Controller
              name="medicine_id"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(e) => handleMedicinePick(e.value, field.onChange)}
                  options={medicineOptions}
                  filter
                  showClear
                  placeholder="Optional — or type below"
                  className="w-full"
                />
              )}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">
              Medicine name {!pickedMedicineId && <span style={{ color: "var(--danger)" }}>*</span>}
            </label>
            <InputText
              {...register("medicine_name")}
              disabled={!!pickedMedicineId}
              placeholder="e.g. Oxytetracycline 20%"
              className="w-full"
            />
            {errors.medicine_name && <p className="err text-xs">{errors.medicine_name.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">Dosage</label>
            <InputText {...register("dosage")} placeholder="e.g. 10 ml" className="w-full" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">Route</label>
            <Controller
              name="route"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={ROUTE_OPTIONS}
                  optionLabel="label"
                  optionValue="value"
                  showClear
                  placeholder="Select route"
                  className="w-full"
                />
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">Frequency</label>
            <InputText {...register("frequency")} placeholder="e.g. Twice daily" className="w-full" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">Withdrawal (days)</label>
            <Controller
              name="withdrawal_days"
              control={control}
              render={({ field }) => (
                <InputNumber
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  min={0}
                  maxFractionDigits={0}
                  className="w-full"
                  inputClassName="w-full"
                />
              )}
            />
            {pickedMedicine?.withdrawal_days != null && (
              <p className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
                From catalogue: {pickedMedicine.withdrawal_days} days
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">
              Start date <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <Controller
              name="start_date"
              control={control}
              render={({ field }) => (
                <Calendar
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  appendTo={document.body}
                  className="w-full"
                />
              )}
            />
            {errors.start_date && <p className="err text-xs">{errors.start_date.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">End date</label>
            <Controller
              name="end_date"
              control={control}
              render={({ field }) => (
                <Calendar
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="dd/mm/yy"
                  showIcon
                  showClear
                  appendTo={document.body}
                  className="w-full"
                />
              )}
            />
            {errors.end_date && <p className="err text-xs">{errors.end_date.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">Administered by</label>
            <InputText
              {...register("administered_by")}
              placeholder="Vet or staff name"
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">Cost (Rs.)</label>
            <Controller
              name="cost"
              control={control}
              render={({ field }) => (
                <InputNumber
                  value={field.value}
                  onValueChange={(e) => field.onChange(e.value)}
                  min={0}
                  minFractionDigits={0}
                  maxFractionDigits={2}
                  className="w-full"
                  inputClassName="w-full"
                />
              )}
            />
            {errors.cost && <p className="err text-xs">{errors.cost.message}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Notes</label>
          <InputTextarea rows={2} {...register("notes")} className="w-full" />
        </div>

        <Button
          type="submit"
          label={saving ? "Saving…" : editing ? "Save Changes" : "Add Treatment"}
          loading={saving}
          className="!w-full !justify-center !rounded-lg !py-2.5 !text-sm !font-semibold"
        />
      </form>
    </Dialog>
  );
}

// ── Case detail + treatment list ─────────────────────────────

export function CaseDetailDialog({
  open,
  onHide,
  detail,
  loading,
  canManage,
  onEdit,
  onOutcome,
  onAddTreatment,
  onEditTreatment,
  onDeleteTreatment,
}) {
  const d = detail || {};
  const treatments = d.treatments || [];
  const active = d.state === "active";

  const treatmentActions = (row) =>
    canManage ? (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onEditTreatment(row)}
          title="Edit treatment"
          className="p-1.5 transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={() => onDeleteTreatment(row)}
          title="Delete treatment"
          className="p-1.5 transition-colors"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
        >
          <Trash2 size={15} />
        </button>
      </div>
    ) : null;

  const stat = (label, value, hint) => (
    <div
      className="rounded-lg border px-3 py-2.5"
      style={{ backgroundColor: "var(--bg-muted)", borderColor: "var(--border)" }}
    >
      <p
        className="text-[0.68rem] font-semibold uppercase tracking-wide"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
        {value}
      </p>
      {hint && (
        <p className="text-[0.68rem]" style={{ color: "var(--text-muted)" }}>
          {hint}
        </p>
      )}
    </div>
  );

  return (
    <Dialog
      header="Health Case Detail"
      visible={open}
      onHide={onHide}
      style={{ width: "52rem" }}
      className="hl-dialog"
    >
      <style>{dialogStyles}</style>

      {loading ? (
        <p className="py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Loading case…
        </p>
      ) : (
        <div className="flex flex-col gap-4 pt-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p
                className="font-display text-lg font-semibold"
                style={{ color: "var(--text-heading)" }}
              >
                {d.tag_number || "—"}
                {d.animal_name ? ` — ${d.animal_name}` : ""}
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {d.diagnosis || "—"}
                {d.animal_type ? ` · ${d.animal_type}` : ""}
                {d.breed ? ` · ${d.breed}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge value={caseStatusLabel(d.status)} severity={statusSeverity(d.status)} />
              <Badge value={d.severity || "—"} severity={severitySeverity(d.severity)} />
              {d.is_contagious && <Badge value="Contagious" severity="danger" />}
              {d.is_quarantined && active && <Badge value="Quarantined" severity="warning" />}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stat(
              "Diagnosed on",
              fmtDate(d.diagnosed_on),
              d.diagnosed_by ? `by ${d.diagnosed_by}` : null
            )}
            {stat(
              active ? "Days open" : "Duration",
              d.open_days == null ? "—" : `${d.open_days} day${d.open_days === 1 ? "" : "s"}`,
              active ? "still open" : `closed ${fmtDate(d.outcome_date)}`
            )}
            {stat(
              "Treatments",
              `${d.treatment_count ?? treatments.length}`,
              `Rs. ${Number(d.treatment_cost || 0).toLocaleString()}`
            )}
            {stat(
              "Withdrawal until",
              treatments.length
                ? fmtDate(
                    treatments.reduce(
                      (max, t) =>
                        !max || new Date(t.withdrawal_end_date) > new Date(max)
                          ? t.withdrawal_end_date
                          : max,
                      null
                    )
                  )
                : "—",
              "milk / meat clearance"
            )}
          </div>

          {(d.symptoms || d.notes || d.outcome_notes) && (
            <div
              className="flex flex-col gap-2 rounded-lg border p-3"
              style={{ borderColor: "var(--border)" }}
            >
              {d.symptoms && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  <span className="font-semibold" style={{ color: "var(--text)" }}>
                    Symptoms:{" "}
                  </span>
                  {d.symptoms}
                </p>
              )}
              {d.notes && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  <span className="font-semibold" style={{ color: "var(--text)" }}>
                    Notes:{" "}
                  </span>
                  {d.notes}
                </p>
              )}
              {d.outcome_notes && (
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  <span className="font-semibold" style={{ color: "var(--text)" }}>
                    Outcome:{" "}
                  </span>
                  {d.outcome_notes}
                </p>
              )}
            </div>
          )}
          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3
                className="font-display text-base font-semibold"
                style={{ color: "var(--text-heading)" }}
              >
                Treatments
              </h3>
              {canManage && (
                <Button
                  label="Add Treatment"
                  icon={<Plus size={15} className="mr-1.5" />}
                  onClick={() => onAddTreatment(d)}
                  className="!rounded-lg !px-3 !py-2 !text-sm !font-semibold !text-white"
                  style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
                />
              )}
            </div>

            <DataTable
              value={treatments}
              size="small"
              paginator={treatments.length > 5}
              rows={5}
              emptyMessage="No treatment recorded for this case yet."
            >
              <Column
                header="Medicine"
                body={(r) => (
                  <>
                    <span className="text-sm font-semibold" style={{ color: "var(--text-heading)" }}>
                      {r.medicine_name || "—"}
                    </span>
                    {r.medicine_unit && (
                      <span className="text-[0.72rem]" style={{ color: "var(--text-muted)" }}>
                        {r.medicine_unit}
                      </span>
                    )}
                  </>
                )}
              />
              <Column field="dosage" header="Dosage" body={(r) => r.dosage || "—"} />
              <Column header="Route" body={(r) => (r.route ? labelFor(ROUTE_OPTIONS, r.route) : "—")} />
              <Column header="Start" body={(r) => fmtDate(r.start_date)} />
              <Column header="End" body={(r) => fmtDate(r.end_date)} />
              <Column
                header="Withdrawal"
                body={(r) =>
                  r.withdrawal_days == null
                    ? "—"
                    : `${r.withdrawal_days}d → ${fmtDate(r.withdrawal_end_date)}`
                }
              />
              <Column
                header="Cost"
                body={(r) => (r.cost == null ? "—" : `Rs. ${Number(r.cost).toLocaleString()}`)}
              />
              {canManage && <Column header="" body={treatmentActions} style={{ width: "70px" }} />}
            </DataTable>
          </div>

          {canManage && (
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                label="Edit Case"
                icon={<Pencil size={15} className="mr-1.5" />}
                outlined
                onClick={() => onEdit(d)}
                className="!rounded-lg !px-3 !py-2 !text-sm !font-semibold"
                style={{ borderColor: "var(--border)", color: "var(--text)" }}
              />
              <Button
                label="Update Outcome"
                onClick={() => onOutcome(d)}
                className="!rounded-lg !px-4 !py-2 !text-sm !font-semibold !text-white"
                style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
              />
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
}

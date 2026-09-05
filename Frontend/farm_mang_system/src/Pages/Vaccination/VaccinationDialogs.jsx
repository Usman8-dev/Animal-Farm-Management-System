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
import {
  VaccinationTypeSchema,
  VaccinationSchema,
} from "../../validations/VaccinationSchema";

const dialogStyles = `
  .vac-dialog.p-dialog, .vac-dialog .p-dialog-header, .vac-dialog .p-dialog-content { background: var(--bg-card) !important; }
  .vac-dialog.p-dialog { border: 1px solid var(--border) !important; }
  .vac-dialog .p-dialog-header { color: var(--text-heading) !important; border-bottom: 1px solid var(--border) !important; }
  .vac-dialog .p-dialog-title { color: var(--text-heading) !important; font-weight: 600; }
  .vac-dialog .p-dialog-header-icon { color: var(--text-muted) !important; }
  .vac-dialog .p-dialog-content { color: var(--text) !important; }
  .vac-dialog .p-inputtext, .vac-dialog .p-inputnumber-input, .vac-dialog .p-inputtextarea, .vac-dialog .p-dropdown, .vac-dialog .p-calendar {
    background: var(--bg-muted) !important; border: 1px solid var(--border) !important;
    color: var(--text) !important; border-radius: 0.5rem; width: 100%;
  }
  .vac-dialog .p-dropdown-label, .vac-dialog .p-dropdown-item { color: var(--text) !important; }
  .vac-dialog .p-dropdown-panel { background: var(--bg-card) !important; border-color: var(--border) !important; }
  .vac-dialog .p-dropdown-item.p-highlight, .vac-dialog .p-dropdown-item:hover { background: var(--bg-muted) !important; }
  .vac-dialog label { color: var(--text); }
  .vac-dialog .err { color: var(--danger); }
  .vac-dialog .p-button { background: var(--primary) !important; border-color: var(--primary) !important; color: #fff !important; }
`;

const animalLabel = (a) => `${a.tag_number}${a.name ? ` — ${a.name}` : ""}`;

export function VaccinationTypeDialog({ open, onHide, saving, editing, onSubmitForm }) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm({
    resolver: yupResolver(VaccinationTypeSchema),
    defaultValues: { code: "", name: "", description: "", is_active: true },
  });

  const isActive = watch("is_active");

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? { code: editing.code, name: editing.name, description: editing.description || "", is_active: editing.is_active }
        : { code: "", name: "", description: "", is_active: true }
    );
  }, [open, editing, reset]);

  return (
    <Dialog header={editing ? "Edit Vaccination Type" : "Add Vaccination Type"} visible={open} onHide={onHide} style={{ width: "30rem" }} className="vac-dialog">
      <style>{dialogStyles}</style>
      <form
        onSubmit={handleSubmit((d) =>
          onSubmitForm({
            code: d.code.trim(),
            name: d.name.trim(),
            description: d.description?.trim() || null,
            is_active: d.is_active,
          })
        )}
        className="flex flex-col gap-4 pt-2"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Code <span style={{ color: "var(--danger)" }}>*</span></label>
          <InputText {...register("code")} placeholder="e.g. FMD" className="w-full" />
          {errors.code && <p className="err text-xs">{errors.code.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Name <span style={{ color: "var(--danger)" }}>*</span></label>
          <InputText {...register("name")} placeholder="e.g. Foot & Mouth Disease" className="w-full" />
          {errors.name && <p className="err text-xs">{errors.name.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Description (optional)</label>
          <InputTextarea rows={2} {...register("description")} className="w-full" />
        </div>
        <div className="flex items-center justify-between">
          <label className="text-[0.8rem] font-semibold">Active</label>
          <InputSwitch checked={isActive} onChange={(e) => setValue("is_active", e.value)} />
        </div>
        <Button type="submit" label={saving ? "Saving…" : "Save"} loading={saving} className="!w-full !justify-center !rounded-lg !py-2.5 !text-sm !font-semibold" />
      </form>
    </Dialog>
  );
}
export function VaccinationDialog({ open, onHide, saving, editing, animals, vaccinationTypes, onSubmitForm }) {
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(VaccinationSchema),
    defaultValues: {
      animal_id: null,
      vaccination_type_id: null,
      category: "NORMAL",
      administered_date: new Date(),
      next_due_date: null,
      dose_number: null,
      batch_number: "",
      administered_by: "",
      cost: null,
      notes: "",
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            animal_id: editing.animal_id,
            vaccination_type_id: editing.vaccination_type_id,
            category: editing.category || "NORMAL",
            administered_date: editing.administered_date ? new Date(editing.administered_date) : new Date(),
            next_due_date: editing.next_due_date ? new Date(editing.next_due_date) : null,
            dose_number: editing.dose_number,
            batch_number: editing.batch_number || "",
            administered_by: editing.administered_by || "",
            cost: editing.cost == null ? null : Number(editing.cost),
            notes: editing.notes || "",
          }
        : {
            animal_id: null,
            vaccination_type_id: null,
            category: "NORMAL",
            administered_date: new Date(),
            next_due_date: null,
            dose_number: null,
            batch_number: "",
            administered_by: "",
            cost: null,
            notes: "",
          }
    );
  }, [open, editing, reset]);

  const animalOptions = animals.map((a) => ({ id: a.id, label: animalLabel(a) }));
  const typeOptions = vaccinationTypes.map((t) => ({ id: t.id, label: t.name }));

  return (
    <Dialog header={editing ? "Edit Vaccination" : "Record Vaccination"} visible={open} onHide={onHide} style={{ width: "32rem" }} className="vac-dialog">
      <style>{dialogStyles}</style>
      <form
        onSubmit={handleSubmit((d) =>
          onSubmitForm({
            animal_id: d.animal_id,
            vaccination_type_id: d.vaccination_type_id,
            category: d.category || "NORMAL",
            administered_date: d.administered_date,
            next_due_date: d.next_due_date || null,
            dose_number: d.dose_number || null,
            batch_number: d.batch_number?.trim() || null,
            administered_by: d.administered_by?.trim() || null,
            cost: d.cost,
            notes: d.notes?.trim() || null,
          })
        )}
        className="flex flex-col gap-4 pt-2"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Animal <span style={{ color: "var(--danger)" }}>*</span></label>
          <Controller name="animal_id" control={control} render={({ field }) => (
            <Dropdown value={field.value} onChange={(e) => field.onChange(e.value)} options={animalOptions} optionLabel="label" optionValue="id" placeholder="Select animal" filter showClear className="w-full" />
          )} />
          {errors.animal_id && <p className="err text-xs">{errors.animal_id.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Vaccine <span style={{ color: "var(--danger)" }}>*</span></label>
          <Controller name="vaccination_type_id" control={control} render={({ field }) => (
            <Dropdown value={field.value} onChange={(e) => field.onChange(e.value)} options={typeOptions} optionLabel="label" optionValue="id" placeholder="Select vaccine" filter showClear className="w-full" />
          )} />
          {errors.vaccination_type_id && <p className="err text-xs">{errors.vaccination_type_id.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Category</label>
          <Controller name="category" control={control} render={({ field }) => (
            <Dropdown value={field.value || "NORMAL"} onChange={(e) => field.onChange(e.value)} options={[
              { label: "Normal", value: "NORMAL" },
              { label: "Seasonal", value: "SEASONAL" },
            ]} optionLabel="label" optionValue="value" placeholder="Select category" className="w-full" />
          )} />
          {errors.category && <p className="err text-xs">{errors.category.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Administered date <span style={{ color: "var(--danger)" }}>*</span></label>
          <Controller name="administered_date" control={control} render={({ field }) => (
            <Calendar value={field.value} onChange={(e) => field.onChange(e.value)} dateFormat="dd/mm/yy" showIcon appendTo={document.body} className="w-full" />
          )} />
          {errors.administered_date && <p className="err text-xs">{errors.administered_date.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Due date</label>
          <Controller name="next_due_date" control={control} render={({ field }) => (
            <Calendar value={field.value} onChange={(e) => field.onChange(e.value)} dateFormat="dd/mm/yy" showIcon showClear appendTo={document.body} className="w-full" />
          )} />
          {errors.next_due_date && <p className="err text-xs">{errors.next_due_date.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">Dose number</label>
            <Controller name="dose_number" control={control} render={({ field }) => (
              <InputNumber value={field.value} onValueChange={(e) => field.onChange(e.value)} min={1} className="w-full" inputClassName="w-full" />
            )} />
            {errors.dose_number && <p className="err text-xs">{errors.dose_number.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">Cost (Rs.)</label>
            <Controller name="cost" control={control} render={({ field }) => (
              <InputNumber value={field.value} onValueChange={(e) => field.onChange(e.value)} min={0} minFractionDigits={0} maxFractionDigits={2} className="w-full" inputClassName="w-full" />
            )} />
            {errors.cost && <p className="err text-xs">{errors.cost.message}</p>}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Batch number</label>
          <InputText {...register("batch_number")} placeholder="e.g. FMD-2026-A" className="w-full" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Administered by</label>
          <InputText {...register("administered_by")} placeholder="Vet or staff name" className="w-full" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Notes (optional)</label>
          <InputTextarea rows={2} {...register("notes")} className="w-full" />
        </div>
        <Button type="submit" label={saving ? "Saving…" : (editing ? "Save Changes" : "Record Vaccination")} loading={saving} className="!w-full !justify-center !rounded-lg !py-2.5 !text-sm !font-semibold" />
      </form>
    </Dialog>
  );
}
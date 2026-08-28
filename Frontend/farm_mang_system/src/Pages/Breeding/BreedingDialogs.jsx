import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import {
  PregnancyServiceSchema,
  ConfirmPregnancySchema,
  ClosePregnancySchema,
  BirthSchema,
  KidSchema,
  RegisterKidSchema,
} from "../../validations/BreedingSchema";

const dialogStyles = `
  .br-dialog.p-dialog, .br-dialog .p-dialog-header, .br-dialog .p-dialog-content { background: var(--bg-card) !important; }
  .br-dialog.p-dialog { border: 1px solid var(--border) !important; }
  .br-dialog .p-dialog-header { color: var(--text-heading) !important; border-bottom: 1px solid var(--border) !important; }
  .br-dialog .p-dialog-title { color: var(--text-heading) !important; font-weight: 600; }
  .br-dialog .p-dialog-header-icon { color: var(--text-muted) !important; }
  .br-dialog .p-dialog-content { color: var(--text) !important; }
  .br-dialog .p-inputtext, .br-dialog .p-inputnumber-input, .br-dialog .p-inputtextarea, .br-dialog .p-dropdown {
    background: var(--bg-muted) !important; border: 1px solid var(--border) !important;
    color: var(--text) !important; border-radius: 0.5rem; width: 100%;
  }
  .br-dialog .p-dropdown-label, .br-dialog .p-dropdown-item { color: var(--text) !important; }
  .br-dialog .p-dropdown-panel { background: var(--bg-card) !important; border-color: var(--border) !important; }
  .br-dialog .p-dropdown-item.p-highlight, .br-dialog .p-dropdown-item:hover { background: var(--bg-muted) !important; }
  .br-dialog label { color: var(--text); }
  .br-dialog .err { color: var(--danger); }
  .br-dialog .p-button { background: var(--primary) !important; border-color: var(--primary) !important; color: #fff !important; }
`;

const animalOption = (a) => ({
  id: a.id,
  name: a.name || "",
  tag: a.tag_number,
  // Shown in the dropdown list and as the selected value: "TAG — Name"
  label: `${a.tag_number}${a.name ? ` — ${a.name}` : ""}`,
});

export function RecordServiceDialog({ open, onHide, saving, animals, onSubmitForm }) {
  const { control, register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(PregnancyServiceSchema),
    defaultValues: { dam_id: null, sire_id: null, sire_ref: "", service_date: new Date(), notes: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset({ dam_id: null, sire_id: null, sire_ref: "", service_date: new Date(), notes: "" });
  }, [open, reset]);

  const sireId = watch("sire_id");

  // Dam must be female; sire may be any registered animal except a female.
  const isFemaleAnimal = (a) => (a.gender?.name || "").toLowerCase().includes("female");
  const damOptions = animals.filter(isFemaleAnimal).map(animalOption);
  const sireOptions = animals.filter((a) => !isFemaleAnimal(a)).map(animalOption);

  return (
    <Dialog header="Record Service / Mating" visible={open} onHide={onHide} style={{ width: "30rem" }} className="br-dialog">
      <style>{dialogStyles}</style>
      <form
        onSubmit={handleSubmit((d) =>
          onSubmitForm({
            dam_id: d.dam_id,
            sire_id: d.sire_id || null,
            sire_ref: sireId ? null : d.sire_ref?.trim() || null,
            service_date: new Date(d.service_date).toISOString(),
            notes: d.notes?.trim() || null,
          })
        )}
        className="flex flex-col gap-4 pt-2"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Female Animal</label>
          <Controller name="dam_id" control={control} render={({ field }) => (
            <Dropdown value={field.value} onChange={(e) => field.onChange(e.value)} options={damOptions} optionLabel="label" optionValue="id" filter placeholder="Select female animal" />
          )} />
          {errors.dam_id && <small className="err text-xs">{errors.dam_id.message}</small>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Male Animal</label>
          <Controller name="sire_id" control={control} render={({ field }) => (
            <Dropdown value={field.value} onChange={(e) => field.onChange(e.value)} options={sireOptions} optionLabel="label" optionValue="id" filter showClear placeholder="Select a male animal (or use a reference below)" />
          )} />
        </div>

        {!sireId && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">Male Animal reference / external</label>
            <InputText {...register("sire_ref")} placeholder="e.g. AI semen KAZ-118" className="w-full" />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Service date</label>
          <Controller name="service_date" control={control} render={({ field }) => (
            <Calendar value={field.value} onChange={(e) => field.onChange(e.value)} dateFormat="yy-mm-dd" showIcon className="w-full" appendTo={document.body} />
          )} />
          {errors.service_date && <p className="err text-xs">{errors.service_date.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Notes (optional)</label>
          <InputTextarea rows={2} {...register("notes")} className="w-full" />
        </div>

        <Button type="submit" label={saving ? "Saving…" : "Save Service"} loading={saving} className="!w-full !justify-center !rounded-lg !py-2.5 !text-sm !font-semibold" />
      </form>
    </Dialog>
  );
}

export function ConfirmPregnancyDialog({ open, onHide, saving, onSubmitForm }) {
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(ConfirmPregnancySchema),
    defaultValues: { confirmed_date: new Date() },
  });

  useEffect(() => { if (open) reset({ confirmed_date: new Date() }); }, [open, reset]);

  return (
    <Dialog header="Confirm Pregnancy" visible={open} onHide={onHide} style={{ width: "26rem" }} className="br-dialog">
      <style>{dialogStyles}</style>
      <form
        onSubmit={handleSubmit((d) => onSubmitForm({ confirmed_date: new Date(d.confirmed_date).toISOString() }))}
        className="flex flex-col gap-4 pt-2"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Expected delivery date</label>
          <Controller name="confirmed_date" control={control} render={({ field }) => (
            <Calendar value={field.value} onChange={(e) => field.onChange(e.value)} dateFormat="yy-mm-dd" showIcon className="w-full" appendTo={document.body} />
          )} />
          {errors.confirmed_date && <p className="err text-xs">{errors.confirmed_date.message}</p>}
        </div>
        <Button type="submit" label={saving ? "Saving…" : "Confirm"} loading={saving} className="!w-full !justify-center !rounded-lg !py-2.5 !text-sm !font-semibold" />
      </form>
    </Dialog>
  );
}

export function ClosePregnancyDialog({ open, onHide, saving, onSubmitForm }) {
  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(ClosePregnancySchema),
    defaultValues: { outcome: null, outcome_date: new Date() },
  });

  useEffect(() => { if (open) reset({ outcome: null, outcome_date: new Date() }); }, [open, reset]);

  const outcomeOptions = [
    { label: "Live birth", value: "LIVE_BIRTH" },
    { label: "Stillbirth (all)", value: "STILLBIRTH" },
    { label: "Aborted", value: "ABORTED" },
    { label: "Not pregnant", value: "NOT_PREGNANT" },
  ];

  return (
    <Dialog header="Close Pregnancy" visible={open} onHide={onHide} style={{ width: "28rem" }} className="br-dialog">
      <style>{dialogStyles}</style>
      <form
        onSubmit={handleSubmit((d) => onSubmitForm({ outcome: d.outcome, outcome_date: new Date(d.outcome_date).toISOString() }))}
        className="flex flex-col gap-4 pt-2"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Outcome</label>
          <Controller name="outcome" control={control} render={({ field }) => (
            <Dropdown value={field.value} onChange={(e) => field.onChange(e.value)} options={outcomeOptions} optionLabel="label" optionValue="value" placeholder="Select outcome" />
          )} />
          {errors.outcome && <p className="err text-xs">{errors.outcome.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Outcome date</label>
          <Controller name="outcome_date" control={control} render={({ field }) => (
            <Calendar value={field.value} onChange={(e) => field.onChange(e.value)} dateFormat="yy-mm-dd" showIcon className="w-full" appendTo={document.body} />
          )} />
          {errors.outcome_date && <p className="err text-xs">{errors.outcome_date.message}</p>}
        </div>
        <Button type="submit" label={saving ? "Saving…" : "Close Pregnancy"} loading={saving} className="!w-full !justify-center !rounded-lg !py-2.5 !text-sm !font-semibold" />
      </form>
    </Dialog>
  );
}

export function RecordBirthDialog({
  open,
  onHide,
  saving,
  animalTypes,
  breeds,
  genders,
  animals,
  pregnancy,
  onSubmitForm,
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(BirthSchema),
    defaultValues: {
      birth_date: new Date(),
      birth_weight_kg: null,
      notes: "",
      tag_number: "",
      name: "",
      animal_type_id: null,
      breed_id: null,
      gender_id: null,
    },
  });

  useEffect(() => {
    if (!open) return;
    // The newborn inherits its Animal Type and Breed from the mother (Female).
    // Prefer the dam's own values carried on the pregnancy row; fall back to the
    // animals list in case they are missing (e.g. older records).
    const dam = animals.find((a) => a.id === pregnancy?.dam?.id);
    reset({
      birth_date: new Date(),
      birth_weight_kg: null,
      notes: "",
      tag_number: "",
      name: "",
      animal_type_id: pregnancy?.dam?.animal_type_id ?? dam?.animal_type_id ?? null,
      breed_id: pregnancy?.dam?.breed_id ?? dam?.breed_id ?? null,
      gender_id: null,
    });
  }, [open, reset, animals, pregnancy]);

  const typeId = watch("animal_type_id");
  const typeOptions = (animalTypes || []).map((t) => ({ label: t.name, value: t.id }));
  const breedOptions = (breeds || [])
    .filter((b) => b.animal_type_id === typeId)
    .map((b) => ({ label: b.name, value: b.id }));
  const genderOptions = (genders || []).map((g) => ({ label: g.name, value: g.id }));

  return (
    <Dialog header="Record Birth" visible={open} onHide={onHide} style={{ width: "32rem" }} className="br-dialog">
      <style>{dialogStyles}</style>
      <form
        onSubmit={handleSubmit((d) =>
          onSubmitForm({
            birth_date: new Date(d.birth_date).toISOString(),
            notes: d.notes?.trim() || null,
            kid: {
              tag_number: d.tag_number.trim(),
              name: d.name?.trim() || null,
              animal_type_id: d.animal_type_id,
              breed_id: d.breed_id,
              gender_id: d.gender_id,
              birth_weight_kg: d.birth_weight_kg ?? null,
              notes: d.notes?.trim() || null,
            },
          })
        )}
        className="flex flex-col gap-4 pt-2"
      >
        <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-muted)" }}>
          This will record the birth and automatically register the newborn as a new animal.
          {pregnancy?.dam && <div><strong style={{ color: "var(--text)" }}>Female:</strong> {pregnancy.dam.tag_number}</div>}
          {pregnancy?.sire && <div><strong style={{ color: "var(--text)" }}>Male:</strong> {pregnancy.sire.tag_number}</div>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">Birth date</label>
            <Controller name="birth_date" control={control} render={({ field }) => (
              <Calendar value={field.value} onChange={(e) => field.onChange(e.value)} dateFormat="yy-mm-dd" showIcon className="w-full" appendTo={document.body} />
            )} />
            {errors.birth_date && <p className="err text-xs">{errors.birth_date.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">Birth weight (kg)</label>
            <Controller name="birth_weight_kg" control={control} render={({ field }) => (
              <InputNumber value={field.value} onValueChange={(e) => field.onChange(e.value)} minFractionDigits={0} maxFractionDigits={2} className="w-full" inputClassName="w-full" />
            )} />
            {errors.birth_weight_kg && <p className="err text-xs">{errors.birth_weight_kg.message}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Tag number</label>
          <InputText {...register("tag_number")} placeholder="Unique tag on this farm" className="w-full" />
          {errors.tag_number && <p className="err text-xs">{errors.tag_number.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Name (optional)</label>
          <InputText {...register("name")} placeholder="e.g. Buttercup Jr." className="w-full" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">Animal type</label>
            <Controller name="animal_type_id" control={control} render={({ field }) => (
              <Dropdown value={field.value} onChange={(e) => { field.onChange(e.value); setValue("breed_id", null); }} options={typeOptions} optionLabel="label" optionValue="value" placeholder="Select type" filter className="w-full" />
            )} />
            {errors.animal_type_id && <p className="err text-xs">{errors.animal_type_id.message}</p>}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold">Breed</label>
            <Controller name="breed_id" control={control} render={({ field }) => (
              <Dropdown value={field.value} onChange={(e) => field.onChange(e.value)} options={breedOptions} optionLabel="label" optionValue="value" placeholder={typeId ? "Select breed" : "Pick type first"} disabled={!typeId} filter className="w-full" />
            )} />
            {errors.breed_id && <p className="err text-xs">{errors.breed_id.message}</p>}
          </div>
        </div>
        <p className="-mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
          Animal type &amp; breed are pre-filled from the newborn's mother (♀) — update them if needed.
        </p>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Gender</label>
          <Controller name="gender_id" control={control} render={({ field }) => (
            <Dropdown value={field.value} onChange={(e) => field.onChange(e.value)} options={genderOptions} optionLabel="label" optionValue="value" placeholder="Select gender" className="w-full" />
          )} />
          {errors.gender_id && <p className="err text-xs">{errors.gender_id.message}</p>}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Notes (optional)</label>
          <InputTextarea rows={2} {...register("notes")} className="w-full" />
        </div>

        <Button type="submit" label={saving ? "Saving…" : "Save Birth"} loading={saving} className="!w-full !justify-center !rounded-lg !py-2.5 !text-sm !font-semibold" />
      </form>
    </Dialog>
  );
}



export function AddKidDialog({ open, onHide, saving, onSubmitForm }) {
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(KidSchema),
    defaultValues: { is_stillborn: false, gender: "", birth_weight_kg: null, notes: "" },
  });

  useEffect(() => {
    if (!open) return;
    reset({ is_stillborn: false, gender: "", birth_weight_kg: null, notes: "" });
  }, [open, reset]);

  return (
    <Dialog header="Register Offspring" visible={open} onHide={onHide} style={{ width: "28rem" }} className="br-dialog">
      <style>{dialogStyles}</style>
      <form
        onSubmit={handleSubmit((d) => onSubmitForm({
          is_stillborn: !!d.is_stillborn,
          gender: d.gender?.trim() || null,
          birth_weight_kg: d.birth_weight_kg ?? null,
          notes: d.notes?.trim() || null,
        }))}
        className="flex flex-col gap-4 pt-2"
      >
        <div className="flex items-center gap-3">
          <Controller name="is_stillborn" control={control} render={({ field }) => (
            <Checkbox inputId="kidStill" checked={!!field.value} onChange={(e) => field.onChange(e.checked)} />
          )} />
          <label htmlFor="kidStill" className="text-sm">Stillborn</label>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Sex / gender (optional)</label>
          <InputText {...register("gender")} placeholder="e.g. Female" className="w-full" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Birth weight (kg)</label>
          <Controller name="birth_weight_kg" control={control} render={({ field }) => (
            <InputNumber value={field.value} onValueChange={(e) => field.onChange(e.value)} minFractionDigits={0} maxFractionDigits={2} className="w-full" inputClassName="w-full" />
          )} />
          {errors.birth_weight_kg && <p className="err text-xs">{errors.birth_weight_kg.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Notes (optional)</label>
          <InputTextarea rows={2} {...register("notes")} className="w-full" />
        </div>
        <Button type="submit" label={saving ? "Saving…" : "Add Offspring"} loading={saving} className="!w-full !justify-center !rounded-lg !py-2.5 !text-sm !font-semibold" />
      </form>
    </Dialog>
  );
}

export function RegisterKidDialog({ open, onHide, saving, genders, onSubmitForm }) {
  const { control, register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(RegisterKidSchema),
    defaultValues: { tag_number: "", name: "", gender_id: null, notes: "" },
  });

  useEffect(() => { if (open) reset({ tag_number: "", name: "", gender_id: null, notes: "" }); }, [open, reset]);

  const genderOptions = genders.map((g) => ({ id: g.id, label: g.name }));

  return (
    <Dialog header="Register as New Animal" visible={open} onHide={onHide} style={{ width: "30rem" }} className="br-dialog">
      <style>{dialogStyles}</style>
      <form
        onSubmit={handleSubmit((d) => onSubmitForm({
          tag_number: d.tag_number.trim(),
          name: d.name?.trim() || null,
          gender_id: d.gender_id,
          notes: d.notes?.trim() || null,
        }))}
        className="flex flex-col gap-4 pt-2"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Tag number</label>
          <InputText {...register("tag_number")} placeholder="Unique tag on this farm" className="w-full" />
          {errors.tag_number && <p className="err text-xs">{errors.tag_number.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Name (optional)</label>
          <InputText {...register("name")} placeholder="e.g. Buttercup Jr." className="w-full" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Gender</label>
          <Controller name="gender_id" control={control} render={({ field }) => (
            <Dropdown value={field.value} onChange={(e) => field.onChange(e.value)} options={genderOptions} optionLabel="label" optionValue="id" placeholder="Select gender" />
          )} />
          {errors.gender_id && <p className="err text-xs">{errors.gender_id.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Notes (optional)</label>
          <InputTextarea rows={2} {...register("notes")} className="w-full" />
        </div>
        <Button type="submit" label={saving ? "Saving…" : "Register Animal"} loading={saving} className="!w-full !justify-center !rounded-lg !py-2.5 !text-sm !font-semibold" />
      </form>
    </Dialog>
  );
}
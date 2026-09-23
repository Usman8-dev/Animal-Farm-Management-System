import { useEffect } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { InputNumber } from "primereact/inputnumber";
import { Calendar } from "primereact/calendar";
import { Checkbox } from "primereact/checkbox";
import { Button } from "primereact/button";
import { Plus, Trash2 } from "lucide-react";
import {
  PregnancyServiceSchema,
  ConfirmPregnancySchema,
  ClosePregnancySchema,
  BirthSchema,
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

  // Dam must be female; sire must be a male flagged as a breeder.
  const isFemaleAnimal = (a) => (a.gender?.name || "").toLowerCase().includes("female");
  const damOptions = animals.filter(isFemaleAnimal).map(animalOption);
  const sireOptions = animals
    .filter((a) => !isFemaleAnimal(a) && a.breeder)
    .map(animalOption);

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
            <Dropdown value={field.value} onChange={(e) => field.onChange(e.value)} options={sireOptions} optionLabel="label" optionValue="id" filter showClear placeholder="Select a male breeder" />
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

// Dropdown options shared by the birth dialog.
const mapOptions = (list) => (list || []).map((x) => ({ label: x.name, value: x.id }));

// A blank child row. Animal Type & Breed follow the father (sire) — prefer the
// values carried on the pregnancy row, fall back to the animals list.
function blankKid(pregnancy, animals) {
  const sire = (animals || []).find((a) => a.id === pregnancy?.sire?.id);
  return {
    id: null,
    stillborn: false,
    tag_number: "",
    name: "",
    animal_type_id: pregnancy?.sire?.animal_type_id ?? sire?.animal_type_id ?? null,
    breed_id: pregnancy?.sire?.breed_id ?? sire?.breed_id ?? null,
    gender_id: null,
    gender: "",
    birth_weight_kg: null,
    notes: "",
  };
}

// Row values for a child already stored on the birth record (edit mode).
const storedKid = (kid) => ({
  id: kid.id,
  stillborn: !!kid.is_stillborn,
  tag_number: kid.animal?.tag_number || "",
  name: kid.animal?.name || "",
  animal_type_id: kid.animal?.animal_type_id ?? null,
  breed_id: kid.animal?.breed_id ?? null,
  gender_id: kid.animal?.gender_id ?? null,
  gender: kid.gender || "",
  birth_weight_kg: kid.birth_weight_kg != null ? Number(kid.birth_weight_kg) : null,
  notes: kid.notes || "",
});

export function RecordBirthDialog({
  open,
  onHide,
  saving,
  animalTypes,
  breeds,
  genders,
  animals,
  pregnancy,
  birth,
  onSubmitForm,
}) {
  // `birth` is set when the dialog is reopened to edit an existing record.
  const editing = !!birth;

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
    defaultValues: { birth_date: new Date(), notes: "", kids: [blankKid(null, [])] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "kids" });

  useEffect(() => {
    if (!open) return;

    if (birth) {
      const kids = (birth.kids || []).map(storedKid);
      reset({
        birth_date: birth.birth_date ? new Date(birth.birth_date) : new Date(),
        notes: birth.notes || "",
        kids: kids.length ? kids : [blankKid(pregnancy, animals)],
      });
      return;
    }

    reset({
      birth_date: new Date(),
      notes: "",
      kids: [blankKid(pregnancy, animals)],
    });
  }, [open, reset, animals, pregnancy, birth]);

  const typeOptions = mapOptions(animalTypes);
  const genderOptions = mapOptions(genders);
  const watchedKids = watch("kids") || [];
  const breedOptionsFor = (typeId) =>
    (breeds || [])
      .filter((b) => b.animal_type_id === typeId)
      .map((b) => ({ label: b.name, value: b.id }));

  return (
    <Dialog
      header={editing ? "Edit Birth Record" : "Record Birth"}
      visible={open}
      onHide={onHide}
      style={{ width: "44rem" }}
      contentStyle={{ maxHeight: "68vh", overflowY: "auto" }}
      className="br-dialog"
    >
      <style>{dialogStyles}</style>
      <form
        onSubmit={handleSubmit((d) =>
          onSubmitForm({
            birth_date: new Date(d.birth_date).toISOString(),
            notes: d.notes?.trim() || null,
            // One entry per child — every live child becomes its own animal.
            kids: (d.kids || []).map((k) => ({
              id: k.id || null,
              is_stillborn: !!k.stillborn,
              tag_number: k.stillborn ? null : k.tag_number?.trim() || null,
              name: k.stillborn ? null : k.name?.trim() || null,
              animal_type_id: k.stillborn ? null : k.animal_type_id ?? null,
              breed_id: k.stillborn ? null : k.breed_id ?? null,
              gender_id: k.stillborn ? null : k.gender_id ?? null,
              gender: k.stillborn ? k.gender?.trim() || null : null,
              birth_weight_kg: k.birth_weight_kg ?? null,
              notes: k.notes?.trim() || null,
            })),
          })
        )}
        className="flex flex-col gap-4 pt-2"
      >
        <div className="rounded-lg p-3 text-xs" style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-muted)" }}>
          {editing
            ? "Update this birth record. Edited children update their animal records, new children are registered as animals, and removed children are deleted."
            : "Every live child is registered in the Animals module automatically — use \"Add another child\" for twins, triplets, and so on."}
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
            <label className="text-[0.8rem] font-semibold">Birth notes (optional)</label>
            <InputTextarea rows={1} {...register("notes")} className="w-full" />
          </div>
        </div>

        {/* One entry per child — twins, triplets, stillborn, … */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-[0.8rem] font-semibold">Children</label>
            <Button
              type="button"
              label="Add another child"
              text
              icon={<Plus size={14} />}
              onClick={() => append(blankKid(pregnancy, animals))}
              className="!px-0 !text-sm"
            />
          </div>
          {errors.kids?.message && <p className="err text-xs">{errors.kids.message}</p>}

          {fields.map((kid, idx) => {
            const kidErr = errors.kids?.[idx] || {};
            const watched = watchedKids[idx] || {};
            const isStillborn = !!watched.stillborn;
            return (
              <div key={kid.id} className="flex flex-col gap-3 rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                    Child {idx + 1}
                    {isStillborn ? " · stillborn" : ""}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        inputId={`kid-stillborn-${idx}`}
                        checked={isStillborn}
                        onChange={(e) => setValue(`kids.${idx}.stillborn`, e.checked)}
                      />
                      <label htmlFor={`kid-stillborn-${idx}`} className="text-xs">Stillborn</label>
                    </div>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        text
                        severity="danger"
                        size="small"
                        icon={<Trash2 size={14} />}
                        onClick={() => remove(idx)}
                        tooltip="Remove child"
                        tooltipOptions={{ position: "left" }}
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.8rem] font-semibold">Tag number</label>
                    <InputText {...register(`kids.${idx}.tag_number`)} disabled={isStillborn} placeholder="Unique tag on this farm" className="w-full" />
                    {kidErr.tag_number && <p className="err text-xs">{kidErr.tag_number.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.8rem] font-semibold">Name (optional)</label>
                    <InputText {...register(`kids.${idx}.name`)} disabled={isStillborn} placeholder="e.g. Buttercup Jr." className="w-full" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.8rem] font-semibold">Animal type</label>
                    <Controller name={`kids.${idx}.animal_type_id`} control={control} render={({ field }) => (
                      <Dropdown value={field.value} onChange={(e) => { field.onChange(e.value); setValue(`kids.${idx}.breed_id`, null); }} options={typeOptions} optionLabel="label" optionValue="value" placeholder="Select type" disabled={isStillborn} filter className="w-full" />
                    )} />
                    {kidErr.animal_type_id && <p className="err text-xs">{kidErr.animal_type_id.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.8rem] font-semibold">Breed</label>
                    <Controller name={`kids.${idx}.breed_id`} control={control} render={({ field }) => (
                      <Dropdown value={field.value} onChange={(e) => field.onChange(e.value)} options={breedOptionsFor(watched.animal_type_id)} optionLabel="label" optionValue="value" placeholder={watched.animal_type_id ? "Select breed" : "Pick type first"} disabled={isStillborn || !watched.animal_type_id} filter className="w-full" />
                    )} />
                    {kidErr.breed_id && <p className="err text-xs">{kidErr.breed_id.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.8rem] font-semibold">Gender</label>
                    <Controller name={`kids.${idx}.gender_id`} control={control} render={({ field }) => (
                      <Dropdown value={field.value} onChange={(e) => field.onChange(e.value)} options={genderOptions} optionLabel="label" optionValue="value" placeholder="Select gender" disabled={isStillborn} className="w-full" />
                    )} />
                    {kidErr.gender_id && <p className="err text-xs">{kidErr.gender_id.message}</p>}
                  </div>
                </div>

                {isStillborn && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.8rem] font-semibold">Sex (free text, optional)</label>
                    <InputText {...register(`kids.${idx}.gender`)} placeholder="e.g. Female" className="w-full" />
                    {kidErr.gender && <p className="err text-xs">{kidErr.gender.message}</p>}
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[0.8rem] font-semibold">Birth weight (kg)</label>
                    <Controller name={`kids.${idx}.birth_weight_kg`} control={control} render={({ field }) => (
                      <InputNumber value={field.value} onValueChange={(e) => field.onChange(e.value)} minFractionDigits={0} maxFractionDigits={2} className="w-full" inputClassName="w-full" />
                    )} />
                    {kidErr.birth_weight_kg && <p className="err text-xs">{kidErr.birth_weight_kg.message}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5" style={{ gridColumn: "span 2" }}>
                    <label className="text-[0.8rem] font-semibold">Child notes (optional)</label>
                    <InputText {...register(`kids.${idx}.notes`)} placeholder="Anything specific about this child" className="w-full" />
                    {kidErr.notes && <p className="err text-xs">{kidErr.notes.message}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Button type="submit" label={saving ? "Saving…" : "Save Birth"} loading={saving} className="!w-full !justify-center !rounded-lg !py-2.5 !text-sm !font-semibold" />
      </form>
    </Dialog>
  );
}

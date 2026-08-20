import { useEffect } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, Controller } from "react-hook-form";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { AnimalSchema } from "../../validations/AnimalSchema";

const ACQUISITION_OPTIONS = [
  { label: "Born in Farm", value: "BORN_IN_FARM" },
  { label: "Purchased", value: "PURCHASED" },
];

const EMPTY_VALUES = {
  tag_number: "",
  name: "",
  animal_type_id: null,
  breed_id: null,
  gender_id: null,
  birth_date: null,
  acquisition_type: "BORN_IN_FARM",
  acquired_on: null,
  mother_id: null,
  father_id: null,
  notes: "",
};

const isFemaleGender = (name) => name?.trim().toLowerCase() === "female";
const isMaleGender = (name) => name?.trim().toLowerCase() === "male";

function AnimalFormDialog({
  visible,
  onHide,
  editingAnimal,
  animalTypes,
  breeds,
  genders,
  allAnimals,
  saving,
  onSubmitForm,
}) {
  const editingId = editingAnimal?.id ?? null;

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(AnimalSchema),
    defaultValues: EMPTY_VALUES,
  });

  const watchedTypeId = watch("animal_type_id");
  const watchedAcquisition = watch("acquisition_type");

  useEffect(() => {
    if (!visible) return;

    if (editingAnimal) {
      reset({
        tag_number: editingAnimal.tag_number,
        name: editingAnimal.name || "",
        animal_type_id: editingAnimal.animal_type_id,
        breed_id: editingAnimal.breed_id,
        gender_id: editingAnimal.gender_id,
        birth_date: editingAnimal.birth_date
          ? new Date(editingAnimal.birth_date)
          : null,
        acquisition_type: editingAnimal.acquisition_type,
        acquired_on: editingAnimal.acquired_on
          ? new Date(editingAnimal.acquired_on)
          : null,
        mother_id: editingAnimal.mother_id,
        father_id: editingAnimal.father_id,
        notes: editingAnimal.notes || "",
      });
    } else {
      reset(EMPTY_VALUES);
    }
  }, [visible, editingAnimal, reset]);

  useEffect(() => {
    if (watchedAcquisition === "PURCHASED") {
      setValue("mother_id", null);
      setValue("father_id", null);
    }
  }, [watchedAcquisition, setValue]);

  const typeOptions = animalTypes.map((t) => ({ label: t.name, value: t.id }));
  const breedOptions = breeds
    .filter((b) => b.animal_type_id === watchedTypeId)
    .map((b) => ({ label: b.name, value: b.id }));
  const genderOptions = genders.map((g) => ({ label: g.name, value: g.id }));

  const animalOptionsFor = (target) =>
    allAnimals
      .filter((a) => a.id !== editingId)
      .filter((a) => {
        const genderName = a.gender?.name;
        const recognized =
          isFemaleGender(genderName) || isMaleGender(genderName);
        if (!recognized) return true;
        return target === "mother"
          ? isFemaleGender(genderName)
          : isMaleGender(genderName);
      })
      .map((a) => ({
        label: `${a.tag_number}${a.name ? ` — ${a.name}` : ""}`,
        value: a.id,
      }));

  const onSubmit = (data) => {
    const payload = {
      ...data,
      birth_date: data.birth_date ? data.birth_date.toISOString() : null,
      acquired_on: data.acquired_on ? data.acquired_on.toISOString() : null,
      mother_id: data.acquisition_type === "PURCHASED" ? null : data.mother_id,
      father_id: data.acquisition_type === "PURCHASED" ? null : data.father_id,
    };
    onSubmitForm(payload, editingId);
  };

  const labelStyle = {
    color: "var(--text)",
  };

  const errorStyle = {
    color: "var(--danger)",
  };

  return (
    <Dialog
      header={editingId ? "Edit Animal" : "Add Animal"}
      visible={visible}
      onHide={onHide}
      style={{ width: "36rem" }}
      className="animal-form-dialog"
    >
      <style>{`
        .animal-form-dialog .p-dialog-header {
          background: var(--bg-card);
          color: var(--text-heading);
          border-bottom: 1px solid var(--border);
        }
        .animal-form-dialog .p-dialog-content {
          background: var(--bg-card);
          color: var(--text);
        }
        .animal-form-dialog .p-dialog-header-icon {
          color: var(--text-muted);
        }
        .animal-form-dialog .field-input,
        .animal-form-dialog .field-input.p-inputtextarea {
          background: var(--bg-muted);
          border: 1px solid var(--border);
          color: var(--text);
        }
        .animal-form-dialog .field-input::placeholder {
          color: var(--text-muted);
        }
        .animal-form-dialog .field-input:focus {
          outline: none;
          border-color: var(--primary-hover) !important;
          box-shadow: 0 0 0 3px rgba(60, 102, 80, 0.14) !important;
        }
        html.dark .animal-form-dialog .field-input:focus {
          box-shadow: 0 0 0 3px rgba(74, 124, 98, 0.25) !important;
        }
        .animal-form-dialog .field-invalid {
          border-color: var(--danger) !important;
        }
        .animal-form-dialog .dropdown-field.p-dropdown,
        .animal-form-dialog .p-calendar .p-inputtext {
          background: var(--bg-muted);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          color: var(--text);
        }
        .animal-form-dialog .dropdown-field.p-dropdown.p-focus,
        .animal-form-dialog .p-calendar.p-inputwrapper-focus .p-inputtext {
          border-color: var(--primary-hover) !important;
          box-shadow: 0 0 0 3px rgba(60, 102, 80, 0.14) !important;
        }
        .animal-form-dialog .dropdown-field .p-dropdown-label {
          padding: 0.625rem 0.75rem;
          font-size: 0.875rem;
          color: var(--text);
        }
        .animal-form-dialog .p-dropdown-panel {
          background: var(--bg-card);
          border-color: var(--border);
          color: var(--text);
        }
        .animal-form-dialog .p-dropdown-item {
          color: var(--text);
        }
        .animal-form-dialog .p-dropdown-item:hover,
        .animal-form-dialog .p-dropdown-item.p-highlight {
          background: var(--bg-muted);
          color: var(--text);
        }
        .animal-form-dialog .p-datepicker {
          background: var(--bg-card);
          border-color: var(--border);
          color: var(--text);
        }
      `}</style>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 pt-2"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold" style={labelStyle}>
              Tag Number
            </label>
            <InputText
              placeholder="e.g. G-0142"
              {...register("tag_number")}
              className={`field-input w-full rounded-lg px-3 py-2.5 text-sm ${
                errors.tag_number ? "field-invalid" : ""
              }`}
            />
            {errors.tag_number && (
              <small className="text-xs" style={errorStyle}>
                {errors.tag_number.message}
              </small>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold" style={labelStyle}>
              Name (optional)
            </label>
            <InputText
              placeholder="e.g. Bella"
              {...register("name")}
              className="field-input w-full rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold" style={labelStyle}>
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
                  placeholder="Select"
                  className={`dropdown-field w-full ${
                    errors.animal_type_id ? "field-invalid" : ""
                  }`}
                />
              )}
            />
            {errors.animal_type_id && (
              <small className="text-xs" style={errorStyle}>
                {errors.animal_type_id.message}
              </small>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold" style={labelStyle}>
              Breed
            </label>
            <Controller
              name="breed_id"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={breedOptions}
                  placeholder={watchedTypeId ? "Select" : "Pick type first"}
                  disabled={!watchedTypeId}
                  className={`dropdown-field w-full ${
                    errors.breed_id ? "field-invalid" : ""
                  }`}
                />
              )}
            />
            {errors.breed_id && (
              <small className="text-xs" style={errorStyle}>
                {errors.breed_id.message}
              </small>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold" style={labelStyle}>
              Gender
            </label>
            <Controller
              name="gender_id"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={genderOptions}
                  placeholder="Select"
                  className={`dropdown-field w-full ${
                    errors.gender_id ? "field-invalid" : ""
                  }`}
                />
              )}
            />
            {errors.gender_id && (
              <small className="text-xs" style={errorStyle}>
                {errors.gender_id.message}
              </small>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold" style={labelStyle}>
              Birth Date (optional)
            </label>
            <Controller
              name="birth_date"
              control={control}
              render={({ field }) => (
                <Calendar
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="yy-mm-dd"
                  maxDate={new Date()}
                  showIcon
                  placeholder="Select date"
                />
              )}
            />
            {errors.birth_date && (
              <small className="text-xs" style={errorStyle}>
                {errors.birth_date.message}
              </small>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold" style={labelStyle}>
              Acquisition Type
            </label>
            <Controller
              name="acquisition_type"
              control={control}
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  options={ACQUISITION_OPTIONS}
                  className={`dropdown-field w-full ${
                    errors.acquisition_type ? "field-invalid" : ""
                  }`}
                />
              )}
            />
            {errors.acquisition_type && (
              <small className="text-xs" style={errorStyle}>
                {errors.acquisition_type.message}
              </small>
            )}
          </div>
        </div>

        {watchedAcquisition === "PURCHASED" ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-[0.8rem] font-semibold" style={labelStyle}>
              Acquired On
            </label>
            <Controller
              name="acquired_on"
              control={control}
              render={({ field }) => (
                <Calendar
                  value={field.value}
                  onChange={(e) => field.onChange(e.value)}
                  dateFormat="yy-mm-dd"
                  maxDate={new Date()}
                  showIcon
                  placeholder="Select date"
                />
              )}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] font-semibold" style={labelStyle}>
                Mother (optional)
              </label>
              <Controller
                name="mother_id"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={animalOptionsFor("mother")}
                    placeholder="None"
                    showClear
                    filter
                    className="dropdown-field w-full"
                  />
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] font-semibold" style={labelStyle}>
                Father (optional)
              </label>
              <Controller
                name="father_id"
                control={control}
                render={({ field }) => (
                  <Dropdown
                    value={field.value}
                    onChange={(e) => field.onChange(e.value)}
                    options={animalOptionsFor("father")}
                    placeholder="None"
                    showClear
                    filter
                    className="dropdown-field w-full"
                  />
                )}
              />
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold" style={labelStyle}>
            Notes (optional)
          </label>
          <InputTextarea
            rows={3}
            {...register("notes")}
            className="field-input w-full rounded-lg px-3 py-2.5 text-sm"
          />
        </div>

        <Button
          type="submit"
          label={
            saving
              ? "Saving…"
              : editingId
              ? "Save Changes"
              : "Register Animal"
          }
          loading={saving}
          className="!mt-2 !w-full !justify-center !rounded-lg !py-2.5 !text-sm !font-semibold !text-white"
          style={{
            backgroundColor: "var(--primary)",
            borderColor: "var(--primary)",
          }}
        />
      </form>
    </Dialog>
  );
}

export default AnimalFormDialog;
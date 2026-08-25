import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Calendar } from "primereact/calendar";
import { Button } from "primereact/button";
import { WeightSchema, ValuationSchema } from "../../validations/WeightValuationSchema";

const dialogStyles = `
  .wv-dialog.p-dialog { background: var(--bg-card) !important; border: 1px solid var(--border) !important; }
  .wv-dialog .p-dialog-header {
    background: var(--bg-card) !important; color: var(--text-heading) !important;
    border-bottom: 1px solid var(--border) !important;
  }
  .wv-dialog .p-dialog-title { color: var(--text-heading) !important; font-weight: 600; }
  .wv-dialog .p-dialog-header-icon { color: var(--text-muted) !important; }
  .wv-dialog .p-dialog-content { background: var(--bg-card) !important; color: var(--text) !important; }
  .wv-dialog .p-inputtext, .wv-dialog .p-inputnumber-input, .wv-dialog .p-inputtextarea {
    background: var(--bg-muted) !important; border: 1px solid var(--border) !important;
    color: var(--text) !important; border-radius: 0.5rem; width: 100%;
  }
  .wv-dialog .p-calendar .p-inputtext { width: 100%; }
  .wv-dialog label { color: var(--text); }
  .wv-dialog .err { color: var(--danger); }
  .wv-dialog .p-button {
    background: var(--primary) !important; border-color: var(--primary) !important; color: #fff !important;
  }
`;

export function LogWeightDialog({ visible, onHide, saving, initial, onSubmitForm }) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(WeightSchema),
    defaultValues: {
      weight_kg: null,
      effective_from: new Date(),
      source: "",
      notes: "",
    },
  });

  useEffect(() => {
    if (!visible) return;
    if (initial) {
      reset({
        weight_kg: Number(initial.weight_kg),
        effective_from: initial.effective_from
          ? new Date(initial.effective_from)
          : new Date(),
        source: initial.source || "",
        notes: initial.notes || "",
      });
    } else {
      reset({
        weight_kg: null,
        effective_from: new Date(),
        source: "",
        notes: "",
      });
    }
  }, [visible, initial, reset]);

  return (
    <Dialog
      header={initial ? "Edit Weight" : "Log Weight"}
      visible={visible}
      onHide={onHide}
      style={{ width: "28rem" }}
      className="wv-dialog"
    >
      <style>{dialogStyles}</style>
      <form
        onSubmit={handleSubmit((data) =>
          onSubmitForm({
            weight_kg: data.weight_kg,
            effective_from: data.effective_from
              ? new Date(data.effective_from).toISOString()
              : new Date().toISOString(),
            source: data.source?.trim() || null,
            notes: data.notes?.trim() || null,
          })
        )}
        className="flex flex-col gap-4 pt-2"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Weight (kg)</label>
          <Controller
            name="weight_kg"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                minFractionDigits={0}
                maxFractionDigits={2}
                className="w-full"
                inputClassName="w-full"
              />
            )}
          />
          {errors.weight_kg && (
            <small className="err text-xs">{errors.weight_kg.message}</small>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Date</label>
          <Controller
            name="effective_from"
            control={control}
            render={({ field }) => (
              <Calendar
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="yy-mm-dd"
                showIcon
                className="w-full"
                appendTo="self"
              />
            )}
          />
          {errors.effective_from && (
            <small className="err text-xs">{errors.effective_from.message}</small>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Source (optional)</label>
          <InputText
            {...register("source")}
            placeholder="e.g. scale, estimate"
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Notes (optional)</label>
          <InputTextarea rows={2} {...register("notes")} className="w-full" />
        </div>

        <Button
          type="submit"
          label={saving ? "Saving…" : "Save"}
          loading={saving}
          className="!w-full !justify-center !rounded-lg !py-2.5 !text-sm !font-semibold"
        />
      </form>
    </Dialog>
  );
}

export function LogValuationDialog({ visible, onHide, saving, initial, onSubmitForm }) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(ValuationSchema),
    defaultValues: {
      value_amount: null,
      basis: "",
      effective_from: new Date(),
      notes: "",
    },
  });

  useEffect(() => {
    if (!visible) return;
    if (initial) {
      reset({
        value_amount: Number(initial.value_amount),
        basis: initial.basis || "",
        effective_from: initial.effective_from
          ? new Date(initial.effective_from)
          : new Date(),
        notes: initial.notes || "",
      });
    } else {
      reset({
        value_amount: null,
        basis: "",
        effective_from: new Date(),
        notes: "",
      });
    }
  }, [visible, initial, reset]);

  return (
    <Dialog
      header={initial ? "Edit Valuation" : "Log Valuation"}
      visible={visible}
      onHide={onHide}
      style={{ width: "28rem" }}
      className="wv-dialog"
    >
      <style>{dialogStyles}</style>
      <form
        onSubmit={handleSubmit((data) =>
          onSubmitForm({
            value_amount: data.value_amount,
            basis: data.basis?.trim() || null,
            effective_from: data.effective_from
              ? new Date(data.effective_from).toISOString()
              : new Date().toISOString(),
            notes: data.notes?.trim() || null,
          })
        )}
        className="flex flex-col gap-4 pt-2"
      >
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Value amount</label>
          <Controller
            name="value_amount"
            control={control}
            render={({ field }) => (
              <InputNumber
                value={field.value}
                onValueChange={(e) => field.onChange(e.value)}
                minFractionDigits={0}
                maxFractionDigits={2}
                className="w-full"
                inputClassName="w-full"
              />
            )}
          />
          {errors.value_amount && (
            <small className="err text-xs">{errors.value_amount.message}</small>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Basis (optional)</label>
          <InputText
            {...register("basis")}
            placeholder="e.g. market, insurance"
            className="w-full"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Date</label>
          <Controller
            name="effective_from"
            control={control}
            render={({ field }) => (
              <Calendar
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                dateFormat="yy-mm-dd"
                showIcon
                className="w-full"
                appendTo="self"
              />
            )}
          />
          {errors.effective_from && (
            <small className="err text-xs">{errors.effective_from.message}</small>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8rem] font-semibold">Notes (optional)</label>
          <InputTextarea rows={2} {...register("notes")} className="w-full" />
        </div>

        <Button
          type="submit"
          label={saving ? "Saving…" : "Save"}
          loading={saving}
          className="!w-full !justify-center !rounded-lg !py-2.5 !text-sm !font-semibold"
        />
      </form>
    </Dialog>
  );
}
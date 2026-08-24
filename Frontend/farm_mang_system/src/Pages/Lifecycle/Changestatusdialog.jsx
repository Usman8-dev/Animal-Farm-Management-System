import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";

const schema = yup.object({
  status_id: yup
    .number()
    .typeError("Status is required")
    .required("Status is required"),
  effective_from: yup.date().nullable().required("Date is required"),
  reason: yup.string().nullable(),
});

function ChangeStatusDialog({
  visible,
  onHide,
  statuses = [],
  saving,
  onSubmitForm,
}) {
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      status_id: null,
      effective_from: new Date(),
      reason: "",
    },
  });

  useEffect(() => {
    if (visible) {
      reset({
        status_id: null,
        effective_from: new Date(),
        reason: "",
      });
    }
  }, [visible, reset]);

  const options = (statuses || [])
    .filter((s) => s.is_active !== false && !s.deleted_at)
    .map((s) => ({
      label: `${s.name} (${s.category})`,
      value: s.id,
    }));

  const onSubmit = (data) => {
    onSubmitForm({
      status_id: data.status_id,
      effective_from: data.effective_from,
      reason: data.reason?.trim() || null,
    });
  };

  return (
    <Dialog
      header="Change Status"
      visible={visible}
      onHide={onHide}
      style={{ width: "28rem" }}
      className="change-status-dialog"
    >
      <style>{`
        .change-status-dialog.p-dialog {
          background: var(--bg-card) !important;
          border: 1px solid var(--border) !important;
          color: var(--text) !important;
        }
        .change-status-dialog .p-dialog-header {
          background: var(--bg-card) !important;
          color: var(--text-heading) !important;
          border-bottom: 1px solid var(--border) !important;
        }
        .change-status-dialog .p-dialog-title {
          color: var(--text-heading) !important;
          font-weight: 600;
        }
        .change-status-dialog .p-dialog-header-icon {
          color: var(--text-muted) !important;
        }
        .change-status-dialog .p-dialog-header-icon:hover {
          background: var(--bg-muted) !important;
          color: var(--text) !important;
        }
        .change-status-dialog .p-dialog-content {
          background: var(--bg-card) !important;
          color: var(--text) !important;
        }

        .change-status-dialog .cs-label {
          color: var(--text);
        }
        .change-status-dialog .cs-error {
          color: var(--danger);
        }

        .change-status-dialog .p-dropdown,
        .change-status-dialog .p-calendar .p-inputtext,
        .change-status-dialog .p-inputtextarea {
          background: var(--bg-muted) !important;
          border: 1px solid var(--border) !important;
          color: var(--text) !important;
          border-radius: 0.5rem;
          width: 100%;
        }
        .change-status-dialog .p-dropdown:not(.p-disabled).p-focus,
        .change-status-dialog .p-inputtextarea:focus,
        .change-status-dialog .p-calendar.p-inputwrapper-focus .p-inputtext {
          border-color: var(--primary-hover) !important;
          box-shadow: 0 0 0 3px rgba(60, 102, 80, 0.14) !important;
        }
        .change-status-dialog .p-dropdown-label {
          color: var(--text) !important;
        }
        .change-status-dialog .p-dropdown-trigger {
          color: var(--text-muted) !important;
        }
        .change-status-dialog .p-placeholder {
          color: var(--text-muted) !important;
        }
        .change-status-dialog .p-inputtextarea::placeholder {
          color: var(--text-muted) !important;
        }

        .change-status-dialog .p-dropdown-panel {
          background: var(--bg-card) !important;
          border-color: var(--border) !important;
          color: var(--text) !important;
        }
        .change-status-dialog .p-dropdown-item {
          color: var(--text) !important;
        }
        .change-status-dialog .p-dropdown-item:hover,
        .change-status-dialog .p-dropdown-item.p-highlight {
          background: var(--bg-muted) !important;
          color: var(--text) !important;
        }

        .change-status-dialog .p-datepicker {
          background: var(--bg-card) !important;
          border-color: var(--border) !important;
          color: var(--text) !important;
        }
        .change-status-dialog .p-datepicker-header {
          background: var(--bg-card) !important;
          color: var(--text) !important;
          border-color: var(--border) !important;
        }
        .change-status-dialog .p-datepicker table td > span {
          color: var(--text) !important;
        }
        .change-status-dialog .p-datepicker table td > span.p-highlight {
          background: var(--primary) !important;
          color: #fff !important;
        }
        .change-status-dialog .p-datepicker-prev,
        .change-status-dialog .p-datepicker-next {
          color: var(--text-muted) !important;
        }

        .change-status-dialog .cs-submit.p-button {
          background: var(--primary) !important;
          border-color: var(--primary) !important;
          color: #fff !important;
        }
        .change-status-dialog .cs-submit.p-button:enabled:hover {
          background: var(--primary-hover) !important;
          border-color: var(--primary-hover) !important;
        }
      `}</style>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-4 pt-2"
      >
        <div className="flex flex-col gap-1.5">
          <label className="cs-label text-[0.8rem] font-semibold">Status</label>
          <Controller
            name="status_id"
            control={control}
            render={({ field }) => (
              <Dropdown
                value={field.value}
                onChange={(e) => field.onChange(e.value)}
                options={options}
                placeholder="Select status"
                className="w-full"
                appendTo="self"
              />
            )}
          />
          {errors.status_id && (
            <small className="cs-error text-xs">{errors.status_id.message}</small>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="cs-label text-[0.8rem] font-semibold">
            Effective from
          </label>
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
            <small className="cs-error text-xs">
              {errors.effective_from.message}
            </small>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="cs-label text-[0.8rem] font-semibold">
            Reason (optional)
          </label>
          <InputTextarea
            rows={3}
            {...register("reason")}
            className="w-full"
            placeholder="Why is the status changing?"
          />
        </div>

        <Button
          type="submit"
          label={saving ? "Saving…" : "Save status"}
          loading={saving}
          className="cs-submit !mt-1 !w-full !justify-center !rounded-lg !py-2.5 !text-sm !font-semibold"
        />
      </form>
    </Dialog>
  );
}

export default ChangeStatusDialog;
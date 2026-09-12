import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { ResetPasswordSchema } from "../../validations/ResetPasswordSchema";
import api from "../../apis/axios";

import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { useToast } from "../../context/ToastContext";
import { KeyRound, Lock, LockOpen, Eye, EyeOff } from "lucide-react";

const formStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
  * { font-family: 'Inter', sans-serif; }
  .font-display { font-family: 'Fraunces', serif; }
  .field-input { background: #fdfcf9; border: 1px solid #e6e2d6; transition: all 0.2s ease; }
  .field-input:hover { border-color: rgba(60, 102, 80, 0.4); }
  .field-input:focus { outline: none; border-color: #3c6650 !important; box-shadow: 0 0 0 3px rgba(60, 102, 80, 0.14) !important; }
  .field-input.field-invalid { border-color: #b3452d !important; }
  .submit-btn { position: relative; overflow: hidden; }
  .submit-btn::before {
    content: '';
    position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
    transition: left 0.5s ease;
  }
  .submit-btn:hover::before { left: 100%; }
`;

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const showToast = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(ResetPasswordSchema) });

  const onSubmit = async (data) => {
    try {
      await api.post("/user/reset-password", { token, password: data.password });
      setDone(true);
      showToast({
        severity: "success",
        summary: "Password updated",
        detail: "You can now log in with your new password.",
        life: 4000,
      });
    } catch (error) {
      showToast({
        severity: "error",
        summary: "Reset failed",
        detail: error.response?.data?.message || "This reset link is invalid or has expired.",
        life: 5000,
      });
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF8F2] font-sans p-6">
        <style>{formStyles}</style>
        <div className="w-full max-w-md rounded-2xl border border-[#e6e2d6] bg-white p-9 text-center shadow-[0_1px_2px_rgba(20,38,29,0.04),0_12px_32px_-12px_rgba(20,38,29,0.14)]">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#b3452d]/10">
            <Lock size={26} className="text-[#b3452d]" strokeWidth={2} />
          </div>
          <h1 className="font-display font-semibold text-2xl text-[#14261d] mb-2.5">
            Reset link is missing
          </h1>
          <p className="text-sm text-[#66716a] leading-relaxed mb-7">
            This reset link doesn't include a token. Please use the link from
            the email we sent you.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block w-full rounded-lg bg-[#1f3d2e] px-4 py-3 text-sm font-semibold text-white hover:bg-[#3c6650] transition-colors"
          >
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F2] font-sans p-6">
      <style>{formStyles}</style>

      <div className="w-full max-w-md rounded-2xl border border-[#e6e2d6] bg-white p-9 text-center shadow-[0_1px_2px_rgba(20,38,29,0.04),0_12px_32px_-12px_rgba(20,38,29,0.14)]">
        {done ? (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#1f3d2e]/10">
              <LockOpen size={26} className="text-[#1f3d2e]" strokeWidth={2} />
            </div>
            <h1 className="font-display font-semibold text-2xl text-[#14261d] mb-2.5">
              Password updated
            </h1>
            <p className="text-sm text-[#66716a] leading-relaxed mb-7">
              Your password has been changed. You can now log in with your new
              password.
            </p>
            <Link
              to="/"
              className="inline-block w-full rounded-lg bg-[#1f3d2e] px-4 py-3 text-sm font-semibold text-white hover:bg-[#3c6650] transition-colors"
            >
              Go to login
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#1f3d2e]/10">
              <KeyRound size={26} className="text-[#1f3d2e]" strokeWidth={2} />
            </div>
            <h1 className="font-display font-semibold text-2xl text-[#14261d] mb-2.5">
              Set a new password
            </h1>
            <p className="text-sm text-[#66716a] leading-relaxed mb-7">
              Choose a strong password you haven't used before.
            </p>

            <form className="flex flex-col gap-5 text-left" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8rem] font-semibold text-[#1b241d]">New password</label>
                <div className="relative flex">
                  <InputText
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="new-password"
                    {...register("password")}
                    className={`field-input w-full rounded-lg px-3 py-2.5 pr-10 text-[0.92rem] ${errors.password ? "field-invalid" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#66716a] hover:text-[#1f3d2e] transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && (
                  <small className="text-[0.76rem] text-[#b3452d] font-medium">
                    {errors.password.message}
                  </small>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8rem] font-semibold text-[#1b241d]">Confirm new password</label>
                <div className="relative flex">
                  <InputText
                    type={showConfirm ? "text" : "password"}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                    className={`field-input w-full rounded-lg px-3 py-2.5 pr-10 text-[0.92rem] ${errors.confirmPassword ? "field-invalid" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#66716a] hover:text-[#1f3d2e] transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <small className="text-[0.76rem] text-[#b3452d] font-medium">
                    {errors.confirmPassword.message}
                  </small>
                )}
              </div>

              <Button
                type="submit"
                label={isSubmitting ? "Updating…" : "Update password"}
                icon={isSubmitting ? "pi pi-spin pi-spinner" : undefined}
                iconPos="right"
                disabled={isSubmitting}
                className="submit-btn !w-full !justify-center !bg-[#1f3d2e] !border-[#1f3d2e] hover:!bg-[#3c6650] hover:!border-[#3c6650] !rounded-lg !py-3 !font-semibold !text-[0.92rem] !text-white transition-colors"
              />
            </form>

            <Link
              to="/"
              className="mt-6 inline-block text-sm font-semibold text-[#1f3d2e] hover:underline"
            >
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;
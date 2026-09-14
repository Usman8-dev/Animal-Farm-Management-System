import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { useState } from "react";
import { ForgotPasswordSchema } from "../../validations/ForgotPasswordSchema";
import api from "../../apis/axios";

import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { useToast } from "../../context/ToastContext";
import { MailQuestion, MailCheck, ArrowLeft } from "lucide-react";

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

function ForgotPassword() {
  const showToast = useToast();
  const [sentEmail, setSentEmail] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: yupResolver(ForgotPasswordSchema) });

  const onSubmit = async (data) => {
    try {
      await api.post("/user/forgot-password", { email: data.email });
      setSentEmail(data.email);
      showToast({
        severity: "success",
        summary: "Link sent",
        detail: "If that email is registered, a reset link is on its way.",
        life: 4000,
      });
    } catch (error) {
      showToast({
        severity: "error",
        summary: "Request failed",
        detail: error.response?.data?.message || "Something went wrong",
        life: 4000,
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F2] font-sans p-6">
      <style>{formStyles}</style>

      <div className="w-full max-w-md rounded-2xl border border-[#e6e2d6] bg-white p-9 text-center shadow-[0_1px_2px_rgba(20,38,29,0.04),0_12px_32px_-12px_rgba(20,38,29,0.14)]">
        {sentEmail ? (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#1f3d2e]/10">
              <MailCheck size={26} className="text-[#1f3d2e]" strokeWidth={2} />
            </div>
            <h1 className="font-display font-semibold text-2xl text-[#14261d] mb-2.5">
              Check your inbox
            </h1>
            <p className="text-sm text-[#66716a] leading-relaxed mb-1">
              We've sent a password reset link to
            </p>
            <p className="text-sm font-semibold text-[#1b241d] mb-4">{sentEmail}</p>
            <p className="text-sm text-[#66716a] leading-relaxed mb-7">
              The link expires in 1 hour. If you don't see it, check your spam
              folder or try again.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-[#1f3d2e] px-4 py-3 text-sm font-semibold text-white hover:bg-[#3c6650] transition-colors"
            >
              <ArrowLeft size={15} />
              Back to login
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#1f3d2e]/10">
              <MailQuestion size={26} className="text-[#1f3d2e]" strokeWidth={2} />
            </div>
            <h1 className="font-display font-semibold text-2xl text-[#14261d] mb-2.5">
              Forgot your password?
            </h1>
            <p className="text-sm text-[#66716a] leading-relaxed mb-7">
              Enter the email address you signed up with and we'll email you a
              secure reset link.
            </p>

            <form className="flex flex-col gap-5 text-left" onSubmit={handleSubmit(onSubmit)} noValidate>
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8rem] font-semibold text-[#1b241d]">Email address</label>
                <InputText
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email")}
                  className={`field-input w-full rounded-lg px-3 py-2.5 text-[0.92rem] ${errors.email ? "field-invalid" : ""}`}
                />
                {errors.email && (
                  <small className="text-[0.76rem] text-[#b3452d] font-medium">
                    {errors.email.message}
                  </small>
                )}
              </div>

              <Button
                type="submit"
                label={isSubmitting ? "Sending link…" : "Send reset link"}
                icon={isSubmitting ? "pi pi-spin pi-spinner" : undefined}
                iconPos="right"
                disabled={isSubmitting}
                className="submit-btn !w-full !justify-center !bg-[#1f3d2e] !border-[#1f3d2e] hover:!bg-[#3c6650] hover:!border-[#3c6650] !rounded-lg !py-3 !font-semibold !text-[0.92rem] !text-white transition-colors"
              />
            </form>

            <Link
              to="/login"
              className="mt-6 inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-[#1f3d2e] hover:underline"
            >
              <ArrowLeft size={15} />
              Back to login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useState } from "react";
import { RegisterSchema } from "../../validations/RegisterSchema";
import api from "../../apis/axios";

import { InputText } from "primereact/inputtext";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { useToast } from "../../context/ToastContext";
import { Eye, EyeOff, Sprout, ShieldCheck, Users } from "lucide-react";

const genderOptions = [
  { label: "Male", value: "Male" },
  { label: "Female", value: "Female" },
  { label: "Other", value: "Other" },
];

function Register() {
  const navigate = useNavigate();
  const showToast = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(RegisterSchema),
  });

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...payload } = data;
      await api.post("/user/register", payload);
      showToast({
        severity: "success",
        summary: "Success",
        detail: "Account created! Check your email to verify.",
        life: 3000,
      });
      navigate("/verify-email-notice", { state: { email: data.email } });
    } catch (error) {
      showToast({
        severity: "error",
        summary: "Registration Failed",
        detail: error.response?.data?.message || "Something went wrong",
        life: 3000,
      });
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-[#FAF8F2] font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');

        * { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Fraunces', serif; }

        .brand-pattern {
          background-image: repeating-linear-gradient(
            115deg,
            transparent 0px,
            transparent 34px,
            rgba(244, 241, 230, 0.55) 34px,
            rgba(244, 241, 230, 0.55) 36px
          );
          -webkit-mask-image: linear-gradient(180deg, black, transparent 85%);
          mask-image: linear-gradient(180deg, black, transparent 85%);
        }

        .field-input {
          background: #fdfcf9;
          border: 1px solid #e6e2d6;
          transition: all 0.2s ease;
        }

        .field-input:hover {
          border-color: rgba(60, 102, 80, 0.4);
        }

        .field-input:focus {
          outline: none;
          border-color: #3c6650 !important;
          box-shadow: 0 0 0 3px rgba(60, 102, 80, 0.14) !important;
        }

        .field-input.field-invalid {
          border-color: #b3452d !important;
        }

        /* Dropdown (gender) — PrimeReact's div-based component needs plain
           CSS since Tailwind can't reach its internal focus/error state */
        .dropdown-field.p-dropdown {
          background: #fdfcf9;
          border: 1px solid #e6e2d6;
          border-radius: 0.5rem;
          transition: all 0.2s ease;
        }

        .dropdown-field.p-dropdown:not(.p-disabled):hover {
          border-color: rgba(60, 102, 80, 0.4);
        }

        .dropdown-field.p-dropdown.p-focus {
          border-color: #3c6650 !important;
          box-shadow: 0 0 0 3px rgba(60, 102, 80, 0.14) !important;
        }

        .dropdown-field.dropdown-invalid {
          border-color: #b3452d !important;
        }

        .dropdown-field .p-dropdown-label {
          color: #1b241d;
          padding: 0.625rem 0.75rem;
          font-size: 0.92rem;
        }

        .dropdown-field .p-dropdown-label.p-placeholder {
          color: #9a9284;
        }

        .dropdown-field .p-dropdown-trigger {
          color: #66716a;
        }

        .p-dropdown-panel {
          background: #ffffff;
          border: 1px solid #e6e2d6;
          border-radius: 0.5rem;
          overflow: hidden;
          margin-top: 0.25rem;
        }

        .p-dropdown-panel .p-dropdown-items .p-dropdown-item {
          color: #1b241d;
          padding: 0.6rem 0.85rem;
          font-size: 0.88rem;
        }

        .p-dropdown-panel .p-dropdown-items .p-dropdown-item:hover {
          background: rgba(60, 102, 80, 0.08);
        }

        .p-dropdown-panel .p-dropdown-items .p-dropdown-item.p-highlight {
          background: rgba(60, 102, 80, 0.14);
          color: #14261d;
        }

        .submit-btn {
          position: relative;
          overflow: hidden;
        }

        .submit-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
          transition: left 0.5s ease;
        }

        .submit-btn:hover::before {
          left: 100%;
        }
      `}</style>

      {/* ── Brand panel ─────────────────────────────────────────── */}
      <aside className="hidden md:flex relative flex-col justify-between overflow-hidden p-14 bg-gradient-to-br from-[#14261D] to-[#1F3D2E] text-[#f4f1e6]">
        <div
          className="brand-pattern pointer-events-none absolute inset-0 opacity-[0.14]"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-md">
          <div className="mb-14 inline-flex items-center gap-2 font-display font-semibold text-[1.15rem] tracking-tight text-[#e3c55c]">
            <Sprout size={22} strokeWidth={2.2} />
            <span>Herdwell</span>
          </div>

          <h1 className="font-display font-medium text-[2.35rem] leading-[1.18] tracking-tight text-[#fbf9f1] mb-4">
            Run your farm like you
            <br />
            walk it — herd by herd.
          </h1>

          <p className="text-base leading-relaxed text-[#f4f1e6]/80 max-w-md mb-10">
            One record for every goat and cow, one view for every manager and
            hand on the ground.
          </p>

          <ul className="flex flex-col gap-4">
            <li className="flex items-center gap-2.5 text-sm text-[#f4f1e6]/90">
              <Sprout
                size={16}
                strokeWidth={2.2}
                className="shrink-0 text-[#e3c55c]"
              />
              Track health, breeding &amp; feed by animal
            </li>
            <li className="flex items-center gap-2.5 text-sm text-[#f4f1e6]/90">
              <Users
                size={16}
                strokeWidth={2.2}
                className="shrink-0 text-[#e3c55c]"
              />
              Owner, managers &amp; workers, each with their own access
            </li>
            <li className="flex items-center gap-2.5 text-sm text-[#f4f1e6]/90">
              <ShieldCheck
                size={16}
                strokeWidth={2.2}
                className="shrink-0 text-[#e3c55c]"
              />
              Verified accounts, role-based permissions
            </li>
          </ul>
        </div>

        <p className="relative z-10 text-xs text-[#f4f1e6]/50">
          © {new Date().getFullYear()} Herdwell Farm Systems
        </p>
      </aside>

      {/* ── Form panel ──────────────────────────────────────────── */}
      <main className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md rounded-2xl border border-[#e6e2d6] bg-white p-9 shadow-[0_1px_2px_rgba(20,38,29,0.04),0_12px_32px_-12px_rgba(20,38,29,0.14)]">
          <div className="mb-7">
            <h2 className="font-display font-semibold text-2xl text-[#14261d] mb-1.5">
              Create your owner account
            </h2>
            <p className="text-sm text-[#66716a] leading-relaxed">
              You'll be able to add managers and workers to your farm right
              after this.
            </p>
          </div>

          <form
            className="flex flex-col gap-5"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
          >
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] font-semibold text-[#1b241d]">
                Full name
              </label>
              <InputText
                placeholder="e.g. Faizan Ahmed"
                {...register("name")}
                className={`field-input w-full rounded-lg px-3 py-2.5 text-[0.92rem] ${
                  errors.name ? "field-invalid" : ""
                }`}
              />
              {errors.name && (
                <small className="text-[0.76rem] text-[#b3452d] font-medium">
                  {errors.name.message}
                </small>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8rem] font-semibold text-[#1b241d]">
                  CNIC number
                </label>
                <Controller
                  name="cnic_number"
                  control={control}
                  defaultValue=""
                  render={({ field }) => (
                    <InputText
                      placeholder="12345-1234567-1"
                      value={field.value}
                      className={`field-input w-full rounded-lg px-3 py-2.5 text-[0.92rem] ${
                        errors.cnic_number ? "field-invalid" : ""
                      }`}
                      onChange={(e) => {
                        // 1. Strip everything except numbers
                        let value = e.target.value.replace(/\D/g, "");

                        // 2. Hard-limit the raw input to exactly 13 digits
                        if (value.length > 13) {
                          value = value.substring(0, 13);
                        }

                        // 3. Re-inject dashes dynamically based on structural length
                        let formattedValue = "";
                        if (value.length > 0) {
                          if (value.length <= 5) {
                            formattedValue = value;
                          } else if (value.length <= 12) {
                            formattedValue = `${value.slice(0, 5)}-${value.slice(5)}`;
                          } else {
                            formattedValue = `${value.slice(0, 5)}-${value.slice(5, 12)}-${value.slice(12, 13)}`;
                          }
                        }

                        // 4. Update the form state manually
                        field.onChange(formattedValue);
                      }}
                    />
                  )}
                />
                {errors.cnic_number && (
                  <small className="text-[0.76rem] text-[#b3452d] font-medium">
                    {errors.cnic_number.message}
                  </small>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[0.8rem] font-semibold text-[#1b241d]">
                  Gender
                </label>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Dropdown
                      value={field.value}
                      onChange={(e) => field.onChange(e.value)}
                      options={genderOptions}
                      placeholder="Select"
                      className={`dropdown-field w-full ${errors.gender ? "dropdown-invalid" : ""}`}
                    />
                  )}
                />
                {errors.gender && (
                  <small className="text-[0.76rem] text-[#b3452d] font-medium">
                    {errors.gender.message}
                  </small>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] font-semibold text-[#1b241d]">
                Email address
              </label>
              <InputText
                type="email"
                placeholder="you@example.com"
                {...register("email")}
                className={`field-input w-full rounded-lg px-3 py-2.5 text-[0.92rem] ${
                  errors.email ? "field-invalid" : ""
                }`}
              />
              {errors.email && (
                <small className="text-[0.76rem] text-[#b3452d] font-medium">
                  {errors.email.message}
                </small>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.8rem] font-semibold text-[#1b241d]">
                Password
              </label>
              <div className="relative flex">
                <InputText
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  {...register("password")}
                  className={`field-input w-full rounded-lg px-3 py-2.5 pr-10 text-[0.92rem] ${
                    errors.password ? "field-invalid" : ""
                  }`}
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
              <label className="text-[0.8rem] font-semibold text-[#1b241d]">
                Confirm password
              </label>
              <div className="relative flex">
                <InputText
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  {...register("confirmPassword")}
                  className={`field-input w-full rounded-lg px-3 py-2.5 pr-10 text-[0.92rem] ${
                    errors.confirmPassword ? "field-invalid" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#66716a] hover:text-[#1f3d2e] transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
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
              label={isSubmitting ? "Creating account…" : "Create account"}
              icon={isSubmitting ? "pi pi-spin pi-spinner" : undefined}
              iconPos="right"
              disabled={isSubmitting}
              className="submit-btn !mt-1 !w-full !justify-center !bg-[#1f3d2e] !border-[#1f3d2e] hover:!bg-[#3c6650] hover:!border-[#3c6650] !rounded-lg !py-3 !font-semibold !text-[0.92rem] !text-white transition-colors"
            />
          </form>

          <p className="mt-6 text-center text-sm text-[#66716a]">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-[#1f3d2e] hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

export default Register;

import { useLocation, Link } from "react-router-dom";
import { MailCheck } from "lucide-react";

function VerifyEmailNotice() {
  const location = useLocation();
  const email = location.state?.email;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F2] font-sans p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Fraunces', serif; }
      `}</style>

      <div className="w-full max-w-md rounded-2xl border border-[#e6e2d6] bg-white p-9 text-center shadow-[0_1px_2px_rgba(20,38,29,0.04),0_12px_32px_-12px_rgba(20,38,29,0.14)]">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#1f3d2e]/10">
          <MailCheck size={26} className="text-[#1f3d2e]" strokeWidth={2} />
        </div>

        <h1 className="font-display font-semibold text-2xl text-[#14261d] mb-2.5">
          Check your inbox
        </h1>

        <p className="text-sm text-[#66716a] leading-relaxed mb-1">
          We've sent a verification link to
        </p>
        {email && (
          <p className="text-sm font-semibold text-[#1b241d] mb-4">{email}</p>
        )}
        <p className="text-sm text-[#66716a] leading-relaxed mb-7">
          Click the link in that email to verify your account. You can log in
          now — some features will unlock once you're verified.
        </p>

        <Link
          to="/"
          className="inline-block w-full rounded-lg bg-[#1f3d2e] px-4 py-3 text-sm font-semibold text-white hover:bg-[#3c6650] transition-colors"
        >
          Go to login
        </Link>
      </div>
    </div>
  );
}

export default VerifyEmailNotice;
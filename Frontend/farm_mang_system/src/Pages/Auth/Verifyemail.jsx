import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../../apis/axios";
import { MailCheck, XCircle, Loader2 } from "lucide-react";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState("verifying"); // "verifying" | "success" | "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This verification link is missing a token.");
      return;
    }

    const verify = async () => {
      try {
        const res = await api.get(`/user/verify-email?token=${token}`);
        setStatus("success");
        setMessage(res.data?.message || "Your email has been verified.");
      } catch (err) {
        setStatus("error");
        setMessage(
          err.response?.data?.message ||
            "This verification link is invalid or has expired."
        );
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF8F2] font-sans p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Fraunces', serif; }
      `}</style>

      <div className="w-full max-w-md rounded-2xl border border-[#e6e2d6] bg-white p-9 text-center shadow-[0_1px_2px_rgba(20,38,29,0.04),0_12px_32px_-12px_rgba(20,38,29,0.14)]">
        <div
          className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full ${
            status === "error" ? "bg-[#b3452d]/10" : "bg-[#1f3d2e]/10"
          }`}
        >
          {status === "verifying" && (
            <Loader2 size={26} className="text-[#1f3d2e] animate-spin" strokeWidth={2} />
          )}
          {status === "success" && (
            <MailCheck size={26} className="text-[#1f3d2e]" strokeWidth={2} />
          )}
          {status === "error" && (
            <XCircle size={26} className="text-[#b3452d]" strokeWidth={2} />
          )}
        </div>

        <h1 className="font-display font-semibold text-2xl text-[#14261d] mb-2.5">
          {status === "verifying" && "Verifying your email…"}
          {status === "success" && "Email verified"}
          {status === "error" && "Verification failed"}
        </h1>

        <p className="text-sm text-[#66716a] leading-relaxed mb-7">{message}</p>

        {status !== "verifying" && (
          <Link
            to="/"
            className="inline-block w-full rounded-lg bg-[#1f3d2e] px-4 py-3 text-sm font-semibold text-white hover:bg-[#3c6650] transition-colors"
          >
            Go to login
          </Link>
        )}
      </div>
    </div>
  );
}

export default VerifyEmail;
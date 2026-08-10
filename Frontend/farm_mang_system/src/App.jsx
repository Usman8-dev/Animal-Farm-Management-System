import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import Register from "./Pages/Auth/Register";
import VerifyEmailNotice from "./Pages/Auth/Verifyemailnotice";

function App() {
  return (
    <div>
      <BrowserRouter>
        <ToastProvider>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email-notice" element={<VerifyEmailNotice/>} />
          </Routes>
        </ToastProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;

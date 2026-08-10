import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import Register from "./Pages/Auth/Register";
import VerifyEmailNotice from "./Pages/Auth/Verifyemailnotice";
import Login from "./Pages/Auth/Login";
import Dashboard from "./Pages/Dashboard";

function App() {
  return (
    <div>
      <BrowserRouter>
        <ToastProvider>
          <Routes>
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email-notice" element={<VerifyEmailNotice/>} />
            <Route path="/" element={<Login/>}/>

            <Route path="/dashboard" element={<Dashboard/>}/>
          </Routes>
        </ToastProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;

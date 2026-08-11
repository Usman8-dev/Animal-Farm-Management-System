// import { BrowserRouter, Route, Routes } from "react-router-dom";
// import { ToastProvider } from "./context/ToastContext";
// import Register from "./Pages/Auth/Register";
// import VerifyEmailNotice from "./Pages/Auth/Verifyemailnotice";
// import Login from "./Pages/Auth/Login";
// import Dashboard from "./Pages/Dashboard";
// import ProtectedRoute from "./components/Protectedroute";
// import Layout from "./components/Layout";

// function App() {
//   return (
//     <div>
//       <BrowserRouter>

//         <ToastProvider>
//           <Routes>
//             <Route path="/register" element={<Register />} />
//             <Route
//               path="/verify-email-notice"
//               element={<VerifyEmailNotice />}
//             />
//             <Route path="/" element={<Login />} />

//             <Route
//               element={
//                 <ProtectedRoute>
//                   <Layout />
//                 </ProtectedRoute>
//               }>
//               <Route path="/dashboard" element={<Dashboard />} />

//             </Route>
//           </Routes>
//         </ToastProvider>
//       </BrowserRouter>
//     </div>
//   );
// }

// export default App;
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { AuthProvider } from "./context/AuthContext";
import Register from "./Pages/Auth/Register";
import VerifyEmailNotice from "./Pages/Auth/Verifyemailnotice";
import Login from "./Pages/Auth/Login";
import Dashboard from "./Pages/Dashboard";
import ProtectedRoute from "./components/Protectedroute";
import Layout from "./components/Layout";
import VerifyEmail from "./Pages/Auth/Verifyemail";

function App() {
  return (
    <div>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/verify-email-notice" element={<VerifyEmailNotice />} />
              <Route path="/" element={<Login />} />
              <Route path="/verify-email" element={<VerifyEmail/>} />

              <Route
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<Dashboard />} />
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
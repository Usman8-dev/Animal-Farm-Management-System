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
import Dashboard from "./Pages/Dashboard/Dashboard";
import ProtectedRoute from "./components/Protectedroute";
import Layout from "./components/Layout";
import VerifyEmail from "./Pages/Auth/Verifyemail";
import AnimalTypesTab from "./Pages/MasterData/Animaltypestab";
import BreedsTab from "./Pages/MasterData/Breedstab";
import GendersTab from "./Pages/MasterData/GendersTab";
import AnimalsList from "./Pages/Animal/Animalslist";
import AnimalDetail from "./Pages/Animal/Animaldetail";
import FamilyTreePage from "./Pages/Animal/FamilyTreePage";
import { ThemeProvider } from "./context/ThemeContext";
import TeamList from "./Pages/Team/TeamList";
import StaffDashboard from "./Pages/Dashboard/StaffDashboard";
import AnimalStatusesTab from "./Pages/Lifecycle/Animalstatusestab";
import ChangeStatusDialog from "./Pages/Lifecycle/Changestatusdialog";
import WeightValuationPage from "./Pages/Weight/WeightValuationPage";
import BreedingPage from "./Pages/Breeding/BreedingPage";
function App() {
  return (
    <div>
      <BrowserRouter>
      <ThemeProvider>
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
                <Route path="/staffdashboard" element={<StaffDashboard />} />

                    <Route path="/master-data/animal-types" element={<AnimalTypesTab />} />
                    <Route path="/master-data/breeds" element={<BreedsTab />} />
                    <Route path="/master-data/genders" element={<GendersTab />} />
                    <Route path="/animals" element={<AnimalsList/>} />
                    <Route path="/animals/:id" element={<AnimalDetail />} />
                    <Route path="/animals/:id/family-tree" element={<FamilyTreePage />} />
                    <Route path="team" element={<TeamList />} />

                    {/* Module 2  */}
                    <Route path="/master-data/animal-status" element={<AnimalStatusesTab />} />

                    {/* Module 3 — Weight & Valuation */}
                    <Route path="/weight" element={<WeightValuationPage />} />

                    {/* Module 4 — Breeding & Reproduction */}
                    <Route path="/breeding" element={<BreedingPage />} />
              </Route>
            </Routes>
          </ToastProvider>
        </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
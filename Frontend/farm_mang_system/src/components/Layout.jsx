import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

function Layout() {
  return (
    <div className="min-h-screen bg-[#FAF8F2]">
      <Navbar />
      <main className="w-full">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default Layout;
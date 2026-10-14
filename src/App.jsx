import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home/HomePage.jsx";
import "./fonts.css";
import "./App.css";

const DashboardPage = lazy(() => import("./pages/Dashboard/DashboardPage.jsx"));

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={null}>
                <DashboardPage />
              </Suspense>
            }
          />
          {/* Deep links like /photography or /projects/libris land on the desktop,
              which opens the target (see lib/deepLinks.js). */}
          <Route path="*" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import HomePage from "./pages/Home/HomePage.jsx";
import "./fonts.css";
import "./App.css";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;

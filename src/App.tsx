import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Comparison from "./pages/Comparison";
import Settings from "./pages/Settings";
import AuthPage from "./pages/Auth";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/comparison" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/comparison" element={<Comparison />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
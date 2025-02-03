import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Comparison from "./pages/Comparison";
import Settings from "./pages/Settings";
import AuthPage from "./pages/Auth";
import Index from "./pages/Index";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/comparison" element={<Comparison />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Router>
  );
}

export default App;
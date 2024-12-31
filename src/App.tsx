import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Comparison from './pages/Comparison';
import Settings from './pages/Settings';
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
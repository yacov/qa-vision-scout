import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Comparison from './pages/Comparison';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/comparison" replace />} />
          <Route path="/comparison" element={<Comparison />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/auth" element={<Auth />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
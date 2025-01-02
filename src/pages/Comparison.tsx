import { useState } from "react";
import { Layout, BarChart3, Smartphone, Settings } from "lucide-react";
import { ComparisonForm } from "@/components/comparison/ComparisonForm";
import { TestResultsTable } from "@/components/comparison/TestResultsTable";
import { ResultsDialog } from "@/components/comparison/ResultsDialog";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const Comparison = () => {
  const [showResults, setShowResults] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState({
    baselineUrl: "",
    newUrl: ""
  });

  const handleTestSelect = (baselineUrl: string, newUrl: string) => {
    setSelectedUrls({ baselineUrl, newUrl });
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-border bg-card">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-8">
            <Layout className="h-6 w-6 text-foreground" />
            <h1 className="text-xl font-bold text-foreground">TestHub</h1>
          </div>
          
          <nav className="space-y-2">
            <a href="/" className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <BarChart3 className="h-5 w-5" />
              Dashboard
            </a>
            <a href="/comparison" className="flex items-center gap-2 p-2 rounded-lg bg-accent text-accent-foreground">
              <Layout className="h-5 w-5" />
              Comparison Module
            </a>
            <a href="/device-testing" className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <Smartphone className="h-5 w-5" />
              Device Testing
            </a>
            <a href="/settings" className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <Settings className="h-5 w-5" />
              Settings
            </a>
          </nav>
        </div>
      </aside>
        <main className="flex-1 ml-64">
          <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
            <h2 className="text-2xl font-semibold text-foreground">Comparison Module</h2>
          </header>

          <div className="container mx-auto p-6 max-w-7xl">
            <ComparisonForm 
              onTestCreated={() => setShowResults(true)}
              initialBaselineUrl={selectedUrls.baselineUrl}
              initialNewUrl={selectedUrls.newUrl}
            />
            <TestResultsTable onTestSelect={handleTestSelect} />
            <ResultsDialog open={showResults} onOpenChange={setShowResults} />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default Comparison;

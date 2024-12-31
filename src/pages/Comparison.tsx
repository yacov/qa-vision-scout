import { useState } from "react";
import { Layout, BarChart3, Smartphone, Settings } from "lucide-react";
import { ComparisonForm } from "@/components/comparison/ComparisonForm";
import { TestResultsTable } from "@/components/comparison/TestResultsTable";
import { ResultsDialog } from "@/components/comparison/ResultsDialog";

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
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-8">
            <Layout className="h-6 w-6" />
            <h1 className="text-xl font-bold">TestHub</h1>
          </div>
          
          <nav className="space-y-2">
            <a href="/" className="flex items-center gap-2 p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <BarChart3 className="h-5 w-5" />
              Dashboard
            </a>
            <a href="/comparison" className="flex items-center gap-2 p-2 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
              <Layout className="h-5 w-5" />
              Comparison Module
            </a>
            <a href="/device-testing" className="flex items-center gap-2 p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <Smartphone className="h-5 w-5" />
              Device Testing
            </a>
            <a href="/settings" className="flex items-center gap-2 p-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
              <Settings className="h-5 w-5" />
              Settings
            </a>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 bg-background">
        <header className="border-b border-border bg-background p-4">
          <h2 className="text-2xl font-semibold text-foreground">Comparison Module</h2>
        </header>

        <main className="container mx-auto p-6 max-w-7xl">
          <ComparisonForm 
            onTestCreated={() => setShowResults(true)}
            initialBaselineUrl={selectedUrls.baselineUrl}
            initialNewUrl={selectedUrls.newUrl}
          />
          <TestResultsTable onTestSelect={handleTestSelect} />
          <ResultsDialog open={showResults} onOpenChange={setShowResults} />
        </main>
      </div>
    </div>
  );
};

export default Comparison;
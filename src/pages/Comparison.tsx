import { useState } from "react";
import { Layout, BarChart3, Smartphone, Settings, ChevronRight } from "lucide-react";
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
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-border bg-card lg:block hidden">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-8">
            <Layout className="h-6 w-6 text-foreground" aria-hidden="true" />
            <h1 className="text-xl font-bold text-foreground">TestHub</h1>
          </div>
          
          <nav className="space-y-2" aria-label="Main navigation">
            <a 
              href="/" 
              className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-current="false"
            >
              <BarChart3 className="h-5 w-5" aria-hidden="true" />
              <span>Dashboard</span>
            </a>
            <a 
              href="/comparison" 
              className="flex items-center gap-2 p-2 rounded-lg bg-accent text-accent-foreground"
              aria-current="page"
            >
              <Layout className="h-5 w-5" aria-hidden="true" />
              <span>Comparison Module</span>
            </a>
            <a 
              href="/device-testing" 
              className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-current="false"
            >
              <Smartphone className="h-5 w-5" aria-hidden="true" />
              <span>Device Testing</span>
            </a>
            <a 
              href="/settings" 
              className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-current="false"
            >
              <Settings className="h-5 w-5" aria-hidden="true" />
              <span>Settings</span>
            </a>
          </nav>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Layout className="h-6 w-6 text-foreground" />
            <span className="text-xl font-bold text-foreground">TestHub</span>
          </div>
          <button 
            className="p-2 rounded-lg hover:bg-accent"
            aria-label="Open navigation menu"
          >
            <Layout className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <a href="/" className="hover:text-foreground">Dashboard</a>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">Comparison Module</span>
          </div>
          <h2 className="text-2xl font-semibold text-foreground mt-2">Comparison Module</h2>
        </header>

        <div className="container mx-auto p-6 max-w-7xl">
          <div className="space-y-6">
            <section aria-labelledby="form-heading">
              <h3 id="form-heading" className="sr-only">URL Comparison Form</h3>
              <ComparisonForm 
                onTestCreated={() => setShowResults(true)}
                initialBaselineUrl={selectedUrls.baselineUrl}
                initialNewUrl={selectedUrls.newUrl}
              />
            </section>

            <section aria-labelledby="results-heading">
              <h3 id="results-heading" className="sr-only">Test Results</h3>
              <TestResultsTable onTestSelect={handleTestSelect} />
            </section>
          </div>
          <ResultsDialog open={showResults} onOpenChange={setShowResults} />
        </div>
      </main>
    </div>
  );
};

export default Comparison;
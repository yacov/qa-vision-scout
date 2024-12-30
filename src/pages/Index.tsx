import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { BarChart3, Layout, Settings, Smartphone } from "lucide-react";
import { useState } from "react";

const Index = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-sidebar p-4">
        <div className="flex items-center gap-2 mb-8">
          <Layout className="h-6 w-6" />
          <h1 className="text-xl font-bold">TestHub</h1>
        </div>
        
        <nav className="space-y-2">
          <a href="#" className="flex items-center gap-2 p-2 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
            <BarChart3 className="h-5 w-5" />
            Dashboard
          </a>
          <a href="#" className="flex items-center gap-2 p-2 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Layout className="h-5 w-5" />
            Comparison Module
          </a>
          <a href="#" className="flex items-center gap-2 p-2 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Smartphone className="h-5 w-5" />
            Device Testing
          </a>
          <a href="#" className="flex items-center gap-2 p-2 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Settings className="h-5 w-5" />
            Settings
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <header className="border-b p-4">
          <h2 className="text-2xl font-semibold">Dashboard</h2>
        </header>

        <ScrollArea className="h-[calc(100vh-5rem)] p-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Start a new test or view recent results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <button className="w-full p-2 text-left rounded-lg hover:bg-accent">
                    New Comparison Test
                  </button>
                  <button className="w-full p-2 text-left rounded-lg hover:bg-accent">
                    Device Responsiveness Test
                  </button>
                  <button className="w-full p-2 text-left rounded-lg hover:bg-accent">
                    View Recent Reports
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Tests Card */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Tests</CardTitle>
                <CardDescription>Your latest test results</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">No recent tests found</p>
                </div>
              </CardContent>
            </Card>

            {/* System Status Card */}
            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current system performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>Browserstack API</span>
                    <span className="text-green-500">●</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>AI Analysis</span>
                    <span className="text-green-500">●</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Database</span>
                    <span className="text-green-500">●</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Dashboard Content */}
          <div className="mt-6">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
              <CollapsibleTrigger className="w-full">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Testing Overview</CardTitle>
                      <span>{isOpen ? "▼" : "▶"}</span>
                    </div>
                  </CardHeader>
                </Card>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="mt-2">
                  <CardContent className="pt-6">
                    <p className="text-muted-foreground">
                      Welcome to TestHub! Start by creating a new comparison test or checking device responsiveness.
                      You can view all your test results and generate reports from the dashboard.
                    </p>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default Index;
import { Layout, BarChart3, Smartphone, Settings as SettingsIcon } from "lucide-react";
import { BrowserstackConfigForm } from "@/components/settings/BrowserstackConfigForm";
import { ConfigurationsList } from "@/components/settings/configurations-list/index";
import { PredefinedConfigs } from "@/components/settings/predefined-configs/index";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const Settings = () => {
  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <div className="w-64 border-r bg-card p-4">
          <div className="flex items-center gap-2 mb-8">
            <Layout className="h-6 w-6" />
            <h1 className="text-xl font-bold">TestHub</h1>
          </div>
          
          <nav className="space-y-2">
            <a href="/" className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <BarChart3 className="h-5 w-5" />
              Dashboard
            </a>
            <a href="/comparison" className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <Layout className="h-5 w-5" />
              Comparison Module
            </a>
            <a href="#" className="flex items-center gap-2 p-2 rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground">
              <Smartphone className="h-5 w-5" />
              Device Testing
            </a>
            <a href="/settings" className="flex items-center gap-2 p-2 rounded-lg bg-accent text-accent-foreground">
              <SettingsIcon className="h-5 w-5" />
              Settings
            </a>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="border-b p-4 flex-shrink-0">
            <h2 className="text-2xl font-semibold">Settings</h2>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <PredefinedConfigs />
            <BrowserstackConfigForm />
            <ConfigurationsList />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Settings;
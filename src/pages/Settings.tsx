import { useState } from "react";
import { Layout, BarChart3, Smartphone, Settings as SettingsIcon } from "lucide-react";
import { BrowserstackConfigForm } from "@/components/settings/BrowserstackConfigForm";
import { ConfigurationsList } from "@/components/settings/ConfigurationsList";

const Settings = () => {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r bg-sidebar p-4">
        <div className="flex items-center gap-2 mb-8">
          <Layout className="h-6 w-6" />
          <h1 className="text-xl font-bold">TestHub</h1>
        </div>
        
        <nav className="space-y-2">
          <a href="/" className="flex items-center gap-2 p-2 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <BarChart3 className="h-5 w-5" />
            Dashboard
          </a>
          <a href="/comparison" className="flex items-center gap-2 p-2 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Layout className="h-5 w-5" />
            Comparison Module
          </a>
          <a href="#" className="flex items-center gap-2 p-2 rounded-lg hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Smartphone className="h-5 w-5" />
            Device Testing
          </a>
          <a href="/settings" className="flex items-center gap-2 p-2 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
            <SettingsIcon className="h-5 w-5" />
            Settings
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <header className="border-b p-4">
          <h2 className="text-2xl font-semibold">Settings</h2>
        </header>

        <div className="p-6">
          <BrowserstackConfigForm />
          <ConfigurationsList />
        </div>
      </div>
    </div>
  );
};

export default Settings;
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Layout, BarChart3, Smartphone, Settings } from "lucide-react";

const Comparison = () => {
  const [baselineUrl, setBaselineUrl] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [selectedDevices] = useState([
    { name: "iPhone 12", os: "iOS 14" },
    { name: "Pixel 5", os: "Android 12" },
    { name: "Desktop Chrome", os: "Windows 10" }
  ]);

  const handleCompare = () => {
    if (baselineUrl && newUrl) {
      setShowResults(true);
    }
  };

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
          <a href="/comparison" className="flex items-center gap-2 p-2 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
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
          <h2 className="text-2xl font-semibold">Comparison Module</h2>
        </header>

        <div className="p-6">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>URL Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="baseline">Baseline URL</Label>
                <Input
                  id="baseline"
                  placeholder="Enter baseline URL"
                  value={baselineUrl}
                  onChange={(e) => setBaselineUrl(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="new">New Version URL</Label>
                <Input
                  id="new"
                  placeholder="Enter new version URL"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                />
              </div>
              <Button onClick={handleCompare}>Start Comparison</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Selected Devices</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Operating System</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedDevices.map((device, index) => (
                    <TableRow key={index}>
                      <TableCell>{device.name}</TableCell>
                      <TableCell>{device.os}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Dialog open={showResults} onOpenChange={setShowResults}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Comparison Results</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Baseline Version</h3>
                <div className="bg-gray-100 h-64 rounded flex items-center justify-center">
                  Screenshot placeholder
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">New Version</h3>
                <div className="bg-gray-100 h-64 rounded flex items-center justify-center">
                  Screenshot placeholder
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Comparison;
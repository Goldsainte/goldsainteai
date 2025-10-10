import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SupplierDirectory } from "@/components/SupplierDirectory";
import { SupplierVettingDashboard } from "@/components/SupplierVettingDashboard";
import { Building2, Shield } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

export default function SupplierManagement() {
  const { isAdmin } = useUserRole();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2 font-secondary">Supplier Management</h1>
          <p className="text-muted-foreground">
            Browse verified suppliers and manage supplier applications
          </p>
        </div>

        <Tabs defaultValue="directory" className="space-y-6">
          <TabsList className={isAdmin ? "grid w-full grid-cols-2" : ""}>
            <TabsTrigger value="directory" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Supplier Directory
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="vetting" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Vetting Dashboard
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="directory">
            <SupplierDirectory />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="vetting">
              <SupplierVettingDashboard />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}

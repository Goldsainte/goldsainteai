import { ProductionChecklist } from "@/components/admin/ProductionChecklist";
import { SecurityAudit } from "@/components/system/SecurityAudit";
import { NotificationBell } from "@/components/NotificationBell";
import { Shield } from "lucide-react";

export default function SystemHealth() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Shield className="w-8 h-8" />
            System Health
          </h1>
          <p className="text-muted-foreground">
            Production readiness checks and system status
          </p>
        </div>
        <NotificationBell />
      </div>

      <div className="space-y-8">
        <SecurityAudit />
        <ProductionChecklist />
      </div>
    </div>
  );
}

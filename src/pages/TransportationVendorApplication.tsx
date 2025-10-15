import TransportationVendorApplication from "@/components/TransportationVendorApplication";
import { SimpleHeader } from "@/components/SimpleHeader";

export default function TransportationVendorApplicationPage() {
  return (
    <div className="min-h-screen bg-background">
      <SimpleHeader />
      <TransportationVendorApplication />
    </div>
  );
}

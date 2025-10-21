import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import UberBookingForm from "./UberBookingForm";

interface UberBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  pickupLat?: string;
  pickupLng?: string;
  dropoffLat?: string;
  dropoffLng?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
}

export function UberBookingModal({
  isOpen,
  onClose,
  productId,
  productName,
  pickupLat,
  pickupLng,
  dropoffLat,
  dropoffLng,
  pickupAddress,
  dropoffAddress,
}: UberBookingModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book {productName}</DialogTitle>
        </DialogHeader>
        <UberBookingForm
          productId={productId}
          initialPickupLat={pickupLat}
          initialPickupLng={pickupLng}
          initialDropoffLat={dropoffLat}
          initialDropoffLng={dropoffLng}
          initialPickupAddress={pickupAddress}
          initialDropoffAddress={dropoffAddress}
          onSuccess={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

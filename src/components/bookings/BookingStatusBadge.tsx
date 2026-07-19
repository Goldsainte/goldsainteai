// src/components/bookings/BookingStatusBadge.tsx
type BookingStatus =
  | "pending_payment"
  | "deposit_paid"
  | "paid_in_full"
  | "in_escrow"
  | "completed"
  | "cancelled_refunded"
  | "disputed";

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { label, bg, text } = mapBookingStatus(status);

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[12px]"
      style={{ backgroundColor: bg, color: text }}
    >
      {label}
    </span>
  );
}

function mapBookingStatus(status: BookingStatus) {
  switch (status) {
    case "pending_payment":
      return {
        label: "Pending payment",
        bg: "#f6f3ea",
        text: "#4a4a4a",
      };
    case "deposit_paid":
      return {
        label: "Deposit paid",
        bg: "#d4e7dd",
        text: "#0c4d47",
      };
    case "paid_in_full":
      return {
        label: "Paid in full",
        bg: "#cfe8d7",
        text: "#0c4d47",
      };
    case "in_escrow":
      return {
        label: "Payment complete",
        bg: "#f5e9c5",
        text: "#6d5223",
      };
    case "completed":
      return {
        label: "Trip completed",
        bg: "#d4e7dd",
        text: "#0c4d47",
      };
    case "cancelled_refunded":
      return {
        label: "Cancelled / refunded",
        bg: "#f0d1d1",
        text: "#5b2c2c",
      };
    case "disputed":
      return {
        label: "In review",
        bg: "#f5e9c5",
        text: "#6d5223",
      };
    default:
      return {
        label: status,
        bg: "#e2e2e2",
        text: "#555555",
      };
  }
}

export function BookingStateExplainer({ status }: { status: BookingStatus }) {
  switch (status) {
    case "pending_payment":
      return (
        <p className="text-[12.5px] text-[#4a4a4a]">
          You've accepted a proposal — now it's time to secure it. Your trip
          isn't confirmed until your checkout payment is completed.
        </p>
      );
    case "deposit_paid":
      return (
        <p className="text-[12.5px] text-[#4a4a4a]">
          Your deposit is received — paid directly to your specialist, your
          seller of record. They can now start locking in the elements of your
          trip. The remaining balance and due date are shown below.
        </p>
      );
    case "paid_in_full":
      return (
        <p className="text-[12.5px] text-[#4a4a4a]">
          Your trip is fully paid — your payment went directly to your
          specialist. Everything they need to deliver your trip is now in
          their hands, with Goldsainte support behind the booking.
        </p>
      );
    case "in_escrow":
      return (
        <p className="text-[12.5px] text-[#4a4a4a]">
          Your payment is complete and with your specialist. If something is
          materially different from what was agreed, contact Goldsainte
          support and we'll mediate with your specialist directly.
        </p>
      );
    case "completed":
      return (
        <p className="text-[12.5px] text-[#4a4a4a]">
          This trip is complete. If you had any issues, you can still leave
          feedback to help us protect future travelers.
        </p>
      );
    case "cancelled_refunded":
      return (
        <p className="text-[12.5px] text-[#4a4a4a]">
          This booking was cancelled and a refund has been processed based on
          the agreed terms. If anything looks incorrect, reach out to support
          from this page.
        </p>
      );
    case "disputed":
      return (
        <p className="text-[12.5px] text-[#4a4a4a]">
          This booking is under review by Goldsainte. We may ask both you and
          your partners for additional information while we work toward a
          resolution.
        </p>
      );
    default:
      return null;
  }
}

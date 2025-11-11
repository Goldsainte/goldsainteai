import { GroupBookingCreator } from "@/components/GroupBookingCreator";

export default function GroupBookings() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Group Bookings</h1>
        <p className="text-muted-foreground">
          Create group trips and split costs with friends
        </p>
      </div>

      <GroupBookingCreator />
    </div>
  );
}

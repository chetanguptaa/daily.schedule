import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import RootLayout from "@/layout/root-layout";

export default function Booking() {
  return (
    <RootLayout>
      <div className="p-6 min-h-screen bg-background">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Bookings</h1>
          <p className="text-muted-foreground">See upcoming and past events booked through your event type links.</p>
        </div>
        <div className="flex justify-between items-center mb-6">
          <Tabs defaultValue="past" className="w-full max-w-2xl">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="unconfirmed">Unconfirmed</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
              <TabsTrigger value="canceled">Canceled</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
    </RootLayout>
  );
}

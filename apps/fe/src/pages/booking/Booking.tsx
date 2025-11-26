import Loading from "@/components/loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BACKEND_URL } from "@/constants";
import RootLayout from "@/layout/root-layout";
import axios from "axios";
import { useState } from "react";
import { useQuery } from "react-query";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Globe } from "lucide-react";

async function getBookings(status: string) {
  const res = await axios.get(BACKEND_URL + "/bookings?status=" + status, {
    withCredentials: true,
  });
  return res.data;
}

function formatDate(dateString: string) {
  const d = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    day: "2-digit",
    month: "long",
    year: "numeric",
  };
  const formattedDate = d.toLocaleDateString("en-GB", options);
  return { formattedDate };
}

function formatTimeRange(startISO: string, startTime: string, endTime: string) {
  const start = new Date(startISO);

  const [sh, sm] = startTime.split(":");
  const [eh, em] = endTime.split(":");

  const startDate = new Date(start);
  startDate.setHours(Number(sh), Number(sm));

  const endDate = new Date(start);
  endDate.setHours(Number(eh), Number(em));

  function format(t: Date) {
    return t
      .toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
  }

  return `${format(startDate)} - ${format(endDate)}`;
}

export default function Booking() {
  const [status, setStatus] = useState("upcoming");

  const { data, isLoading, isError } = useQuery(["getBookings", status], () => getBookings(status));

  const renderList = (list: any[]) => {
    if (isLoading)
      return (
        <div className="flex justify-center items-center h-[25vh] w-full">
          <Loading />
        </div>
      );
    if (isError)
      return (
        <div className="flex justify-center items-center h-[25vh] w-full">
          <div className="text-sm text-red-500">Error loading bookings.</div>
        </div>
      );
    if (!list?.length)
      return (
        <div className="flex justify-center items-center h-[25vh] w-full">
          <div className="text-sm text-muted-foreground">No bookings found.</div>
        </div>
      );

    return (
      <div className="flex flex-col gap-4 mt-4">
        {list.map((item: any) => (
          <div key={item.id} className="rounded-xl border p-4 shadow-sm bg-white">
            <div className="flex justify-between">
              <div className="flex flex-col gap-2">
                <div className="text-md font-medium gap-2 flex items-center">
                  <span className="mr-2">{formatDate(item.meetingDate).formattedDate}</span>
                  <div className="mt-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Globe className="w-4 h-4 text-muted-foreground cursor-pointer" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{item.event?.schedule?.timezone || "Unknown timezone"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  {formatTimeRange(item.meetingDate, item.startTime, item.endTime)}
                </div>
                <div className="font-semibold text-lg">{item.event?.title}</div>
                <div className="text-sm text-muted-foreground">{item.guestName}</div>
                <div
                  className="text-sm text-blue-600 underline hover:cursor-pointer"
                  onClick={() => window.open(item.meetingLink, "_blank")}
                >
                  {item.event?.platform?.name} — {item.meetingLink}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground capitalize">
                  {item.status.toLowerCase()}
                </div>
                <button className="text-gray-500 hover:text-gray-700">⋯</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <RootLayout>
      <div className="p-6 min-h-screen bg-background">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Bookings</h1>
          <p className="text-muted-foreground">See upcoming and past events booked through your event type links.</p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <Tabs value={status} onValueChange={(v) => setStatus(v)} className="w-full">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="unconfirmed">Unconfirmed</TabsTrigger>
              <TabsTrigger value="past">Past</TabsTrigger>
              <TabsTrigger value="canceled">Canceled</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming">{renderList(data)}</TabsContent>
            <TabsContent value="unconfirmed">{renderList(data)}</TabsContent>
            <TabsContent value="past">{renderList(data)}</TabsContent>
            <TabsContent value="canceled">{renderList(data)}</TabsContent>
          </Tabs>
        </div>
      </div>
    </RootLayout>
  );
}

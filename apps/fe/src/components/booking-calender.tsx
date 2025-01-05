import { CardContent, CardHeader } from "@/components/ui/card";
import { BACKEND_URL } from "@/constants";
import axios from "axios";
import { useQuery } from "react-query";
import { MeetingForm } from "./meeting-form";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Monitor } from "lucide-react";

async function getSlotsDetails(userId: string, link: string) {
  const res = await axios.get(BACKEND_URL + "/slots/" + userId + "/" + link, {
    withCredentials: true,
  });
  return res.data;
}

export default function BookingCalendar({ userId, link }: { userId: string; link: string }) {
  const { data, isLoading, isError } = useQuery(["getSlotsDetails"], () => {
    return getSlotsDetails(userId, link);
  });

  if (data && data.event && data.event.validTimes.length > 0 && !isLoading && !isError) {
    return (
      <>
        <div className="bg-gray-100 w-full h-[100vh] mx-auto">
          <div className="max-w-6xl w-full p-4 mx-auto flex justify-center items-center h-[100vh]">
            <div className="flex space-x-2 gap-4 h-fit bg-white p-8">
              <div className="flex justify-between space-x-4">
                <CardHeader className="space-y-4 p-0">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={data.user.picture} />
                      <AvatarFallback>{data.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{data.user.name}</div>
                    </div>
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">{data.event.title}</h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <span>{data.event.duration} mins</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Monitor className="h-4 w-4" />
                    <span>{data.platform.name}</span>
                  </div>
                </CardHeader>
                <CardContent className="">
                  <MeetingForm validTimes={data.event.validTimes} eventId={data.event.id} userId={data.user.id} />
                </CardContent>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

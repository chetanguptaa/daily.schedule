import { CardContent, CardHeader } from "@/components/ui/card";
import { BACKEND_URL } from "@/constants";
import axios from "axios";
import { useQuery } from "react-query";
import { MeetingForm } from "./meeting-form";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Monitor } from "lucide-react";
import Loading from "./loading";

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
  if (isLoading) {
    return (
      <div className="flex justify-center items-center w-full h-screen">
        <Loading />
      </div>
    );
  }
  if (data && data.event && data.event.validTimes.length > 0 && !isLoading && !isError) {
    return (
      <>
        <div className="bg-white min-h-screen w-full py-8 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg overflow-hidden transition-all duration-300">
              <div className="md:flex">
                <div className="md:w-1/2 p-8 bg-black text-white">
                  <CardHeader className="space-y-6 p-0">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 ring-2 ring-white">
                        <AvatarImage src={data.user.picture} />
                        <AvatarFallback>{data.user.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-2xl font-semibold">{data.user.name}</div>
                        <div className="text-white">{data.user.email}</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold text-white">{data.event.title}</h2>
                      <div className="flex items-center gap-2 text-white">
                        <span>{data.event.duration} mins</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm bg-white  p-2 rounded-md">
                      <Monitor className="h-5 w-5 text-black" />
                      <span className="text-black">{data.platform.name}</span>
                    </div>
                  </CardHeader>
                </div>
                <div className="md:w-1/2 p-8">
                  <CardContent className="p-0">
                    <MeetingForm validTimes={data.event.validTimes} eventId={data.event.id} userId={data.user.id} />
                  </CardContent>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

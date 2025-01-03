import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BACKEND_URL } from "@/constants";
import axios from "axios";
import { useQuery } from "react-query";
import { MeetingForm } from "./meeting-form";

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
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>
            Book {data.event.name} with {data.user.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MeetingForm validTimes={data.event.validTimes} eventId={data.event.id} userId={data.user.id} />
        </CardContent>
      </Card>
    );
  }
}

import BookingCalendar from "@/components/booking-calender";
import { useParams } from "react-router";

export default function BookEvent() {
  const params = useParams();
  return <BookingCalendar userId={params.userId || ""} link={params.eventLink || ""} />;
}

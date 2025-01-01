import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BACKEND_URL } from "@/constants";
import axios from "axios";
import { Monitor } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { ScrollArea } from "./ui/scroll-area";

interface IGetSlotsDetails {
  date: number;
  month: string;
  timezone: string;
  dayOfWeek: number;
}

const getTomorrow = (today: Date): Date => {
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow;
};

async function getSlotsDetails(userId: string, link: string, data: IGetSlotsDetails) {
  const res = await axios.post(BACKEND_URL + "/slots/" + userId + "/" + link, data, {
    withCredentials: true,
  });
  return res.data;
}

export default function BookingCalendar({ userId, link }: { userId: string; link: string }) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(getTomorrow(today));
  const [timezones, setTimezones] = useState<string[]>([]);
  const [timezone, setTimezone] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const { data, isLoading, isError } = useQuery(["getSlotsDetails", selectedDate], () => {
    const dayOfWeek = selectedDate.getDay();
    if (dayOfWeek === 0) {
      return getSlotsDetails(userId, link, {
        timezone,
        date: selectedDate.getDate(),
        month: selectedDate.getMonth() + "-" + selectedDate.getFullYear().toString(),
        dayOfWeek: 6,
      });
    }
    return getSlotsDetails(userId, link, {
      timezone,
      date: selectedDate.getDate(),
      month: selectedDate.getMonth() + "-" + selectedDate.getFullYear().toString(),
      dayOfWeek: selectedDate.getDay() - 1,
    });
  });

  useEffect(() => {
    const allTimezones = Intl.supportedValuesOf("timeZone");
    setTimezones(allTimezones);
  }, []);

  const convertDateToTimezone = (date: Date, timezone: string): Date => {
    const options = { timeZone: timezone, hour12: false };
    const localeString = date.toLocaleString("en-US", options);
    return new Date(localeString);
  };

  const handleTimezoneChange = (newTimezone: string) => {
    setTimezone(newTimezone);
    const convertedDate = convertDateToTimezone(getTomorrow(today), newTimezone);
    setSelectedDate(convertedDate);
  };

  if (data && !isLoading && !isError) {
    return (
      <div className="bg-gray-100 w-full h-[100vh] mx-auto">
        <div className="max-w-6xl w-full p-4 mx-auto flex justify-center items-center h-[100vh]">
          <div className="flex space-x-2 gap-4 h-96">
            <Card className="w-1/3">
              <CardHeader className="space-y-4">
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
                <Select value={timezone} onValueChange={handleTimezoneChange}>
                  <SelectTrigger id="timezone-select" className="w-full">
                    <SelectValue placeholder="Select your timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[200px]">
                      {timezones.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </CardHeader>
            </Card>
            <Card className="w-1/3 flex justify-center items-center">
              <CardContent className="p-0 flex justify-center items-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) {
                      setSelectedDate(date);
                    }
                  }}
                  className="rounded-md w-full"
                  defaultMonth={selectedDate}
                  disabled={(date) => {
                    if (date < getTomorrow(today)) return true;
                    if (date.getDay() === 0) {
                      return data.event.unavailableDays.includes(6);
                    }
                    return data.event.unavailableDays.includes(date.getDay() - 1);
                  }}
                  showOutsideDays={false}
                  styles={{ cell: { minWidth: "32px" } }}
                />
              </CardContent>
            </Card>
            <Card className="w-1/3 relative">
              <CardHeader className="flex flex-row fixed items-center w-fit">
                <div className="flex items-center w-fit justify-start pr-2">
                  <span>{selectedDate.getDay() === 0 && "Sunday"}</span>
                  <span>{selectedDate.getDay() === 1 && "Monday"}</span>
                  <span>{selectedDate.getDay() === 2 && "Tuesday"}</span>
                  <span>{selectedDate.getDay() === 3 && "Wednesday"}</span>
                  <span>{selectedDate.getDay() === 4 && "Thursday"}</span>
                  <span>{selectedDate.getDay() === 5 && "Friday"}</span>
                  <span>{selectedDate.getDay() === 6 && "Saturday"}</span>
                  <span className="text-muted-foreground pl-2">{selectedDate.getDate().toString()}</span>
                </div>
              </CardHeader>
              <div className="overflow-auto h-[75%] mt-16">
                <CardContent className="space-y-2">
                  {data.event.timeslots.map((time: string) => (
                    <Button key={time} variant="outline" className="w-full justify-start">
                      {time}
                    </Button>
                  ))}
                </CardContent>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }
}

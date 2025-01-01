import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Plus, Trash2 } from "lucide-react";
import axios from "axios";
import { BACKEND_URL } from "@/constants";
import { toast } from "sonner";
import { useParams } from "react-router";
import { useQuery } from "react-query";

type TimeSlot = {
  startTime: string;
  endTime: string;
};

type DaySchedule = {
  isAvailable: boolean;
  timeSlots: TimeSlot[];
};

type WeekSchedule = {
  [key: string]: DaySchedule;
};

async function getSlots(id: string) {
  const res = await axios.get(BACKEND_URL + "/calender/schedules/" + id + "/slots", {
    withCredentials: true,
  });
  return res.data;
}

const daysOfWeek = [0, 1, 2, 3, 4, 5, 6];

const timeOptions = Array.from({ length: 24 * 4 }, (_, i) => {
  const hour = Math.floor(i / 4);
  const minute = (i % 4) * 15;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
});

export default function AddSlots() {
  const [weekSchedule, setWeekSchedule] = useState<WeekSchedule>(() => {
    const initialSchedule: WeekSchedule = {};
    daysOfWeek.forEach((day) => {
      initialSchedule[day] = { isAvailable: false, timeSlots: [] };
    });
    return initialSchedule;
  });
  const [timezone, setTimezone] = useState("Asia/Calcutta");
  const [timezones, setTimezones] = useState<string[]>([]);
  const [timezoneSearch, setTimezoneSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const params = useParams();

  useEffect(() => {
    const allTimezones = Intl.supportedValuesOf("timeZone");
    setTimezones(allTimezones);

    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setTimezone(userTimezone);
  }, []);

  const filteredTimezones = useMemo(() => {
    return timezones.filter((tz) => tz.toLowerCase().includes(timezoneSearch.toLowerCase()));
  }, [timezones, timezoneSearch]);

  const handleAvailabilityChange = (day: number, isAvailable: boolean) => {
    if (isAvailable) {
      setWeekSchedule((prev) => ({
        ...prev,
        [day]: { timeSlots: [{ startTime: "09:00", endTime: "17:00" }], isAvailable },
      }));
    } else {
      setWeekSchedule((prev) => ({
        ...prev,
        [day]: { timeSlots: [], isAvailable: false },
      }));
    }
  };

  const handleTimeChange = (day: number, slotIndex: number, type: "startTime" | "endTime", time: string) => {
    setWeekSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.map((slot, index) => (index === slotIndex ? { ...slot, [type]: time } : slot)),
      },
    }));
  };

  const handleTimezoneChange = (newTimezone: string) => {
    setTimezone(newTimezone);
  };

  const copyToWholeWeek = (sourceDay: number) => {
    const sourceDaySchedule = weekSchedule[sourceDay];
    setWeekSchedule((prev) => {
      const newSchedule = { ...prev };
      daysOfWeek.forEach((day) => {
        newSchedule[day] = { ...sourceDaySchedule };
      });
      return newSchedule;
    });
  };

  const addTimeSlot = (day: number) => {
    setWeekSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [...prev[day].timeSlots, { startTime: "09:00", endTime: "17:00" }],
      },
    }));
  };

  const removeTimeSlot = (day: number, slotIndex: number) => {
    setWeekSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.filter((_, index) => index !== slotIndex),
      },
    }));
    for (const day of daysOfWeek) {
      if (weekSchedule[day].timeSlots.length === 0) {
        handleAvailabilityChange(day, false);
      }
    }
  };

  const handleSubmit = async () => {
    const scheduleId = params.id;
    const slots: {
      [key: string]: TimeSlot[];
    } = {};
    for (const key in weekSchedule) {
      slots[key] = weekSchedule[key].timeSlots;
    }
    const res = await axios.post(
      BACKEND_URL + "/calender/schedules/add-slots",
      {
        timezone,
        slots,
        scheduleId,
      },
      {
        withCredentials: true,
      }
    );
    toast(res.data.message);
  };

  const { data, isLoading, isError } = useQuery(["getSlots"], () => getSlots(params.id || ""));

  const [isDataPrefilled, setIsDataPrefilled] = useState(false);

  useEffect(() => {
    if (data && data.availabilities && data.availabilities.length > 0) {
      setTimezone(data.timezone);
      const prefilledSchedule: WeekSchedule = {};
      daysOfWeek.forEach((day) => {
        const availability = data.availabilities.find((a: { dayOfWeek: number }) => a.dayOfWeek === day);
        prefilledSchedule[day] =
          availability ?
            {
              isAvailable: true,
              timeSlots: availability.timeSlots.map((slot: { startTime: string; endTime: string }) => ({
                startTime: slot.startTime,
                endTime: slot.endTime,
              })),
            }
          : { isAvailable: false, timeSlots: [] };
      });
      setWeekSchedule(prefilledSchedule);
      setIsDataPrefilled(true);
    }
  }, [data]);

  return (
    <Card className="w-full max-w-4xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Set Your Weekly Availability</CardTitle>
        <CardDescription>Define your working hours for each day of the week</CardDescription>
      </CardHeader>
      {((data && data.availabilities && data.availabilities.length > 0 && isDataPrefilled) ||
        (data && data.availabilities && data.availabilities.length === 0)) &&
        !isError && (
          <CardContent>
            <div className="mb-6 space-y-2">
              <Label htmlFor="timezone-select">Your Timezone</Label>
              <Select value={timezone} onValueChange={handleTimezoneChange}>
                <SelectTrigger id="timezone-select" className="w-full">
                  <SelectValue placeholder="Select your timezone" />
                </SelectTrigger>
                <SelectContent>
                  <div className="mb-2 px-2">
                    <Input
                      placeholder="Search timezone..."
                      value={timezoneSearch}
                      onChange={(e) => setTimezoneSearch(e.target.value)}
                      ref={searchInputRef}
                      onFocus={() => searchInputRef.current?.select()}
                    />
                  </div>
                  <ScrollArea className="h-[200px]">
                    {filteredTimezones.map((tz) => (
                      <SelectItem key={tz} value={tz}>
                        {tz}
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-6">
              {daysOfWeek.map((day) => (
                <div key={day} className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <div className="w-24">
                      <Label>{day === 0 && "Monday"}</Label>
                      <Label>{day === 1 && "Tuesday"}</Label>
                      <Label>{day === 2 && "Wednesday"}</Label>
                      <Label>{day === 3 && "Thursday"}</Label>
                      <Label>{day === 4 && "Friday"}</Label>
                      <Label>{day === 5 && "Saturday"}</Label>
                      <Label>{day === 6 && "Sunday"}</Label>
                    </div>
                    <Switch
                      checked={weekSchedule[day].isAvailable}
                      onCheckedChange={(checked) => handleAvailabilityChange(day, checked)}
                    />
                    {weekSchedule[day].isAvailable && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToWholeWeek(day)}
                        title={`Copy ${day}'s schedule to whole week`}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy to Week
                      </Button>
                    )}
                  </div>
                  {weekSchedule[day].isAvailable && (
                    <div className="ml-28 space-y-2">
                      {weekSchedule[day].timeSlots.map((slot, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Select
                            value={slot.startTime}
                            onValueChange={(value) => handleTimeChange(day, index, "startTime", value)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Start time" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span>to</span>
                          <Select
                            value={slot.endTime}
                            onValueChange={(value) => handleTimeChange(day, index, "endTime", value)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="End time" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeOptions.map((time) => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {index !== 0 && (
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => removeTimeSlot(day, index)}
                              title="Remove time slot"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button variant="outline" size="sm" onClick={() => addTimeSlot(day)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Time Slot
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button className="mt-6 w-full" onClick={handleSubmit} disabled={isError || isLoading}>
              Save Availability
            </Button>
          </CardContent>
        )}
    </Card>
  );
}

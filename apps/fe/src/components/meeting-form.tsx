import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarIcon } from "lucide-react";
import { isSameDay, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Button } from "./ui/button";
import { formatDate, formatTimeString, formatTimezoneOffset } from "@/lib/formatter";
import { Calendar } from "./ui/calendar";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { toZonedTime } from "date-fns-tz";
import axios from "axios";
import { BACKEND_URL } from "@/constants";
import { toast } from "sonner";

const meetingSchemaBase = z.object({
  startTime: z.date().min(new Date()),
  guestEmail: z.string().email().min(1, "Required"),
  guestName: z.string().min(1, "Required"),
  guestNotes: z.string().optional(),
  timezone: z.string().min(1, "Required"),
});

export const meetingFormSchema = z
  .object({
    date: z.date().min(startOfDay(new Date()), "Must be in the future"),
  })
  .merge(meetingSchemaBase);

export const meetingActionSchema = z
  .object({
    eventId: z.string().min(1, "Required"),
    userId: z.string().min(1, "Required"),
  })
  .merge(meetingSchemaBase);

export function MeetingForm({ validTimes, eventId, userId }: { validTimes: Date[]; eventId: string; userId: string }) {
  const form = useForm<z.infer<typeof meetingFormSchema>>({
    resolver: zodResolver(meetingFormSchema),
    defaultValues: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  });

  const timezone = form.watch("timezone");
  const date = form.watch("date");
  const validTimesInTimezone = useMemo(() => {
    return validTimes.map((date) => toZonedTime(date, timezone));
  }, [validTimes, timezone]);

  async function onSubmit(values: z.infer<typeof meetingFormSchema>) {
    try {
      await axios.post(BACKEND_URL + "/slots/book-slot", {
        ...values,
        eventId,
        userId,
      });
      toast("Schedule booked successfully");
    } catch (error) {
      console.log(error);
      toast("Some error occured, please try again later");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {form.formState.errors.root && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md">{form.formState.errors.root.message}</div>
        )}
        <FormField
          control={form.control}
          name="timezone"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Timezone</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select your timezone" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Intl.supportedValuesOf("timeZone").map((timezone) => (
                    <SelectItem key={timezone} value={timezone}>
                      {timezone} {formatTimezoneOffset(timezone)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <Popover>
                <FormItem className="flex flex-col">
                  <FormLabel className="text-sm font-medium text-gray-700">Date</FormLabel>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "pl-3 text-left font-normal flex w-full",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? formatDate(field.value) : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(value) => {
                        field.onChange(value);
                      }}
                      disabled={(date) => !validTimesInTimezone.some((time) => isSameDay(date, time))}
                      initialFocus
                    />
                  </PopoverContent>
                  <FormMessage />
                </FormItem>
              </Popover>
            )}
          />
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Time</FormLabel>
                <Select
                  disabled={date == null || timezone == null}
                  onValueChange={(value) => field.onChange(new Date(Date.parse(value)))}
                  defaultValue={field.value?.toISOString()}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a Time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {validTimesInTimezone
                      .filter((time) => isSameDay(time, date))
                      .map((time) => (
                        <SelectItem key={time.toISOString()} value={time.toISOString()}>
                          {formatTimeString(time)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="guestName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Your Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="John Doe" className="w-full" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="guestEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700">Your Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="joedoe@gmail.com" {...field} className="w-full" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="guestNotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-gray-700">Notes</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  className="w-full resize-none h-24"
                  placeholder="Any additional information or questions..."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="text-white font-semibold py-2 px-4 rounded-md transition-colors duration-300"
          >
            {form.formState.isSubmitting ? "Scheduling..." : "Schedule Meeting"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

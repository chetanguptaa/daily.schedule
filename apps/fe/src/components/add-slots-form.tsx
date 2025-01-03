import { Copy, Plus, Trash2 } from "lucide-react";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { timeToInt } from "@/lib/time-to-int";
import { formatTimezoneOffset, generateTimeOptions } from "@/lib/formatter";
import { useParams } from "react-router";
import { BACKEND_URL } from "@/constants";
import axios from "axios";
import { toast } from "sonner";

const DAYS_OF_WEEK_IN_ORDER = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;

const TIME_OPTIONS = generateTimeOptions();

const scheduleFormSchema = z.object({
  timezone: z.string(),
  availabilities: z.array(
    z.object({
      dayOfWeek: z.enum(DAYS_OF_WEEK_IN_ORDER),
      startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
      endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    })
  ),
});

type Availability = z.infer<typeof scheduleFormSchema>["availabilities"][number];

export function AddSlotsForm({
  schedule,
}: {
  schedule?: {
    timezone: string;
    availabilities: Availability[];
  };
}) {
  const params = useParams();
  const form = useForm<z.infer<typeof scheduleFormSchema>>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      timezone: schedule?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
      availabilities:
        schedule?.availabilities.toSorted((a, b) => {
          return timeToInt(a.startTime) - timeToInt(b.startTime);
        }) ?? [],
    },
  });

  const {
    append: addAvailability,
    remove: removeAvailability,
    fields: availabilityFields,
    replace: replaceAvailabilities,
  } = useFieldArray({ name: "availabilities", control: form.control });

  const groupedAvailabilityFields = Object.groupBy(
    availabilityFields.map((field, index) => ({ ...field, index })),
    (availability) => availability.dayOfWeek
  );

  async function onSubmit(values: z.infer<typeof scheduleFormSchema>) {
    const scheduleId = params.id;
    const res = await axios.post(
      BACKEND_URL + "/calender/schedules/add-slots",
      {
        ...values,
        scheduleId,
      },
      {
        withCredentials: true,
      }
    );
    toast(res.data.message);
  }

  const copyDaySchedule = (
    dayOfWeek: "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY" | "SUNDAY"
  ) => {
    const daySchedule = groupedAvailabilityFields[dayOfWeek] || [];
    const newAvailabilities = DAYS_OF_WEEK_IN_ORDER.flatMap((day) => {
      if (day === dayOfWeek) {
        return daySchedule;
      }
      return daySchedule.map((slot) => ({
        ...slot,
        dayOfWeek: day,
      }));
    });
    replaceAvailabilities(newAvailabilities);
  };

  return (
    <Card className="w-full max-w-4xl  mx-auto my-8">
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex gap-6 flex-col">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold flex items-center gap-2">Working Hours</h2>
              </div>
              <div className="flex items-center gap-4">
                <Button type="submit">Save</Button>
              </div>
            </div>
            {form.formState.errors.root && (
              <div className="text-red-500 text-sm">{form.formState.errors.root.message}</div>
            )}
            <FormField
              control={form.control}
              name="timezone"
              render={({ field }) => (
                <FormItem className="w-[280px]">
                  <FormLabel>Timezone</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-[300px]">
                      {Intl.supportedValuesOf("timeZone").map((timezone) => (
                        <SelectItem key={timezone} value={timezone}>
                          {timezone}
                          {` (${formatTimezoneOffset(timezone)})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-6">
              {DAYS_OF_WEEK_IN_ORDER.map((dayOfWeek) => (
                <div key={dayOfWeek} className="flex justify-between gap-4 items-start">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={(groupedAvailabilityFields[dayOfWeek]?.length ?? 0) > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          addAvailability({
                            dayOfWeek,
                            startTime: "09:00",
                            endTime: "17:00",
                          });
                        } else {
                          groupedAvailabilityFields[dayOfWeek]?.forEach((field) => {
                            removeAvailability(field.index);
                          });
                        }
                      }}
                    />
                    <span className="capitalize font-medium">{dayOfWeek.substring(0, 3)}</span>
                  </div>
                  <div className="space-y-2">
                    {groupedAvailabilityFields[dayOfWeek]?.map((field) => (
                      <div className="flex items-center gap-2 group" key={field.id}>
                        <FormField
                          control={form.control}
                          name={`availabilities.${field.index}.startTime`}
                          render={({ field: startTimeField }) => (
                            <FormItem>
                              <Select onValueChange={startTimeField.onChange} defaultValue={startTimeField.value}>
                                <FormControl>
                                  <SelectTrigger className="w-[110px]">
                                    <SelectValue className="text-black" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {TIME_OPTIONS.map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <span>-</span>
                        <FormField
                          control={form.control}
                          name={`availabilities.${field.index}.endTime`}
                          render={({ field: endTimeField }) => (
                            <FormItem>
                              <Select onValueChange={endTimeField.onChange} defaultValue={endTimeField.value}>
                                <FormControl>
                                  <SelectTrigger className="w-[110px]">
                                    <SelectValue className="text-black" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {TIME_OPTIONS.map((time) => (
                                    <SelectItem key={time} value={time}>
                                      {time}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-8"
                            onClick={() => removeAvailability(field.index)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                        <FormMessage>
                          {form.formState.errors.availabilities?.at?.(field.index)?.root?.message}
                        </FormMessage>
                      </div>
                    ))}
                    {(groupedAvailabilityFields[dayOfWeek]?.length ?? 0) > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          addAvailability({
                            dayOfWeek,
                            startTime: "09:00",
                            endTime: "17:00",
                          });
                        }}
                      >
                        <Plus className="size-4 mr-2" />
                        Add another time slot
                      </Button>
                    )}
                  </div>
                  <div className="flex items-start">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-zinc-400 hover:text-white"
                      onClick={() => copyDaySchedule(dayOfWeek)}
                      disabled={(groupedAvailabilityFields[dayOfWeek]?.length ?? 0) === 0}
                    >
                      <Copy className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// return (
//   <Card className="w-full max-w-4xl mx-auto my-8">
//     <CardHeader>
//       <CardTitle>Set Your Weekly Availability</CardTitle>
//       <CardDescription>Define your working hours for each day of the week</CardDescription>
//     </CardHeader>
//     {((data && data.availabilities && data.availabilities.length > 0 && isDataPrefilled) ||
//       (data && data.availabilities && data.availabilities.length === 0)) &&
//       !isError && (
//         <CardContent>
//           <div className="mb-6 space-y-2">
//             <Label htmlFor="timezone-select">Your Timezone</Label>
//             <Select value={timezone} onValueChange={handleTimezoneChange}>
//               <SelectTrigger id="timezone-select" className="w-full">
//                 <SelectValue placeholder="Select your timezone" />
//               </SelectTrigger>
//               <SelectContent>
//                 <div className="mb-2 px-2">
//                   <Input
//                     placeholder="Search timezone..."
//                     value={timezoneSearch}
//                     onChange={(e) => setTimezoneSearch(e.target.value)}
//                     ref={searchInputRef}
//                     onFocus={() => searchInputRef.current?.select()}
//                   />
//                 </div>
//                 <ScrollArea className="h-[200px]">
//                   {filteredTimezones.map((tz) => (
//                     <SelectItem key={tz} value={tz}>
//                       {tz}
//                     </SelectItem>
//                   ))}
//                 </ScrollArea>
//               </SelectContent>
//             </Select>
//           </div>
//           <div className="space-y-6">
//             {daysOfWeek.map((day) => (
//               <div key={day} className="space-y-2">
//                 <div className="flex items-center space-x-4">
//                   <div className="w-24">
//                     <Label>{day === 0 && "Monday"}</Label>
//                     <Label>{day === 1 && "Tuesday"}</Label>
//                     <Label>{day === 2 && "Wednesday"}</Label>
//                     <Label>{day === 3 && "Thursday"}</Label>
//                     <Label>{day === 4 && "Friday"}</Label>
//                     <Label>{day === 5 && "Saturday"}</Label>
//                     <Label>{day === 6 && "Sunday"}</Label>
//                   </div>
//                   <Switch
//                     checked={weekSchedule[day].isAvailable}
//                     onCheckedChange={(checked) => handleAvailabilityChange(day, checked)}
//                   />
//                   {weekSchedule[day].isAvailable && (
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() => copyToWholeWeek(day)}
//                       title={`Copy ${day}'s schedule to whole week`}
//                     >
//                       <Copy className="h-4 w-4 mr-2" />
//                       Copy to Week
//                     </Button>
//                   )}
//                 </div>
//                 {weekSchedule[day].isAvailable && (
//                   <div className="ml-28 space-y-2">
//                     {weekSchedule[day].timeSlots.map((slot, index) => (
//                       <div key={index} className="flex items-center space-x-2">
//                         <Select
//                           value={slot.startTime}
//                           onValueChange={(value) => handleTimeChange(day, index, "startTime", value)}
//                         >
//                           <SelectTrigger className="w-[120px]">
//                             <SelectValue placeholder="Start time" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {timeOptions.map((time) => (
//                               <SelectItem key={time} value={time}>
//                                 {time}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                         <span>to</span>
//                         <Select
//                           value={slot.endTime}
//                           onValueChange={(value) => handleTimeChange(day, index, "endTime", value)}
//                         >
//                           <SelectTrigger className="w-[120px]">
//                             <SelectValue placeholder="End time" />
//                           </SelectTrigger>
//                           <SelectContent>
//                             {timeOptions.map((time) => (
//                               <SelectItem key={time} value={time}>
//                                 {time}
//                               </SelectItem>
//                             ))}
//                           </SelectContent>
//                         </Select>
//                         {index !== 0 && (
//                           <Button
//                             variant="outline"
//                             size="icon"
//                             onClick={() => removeTimeSlot(day, index)}
//                             title="Remove time slot"
//                           >
//                             <Trash2 className="h-4 w-4" />
//                           </Button>
//                         )}
//                       </div>
//                     ))}
//                     <Button variant="outline" size="sm" onClick={() => addTimeSlot(day)}>
//                       <Plus className="h-4 w-4 mr-2" />
//                       Add Time Slot
//                     </Button>
//                   </div>
//                 )}
//               </div>
//             ))}
//           </div>
//           <Button className="mt-6 w-full" onClick={handleSubmit} disabled={isError || isLoading}>
//             Save Availability
//           </Button>
//         </CardContent>
//       )}
//   </Card>
// );

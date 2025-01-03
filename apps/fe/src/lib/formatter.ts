export function formatEventDescription(durationInMinutes: number) {
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;
  const minutesString = `${minutes} ${minutes > 1 ? "mins" : "min"}`;
  const hoursString = `${hours} ${hours > 1 ? "hrs" : "hr"}`;
  if (hours === 0) return minutesString;
  if (minutes === 0) return hoursString;
  return `${hoursString} ${minutesString}`;
}

export function formatTimezoneOffset(timezone: string) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    timeZoneName: "shortOffset",
  })
    .formatToParts(new Date())
    .find((part) => part.type == "timeZoneName")?.value;
}

export function generateTimeOptions(): string[] {
  const options: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const time = new Date(2000, 0, 1, hour, minute);
      options.push(time.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: false }));
    }
  }
  console.log("options ", options);

  return options;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

export function formatDate(date: Date) {
  return dateFormatter.format(date);
}

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  timeStyle: "short",
});

export function formatTimeString(date: Date) {
  return timeFormatter.format(date);
}

const dateTimeFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function formatDateTime(date: Date) {
  return dateTimeFormatter.format(date);
}

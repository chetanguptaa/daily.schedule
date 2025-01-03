export function timeToInt(time: string) {
  return parseFloat(time.replace(":", "."));
}

export function pad(number: number) {
  if (number < 10) {
    return `0${number}`;
  }
  return String(number);
}
export function toTWUTCString(date: Date) {
  return (
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    date.getUTCFullYear() +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    (date.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5)
  );
}

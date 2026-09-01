import { formatInTimeZone, toZonedTime } from "date-fns-tz";

export const TIMEZONE = "America/Sao_Paulo";

export function todayInSaoPaulo(): string {
  return formatInTimeZone(new Date(), TIMEZONE, "yyyy-MM-dd");
}

export function formatDateTimeSaoPaulo(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, "dd/MM/yyyy HH:mm");
}

export function formatDateSaoPaulo(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, "dd/MM/yyyy");
}

export function parseDateInSaoPaulo(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return toZonedTime(new Date(year, month - 1, day, 12, 0, 0), TIMEZONE);
}

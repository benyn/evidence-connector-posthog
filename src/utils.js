import { tz } from "@date-fns/tz";
import { parseISO, toDate } from "date-fns";

export const toDateInTimezone = (dateStr, timezone) => {
  return toDate(parseISO(dateStr, { in: tz(timezone) }));
};

import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

/**
 * Computes weekly job volume chart data from Convex appointments.
 * Groups appointments by day of the week based on scheduledDateTime.
 * Returns an array like [{ name: 'Mon', jobs: 2 }, { name: 'Tue', jobs: 3 }, ...]
 */
export function useWeeklyJobVolume() {
  const appointments = useQuery(api.appointments.getAllAppointments);

  if (appointments === undefined) {
    // Still loading — return empty array
    return [];
  }

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };

  for (const appt of appointments) {
    const date = new Date(appt.scheduledDateTime);
    const day = dayNames[date.getDay()];
    counts[day]++;
  }

  // Return in Mon-Sun order to match typical work-week display
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
    name: day,
    jobs: counts[day],
  }));
}

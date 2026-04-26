const SCHEDULE_TIMES = ['08:00', '15:00'] as const;

const toLocalDateKey = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toLocalTimeKey = (date: Date): string => {
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const getScheduledSyncTimes = (): readonly string[] => SCHEDULE_TIMES;

export const shouldRunScheduledSync = (
  now: Date,
  lastRunAt: string | null,
  scheduleTimes: readonly string[] = SCHEDULE_TIMES
): boolean => {
  const today = toLocalDateKey(now);
  const currentTime = toLocalTimeKey(now);

  const dueTimes = scheduleTimes.filter((time) => time <= currentTime);
  if (dueTimes.length === 0) {
    return false;
  }

  if (!lastRunAt) {
    return true;
  }

  const lastRun = new Date(lastRunAt);
  if (Number.isNaN(lastRun.getTime())) {
    return true;
  }

  const lastRunDay = toLocalDateKey(lastRun);
  if (lastRunDay !== today) {
    return true;
  }

  const lastRunTime = toLocalTimeKey(lastRun);
  return dueTimes.some((time) => lastRunTime < time);
};

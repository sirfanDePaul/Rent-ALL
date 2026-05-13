import React, { useEffect, useState } from 'react';

function getTimeLeft(endDate) {
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const now = Date.now();
  const diff = end - now;
  if (diff <= 0) return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, overdue: true };
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { total: diff, days, hours, minutes, seconds, overdue: false };
}

export default function RentalTimer({ startDate, endDate }) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(endDate));

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft(endDate)), 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);
  const totalDuration = end - start;
  const ratio = totalDuration > 0 ? timeLeft.total / totalDuration : 0;

  let colorClass = 'timer-green';
  if (timeLeft.overdue) colorClass = 'timer-red';
  else if (ratio < 0.2) colorClass = 'timer-red';
  else if (ratio < 0.5) colorClass = 'timer-yellow';

  const barWidth = timeLeft.overdue ? 0 : Math.max(0, Math.min(100, ratio * 100));

  return (
    <div className={`rental-timer ${colorClass}`}>
      <div className="timer-label">
        {timeLeft.overdue
          ? '⚠ Overdue — please return immediately'
          : `⏱ ${timeLeft.days}d ${timeLeft.hours}h ${timeLeft.minutes}m ${timeLeft.seconds}s remaining`}
      </div>
      <div className="timer-bar-track">
        <div className="timer-bar-fill" style={{ width: `${barWidth}%` }} />
      </div>
    </div>
  );
}

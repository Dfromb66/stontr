import { differenceInDays, addYears, addMonths, addDays } from 'date-fns';

/**
 * Calculates the number of days remaining until a given date.
 * @param {string} dateString - The future date in ISO format (e.g., "2024-12-25").
 * @returns {number} The number of days remaining.
 */
const getDaysRemaining = (dateString) => {
  const now = new Date();
  const eventDate = new Date(dateString);
  return differenceInDays(eventDate, now);
};

/**
 * Calculates the urgency status and details for an event.
 * @param {string} nextOccurrence - The event's next occurrence date.
 * @returns {{status: string, daysRemaining: number}} An object containing the urgency status and days remaining.
 */
export const calculateUrgency = (nextOccurrence) => {
  const daysRemaining = getDaysRemaining(nextOccurrence);

  if (daysRemaining <= 0) {
    return { status: 'imminent', daysRemaining }; // Overdue is also imminent
  }
  if (daysRemaining <= 7) {
    return { status: 'imminent', daysRemaining };
  }
  if (daysRemaining <= 30) {
    return { status: 'approaching', daysRemaining };
  }
  return { status: 'far', daysRemaining };
};

/**
 * Calculates the progress bar percentage and display text for an event.
 * @param {object} event - The event object.
 * @returns {{progressPercent: number, timeRemainingText: string, progressClass: string}}
 */
export const calculateProgress = (event) => {
  const { status, daysRemaining } = calculateUrgency(event.nextOccurrence);
  
  let progressPercent = 0;
  let timeRemainingText = '';
  let progressClass = '';

  if (daysRemaining <= 0) {
    progressPercent = 100;
    timeRemainingText = `Overdue by ${Math.abs(daysRemaining)} day(s)`;
    progressClass = 'urgent';
  } else if (status === 'imminent') {
    // 7-day countdown
    progressPercent = ((7 - daysRemaining) / 7) * 100;
    timeRemainingText = `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;
    progressClass = 'urgent';
  } else if (status === 'approaching') {
    // 30-day countdown
    progressPercent = ((30 - daysRemaining) / 30) * 100;
    timeRemainingText = `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;
    progressClass = 'warning';
  } else {
    // Standard progress over the event's cycle
    const totalDuration = event.isRecurring 
      ? differenceInDays(
          addUnit(new Date(event.nextOccurrence), event.recurrenceUnit, event.recurrenceInterval),
          new Date(event.nextOccurrence)
        )
      : 365; // Default to 1 year for one-time events
      
    const startDate = addUnit(new Date(event.nextOccurrence), event.recurrenceUnit, -event.recurrenceInterval);
    const elapsed = differenceInDays(new Date(), startDate);

    progressPercent = (elapsed / totalDuration) * 100;

    if (daysRemaining >= 365) {
      const years = Math.floor(daysRemaining / 365);
      const months = Math.floor((daysRemaining % 365) / 30);
      timeRemainingText = `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` & ${months} month${months > 1 ? 's' : ''}` : ''} remaining`;
    } else if (daysRemaining >= 30) {
      const months = Math.floor(daysRemaining / 30);
      timeRemainingText = `${months} month${months > 1 ? 's' : ''} remaining`;
    } else {
      timeRemainingText = `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;
    }
  }

  return {
    progressPercent: Math.max(0, Math.min(100, progressPercent)),
    timeRemainingText,
    progressClass
  };
};

/**
 * Helper function to add a unit of time to a date.
 * @param {Date} date - The starting date.
 * @param {string} unit - The unit of time ('years', 'months', 'days').
 * @param {number} interval - The amount to add.
 * @returns {Date} The new date.
 */
function addUnit(date, unit, interval) {
  switch (unit) {
    case 'years':
      return addYears(date, interval);
    case 'months':
      return addMonths(date, interval);
    case 'days':
      return addDays(date, interval);
    default:
      return date;
  }
} 
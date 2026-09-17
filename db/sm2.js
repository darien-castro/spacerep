/**
 * Spaced Repetition (SuperMemo SM-2 Algorithm)
 * 
 * Mastery Levels:
 * - Level 1: Learning (interval <= 1 day)
 * - Level 2: Reviewing (interval 2 - 6 days)
 * - Level 3: Familiar (interval 7 - 21 days)
 * - Level 4: Mastered (interval 22 - 60 days)
 * - Level 5: Deep Memory (interval > 60 days)
 */

function calculateOrbitLevel(intervalDays) {
  if (intervalDays <= 1) return 1;
  if (intervalDays <= 6) return 2;
  if (intervalDays <= 21) return 3;
  if (intervalDays <= 60) return 4;
  return 5;
}

const ORBIT_NAMES = {
  1: { name: 'Learning', color: '#f87171', badge: 'Level 1' },
  2: { name: 'Reviewing', color: '#fbbf24', badge: 'Level 2' },
  3: { name: 'Familiar', color: '#34d399', badge: 'Level 3' },
  4: { name: 'Mastered', color: '#60a5fa', badge: 'Level 4' },
  5: { name: 'Deep Memory', color: '#a78bfa', badge: 'Level 5' }
};

/**
 * Format a Date object to YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculate preview intervals for each rating (1 to 4)
 */
function calculateIntervalPreview(card) {
  const interval = card.interval_days || 0;
  const reps = card.repetitions || 0;
  const ease = card.ease_factor || 2.5;

  const againInterval = 1;
  const hardInterval = Math.max(1, Math.round((interval || 1) * 1.2));

  let goodInterval = 1;
  if (reps === 0) {
    goodInterval = 1;
  } else if (reps === 1) {
    goodInterval = 3;
  } else {
    goodInterval = Math.max(1, Math.round(interval * ease));
  }

  let easyInterval = 2;
  if (reps === 0) {
    easyInterval = 2;
  } else if (reps === 1) {
    easyInterval = 5;
  } else {
    easyInterval = Math.max(1, Math.round(interval * ease * 1.3));
  }

  return {
    1: againInterval,
    2: hardInterval,
    3: goodInterval,
    4: easyInterval
  };
}

/**
 * Calculate review outcome based on rating (1-4)
 * @param {Object} card Current card state
 * @param {number} rating 1 = Again, 2 = Hard, 3 = Good, 4 = Easy
 */
function processReview(card, rating) {
  let {
    interval_days = 0,
    repetitions = 0,
    ease_factor = 2.5,
    lapses = 0
  } = card;

  let nextInterval = 1;
  let nextRepetitions = repetitions;
  let nextEaseFactor = ease_factor;
  let nextLapses = lapses;
  let xpEarned = 10;
  let message = '';

  switch (rating) {
    case 1: // Again
      nextRepetitions = 0;
      nextInterval = 1;
      nextEaseFactor = Math.max(1.3, ease_factor - 0.2);
      nextLapses += 1;
      xpEarned = 5;
      message = 'Review again tomorrow';
      break;

    case 2: // Hard
      nextRepetitions += 1;
      nextInterval = Math.max(1, Math.round((interval_days || 1) * 1.2));
      nextEaseFactor = Math.max(1.3, ease_factor - 0.15);
      xpEarned = 15;
      message = `Hard recall · next in ${nextInterval} day${nextInterval === 1 ? '' : 's'}`;
      break;

    case 3: // Good
      if (repetitions === 0) {
        nextInterval = 1;
      } else if (repetitions === 1) {
        nextInterval = 3;
      } else {
        nextInterval = Math.max(1, Math.round(interval_days * ease_factor));
      }
      nextRepetitions += 1;
      xpEarned = 30;
      message = `Good recall · next in ${nextInterval} day${nextInterval === 1 ? '' : 's'}`;
      break;

    case 4: // Easy
      if (repetitions === 0) {
        nextInterval = 2;
      } else if (repetitions === 1) {
        nextInterval = 5;
      } else {
        nextInterval = Math.max(1, Math.round(interval_days * ease_factor * 1.3));
      }
      nextRepetitions += 1;
      nextEaseFactor = Math.min(3.0, ease_factor + 0.15);
      xpEarned = 50;
      message = `Easy recall · next in ${nextInterval} day${nextInterval === 1 ? '' : 's'}`;
      break;

    default:
      throw new Error(`Invalid rating: ${rating}. Must be 1, 2, 3, or 4.`);
  }

  // Calculate next due date
  const nextDueDate = new Date();
  nextDueDate.setDate(nextDueDate.getDate() + nextInterval);

  const nextOrbitLevel = calculateOrbitLevel(nextInterval);

  return {
    interval_days: nextInterval,
    repetitions: nextRepetitions,
    ease_factor: Number(nextEaseFactor.toFixed(2)),
    orbit_level: nextOrbitLevel,
    lapses: nextLapses,
    due_date: formatDate(nextDueDate),
    last_reviewed_at: new Date().toISOString(),
    xpEarned,
    message,
    orbitInfo: ORBIT_NAMES[nextOrbitLevel]
  };
}

module.exports = {
  calculateOrbitLevel,
  ORBIT_NAMES,
  formatDate,
  calculateIntervalPreview,
  processReview
};

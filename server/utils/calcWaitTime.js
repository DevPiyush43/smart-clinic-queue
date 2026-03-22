/**
 * Calculate estimated wait time in minutes
 * @param {number} position - 1-based queue position
 * @param {number} avgTimePerPatient - clinic's average minutes per patient
 * @returns {number} estimated wait in minutes
 */
const calcWaitTime = (position, avgTimePerPatient = 5) => {
  if (position <= 0) return 0;
  return position * avgTimePerPatient;
};

/**
 * Check if clinic is currently within working hours
 * @param {object} clinic - Clinic document
 * @returns {boolean}
 */
const isWithinWorkingHours = (clinic) => {
  if (!clinic.isOpen) return false;

  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayName = dayNames[now.getDay()];

  // Check working day
  if (clinic.workingDays && clinic.workingDays.length > 0) {
    if (!clinic.workingDays.includes(todayName)) return false;
  }

  // Check working hours
  const { start, end } = clinic.workingHours || {};
  if (!start || !end) return true; // no restriction set

  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  return nowMinutes >= startMinutes && nowMinutes <= endMinutes;
};

/**
 * Get midnight of today (start of day)
 * @returns {Date}
 */
const getTodayMidnight = () => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

module.exports = { calcWaitTime, isWithinWorkingHours, getTodayMidnight };

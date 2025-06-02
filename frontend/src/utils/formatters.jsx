/**
 * Format timestamp to local time
 * @param {string} timestamp - ISO timestamp string
 * @returns {string} Formatted time string (HH:MM)
 */
export const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
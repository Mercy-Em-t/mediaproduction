/**
 * Format bytes to human-readable size
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted size string
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date to readable string
 * @param {string|Date} date - ISO date string or Date object
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get MIME type category
 * @param {string} mimeType - MIME type string
 * @returns {string} Category (image, video, audio, model, archive, other)
 */
export function getMimeTypeCategory(mimeType) {
  const topLevel = mimeType.split('/')[0];
  if (['image', 'video', 'audio', 'model'].includes(topLevel)) {
    return topLevel;
  }
  if (mimeType.includes('zip') || mimeType.includes('archive')) {
    return 'archive';
  }
  return 'other';
}

/**
 * Check if file has preview available
 * @param {string} mimeType - MIME type string
 * @returns {boolean} True if preview is available
 */
export function hasPreview(mimeType) {
  const previewTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'audio/mpeg',
    'audio/wav',
  ];
  return previewTypes.includes(mimeType);
}

/**
 * Check if time is expired or upcoming
 * @param {string} dateString - ISO date string
 * @returns {Object} { isExpired: boolean, hoursUntil: number }
 */
export function getTimeStatus(dateString) {
  if (!dateString) return { isExpired: false, hoursUntil: Infinity };
  
  const target = new Date(dateString);
  const now = new Date();
  const diff = target - now;
  const hoursUntil = diff / (1000 * 60 * 60);
  
  return {
    isExpired: diff < 0,
    hoursUntil: Math.round(hoursUntil),
  };
}

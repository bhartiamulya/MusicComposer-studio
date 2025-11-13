import axios from 'axios';

/**
 * Upload an audio file to the server
 * @param {File} file - Audio file to upload
 * @returns {Promise<Object>} Upload result with path and filename
 */
export const uploadAudio = async (file) => {
  const formData = new FormData();
  formData.append('audio', file);

  try {
    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(error.response?.data?.error || 'Failed to upload audio');
  }
};

/**
 * Export and merge multiple tracks
 * @param {Array} tracks - Array of track objects
 * @param {string} format - Export format ('mp3' or 'wav')
 * @returns {Promise<Object>} Export result with download URL
 */
export const exportTracks = async (tracks, format = 'mp3') => {
  try {
    // Prepare track data for merging
    const trackData = tracks
      .filter(track => !track.muted && track.audioUrl)
      .map(track => ({
        path: track.audioUrl,
        volume: track.volume,
        name: track.name
      }));

    if (trackData.length === 0) {
      throw new Error('No tracks to export');
    }

    const response = await axios.post('/api/merge', {
      tracks: trackData,
      format
    });

    return response.data;
  } catch (error) {
    console.error('Export error:', error);
    throw new Error(error.response?.data?.error || 'Failed to export tracks');
  }
};

/**
 * Convert audio blob to base64
 * @param {Blob} blob - Audio blob
 * @returns {Promise<string>} Base64 encoded audio
 */
export const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Download a file from URL
 * @param {string} url - File URL
 * @param {string} filename - Desired filename
 */
export const downloadFile = (url, filename) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Format duration in seconds to MM:SS
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted time string
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Get audio duration from file
 * @param {File} file - Audio file
 * @returns {Promise<number>} Duration in seconds
 */
export const getAudioDuration = (file) => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      resolve(audio.duration);
    };
    audio.onerror = reject;
    audio.src = URL.createObjectURL(file);
  });
};

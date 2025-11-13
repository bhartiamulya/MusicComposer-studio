/**
 * Project Save/Load Utilities
 * Allows users to save and load their music projects
 */

/**
 * Save project to JSON file
 */
export const saveProject = (projectName, tracks, bpm, masterVolume) => {
  const project = {
    version: '1.0.0',
    name: projectName,
    createdAt: new Date().toISOString(),
    settings: {
      bpm,
      masterVolume
    },
    tracks: tracks.map(track => ({
      id: track.id,
      name: track.name,
      type: track.type,
      instrument: track.instrument,
      volume: track.volume,
      muted: track.muted,
      solo: track.solo,
      bpm: track.bpm,
      audioUrl: track.audioUrl,
      useSynth: track.useSynth,
      effects: track.effects || {}
    }))
  };

  const jsonString = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${projectName.replace(/\s+/g, '-')}-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return true;
};

/**
 * Load project from JSON file
 */
export const loadProject = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const project = JSON.parse(e.target.result);
        
        // Validate project structure
        if (!project.version || !project.tracks) {
          throw new Error('Invalid project file format');
        }
        
        resolve(project);
      } catch (error) {
        reject(new Error('Failed to parse project file: ' + error.message));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read project file'));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Export project metadata for sharing
 */
export const exportProjectInfo = (projectName, tracks) => {
  const info = {
    name: projectName,
    trackCount: tracks.length,
    instruments: tracks.map(t => t.instrument || t.type).filter(Boolean),
    duration: 'Variable (looping)',
    exportedAt: new Date().toISOString()
  };

  return info;
};

/**
 * Generate project statistics
 */
export const getProjectStats = (tracks) => {
  const stats = {
    totalTracks: tracks.length,
    synthTracks: tracks.filter(t => t.useSynth).length,
    audioTracks: tracks.filter(t => !t.useSynth && t.audioUrl).length,
    mutedTracks: tracks.filter(t => t.muted).length,
    soloTracks: tracks.filter(t => t.solo).length,
    instruments: {}
  };

  // Count instruments
  tracks.forEach(track => {
    if (track.instrument) {
      stats.instruments[track.instrument] = (stats.instruments[track.instrument] || 0) + 1;
    }
  });

  return stats;
};

/**
 * Validate project before save
 */
export const validateProject = (projectName, tracks) => {
  const errors = [];

  if (!projectName || projectName.trim() === '') {
    errors.push('Project name is required');
  }

  if (tracks.length === 0) {
    errors.push('Project must have at least one track');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

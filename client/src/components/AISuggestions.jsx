import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Sparkles, Loader, Plus } from 'lucide-react';
import axios from 'axios';

const AISuggestions = ({ tracks, onClose, onAddTrack }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const trackInfo = tracks.map(t => ({
        name: t.name,
        type: t.type,
        instrument: t.instrument
      }));

      const response = await axios.post('/api/ai-suggest', {
        currentTracks: trackInfo,
        context: tracks.length === 0 
          ? 'User is starting a new composition' 
          : 'User wants to enhance their current composition'
      });

      setSuggestions(response.data.suggestions || []);
    } catch (err) {
      console.error('Failed to fetch suggestions:', err);
      setError(err.response?.data?.error || 'Failed to get AI suggestions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplySuggestion = (suggestion) => {
    // Map instrument name to our instrument library
    const instrumentMap = {
      'bass': 'bass',
      'drums': 'drums',
      'drum': 'drums',
      'piano': 'piano',
      'violin': 'violin',
      'saxophone': 'saxophone',
      'synth': 'synth',
      'guitar': 'guitar',
      'flute': 'flute'
    };

    const instrumentKey = Object.keys(instrumentMap).find(key => 
      suggestion.instrument.toLowerCase().includes(key)
    );

    const instrumentId = instrumentKey ? instrumentMap[instrumentKey] : 'synth';

    onAddTrack({
      name: `${suggestion.instrument} (AI)`,
      type: 'instrument',
      instrument: instrumentId,
      audioUrl: `/samples/${instrumentId}.mp3`
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-6 mb-6 border border-purple-500/30"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <h3 className="text-lg font-semibold">AI Composition Assistant</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader className="w-8 h-8 animate-spin text-purple-400" />
          <span className="ml-3 text-gray-300">Analyzing your composition...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4 mb-4">
          <p className="text-red-300">{error}</p>
          <button
            onClick={fetchSuggestions}
            className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
          >
            Try again
          </button>
        </div>
      )}

      {!isLoading && !error && suggestions.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>No suggestions available. Make sure Gemini API is configured.</p>
        </div>
      )}

      {!isLoading && !error && suggestions.length > 0 && (
        <div className="space-y-4">
          {suggestions.map((suggestion, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-purple-500/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-purple-300 mb-2">
                    {suggestion.instrument}
                  </h4>
                  <p className="text-sm text-gray-300 mb-2">
                    {suggestion.reason}
                  </p>
                  {suggestion.style && (
                    <p className="text-xs text-gray-400 italic">
                      Style: {suggestion.style}
                    </p>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleApplySuggestion(suggestion)}
                  className="ml-4 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </motion.button>
              </div>
            </motion.div>
          ))}

          <button
            onClick={fetchSuggestions}
            className="w-full bg-white/5 hover:bg-white/10 text-gray-300 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            Get More Suggestions
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default AISuggestions;

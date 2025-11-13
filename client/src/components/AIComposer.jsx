import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Wand2, Music, X, Loader } from 'lucide-react';
import axios from 'axios';

const AIComposer = ({ onAddTrack, onClose }) => {
  const [generating, setGenerating] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('pop');
  const [mood, setMood] = useState('happy');
  const [tempo, setTempo] = useState('medium');

  const genres = ['pop', 'rock', 'jazz', 'electronic', 'classical', 'hip-hop', 'ambient'];
  const moods = ['happy', 'sad', 'energetic', 'calm', 'dark', 'uplifting'];
  const tempos = ['slow', 'medium', 'fast'];

  const generateMusic = async () => {
    setGenerating(true);
    try {
      const response = await axios.post('http://localhost:3001/api/ai-compose', {
        prompt,
        genre,
        mood,
        tempo
      });

      const { tracks } = response.data;
      
      tracks.forEach(track => {
        onAddTrack({
          name: track.name,
          type: 'instrument',
          instrument: track.instrument,
          audioUrl: null,
          useSynth: true,
          aiGenerated: true,
          pattern: track.pattern
        });
      });

      alert('✨ AI composition generated successfully!');
      onClose();
    } catch (error) {
      console.error('AI composition error:', error);
      alert('Failed to generate composition. Using fallback...');
      
      generateFallbackComposition();
    } finally {
      setGenerating(false);
    }
  };

  const generateFallbackComposition = () => {
    const instruments = getInstrumentsForGenre(genre);
    
    instruments.forEach(instrument => {
      onAddTrack({
        name: `AI ${instrument}`,
        type: 'instrument',
        instrument: instrument.toLowerCase(),
        audioUrl: null,
        useSynth: true,
        aiGenerated: true
      });
    });
    
    onClose();
  };

  const getInstrumentsForGenre = (genre) => {
    const genreMap = {
      'pop': ['Piano', 'Bass', 'Drums', 'Synth'],
      'rock': ['Guitar', 'Bass', 'Drums'],
      'jazz': ['Piano', 'Bass', 'Drums', 'Saxophone'],
      'electronic': ['Synth', 'Bass', 'Drums'],
      'classical': ['Piano', 'Violin', 'Flute'],
      'hip-hop': ['Drums', 'Bass', 'Synth'],
      'ambient': ['Synth', 'Piano', 'Flute']
    };
    return genreMap[genre] || ['Piano', 'Bass', 'Drums'];
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-dark-light rounded-xl p-6 max-w-2xl w-full border border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Wand2 className="w-6 h-6 text-purple-500" />
            <h2 className="text-2xl font-bold">AI Music Composer</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Prompt Input */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">
            Describe your music (optional)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., 'A relaxing piano melody with soft strings for a rainy day'"
            className="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white placeholder-gray-500 focus:border-primary focus:outline-none resize-none"
            rows="3"
          />
        </div>

        {/* Genre Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">Genre</label>
          <div className="grid grid-cols-4 gap-2">
            {genres.map((g) => (
              <button
                key={g}
                onClick={() => setGenre(g)}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  genre === g
                    ? 'bg-primary text-white'
                    : 'bg-dark border border-gray-700 text-gray-400 hover:border-primary'
                }`}
              >
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Mood Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">Mood</label>
          <div className="grid grid-cols-3 gap-2">
            {moods.map((m) => (
              <button
                key={m}
                onClick={() => setMood(m)}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  mood === m
                    ? 'bg-purple-600 text-white'
                    : 'bg-dark border border-gray-700 text-gray-400 hover:border-purple-600'
                }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tempo Selection */}
        <div className="mb-6">
          <label className="block text-sm font-semibold mb-2">Tempo</label>
          <div className="grid grid-cols-3 gap-2">
            {tempos.map((t) => (
              <button
                key={t}
                onClick={() => setTempo(t)}
                className={`py-2 px-4 rounded-lg font-medium transition-all ${
                  tempo === t
                    ? 'bg-blue-600 text-white'
                    : 'bg-dark border border-gray-700 text-gray-400 hover:border-blue-600'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Generate Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={generateMusic}
          disabled={generating}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-600 disabled:to-gray-600 text-white py-4 rounded-lg font-bold text-lg flex items-center justify-center gap-3 transition-all"
        >
          {generating ? (
            <>
              <Loader className="w-6 h-6 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Music className="w-6 h-6" />
              Generate Composition
            </>
          )}
        </motion.button>

        <p className="text-xs text-gray-500 text-center mt-4">
          AI will create a complete multi-track composition based on your preferences
        </p>
      </motion.div>
    </motion.div>
  );
};

export default AIComposer;

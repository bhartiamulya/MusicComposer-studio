import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Download, Plus, Sparkles, Music, Mic, Upload, Save, FolderOpen, Wand2, Piano } from 'lucide-react';
import Track from './components/Track';
import AddTrackModal from './components/AddTrackModal';
import Visualizer from './components/Visualizer';
import AISuggestions from './components/AISuggestions';
import EffectsPanel from './components/EffectsPanel';
import AIComposer from './components/AIComposer';
import MIDIKeyboard from './components/MIDIKeyboard';
import { exportTracks } from './utils/audioUtils';
import { saveProject, loadProject } from './utils/projectUtils';

function App() {
  const [tracks, setTracks] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [projectName, setProjectName] = useState('Music Composer');
  const [isExporting, setIsExporting] = useState(false);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [bpm, setBpm] = useState(120);
  const [showMetronome, setShowMetronome] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [selectedTrackForEffects, setSelectedTrackForEffects] = useState(null);
  const [showAIComposer, setShowAIComposer] = useState(false);
  const [showMIDIKeyboard, setShowMIDIKeyboard] = useState(false);
  
  const masterVolumeRef = useRef(new Tone.Volume(-3).toDestination());
  const metronomeRef = useRef(null);
  const recorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  useEffect(() => {
    
    Tone.Transport.bpm.value = bpm;
    
  
    metronomeRef.current = new Tone.MetalSynth({
      frequency: 800,
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      volume: -20
    }).toDestination();
    
    const metronomeLoop = new Tone.Loop((time) => {
      if (showMetronome) {
        metronomeRef.current.triggerAttackRelease('16n', time);
      }
    }, '4n');
    
    metronomeLoop.start(0);
    
    return () => {
      
      Tone.Transport.stop();
      Tone.Transport.cancel();
    };
  }, []);

  useEffect(() => {
    
    masterVolumeRef.current.volume.value = Tone.gainToDb(masterVolume);
  }, [masterVolume]);

  useEffect(() => {
  
    Tone.Transport.bpm.value = bpm;
  }, [bpm]);

  const handlePlayPause = async () => {
    console.log('Play/Pause clicked!');
    try {
      if (!isPlaying) {
        await Tone.start();
        Tone.Transport.start();
        setIsPlaying(true);
      } else {
        Tone.Transport.pause();
        setIsPlaying(false);
      }
    } catch (error) {
      console.error('Play/Pause error:', error);
      alert('Error during playback. Please check the console for details.');
    }
  };

  const handleStop = () => {
    Tone.Transport.stop();
    setIsPlaying(false);
  };

  const addTrack = (trackData) => {
    console.log('Adding track:', trackData);
    const newTrack = {
      id: Date.now().toString(),
      name: trackData.name || `Track ${tracks.length + 1}`,
      type: trackData.type, 
      volume: 1.0,
      muted: false,
      solo: false,
      bpm: bpm, 
      playbackRate: 1.0, 
      audioUrl: trackData.audioUrl,
      instrument: trackData.instrument,
      player: null,
      ...trackData
    };
    setTracks([...tracks, newTrack]);
  };

  const updateTrack = (id, updates) => {
    setTracks(tracks.map(track => 
      track.id === id ? { ...track, ...updates } : track
    ));
  };

  const deleteTrack = (id) => {
    const track = tracks.find(t => t.id === id);
    if (track?.player) {
      
      if (track.useSynth && track.player.synth) {
        if (track.player.pattern) {
          track.player.pattern.stop();
          track.player.pattern.dispose();
        }
        track.player.synth.dispose();
      } else if (track.player.dispose) {
       
        track.player.dispose();
      }
    }
    setTracks(tracks.filter(track => track.id !== id));
  };

  const handleStartRecording = async () => {
    if (tracks.length === 0) {
      alert('⚠️ No tracks to record!\n\nAdd some instruments first.');
      return;
    }

    try {
      
      const dest = Tone.context.createMediaStreamDestination();
      Tone.Destination.connect(dest);

      
      const recorder = new MediaRecorder(dest.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        
       
        const link = document.createElement('a');
        link.href = url;
        link.download = `${projectName.replace(/\s+/g, '-')}-${Date.now()}.webm`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        alert('✅ Recording saved!\n\nYour composition has been downloaded.');
      };

      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);

    
      if (!isPlaying) {
        await Tone.start();
        Tone.Transport.start();
        setIsPlaying(true);
      }

      alert('🔴 Recording started!\n\nClick "Stop Recording" when done.');
    } catch (error) {
      console.error('Recording error:', error);
      alert('❌ Failed to start recording: ' + error.message);
    }
  };

  const handleStopRecording = () => {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop();
      setIsRecording(false);
      
      
      Tone.Transport.stop();
      setIsPlaying(false);
    }
  };

  const handleSaveProject = () => {
    try {
      saveProject(projectName, tracks, bpm, masterVolume);
      alert('✅ Project saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      alert('❌ Failed to save project: ' + error.message);
    }
  };

  const handleLoadProject = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const project = await loadProject(file);
      
      
      setProjectName(project.name);
      setBpm(project.settings.bpm);
      setMasterVolume(project.settings.masterVolume);
      setTracks(project.tracks);
      
      alert('✅ Project loaded successfully!');
    } catch (error) {
      console.error('Load error:', error);
      alert('❌ Failed to load project: ' + error.message);
    }
  };

  const handleExport = async () => {
    if (tracks.length === 0) {
      alert('No tracks to export!');
      return;
    }

   
    const audioTracks = tracks.filter(t => !t.useSynth && t.audioUrl && !t.muted);
    
    if (audioTracks.length === 0) {
      alert('⚠️ No uploaded audio tracks to merge.\n\nTo export synthesized instruments:\n1. Click "Record Output" button\n2. Play your composition\n3. Click "Stop Recording"\n4. File will download automatically');
      return;
    }

    setIsExporting(true);
    try {
      const result = await exportTracks(tracks);
      
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      alert(`✅ Export successful!\n\nExported ${audioTracks.length} audio track(s).\n\nDownload started.`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('❌ Export failed: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark text-white relative">
      {/* Top Bar */}
      <header className="bg-dark-light border-b border-gray-800 px-6 py-4 sticky top-0 z-40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Music className="w-8 h-8 text-primary" />
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent text-2xl font-bold outline-none border-b-2 border-transparent hover:border-primary focus:border-primary transition-colors"
              placeholder="Project Name"
            />
          </div>
          
          <div className="flex items-center gap-4">
            {/* BPM Control */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">BPM</span>
              <input
                type="number"
                min="60"
                max="200"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value) || 120)}
                className="w-16 bg-dark-lighter border border-gray-700 rounded px-2 py-1 text-center"
              />
            </div>

            {/* Metronome Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMetronome(!showMetronome)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                showMetronome 
                  ? 'bg-primary text-white' 
                  : 'bg-dark-lighter text-gray-400 hover:bg-gray-700'
              }`}
              title="Toggle Metronome"
            >
              Metronome
            </motion.button>

            {/* Master Volume */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Master</span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={masterVolume}
                onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                className="w-24"
              />
            </div>

            {/* Play/Pause Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handlePlayPause}
              className="bg-primary hover:bg-green-600 text-white rounded-full p-4 btn-hover"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
            </motion.button>

            {/* Record Output Button */}
            {!isRecording ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStartRecording}
                disabled={tracks.length === 0}
                className="bg-green-500/20 backdrop-blur-md hover:bg-green-500/30 disabled:bg-gray-800/20 disabled:cursor-not-allowed text-green-400 border border-green-500/50 px-6 py-3 rounded-lg flex items-center gap-2 btn-hover font-semibold"
                title="Record your composition to download"
              >
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                Record Output
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStopRecording}
                className="bg-green-500/20 backdrop-blur-md hover:bg-green-500/30 text-green-400 border border-green-500/50 px-6 py-3 rounded-lg flex items-center gap-2 btn-hover animate-pulse font-semibold"
              >
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                Stop Recording
              </motion.button>
            )}

            {/* AI Composer */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAIComposer(true)}
              className="bg-green-500/20 backdrop-blur-md hover:bg-green-500/30 text-green-400 border border-green-500/50 px-6 py-3 rounded-lg flex items-center gap-2 btn-hover font-semibold"
            >
              <Wand2 className="w-5 h-5" />
              AI Compose
            </motion.button>

            {/* MIDI Keyboard */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMIDIKeyboard(true)}
              className="bg-green-500/20 backdrop-blur-md hover:bg-green-500/30 text-green-400 border border-green-500/50 px-6 py-3 rounded-lg flex items-center gap-2 btn-hover font-semibold"
            >
              <Piano className="w-5 h-5" />
              Piano
            </motion.button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        {/* Visualizer */}
        <Visualizer isPlaying={isPlaying} tracks={tracks} />

        {/* AI Suggestions Panel */}
        <AnimatePresence>
          {showAISuggestions && (
            <AISuggestions 
              tracks={tracks} 
              onClose={() => setShowAISuggestions(false)}
              onAddTrack={addTrack}
            />
          )}
        </AnimatePresence>

        {/* Instrument Library - Always Visible */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Instrument Library</h2>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3 mb-8">
            {[
              { id: 'drums', name: 'Drums' },
              { id: 'piano', name: 'Piano' },
              { id: 'bass', name: 'Bass' },
              { id: 'violin', name: 'Violin' },
              { id: 'saxophone', name: 'Sax' },
              { id: 'synth', name: 'Synth' },
              { id: 'guitar', name: 'Guitar' },
              { id: 'flute', name: 'Flute' },
            ].map((instrument) => (
              <motion.button
                key={instrument.id}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  console.log('Instrument clicked:', instrument.name);
                  addTrack({
                    name: instrument.name,
                    type: 'instrument',
                    instrument: instrument.id,
                    audioUrl: null, // Will use Tone.js synth instead
                    useSynth: true
                  });
                }}
                className="bg-green-500/10 backdrop-blur-md hover:bg-green-500/20 p-4 rounded-lg text-center transition-all border-2 border-green-500/30 hover:border-green-500 cursor-pointer"
              >
                <Music className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <div className="text-sm font-semibold text-green-400">{instrument.name}</div>
              </motion.button>
            ))}
          </div>

          {/* Additional Options */}
          <div className="flex gap-3 mb-8">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="flex-1 bg-green-500/20 backdrop-blur-md hover:bg-green-500/30 text-green-400 border-2 border-green-500/50 px-6 py-4 rounded-lg flex items-center justify-center gap-2 font-semibold cursor-pointer"
            >
              <Upload className="w-5 h-5" />
              Upload Audio
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal(true)}
              className="flex-1 bg-green-500/20 backdrop-blur-md hover:bg-green-500/30 text-green-400 border-2 border-green-500/50 px-6 py-4 rounded-lg flex items-center justify-center gap-2 font-semibold cursor-pointer"
            >
              <Mic className="w-5 h-5" />
              Record Audio
            </motion.button>
          </div>
        </div>

        {/* Tracks Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Your Tracks ({tracks.length})</h2>
          </div>

          {/* Track List */}
          <div className="space-y-4">
            <AnimatePresence>
              {tracks.map((track) => (
                <Track
                  key={track.id}
                  track={track}
                  isPlaying={isPlaying}
                  onUpdate={updateTrack}
                  onDelete={deleteTrack}
                  onOpenEffects={() => setSelectedTrackForEffects(track)}
                  masterVolume={masterVolumeRef.current}
                />
              ))}
            </AnimatePresence>

            {tracks.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 text-gray-500 bg-dark-lighter rounded-lg border-2 border-dashed border-gray-700"
              >
                <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg mb-1">No tracks yet</p>
                <p className="text-sm">Click an instrument above to start composing</p>
              </motion.div>
            )}
          </div>
        </div>
      </main>

      {/* Add Track Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddTrackModal
            onClose={() => setShowAddModal(false)}
            onAddTrack={addTrack}
          />
        )}
      </AnimatePresence>

      {/* Effects Panel */}
      <AnimatePresence>
        {selectedTrackForEffects && (
          <EffectsPanel
            track={selectedTrackForEffects}
            onUpdate={updateTrack}
            onClose={() => setSelectedTrackForEffects(null)}
          />
        )}
      </AnimatePresence>

      {/* AI Suggestions Panel */}
      <AnimatePresence>
        {showAISuggestions && (
          <AISuggestions
            tracks={tracks}
            onAddTrack={addTrack}
            onClose={() => setShowAISuggestions(false)}
          />
        )}
      </AnimatePresence>

      {/* AI Composer Modal */}
      <AnimatePresence>
        {showAIComposer && (
          <AIComposer
            onAddTrack={addTrack}
            onClose={() => setShowAIComposer(false)}
          />
        )}
      </AnimatePresence>

      {/* MIDI Keyboard Modal */}
      <AnimatePresence>
        {showMIDIKeyboard && (
          <MIDIKeyboard
            onClose={() => setShowMIDIKeyboard(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

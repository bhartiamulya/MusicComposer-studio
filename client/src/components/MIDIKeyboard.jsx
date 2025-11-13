import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import * as Tone from 'tone';
import { Piano, X } from 'lucide-react';

const MIDIKeyboard = ({ onClose }) => {
  const [activeNotes, setActiveNotes] = useState(new Set());
  const [midiAccess, setMidiAccess] = useState(null);
  const [synth, setSynth] = useState(null);
  const [recording, setRecording] = useState(false);
  const [recordedNotes, setRecordedNotes] = useState([]);

  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blackKeys = ['C#', 'D#', null, 'F#', 'G#', 'A#', null];
  const octaves = [3, 4, 5];

  useEffect(() => {
    const newSynth = new Tone.PolySynth(Tone.Synth).toDestination();
    setSynth(newSynth);
    if (navigator.requestMIDIAccess) {
      navigator.requestMIDIAccess()
        .then((access) => {
          setMidiAccess(access);
          setupMIDIInputs(access, newSynth);
        })
        .catch((err) => {
          console.log('MIDI access denied:', err);
        });
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      if (newSynth) newSynth.dispose();
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const setupMIDIInputs = (access, synth) => {
    const inputs = access.inputs.values();
    for (let input of inputs) {
      input.onmidimessage = (message) => {
        const [command, note, velocity] = message.data;
        const noteName = Tone.Frequency(note, 'midi').toNote();

        if (command === 144 && velocity > 0) {
        
          playNote(noteName, synth);
        } else if (command === 128 || (command === 144 && velocity === 0)) {
        
          stopNote(noteName, synth);
        }
      };
    }
  };

  const keyToNote = {
    'a': 'C4', 'w': 'C#4', 's': 'D4', 'e': 'D#4', 'd': 'E4',
    'f': 'F4', 't': 'F#4', 'g': 'G4', 'y': 'G#4', 'h': 'A4',
    'u': 'A#4', 'j': 'B4', 'k': 'C5'
  };

  const handleKeyDown = (e) => {
    if (e.repeat) return;
    const note = keyToNote[e.key.toLowerCase()];
    if (note && synth) {
      playNote(note, synth);
    }
  };

  const handleKeyUp = (e) => {
    const note = keyToNote[e.key.toLowerCase()];
    if (note && synth) {
      stopNote(note, synth);
    }
  };

  const playNote = (note, synthToUse = synth) => {
    if (!synthToUse) return;
    synthToUse.triggerAttack(note);
    setActiveNotes(prev => new Set(prev).add(note));

    if (recording) {
      setRecordedNotes(prev => [...prev, { note, time: Tone.now(), type: 'start' }]);
    }
  };

  const stopNote = (note, synthToUse = synth) => {
    if (!synthToUse) return;
    synthToUse.triggerRelease(note);
    setActiveNotes(prev => {
      const newSet = new Set(prev);
      newSet.delete(note);
      return newSet;
    });

    if (recording) {
      setRecordedNotes(prev => [...prev, { note, time: Tone.now(), type: 'stop' }]);
    }
  };

  const handleMouseDown = (note) => {
    playNote(note);
  };

  const handleMouseUp = (note) => {
    stopNote(note);
  };

  const toggleRecording = () => {
    if (recording) {
      console.log('Recorded notes:', recordedNotes);
      alert(`Recorded ${recordedNotes.length} events!`);
    }
    setRecording(!recording);
    setRecordedNotes([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        className="bg-dark-light rounded-xl p-6 max-w-6xl w-full border border-gray-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Piano className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold">Virtual Piano</h2>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={toggleRecording}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                recording
                  ? 'bg-red-600 hover:bg-red-700 animate-pulse'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {recording ? '⏹ Stop Recording' : '⏺ Record'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* MIDI Status */}
        {midiAccess && (
          <div className="mb-4 text-sm text-green-500">
            ✓ MIDI device connected
          </div>
        )}

        {/* Piano Keyboard */}
        <div className="bg-dark rounded-lg p-6 overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {octaves.map((octave) => (
              <div key={octave} className="flex relative">
                {/* White keys */}
                {whiteKeys.map((key, index) => {
                  const note = `${key}${octave}`;
                  const isActive = activeNotes.has(note);
                  return (
                    <div
                      key={note}
                      onMouseDown={() => handleMouseDown(note)}
                      onMouseUp={() => handleMouseUp(note)}
                      onMouseLeave={() => activeNotes.has(note) && handleMouseUp(note)}
                      className={`w-16 h-64 border-2 border-gray-800 rounded-b-lg cursor-pointer transition-all select-none ${
                        isActive
                          ? 'bg-primary scale-95'
                          : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-xs text-gray-600 font-semibold">
                        {key}{octave}
                      </div>
                    </div>
                  );
                })}

                {/* Black keys */}
                <div className="absolute top-0 left-0 w-full h-40 flex pointer-events-none">
                  {blackKeys.map((key, index) => {
                    if (!key) return <div key={index} className="w-16" />;
                    const note = `${key}${octave}`;
                    const isActive = activeNotes.has(note);
                    return (
                      <div
                        key={note}
                        onMouseDown={() => handleMouseDown(note)}
                        onMouseUp={() => handleMouseUp(note)}
                        onMouseLeave={() => activeNotes.has(note) && handleMouseUp(note)}
                        className={`w-10 h-40 -ml-5 rounded-b-lg cursor-pointer transition-all pointer-events-auto z-10 ${
                          isActive
                            ? 'bg-purple-600 scale-95'
                            : 'bg-gray-900 hover:bg-gray-800'
                        } border-2 border-black`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 text-sm text-gray-400 space-y-2">
          <p><strong>Keyboard Controls:</strong> A, W, S, E, D, F, T, G, Y, H, U, J, K</p>
          <p><strong>MIDI:</strong> Connect a MIDI keyboard for full control</p>
          <p><strong>Recording:</strong> Click Record to capture your performance</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MIDIKeyboard;

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import * as Tone from 'tone';
import WaveSurfer from 'wavesurfer.js';
import { Volume2, VolumeX, Trash2, Radio, Sliders, Music } from 'lucide-react';

const Track = ({ track, isPlaying, onUpdate, onDelete, onOpenEffects, masterVolume }) => {
  const waveformRef = useRef(null);
  const wavesurferRef = useRef(null);
  const playerRef = useRef(null);
  const volumeNodeRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (track.useSynth) {
      setIsLoaded(true);
      initializeSynthPlayer();
      return;
    }
    if (waveformRef.current && track.audioUrl) {
      try {
        wavesurferRef.current = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: track.muted ? '#1a1a1a' : '#333',
          progressColor: track.muted ? '#0a0a0a' : '#00FF00',
          cursorColor: '#00FF00',
          height: 80,
          barWidth: 2,
          barGap: 1,
          responsive: true,
          normalize: true,
          backend: 'WebAudio'
        });

        const audioUrl = track.audioUrl.startsWith('http') 
          ? track.audioUrl 
          : `http://localhost:3001${track.audioUrl}`;

        wavesurferRef.current.load(audioUrl);

        wavesurferRef.current.on('ready', () => {
          console.log('Wavesurfer ready for:', track.name);
          setIsLoaded(true);
          initializeTonePlayer();
        });

        wavesurferRef.current.on('error', (error) => {
          console.error('Wavesurfer error:', error);
          
          setIsLoaded(true);
          initializeTonePlayer();
        });
      } catch (error) {
        console.error('Wavesurfer initialization error:', error);
        setIsLoaded(true);
        initializeTonePlayer();
      }
    }

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
      }
      if (playerRef.current) {
       
        if (track.useSynth && playerRef.current.synth) {
          if (playerRef.current.pattern) {
            playerRef.current.pattern.stop();
            playerRef.current.pattern.dispose();
          }
          playerRef.current.synth.dispose();
        } else if (playerRef.current.dispose) {
          
          playerRef.current.dispose();
        }
      }
      if (volumeNodeRef.current) {
        volumeNodeRef.current.dispose();
      }
    };
  }, [track.audioUrl]);

  const initializeSynthPlayer = () => {
    if (playerRef.current) {
      
      if (playerRef.current.synth) {
        if (playerRef.current.pattern) {
          playerRef.current.pattern.stop();
          playerRef.current.pattern.dispose();
        }
        playerRef.current.synth.dispose();
      } else if (playerRef.current.dispose) {
        playerRef.current.dispose();
      }
    }
    let synth;
    const instrumentMap = {
      'piano': () => new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.5, release: 2 },
        volume: -8
      }).chain(
        new Tone.Reverb({ decay: 1.5, wet: 0.3 }),
        new Tone.Volume(-3)
      ),
      'drums': () => new Tone.MembraneSynth({
        pitchDecay: 0.05,
        octaves: 10,
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.4, sustain: 0.01, release: 1.4 },
        volume: -5
      }),
      'bass': () => new Tone.MonoSynth({
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.01, decay: 0.3, sustain: 0.7, release: 1.2 },
        filter: { Q: 6, type: 'lowpass', rolloff: -24 },
        filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.5, release: 1.5, baseFrequency: 200, octaves: 2.6 },
        volume: -10
      }),
      'violin': () => new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'sawtooth' },
        envelope: { attack: 0.3, decay: 0.1, sustain: 0.8, release: 0.5 },
        volume: -12
      }).chain(
        new Tone.Vibrato(5, 0.1),
        new Tone.Reverb({ decay: 2, wet: 0.4 })
      ),
      'saxophone': () => new Tone.MonoSynth({
        oscillator: { type: 'square' },
        envelope: { attack: 0.1, decay: 0.2, sustain: 0.6, release: 0.8 },
        filter: { Q: 2, type: 'bandpass' },
        filterEnvelope: { attack: 0.1, decay: 0.2, sustain: 0.5, release: 0.8, baseFrequency: 800, octaves: 1.5 },
        volume: -8
      }),
      'guitar': () => new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.01, decay: 0.5, sustain: 0.2, release: 2 },
        volume: -10
      }).chain(
        new Tone.Chorus(4, 2.5, 0.5),
        new Tone.Reverb({ decay: 1, wet: 0.2 })
      ),
      'synth': () => new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'square' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0.4, release: 1 },
        volume: -8
      }).chain(
        new Tone.Phaser({ frequency: 0.5, octaves: 3, baseFrequency: 350 }),
        new Tone.Reverb({ decay: 1.5, wet: 0.3 })
      ),
      'flute': () => new Tone.MonoSynth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.05, decay: 0.1, sustain: 0.8, release: 0.5 },
        filter: { Q: 6, type: 'lowpass', rolloff: -12 },
        filterEnvelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.5, baseFrequency: 2000, octaves: 1 },
        volume: -10
      }),
      'default': () => new Tone.Synth()
    };

    synth = (instrumentMap[track.instrument] || instrumentMap['default'])();

   
    const volumeNode = new Tone.Volume(Tone.gainToDb(track.volume));
    const reverbNode = new Tone.Reverb({ decay: 2, wet: 0 });
    const delayNode = new Tone.FeedbackDelay({ delayTime: 0.25, feedback: 0.3, wet: 0 });
    const distortionNode = new Tone.Distortion({ distortion: 0, wet: 0 });
    const chorusNode = new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.7, wet: 0 });
    const eqNode = new Tone.EQ3({ low: 0, mid: 0, high: 0 });
    const compressorNode = new Tone.Compressor({ threshold: -24, ratio: 4 });
    
  
    synth.chain(
      reverbNode,
      delayNode,
      distortionNode,
      chorusNode,
      eqNode,
      compressorNode,
      volumeNode,
      masterVolume
    );

    
    let notes, interval, duration, patternType;
    
    switch(track.instrument) {
      case 'piano':
      
        notes = [
          ['C4', 'E4', 'G4'], ['E4', 'G4', 'C5'], ['G4', 'C5', 'E5'], ['C5', 'E5', 'G5'],
          ['A3', 'C4', 'E4'], ['C4', 'E4', 'A4'], ['E4', 'A4', 'C5'], ['A4', 'C5', 'E5'],
          ['F3', 'A3', 'C4'], ['A3', 'C4', 'F4'], ['C4', 'F4', 'A4'], ['F4', 'A4', 'C5'],
          ['G3', 'B3', 'D4'], ['B3', 'D4', 'G4'], ['D4', 'G4', 'B4'], ['G4', 'B4', 'D5']
        ];
        interval = '8n';
        duration = '8n';
        patternType = 'up';
        break;
      case 'drums':
       
        notes = ['C2', 'C3', 'C2', 'C3', 'C2', 'C2', 'C3', 'C2']; 
        interval = '8n';
        duration = '16n';
        patternType = 'up';
        break;
      case 'bass':
        
        notes = ['C2', 'E2', 'G2', 'C3', 'A1', 'C2', 'E2', 'A2', 'F1', 'A1', 'C2', 'F2', 'G1', 'B1', 'D2', 'G2'];
        interval = '4n';
        duration = '4n';
        patternType = 'up';
        break;
      case 'violin':
       
        notes = ['E5', 'E5', 'F5', 'G5', 'G5', 'F5', 'E5', 'D5', 'C5', 'C5', 'D5', 'E5', 'E5', 'D5', 'D5'];
        interval = '4n';
        duration = '4n';
        patternType = 'up';
        break;
      case 'saxophone':
       
        notes = ['D4', 'F4', 'A4', 'C5', 'Bb4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4', 'D4'];
        interval = '4n';
        duration = '4n';
        patternType = 'up';
        break;
      case 'guitar':
        
        notes = [
          ['E3', 'B3', 'E4'], ['A2', 'E3', 'A3'], ['D3', 'A3', 'D4'], ['G2', 'D3', 'G3']
        ];
        interval = '2n';
        duration = '8n';
        patternType = 'up';
        break;
      case 'synth':
       
        notes = ['C4', 'E4', 'G4', 'B4', 'C5', 'B4', 'G4', 'E4', 'D4', 'F4', 'A4', 'C5', 'D5', 'C5', 'A4', 'F4'];
        interval = '16n';
        duration = '16n';
        patternType = 'up';
        break;
      case 'flute':
       
        notes = ['C5', 'D5', 'E5', 'F5', 'E5', 'D5', 'C5', 'B4', 'A4', 'G4', 'A4', 'B4', 'C5'];
        interval = '4n';
        duration = '4n';
        patternType = 'up';
        break;
      default:
        notes = ['C4', 'E4', 'G4', 'B4'];
        interval = '4n';
        duration = '8n';
        patternType = 'up';
    }
    
    const pattern = new Tone.Pattern((time, note) => {
      if (synth.triggerAttackRelease) {
        
        if (Array.isArray(note)) {
          note.forEach(n => synth.triggerAttackRelease(n, duration, time));
        } else {
          synth.triggerAttackRelease(note, duration, time);
        }
      }
    }, notes, patternType);
    
    pattern.loop = true;
    pattern.interval = interval;

    playerRef.current = { synth, pattern };
    volumeNodeRef.current = volumeNode;

    playerRef.current.effectsNodes = {
      reverb: reverbNode,
      delay: delayNode,
      distortion: distortionNode,
      chorus: chorusNode,
      eq: eqNode,
      compressor: compressorNode
    };

    
    onUpdate(track.id, { player: playerRef.current });
  };

  const initializeTonePlayer = () => {
    if (playerRef.current) {
      playerRef.current.dispose();
    }

    const audioUrl = track.audioUrl.startsWith('http') 
      ? track.audioUrl 
      : `http://localhost:3001${track.audioUrl}`;

    const player = new Tone.Player(track.audioUrl);
    
   
    const volumeNode = new Tone.Volume(Tone.gainToDb(track.volume));
    const reverbNode = new Tone.Reverb({ decay: 2, wet: 0 });
    const delayNode = new Tone.FeedbackDelay({ delayTime: 0.25, feedback: 0.3, wet: 0 });
    const distortionNode = new Tone.Distortion({ distortion: 0, wet: 0 });
    const chorusNode = new Tone.Chorus({ frequency: 1.5, delayTime: 3.5, depth: 0.7, wet: 0 });
    const eqNode = new Tone.EQ3({ low: 0, mid: 0, high: 0 });
    const compressorNode = new Tone.Compressor({ threshold: -24, ratio: 4 });
    
   
    player.chain(
      reverbNode,
      delayNode,
      distortionNode,
      chorusNode,
      eqNode,
      compressorNode,
      volumeNode,
      masterVolume
    );
    
    player.loop = true;
    playerRef.current = player;
    volumeNodeRef.current = volumeNode;
    
   
    playerRef.current.effectsNodes = {
      reverb: reverbNode,
      delay: delayNode,
      distortion: distortionNode,
      chorus: chorusNode,
      eq: eqNode,
      compressor: compressorNode
    };
  
    onUpdate(track.id, { player });
  };

  useEffect(() => {
   
    if (playerRef.current && isLoaded) {
      if (track.useSynth) {
        
        const { pattern } = playerRef.current;
        if (isPlaying && !track.muted) {
          if (pattern && pattern.state !== 'started') {
            Tone.Transport.start();
            pattern.start();
          }
        } else {
          if (pattern && pattern.state === 'started') {
            pattern.stop();
          }
        }
      } else {
       
        if (isPlaying && !track.muted) {
          try {
            if (playerRef.current.state !== 'started') {
             
              playerRef.current.sync().start(0);
            }
          } catch (error) {
            console.error('Playback error:', error);
          }
        } else {
          try {
            if (playerRef.current.state === 'started') {
              playerRef.current.stop();
            }
          } catch (error) {
            console.error('Stop error:', error);
          }
        }
      }
    }
  }, [isPlaying, track.muted, isLoaded, track.useSynth]);

  useEffect(() => {
   
    if (volumeNodeRef.current) {
      volumeNodeRef.current.volume.rampTo(Tone.gainToDb(track.volume), 0.1);
    }
  }, [track.volume]);

  useEffect(() => {
  
    if (playerRef.current) {
     
      const globalBPM = Tone.Transport.bpm.value;
      const trackBPM = track.bpm || globalBPM;
      const calculatedRate = trackBPM / globalBPM;
      
      if (track.useSynth) {
        
        const { pattern } = playerRef.current;
        if (pattern) {
          pattern.playbackRate = calculatedRate;
        }
      } else if (playerRef.current.playbackRate !== undefined) {
        
        playerRef.current.playbackRate = calculatedRate;
      }
    }
  }, [track.bpm, track.useSynth]);

  useEffect(() => {
  
    if (playerRef.current && playerRef.current.effectsNodes && track.effects) {
      const { reverb, delay, distortion, chorus, eq, compressor } = playerRef.current.effectsNodes;
      const effects = track.effects;

      
      if (reverb && effects.reverb !== undefined) {
        reverb.wet.value = effects.reverb;
      }

      if (delay && effects.delay !== undefined) {
        delay.wet.value = effects.delay;
      }

      if (distortion && effects.distortion !== undefined) {
        distortion.wet.value = effects.distortion;
        distortion.distortion = effects.distortion;
      }

      if (chorus && effects.chorus !== undefined) {
        chorus.wet.value = effects.chorus;
      }
      if (eq && effects.eq) {
        eq.low.value = effects.eq.low;
        eq.mid.value = effects.eq.mid;
        eq.high.value = effects.eq.high;
      }
      if (compressor && effects.compressor) {
        compressor.threshold.value = effects.compressor.threshold;
        compressor.ratio.value = effects.compressor.ratio;
      }
    }
  }, [track.effects]);

  useEffect(() => {
  
    if (wavesurferRef.current) {
      wavesurferRef.current.setOptions({
        waveColor: track.muted ? '#1a1a1a' : '#333',
        progressColor: track.muted ? '#0a0a0a' : '#00FF00',
      });
    }
  }, [track.muted]);

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    onUpdate(track.id, { volume: newVolume });
  };

  const toggleMute = () => {
    onUpdate(track.id, { muted: !track.muted });
  };

  const toggleSolo = () => {
    onUpdate(track.id, { solo: !track.solo });
  };

  const handleNameChange = (e) => {
    onUpdate(track.id, { name: e.target.value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="bg-green-500/5 backdrop-blur-md rounded-lg p-4 border border-green-500/30 hover:border-green-500/50 transition-colors"
    >
      <div className="flex items-center gap-4">
        {/* Track Info */}
        <div className="flex-shrink-0 w-48">
          <input
            type="text"
            value={track.name}
            onChange={handleNameChange}
            className="bg-transparent text-lg font-semibold text-green-400 outline-none border-b border-transparent hover:border-green-500 focus:border-green-500 transition-colors w-full"
          />
          <p className="text-xs text-green-600 mt-1">
            {track.type === 'instrument' ? `Instrument: ${track.instrument}` : 'Audio Track'}
          </p>
        </div>

        {/* Waveform */}
        <div className="flex-1 waveform-container">
          {track.useSynth ? (
            <div className="w-full h-full flex items-center justify-center bg-black/50 backdrop-blur-sm rounded border border-green-500/20">
              <div className="text-center">
                <Music className="w-12 h-12 mx-auto mb-2 text-green-400 opacity-70" />
                <div className="text-xs text-green-600">Synthesized Sound</div>
              </div>
            </div>
          ) : (
            <>
              <div ref={waveformRef} className="w-full h-full" />
              {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* BPM Control */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">BPM</span>
            <input
              type="number"
              min="60"
              max="200"
              value={track.bpm || 120}
              onChange={(e) => onUpdate(track.id, { bpm: parseInt(e.target.value) || 120 })}
              className="w-14 bg-dark border border-gray-700 rounded px-1 py-1 text-xs text-center"
              title="Track BPM"
            />
          </div>

          {/* Volume Slider */}
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-gray-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={track.volume}
              onChange={handleVolumeChange}
              className="w-24"
              title="Volume"
            />
            <span className="text-xs text-gray-500 w-8">
              {Math.round(track.volume * 100)}%
            </span>
          </div>

          {/* Mute Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleMute}
            className={`p-2 rounded ${
              track.muted 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Mute"
          >
            {track.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </motion.button>

          {/* Effects Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onOpenEffects}
            className="bg-green-500/20 backdrop-blur-md hover:bg-green-500/30 text-green-400 px-3 py-2 rounded flex items-center gap-1 border border-green-500/50"
            title="Audio Effects"
          >
            <Sliders className="w-4 h-4" />
            <span className="text-xs font-semibold">FX</span>
          </motion.button>

          {/* Solo Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleSolo}
            className={`p-2 rounded ${
              track.solo 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            title="Solo"
          >
            <Radio className="w-4 h-4" />
          </motion.button>

          {/* Delete Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(track.id)}
            className="p-2 rounded bg-gray-700 text-red-400 hover:bg-red-600 hover:text-white"
            title="Delete Track"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default Track;

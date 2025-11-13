import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Mic, Upload, Music2, Circle, Square } from 'lucide-react';
import { uploadAudio } from '../utils/audioUtils';

const INSTRUMENTS = [
  { id: 'drums', name: 'Drums', emoji: '🥁', sample: '/samples/drums.mp3' },
  { id: 'piano', name: 'Piano', emoji: '🎹', sample: '/samples/piano.mp3' },
  { id: 'bass', name: 'Bass', emoji: '🎸', sample: '/samples/bass.mp3' },
  { id: 'violin', name: 'Violin', emoji: '🎻', sample: '/samples/violin.mp3' },
  { id: 'saxophone', name: 'Saxophone', emoji: '🎷', sample: '/samples/saxophone.mp3' },
  { id: 'synth', name: 'Synth', emoji: '🎛️', sample: '/samples/synth.mp3' },
  { id: 'guitar', name: 'Guitar', emoji: '🎸', sample: '/samples/guitar.mp3' },
  { id: 'flute', name: 'Flute', emoji: '🪈', sample: '/samples/flute.mp3' },
];

const AddTrackModal = ({ onClose, onAddTrack }) => {
  const [activeTab, setActiveTab] = useState('upload'); 
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const fileInputRef = useRef(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRecordedAudio = async () => {
    if (!recordedBlob) return;

    setIsUploading(true);
    try {
      const file = new File([recordedBlob], `recording-${Date.now()}.webm`, {
        type: 'audio/webm'
      });
      
      console.log('Uploading recorded audio:', file.name, file.size);
      const result = await uploadAudio(file);
      console.log('Recording upload result:', result);
      
      onAddTrack({
        name: 'Recorded Audio',
        type: 'record',
        audioUrl: result.path,
        useSynth: false
      });
      
      alert('✅ Recording uploaded successfully!');
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('❌ Failed to upload recording: ' + (error.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/webm'];
    const validExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.webm'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      alert('❌ Invalid file type!\n\nPlease upload: MP3, WAV, OGG, M4A, or WebM files.');
      return;
    }

    setIsUploading(true);
    try {
      console.log('Uploading file:', file.name, file.type, file.size);
      const result = await uploadAudio(file);
      console.log('Upload result:', result);
      
      onAddTrack({
        name: file.name.replace(/\.[^/.]+$/, ''),
        type: 'upload',
        audioUrl: result.path,
        useSynth: false
      });
      
      alert('✅ File uploaded successfully!');
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('❌ Upload failed: ' + (error.message || 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleInstrumentSelect = (instrument) => {
    onAddTrack({
      name: instrument.name,
      type: 'instrument',
      instrument: instrument.id,
      audioUrl: instrument.sample
    });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[100] p-4"
      onClick={onClose}
      style={{ pointerEvents: 'auto' }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-dark-light rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Add Track</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('instrument')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'instrument'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Music2 className="w-5 h-5 inline mr-2" />
            Instruments
          </button>
          <button
            onClick={() => setActiveTab('record')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'record'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Mic className="w-5 h-5 inline mr-2" />
            Record
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 font-semibold transition-colors ${
              activeTab === 'upload'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Upload className="w-5 h-5 inline mr-2" />
            Upload
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[300px]">
          {/* Instrument Selection */}
          {activeTab === 'instrument' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {INSTRUMENTS.map((instrument) => (
                <motion.button
                  key={instrument.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleInstrumentSelect(instrument)}
                  className="bg-dark-lighter hover:bg-gray-700 p-6 rounded-lg text-center transition-colors border border-gray-700 hover:border-primary"
                >
                  <div className="text-4xl mb-2">{instrument.emoji}</div>
                  <div className="font-semibold">{instrument.name}</div>
                </motion.button>
              ))}
            </div>
          )}

          {/* Recording */}
          {activeTab === 'record' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="mb-8">
                {isRecording ? (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-32 h-32 bg-red-600 rounded-full flex items-center justify-center"
                  >
                    <Mic className="w-16 h-16" />
                  </motion.div>
                ) : (
                  <div className="w-32 h-32 bg-gray-700 rounded-full flex items-center justify-center">
                    <Mic className="w-16 h-16" />
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                {!isRecording && !recordedBlob && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startRecording}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg flex items-center gap-2 font-semibold"
                  >
                    <Circle className="w-5 h-5" />
                    Start Recording
                  </motion.button>
                )}

                {isRecording && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={stopRecording}
                    className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg flex items-center gap-2 font-semibold"
                  >
                    <Square className="w-5 h-5" />
                    Stop Recording
                  </motion.button>
                )}

                {recordedBlob && !isRecording && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleRecordedAudio}
                      disabled={isUploading}
                      className="bg-primary hover:bg-green-600 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold"
                    >
                      {isUploading ? 'Adding...' : 'Add to Project'}
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setRecordedBlob(null);
                        audioChunksRef.current = [];
                      }}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-semibold"
                    >
                      Re-record
                    </motion.button>
                  </>
                )}
              </div>

              {isRecording && (
                <p className="mt-4 text-gray-400 animate-pulse">Recording in progress...</p>
              )}
            </div>
          )}

          {/* Upload */}
          {activeTab === 'upload' && (
            <div className="flex flex-col items-center justify-center py-12">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-primary hover:bg-green-600 disabled:bg-gray-600 text-white px-8 py-4 rounded-lg flex items-center gap-3 font-semibold text-lg"
              >
                <Upload className="w-6 h-6" />
                {isUploading ? 'Uploading...' : 'Choose Audio File'}
              </motion.button>

              <p className="mt-4 text-gray-400 text-sm">
                Supported formats: MP3, WAV, OGG, M4A, WebM
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddTrackModal;

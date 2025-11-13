import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sliders, X } from 'lucide-react';
import * as Tone from 'tone';

const EffectsPanel = ({ track, onUpdate, onClose }) => {
  const [effects, setEffects] = useState({
    reverb: track.effects?.reverb || 0,
    delay: track.effects?.delay || 0,
    distortion: track.effects?.distortion || 0,
    chorus: track.effects?.chorus || 0,
    eq: track.effects?.eq || { low: 0, mid: 0, high: 0 },
    compressor: track.effects?.compressor || { threshold: -24, ratio: 4 }
  });

  const handleEffectChange = (effectName, value) => {
    const newEffects = { ...effects, [effectName]: value };
    setEffects(newEffects);
    onUpdate(track.id, { effects: newEffects });
  };

  const handleEQChange = (band, value) => {
    const newEQ = { ...effects.eq, [band]: value };
    const newEffects = { ...effects, eq: newEQ };
    setEffects(newEffects);
    onUpdate(track.id, { effects: newEffects });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-20 right-4 bg-dark-light border border-gray-700 rounded-lg p-4 w-80 shadow-2xl z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">Effects - {track.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Effects Controls */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {/* Reverb */}
        <div>
          <label className="text-sm text-gray-400 mb-1 block">
            Reverb: {Math.round(effects.reverb * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={effects.reverb}
            onChange={(e) => handleEffectChange('reverb', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Delay */}
        <div>
          <label className="text-sm text-gray-400 mb-1 block">
            Delay: {Math.round(effects.delay * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={effects.delay}
            onChange={(e) => handleEffectChange('delay', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Distortion */}
        <div>
          <label className="text-sm text-gray-400 mb-1 block">
            Distortion: {Math.round(effects.distortion * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={effects.distortion}
            onChange={(e) => handleEffectChange('distortion', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Chorus */}
        <div>
          <label className="text-sm text-gray-400 mb-1 block">
            Chorus: {Math.round(effects.chorus * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={effects.chorus}
            onChange={(e) => handleEffectChange('chorus', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        {/* EQ */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold mb-3">Equalizer</h4>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Low: {effects.eq.low > 0 ? '+' : ''}{effects.eq.low} dB
              </label>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={effects.eq.low}
                onChange={(e) => handleEQChange('low', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Mid: {effects.eq.mid > 0 ? '+' : ''}{effects.eq.mid} dB
              </label>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={effects.eq.mid}
                onChange={(e) => handleEQChange('mid', parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                High: {effects.eq.high > 0 ? '+' : ''}{effects.eq.high} dB
              </label>
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={effects.eq.high}
                onChange={(e) => handleEQChange('high', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Compressor */}
        <div className="border-t border-gray-700 pt-4">
          <h4 className="text-sm font-semibold mb-3">Compressor</h4>
          
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Threshold: {effects.compressor.threshold} dB
              </label>
              <input
                type="range"
                min="-60"
                max="0"
                step="1"
                value={effects.compressor.threshold}
                onChange={(e) => handleEffectChange('compressor', { 
                  ...effects.compressor, 
                  threshold: parseInt(e.target.value) 
                })}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1 block">
                Ratio: {effects.compressor.ratio}:1
              </label>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={effects.compressor.ratio}
                onChange={(e) => handleEffectChange('compressor', { 
                  ...effects.compressor, 
                  ratio: parseInt(e.target.value) 
                })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <button
          onClick={() => {
            const resetEffects = {
              reverb: 0,
              delay: 0,
              distortion: 0,
              chorus: 0,
              eq: { low: 0, mid: 0, high: 0 },
              compressor: { threshold: -24, ratio: 4 }
            };
            setEffects(resetEffects);
            onUpdate(track.id, { effects: resetEffects });
          }}
          className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors text-sm"
        >
          Reset All Effects
        </button>
      </div>
    </motion.div>
  );
};

export default EffectsPanel;

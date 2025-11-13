import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import * as Tone from 'tone';

const Visualizer = ({ isPlaying, tracks }) => {
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!analyserRef.current) {
      
      analyserRef.current = Tone.context.createAnalyser();
      analyserRef.current.fftSize = 256;
      
      
      Tone.Destination.connect(analyserRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

   
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const draw = () => {
      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;

      ctx.fillStyle = 'rgba(18, 18, 18, 0.2)';
      ctx.fillRect(0, 0, width, height);

      if (isPlaying) {
       
        analyser.getByteFrequencyData(dataArray);

       
        const barWidth = width / bufferLength * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height * 0.8;
          
         
          const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
          gradient.addColorStop(0, '#1DB954');
          gradient.addColorStop(0.5, '#1ed760');
          gradient.addColorStop(1, '#1DB954');
          
          ctx.fillStyle = gradient;
          
          
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
          
          x += barWidth;
        }

        
        ctx.beginPath();
        ctx.strokeStyle = '#1DB954';
        ctx.lineWidth = 2;
        
        const sliceWidth = width / bufferLength;
        x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 255.0;
          const y = height / 2 + (v - 0.5) * height * 0.6;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.stroke();
      } else {
        
        const barCount = 50;
        const barWidth = width / barCount;
        const time = Date.now() / 1000;

        for (let i = 0; i < barCount; i++) {
          const barHeight = Math.sin(time * 2 + i * 0.5) * 20 + 30;
          
          ctx.fillStyle = `rgba(29, 185, 84, ${0.2 + Math.sin(time + i * 0.3) * 0.1})`;
          ctx.fillRect(
            i * barWidth,
            height / 2 - barHeight / 2,
            barWidth - 2,
            barHeight
          );
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-lighter rounded-lg p-6 mb-6 border border-gray-800"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Master Output</h3>
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <>
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              <span className="text-sm text-primary">Playing</span>
            </>
          ) : (
            <span className="text-sm text-gray-500">Idle</span>
          )}
        </div>
      </div>
      
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-32 rounded-lg"
          style={{ background: 'rgba(0, 0, 0, 0.3)' }}
        />

        {tracks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-500 text-sm">Add tracks to see visualization</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Visualizer;

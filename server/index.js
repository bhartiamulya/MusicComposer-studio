const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ffmpeg = require('fluent-ffmpeg');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const uploadsDir = path.join(__dirname, '../uploads');
const exportsDir = path.join(__dirname, '../exports');
[uploadsDir, exportsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});


app.use('/uploads', express.static(uploadsDir));
app.use('/exports', express.static(exportsDir));


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedExtensions = /\.(wav|mp3|ogg|m4a|webm|aac|flac)$/i;
    const allowedMimeTypes = /^audio\//i;
    
    const extname = allowedExtensions.test(file.originalname.toLowerCase());
    const mimetype = allowedMimeTypes.test(file.mimetype);
    
    console.log('File upload attempt:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      extname,
      mimetypeMatch: mimetype
    });
    
    
    if (mimetype || extname) {
      return cb(null, true);
    }
    cb(new Error('Only audio files are allowed! Supported: MP3, WAV, OGG, M4A, WebM'));
  },
  limits: { fileSize: 50 * 1024 * 1024 } 
});


let genAI;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

app.post('/api/upload', (req, res) => {
  const uploadHandler = upload.single('audio');
  
  uploadHandler(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(500).json({ error: err.message || 'Failed to upload file' });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }
      
      console.log('File uploaded successfully:', req.file.filename);
      
      res.json({
        success: true,
        filename: req.file.filename,
        path: `/uploads/${req.file.filename}`,
        originalName: req.file.originalname
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  });
});


app.post('/api/merge', async (req, res) => {
  try {
    const { tracks, format = 'mp3' } = req.body;
    
    if (!tracks || tracks.length === 0) {
      return res.status(400).json({ error: 'No tracks provided' });
    }

    const outputFilename = `merged-${uuidv4()}.${format}`;
    const outputPath = path.join(exportsDir, outputFilename);

    
    const command = ffmpeg();
    
    
    tracks.forEach(track => {
      const filePath = path.join(__dirname, '..', track.path.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        command.input(filePath);
      }
    });

    
    const filterComplex = tracks.map((track, index) => {
      const volume = track.volume !== undefined ? track.volume : 1.0;
      return `[${index}:a]volume=${volume}[a${index}]`;
    }).join(';');
    
    const mixInputs = tracks.map((_, index) => `[a${index}]`).join('');
    const fullFilter = `${filterComplex};${mixInputs}amix=inputs=${tracks.length}:duration=longest:dropout_transition=2[out]`;

    command
      .complexFilter(fullFilter)
      .outputOptions(['-map', '[out]'])
      .audioCodec(format === 'wav' ? 'pcm_s16le' : 'libmp3lame')
      .audioBitrate('320k')
      .on('start', (commandLine) => {
        console.log('FFmpeg command:', commandLine);
      })
      .on('progress', (progress) => {
        console.log('Processing: ' + progress.percent + '% done');
      })
      .on('end', () => {
        console.log('Merging finished successfully');
        res.json({
          success: true,
          filename: outputFilename,
          downloadUrl: `/exports/${outputFilename}`
        });
      })
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        res.status(500).json({ error: 'Failed to merge tracks', details: err.message });
      })
      .save(outputPath);

  } catch (error) {
    console.error('Merge error:', error);
    res.status(500).json({ error: 'Failed to merge tracks' });
  }
});


app.post('/api/ai-suggest', async (req, res) => {
  try {
    if (!genAI) {
      console.log('Gemini API not configured');
      return res.status(503).json({ 
        error: 'Gemini API not configured. Please add GEMINI_API_KEY to .env file',
        suggestions: []
      });
    }

    const { currentTracks, context } = req.body;
    console.log('AI suggest request:', { currentTracks, context });
    
    
    const fallbackSuggestions = [
      {
        instrument: 'Bass',
        reason: 'A bass line would add depth and groove to your composition',
        style: 'Deep and rhythmic'
      },
      {
        instrument: 'Drums',
        reason: 'Drums would provide a solid rhythmic foundation',
        style: 'Steady beat'
      },
      {
        instrument: 'Piano',
        reason: 'Piano chords would add harmonic richness',
        style: 'Melodic and flowing'
      }
    ];

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const prompt = `As a music producer, suggest 2-3 instruments to add to this composition.

Current tracks: ${currentTracks.map(t => t.name || t.instrument).join(', ') || 'None yet'}

Respond with ONLY a JSON array like this:
[
  {"instrument": "Bass", "reason": "Adds depth", "style": "Groovy"},
  {"instrument": "Drums", "reason": "Provides rhythm", "style": "Steady"}
]`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini response:', text);
      
      let suggestions;
      try {
        
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          suggestions = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          suggestions = fallbackSuggestions;
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        suggestions = fallbackSuggestions;
      }

      res.json({ success: true, suggestions });
    } catch (apiError) {
      console.error('Gemini API error:', apiError.message);
     
      res.json({ 
        success: true, 
        suggestions: fallbackSuggestions,
        note: 'Using fallback suggestions (API unavailable)'
      });
    }
  } catch (error) {
    console.error('AI suggestion error:', error);
    
    res.json({ 
      success: true, 
      suggestions: [
        {
          instrument: 'Piano',
          reason: 'Adds melodic elements to your composition',
          style: 'Harmonic and expressive'
        }
      ],
      note: 'Using default suggestions'
    });
  }
});


app.post('/api/ai-compose', async (req, res) => {
  try {
    const { prompt, genre, mood, tempo } = req.body;
    
    console.log('AI Compose request:', { prompt, genre, mood, tempo });
    
    if (!genAI) {
      
      return res.json({
        success: true,
        tracks: generateFallbackComposition(genre, mood, tempo)
      });
    }

    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      
      const compositionPrompt = `You are a professional music composer. Create a complete music composition.

Genre: ${genre}
Mood: ${mood}
Tempo: ${tempo}
${prompt ? `Description: ${prompt}` : ''}

Generate a composition with 3-4 instruments that work well together for this style.
For each instrument, provide:
1. Instrument name (Piano, Drums, Bass, Guitar, Synth, Violin, Saxophone, or Flute)
2. A brief description of its role

Respond with ONLY a JSON array like this:
[
  {"instrument": "Piano", "name": "Piano Melody", "role": "Main melody"},
  {"instrument": "Bass", "name": "Bass Line", "role": "Rhythm foundation"},
  {"instrument": "Drums", "name": "Drum Beat", "role": "Percussion"}
]`;

      const result = await model.generateContent(compositionPrompt);
      const response = await result.response;
      const text = response.text();
      
      console.log('Gemini composition response:', text);
      
      let tracks;
      try {
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          tracks = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        } else {
          tracks = generateFallbackComposition(genre, mood, tempo);
        }
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        tracks = generateFallbackComposition(genre, mood, tempo);
      }

      res.json({ success: true, tracks });
    } catch (apiError) {
      console.error('Gemini API error:', apiError.message);
      res.json({
        success: true,
        tracks: generateFallbackComposition(genre, mood, tempo)
      });
    }
  } catch (error) {
    console.error('AI compose error:', error);
    res.json({
      success: true,
      tracks: generateFallbackComposition('pop', 'happy', 'medium')
    });
  }
});

function generateFallbackComposition(genre, mood, tempo) {
  const genreInstruments = {
    'pop': [
      { instrument: 'piano', name: 'Piano Chords', role: 'Harmony' },
      { instrument: 'bass', name: 'Bass Line', role: 'Foundation' },
      { instrument: 'drums', name: 'Beat', role: 'Rhythm' },
      { instrument: 'synth', name: 'Synth Lead', role: 'Melody' }
    ],
    'rock': [
      { instrument: 'guitar', name: 'Electric Guitar', role: 'Lead' },
      { instrument: 'bass', name: 'Bass Guitar', role: 'Foundation' },
      { instrument: 'drums', name: 'Rock Drums', role: 'Rhythm' }
    ],
    'jazz': [
      { instrument: 'piano', name: 'Jazz Piano', role: 'Chords' },
      { instrument: 'bass', name: 'Walking Bass', role: 'Foundation' },
      { instrument: 'drums', name: 'Jazz Drums', role: 'Swing' },
      { instrument: 'saxophone', name: 'Sax Solo', role: 'Melody' }
    ],
    'electronic': [
      { instrument: 'synth', name: 'Lead Synth', role: 'Melody' },
      { instrument: 'bass', name: 'Sub Bass', role: 'Foundation' },
      { instrument: 'drums', name: 'Electronic Drums', role: 'Beat' }
    ],
    'classical': [
      { instrument: 'piano', name: 'Grand Piano', role: 'Main' },
      { instrument: 'violin', name: 'Violin', role: 'Melody' },
      { instrument: 'flute', name: 'Flute', role: 'Harmony' }
    ],
    'hip-hop': [
      { instrument: 'drums', name: 'Hip Hop Beat', role: 'Rhythm' },
      { instrument: 'bass', name: '808 Bass', role: 'Foundation' },
      { instrument: 'synth', name: 'Synth Pad', role: 'Atmosphere' }
    ],
    'ambient': [
      { instrument: 'synth', name: 'Ambient Pad', role: 'Atmosphere' },
      { instrument: 'piano', name: 'Soft Piano', role: 'Melody' },
      { instrument: 'flute', name: 'Ethereal Flute', role: 'Texture' }
    ]
  };

  return genreInstruments[genre] || genreInstruments['pop'];
}


app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    ffmpegAvailable: true,
    aiEnabled: !!process.env.GEMINI_API_KEY 
  });
});

const cleanupOldFiles = () => {
  const maxAge = 24 * 60 * 60 * 1000; 
  
  [uploadsDir, exportsDir].forEach(dir => {
    fs.readdir(dir, (err, files) => {
      if (err) return;
      
      files.forEach(file => {
        const filePath = path.join(dir, file);
        fs.stat(filePath, (err, stats) => {
          if (err) return;
          
          if (Date.now() - stats.mtime.getTime() > maxAge) {
            fs.unlink(filePath, err => {
              if (err) console.error('Failed to delete old file:', err);
            });
          }
        });
      });
    });
  });
};


setInterval(cleanupOldFiles, 60 * 60 * 1000);

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🎵 AI Music Composer Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadsDir}`);
  console.log(`📦 Exports directory: ${exportsDir}`);
  console.log(`🤖 AI Suggestions: ${process.env.GEMINI_API_KEY ? 'Enabled' : 'Disabled (set GEMINI_API_KEY)'}`);
});

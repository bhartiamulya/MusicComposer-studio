# Music Composer Studio

A professional web-based Digital Audio Workstation (DAW) that lets you compose, mix, and export music with AI-powered suggestions.

##  Features

### Core Features
- **Multi-track Recording & Mixing**: Layer unlimited audio tracks with individual volume controls
- **Real-time Waveform Visualization**: Beautiful VLC-style audio visualization with frequency bars
- **Audio Recording**: Record directly from your microphone
- **File Upload**: Support for MP3, WAV, OGG, M4A, WebM formats
- **Synthesized Instruments**: 8 built-in instruments using Tone.js (Drums, Piano, Bass, Violin, Saxophone, Synth, Guitar, Flute)
- **Professional Controls**: Mute, Solo, Volume, and Delete for each track
- **BPM Control**: Adjust tempo from 60-200 BPM
- **Metronome**: Built-in click track for timing
- **Record Output**: Capture synthesized audio and download as WebM
- **Merge Audio**: Merge uploaded audio tracks using FFmpeg

**Note:** Instruments use Tone.js synthesizers with realistic effects (reverb, chorus, vibrato, phaser). No sample files needed!

###  AI Features
- **Gemini AI Integration**: Get intelligent composition suggestions
- **Context-aware Recommendations**: AI analyzes your current tracks and suggests complementary instruments
- **One-click Apply**: Add suggested instruments directly to your project

###  UI/UX
- **Modern Dark Theme**: Spotify-inspired professional interface
- **Smooth Animations**: Framer Motion for fluid transitions
- **Responsive Design**: Works on desktop and tablet
- **Intuitive Controls**: Drag-free, click-based workflow

##  Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Tone.js** - Audio synthesis and playback
- **Wavesurfer.js** - Waveform visualization
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **FFmpeg** - Audio processing and merging
- **Multer** - File upload handling
- **Google Gemini AI** - AI composition suggestions


### Start the Development Server

**Option 1: Run both frontend and backend together:**
```bash
npm run dev
```

**Option 2: Run separately:**
```bash
# Terminal 1 - Backend
npm run server

# Terminal 2 - Frontend
npm run client
```

The app will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Using the Application

1 **Add Tracks**: Click "+ Add Track" and choose:
   - 🎹 **Instrument**: Select from pre-loaded sounds
   - 🎤 **Record**: Record audio from your microphone
   - ⬆️ **Upload**: Upload audio files from your computer

2**Mix Your Tracks**:
   - Adjust individual track volumes
   - Mute/unmute tracks
   - Solo specific tracks
   - Delete unwanted tracks

3. **Use AI Suggestions**:
   - Click "AI Assist" to get composition recommendations
   - Review AI suggestions for complementary instruments
   - Click "Add" to apply suggestions instantly

4. **Playback**: Click the Play button to preview your composition

5. **Export**: Click "Export" to merge and download your final mix

## 🏗 Project Structure

```
ai-music-composer/
├── client/                  # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── Track.jsx           # Individual track component
│   │   │   ├── AddTrackModal.jsx   # Add track dialog
│   │   │   ├── Visualizer.jsx      # Audio visualizer
│   │   │   └── AISuggestions.jsx   # AI panel
│   │   ├── utils/          # Utility functions
│   │   │   └── audioUtils.js       # Audio operations
│   │   ├── App.jsx         # Main app component
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Global styles
│   ├── public/             # Static assets
│   │   └── samples/        # Instrument samples
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── server/                  # Node.js backend
│   └── index.js            # Express server
├── uploads/                # Uploaded audio files
├── exports/                # Exported tracks
├── package.json
├── .env                    # Environment variables
└── README.md
```




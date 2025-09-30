# 🌾 Krushi Sathi - AI Agricultural Advisory

**Krushi Sathi** is a modern web application that provides AI-powered agricultural advice to farmers in their native language using voice, text, and image inputs.

## ✨ Features

- **🤖 AI-Powered Advice** - Get intelligent farming recommendations using Google Gemini AI
- **🗣️ Voice Interface** - Speak your questions in 7 Indian languages
- **📸 Image Analysis** - Upload crop photos for disease/pest identification
- **🌍 Multilingual** - English, Hindi, Malayalam, Marathi, Kannada, Gujarati, Telugu
- **📱 PWA Ready** - Install on mobile devices, works offline
- **🌤️ Real-time Updates** - Weather, market prices, government schemes

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Google AI Studio API key (optional - works with templates without it)

### Installation

Open your browser at `http://localhost:8080`

### Environment Setup (Optional)

Create a `.env` file in the root directory:
```env
# Optional: Add Google AI Studio API key for AI responses
AI_API_KEY=your_google_ai_api_key_here

# Optional: Add database URL for persistence  
DATABASE_URL=your_postgresql_url_here
```

> **Get API Key:** Visit [Google AI Studio](https://makersuite.google.com/app/apikey) to get a free API key

## 🚀 Deployment

### Netlify (Recommended)

1. Fork this repository
2. Connect to Netlify
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist/spa`
4. Add environment variables in Netlify dashboard
5. Deploy!

### Other Platforms
- **Vercel:** Works out of the box
- **Self-hosted:** Run `npm run build` and serve the `dist/` folder

## 🛠️ Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend:** Express.js, Node.js
- **AI:** Google Gemini API
- **Database:** PostgreSQL (optional)
- **Build:** Vite

## 🌟 Core Features

### 🤖 AI Advisory System
- Context-aware farming advice using Google Gemini
- Fallback templates when API unavailable
- Support for both text and image inputs

### 🗣️ Voice Interface
- Speech recognition in 7 languages
- Text-to-speech responses
- Mobile-optimized voice controls

### 📸 Smart Image Analysis
- Crop disease and pest identification
- Automatic image compression
- Secure client-side processing

### 🌍 Multilingual Support
- Complete UI translation for 7 Indian languages
- Language-specific voice synthesis
- Cultural adaptation of content

### 📱 Progressive Web App
- Installable on mobile devices
- Offline functionality with service worker
- Native app-like experience

## 🔧 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Service health and configuration |
| POST | `/api/advisory` | Generate AI farming advice |
| GET | `/api/updates` | Weather, market, and scheme data |

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature/name`
5. Create Pull Request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Google AI for Gemini API
- Open-Meteo for weather data  
- Indian farming community for inspiration

---

**Built with ❤️ for farmers**

2. **Install dependencies**
   ```bash
   npm install
   # or if you have pnpm
   pnpm install
   ```

3. **Set up your environment**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Google AI Studio API key:
   ```
   AI_API_KEY=your_api_key_here
   ```
   
   > **Getting an API key:** Head to [Google AI Studio](https://makersuite.google.com/app/apikey), sign in with your Google account, and create a new API key. It's free!

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:8081](http://localhost:8081) in your browser.

## 🛠️ How it works

### For Farmers
1. **Choose your language** when you first visit
2. **Ask a question** by typing or speaking
3. **Upload a photo** of your crop if needed
4. **Get instant advice** powered by AI
5. **Save useful tips** for later reference
6. **Check weather and market prices**

### For Developers
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Express.js with integrated Vite dev server
- **AI**: Google Gemini 1.5 Flash for intelligent responses
- **Database**: PostgreSQL for production, in-memory for development
- **Deployment**: Works on Netlify, Vercel, or any Node.js hosting

## 📱 Features

### Core Features
- **Multi-language support** (EN, ML, HI, MR, KN, GU, TE)
- **Voice input and text-to-speech**
- **Image-based crop analysis**
- **AI-powered agricultural advice**
- **Weather updates integration**
- **Market price information**
- **Government scheme updates**

### Technical Features
- **Progressive Web App** (works offline)
- **Responsive design** (mobile-first)
- **TypeScript throughout**
- **Modern UI components** (Radix UI + Tailwind)
- **Production-ready** build system

## 🏗️ Project Structure

```
├── client/                 # React frontend
│   ├── pages/             # Route components
│   ├── components/        # Reusable UI components
│   └── hooks/             # Custom React hooks
├── server/                # Express backend
│   ├── routes/           # API endpoints
│   └── db.ts             # Database operations
├── shared/               # Shared types and utilities
└── public/              # Static assets
```

## 🚢 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Deploy to Netlify/Vercel
The app is configured to work out-of-the-box with:
- **Netlify** (see `netlify.toml`)
- **Vercel** 
- **Any Node.js hosting** (Railway, Render, etc.)

Just connect your GitHub repo and deploy!

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `AI_API_KEY` | Google AI Studio API key | Yes (for AI features) |
| `DATABASE_URL` | PostgreSQL connection string | No (uses in-memory) |
| `NODE_ENV` | Environment (development/production) | No |
| `PORT` | Server port | No (defaults to 3000) |

### Without AI (Template Mode)
If you don't want to set up the AI API key, just comment out the `AI_API_KEY` line in your `.env` file. The app will work with pre-defined responses.

## 🤝 Contributing

We'd love your help making Krushi Sathi better! Here's how:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Test thoroughly** (`npm run test`)
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Development Guidelines
- Use TypeScript for all new code
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

## 📝 API Documentation

### Main Endpoints

- `GET /api/health` - Health check and configuration status
- `POST /api/advisory` - Get agricultural advice (AI-powered)
- `GET /api/updates` - Weather, market, and scheme updates
- `POST /api/advisories` - Save user advisories
- `GET /api/advisories` - Retrieve saved advisories

### Example Request
```javascript
// Get agricultural advice
const response = await fetch('/api/advisory', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "My tomato plants have yellow leaves",
    lang: "en"
  })
});
```

## 🐛 Troubleshooting

### Common Issues

**"AI request timeout"**
- Check your internet connection
- Verify your API key is valid
- The app will fallback to template responses

**"Port already in use"**
- The dev server will automatically try the next available port
- Check the console output for the actual port being used

**"API key not valid"**
- Make sure you've set up your `.env` file correctly
- Verify your Google AI Studio API key is active

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google AI** for the Gemini API
- **Open-Meteo** for weather data
- **Radix UI** for accessible components
- **The farming community** for inspiration and feedback

---

**Built with ❤️ for farmers across India**

> *"Technology should serve humanity, not the other way around"*

---

### 🌟 Star this repo if it helped you!

Have questions? Found a bug? Want to contribute? Feel free to [open an issue](https://github.com/Chirag8405/Krushi-Sathi/issues) or reach out!
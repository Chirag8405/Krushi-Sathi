# 🌾 Krushi Sathi - Your Digital Farming Companion

**Krushi Sathi** (कृषि साथी) is a modern web application designed to help farmers get instant agricultural advice in their native language. Whether you're dealing with crop diseases, planning your next planting season, or looking for the latest market prices, Krushi Sathi has got you covered.

## 🎯 What makes this special?

This isn't just another farming app. We've built something that actually works for real farmers:

- **Talk in your language** - Support for 7 Indian languages including Hindi, Malayalam, Marathi, Kannada, Gujarati, and Telugu
- **Just speak your question** - Voice input because typing on mobile can be a pain
- **Snap a photo, get advice** - Upload crop images for instant diagnosis
- **Works offline** - Basic features work even when your internet is spotty
- **Sounds back to you** - Listen to advice in your own language

## 🚀 Getting Started

### Prerequisites

You'll need these installed on your machine:
- **Node.js** (version 18 or higher)
- **npm** or **pnpm** (we prefer pnpm)
- A **Google AI Studio API key** (free to get)

### Installation

1. **Clone this repository**
   ```bash
   git clone https://github.com/Chirag8405/Krushi-Sathi.git
   cd Krushi-Sathi
   ```

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
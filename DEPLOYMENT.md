# Krushi Sathi - Agricultural Advisory Platform

## 🌾 Overview

Krushi Sathi is a multilingual agricultural advisory platform that provides AI-powered crop guidance, real-time weather updates, market prices, and government scheme information to farmers.

## ✨ Features

- **AI-powered Advisory**: Get personalized crop advice using Google Gemini AI
- **Multi-language Support**: Available in 7 Indian languages (English, Malayalam, Hindi, Marathi, Kannada, Gujarati, Telugu)
- **Image Analysis**: Upload crop images for AI-powered diagnosis
- **Real-time Updates**: Weather data, market prices, and government schemes
- **Offline Storage**: Save advisories for future reference
- **Voice Input**: Speech-to-text functionality for questions
- **Text-to-Speech**: Hear advisory responses in your language

## 🚀 Quick Start

### Development Setup

1. **Clone and Install**
   ```bash
   git clone <your-repo-url>
   cd zen-world
   pnpm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.production.template .env
   # Edit .env with your actual API keys
   ```

3. **Required Environment Variables**
   ```env
   AI_API_KEY=your_google_ai_api_key_here
   DATABASE_URL=postgresql://... (optional for development)
   ```

4. **Start Development Server**
   ```bash
   pnpm dev
   ```

   Visit: http://localhost:8080

### Production Deployment

#### Option 1: Netlify (Recommended)

1. **Connect Repository**
   - Connect your GitHub repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Environment Variables**
   Add these in Netlify dashboard:
   ```
   AI_API_KEY=your_google_ai_api_key
   DATABASE_URL=your_postgresql_connection_string
   NODE_ENV=production
   ```

3. **Deploy**
   - Push to main branch
   - Netlify will automatically build and deploy

#### Option 2: Docker

1. **Build Container**
   ```bash
   docker build -t zen-world .
   ```

2. **Run Container**
   ```bash
   docker run -p 8080:8080 \
     -e AI_API_KEY=your_api_key \
     -e DATABASE_URL=your_db_url \
     zen-world
   ```

#### Option 3: VPS/Cloud Server

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Install PM2**
   ```bash
   npm install -g pm2
   ```

3. **Start with PM2**
   ```bash
   pm2 start npm --name "zen-world" -- start
   ```

## 🛠️ Configuration

### AI Configuration

This application uses Google Gemini AI. To get an API key:

1. Visit [Google AI Studio](https://makersuite.google.com/)
2. Create a new API key
3. Add it to your environment variables as `AI_API_KEY`

### Database Configuration

- **Development**: Uses in-memory storage (no setup required)
- **Production**: Requires PostgreSQL database

Popular PostgreSQL hosting options:
- [Neon](https://neon.tech/) (Recommended)
- [Supabase](https://supabase.com/)
- [Railway](https://railway.app/)
- [Amazon RDS](https://aws.amazon.com/rds/)

## 📱 API Endpoints

- `GET /api/health` - Health check and configuration status
- `POST /api/advisory` - Generate crop advisory
- `GET /api/updates` - Get weather, market, and scheme updates
- `POST /api/advisories` - Save advisory
- `GET /api/advisories` - List saved advisories

## 🌍 Languages Supported

- English (en)
- Malayalam (ml) - മലയാളം
- Hindi (hi) - हिंदी
- Marathi (mr) - मराठी
- Kannada (kn) - ಕನ್ನಡ
- Gujarati (gu) - ગુજરાતી
- Telugu (te) - తెలుగు

## 🔧 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Express.js, Node.js
- **AI**: Google Gemini AI
- **Database**: PostgreSQL (production), In-memory (development)
- **Build Tool**: Vite
- **Deployment**: Netlify Functions

## 📦 Project Structure

```
zen-world/
├── client/           # React frontend
│   ├── components/   # UI components
│   ├── pages/        # Application pages
│   └── lib/          # Utilities
├── server/           # Express backend
│   ├── routes/       # API endpoints
│   └── db.ts         # Database configuration
├── shared/           # Shared types and utilities
├── netlify/          # Netlify Functions
└── public/           # Static assets
```

## 🚀 Deployment Checklist

- [ ] AI API Key configured
- [ ] Database URL set (for production)
- [ ] Environment variables added to hosting platform
- [ ] Build command set correctly
- [ ] Domain configured (if custom domain needed)
- [ ] HTTPS enabled
- [ ] Error monitoring set up (optional)

## 🐛 Troubleshooting

### Common Issues

1. **AI not working**: Check `AI_API_KEY` environment variable
2. **Database errors**: Verify `DATABASE_URL` format
3. **Build failures**: Run `npm run build` locally first
4. **CORS errors**: Check if API endpoints match frontend expectations

### Development Issues

- **Port conflicts**: Change port in `vite.config.ts`
- **Module errors**: Run `pnpm install` to reinstall dependencies
- **Type errors**: Check TypeScript configuration

## 📈 Performance Optimization

- Images are optimized and compressed
- Code splitting is enabled
- Tree shaking removes unused code
- Progressive Web App (PWA) ready
- Caching headers configured

## 🔒 Security Features

- Input validation with Zod
- XSS protection headers
- CORS configuration
- File upload size limits
- SQL injection prevention

## 📊 Analytics & Monitoring

Consider adding:
- Google Analytics
- Error tracking (Sentry)
- Performance monitoring (Vercel Analytics)
- Uptime monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Add your license here]

## 📞 Support

For support, email [your-email] or create an issue in the repository.

---

Built with ❤️ for farmers worldwide 🌱
# Blablab - Audio to Gen Z Slang Converter

A modern web application that converts audio files (English or Malayalam) into trendy Gen Z slang explanations using AI.

## Features

- 🎵 Upload audio files (MP3, WAV, M4A, WebM, OGG)
- 🌍 Automatic language detection (English/Malayalam)
- 📝 Speech-to-text transcription
- 🔥 Gen Z slang translation
- 🌙 Light/Dark mode toggle
- 📱 Responsive design
- ⚡ Handles long audio files (auto-splitting)

## Setup Instructions

### 1. Install Dependencies

\`\`\`bash
npm install
# or
yarn install
# or
pnpm install
\`\`\`

### 2. Configure Environment Variables

1. Copy the environment template:
\`\`\`bash
cp .env.example .env.local
\`\`\`

2. Get your API keys:
   - **Sarvam AI**: Visit [https://www.sarvam.ai/](https://www.sarvam.ai/) to get your API key
   - **Google Gemini**: Visit [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey) to get your API key

3. Add your API keys to `.env.local`:
\`\`\`env
SARVAM_API_KEY=your_actual_sarvam_api_key
GEMINI_API_KEY=your_actual_gemini_api_key
\`\`\`

### 3. Run the Development Server

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

\`\`\`bash
npm run build
npm run start
\`\`\`

## Usage

1. **Upload Audio**: Click the upload area or drag and drop an audio file
2. **Processing**: Watch the animated soundwave while your audio is processed
3. **Results**: View the detected language, transcription, and Gen Z translation

## Technical Details

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Fonts**: Geist Sans & Mono
- **APIs**: Sarvam AI (speech-to-text) + Google Gemini (Gen Z translation)

## File Limitations

- Maximum file size: 50MB
- Supported formats: MP3, WAV, M4A, WebM, OGG
- Long files (>30 seconds) are automatically split into chunks

## Troubleshooting

- **API Errors**: Ensure your API keys are correctly set in `.env.local`
- **Upload Issues**: Check file format and size limitations
- **Processing Fails**: Try with a shorter audio file or different format

## License

This project is for educational and personal use.

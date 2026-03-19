# LLM Council

A collaborative AI reasoning platform that brings together multiple large language models to deliberate on complex questions through a structured 3-stage process.

![LLM Council](https://img.shields.io/badge/Next.js-16-black)
![License](https://img.shields.io/badge/license-MIT-blue)

## Overview

LLM Council creates a "council" of AI models that work together to provide more thoughtful, comprehensive answers:

1. **Stage 1: Individual Responses** - Each council member (GPT-5.4 Pro, Claude Sonnet 4.6, Gemini 3.1 Pro, Grok 4.20 Beta) independently answers the question
2. **Stage 2: Peer Review** - Models anonymously rank each other's responses, creating a "Street Cred" leaderboard
3. **Stage 3: Chairman's Synthesis** - A designated chairman synthesizes all perspectives into a final, comprehensive answer

## Features

- Multi-model deliberation with real-time streaming
- Conversation history with persistent storage
- Customizable model settings (temperature, max tokens, system prompts)
- Dark/light theme support
- Responsive design for desktop and mobile
- Playwright test coverage

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **LLM API**: OpenRouter (unified API for multiple models)
- **Testing**: Playwright
- **Language**: TypeScript

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- OpenRouter API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/llm-council.git
cd llm-council
```

2. Install dependencies:
```bash
pnpm install
```

3. Create environment file:
```bash
cp .env.example .env.local
```

4. Add your OpenRouter API key to `.env.local`:
```env
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

5. Start the development server:
```bash
pnpm dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
llm-council/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── conversations/ # Conversation CRUD
│   │   ├── council/       # 3-stage deliberation endpoint
│   │   └── settings/      # Settings API
│   ├── settings/          # Settings page
│   └── page.tsx           # Main chat interface
├── components/
│   ├── council/           # Feature components
│   │   ├── council-chat.tsx
│   │   ├── history-sidebar.tsx
│   │   ├── response-tabs.tsx
│   │   ├── review-panel.tsx
│   │   └── final-response.tsx
│   └── ui/                # shadcn/ui components
├── lib/
│   ├── council.ts         # 3-stage deliberation logic
│   ├── openrouter.ts      # OpenRouter API client
│   ├── storage.ts         # JSON file persistence
│   └── types.ts           # TypeScript definitions
├── data/                  # Conversation storage (gitignored)
└── tests/                 # Playwright tests
```

## Configuration

### Model Settings

Navigate to `/settings` to customize each council member:

- **Active/Inactive**: Enable or disable models
- **Temperature**: Control response randomness (0-2)
- **Max Tokens**: Set response length limit
- **System Prompt**: Define each model's personality

### Available Models

| Model | Provider | Role |
|-------|----------|------|
| GPT-5.4 Pro | OpenAI | Council Member |
| Claude Sonnet 4.6 | Anthropic | Council Member / Chairman |
| Gemini 3.1 Pro | Google | Council Member |
| Grok 4.20 Beta | xAI | Council Member |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/conversations` | GET | List all conversations |
| `/api/conversations` | POST | Create new conversation |
| `/api/conversations/[id]` | GET | Get conversation by ID |
| `/api/conversations/[id]` | DELETE | Delete conversation |
| `/api/conversations/[id]/message` | POST | Send message (SSE streaming) |
| `/api/settings` | GET/POST | Get or save settings |

## Testing

Run Playwright tests:

```bash
# Run all tests
pnpm exec playwright test

# Run with UI
pnpm exec playwright test --ui

# Run specific test file
pnpm exec playwright test tests/ui.spec.ts
```

## Development

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint code
pnpm lint
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by [Andrej Karpathy's LLM Council concept](https://github.com/karpathy/llm-council)
- Built with [shadcn/ui](https://ui.shadcn.com/)
- Powered by [OpenRouter](https://openrouter.ai/)

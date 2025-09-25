# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Overview

This is a realtime multimodal assistant that combines voice conversations with visual perception using OpenAI's GPT-Realtime API. The system features low-latency audio streaming, intelligent frame sampling for screen/camera input, and secure session management.

## Architecture

### Core Components

**Monorepo Structure**
- `apps/backend/`: Express.js server with WebSocket support for visual relay and frame processing
- `apps/frontend/`: Next.js 14 application with WebRTC client and Tailwind UI

**Key Services**

Backend Services:
- `RealtimeSessionManager`: Manages OpenAI Realtime API sessions and ephemeral keys
- `VisualProcessingService`: Handles frame processing and compression
- `ContextManager`: Maintains sliding window context with compression triggers (128K tokens max)
- `VisualContextCache`: TTL-based caching to avoid redundant image analysis
- `ResilientConnection`: WebSocket connection management with reconnection logic
- `DualQueue`: Dual-queue system for audio/visual interruption management

Frontend Components:
- `useRealtimeSession` hook: Central state management for realtime sessions
- `AudioController`: WebRTC audio streaming management
- `VisualProcessor`: Frame sampling with change detection (1-2 FPS)
- `frameRateController`: Adaptive frame rate based on system performance

## Development Commands

### Installation
```bash
# Install all dependencies (from root)
npm install
```

### Development
```bash
# Run both frontend and backend in development mode
npm run dev:frontend  # Next.js on http://localhost:3000
npm run dev:backend   # Express on http://localhost:8080

# Or run from workspace directly
npm run dev --workspace frontend
npm run dev --workspace backend
```

### Testing
```bash
# Run all tests
npm run test

# Run specific workspace tests
npm run test --workspace backend
npm run test --workspace frontend

# Run tests with coverage
cd apps/backend && npm run test -- --coverage
cd apps/frontend && npm run test -- --coverage
```

### Building
```bash
# Build both applications
npm run build

# Build specific workspace
npm run build --workspace frontend
npm run build --workspace backend
```

### Linting
```bash
# Lint all workspaces
npm run lint

# Lint specific workspace
npm run lint --workspace frontend
npm run lint --workspace backend
```

## Environment Configuration

### Backend Environment Variables
Create `apps/backend/.env`:
```bash
OPENAI_API_KEY=sk-...          # Required: OpenAI API key
REDIS_URL=redis://localhost:6379  # Optional: Redis for session storage
PORT=8080                       # Server port (default: 8080)
FRAME_RATE_LIMIT=2             # Max frames per second
MAX_SESSIONS=100               # Maximum concurrent sessions
VISUAL_MAX_RESOLUTION=1024    # Maximum image resolution
```

### Frontend Environment Variables
Create `apps/frontend/.env.local`:
```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080  # Backend API URL
```

## WebSocket Protocol

The application uses WebSocket for visual context streaming at `/visual` endpoint:

**Message Types:**
- `frame`: Send base64-encoded frame data with source (screen/camera)
- `audio`: Audio stream data for queuing
- `interrupt`: Clear audio queues and pause visual capture
- `resume-visual`: Resume visual processing after interruption
- `visual-context`: Server response with processed visual description

## Key Design Patterns

### Context Management
- Sliding window compression triggers at 100K tokens
- Visual history maintains last 10 frames
- Automatic context pruning to stay within 128K token limit

### Frame Processing Pipeline
1. Frame capture (screen/camera) at configurable FPS
2. Change detection to avoid redundant processing
3. Hash-based caching for duplicate frames
4. Compression and resizing for optimal performance
5. OpenAI API submission with structured prompts

### Session Security
- Ephemeral API keys generated server-side
- Redis-backed session tracking
- Automatic session cleanup on disconnect
- Rate limiting and maximum session enforcement

## Testing Strategy

- Backend tests use Vitest with Node environment
- Frontend tests use Vitest with JSDOM
- Key test files:
  - `ContextManager.spec.ts`: Context window management
  - `VisualContextCache.spec.ts`: Caching logic
  - `VisualProcessingService.spec.ts`: Frame processing
  - `frameUtils.spec.ts`: Frame difference detection

## Deployment Considerations

- WebSocket support required for visual streaming
- HTTPS/WSS required for production WebRTC
- Redis recommended for production session management
- Docker Compose configuration available for containerized deployment
- PM2 ecosystem config for process management
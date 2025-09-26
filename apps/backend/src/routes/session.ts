import type { Request, Response } from 'express';
import { z } from 'zod';
import { RealtimeSessionManager } from '../services/RealtimeSessionManager.js';
import { GeminiSessionManager } from '../services/GeminiSessionManager.js';
import { SessionStore } from '../services/SessionStore.js';
import { env } from '../utils/env.js';

const sessionSchema = z.object({
  mode: z.enum(['screen', 'camera', 'hybrid']).default('screen'),
  provider: z.enum(['openai', 'gemini']).default('openai')
});

const openaiManager = new RealtimeSessionManager();
const geminiManager = new GeminiSessionManager();
const store = new SessionStore();

export const createSessionHandler = async (req: Request, res: Response) => {
  const parsed = sessionSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid request payload' });
  }

  const activeSessions = await store.count();
  if (activeSessions >= env.maxSessions) {
    return res.status(429).json({ error: 'Session limit reached, try again later' });
  }

  try {
    const manager = parsed.data.provider === 'gemini' ? geminiManager : openaiManager;
    const key = await manager.createEphemeralKey();
    await store.create({ 
      id: key.id, 
      createdAt: Date.now(), 
      lastSeen: Date.now(), 
      mode: parsed.data.mode,
      provider: parsed.data.provider 
    });
    return res.json(key);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

import { setTimeout as delay } from 'node:timers/promises';
import { env } from '../utils/env.js';
import { logger } from '../utils/logger.js';

export type GeminiEphemeralKeyResponse = {
  client_secret: {
    value: string;
    expires_at: number;
  };
  id: string;
  provider: 'gemini';
};

const MAX_RETRIES = 3;

export class GeminiSessionManager {
  async createEphemeralKey(): Promise<GeminiEphemeralKeyResponse> {
    const geminiApiKey = env.geminiApiKey || process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY is required to mint Gemini ephemeral keys');
    }

    // For Gemini, we can use the API key directly as an ephemeral token
    // since it's passed via URL parameters in the WebSocket connection
    // In production, you'd want to implement proper token generation
    
    // Create a pseudo-ephemeral token (for now, we'll use the API key)
    // In production, implement proper OAuth2 or service account flow
    const expiresAt = Date.now() + 3600 * 1000; // 1 hour from now
    
    return {
      client_secret: {
        value: geminiApiKey,
        expires_at: expiresAt
      },
      id: `gemini_session_${Date.now()}`,
      provider: 'gemini'
    };
  }

  async validateApiKey(): Promise<boolean> {
    const geminiApiKey = env.geminiApiKey || process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return false;
    }

    try {
      // Test the API key by making a simple request
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response.ok;
    } catch (error) {
      logger.error('Failed to validate Gemini API key', { error });
      return false;
    }
  }
}
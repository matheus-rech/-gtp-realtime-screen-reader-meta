import { setTimeout as delay } from 'node:timers/promises';
import { env } from '../utils/env.js';
import { logger } from '../utils/logger.js';

export type EphemeralKeyResponse = {
  client_secret: {
    value: string;
    expires_at: number;
  };
  id: string;
};

const MAX_RETRIES = 3;

export class RealtimeSessionManager {
  async createEphemeralKey(): Promise<EphemeralKeyResponse> {
    if (!env.openAiApiKey) {
      throw new Error('OPENAI_API_KEY is required to mint ephemeral keys');
    }

    for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
      try {
        const response = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.openAiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            session: {
              model: env.openAiRealtimeModel || 'gpt-4o-realtime-preview-2024-12-17',
              voice: 'alloy',
              instructions: 'You are a multimodal assistant with persistent visual memory. You can see the user screen and camera.',
              modalities: ['text', 'audio'],
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              turn_detection: {
                type: 'server_vad'
              }
            }
          })
        });

        if (!response.ok) {
          const payload = await response.text();
          throw new Error(`Failed to create ephemeral key: ${response.status} ${payload}`);
        }

        return (await response.json()) as EphemeralKeyResponse;

      } catch (error) {
        logger.error('Error creating ephemeral key', { error, attempt });
        if (attempt === MAX_RETRIES - 1) {
          throw error;
        }
        await delay(250 * (attempt + 1));
      }
    }

    throw new Error('Unable to create ephemeral key');
  }
}

// OpenAI Realtime API Client
export class RealtimeClient extends EventTarget {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private model: string;
  private sessionId: string | null = null;
  private isConnected: boolean = false;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(config: { apiKey: string; model?: string }) {
    super();
    this.apiKey = config.apiKey;
    this.model = config.model || 'gpt-4o-realtime-preview-2024-12-17';
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    // Build the WebSocket URL with the model parameter
    const params = new URLSearchParams({
      model: this.model
    });
    
    // For ephemeral tokens, OpenAI expects them in the Authorization header
    // Since browser WebSocket doesn't support headers, we pass it as a query parameter
    const url = `wss://api.openai.com/v1/realtime?${params.toString()}`;
    
    try {
      // Browser WebSocket with subprotocols for OpenAI Realtime API
      // The ephemeral token is passed via subprotocol
      this.ws = new WebSocket(url, [
        `openai-insecure-api-key.${this.apiKey}`,
        'openai-beta.realtime-v1'
      ]);
      
      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('Connected to OpenAI Realtime API');
        this.emit('connected', {});
        
        // Start ping interval to keep connection alive
        this.startPingInterval();
        
        // Session configuration update
        this.send({
          type: 'session.update',
          session: {
            modalities: ['text', 'audio'],
            instructions: 'You are a helpful, witty, and friendly AI assistant. Always be concise and helpful.',
            voice: 'alloy',
            input_audio_format: 'pcm16',
            output_audio_format: 'pcm16',
            input_audio_transcription: {
              model: 'whisper-1'
            },
            turn_detection: {
              type: 'server_vad',
              threshold: 0.5,
              prefix_padding_ms: 300,
              silence_duration_ms: 500
            },
            temperature: 0.8,
            max_response_output_tokens: 4096
          }
        });
      };

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received:', data.type);
      
      // Emit the raw event first
      this.emit(data.type, data);
      
      // Handle different message types
      switch (data.type) {
        case 'session.created':
        case 'session.updated':
          this.sessionId = data.session?.id || this.sessionId;
          break;
          
        case 'conversation.item.created':
          this.emit('conversation.item.created', data);
          break;
          
        case 'response.text.delta':
        case 'response.audio_transcript.delta':
        case 'response.output_item.delta':
          this.emit('response.delta', {
            delta: {
              type: 'output_text.delta',
              text: data.delta?.text || data.delta
            }
          });
          break;
          
        case 'response.text.done':
        case 'response.audio_transcript.done':
        case 'response.output_item.done':
        case 'response.done':
          this.emit('response.completed', {
            response: {
              latency_ms: data.response?.latency_ms || 0
            }
          });
          break;
          
        case 'error':
          console.error('Realtime API error:', data.error);
          this.emit('error', data.error);
          break;
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };

    this.ws.onclose = (event) => {
      this.isConnected = false;
      console.log('Disconnected from OpenAI Realtime API', event.code, event.reason);
      this.emit('disconnected', { code: event.code, reason: event.reason });
      
      // Auto-reconnect for unexpected disconnections
      if (event.code !== 1000 && event.code !== 1001) {
        console.log('Unexpected disconnection, will attempt reconnect...');
        setTimeout(() => {
          if (!this.isConnected) {
            this.connect().catch(console.error);
          }
        }, 2000);
      }
    };
    } catch (error) {
      console.error('Failed to connect:', error);
      this.isConnected = false;
      throw error;
    }
  }

  disconnect(): void {
    this.stopPingInterval();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  private startPingInterval(): void {
    this.stopPingInterval();
    // Send a ping every 30 seconds to keep the connection alive
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // OpenAI Realtime API doesn't have a specific ping, but we can send an empty message
        // or just check the connection state
        console.log('Connection still active');
      }
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  sendRealtime(data: any): void {
    this.send(data);
  }

  sendUserMessageContent(content: any): void {
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: Array.isArray(content) ? content : [{ type: 'text', text: content }]
      }
    });
    
    // Trigger response
    this.send({ type: 'response.create' });
  }

  on(event: string, callback: Function): void {
    this.addEventListener(event, callback as any);
  }

  emit(event: string, data: any): void {
    this.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  appendInputAudio(base64Audio: string): void {
    this.send({
      type: 'input_audio_buffer.append',
      audio: base64Audio
    });
  }

  commitInputAudio(): void {
    this.send({
      type: 'input_audio_buffer.commit'
    });
  }

  clearInputAudio(): void {
    this.send({
      type: 'input_audio_buffer.clear'
    });
  }
}
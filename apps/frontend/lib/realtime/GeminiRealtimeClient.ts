// Gemini Live API Client
export class GeminiRealtimeClient extends EventTarget {
  private ws: WebSocket | null = null;
  private apiKey: string;
  private model: string;
  private sessionId: string | null = null;
  private isConnected: boolean = false;
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(config: { apiKey: string; model?: string }) {
    super();
    this.apiKey = config.apiKey;
    this.model = config.model || 'gemini-2.0-flash-exp';
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    // Gemini Live API WebSocket endpoint
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent`;
    
    try {
      // Connect with API key in URL parameters for Gemini
      const params = new URLSearchParams({
        key: this.apiKey,
        alt: 'sse'
      });
      
      this.ws = new WebSocket(`${url}?${params.toString()}`);
      
      this.ws.onopen = () => {
        this.isConnected = true;
        console.log('Connected to Gemini Live API');
        this.emit('connected', {});
        
        // Start ping interval to keep connection alive
        this.startPingInterval();
        
        // Send initial setup message for Gemini
        this.send({
          setup: {
            model: this.model,
            generation_config: {
              response_modalities: ['TEXT', 'AUDIO'],
              speech_config: {
                voice_config: {
                  prebuilt_voice_config: {
                    voice_name: 'Aoede' // Gemini's voice option
                  }
                }
              }
            },
            system_instruction: {
              parts: [{
                text: 'You are a helpful, witty, and friendly AI assistant. You can see the user\'s screen and camera. Always be concise and helpful.'
              }]
            },
            tools: []
          }
        });
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('Received from Gemini:', data);
        
        // Handle Gemini-specific message types
        if (data.setupComplete) {
          this.sessionId = data.sessionId;
          console.log('Gemini session established:', this.sessionId);
        }
        
        // Handle server events (audio/text responses)
        if (data.serverContent) {
          const content = data.serverContent;
          
          // Handle text responses
          if (content.modelTurn?.parts) {
            content.modelTurn.parts.forEach((part: any) => {
              if (part.text) {
                this.emit('response.delta', {
                  delta: {
                    type: 'output_text.delta',
                    text: part.text
                  }
                });
              }
              if (part.inlineData?.mimeType?.startsWith('audio/')) {
                // Handle audio data
                this.emit('audio.delta', {
                  audio: part.inlineData.data,
                  mimeType: part.inlineData.mimeType
                });
              }
            });
          }
          
          if (content.turnComplete) {
            this.emit('response.completed', {
              response: {
                latency_ms: Date.now() - (this.lastRequestTime || Date.now())
              }
            });
          }
        }
        
        // Handle tool calls
        if (data.toolCall) {
          this.emit('tool.call', data.toolCall);
        }
        
        // Handle errors
        if (data.error) {
          console.error('Gemini API error:', data.error);
          this.emit('error', data.error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', error);
      };

      this.ws.onclose = (event) => {
        this.isConnected = false;
        console.log('Disconnected from Gemini Live API', event.code, event.reason);
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
      console.error('Failed to connect to Gemini:', error);
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
        // Send a keep-alive message
        this.send({ keepAlive: true });
      }
    }, 30000);
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private lastRequestTime: number | null = null;

  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.lastRequestTime = Date.now();
      this.ws.send(JSON.stringify(data));
    }
  }

  sendRealtime(data: any): void {
    // Adapter method for compatibility
    this.send(data);
  }

  sendUserMessageContent(content: any): void {
    const message = {
      clientContent: {
        turns: [{
          role: 'user',
          parts: Array.isArray(content) 
            ? content.map((c: any) => ({ text: c.text || c }))
            : [{ text: content }]
        }],
        turnComplete: true
      }
    };
    this.send(message);
  }

  on(event: string, callback: Function): void {
    this.addEventListener(event, callback as any);
  }

  emit(event: string, data: any): void {
    this.dispatchEvent(new CustomEvent(event, { detail: data }));
  }

  appendInputAudio(audioData: string, mimeType: string = 'audio/pcm;rate=16000'): void {
    this.send({
      realtimeInput: {
        mediaChunks: [{
          mimeType,
          data: audioData
        }]
      }
    });
  }

  commitInputAudio(): void {
    // Gemini handles audio differently - it processes chunks as they arrive
    // This is here for API compatibility
    console.log('Audio committed (Gemini processes automatically)');
  }

  clearInputAudio(): void {
    // Send an empty audio chunk to clear
    this.send({
      realtimeInput: {
        mediaChunks: []
      }
    });
  }
}
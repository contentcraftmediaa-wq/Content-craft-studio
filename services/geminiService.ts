
import { GoogleGenAI, Modality, Type, GenerateContentResponse, ThinkingLevel } from "@google/genai";
import { 
  MODEL_TEXT_FAST, 
  MODEL_TEXT_PRO, 
  MODEL_IMAGE_GEN_PAID,
  MODEL_VIDEO_GEN,
  MODEL_VIDEO_ANALYSIS,
  MODEL_AUDIO_TRANSCRIPTION,
  MODEL_TTS,
  MODEL_LIVE
} from "../constants";
import { ImageAspectRatio, ImageSize, VideoAspectRatio } from "../types";

// --- Helper: File to Base64 ---
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

// --- Helper: Audio Decoding ---
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- Service Class ---

class GeminiService {
  private apiKey: string = '';
  private customApiKey: string = '';

  constructor() {
      // 1. Try LocalStorage (Persistence for deployed apps)
      if (typeof localStorage !== 'undefined') {
          const stored = localStorage.getItem('GEMINI_API_KEY');
          if (stored) {
              this.apiKey = stored;
          }
      }

      // 2. Fallback to Environment if no local key
      const globalProcess = (typeof window !== 'undefined' ? window.process : typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined);
      if (!this.apiKey && globalProcess && globalProcess.env && globalProcess.env.API_KEY) {
          this.apiKey = globalProcess.env.API_KEY;
      }
  }

  // Allow manual override and Persistence
  setApiKey(key: string) {
      this.customApiKey = key;
      this.apiKey = key;
      if (typeof localStorage !== 'undefined') {
          if (key) {
              localStorage.setItem('GEMINI_API_KEY', key);
          } else {
              localStorage.removeItem('GEMINI_API_KEY');
          }
      }
  }

  hasApiKey(): boolean {
      return !!this.apiKey || !!this.customApiKey;
  }

  private getAi() {
    let envKey = '';
    const globalProcess = (typeof window !== 'undefined' ? window.process : typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined);
    if (globalProcess && globalProcess.env) {
        envKey = globalProcess.env.API_KEY || globalProcess.env.GEMINI_API_KEY || '';
    }
    const key = this.customApiKey || envKey || this.apiKey;
    if (!key) {
        throw new Error("API Key is missing. Please set it in Settings.");
    }
    return new GoogleGenAI({ apiKey: key });
  }

  private async retryWithBackoff<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
    try {
        return await fn();
    } catch (e: any) {
        const msg = e.message || e.toString();
        // Retry on Overloaded (503), Deadline Exceeded (Timeout), or Gateway Timeout (504)
        if (retries > 0 && (
            msg.includes('503') || 
            msg.includes('Overloaded') || 
            msg.includes('Deadline expired') || 
            msg.includes('504')
        )) {
            console.warn(`API Error (${msg}). Retrying in ${delay}ms... (${retries} attempts left)`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return this.retryWithBackoff(fn, retries - 1, delay * 2);
        }
        throw e;
    }
  }

  // 1. Text Generation
  async generateText(prompt: string, usePro: boolean = false, systemInstruction?: string, jsonMode: boolean = false, responseSchema?: any) {
    const ai = this.getAi();
    const model = usePro ? MODEL_TEXT_PRO : MODEL_TEXT_FAST;
    
    const config: any = {
      systemInstruction: systemInstruction || "You are a world-class expert copywriter and marketing strategist for Content Craft Studio.",
    };

    if (jsonMode) {
        config.responseMimeType = "application/json";
    }
    if (responseSchema) {
        config.responseSchema = responseSchema;
    }

    const response = await this.retryWithBackoff(async () => {
        return await ai.models.generateContent({
            model,
            contents: prompt,
            config
        });
    });
    return response.text;
  }

  // 1.5 Web Research (Google Search Grounding)
  async researchWithWeb(query: string): Promise<string> {
    const ai = this.getAi();
    try {
        const response = await this.retryWithBackoff(async () => {
            return await ai.models.generateContent({
                model: MODEL_TEXT_FAST, 
                contents: query,
                config: {
                    tools: [{ googleSearch: {} }] 
                }
            });
        });
        // Check for grounding metadata or text
        const text = response.text;
        if (!text) {
             const grounding = response.candidates?.[0]?.groundingMetadata;
             if (grounding && grounding.groundingChunks) {
                 return "Found grounding data but no summary text. Please infer from context.";
             }
             return "No search results found.";
        }
        return text;
    } catch (e: any) {
        console.warn("Search grounding failed:", e);
        return "Search unavailable. Please try again."; 
    }
  }

  // 1.6 Maps Research (Google Maps Grounding)
  async researchWithMaps(query: string): Promise<string> {
    const ai = this.getAi();
    try {
        const response = await this.retryWithBackoff(async () => {
             return await ai.models.generateContent({
                model: MODEL_TEXT_FAST,
                contents: query,
                config: {
                    tools: [{ googleMaps: {} }]
                }
            });
        });
        return response.text || "No maps data found.";
    } catch (e: any) {
        console.warn("Maps grounding failed:", e);
        return "";
    }
  }

  // 2. Image Generation
  async generateImage(prompt: string, aspectRatio: ImageAspectRatio, model: string, size?: ImageSize) {
    const ai = this.getAi();
    
    const imageConfig: any = { aspectRatio };
    if (model === MODEL_IMAGE_GEN_PAID && size) {
        imageConfig.imageSize = size;
    }

    const response = await this.retryWithBackoff(async () => {
        return await ai.models.generateContent({
            model: model,
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig }
        });
    });

    const images: string[] = [];
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
        }
      }
    }

    if (images.length === 0) {
        throw new Error("No images were generated. The model may have blocked the prompt.");
    }

    return images;
  }

  // 3. Image Editing
  async editImage(base64Image: string, mimeType: string, prompt: string, model: string) {
    const ai = this.getAi();
    const response = await this.retryWithBackoff(async () => {
        return await ai.models.generateContent({
            model: model, 
            contents: {
                parts: [
                { inlineData: { mimeType: mimeType, data: base64Image } },
                { text: prompt }
                ]
            }
        });
    });

    const images: string[] = [];
    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            images.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
        }
      }
    }

    if (images.length === 0) throw new Error("No edited images generated.");
    return images;
  }

  // 4. Video Generation (Veo)
  async generateVideo(prompt: string, aspectRatio: VideoAspectRatio, imageBase64?: string, imageMimeType?: string) {
    const ai = this.getAi();
    
    const requestConfig: any = {
        numberOfVideos: 1,
        resolution: '720p', 
        aspectRatio: aspectRatio
    };

    let operation;

    try {
        if (imageBase64 && imageMimeType) {
            operation = await ai.models.generateVideos({
                model: MODEL_VIDEO_GEN,
                prompt: prompt,
                image: { imageBytes: imageBase64, mimeType: imageMimeType },
                config: requestConfig
            });
        } else {
            operation = await ai.models.generateVideos({
                model: MODEL_VIDEO_GEN,
                prompt: prompt,
                config: requestConfig
            });
        }
    } catch (e: any) {
        const msg = e.message || e.toString();
        if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
             throw new Error("Quota Exceeded (429): The video model daily limit has been reached for this API key.");
        }
        throw new Error(`Video request failed: ${msg}`);
    }

    let attempts = 0;
    while (!operation.done) {
      if (attempts > 60) throw new Error("Video generation timed out."); 
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      try {
          operation = await ai.operations.getVideosOperation({ operation: operation });
      } catch (e) { console.warn("Polling error:", e); }

      if (operation.error) {
          const errMsg = operation.error.message || 'Unknown error';
          if (errMsg.includes('429') || errMsg.includes('RESOURCE_EXHAUSTED')) {
              throw new Error("Quota Exceeded (429): The video model daily limit has been reached.");
          }
          throw new Error(`Video Generation Failed: ${errMsg}`);
      }
      attempts++;
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("Video generated but no download URI returned.");

    // Critical: Ensure key exists for download URL construction in deployed apps
    let envKey = '';
    // Bypass Vite's static replacement of process.env
    const globalProcess = (typeof window !== 'undefined' ? window.process : typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined);
    if (globalProcess && globalProcess.env) {
        envKey = globalProcess.env.API_KEY || globalProcess.env.GEMINI_API_KEY || '';
    }
    const activeKey = this.customApiKey || envKey || this.apiKey;
    if (!activeKey) {
        throw new Error("API Key missing. Cannot download video. Please set it in Settings.");
    }

    try {
        const response = await fetch(downloadLink, {
            method: 'GET',
            headers: {
                'x-goog-api-key': activeKey,
            },
        });
        if (!response.ok) throw new Error(`Fetch failed: ${response.status}`);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (e) {
        console.warn("Falling back to direct URL", e);
        return downloadLink;
    }
  }

  // 5. Text to Speech
  async generateSpeech(text: string, voiceName: string) {
    const ai = this.getAi();
    const response = await this.retryWithBackoff(async () => {
        return await ai.models.generateContent({
            model: MODEL_TTS,
            contents: { parts: [{ text }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName }
                }
                }
            }
        });
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated.");
    return base64Audio; 
  }

  // 6. Multimodal Analysis
  async analyzeContent(prompt: string, mediaBase64: string, mimeType: string) {
      const ai = this.getAi();
      const response = await this.retryWithBackoff(async () => {
          return await ai.models.generateContent({
              model: MODEL_VIDEO_ANALYSIS, 
              contents: {
                  parts: [
                      { inlineData: { data: mediaBase64, mimeType: mimeType } },
                      { text: prompt }
                  ]
              }
          });
      });
      return response.text;
  }

  // 7. Transcription
  async transcribeMedia(file?: File, url?: string) {
      const ai = this.getAi();
      const transcriptionPrompt = "Transcribe the audio from this file accurately.";
      let response;

      if (file) {
          const base64 = await fileToBase64(file);
          response = await this.retryWithBackoff(async () => {
              return await ai.models.generateContent({
                  model: MODEL_AUDIO_TRANSCRIPTION,
                  contents: {
                      parts: [
                          { inlineData: { data: base64, mimeType: file.type } },
                          { text: transcriptionPrompt }
                      ]
                  }
              });
          });
      } else if (url) {
          response = await this.retryWithBackoff(async () => {
              return await ai.models.generateContent({
                  model: MODEL_TEXT_PRO, 
                  contents: `Please transcribe the content from this URL: ${url}. ${transcriptionPrompt}`
              });
          });
      }
      return response?.text;
  }

  // 8. Live API
  async connectLive(onAudioData: (buffer: AudioBuffer) => void, onClose: () => void) {
    const ai = this.getAi();
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});

    const session = await ai.live.connect({
      model: MODEL_LIVE,
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: {prebuiltVoiceConfig: {voiceName: 'Puck'}} },
        systemInstruction: "You are a helpful creative assistant."
      },
      callbacks: {
        onopen: () => console.log("Live session connected"),
        onmessage: async (message) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio) {
                const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                onAudioData(audioBuffer);
            }
        },
        onclose: () => { console.log("Closed"); onClose(); },
        onerror: (err) => { console.error("Error", err); onClose(); }
      }
    });

    return session;
  }

  // 9. Strategic Thinking
  async generateDeepAnalysis(prompt: string, mapData?: string, webData?: string) {
    const ai = this.getAi();
    
    let contextBlock = "";
    if (mapData) {
        contextBlock += `\n=== GOOGLE MAPS & REVIEWS DATA ===\n${mapData}\n`;
    }
    if (webData) {
        contextBlock += `\n=== WEB RESEARCH & COMPETITOR DATA ===\n${webData}\n`;
    }

    const finalContents = `
    ${contextBlock}
    
    === TASK ===
    ${prompt}
    
    === FORMATTING RULES ===
    1. Use clearly defined Markdown headings (##, ###).
    2. Add emoji bullets for readability.
    3. SEPARATE sections with spacing. Do NOT be compact.
    4. Ensure the "Google Reviews" and "Competitor Analysis" sections are detailed.
    `;

    const response = await this.retryWithBackoff(async () => {
        return await ai.models.generateContent({
            model: MODEL_TEXT_PRO,
            contents: finalContents,
            config: { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } }
        });
    });
    return response.text;
  }
}

export const geminiService = new GeminiService();

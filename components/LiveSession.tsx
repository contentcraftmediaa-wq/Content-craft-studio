
import React, { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Power, Radio, AlertCircle, Volume2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';

const LiveSession: React.FC = () => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  
  // Audio Refs
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const nextStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Visualizer Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputGainRef = useRef<GainNode | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        stopSession();
    };
  }, []);

  // Handle Visualizer State
  useEffect(() => {
      if (status === 'connected') {
          drawVisualizer();
      } else if (status === 'idle' || status === 'error') {
           if (animationRef.current) {
               cancelAnimationFrame(animationRef.current);
               animationRef.current = null;
           }
           // Clear canvas and draw idle state
           const canvas = canvasRef.current;
           const ctx = canvas?.getContext('2d');
           if (canvas && ctx) {
               const dpr = window.devicePixelRatio || 1;
               const rect = canvas.getBoundingClientRect();
               canvas.width = rect.width * dpr;
               canvas.height = rect.height * dpr;
               ctx.scale(dpr, dpr);
               ctx.clearRect(0, 0, rect.width, rect.height);
               drawIdleState(ctx, rect.width, rect.height);
           }
      }
  }, [status]);

  const drawIdleState = (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const centerX = w / 2;
      const centerY = h / 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 60, 0, 2 * Math.PI);
      ctx.strokeStyle = '#334155'; // slate-700
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
  };

  const drawVisualizer = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const width = rect.width;
    const height = rect.height;
    
    const bufferLength = 32; // Number of bars
    const dataArrayInput = new Uint8Array(bufferLength);
    const dataArrayOutput = new Uint8Array(bufferLength);

    const renderFrame = () => {
        animationRef.current = requestAnimationFrame(renderFrame);
        
        // Get Data
        if (inputAnalyserRef.current) inputAnalyserRef.current.getByteFrequencyData(dataArrayInput);
        if (outputAnalyserRef.current) outputAnalyserRef.current.getByteFrequencyData(dataArrayOutput);

        ctx.clearRect(0, 0, width, height);

        const centerX = width / 2;
        const centerY = height / 2;
        const radius = 80;
        
        // Draw Center Circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius - 10, 0, 2 * Math.PI);
        ctx.fillStyle = '#0f172a'; // slate-950
        ctx.fill();
        ctx.strokeStyle = '#1e293b'; // slate-800
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Bars
        const barWidth = (2 * Math.PI * radius) / bufferLength;
        
        for (let i = 0; i < bufferLength; i++) {
            // Simple mixing logic: use whichever is louder
            const valIn = dataArrayInput[i];
            const valOut = dataArrayOutput[i];
            
            // Normalize 0-1
            const nIn = valIn / 255;
            const nOut = valOut / 255;

            let mag = 0;
            let color = '#334155'; // default slate

            if (nOut > nIn && nOut > 0.1) {
                mag = nOut;
                color = '#ef4444'; // red-500 (AI)
            } else if (nIn > 0.1) {
                mag = nIn;
                color = '#ffffff'; // white (User)
            } else {
                mag = 0.02; // idle hum
            }

            const barLen = mag * 100; // max length 100px

            const angle = (i / bufferLength) * 2 * Math.PI - (Math.PI / 2); 
            
            const x1 = centerX + Math.cos(angle) * radius;
            const y1 = centerY + Math.sin(angle) * radius;
            const x2 = centerX + Math.cos(angle) * (radius + barLen);
            const y2 = centerY + Math.sin(angle) * (radius + barLen);

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.strokeStyle = color;
            
            // Glow effect for loud sounds
            if (mag > 0.2) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = color;
            } else {
                ctx.shadowBlur = 0;
            }
            
            ctx.stroke();
            ctx.shadowBlur = 0;
        }
        
        // Inner Icon Pulse (Representing Activity)
        const maxVol = Math.max(...dataArrayInput, ...dataArrayOutput) / 255;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 20 + (maxVol * 15), 0, 2 * Math.PI);
        ctx.fillStyle = maxVol > 0.1 ? (Math.max(...dataArrayOutput) > Math.max(...dataArrayInput) ? '#b91c1c' : '#f8fafc') : '#334155';
        ctx.fill();
    };

    renderFrame();
  };

  const startSession = async () => {
    if (status === 'connected' || status === 'connecting') return;
    
    setStatus('connecting');
    setError(null);

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      
      // 1. Output Context
      outputContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      if (outputContextRef.current.state === 'suspended') {
          await outputContextRef.current.resume();
      }
      const outCtx = outputContextRef.current;
      
      // Create Output Graph: Gain -> Analyser -> Destination
      outputGainRef.current = outCtx.createGain();
      outputAnalyserRef.current = outCtx.createAnalyser();
      outputAnalyserRef.current.fftSize = 64;
      outputAnalyserRef.current.smoothingTimeConstant = 0.5;
      
      outputGainRef.current.connect(outputAnalyserRef.current);
      outputAnalyserRef.current.connect(outCtx.destination);

      // 2. Input Context
      inputContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      if (inputContextRef.current.state === 'suspended') {
          await inputContextRef.current.resume();
      }
      const inCtx = inputContextRef.current;
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Create Input Graph: Source -> Analyser -> ScriptProcessor -> Destination
      const source = inCtx.createMediaStreamSource(stream);
      inputAnalyserRef.current = inCtx.createAnalyser();
      inputAnalyserRef.current.fftSize = 64;
      inputAnalyserRef.current.smoothingTimeConstant = 0.5;
      
      const processor = inCtx.createScriptProcessor(4096, 1, 1);
      
      source.connect(inputAnalyserRef.current);
      inputAnalyserRef.current.connect(processor);
      processor.connect(inCtx.destination);

      // 3. Connect Gemini
      const session = await geminiService.connectLive(
        (audioBuffer) => {
           if (!outputContextRef.current || !outputGainRef.current) return;
           if (outputContextRef.current.state === 'closed') return;

           const source = outputContextRef.current.createBufferSource();
           source.buffer = audioBuffer;
           // Connect to Gain (which goes to Analyser) instead of destination directly
           source.connect(outputGainRef.current);
           
           const now = outputContextRef.current.currentTime;
           const start = Math.max(nextStartTimeRef.current, now);
           source.start(start);
           nextStartTimeRef.current = start + audioBuffer.duration;
        },
        () => {
            // Server closed connection
            stopSession();
        }
      );

      sessionRef.current = session;

      // 4. Input Processing Loop
      processor.onaudioprocess = (e) => {
          if (!sessionRef.current) return;

          const inputData = e.inputBuffer.getChannelData(0);
          // Convert float32 to int16
          const l = inputData.length;
          const int16 = new Int16Array(l);
          for (let i = 0; i < l; i++) {
            int16[i] = inputData[i] * 32768;
          }
          
          // Convert to base64
          const uint8 = new Uint8Array(int16.buffer);
          let binary = '';
          const len = uint8.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(uint8[i]);
          }
          const b64 = btoa(binary);

          sessionRef.current.sendRealtimeInput({
              media: {
                  mimeType: 'audio/pcm;rate=16000',
                  data: b64
              }
          });
      };

      setStatus('connected');

    } catch (err: any) {
      console.error("Live Session Error:", err);
      
      let msg = "Could not connect.";
      if (err.message?.includes("NetworkError") || err.message?.includes("Failed to fetch")) {
          msg = "Network Error: Check connection or firewall.";
      } else if (err.name === "NotAllowedError" || err.message?.includes("Permission")) {
          msg = "Microphone permission denied.";
      } else {
          msg = "Connection failed. Please try again.";
      }
      
      setError(msg);
      setStatus('error');
      stopSession();
    }
  };

  const stopSession = () => {
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
      }
      if (inputContextRef.current) {
           inputContextRef.current.close();
           inputContextRef.current = null;
      }
      if (outputContextRef.current) {
           outputContextRef.current.close();
           outputContextRef.current = null;
      }
      
      sessionRef.current = null;
      nextStartTimeRef.current = 0;
      
      // If we were connected, go to idle. If error, stay error.
      setStatus(prev => (prev === 'error' ? 'error' : 'idle'));
  };

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      {/* Header / Status Bar */}
      <header className="flex items-center justify-between mb-8 bg-slate-900/50 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${status === 'connected' ? 'bg-red-500/20 text-red-500' : 'bg-slate-800 text-slate-400'}`}>
                <Radio className={`w-6 h-6 ${status === 'connected' ? 'animate-pulse' : ''}`} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-white">Live Assistant</h2>
                <p className="text-xs text-slate-400">Gemini 2.5 Flash • Native Audio</p>
            </div>
        </div>

        <div className="flex items-center gap-3">
             <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
                 status === 'connected' ? 'bg-red-900/20 border-red-900 text-red-400' :
                 status === 'connecting' ? 'bg-yellow-900/20 border-yellow-900 text-yellow-400' :
                 'bg-slate-800 border-slate-700 text-slate-500'
             }`}>
                 <div className={`w-2 h-2 rounded-full ${
                     status === 'connected' ? 'bg-red-500 animate-pulse' :
                     status === 'connecting' ? 'bg-yellow-500 animate-bounce' :
                     'bg-slate-500'
                 }`} />
                 {status === 'connected' ? 'LIVE' : status === 'connecting' ? 'CONNECTING' : 'OFFLINE'}
             </div>
        </div>
      </header>

      {/* Main Visualizer Area */}
      <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 relative overflow-hidden shadow-inner min-h-[400px]">
          <canvas 
             ref={canvasRef} 
             className="absolute inset-0 w-full h-full"
          />
          
          {/* Center Overlay Content if needed */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-12 pointer-events-none">
              {error && (
                  <div className="mb-8 p-3 bg-red-900/80 text-red-200 rounded-lg text-sm flex items-center gap-2 border border-red-700 backdrop-blur-md animate-in slide-in-from-bottom-5 pointer-events-auto">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                  </div>
              )}

              <div className="pointer-events-auto">
                  <button
                    onClick={status === 'connected' ? stopSession : startSession}
                    disabled={status === 'connecting'}
                    className={`group relative flex items-center justify-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all transform hover:scale-105 ${
                        status === 'connected'
                        ? 'bg-slate-700 hover:bg-slate-600 text-white border border-slate-600' 
                        : 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_30px_rgba(220,38,38,0.4)]'
                    } disabled:opacity-70 disabled:scale-100 disabled:cursor-wait`}
                  >
                    {status === 'connected' ? (
                        <>
                            <MicOff className="w-5 h-5" />
                            End Session
                        </>
                    ) : status === 'connecting' ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Connecting...
                        </>
                    ) : (
                        <>
                            <Power className="w-5 h-5" />
                            Start Live Chat
                        </>
                    )}
                  </button>
                  
                  {status === 'idle' && (
                      <p className="text-slate-500 text-xs text-center mt-4">
                          Click to start a real-time voice conversation
                      </p>
                  )}
              </div>
          </div>
          
          {/* Labels for User/AI */}
          <div className="absolute bottom-4 left-6 text-white text-xs font-bold tracking-wider opacity-50 pointer-events-none">
              USER INPUT
          </div>
          <div className="absolute bottom-4 right-6 text-red-500 text-xs font-bold tracking-wider opacity-50 pointer-events-none">
              GEMINI OUTPUT
          </div>
      </div>
    </div>
  );
};

export default LiveSession;

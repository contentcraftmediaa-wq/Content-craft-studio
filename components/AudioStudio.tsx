
import React, { useState, useRef } from 'react';
import { geminiService, decodeAudioData } from '../services/geminiService';
import { PREBUILT_VOICES } from '../constants';
import { Mic, Play, FileAudio, Volume2, Loader2, Download, Upload, Link, Copy, Check } from 'lucide-react';

const bufferToWav = (buffer: AudioBuffer): Blob => {
    const numOfChan = buffer.numberOfChannels;
    const length = buffer.length * numOfChan * 2 + 44;
    const bufferArr = new ArrayBuffer(length);
    const view = new DataView(bufferArr);
    let pos = 0;
    const setUint16 = (data: number) => { view.setUint16(pos, data, true); pos += 2; };
    const setUint32 = (data: number) => { view.setUint32(pos, data, true); pos += 4; };
    setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157); setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan); setUint32(buffer.sampleRate); setUint32(buffer.sampleRate * 2 * numOfChan); setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164); setUint32(length - pos - 4);
    const channels = []; for (let i = 0; i < numOfChan; i++) { channels.push(buffer.getChannelData(i)); }
    for (let i = 0; i < buffer.length; i++) { for (let j = 0; j < numOfChan; j++) { const sample = Math.max(-1, Math.min(1, channels[j][i])); view.setInt16(pos, sample * 0x7FFF, true); pos += 2; } }
    return new Blob([view], { type: 'audio/wav' });
};

interface AudioStudioProps {
  onRequireApiKey: () => void;
}

const AudioStudio: React.FC<AudioStudioProps> = ({ onRequireApiKey }) => {
  const [mode, setMode] = useState<'tts' | 'transcribe'>('tts');
  const [text, setText] = useState('');
  const [voice, setVoice] = useState('Puck');
  const [loadingTTS, setLoadingTTS] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [transcriptionFile, setTranscriptionFile] = useState<File | null>(null);
  const [transcriptionUrl, setTranscriptionUrl] = useState('');
  const [transcriptionResult, setTranscriptionResult] = useState('');
  const [loadingTranscription, setLoadingTranscription] = useState(false);
  const [copied, setCopied] = useState(false);

  const checkKey = () => {
    if (!geminiService.hasApiKey()) {
        onRequireApiKey();
        return false;
    }
    return true;
  };

  const handleTTS = async () => {
    if (!text || !checkKey()) return;
    setLoadingTTS(true);
    setAudioBuffer(null);
    try {
        const base64Audio = await geminiService.generateSpeech(text, voice);
        if (!audioContextRef.current) {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
        }
        const decodedString = atob(base64Audio);
        const bytes = new Uint8Array(decodedString.length);
        for (let i = 0; i < decodedString.length; i++) { bytes[i] = decodedString.charCodeAt(i); }
        const buffer = await decodeAudioData(bytes, audioContextRef.current, 24000, 1);
        setAudioBuffer(buffer);
    } catch (e: any) {
        console.error(e);
        if (e.message?.includes("API Key")) onRequireApiKey();
        else alert("Text-to-Speech failed. Please check settings.");
    } finally {
        setLoadingTTS(false);
    }
  };

  const playAudio = () => {
      if (!audioBuffer || !audioContextRef.current) return;
      if (audioContextRef.current.state === 'suspended') audioContextRef.current.resume();
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start(0);
  };

  const downloadAudio = () => {
      if (!audioBuffer) return;
      const wavBlob = bufferToWav(audioBuffer);
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a'); a.href = url; a.download = `content-craft-audio-${Date.now()}.wav`; document.body.appendChild(a); a.click(); window.URL.revokeObjectURL(url); document.body.removeChild(a);
  };

  const handleTranscribe = async () => {
      if ((!transcriptionFile && !transcriptionUrl) || !checkKey()) return;
      setLoadingTranscription(true);
      setTranscriptionResult('');
      try {
          const result = await geminiService.transcribeMedia(transcriptionFile || undefined, transcriptionUrl || undefined);
          setTranscriptionResult(result || "No text could be transcribed.");
      } catch (e: any) {
          console.error(e);
          if (e.message?.includes("API Key")) onRequireApiKey();
          else setTranscriptionResult("Transcription failed.");
      } finally {
          setLoadingTranscription(false);
      }
  };

  const handleCopyTranscription = () => {
      if (!transcriptionResult) return;
      navigator.clipboard.writeText(transcriptionResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto">
       <header className="mb-8"><h2 className="text-3xl font-bold text-white flex items-center gap-3"><FileAudio className="w-8 h-8 text-cyan-500" /> Audio Studio</h2><p className="text-slate-400 mt-2">Generate lifelike speech or transcribe audio recordings.</p></header>
      <div className="flex gap-4 mb-6 border-b border-slate-700 pb-1"><button onClick={() => setMode('tts')} className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 ${mode === 'tts' ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Text to Speech</button><button onClick={() => setMode('transcribe')} className={`pb-3 px-4 font-medium text-sm transition-colors border-b-2 ${mode === 'transcribe' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}>Transcription</button></div>
      <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 min-h-[400px]">
          {mode === 'tts' ? (
              <div className="space-y-6">
                  <div><label className="block text-sm font-medium text-slate-300 mb-2">Select Voice</label><div className="flex gap-3 flex-wrap">{PREBUILT_VOICES.map(v => (<button key={v} onClick={() => setVoice(v)} className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${voice === v ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-cyan-500/50'}`}>{v}</button>))}</div></div>
                  <div><label className="block text-sm font-medium text-slate-300 mb-2">Text to Speak</label><textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full h-32 bg-slate-900 border border-slate-700 rounded-lg p-4 text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none" placeholder="Enter the text you want the AI to say..." /></div>
                  <button onClick={handleTTS} disabled={loadingTTS || !text} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50">{loadingTTS ? <Loader2 className="animate-spin w-5 h-5"/> : <Volume2 className="w-5 h-5" />} Generate Audio</button>
                  {audioBuffer && !loadingTTS && (<div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-700 flex items-center justify-between animate-in fade-in"><p className="text-sm font-medium text-cyan-300">Audio is ready!</p><div className="flex items-center gap-3"><button onClick={playAudio} className="bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"><Play className="w-4 h-4" /> Play</button><button onClick={downloadAudio} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"><Download className="w-4 h-4" /> Download .wav</button></div></div>)}
              </div>
          ) : (
             <div className="space-y-6">
                 <div><label className="block text-sm font-medium text-slate-300 mb-2">Transcribe from URL</label><div className="relative"><Link className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" /><input type="text" placeholder="Paste a YouTube or other video URL" value={transcriptionUrl} onChange={(e) => { setTranscriptionUrl(e.target.value); setTranscriptionFile(null); }} className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-slate-200 focus:ring-1 focus:ring-purple-500" /></div></div>
                 <div className="text-center text-xs text-slate-500 font-bold">OR</div>
                 <div><label className="block text-sm font-medium text-slate-300 mb-2">Upload an Audio or Video File</label><div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-purple-500 transition-colors relative group"><input type="file" accept="audio/*,video/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => { if (e.target.files) { setTranscriptionFile(e.target.files[0]); setTranscriptionUrl(''); } }} />{transcriptionFile ? (<div className="flex flex-col items-center text-purple-400"><FileAudio className="w-8 h-8 mb-2" /><p className="text-sm font-medium truncate max-w-[200px]">{transcriptionFile.name}</p></div>) : (<div className="flex flex-col items-center text-slate-400 group-hover:text-purple-300"><Upload className="w-8 h-8 mb-2" /><p className="text-sm">Upload File</p></div>)}</div></div>
                 <button onClick={handleTranscribe} disabled={loadingTranscription || (!transcriptionFile && !transcriptionUrl)} className="w-full bg-purple-600 hover:bg-purple-500 text-white py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50">{loadingTranscription ? <Loader2 className="animate-spin w-5 h-5"/> : <Mic className="w-5 h-5" />} Transcribe</button>
                 {transcriptionResult && !loadingTranscription && (<div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-700 animate-in fade-in relative"><h4 className="text-sm font-bold text-purple-300 mb-2">Transcription Result:</h4><textarea readOnly value={transcriptionResult} className="w-full h-48 bg-slate-950 border border-slate-700 rounded-lg p-3 text-slate-300 text-sm resize-none" /><button onClick={handleCopyTranscription} className={`absolute top-4 right-4 px-3 py-1.5 rounded-md text-xs font-bold transition-colors flex items-center gap-1.5 shadow-lg ${copied ? 'bg-green-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}>{copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}{copied ? 'Copied' : 'Copy'}</button></div>)}
             </div>
          )}
      </div>
    </div>
  );
};

export default AudioStudio;

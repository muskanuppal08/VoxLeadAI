import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  PhoneCall, 
  PhoneOff, 
  Hand, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  Zap,
  Globe
} from 'lucide-react';

export default function VoiceConsole() {
  const [isConnected, setIsConnected] = useState(false);
  const [agentStatus, setAgentStatus] = useState('idle'); // idle | listening | thinking | speaking | interrupted
  const [isMuted, setIsMuted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [liveCaption, setLiveCaption] = useState('Waiting for speech...');
  const [textInput, setTextInput] = useState('');
  const [bantScore, setBantScore] = useState(0);

  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const micStreamRef = useRef(null);
  const scriptProcessorRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const messagesEndRef = useRef(null);
  const audioQueueRef = useRef([]);
  const isPlayingRef = useRef(false);
  const playbackCtxRef = useRef(null);
  const currentSourceRef = useRef(null);
  const hasReceivedRemoteAudioRef = useRef(false);
  const speechRecRef = useRef(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, liveCaption]);

  // Waveform Visualizer Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dataArray = new Uint8Array(32);

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (analyserRef.current) {
        analyserRef.current.getByteFrequencyData(dataArray);
      } else {
        dataArray.fill(0);
      }

      const barWidth = (canvas.width / 32) - 2;
      for (let i = 0; i < 32; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
        ctx.fillStyle = isConnected ? '#818cf8' : '#334155';
        ctx.fillRect(i * (barWidth + 2), canvas.height - barHeight, barWidth, barHeight);
      }
    };

    draw();
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [isConnected]);

  const startCall = async () => {
    try {
      setMessages([]);
      setBantScore(0);
      setLiveCaption('Connecting to Voice Gateway...');
      hasReceivedRemoteAudioRef.current = false;

      // 1. Establish WebSocket connection to backend
      const wsUrl = `ws://localhost:5001/ws/call?leadName=ArohiTest&company=ApexCorp`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setAgentStatus('listening');
        await initMicrophone(ws);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleServerMessage(data);
      };

      ws.onclose = () => {
        endCall();
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        endCall();
      };

    } catch (err) {
      console.error('Failed to start call:', err);
      alert('Could not start call: ' + err.message);
      endCall();
    }
  };

  const initMicrophone = async (ws) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioCtx;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 }
      });
      micStreamRef.current = stream;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      source.connect(analyser);

      // ScriptProcessor for 16-bit PCM streaming
      const processor = audioCtx.createScriptProcessor(2048, 1, 1);
      scriptProcessorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (isMuted || !ws || ws.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);
        const pcm16 = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        ws.send(pcm16.buffer);
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);

      // Web Speech Recognition for instant voice input
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        const rec = new SpeechRec();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = 'en-US';

        rec.onresult = (event) => {
          if (isMuted) return;
          let interim = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              const text = event.results[i][0].transcript.trim();
              if (text && ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'text_input', text }));
              }
            } else {
              interim += event.results[i][0].transcript;
            }
          }
          if (interim) {
            setLiveCaption(`"${interim}"`);
          }
        };

        speechRecRef.current = rec;
        try { rec.start(); } catch(e) {}
      }

    } catch (err) {
      console.warn('Microphone permission or audio context issue:', err);
    }
  };

  const endCall = () => {
    setIsConnected(false);
    setAgentStatus('idle');
    setLiveCaption('Call ended.');

    if (wsRef.current) {
      try { wsRef.current.close(); } catch(e) {}
      wsRef.current = null;
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    if (speechRecRef.current) {
      try { speechRecRef.current.stop(); } catch(e) {}
      speechRecRef.current = null;
    }
    if (scriptProcessorRef.current) {
      try { scriptProcessorRef.current.disconnect(); } catch(e) {}
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch(e) {}
      audioContextRef.current = null;
    }
    analyserRef.current = null;

    flushAudio();
  };

  const interruptAgent = () => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({ type: 'user_interrupt' }));
      flushAudio();
      setAgentStatus('listening');
    }
  };

  const sendTextMessage = (e) => {
    e?.preventDefault();
    const text = textInput.trim();
    if (text && wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify({ type: 'text_input', text }));
      setTextInput('');
    }
  };

  const handleServerMessage = (data) => {
    switch (data.type) {
      case 'transcript_interim':
        setLiveCaption(`"${data.text}"`);
        break;

      case 'transcript_final':
        setLiveCaption('Waiting for speech...');
        setMessages(prev => [...prev, { speaker: data.speaker, text: data.text, id: Date.now() + Math.random() }]);
        if (data.speaker === 'agent' && !hasReceivedRemoteAudioRef.current) {
          speakBrowserAloud(data.text);
        }
        break;

      case 'agent_status_change':
        setAgentStatus(data.status);
        break;

      case 'agent_audio_chunk':
        if (data.audio) {
          hasReceivedRemoteAudioRef.current = true;
          enqueueAudio(data.audio);
        }
        break;

      case 'flush_audio_buffer':
        flushAudio();
        break;

      case 'tool_executed':
        setMessages(prev => [...prev, {
          type: 'tool',
          toolName: data.toolName,
          result: data.result,
          id: Date.now() + Math.random()
        }]);
        break;

      case 'qualification_updated':
        if (data.qualification?.bantScore !== undefined) {
          setBantScore(data.qualification.bantScore);
        }
        break;
    }
  };

  // Browser Audio Playback
  const enqueueAudio = (base64Data) => {
    audioQueueRef.current.push(base64Data);
    if (!isPlayingRef.current) {
      playNextAudio();
    }
  };

  const playNextAudio = async () => {
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const base64 = audioQueueRef.current.shift();

    try {
      if (!playbackCtxRef.current) {
        playbackCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const buffer = await playbackCtxRef.current.decodeAudioData(bytes.buffer.slice(0));
      const source = playbackCtxRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(playbackCtxRef.current.destination);
      currentSourceRef.current = source;

      source.onended = () => {
        playNextAudio();
      };
      source.start(0);
    } catch (err) {
      console.warn('Audio frame decode fallback:', err);
      playNextAudio();
    }
  };

  const flushAudio = () => {
    audioQueueRef.current = [];
    if (currentSourceRef.current) {
      try { currentSourceRef.current.stop(); } catch(e) {}
      currentSourceRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    isPlayingRef.current = false;
  };

  const speakBrowserAloud = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v => (v.lang.startsWith('en') || v.lang.startsWith('hi')) && (
      v.name.includes('Samantha') || 
      v.name.includes('Victoria') || 
      v.name.includes('Google UK English Female') || 
      v.name.includes('Google US English') || 
      v.name.includes('Natural') || 
      v.name.includes('Zira') || 
      v.name.includes('Veena') ||
      v.name.includes('Karen')
    ));
    if (preferred) utterance.voice = preferred;

    utterance.onstart = () => setAgentStatus('speaking');
    utterance.onend = () => setAgentStatus('listening');
    window.speechSynthesis.speak(utterance);
  };

  // Dynamic Orb Color Classes with Arohi Theme
  const getOrbClasses = () => {
    if (agentStatus === 'speaking') {
      return {
        glow: 'w-52 h-52 bg-fuchsia-500/40 blur-3xl animate-pulse-ring',
        core: 'from-violet-500 via-fuchsia-600 to-rose-500 shadow-fuchsia-500/50 scale-105',
        badge: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40 animate-pulse',
      };
    }
    if (agentStatus === 'thinking') {
      return {
        glow: 'w-44 h-44 bg-amber-500/40 blur-2xl',
        core: 'from-amber-500 via-orange-500 to-yellow-500 shadow-amber-500/40 scale-100',
        badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      };
    }
    if (agentStatus === 'listening') {
      return {
        glow: 'w-48 h-48 bg-emerald-500/40 blur-2xl',
        core: 'from-emerald-500 via-teal-500 to-cyan-500 shadow-emerald-500/40 scale-100',
        badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      };
    }
    return {
      glow: 'w-36 h-36 bg-slate-700/20 blur-2xl',
      core: 'from-slate-700 to-slate-800 shadow-none scale-95 opacity-60',
      badge: 'bg-slate-800 text-slate-400 border-slate-700',
    };
  };

  const orbStyle = getOrbClasses();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Console Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card rounded-2xl p-4 px-6 border border-slate-800">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            Live Autonomous Voice Console
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
              Agent Arohi
            </span>
          </h1>
          <p className="text-xs text-slate-400">Low-latency duplex phone call with automatic BANT qualification & demo booking</p>
        </div>

        {/* State Badges */}
        <div className="flex items-center gap-2.5">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${orbStyle.badge}`}>
            <span className="w-2 h-2 rounded-full bg-current"></span>
            {agentStatus.charAt(0).toUpperCase() + agentStatus.slice(1)}
          </span>

          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
            bantScore >= 70 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse' 
              : bantScore >= 40 
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
              : 'bg-purple-500/10 text-purple-300 border-purple-500/30'
          }`}>
            BANT: {bantScore}/100
          </span>
        </div>
      </div>

      {/* Main Grid: Orb/Controls on Left, Transcript on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Visualizer Orb & Controls */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          {/* Orb Card */}
          <div className="glass-card rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden border border-slate-800">
            <div className="relative my-8 flex items-center justify-center">
              <div className={`absolute rounded-full transition-all duration-300 ${orbStyle.glow}`}></div>
              <div className={`w-32 h-32 rounded-full bg-gradient-to-br flex items-center justify-center shadow-2xl transition-all duration-300 ${orbStyle.core}`}>
                <Mic className="w-12 h-12 text-white" />
              </div>
            </div>

            {/* Waveform Canvas */}
            <div className="w-full h-16 bg-slate-950/80 rounded-2xl border border-slate-800/80 overflow-hidden px-2 flex items-center">
              <canvas ref={canvasRef} width={280} height={60} className="w-full h-full"></canvas>
            </div>

            <p className="text-xs text-slate-400 mt-3 text-center">
              {isConnected ? '🎙️ Mic active (Bilingual English & Hindi)' : 'Microphone inactive. Click Start Call.'}
            </p>
          </div>

          {/* Controls Card */}
          <div className="glass-card rounded-3xl p-6 border border-slate-800 space-y-3">
            <button
              onClick={isConnected ? endCall : startCall}
              className={`w-full py-3.5 px-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                isConnected
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                  : 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-fuchsia-600/30'
              }`}
            >
              {isConnected ? (
                <>
                  <PhoneOff className="w-4 h-4" /> End Call
                </>
              ) : (
                <>
                  <PhoneCall className="w-4 h-4" /> Start Discovery Call
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={!isConnected}
                onClick={() => setIsMuted(!isMuted)}
                className={`py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                  isMuted 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
                }`}
              >
                {isMuted ? <MicOff className="w-3.5 h-3.5 text-rose-400" /> : <Mic className="w-3.5 h-3.5" />}
                {isMuted ? 'Unmute' : 'Mute Mic'}
              </button>

              <button
                disabled={!isConnected}
                onClick={interruptAgent}
                className="py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Hand className="w-3.5 h-3.5" />
                Interrupt
              </button>
            </div>

            {/* Text Input Simulator */}
            <form onSubmit={sendTextMessage} className="mt-4 pt-4 border-t border-slate-800/80 flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                disabled={!isConnected}
                placeholder="Ask pricing or book demo..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={!isConnected || !textInput.trim()}
                className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Live Conversation Stream */}
        <div className="lg:col-span-2 glass-card rounded-3xl border border-slate-800 flex flex-col overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live Call Dialogue
            </h3>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Globe className="w-3 h-3 text-indigo-400" /> Multilingual Support
            </span>
          </div>

          {/* Transcript Scroll Window */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 min-h-[460px] max-h-[500px]">
            {messages.length === 0 && (
              <div className="text-center py-24 text-slate-500 text-xs">
                Click <span className="text-indigo-400 font-semibold">"Start Discovery Call"</span> to begin the real-time AI conversation.
              </div>
            )}

            {messages.map((msg) => {
              if (msg.type === 'tool') {
                let badgeText = `⚡ Tool Executed: ${msg.toolName}`;
                if (msg.toolName === 'search_company_info') {
                  badgeText = `🔍 Knowledge Grounding: Searched "${msg.result?.title || 'Pricing & Plans'}"`;
                } else if (msg.toolName === 'book_calendar_appointment') {
                  badgeText = `📅 Demo Booked: ${msg.result?.date} at ${msg.result?.time} (${msg.result?.bookingId})`;
                }
                return (
                  <div key={msg.id} className="flex justify-center my-2">
                    <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-700/50 shadow-sm">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      {badgeText}
                    </span>
                  </div>
                );
              }

              const isAgent = msg.speaker === 'agent';
              return (
                <div key={msg.id} className={`flex flex-col ${isAgent ? 'items-start' : 'items-end'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-md ${
                    isAgent 
                      ? 'bg-slate-900 text-slate-100 border border-slate-800 rounded-tl-sm' 
                      : 'bg-indigo-600 text-white rounded-tr-sm'
                  }`}>
                    <div className={`text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                      isAgent ? 'text-fuchsia-400' : 'text-violet-200'
                    }`}>
                      {isAgent ? 'Arohi (VoxLead Agent)' : 'You (Prospect)'}
                    </div>
                    <div>{msg.text}</div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Live Streaming Subtitles Bar */}
          <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center gap-3">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">Captions:</span>
            <div className="text-xs text-indigo-300 italic truncate flex-1 font-mono">
              {liveCaption}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

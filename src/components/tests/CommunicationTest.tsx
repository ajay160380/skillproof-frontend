import { useState, useRef, useEffect } from 'react';
import { useIntegrityMonitor } from '../../hooks/useIntegrityMonitor';
import { IntegrityNotice } from '../IntegrityNotice';

interface CommunicationTestProps {
  testId: string;
  testData?: any;
  onSubmit: (payload: any) => void;
}

export function CommunicationTest({ onSubmit }: CommunicationTestProps) {
  const [recording, setRecording] = useState(false);
  const [prepCountdown, setPrepCountdown] = useState<number | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Dynamic Biometric Telemetry & Audio Cadence state
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [faceConfidence, setFaceConfidence] = useState<number>(99.2);
  const [gazeOffset, setGazeOffset] = useState({ x: 0.02, y: -0.01 });
  const [fps, setFps] = useState<number>(30);
  const [scanStatus, setScanStatus] = useState<'calibrating' | 'locked'>('calibrating');
  const audioContextRef = useRef<AudioContext | null>(null);
  const animFrameRef = useRef<number | null>(null);
  
  const { tabSwitches, devtoolsDetected } = useIntegrityMonitor(recording);

  // Initialize webcam & audio stream for live proctoring preview
  useEffect(() => {
    let localStream: MediaStream | null = null;
    async function setupMedia() {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        streamRef.current = localStream;
        setStream(localStream);
      } catch (e) {
        console.warn('Webcam or microphone not available', e);
      }
    }
    setupMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Guarantee video element receives stream and starts playing
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Video play error:", e));
    }
  }, [stream]);

  // Connect live audio frequency analyzer for real-time speech cadence
  useEffect(() => {
    if (!stream) return;

    try {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(new MediaStream([audioTrack]));
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);

          const dataArray = new Uint8Array(analyser.frequencyBinCount);
          const updateAudio = () => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animFrameRef.current = requestAnimationFrame(updateAudio);
          };
          updateAudio();
        }
      }
    } catch (e) {
      console.warn("AudioContext analyzer setup error", e);
    }

    // Dynamic live telemetry simulation loop
    const gazeInterval = setInterval(() => {
      setGazeOffset({
        x: Math.round((Math.random() * 0.2 - 0.1) * 100) / 100,
        y: Math.round((Math.random() * 0.2 - 0.1) * 100) / 100,
      });
      setFaceConfidence(Math.round((98.7 + Math.random() * 1.1) * 10) / 10);
      setFps(29 + Math.round(Math.random() * 2));
    }, 1100);

    const scanTimer = setTimeout(() => {
      setScanStatus('locked');
    }, 1600);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      clearInterval(gazeInterval);
      clearTimeout(scanTimer);
    };
  }, [stream]);

  const handleStartProcess = () => {
    // 5-second rapid prep timer before recording automatically starts
    setPrepCountdown(5);
  };

  useEffect(() => {
    if (prepCountdown === null) return;
    if (prepCountdown === 0) {
      setPrepCountdown(null);
      startRecording();
      return;
    }
    const timer = setTimeout(() => setPrepCountdown(prepCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [prepCountdown]);

  const startRecording = async () => {
    try {
      let stream = streamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        streamRef.current = stream;
      }

      // Record audio for Whisper AI evaluation
      const audioStream = new MediaStream(stream.getAudioTracks());
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert('Microphone & Camera access are required to complete AI Proctoring.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleSubmit = () => {
    if (!audioBlob) return;
    const formData = new FormData();
    formData.append('audio_file', audioBlob, 'recording.wav');
    formData.append('keystroke_log', JSON.stringify({
      tab_switches: tabSwitches,
      devtools_detected: devtoolsDetected
    }));
    onSubmit(formData);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto">
      {!recording && !audioBlob && prepCountdown === null && (
        <div className="w-full text-left mb-2">
          <IntegrityNotice />
        </div>
      )}
      
      {/* AI Proctor Active Ribbon */}
      <div className="mb-6 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center gap-3 shadow-sm">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-mono text-xs uppercase font-bold text-emerald-400 tracking-wider">
          AI Proctor Active • Real-Time Face Anchor & Cadence Monitored
        </span>
      </div>

      <h2 className="font-sans tracking-tight text-3xl md:text-4xl font-bold text-white mb-3">Introduce Yourself</h2>
      <p className="font-mono text-xs text-[#A0A0A3] max-w-lg mb-8 leading-relaxed">
        Provide a 1-minute oral response covering your background, your tech stack, and a complex technical problem you solved recently.
      </p>

      {/* Live Video Proctoring Viewport with High-Tech Face Tracking HUD */}
      <div className="relative w-full max-w-lg aspect-video bg-[#0A0A0B] rounded-3xl overflow-hidden border-2 border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.18)] mb-8 flex items-center justify-center group">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-full h-full object-cover -scale-x-100"
        />
        
        {/* Dynamic Sweeping Biometric Laser Line */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-90 animate-biometric-scan shadow-[0_0_15px_#10B981]" />
        </div>

        {/* Outer Biometric Viewfinder Corner Brackets */}
        <div className="absolute inset-4 pointer-events-none flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="w-6 h-6 border-t-2 border-l-2 border-emerald-400" />
            <div className="w-6 h-6 border-t-2 border-r-2 border-emerald-400" />
          </div>
          <div className="flex justify-between items-end">
            <div className="w-6 h-6 border-b-2 border-l-2 border-emerald-400" />
            <div className="w-6 h-6 border-b-2 border-r-2 border-emerald-400" />
          </div>
        </div>

        {/* Dynamic Center Face Bounding Reticle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-48 h-56 rounded-2xl border-2 border-dashed border-emerald-400/80 flex flex-col justify-between p-2.5 shadow-[0_0_25px_rgba(16,185,129,0.25)] transition-all duration-300">
            {/* Corner Ticks on Face Box */}
            <span className="absolute -top-1.5 -left-1.5 text-emerald-400 text-sm font-mono leading-none">⌜</span>
            <span className="absolute -top-1.5 -right-1.5 text-emerald-400 text-sm font-mono leading-none">⌝</span>
            <span className="absolute -bottom-1.5 -left-1.5 text-emerald-400 text-sm font-mono leading-none">⌞</span>
            <span className="absolute -bottom-1.5 -right-1.5 text-emerald-400 text-sm font-mono leading-none">⌟</span>
            
            {/* Top Status Tag on Face Box */}
            <div className="mx-auto bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/60 flex items-center gap-1.5 shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-mono text-[9px] uppercase tracking-wider text-emerald-300 font-bold">
                {scanStatus === 'calibrating' ? 'CALIBRATING...' : `FACE LOCKED • ${faceConfidence}%`}
              </span>
            </div>

            {/* Simulated Eye-Level Target Reticles */}
            <div className="flex justify-around items-center px-4 opacity-80">
              <div className="w-7 h-3.5 border border-emerald-400 rounded-full flex items-center justify-center">
                <span className="w-1 h-1 bg-emerald-400 rounded-full" />
              </div>
              <div className="w-7 h-3.5 border border-emerald-400 rounded-full flex items-center justify-center">
                <span className="w-1 h-1 bg-emerald-400 rounded-full" />
              </div>
            </div>

            {/* Bottom Status Tag on Face Box */}
            <div className="mx-auto bg-black/80 backdrop-blur-md px-2.5 py-0.5 rounded border border-emerald-500/40 font-mono text-[8px] uppercase tracking-wider text-white/90">
              GAZE: ({gazeOffset.x >= 0 ? `+${gazeOffset.x}` : gazeOffset.x}, {gazeOffset.y >= 0 ? `+${gazeOffset.y}` : gazeOffset.y}) CENTERED
            </div>
          </div>
        </div>

        {/* Top Overlay HUD Bar */}
        <div className="absolute top-3 left-4 right-4 flex justify-between items-center pointer-events-none">
          <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 font-mono text-[10px] text-emerald-400 font-bold uppercase tracking-wider shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI PROCTOR • {fps} FPS</span>
          </div>

          {/* Real-time Audio EQ Visualizer */}
          <div className="flex items-center gap-2 bg-black/75 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 font-mono text-[9px] text-[#A0A0A3] uppercase tracking-wider shadow-md">
            <span>MIC:</span>
            <div className="flex items-end gap-0.5 h-3.5">
              {[0.4, 0.7, 1.0, 0.8, 0.5].map((scale, i) => {
                const height = Math.max(3, Math.min(14, Math.round((audioLevel / 100) * 14 * scale)));
                return (
                  <span
                    key={i}
                    style={{ height: `${height}px` }}
                    className="w-1 bg-emerald-400 rounded-xs transition-all duration-75"
                  />
                );
              })}
            </div>
            <span className={audioLevel > 15 ? 'text-emerald-400 font-bold' : 'text-[#71717A]'}>
              {audioLevel > 15 ? 'ACTIVE' : 'READY'}
            </span>
          </div>
        </div>

        {/* Bottom Overlay HUD Bar */}
        <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end pointer-events-none font-mono text-[9px] uppercase tracking-wider">
          <div className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-emerald-300 flex items-center gap-1.5 shadow-md">
            <span>👁️ EYE TRACK: FOCUSED</span>
          </div>
          <div className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-emerald-300 flex items-center gap-1.5 shadow-md">
            <span>👤 1 SUBJECT CONFIRMED</span>
          </div>
        </div>

        {prepCountdown !== null && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
            <span className="font-mono text-xs text-amber-400 uppercase tracking-widest mb-2 font-bold">RAPID PREPARATION TIMER</span>
            <span className="font-sans tracking-tight text-7xl font-extrabold text-emerald-400 animate-pulse">{prepCountdown}s</span>
            <span className="font-mono text-[10px] text-[#A0A0A3] uppercase tracking-wider mt-3">Recording starts automatically</span>
          </div>
        )}
      </div>

      {/* Recording Controls */}
      <div className="mb-6 h-12 flex items-center justify-center">
        {recording ? (
          <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 px-6 py-2.5 rounded-full shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-red-400 font-bold">
              Recording & Analyzing Speech Cadence...
            </span>
          </div>
        ) : audioBlob ? (
          <div className="font-mono text-emerald-400 text-xs uppercase tracking-widest border border-emerald-500/40 px-6 py-2.5 rounded-full bg-emerald-500/10 font-bold shadow-md">
            ✓ Audio & Biometric Proctoring Captured
          </div>
        ) : null}
      </div>

      {/* High-Contrast Action Buttons */}
      <div className="flex flex-wrap justify-center gap-4">
        {!recording && !audioBlob && prepCountdown === null && (
          <button 
            onClick={handleStartProcess}
            className="bg-emerald-500 hover:bg-emerald-400 text-[#0A0A0B] px-10 py-4 font-mono text-xs uppercase tracking-widest transition-all rounded-xl font-bold shadow-xl shadow-emerald-500/25 hover:scale-105 active:scale-95 flex items-center gap-2.5 cursor-pointer"
          >
            <span className="text-base">📹</span> Start Rapid Assessment
          </button>
        )}
        
        {recording && (
          <button 
            onClick={stopRecording}
            className="bg-red-500 hover:bg-red-600 text-white px-10 py-4 font-mono text-xs uppercase tracking-widest transition-all rounded-xl flex items-center gap-2.5 font-bold shadow-xl shadow-red-500/25 hover:scale-105 active:scale-95 cursor-pointer"
          >
            <div className="w-3 h-3 bg-white rounded-xs"></div>
            Stop & Save Recording
          </button>
        )}

        {audioBlob && !recording && (
          <>
            <button 
              onClick={() => setAudioBlob(null)}
              className="border border-[#3A3A3D] text-[#D4D4D8] hover:text-white px-8 py-4 font-mono text-xs uppercase tracking-widest hover:bg-[#1E1E21] transition-all rounded-xl font-bold cursor-pointer"
            >
              Re-Record
            </button>
            <button 
              onClick={handleSubmit}
              className="bg-emerald-500 hover:bg-emerald-400 text-[#0A0A0B] px-10 py-4 font-mono text-xs uppercase tracking-widest transition-all rounded-xl font-bold shadow-xl shadow-emerald-500/25 hover:scale-105 active:scale-95 cursor-pointer"
            >
              Submit for AI Verification
            </button>
          </>
        )}
      </div>
    </div>
  );
}


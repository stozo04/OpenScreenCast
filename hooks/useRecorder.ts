import { useState, useRef, useCallback, useEffect } from 'react';
import { RecorderStatus, AudioSourceConfig, RecordingSession } from '../types';

interface UseRecorderReturn {
  status: RecorderStatus;
  startRecording: (config: AudioSourceConfig) => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  previewStream: MediaStream | null;
  session: RecordingSession | null;
  error: string | null;
  recordingTime: number;
  reset: () => void;
}

export function useRecorder(): UseRecorderReturn {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  
  // Keep track of all active streams (screen, mic) to stop them properly without relying on state
  const activeStreamsRef = useRef<MediaStream[]>([]);
  
  // Web Audio API refs for mixing
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const micSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const sysSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const cleanup = useCallback(() => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // Stop all tracked streams (Screen + Mic)
    activeStreamsRef.current.forEach(stream => {
      stream.getTracks().forEach(track => track.stop());
    });
    activeStreamsRef.current = [];
    
    setPreviewStream(null);

    // Close AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    mediaRecorderRef.current = null;
    chunksRef.current = [];
  }, []);

  const startRecording = useCallback(async (config: AudioSourceConfig) => {
    setError(null);
    try {
      // 1. Get Screen Stream (Video + Optional System Audio)
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60 }
        },
        audio: config.system // Request system audio if enabled
      });

      // Track this stream for cleanup
      activeStreamsRef.current.push(displayStream);

      // Handle user cancelling the screen picker
      displayStream.getVideoTracks()[0].onended = () => {
        stopRecording();
      };

      // 2. Prepare Audio Mixing
      const tracks: MediaStreamTrack[] = [...displayStream.getVideoTracks()];
      
      // If we need to mix audio (Mic + System), we use Web Audio API
      if (config.mic || (config.system && displayStream.getAudioTracks().length > 0)) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContextClass();
        audioContextRef.current = ctx;
        const dest = ctx.createMediaStreamDestination();
        audioDestinationRef.current = dest;

        // Add System Audio to Mix
        if (config.system && displayStream.getAudioTracks().length > 0) {
          const sysTrack = displayStream.getAudioTracks()[0];
          const sysStream = new MediaStream([sysTrack]);
          const sysSource = ctx.createMediaStreamSource(sysStream);
          sysSource.connect(dest);
          sysSourceRef.current = sysSource;
        }

        // Add Mic Audio to Mix
        if (config.mic) {
          const micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              deviceId: config.micDeviceId ? { exact: config.micDeviceId } : undefined,
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          // Track mic stream for cleanup
          activeStreamsRef.current.push(micStream);
          
          const micSource = ctx.createMediaStreamSource(micStream);
          micSource.connect(dest);
          micSourceRef.current = micSource;
        }

        // Add the mixed audio track to our tracks list
        if (dest.stream.getAudioTracks().length > 0) {
          tracks.push(dest.stream.getAudioTracks()[0]);
        }
      }

      const finalStream = new MediaStream(tracks);
      setPreviewStream(displayStream); // Update UI state

      // 3. Setup MediaRecorder
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';

      const recorder = new MediaRecorder(finalStream, {
        mimeType,
        videoBitsPerSecond: 5000000 // 5 Mbps
      });

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const timestamp = Date.now();
        const dateStr = new Date(timestamp).toISOString().slice(0, 19).replace(/[:T]/g, '-');
        
        setSession({
          blob,
          url,
          timestamp,
          duration: (Date.now() - startTimeRef.current),
          filename: `rec_${dateStr}.webm`
        });
        setStatus('finished');
        cleanup();
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // Slice every second
      startTimeRef.current = Date.now();
      
      // Start Timer
      setRecordingTime(0);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      setStatus('recording');

    } catch (err: any) {
      console.error("Recording error:", err);
      setError(err.message || "Failed to start recording");
      cleanup();
      setStatus('idle');
    }
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      // Status update happens in onstop
    }
  }, []);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setStatus('paused');
      if (timerIntervalRef.current) {
        window.clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setStatus('recording');
      timerIntervalRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  }, []);

  const reset = useCallback(() => {
    setSession(null);
    setStatus('idle');
    setRecordingTime(0);
    setError(null);
  }, []);

  // Ensure cleanup on unmount
  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return {
    status,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    previewStream,
    session,
    error,
    recordingTime,
    reset
  };
}
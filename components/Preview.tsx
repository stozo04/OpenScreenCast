import React, { useEffect, useRef } from 'react';
import { cn } from '../utils/cn';
import { Download, Film, Share2 } from 'lucide-react';
import { RecordingSession } from '../types';

interface PreviewProps {
  stream: MediaStream | null;
  session: RecordingSession | null;
  className?: string;
}

export const Preview: React.FC<PreviewProps> = ({ stream, session, className }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    } else if (videoRef.current && session) {
      videoRef.current.srcObject = null;
      videoRef.current.src = session.url;
    }
  }, [stream, session]);

  if (!stream && !session) {
    return (
      <div className={cn("flex flex-col items-center justify-center text-slate-500 gap-4", className)}>
        <div className="w-24 h-24 rounded-3xl bg-slate-800/50 flex items-center justify-center">
          <Film className="w-10 h-10 opacity-50" />
        </div>
        <p className="text-sm font-medium">No active recording</p>
      </div>
    );
  }

  return (
    <div className={cn("relative group rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800", className)}>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls={!!session}
        muted={!!stream} // Mute preview while recording to avoid feedback
        className="w-full h-full object-contain"
      />
      
      {session && (
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
          <div className="flex gap-4">
            <a
              href={session.url}
              download={session.filename}
              className="flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-slate-200 transition-colors transform hover:scale-105"
            >
              <Download className="w-5 h-5" />
              Download MP4
            </a>
          </div>
        </div>
      )}
      
      {stream && (
        <div className="absolute top-4 right-4 flex gap-2">
            <span className="px-2 py-1 rounded bg-red-600 text-white text-xs font-bold animate-pulse">
                LIVE
            </span>
        </div>
      )}
    </div>
  );
};
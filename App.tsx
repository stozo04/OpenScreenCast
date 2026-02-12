import React, { useEffect, useState } from 'react';
import { useRecorder } from './hooks/useRecorder';
import { ControlPanel } from './components/ControlPanel';
import { Preview } from './components/Preview';
import { AudioDevice } from './types';
import { Video, Mic, Layers, Info } from 'lucide-react';

export default function App() {
  const recorder = useRecorder();
  const [micDevices, setMicDevices] = useState<AudioDevice[]>([]);
  const [permissionError, setPermissionError] = useState(false);

  useEffect(() => {
    async function getDevices() {
      try {
        // Request permission briefly to get labels
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices
          .filter(d => d.kind === 'audioinput')
          .map(d => ({ deviceId: d.deviceId, label: d.label }));
        setMicDevices(mics);
        setPermissionError(false);
      } catch (err) {
        console.warn("Could not get audio permissions", err);
        setPermissionError(true);
      }
    }
    getDevices();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-purple-500/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[128px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[128px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col h-screen max-h-screen">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl shadow-lg shadow-purple-500/20">
              <Video className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                ScreenCast Pro
              </h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide">WEB RECORDER</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4" />
              <span>Multi-Source Audio</span>
            </div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>HD Capture</span>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col items-center justify-center min-h-0 relative">
          
          {/* Error Banner */}
          {(recorder.error || permissionError) && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-md">
              <div className="bg-red-500/10 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg flex items-center gap-3 backdrop-blur-sm">
                <Info className="w-5 h-5 shrink-0" />
                <p className="text-sm">
                  {recorder.error || "Microphone access required for full functionality. Please check permissions."}
                </p>
              </div>
            </div>
          )}

          {/* Preview Window */}
          <div className="w-full max-w-5xl aspect-video relative flex flex-col">
            <Preview 
              stream={recorder.previewStream} 
              session={recorder.session} 
              className="w-full h-full"
            />
            
            {/* Guide Text when idle */}
            {recorder.status === 'idle' && !recorder.session && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-slate-500 text-lg mt-32">
                  Configure settings below and press Start to begin
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Controls */}
        <ControlPanel
          status={recorder.status}
          recordingTime={recorder.recordingTime}
          onStart={recorder.startRecording}
          onStop={recorder.stopRecording}
          onPause={recorder.pauseRecording}
          onResume={recorder.resumeRecording}
          onReset={recorder.reset}
          micDevices={micDevices}
        />
      </div>
    </div>
  );
}
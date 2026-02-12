import React, { useState, useEffect } from 'react';
import { Mic, Monitor, Disc, StopCircle, Pause, Play, Download, Settings2, RefreshCcw, Volume2 } from 'lucide-react';
import { cn, formatTime } from '../utils/cn';
import { AudioSourceConfig, RecorderStatus, AudioDevice } from '../types';

interface ControlPanelProps {
  status: RecorderStatus;
  recordingTime: number;
  onStart: (config: AudioSourceConfig) => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  micDevices: AudioDevice[];
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  status,
  recordingTime,
  onStart,
  onStop,
  onPause,
  onResume,
  onReset,
  micDevices,
}) => {
  const [config, setConfig] = useState<AudioSourceConfig>({
    mic: true,
    system: true,
    micDeviceId: ''
  });
  const [isExpanded, setIsExpanded] = useState(true);

  // Set default mic
  useEffect(() => {
    if (micDevices.length > 0 && !config.micDeviceId) {
      setConfig(prev => ({ ...prev, micDeviceId: micDevices[0].deviceId }));
    }
  }, [micDevices, config.micDeviceId]);

  const handleStart = () => {
    onStart(config);
  };

  if (status === 'finished') {
    return (
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
        <button
          onClick={onReset}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-full shadow-2xl border border-slate-700 transition-all transform hover:scale-105"
        >
          <RefreshCcw className="w-5 h-5" />
          <span>New Recording</span>
        </button>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-in-out",
      status === 'idle' ? "top-1/2 -translate-y-1/2" : "bottom-8"
    )}>
      <div className={cn(
        "bg-slate-900/95 backdrop-blur-md border border-slate-700/50 shadow-2xl rounded-2xl overflow-hidden transition-all duration-300",
        status === 'idle' ? "w-[400px]" : "w-auto min-w-[300px]"
      )}>
        
        {/* Header / Status Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2.5 h-2.5 rounded-full",
              status === 'recording' ? "bg-red-500 animate-pulse" : 
              status === 'paused' ? "bg-amber-400" : "bg-emerald-400"
            )} />
            <span className="text-sm font-medium text-slate-200">
              {status === 'idle' ? 'Ready to Record' : 
               status === 'recording' ? 'Recording...' : 
               status === 'paused' ? 'Paused' : 'Processing'}
            </span>
          </div>
          {status !== 'idle' && (
            <span className="font-mono text-slate-100 font-medium">
              {formatTime(recordingTime)}
            </span>
          )}
        </div>

        {/* Configuration Body (Only visible when idle) */}
        {status === 'idle' && (
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 cursor-pointer transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium text-slate-200">System Audio</div>
                    <div className="text-xs text-slate-400">Capture internal sound</div>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={config.system}
                  onChange={e => setConfig({ ...config, system: e.target.checked })}
                  className="w-5 h-5 accent-blue-500 rounded focus:ring-blue-500/20"
                />
              </label>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700 cursor-pointer transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                      <Mic className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-200">Microphone</div>
                      <div className="text-xs text-slate-400">Record your voice</div>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={config.mic}
                    onChange={e => setConfig({ ...config, mic: e.target.checked })}
                    className="w-5 h-5 accent-purple-500 rounded focus:ring-purple-500/20"
                  />
                </label>
                
                {config.mic && micDevices.length > 0 && (
                  <div className="pl-14 pr-2">
                    <select
                      value={config.micDeviceId}
                      onChange={e => setConfig({ ...config, micDeviceId: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 text-xs text-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500"
                    >
                      {micDevices.map(dev => (
                        <option key={dev.deviceId} value={dev.deviceId}>
                          {dev.label || `Microphone ${dev.deviceId.slice(0, 5)}...`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleStart}
              className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white p-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-red-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              Start Recording
            </button>
          </div>
        )}

        {/* Compact Controls (Visible when recording/paused) */}
        {status !== 'idle' && (
          <div className="p-3 flex items-center justify-center gap-3">
            {status === 'recording' ? (
              <button
                onClick={onPause}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-full transition-colors border border-slate-700"
                title="Pause"
              >
                <Pause className="w-6 h-6 fill-current" />
              </button>
            ) : (
              <button
                onClick={onResume}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-full transition-colors border border-slate-700"
                title="Resume"
              >
                <Play className="w-6 h-6 fill-current" />
              </button>
            )}

            <button
              onClick={onStop}
              className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-full transition-colors border border-red-500/50"
              title="Stop Recording"
            >
              <StopCircle className="w-8 h-8 fill-red-500/20" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
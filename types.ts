export type RecorderStatus = 'idle' | 'recording' | 'paused' | 'processing' | 'finished';

export interface AudioSourceConfig {
  mic: boolean;
  system: boolean;
  micDeviceId?: string;
}

export interface RecordingSession {
  blob: Blob;
  url: string;
  timestamp: number;
  duration: number;
  filename: string;
}

export interface AudioDevice {
  deviceId: string;
  label: string;
}
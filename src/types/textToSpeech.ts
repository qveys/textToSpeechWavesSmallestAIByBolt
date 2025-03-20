export interface AudioChunk {
  id: number;
  text: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  audioUrl: string | null;
}

export interface APIResponse {
  audio: ArrayBuffer;
}

export interface WAVFormat {
  sampleRate: number;
  numChannels: number;
  bitsPerSample: number;
}
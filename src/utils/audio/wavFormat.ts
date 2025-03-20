import { WAVFormat } from '../../types/textToSpeech';

export const extractWAVFormat = (buffer: ArrayBuffer): WAVFormat => {
  const view = new DataView(buffer);
  let offset = 12;
  
  while (offset < buffer.byteLength - 8) {
    const chunkId = String.fromCharCode(...Array.from({ length: 4 }, (_, i) => view.getUint8(offset + i)));
    if (chunkId === 'fmt ') {
      return {
        sampleRate: view.getUint32(offset + 12, true),
        numChannels: view.getUint16(offset + 10, true),
        bitsPerSample: view.getUint16(offset + 22, true)
      };
    }
    offset += 8 + view.getUint32(offset + 4, true);
  }
  throw new Error('Format WAV invalide');
};

export const findAudioData = (buffer: ArrayBuffer) => {
  const view = new DataView(buffer);
  let offset = 12;
  
  while (offset < buffer.byteLength - 8) {
    const chunkId = String.fromCharCode(...Array.from({ length: 4 }, (_, i) => view.getUint8(offset + i)));
    const size = view.getUint32(offset + 4, true);
    
    if (chunkId === 'data') {
      return { offset: offset + 8, size };
    }
    offset += 8 + size;
  }
  throw new Error('Données audio non trouvées');
};

export const isValidWAV = (buffer: ArrayBuffer): boolean => {
  if (buffer.byteLength < 44) return false;
  
  const view = new DataView(buffer);
  const riff = String.fromCharCode(...Array.from({ length: 4 }, (_, i) => view.getUint8(i)));
  const wave = String.fromCharCode(...Array.from({ length: 4 }, (_, i) => view.getUint8(i + 8)));
  
  return riff === 'RIFF' && wave === 'WAVE';
};
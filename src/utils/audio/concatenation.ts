import { extractWAVFormat, findAudioData } from './wavFormat';

export const concatenateAudioChunks = async (chunks: ArrayBuffer[]): Promise<Blob> => {
  if (!chunks.length) throw new Error('Aucun segment audio');
  if (chunks.length === 1) return new Blob([chunks[0]], { type: 'audio/wav' });

  const format = extractWAVFormat(chunks[0]);
  const audioData = chunks.map(chunk => findAudioData(chunk));
  const totalSize = audioData.reduce((sum, { size }) => sum + size, 0);

  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // En-tête RIFF
  new Uint8Array(header, 0, 4).set(new TextEncoder().encode('RIFF'));
  view.setUint32(4, 36 + totalSize, true);
  new Uint8Array(header, 8, 4).set(new TextEncoder().encode('WAVE'));

  // En-tête fmt
  new Uint8Array(header, 12, 4).set(new TextEncoder().encode('fmt '));
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, format.numChannels, true);
  view.setUint32(24, format.sampleRate, true);
  view.setUint32(28, format.sampleRate * format.numChannels * (format.bitsPerSample / 8), true);
  view.setUint16(32, format.numChannels * (format.bitsPerSample / 8), true);
  view.setUint16(34, format.bitsPerSample, true);

  // En-tête data
  new Uint8Array(header, 36, 4).set(new TextEncoder().encode('data'));
  view.setUint32(40, totalSize, true);

  const finalBuffer = new Uint8Array(44 + totalSize);
  finalBuffer.set(new Uint8Array(header));

  let offset = 44;
  for (let i = 0; i < chunks.length; i++) {
    const { offset: chunkOffset, size } = audioData[i];
    finalBuffer.set(new Uint8Array(chunks[i], chunkOffset, size), offset);
    offset += size;
  }

  return new Blob([finalBuffer], { type: 'audio/wav' });
};
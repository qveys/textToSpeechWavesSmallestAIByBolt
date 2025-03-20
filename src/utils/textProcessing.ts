export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch('https://waves-api.smallest.ai/api/v1/lightning/get_speech?unauthenticated=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        voice_id: 'arman',
        format: 'wav'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`API error (${response.status}): ${errorData}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('Text-to-speech error:', error);
    throw error;
  }
}

export function splitTextIntoChunks(text: string, maxLength: number = 250): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

export async function concatenateAudioChunks(audioChunks: ArrayBuffer[]): Promise<Blob> {
  if (audioChunks.length === 0) {
    throw new Error('No audio chunks to concatenate');
  }

  // For a single chunk, return it directly
  if (audioChunks.length === 1) {
    return new Blob([audioChunks[0]], { type: 'audio/wav' });
  }

  // Get the first chunk as a reference for the WAV header
  const firstChunk = new Uint8Array(audioChunks[0]);
  const sampleRate = new DataView(audioChunks[0]).getUint32(24, true);
  const numChannels = new DataView(audioChunks[0]).getUint16(22, true);
  const bitsPerSample = new DataView(audioChunks[0]).getUint16(34, true);

  // Calculate total audio data size (excluding WAV headers)
  let totalAudioSize = 0;
  for (const chunk of audioChunks) {
    totalAudioSize += chunk.byteLength - 44; // 44 is the WAV header size
  }

  // Create the WAV header for the combined file
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  // Write WAV header
  // "RIFF" chunk descriptor
  view.setUint32(0, 0x46464952, false); // "RIFF" in ASCII
  view.setUint32(4, 36 + totalAudioSize, true); // File size - 8
  view.setUint32(8, 0x45564157, false); // "WAVE" in ASCII

  // "fmt " sub-chunk
  view.setUint32(12, 0x20746D66, false); // "fmt " in ASCII
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // ByteRate
  view.setUint16(32, numChannels * (bitsPerSample / 8), true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample

  // "data" sub-chunk
  view.setUint32(36, 0x61746164, false); // "data" in ASCII
  view.setUint32(40, totalAudioSize, true); // Subchunk2Size

  // Create the final buffer
  const finalBuffer = new Uint8Array(44 + totalAudioSize);
  finalBuffer.set(new Uint8Array(header), 0);

  // Copy audio data from each chunk
  let offset = 44;
  for (const chunk of audioChunks) {
    const chunkData = new Uint8Array(chunk).slice(44);
    finalBuffer.set(chunkData, offset);
    offset += chunkData.length;
  }

  return new Blob([finalBuffer], { type: 'audio/wav' });
}
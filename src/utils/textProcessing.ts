const API_URL = 'https://waves-api.smallest.ai/api/v1/lightning/get_speech?unauthenticated=true';

interface WAVFormat {
  sampleRate: number;
  numChannels: number;
  bitsPerSample: number;
}

function getWAVFormat(buffer: ArrayBuffer): WAVFormat {
  const view = new DataView(buffer);
  return {
    sampleRate: view.getUint32(24, true),
    numChannels: view.getUint16(22, true),
    bitsPerSample: view.getUint16(34, true)
  };
}

function validateWAVFormat(buffer: ArrayBuffer): boolean {
  const view = new DataView(buffer);
  const riff = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );
  return riff === 'RIFF';
}

export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch(API_URL, {
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

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength === 0) {
      throw new Error('Received empty audio buffer from API');
    }

    if (!validateWAVFormat(buffer)) {
      throw new Error('Invalid WAV format received from API');
    }

    return buffer;
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

  // Return single chunk directly
  if (audioChunks.length === 1) {
    return new Blob([audioChunks[0]], { type: 'audio/wav' });
  }

  // Validate all chunks have the same format
  const firstFormat = getWAVFormat(audioChunks[0]);
  for (let i = 1; i < audioChunks.length; i++) {
    const format = getWAVFormat(audioChunks[i]);
    if (format.sampleRate !== firstFormat.sampleRate ||
        format.numChannels !== firstFormat.numChannels ||
        format.bitsPerSample !== firstFormat.bitsPerSample) {
      throw new Error(`Audio chunk ${i} has different format than the first chunk`);
    }
  }

  try {
    // Calculate total audio data size (excluding headers)
    let totalAudioSize = 0;
    for (const chunk of audioChunks) {
      totalAudioSize += chunk.byteLength - 44; // 44 is the WAV header size
    }

    // Create new WAV header
    const header = new ArrayBuffer(44);
    const view = new DataView(header);

    // Write WAV header
    view.setUint32(0, 0x46464952, false); // "RIFF"
    view.setUint32(4, 36 + totalAudioSize, true); // File size - 8
    view.setUint32(8, 0x45564157, false); // "WAVE"
    view.setUint32(12, 0x20746D66, false); // "fmt "
    view.setUint32(16, 16, true); // Subchunk1Size
    view.setUint16(20, 1, true); // AudioFormat (PCM)
    view.setUint16(22, firstFormat.numChannels, true);
    view.setUint32(24, firstFormat.sampleRate, true);
    view.setUint32(28, firstFormat.sampleRate * firstFormat.numChannels * (firstFormat.bitsPerSample / 8), true);
    view.setUint16(32, firstFormat.numChannels * (firstFormat.bitsPerSample / 8), true);
    view.setUint16(34, firstFormat.bitsPerSample, true);
    view.setUint32(36, 0x61746164, false); // "data"
    view.setUint32(40, totalAudioSize, true);

    // Create final buffer and copy header
    const finalBuffer = new Uint8Array(44 + totalAudioSize);
    finalBuffer.set(new Uint8Array(header), 0);

    // Copy audio data from each chunk
    let offset = 44;
    for (const chunk of audioChunks) {
      const audioData = new Uint8Array(chunk).slice(44); // Skip WAV header
      finalBuffer.set(audioData, offset);
      offset += audioData.length;
    }

    return new Blob([finalBuffer], { type: 'audio/wav' });
  } catch (error) {
    console.error('Error concatenating audio chunks:', error);
    throw new Error('Failed to concatenate audio chunks: ' + error.message);
  }
}
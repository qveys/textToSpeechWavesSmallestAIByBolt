export async function textToSpeech(text: string): Promise<ArrayBuffer> {
  try {
    const response = await fetch('https://waves-api.smallest.ai/api/v1/lightning/get_speech?unauthenticated=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'audio/wav'
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
  const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  
  for (const chunk of audioChunks) {
    result.set(new Uint8Array(chunk), offset);
    offset += chunk.byteLength;
  }
  
  return new Blob([result], { type: 'audio/wav' });
}
import { detectLanguage } from '../language/detection';

const API_URL = 'https://api.sws.speechify.com/v1/audio/speech';
const API_KEY = '7jnogIA3AY00cDWGnx2hycCldPRh-HNh-z-1ZMlLYSU=';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  if (typeof atob !== 'function') {
    throw new Error('atob is not available. This function must run in a browser environment.');
  }
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

let lastCall = 0;

export const textToSpeech = async (text: string): Promise<ArrayBuffer> => {
  // Throttle: attend au moins 2s entre chaque appel
  const now = Date.now();
  const wait = 2000 - (now - lastCall);
  if (wait > 0) await new Promise(res => setTimeout(res, wait));
  lastCall = Date.now();

  const maxRetries = 3;
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const voice_id = detectLanguage(text) === 'fr' ? 'raphael' : 'oliver';

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          input: text,
          voice_id,
          language: detectLanguage(text) === 'fr' ? 'fr-FR' : 'en',
          model: 'simba-multilingual'
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = errorText;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorText;
        } catch {}
        throw new Error(`Speechify API error (${response.status}): ${errorMessage}`);
      }

      const data = await response.json();
      if (!data.audio_data) {
        throw new Error('Speechify API: No audio_data in response');
      }
      return base64ToArrayBuffer(data.audio_data);
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
      }
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        attempt++;
        continue;
      }
      throw error;
    }
  }
  throw new Error('Failed to connect to Speechify API after multiple attempts');
};
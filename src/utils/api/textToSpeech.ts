import { detectLanguage } from '../language/detection';

const API_URL = 'https://waves-api.smallest.ai/api/v1/lightning/get_speech?unauthenticated=true';

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

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'https://waves.smallest.ai',
          'Referer': 'https://waves.smallest.ai/'
        },
        body: JSON.stringify({
          text,
          voice_id: detectLanguage(text) === 'fr' ? 'emmanuel' : 'arman',
          speed: 1,
          sample_rate: 24000,
          transliterate: false,
          add_wav_header: true,
          save_history: true,
          enhancement: 1,
          similarity: 0,
          is_pvc: false
        }),
        signal: controller.signal
      }).finally(() => clearTimeout(timeoutId));

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage: string;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorText;
        } catch {
          errorMessage = errorText;
        }

        if (response.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later or sign up for an API key at https://smallest.ai');
        } else if (response.status === 403) {
          throw new Error('Access to the API is forbidden. Please check your API credentials.');
        } else if (response.status === 404) {
          throw new Error('The API endpoint could not be found. Please check the API URL.');
        } else if (response.status === 401) {
          throw new Error('Unauthorized: Please log in at https://waves.smallest.ai first');
        }
        
        throw new Error(`API error (${response.status}): ${errorMessage}`);
      }

      const buffer = await response.arrayBuffer();
      
      if (!buffer.byteLength) {
        throw new Error('Invalid audio format received');
      }

      return buffer;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please try again.');
        }
        
        if (error.message.includes('rate limit') || error.message.includes('Unauthorized')) {
          throw error;
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
  
  throw new Error('Failed to connect to the API after multiple attempts');
};
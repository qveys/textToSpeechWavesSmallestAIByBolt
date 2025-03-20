import { useState, useEffect } from 'react';
import { ChunkStatus } from '../types/textToSpeech';
import { textToSpeech, splitTextIntoChunks, concatenateAudioChunks } from '../utils/textProcessing';

export function useTextToSpeech() {
  const [text, setText] = useState('');
  const [chunks, setChunks] = useState<ChunkStatus[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const handleConvert = async () => {
    if (!text.trim()) {
      setError('Please enter some text to convert');
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(null);

      const textChunks = splitTextIntoChunks(text);
      const initialChunks: ChunkStatus[] = textChunks.map((text, id) => ({
        id,
        text,
        status: 'pending'
      }));
      setChunks(initialChunks);

      const audioChunks: ArrayBuffer[] = [];

      for (let i = 0; i < textChunks.length; i++) {
        setChunks(prev => prev.map(chunk => 
          chunk.id === i ? { ...chunk, status: 'processing' } : chunk
        ));

        const audioBuffer = await textToSpeech(textChunks[i]);
        audioChunks.push(audioBuffer);

        setChunks(prev => prev.map(chunk => 
          chunk.id === i ? { ...chunk, status: 'completed' } : chunk
        ));
      }

      const finalAudio = await concatenateAudioChunks(audioChunks);
      const url = URL.createObjectURL(finalAudio);
      setAudioUrl(url);
    } catch (err) {
      console.error('Conversion error:', err);
      setError((err as Error).message || 'An error occurred during processing');
      setChunks(prev => prev.map(chunk => 
        chunk.status === 'processing' ? { ...chunk, status: 'error' } : chunk
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    text,
    setText,
    chunks,
    isProcessing,
    error,
    audioUrl,
    handleConvert,
  };
}
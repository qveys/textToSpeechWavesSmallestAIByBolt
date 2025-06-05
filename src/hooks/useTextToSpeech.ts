import { useState, useEffect } from 'react';
import { AudioChunk } from '../types/textToSpeech';
import { textToSpeech, splitTextIntoChunks, concatenateAudioChunks } from '../utils/textProcessing';

export const useTextToSpeech = () => {
  const [text, setText] = useState('');
  const [chunks, setChunks] = useState<AudioChunk[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // Nettoie les URLs audio lors du démontage
  useEffect(() => {
    return () => {
      chunks.forEach(chunk => chunk.audioUrl && URL.revokeObjectURL(chunk.audioUrl));
      audioUrl && URL.revokeObjectURL(audioUrl);
    };
  }, []);

  const handleConvert = async () => {
    if (!text.trim()) {
      setError('Veuillez entrer du texte');
      return;
    }

    try {
      setError(null);
      setIsProcessing(true);
      
      // Nettoie les URLs précédentes
      chunks.forEach(chunk => chunk.audioUrl && URL.revokeObjectURL(chunk.audioUrl));
      audioUrl && URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);

      // Initialise les segments
      const textChunks = splitTextIntoChunks(text);
      setChunks(textChunks.map((text, id) => ({
        id, text, status: 'pending', audioUrl: null
      })));

      const audioBuffers: ArrayBuffer[] = [];

      // Traite chaque segment
      for (let i = 0; i < textChunks.length; i++) {
        // Vérifie si un enregistrement existe déjà pour ce chunk
        if (chunks[i] && chunks[i].audioUrl) {
          // On considère ce chunk comme déjà traité
          continue;
        }
        setChunks(prev => prev.map(chunk =>
          chunk.id === i ? { ...chunk, status: 'processing' } : chunk
        ));

        try {
          if (i > 0) await new Promise(resolve => setTimeout(resolve, 10000));
          
          const buffer = await textToSpeech(textChunks[i]);
          audioBuffers.push(buffer);

          const url = URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
          setChunks(prev => prev.map(chunk =>
            chunk.id === i ? { ...chunk, status: 'completed', audioUrl: url } : chunk
          ));
        } catch (error) {
          setChunks(prev => prev.map(chunk =>
            chunk.id === i ? { ...chunk, status: 'error' } : chunk
          ));
          throw error;
        }
      }

      // Combine les segments audio
      const finalAudio = await concatenateAudioChunks(audioBuffers);
      setAudioUrl(URL.createObjectURL(finalAudio));
    } catch (err) {
      setError((err as Error).message);
      setChunks(prev => prev.map(chunk =>
        chunk.status === 'processing' ? { ...chunk, status: 'error' } : chunk
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  return { text, setText, chunks, isProcessing, error, audioUrl, handleConvert };
};
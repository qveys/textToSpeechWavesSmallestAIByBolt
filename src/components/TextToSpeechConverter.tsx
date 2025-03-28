import React from 'react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { AudioPlayer } from './AudioPlayer/AudioPlayer';
import { ChunkPlayer } from './ChunkPlayer/ChunkPlayer';
import { TextInput } from './TextInput/TextInput';
import { ErrorMessage } from './ErrorMessage/ErrorMessage';
import { ConvertButton } from './ConvertButton/ConvertButton';

export function TextToSpeechConverter() {
  const { text, setText, chunks, isProcessing, error, audioUrl, handleConvert } = useTextToSpeech();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-6 space-y-6">
          <h1 className="text-3xl font-bold text-gray-900">Convertisseur Texte en Audio</h1>
          
          <div className="space-y-4">
            <TextInput value={text} onChange={setText} />
            {error && <ErrorMessage message={error} />}
            <ConvertButton onClick={handleConvert} isProcessing={isProcessing} />

            {chunks.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Segments</h2>
                {chunks.map(chunk => (
                  <ChunkPlayer
                    key={chunk.id}
                    chunkNumber={chunk.id}
                    text={chunk.text}
                    audioUrl={chunk.audioUrl}
                    status={chunk.status}
                  />
                ))}
              </div>
            )}

            {audioUrl && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <AudioPlayer audioUrl={audioUrl} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TextToSpeechConverter
import React, { useRef, useEffect } from 'react';
import { Download } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl: string;
}

export function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    audioRef.current?.load();
  }, [audioUrl]);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = 'audio.wav';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Audio Final</h3>
        <button
          onClick={handleDownload}
          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <Download className="h-4 w-4 mr-1" />
          Télécharger
        </button>
      </div>
      <audio ref={audioRef} controls className="w-full" key={audioUrl}>
        <source src={audioUrl} type="audio/wav" />
        Votre navigateur ne supporte pas l'élément audio.
      </audio>
    </div>
  );
}
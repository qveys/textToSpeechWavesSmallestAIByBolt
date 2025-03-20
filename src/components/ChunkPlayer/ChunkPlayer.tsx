import React from 'react';

interface ChunkPlayerProps {
  chunkNumber: number;
  text: string;
  audioUrl: string | null;
  status: string;
}

export function ChunkPlayer({ chunkNumber, text, audioUrl, status }: ChunkPlayerProps) {
  const statusClasses = {
    completed: 'bg-green-100 text-green-800',
    error: 'bg-red-100 text-red-800',
    processing: 'bg-blue-100 text-blue-800',
    pending: 'bg-gray-100 text-gray-800'
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-gray-900">
            Segment {chunkNumber + 1}
          </h3>
          <span className="text-xs text-gray-500">
            ({text.length} caractères)
          </span>
        </div>
        <span className={`text-sm px-2 py-1 rounded-full text-xs font-medium ${
          statusClasses[status as keyof typeof statusClasses]
        }`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-3 border-l-4 border-gray-200 pl-3">
        {text}
      </p>
      
      {audioUrl && status === 'completed' && (
        <audio controls className="w-full h-8">
          <source src={audioUrl} type="audio/wav" />
          Votre navigateur ne supporte pas l'élément audio.
        </audio>
      )}
    </div>
  );
}
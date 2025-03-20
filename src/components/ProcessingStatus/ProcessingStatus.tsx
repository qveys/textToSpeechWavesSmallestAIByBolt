import React from 'react';
import { ChunkStatus } from '../../types/textToSpeech';

interface ProcessingStatusProps {
  chunks: ChunkStatus[];
}

export function ProcessingStatus({ chunks }: ProcessingStatusProps) {
  return (
    <div className="mt-4">
      <h3 className="text-lg font-medium text-gray-900">Processing Status</h3>
      <div className="mt-2 space-y-2">
        {chunks.map((chunk) => (
          <div
            key={chunk.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
          >
            <span className="text-sm text-gray-600">
              Chunk {chunk.id + 1} of {chunks.length}
            </span>
            <span className={`text-sm ${
              chunk.status === 'completed' ? 'text-green-600' :
              chunk.status === 'error' ? 'text-red-600' :
              chunk.status === 'processing' ? 'text-blue-600' :
              'text-gray-600'
            }`}>
              {chunk.status.charAt(0).toUpperCase() + chunk.status.slice(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
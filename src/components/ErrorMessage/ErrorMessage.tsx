import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  const isRateLimit = message.includes('rate limit');
  
  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-red-400" />
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{message}</h3>
          {isRateLimit && (
            <p className="mt-2 text-sm text-red-700">
              To continue using the service, please visit{' '}
              <a
                href="https://smallest.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline hover:text-red-600"
              >
                smallest.ai
              </a>
              {' '}to sign up for an API key.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
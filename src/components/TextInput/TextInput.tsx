import React from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function TextInput({ value, onChange }: TextInputProps) {
  return (
    <div>
      <label htmlFor="text" className="block text-sm font-medium text-gray-700">
        Text to Convert
      </label>
      <textarea
        id="text"
        rows={6}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        placeholder="Enter or paste your text here..."
      />
    </div>
  );
}
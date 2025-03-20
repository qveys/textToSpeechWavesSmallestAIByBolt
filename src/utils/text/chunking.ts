export const splitTextIntoChunks = (text: string, maxLength = 250): string[] => {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (sentence.length > maxLength) {
      const words = sentence.trim().split(/\s+/);
      let chunk = '';
      
      for (const word of words) {
        if ((chunk + ' ' + word).length > maxLength) {
          if (chunk) chunks.push(chunk.trim());
          chunk = word;
        } else {
          chunk = chunk ? chunk + ' ' + word : word;
        }
      }
      if (chunk) chunks.push(chunk.trim());
    } else if ((currentChunk + ' ' + sentence).length <= maxLength) {
      currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
};
const FRENCH_PATTERNS = [
  /[àáâãäçèéêëìíîïñòóôõöùúûüý]/i,
  /\b(je|tu|il|elle|nous|vous|ils|elles|le|la|les)\b/i,
  /\b(est|sont|être|avoir|fait|faire|dit|voir|aller)\b/i,
  /\b(bonjour|merci|s'il|vous|plaît|oui|non)\b/i
];

export const detectLanguage = (text: string): 'fr' | 'en' => 
  FRENCH_PATTERNS.reduce((score, pattern) => 
    score + (pattern.test(text) ? 1 : 0), 0) >= 2 ? 'fr' : 'en';
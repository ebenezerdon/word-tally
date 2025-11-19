(function(){
  'use strict';
  window.App = window.App || {};
  const App = window.App;

  const STORAGE_KEY = 'word-tally-state-v1';

  const STOP_WORDS = new Set([
    'a','about','above','after','again','against','all','am','an','and','any','are','as','at','be','because','been','before','being','below','between','both','but','by','could','did','do','does','doing','down','during','each','few','for','from','further','had','has','have','having','he','her','here','hers','herself','him','himself','his','how','i','if','in','into','is','it','its','itself','just','me','more','most','my','myself','no','nor','not','now','of','off','on','once','only','or','other','our','ours','ourselves','out','over','own','same','she','should','so','some','such','than','that','the','their','theirs','them','themselves','then','there','these','they','this','those','through','to','too','under','until','up','very','was','we','were','what','when','where','which','while','who','whom','why','with','you','your','yours','yourself','yourselves'
  ]);

  function sanitizeText(text) {
    if (typeof text !== 'string') return '';
    return text.replace(/\u0000/g, '').replace(/\r/g, '').trim();
  }

  function tokenizeWords(text, opts) {
    const options = Object.assign({ ignoreStopWords: true, minWordLength: 3, caseInsensitive: true }, opts || {});
    const cleaned = sanitizeText(text);
    const matches = cleaned.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9']+/g) || [];
    return matches
      .map(w => options.caseInsensitive ? w.toLowerCase() : w)
      .filter(w => w.length >= options.minWordLength)
      .filter(w => options.ignoreStopWords ? !STOP_WORDS.has(w) : true);
  }

  function sentenceCount(text) {
    const cleaned = sanitizeText(text);
    const matches = cleaned.match(/[^.!?\n]+[.!?\n]+/g);
    if (!matches) return cleaned.length ? 1 : 0;
    return matches.length;
  }

  function paragraphCount(text) {
    const paragraphs = sanitizeText(text).split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    return paragraphs.length;
  }

  function countSyllables(word) {
    // Heuristic syllable counter
    if (!word) return 0;
    const w = word.toLowerCase().replace(/[^a-z]/g, '');
    if (!w) return 0;
    if (w.length <= 3) return 1;
    const vowels = 'aeiouy';
    let syllables = 0;
    let prevVowel = false;
    for (let i = 0; i < w.length; i++) {
      const isVowel = vowels.indexOf(w[i]) >= 0;
      if (isVowel && !prevVowel) syllables++;
      prevVowel = isVowel;
    }
    // Remove silent e
    if (w.endsWith('e')) syllables--;
    // Adjust for special endings
    if (w.match(/(le|les)$/) && !w.match(/[aeiou]le$/)) syllables++;
    if (syllables <= 0) syllables = 1;
    return syllables;
  }

  function computeReadability(words, sentences, syllables) {
    const safeWords = words || 0;
    const safeSentences = sentences || 0;
    if (safeWords === 0 || safeSentences === 0) {
      return { flesch: 0, fk: 0 };
    }
    const wordsPerSentence = safeWords / safeSentences;
    const syllablesPerWord = syllables / safeWords;
    const flesch = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
    const fk = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
    return { flesch, fk };
  }

  function computeStats(text, opts) {
    const options = Object.assign({ ignoreStopWords: true, minWordLength: 3, caseInsensitive: true, topN: 10 }, opts || {});
    const cleaned = sanitizeText(text);

    const charsWithSpaces = cleaned.length;
    const charsNoSpaces = cleaned.replace(/\s+/g, '').length;

    const allTokens = (cleaned.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9']+/g) || []).map(t => options.caseInsensitive ? t.toLowerCase() : t);
    const wordsCount = allTokens.length;
    const sentences = sentenceCount(cleaned);
    const paragraphs = paragraphCount(cleaned);

    let totalSyllables = 0;
    for (const token of allTokens) { totalSyllables += countSyllables(token); }

    const { flesch, fk } = computeReadability(wordsCount, sentences, totalSyllables);

    const tokensForDensity = tokenizeWords(cleaned, options);
    const freq = new Map();
    tokensForDensity.forEach(w => freq.set(w, (freq.get(w) || 0) + 1));
    const topKeywords = Array.from(freq.entries())
      .sort((a,b) => b[1] - a[1])
      .slice(0, Math.max(1, options.topN))
      .map(([word, count]) => ({ word, count, density: wordsCount ? (count / wordsCount) * 100 : 0 }));

    const avgWordLength = wordsCount ? (allTokens.join('').length / wordsCount) : 0;

    const wpm = 200; // reading time
    const totalMinutes = wordsCount / wpm;
    const minutes = Math.floor(totalMinutes);
    const seconds = Math.round((totalMinutes - minutes) * 60);

    return {
      charsWithSpaces,
      charsNoSpaces,
      wordsCount,
      sentences,
      paragraphs,
      avgWordLength,
      readingTime: { minutes, seconds },
      flesch: isFinite(flesch) ? flesch : 0,
      fk: isFinite(fk) ? fk : 0,
      topKeywords
    };
  }

  function debounce(fn, delay) {
    let t = null;
    return function() {
      const ctx = this; const args = arguments;
      clearTimeout(t);
      t = setTimeout(function(){ fn.apply(ctx, args); }, delay);
    };
  }

  App.Utils = {
    sanitizeText,
    tokenizeWords,
    sentenceCount,
    paragraphCount,
    countSyllables,
    computeStats,
    debounce,
    STOP_WORDS
  };

  App.Storage = {
    saveState: function(state) {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch(e) { /* ignore */ }
    },
    loadState: function() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : null;
      } catch(e) { return null; }
    },
    clearState: function() { try { localStorage.removeItem(STORAGE_KEY); } catch(e) {} }
  };
})();

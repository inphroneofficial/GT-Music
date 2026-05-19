import { useEffect, useMemo, useState } from 'react';

interface TypingTextProps {
  phrases: string[];
  className?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseMs?: number;
}

export function TypingText({
  phrases,
  className,
  typingSpeed = 75,
  deletingSpeed = 42,
  pauseMs = 1800,
}: TypingTextProps) {
  const safePhrases = useMemo(() => phrases.filter(Boolean), [phrases]);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [display, setDisplay] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (safePhrases.length === 0) return;

    const activePhrase = safePhrases[phraseIndex % safePhrases.length];
    const targetLength = activePhrase.length;

    if (!isDeleting && display.length === targetLength) {
      const pauseTimer = window.setTimeout(() => setIsDeleting(true), pauseMs);
      return () => window.clearTimeout(pauseTimer);
    }

    if (isDeleting && display.length === 0) {
      setIsDeleting(false);
      setPhraseIndex((current) => (current + 1) % safePhrases.length);
      return;
    }

    const timer = window.setTimeout(() => {
      const nextLength = isDeleting ? display.length - 1 : display.length + 1;
      setDisplay(activePhrase.slice(0, nextLength));
    }, isDeleting ? deletingSpeed : typingSpeed);

    return () => window.clearTimeout(timer);
  }, [deletingSpeed, display, isDeleting, pauseMs, phraseIndex, safePhrases, typingSpeed]);

  return (
    <span className={className}>
      {display}
      <span className="ml-1 inline-block h-[1em] w-[0.12em] animate-pulse rounded-full bg-primary align-[-0.1em]" aria-hidden="true" />
    </span>
  );
}

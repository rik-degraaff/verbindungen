import React from 'react';

export type TutorialStep = 'welcome' | 'first-feedback' | 'after-yellow' | 'after-green' | 'after-blue' | 'completed';

export type TutorialState = {
  active: boolean;
  visible: boolean;
  step: TutorialStep;
  firstGuessMade: boolean;
  didShuffle: boolean;
  didDragSwap: boolean;
};

export const TUTORIAL_TARGET_WORDS = ['APFEL', 'LAMPE', 'LATERNE', 'NEON'] as const;
export const TUTORIAL_CATEGORY_ORDER = ['cat-0', 'cat-1', 'cat-2', 'cat-3'] as const;

export const computeTutorialStep = (
  firstGuessMade: boolean,
  solvedCategoryIds: string[],
  didShuffle: boolean,
  didDragSwap: boolean
): TutorialStep => {
  if (!firstGuessMade) return 'welcome';

  const solved = new Set(solvedCategoryIds);
  if (!solved.has('cat-0')) return 'first-feedback';
  if (!didShuffle || !didDragSwap) return 'after-yellow';
  if (!solved.has('cat-1')) return 'after-yellow';
  if (!solved.has('cat-2')) return 'after-green';
  if (!solved.has('cat-3')) return 'after-blue';
  return 'completed';
};

interface TutorialModalProps {
  step: TutorialStep;
  onClose: () => void;
}

const HandHint: React.FC<{ motion: 'tap' | 'drag' }> = ({ motion }) => {
  return <div className={motion === 'drag' ? 'text-4xl animate-bounce select-none' : 'text-4xl animate-pulse select-none'}>👉</div>;
};

const TargetWords: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {TUTORIAL_TARGET_WORDS.map((word) => (
        <div key={word} className="rounded-xl border border-stone-300 bg-white px-3 py-2 text-center text-sm font-bold tracking-wide shadow-sm">
          {word}
        </div>
      ))}
    </div>
  );
};

export const TutorialModal: React.FC<TutorialModalProps> = ({ step, onClose }) => {
  let title = '';
  let body: React.ReactNode = null;

  switch (step) {
    case 'welcome':
      title = 'Erster Zug';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Schließ dieses Fenster. Die Glühbirne oben rechts bringt es zurück.</p>
          <p>Für den ersten Zug suchst du diese vier Wörter:</p>
          <div className="flex items-center gap-3 rounded-2xl bg-amber-50 p-3">
            <HandHint motion="tap" />
            <TargetWords />
          </div>
          <p>Dann schließe das Fenster und prüfe genau diese vier.</p>
        </div>
      );
      break;
    case 'first-feedback':
      title = 'Eins daneben';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Genau so sieht ein fast richtiger Versuch aus: drei passen zusammen, einer nicht.</p>
          <p>Jetzt löst du die einfache Gruppe im Feld.</p>
        </div>
      );
      break;
    case 'after-yellow':
      title = 'Werkzeuge nutzen';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Bevor es weitergeht: nutze beide Hilfen einmal.</p>
          <div className="flex items-center gap-3 rounded-2xl bg-stone-100 p-3">
            <HandHint motion="drag" />
            <div className="space-y-1">
              <p className="font-semibold">Lange drücken verschiebt ein Wort.</p>
              <p>Drücke danach einmal auf ↻ zum Mischen.</p>
            </div>
          </div>
          <p>Dann löse die nächste Gruppe.</p>
        </div>
      );
      break;
    case 'after-green':
      title = 'Halbzeit';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Gut. Zwei Gruppen sind geschafft.</p>
          <p>Jetzt suche die Wörter, die mit demselben Muster zusammenhängen.</p>
        </div>
      );
      break;
    case 'after-blue':
      title = 'Letzte Gruppe';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Nur noch vier Wörter. Wenn du die letzte Gruppe siehst, ist das Rätsel durch.</p>
          <p>Wenn du festhängst, hol dir das Fenster mit der Glühbirne zurück.</p>
        </div>
      );
      break;
    case 'completed':
      title = 'Geschafft';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Du kennst jetzt den Ablauf.</p>
          <p>Ab jetzt kannst du normale Rätsel spielen.</p>
        </div>
      );
      break;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-2xl font-black tracking-tight text-stone-900">{title}</h2>
        <div className="mb-6">{body}</div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50"
          >
            Ausblenden
          </button>
        </div>
      </div>
    </div>
  );
};

export const TUTORIAL_PUZZLE = [
  [
    { desc: 'FRÜCHTE', words: ['APFEL', 'BANANE', 'ORANGE', 'KIRSCHE'] },
    { desc: 'DINGE MIT WASSER', words: ['FLUSS', 'QUELLE', 'BRUNNEN', 'TEICH'] },
    { desc: 'LEUCHTENDE DINGE', words: ['LAMPE', 'LATERNE', 'NEON', 'KERZE'] },
    { desc: 'PRÄPOSITIONEN', words: ['VON', 'MIT', 'ZU', 'BEI'] },
  ],
];

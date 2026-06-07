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

type TutorialColorKey = 'yellow' | 'green' | 'blue' | 'purple';

export const TUTORIAL_COLOR_GUIDE: Record<TutorialColorKey, { label: string; hint: string; categoryType: string }> = {
  yellow: {
    label: 'Gelb',
    hint: 'Denk an typische Obstsorten.',
    categoryType: 'Direkte Oberkategorie (gleiche Art von Dingen).',
  },
  green: {
    label: 'Grün',
    hint: 'Such Dinge, die mit Wasser zu tun haben.',
    categoryType: 'Thema/Anwendungsfeld (gleicher Kontext).',
  },
  blue: {
    label: 'Blau',
    hint: 'Finde Wörter, die mit Leuchten zusammenhängen.',
    categoryType: 'Muster oder Wortfeld (nicht nur offensichtliche Synonyme).',
  },
  purple: {
    label: 'Lila',
    hint: 'Bleiben Präpositionen oder Funktionswörter übrig?',
    categoryType: 'Sprachstruktur/Grammatik statt Objektkategorie.',
  },
};

export const getExpectedTutorialCategoryId = (
  solvedCategoryIds: string[],
  didShuffle: boolean,
  didDragSwap: boolean
): string | null => {
  if (!solvedCategoryIds.includes('cat-0')) return 'cat-0';
  if (!didShuffle || !didDragSwap) return null;
  if (!solvedCategoryIds.includes('cat-1')) return 'cat-1';
  if (!solvedCategoryIds.includes('cat-2')) return 'cat-2';
  if (!solvedCategoryIds.includes('cat-3')) return 'cat-3';
  return null;
};

export const getClosedTutorialHint = (
  step: TutorialStep,
  solvedCategoryIds: string[],
  didShuffle: boolean,
  didDragSwap: boolean,
  firstGuessMade: boolean
): string => {
  if (!firstGuessMade) return 'Hinweis Start: APFEL, LAMPE, LATERNE, NEON. Wichtig: genau diese 4 prüfen.';

  const solved = new Set(solvedCategoryIds);
  if (!solved.has('cat-0')) {
    return `Hinweis ${TUTORIAL_COLOR_GUIDE.yellow.label}: ${TUTORIAL_COLOR_GUIDE.yellow.hint} Typ: ${TUTORIAL_COLOR_GUIDE.yellow.categoryType}`;
  }
  if (!didShuffle || !didDragSwap) {
    return `Hinweis ${TUTORIAL_COLOR_GUIDE.green.label}: ${TUTORIAL_COLOR_GUIDE.green.hint} Wichtig: 1x ziehen/tauschen und 1x ↻.`;
  }
  if (!solved.has('cat-1')) {
    return `Hinweis ${TUTORIAL_COLOR_GUIDE.green.label}: ${TUTORIAL_COLOR_GUIDE.green.hint} Typ: ${TUTORIAL_COLOR_GUIDE.green.categoryType}`;
  }
  if (!solved.has('cat-2')) {
    return `Hinweis ${TUTORIAL_COLOR_GUIDE.blue.label}: ${TUTORIAL_COLOR_GUIDE.blue.hint} Typ: ${TUTORIAL_COLOR_GUIDE.blue.categoryType}`;
  }
  if (!solved.has('cat-3')) {
    return `Hinweis ${TUTORIAL_COLOR_GUIDE.purple.label}: ${TUTORIAL_COLOR_GUIDE.purple.hint} Typ: ${TUTORIAL_COLOR_GUIDE.purple.categoryType}`;
  }

  if (step === 'completed') return 'Tutorial abgeschlossen.';
  return 'Hinweis: Prüfe die nächste Gruppe.';
};

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
  didShuffle: boolean;
  didDragSwap: boolean;
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
          <div className="space-y-2 rounded-2xl border border-stone-200 bg-stone-50 p-3">
            <p className="font-semibold">Hinweise pro Farbe:</p>
            <ul className="space-y-1 text-xs leading-snug">
              <li><strong>Gelb:</strong> {TUTORIAL_COLOR_GUIDE.yellow.hint} <em>Typ:</em> {TUTORIAL_COLOR_GUIDE.yellow.categoryType}</li>
              <li><strong>Grün:</strong> {TUTORIAL_COLOR_GUIDE.green.hint} <em>Typ:</em> {TUTORIAL_COLOR_GUIDE.green.categoryType}</li>
              <li><strong>Blau:</strong> {TUTORIAL_COLOR_GUIDE.blue.hint} <em>Typ:</em> {TUTORIAL_COLOR_GUIDE.blue.categoryType}</li>
              <li><strong>Lila:</strong> {TUTORIAL_COLOR_GUIDE.purple.hint} <em>Typ:</em> {TUTORIAL_COLOR_GUIDE.purple.categoryType}</li>
            </ul>
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
          <p><strong>Hinweis Gelb:</strong> {TUTORIAL_COLOR_GUIDE.yellow.hint}</p>
          <p><strong>Kategorie-Typ:</strong> {TUTORIAL_COLOR_GUIDE.yellow.categoryType}</p>
        </div>
      );
      break;
    case 'after-yellow':
      title = 'Werkzeuge nutzen';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p><strong>Hinweis Grün:</strong> {TUTORIAL_COLOR_GUIDE.green.hint}</p>
          <p><strong>Kategorie-Typ:</strong> {TUTORIAL_COLOR_GUIDE.green.categoryType}</p>
          <p>Bevor es weitergeht: nutze beide Hilfen einmal.</p>
          <div className="flex items-center gap-3 rounded-2xl bg-stone-100 p-3">
            <HandHint motion="drag" />
            <div className="space-y-1">
              <p className="font-semibold">Lange drücken verschiebt ein Wort.</p>
              <p>Drücke danach einmal auf ↻ zum Mischen.</p>
            </div>
          </div>
          <p>Erst danach wird die nächste richtige Gruppe akzeptiert.</p>
        </div>
      );
      break;
    case 'after-green':
      title = 'Halbzeit';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Gut. Zwei Gruppen sind geschafft.</p>
          <p><strong>Hinweis Blau:</strong> {TUTORIAL_COLOR_GUIDE.blue.hint}</p>
          <p><strong>Kategorie-Typ:</strong> {TUTORIAL_COLOR_GUIDE.blue.categoryType}</p>
        </div>
      );
      break;
    case 'after-blue':
      title = 'Letzte Gruppe';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Nur noch vier Wörter.</p>
          <p><strong>Hinweis Lila:</strong> {TUTORIAL_COLOR_GUIDE.purple.hint}</p>
          <p><strong>Kategorie-Typ:</strong> {TUTORIAL_COLOR_GUIDE.purple.categoryType}</p>
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

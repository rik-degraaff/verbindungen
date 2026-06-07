import React from 'react';

export type TutorialStep =
  | 'welcome'
  | 'first-feedback'
  | 'shuffle-step'
  | 'reorder-step'
  | 'green-guess'
  | 'failed-guess-replay'
  | 'blue-guess'
  | 'purple-intro'
  | 'completed';

export type TutorialState = {
  active: boolean;
  visible: boolean;
  step: TutorialStep;
  firstGuessMade: boolean;
  didShuffle: boolean;
  didDragSwap: boolean;
  didReplayFailedGuess: boolean;
  initialFailedGuessId: string | null;
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
    hint: 'Achte auf sehr indirekte sprachliche Beziehungen.',
    categoryType: 'Meta-/Wortform-Verbindungen statt offensichtlicher Sachgruppen.',
  },
};

export const getExpectedTutorialCategoryId = (
  solvedCategoryIds: string[],
  didShuffle: boolean,
  didDragSwap: boolean,
  didReplayFailedGuess: boolean
): string | null => {
  if (!solvedCategoryIds.includes('cat-0')) return 'cat-0';
  if (!didShuffle || !didDragSwap) return null;
  if (!solvedCategoryIds.includes('cat-1')) return 'cat-1';
  if (!didReplayFailedGuess) return null;
  if (!solvedCategoryIds.includes('cat-2')) return 'cat-2';
  if (!solvedCategoryIds.includes('cat-3')) return 'cat-3';
  return null;
};

export const getClosedTutorialHint = (
  step: TutorialStep,
  solvedCategoryIds: string[],
  didShuffle: boolean,
  didDragSwap: boolean,
  firstGuessMade: boolean,
  didReplayFailedGuess: boolean
): string => {
  if (!firstGuessMade) return 'Hinweis Start: APFEL, LAMPE, LATERNE, NEON. Wichtig: genau diese 4 prüfen.';

  const solved = new Set(solvedCategoryIds);
  if (!solved.has('cat-0')) {
    return `Hinweis ${TUTORIAL_COLOR_GUIDE.yellow.label}: ${TUTORIAL_COLOR_GUIDE.yellow.hint} Typ: ${TUTORIAL_COLOR_GUIDE.yellow.categoryType}`;
  }
  if (!didShuffle) {
    return 'Wichtig: Drücke jetzt zuerst einmal auf ↻ (Mischen).';
  }
  if (!didDragSwap) {
    return 'Wichtig: Verschiebe jetzt 1 Wort per langem Drücken und Ziehen.';
  }
  if (!solved.has('cat-1')) {
    return `Hinweis ${TUTORIAL_COLOR_GUIDE.green.label}: ${TUTORIAL_COLOR_GUIDE.green.hint} Typ: ${TUTORIAL_COLOR_GUIDE.green.categoryType}`;
  }
  if (!didReplayFailedGuess) {
    return 'Wichtig: Tippe unten auf „APFEL, NEON, LATERNE, LAMPE“. Das wählt die noch verfügbaren Wörter.';
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
  didDragSwap: boolean,
  didReplayFailedGuess: boolean
): TutorialStep => {
  if (!firstGuessMade) return 'welcome';

  const solved = new Set(solvedCategoryIds);
  if (!solved.has('cat-0')) return 'first-feedback';
  if (!didShuffle) return 'shuffle-step';
  if (!didDragSwap) return 'reorder-step';
  if (!solved.has('cat-1')) return 'green-guess';
  if (!didReplayFailedGuess) return 'failed-guess-replay';
  if (!solved.has('cat-2')) return 'blue-guess';
  if (!solved.has('cat-3')) return 'purple-intro';
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
    case 'shuffle-step':
      title = 'Schritt 1: Mischen';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Drücke jetzt einmal auf den ↻-Button.</p>
          <p>Damit lernst du, wie du bei Blockaden neue Anordnungen erzeugst.</p>
        </div>
      );
      break;
    case 'reorder-step':
      title = 'Schritt 2: Neu anordnen';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Verschiebe jetzt genau ein Wort per langem Drücken und Ziehen.</p>
          <div className="flex items-center gap-3 rounded-2xl bg-stone-100 p-3">
            <HandHint motion="drag" />
            <div className="space-y-1">
              <p className="font-semibold">Lange drücken verschiebt ein Wort.</p>
              <p>Das hilft beim visuellen Sortieren von Ideen.</p>
            </div>
          </div>
        </div>
      );
      break;
    case 'green-guess':
      title = 'Schritt 3: Grüne Gruppe';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Jetzt darfst du die nächste Gruppe lösen.</p>
          <p><strong>Hinweis Grün:</strong> {TUTORIAL_COLOR_GUIDE.green.hint}</p>
          <p><strong>Kategorie-Typ:</strong> {TUTORIAL_COLOR_GUIDE.green.categoryType}</p>
        </div>
      );
      break;
    case 'failed-guess-replay':
      title = 'Vor Blau: Alten Versuch nutzen';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Tippe jetzt unten auf deinen ersten Fehlversuch: „APFEL, NEON, LATERNE, LAMPE“.</p>
          <p>Das wählt automatisch die Wörter aus, die davon noch verfügbar sind.</p>
          <p>Wichtig: Die drei übrig gebliebenen Wörter müssen zusammengehören, weil der Versuch nur 1 daneben war.</p>
        </div>
      );
      break;
    case 'blue-guess':
      title = 'Schritt 4: Blaue Gruppe';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p><strong>Hinweis Blau:</strong> {TUTORIAL_COLOR_GUIDE.blue.hint}</p>
          <p><strong>Kategorie-Typ:</strong> {TUTORIAL_COLOR_GUIDE.blue.categoryType}</p>
        </div>
      );
      break;
    case 'purple-intro':
      title = 'Letzter Schritt: Lila';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Ab hier kannst du im Tutorial nicht mehr verlieren.</p>
          <p>Versuch zuerst selbst zu erkennen, was die letzte Kategorie sein könnte.</p>
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

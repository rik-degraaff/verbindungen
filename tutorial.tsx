import React from 'react';

export type TutorialStep =
  | 'welcome'
  | 'first-feedback'
  | 'clear-selection-step'
  | 'yellow-guess'
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
  didDeselectAll: boolean;
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
    categoryType: 'Eine direkte, leicht erkennbare Sachgruppe.',
  },
  green: {
    label: 'Grün',
    hint: 'Such Dinge, die mit Wasser zu tun haben.',
    categoryType: 'Ein gemeinsames Thema oder ein gemeinsamer Zusammenhang.',
  },
  blue: {
    label: 'Blau',
    hint: 'Finde Wörter, die mit Leuchten zusammenhängen.',
    categoryType: 'Ein Muster, ein Wortfeld oder eine indirekte Verbindung.',
  },
  purple: {
    label: 'Lila',
    hint: 'Achte auf sehr indirekte sprachliche Beziehungen.',
    categoryType: 'Eine sprachliche oder sehr versteckte Verbindung.',
  },
};

export const getExpectedTutorialCategoryId = (
  solvedCategoryIds: string[],
  didDeselectAll: boolean,
  didShuffle: boolean,
  didDragSwap: boolean,
  didReplayFailedGuess: boolean
): string | null => {
  if (!didDeselectAll) return null;
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
  didDeselectAll: boolean,
  didShuffle: boolean,
  didDragSwap: boolean,
  firstGuessMade: boolean,
  didReplayFailedGuess: boolean
): string => {
  if (!firstGuessMade) return 'Hinweis Start: APFEL, LAMPE, LATERNE, NEON. Wichtig: genau diese 4 prüfen.';

  const solved = new Set(solvedCategoryIds);
  if (!didDeselectAll) {
    return 'Geheimer Tipp: Nur 1 dieser 4 gehört zu Gelb. Hebe die Auswahl jetzt komplett auf.';
  }
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
  didDeselectAll: boolean,
  didShuffle: boolean,
  didDragSwap: boolean,
  didReplayFailedGuess: boolean
): TutorialStep => {
  if (!firstGuessMade) return 'welcome';

  const solved = new Set(solvedCategoryIds);
  if (!didDeselectAll) return stepAfterFirstFeedback(solvedCategoryIds);
  if (!solved.has('cat-0')) return 'yellow-guess';
  if (!didShuffle) return 'shuffle-step';
  if (!didDragSwap) return 'reorder-step';
  if (!solved.has('cat-1')) return 'green-guess';
  if (!didReplayFailedGuess) return 'failed-guess-replay';
  if (!solved.has('cat-2')) return 'blue-guess';
  if (!solved.has('cat-3')) return 'purple-intro';
  return 'completed';
};

const stepAfterFirstFeedback = (solvedCategoryIds: string[]): TutorialStep => {
  const solved = new Set(solvedCategoryIds);
  if (!solved.has('cat-0')) return 'clear-selection-step';
  return 'clear-selection-step';
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
      title = 'So funktioniert das Spiel';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>In diesem Spiel suchst du vier Gruppen mit je vier zusammengehörenden Wörtern.</p>
          <p>Du tippst Wörter an, um sie auszuwählen. Wenn vier markiert sind, prüfst du deinen Versuch mit <strong>Prüfen</strong>.</p>
          <div className="flex items-center gap-3 rounded-2xl bg-amber-50 p-3">
            <HandHint motion="tap" />
            <TargetWords />
          </div>
          <div className="space-y-2 rounded-2xl border border-stone-200 bg-stone-50 p-3">
            <p className="font-semibold">Was die Farben meistens bedeuten:</p>
            <ul className="space-y-1 text-xs leading-snug">
              <li><strong>Gelb:</strong> meist die einfachste und direkteste Gruppe.</li>
              <li><strong>Grün:</strong> etwas kniffliger, oft über ein gemeinsames Thema verbunden.</li>
              <li><strong>Blau:</strong> häufig ein Muster, ein Ausdruck oder eine indirekte Verbindung.</li>
              <li><strong>Lila:</strong> meistens die schwerste Gruppe und oft sprachlich oder sehr versteckt.</li>
            </ul>
          </div>
          <p>Für den ersten Schritt gebe ich dir vier Wörter vor. Schließ dieses Fenster und prüfe genau diese vier.</p>
          <p>Die Glühbirne oben rechts bringt das Tutorial jederzeit zurück.</p>
        </div>
      );
      break;
    case 'first-feedback':
      title = 'Knapp daneben';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Das war absichtlich fast richtig: Drei dieser Wörter gehören zusammen, eins nicht.</p>
          <p>So erkennst du einen Versuch, der nur <strong>eins daneben</strong> ist.</p>
          <p>Ich gebe dir noch einen kleinen Tipp dazu: Von diesen vier Wörtern gehört nur <strong>eins</strong> zur ersten echten Gruppe, die du gleich lösen wirst.</p>
        </div>
      );
      break;
    case 'clear-selection-step':
      title = 'Schritt 1: Auswahl aufheben';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Drücke jetzt auf <strong>Auswahl aufheben</strong>.</p>
          <p>Geheimer Tipp auf's Haus: Von den vier markierten Wörtern gehört nur eins zur ersten richtigen Gruppe.</p>
          <p>Darum ist es sinnvoll, die Auswahl erst einmal komplett zu leeren und neu zu starten.</p>
        </div>
      );
      break;
    case 'yellow-guess':
      title = 'Schritt 2: Gelbe Gruppe';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Jetzt suchst du die erste richtige Gruppe und prüfst sie.</p>
          <p><strong>Hinweis Gelb:</strong> {TUTORIAL_COLOR_GUIDE.yellow.hint}</p>
          <p><strong>Kategorie-Typ:</strong> {TUTORIAL_COLOR_GUIDE.yellow.categoryType}</p>
        </div>
      );
      break;
    case 'shuffle-step':
      title = 'Schritt 3: Mischen';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Drücke jetzt einmal auf den ↻-Button.</p>
          <p>Damit mischst du die Wörter neu. Das ist nützlich, wenn du dich an einer Anordnung festgesehen hast.</p>
        </div>
      );
      break;
    case 'reorder-step':
      title = 'Schritt 4: Neu anordnen';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Verschiebe jetzt genau ein Wort per langem Drücken und Ziehen.</p>
          <div className="flex items-center gap-3 rounded-2xl bg-stone-100 p-3">
            <HandHint motion="drag" />
            <div className="space-y-1">
              <p className="font-semibold">Lange drücken verschiebt ein Wort.</p>
              <p>So kannst du Wörter nebeneinander legen, die für dich zusammenpassen könnten.</p>
            </div>
          </div>
        </div>
      );
      break;
    case 'green-guess':
      title = 'Schritt 5: Grüne Gruppe';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Jetzt suchst du die nächste richtige Gruppe.</p>
          <p><strong>Hinweis Grün:</strong> {TUTORIAL_COLOR_GUIDE.green.hint}</p>
          <p><strong>Kategorie-Typ:</strong> {TUTORIAL_COLOR_GUIDE.green.categoryType}</p>
        </div>
      );
      break;
    case 'failed-guess-replay':
      title = 'Schritt 6: Alten Versuch nutzen';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Tippe jetzt unten auf deinen ersten Fehlversuch: „APFEL, NEON, LATERNE, LAMPE“.</p>
          <p>Dadurch werden die Wörter aus diesem Versuch wieder ausgewählt, soweit sie noch im Feld liegen.</p>
          <p>Wichtig: Die drei noch verfügbaren Wörter daraus müssen zusammengehören, weil dieser Versuch nur eins daneben war.</p>
        </div>
      );
      break;
    case 'blue-guess':
      title = 'Schritt 7: Blaue Gruppe';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Jetzt ergänzt du aus diesem fast richtigen Versuch die fehlende vierte Verbindung.</p>
          <p><strong>Hinweis Blau:</strong> {TUTORIAL_COLOR_GUIDE.blue.hint}</p>
          <p><strong>Kategorie-Typ:</strong> {TUTORIAL_COLOR_GUIDE.blue.categoryType}</p>
        </div>
      );
      break;
    case 'purple-intro':
      title = 'Schritt 8: Lila';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Ab hier kannst du im Tutorial nicht mehr verlieren.</p>
          <p>Versuch zuerst selbst herauszufinden, was die letzte Kategorie sein könnte.</p>
          <p><strong>Hinweis Lila:</strong> {TUTORIAL_COLOR_GUIDE.purple.hint}</p>
          <p><strong>Kategorie-Typ:</strong> {TUTORIAL_COLOR_GUIDE.purple.categoryType}</p>
        </div>
      );
      break;
    case 'completed':
      title = 'Geschafft';
      body = (
        <div className="space-y-4 text-sm text-stone-700">
          <p>Du hast die wichtigsten Regeln und Hilfen kennengelernt.</p>
          <p>Jetzt bist du bereit für normale Rätsel.</p>
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

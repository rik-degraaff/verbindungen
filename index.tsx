import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import puzzles from './puzzles.json';

const customStyles = `
  @keyframes shake {
    10%, 90% { transform: translate3d(-1px, 0, 0); }
    20%, 80% { transform: translate3d(2px, 0, 0); }
    30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
    40%, 60% { transform: translate3d(4px, 0, 0); }
  }
  .animate-shake {
    animation: shake 0.5s cubic-bezier(.36,.07,.19,.97) both;
  }
  .tile-transition {
    transition: background-color 0.15s ease, transform 0.12s ease, color 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
  }
  .tile-transition:active {
    transform: scale(0.98);
  }
`;

type PuzzleGroup = {
  desc: string;
  words: [string, string, string, string];
};

type Puzzle = [PuzzleGroup, PuzzleGroup, PuzzleGroup, PuzzleGroup];

type Category = {
  id: string;
  color: string;
  title: string;
  words: [string, string, string, string];
};

type Tile = {
  id: string;
  categoryId: string;
  word: string;
};

type WrongGuess = {
  id: string;
  tileIds: string[];
  words: string[];
  oneAway: boolean;
};

type Point = {
  x: number;
  y: number;
};

const CATEGORY_COLORS = ['#f9df6d', '#a0c35a', '#b0c4ef', '#ba81c5'] as const;
const LONG_PRESS_MS = 260;

const parsePuzzleIdFromPath = (path: string): number | null => {
  const match = path.match(/^\/puzzle\/(\d+)\/?$/);
  if (!match) return null;

  const id = Number(match[1]);
  return Number.isInteger(id) && id >= 0 ? id : null;
};

const buildPathForPuzzle = (id: number) => `/puzzle/${id}`;

// TODO: We'll pull these from a server first, and also add an option to pull the daily puzzle from current time.
const getPuzzleById = (id: number): Category[] | null => {
  const puzzle = (puzzles as Puzzle[])[id];
  if (!puzzle || puzzle.length !== 4) {
    return null;
  }

  return puzzle.map((group, index) => ({
    id: `cat-${index}`,
    color: CATEGORY_COLORS[index],
    title: group.desc.trim().toUpperCase(),
    words: group.words.map((word) => word.trim().toUpperCase()) as [string, string, string, string],
  }));
};

const findHoveredTileId = (x: number, y: number): string | null => {
  const hoveredElement = document.elementFromPoint(x, y) as HTMLElement | null;
  const tileElement = hoveredElement?.closest('[data-tile-id]') as HTMLElement | null;
  return tileElement?.dataset.tileId ?? null;
};

function AutoFitTileWord({ word }: { word: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const text = textRef.current;
    if (!container || !text) return;

    const fit = () => {
      const maxFontSize = 15;
      const minFontSize = 9;
      const breakThreshold = 11;
      let fontSize = maxFontSize;

      text.style.lineHeight = '1.1';

      // Prefer a single unbroken line first.
      text.style.whiteSpace = 'nowrap';
      text.style.overflowWrap = 'normal';
      text.style.wordBreak = 'normal';
      text.style.fontSize = `${fontSize}px`;

      while (fontSize > breakThreshold && text.scrollWidth > container.clientWidth) {
        fontSize -= 1;
        text.style.fontSize = `${fontSize}px`;
      }

      // Only allow hard wrapping as a last resort below threshold.
      if (text.scrollWidth > container.clientWidth) {
        text.style.whiteSpace = 'normal';
        text.style.overflowWrap = 'anywhere';
        text.style.wordBreak = 'break-word';

        while (
          fontSize > minFontSize &&
          (text.scrollWidth > container.clientWidth || text.scrollHeight > container.clientHeight)
        ) {
          fontSize -= 1;
          text.style.fontSize = `${fontSize}px`;
        }
      }
    };

    fit();

    const observer = new ResizeObserver(() => fit());
    observer.observe(container);

    return () => observer.disconnect();
  }, [word]);

  return (
    <div ref={containerRef} className="h-full w-full overflow-hidden px-1 py-1 flex items-center justify-center">
      <span
        ref={textRef}
        className="block max-h-full w-full text-center font-bold leading-tight"
      >
        {word}
      </span>
    </div>
  );
}

export default function App() {
  const [gameState, setGameState] = useState<'select' | 'playing' | 'won' | 'lost'>('select');
  const [categories, setCategories] = useState<Category[]>([]);
  const [grid, setGrid] = useState<Tile[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [solvedCategories, setSolvedCategories] = useState<string[]>([]);
  const [mistakesRemaining, setMistakesRemaining] = useState(4);
  const [toast, setToast] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [currentPuzzleId, setCurrentPuzzleId] = useState<number | null>(null);
  const [wrongGuesses, setWrongGuesses] = useState<WrongGuess[]>([]);
  const [hoveredGuessId, setHoveredGuessId] = useState<string | null>(null);

  const [draggingTileId, setDraggingTileId] = useState<string | null>(null);
  const [dragOriginIndex, setDragOriginIndex] = useState<number | null>(null);
  const [dragOverTileId, setDragOverTileId] = useState<string | null>(null);
  const [dragPointer, setDragPointer] = useState<Point | null>(null);
  const [dragTileSize, setDragTileSize] = useState<{ width: number; height: number } | null>(null);

  const longPressTimeoutRef = useRef<number | null>(null);
  const pressedTileIdRef = useRef<string | null>(null);
  const pressPointerRef = useRef<Point | null>(null);
  const pressTileSizeRef = useRef<{ width: number; height: number } | null>(null);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const showToast = (msg: string, duration = 2000) => {
    setToast(msg);
    setTimeout(() => setToast(null), duration);
  };

  const clearLongPress = () => {
    if (longPressTimeoutRef.current !== null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  };

  const resetDragState = () => {
    setDraggingTileId(null);
    setDragOriginIndex(null);
    setDragOverTileId(null);
    setDragPointer(null);
    setDragTileSize(null);
  };

  const startGame = (puzzleId: number, shouldPushPath = true) => {
    const loadedCategories = getPuzzleById(puzzleId);
    if (!loadedCategories) {
      showToast('Rätsel nicht gefunden.');
      setGameState('select');
      return;
    }

    const initialGrid: Tile[] = [];
    loadedCategories.forEach((cat) => {
      cat.words.forEach((word, index) => {
        initialGrid.push({
          id: `${cat.id}-${index}`,
          categoryId: cat.id,
          word,
        });
      });
    });

    if (shouldPushPath) {
      window.history.pushState({}, '', buildPathForPuzzle(puzzleId));
    }

    setCategories(loadedCategories);
    setCurrentPuzzleId(puzzleId);
    setGrid(shuffleArray(initialGrid));
    setSolvedCategories([]);
    setSelectedIds([]);
    setWrongGuesses([]);
    setMistakesRemaining(4);
    resetDragState();
    setGameState('playing');
  };

  const goToSelect = () => {
    window.history.pushState({}, '', '/');
    setCurrentPuzzleId(null);
    setCategories([]);
    setGrid([]);
    setSolvedCategories([]);
    setSelectedIds([]);
    setWrongGuesses([]);
    setMistakesRemaining(4);
    resetDragState();
    setGameState('select');
  };

  useEffect(() => {
    const loadFromPath = () => {
      const pathPuzzleId = parsePuzzleIdFromPath(window.location.pathname);
      if (pathPuzzleId !== null) {
        startGame(pathPuzzleId, false);
      } else {
        setGameState('select');
      }
    };

    loadFromPath();
    window.addEventListener('popstate', loadFromPath);
    return () => window.removeEventListener('popstate', loadFromPath);
  }, []);

  useEffect(() => {
    return () => clearLongPress();
  }, []);

  const handleShuffle = () => {
    if (draggingTileId) return;
    setGrid(shuffleArray(grid));
  };

  const toggleSelection = (id: string) => {
    if (draggingTileId) return;

    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
      return;
    }

    if (selectedIds.length < 4) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeselectAll = () => setSelectedIds([]);

  const handleShare = async () => {
    if (currentPuzzleId === null) return;

    const shareUrl = `${window.location.origin}${buildPathForPuzzle(currentPuzzleId)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Rätsel-Link kopiert!');
    } catch {
      showToast(shareUrl, 4000);
    }
  };

  const handleSubmit = () => {
    if (selectedIds.length !== 4 || draggingTileId) return;

    const selectedTiles = grid.filter((tile) => selectedIds.includes(tile.id));
    const categoryCounts: Record<string, number> = {};

    selectedTiles.forEach((tile) => {
      categoryCounts[tile.categoryId] = (categoryCounts[tile.categoryId] || 0) + 1;
    });

    const maxSameCategory = Math.max(...Object.values(categoryCounts));

    if (maxSameCategory === 4) {
      const solvedCategoryId = selectedTiles[0].categoryId;
      const newSolved = [...solvedCategories, solvedCategoryId];
      setSolvedCategories(newSolved);

      setGrid(grid.filter((tile) => tile.categoryId !== solvedCategoryId));
      setSelectedIds([]);

      if (newSolved.length === 4) {
        setGameState('won');
        showToast('Perfekt!', 3000);
      }
    } else {
      const guessEntry: WrongGuess = {
        id: `${Date.now()}-${wrongGuesses.length}`,
        tileIds: [...selectedIds],
        words: selectedTiles.map((tile) => tile.word),
        oneAway: maxSameCategory === 3,
      };
      setWrongGuesses((prev) => [...prev, guessEntry]);

      if (maxSameCategory === 3) {
        showToast('Eins daneben...');
      }

      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      const newMistakes = mistakesRemaining - 1;
      setMistakesRemaining(newMistakes);

      if (newMistakes === 0) {
        setGameState('lost');
        setSelectedIds([]);

        const remainingCats = categories.filter((c) => !solvedCategories.includes(c.id));
        let delay = 1000;
        const currentSolved = [...solvedCategories];

        remainingCats.forEach((cat) => {
          setTimeout(() => {
            currentSolved.push(cat.id);
            setSolvedCategories([...currentSolved]);
            setGrid((prev) => prev.filter((tile) => tile.categoryId !== cat.id));
          }, delay);
          delay += 1000;
        });
      }
    }
  };

  const handleGuessClick = (guess: WrongGuess) => {
    const inPlayIds = guess.tileIds.filter((id) => grid.some((tile) => tile.id === id));
    if (inPlayIds.length === 0) {
      showToast('Diese Wörter sind nicht mehr im Feld.');
      return;
    }

    setSelectedIds(inPlayIds.slice(0, 4));
  };

  const handleTilePointerDown = (
    e: React.PointerEvent<HTMLButtonElement>,
    tileId: string,
    tileIndex: number
  ) => {
    if (gameState !== 'playing') return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;

    pressedTileIdRef.current = tileId;
    pressPointerRef.current = { x: e.clientX, y: e.clientY };
    const tileRect = e.currentTarget.getBoundingClientRect();
    pressTileSizeRef.current = { width: tileRect.width, height: tileRect.height };
    clearLongPress();

    e.currentTarget.setPointerCapture(e.pointerId);
    longPressTimeoutRef.current = window.setTimeout(() => {
      setDraggingTileId(tileId);
      setDragOriginIndex(tileIndex);
      setDragOverTileId(null);
      setDragPointer(pressPointerRef.current);
      setDragTileSize(pressTileSizeRef.current);
    }, LONG_PRESS_MS);
  };

  const handleTilePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingTileId) return;

    setDragPointer({ x: e.clientX, y: e.clientY });

    const hoveredTileId = findHoveredTileId(e.clientX, e.clientY);
    if (!hoveredTileId || hoveredTileId === draggingTileId) {
      setDragOverTileId(null);
      return;
    }

    setDragOverTileId(hoveredTileId);
  };

  const finishDrag = (hoveredTileId: string | null) => {
    if (!draggingTileId) return;

    if (hoveredTileId && hoveredTileId !== draggingTileId) {
      const fromIndex = dragOriginIndex ?? grid.findIndex((tile) => tile.id === draggingTileId);
      const toIndex = grid.findIndex((tile) => tile.id === hoveredTileId);

      if (fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex) {
        const swappedGrid = [...grid];
        [swappedGrid[fromIndex], swappedGrid[toIndex]] = [swappedGrid[toIndex], swappedGrid[fromIndex]];
        setGrid(swappedGrid);
      }
    }

    resetDragState();
  };

  const handleTilePointerUp = (e: React.PointerEvent<HTMLButtonElement>, tileId: string) => {
    clearLongPress();
    const hoveredTileId = findHoveredTileId(e.clientX, e.clientY);

    if (draggingTileId) {
      finishDrag(hoveredTileId);
      pressedTileIdRef.current = null;
      return;
    }

    if (pressedTileIdRef.current === tileId) {
      toggleSelection(tileId);
    }
    pressedTileIdRef.current = null;
  };

  const handleTilePointerCancel = () => {
    clearLongPress();
    pressedTileIdRef.current = null;
    pressPointerRef.current = null;
    pressTileSizeRef.current = null;
    if (draggingTileId) {
      finishDrag(null);
    }
  };

  const renderSelect = () => (
    <div className="w-full max-w-4xl mx-auto px-4 py-10 flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-3">Verbindungen</h1>
        <p className="text-stone-600 text-base md:text-lg">Wähle ein Rätsel aus und löse das 4x4-Feld.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {(puzzles as Puzzle[]).map((_, index) => {
          return (
            <button
              key={index}
              onClick={() => startGame(index)}
              className="aspect-square rounded-2xl border border-stone-300 bg-white/90 hover:bg-white hover:-translate-y-0.5 transition-all shadow-sm hover:shadow-md flex items-center justify-center"
            >
              <div className="text-xl md:text-2xl font-extrabold tracking-tight">Rätsel {index}</div>
            </button>
          );
        })}
      </div>

      <div className="text-sm text-stone-500 text-center">Geteilte Links funktionieren mit /puzzle/:id</div>
    </div>
  );

  const activeTileIds = new Set(grid.map((tile) => tile.id));
  const hoveredGuess = wrongGuesses.find((guess) => guess.id === hoveredGuessId);
  const hoveredGuessTileIds = new Set((hoveredGuess?.tileIds ?? []).filter((tileId) => activeTileIds.has(tileId)));
  const draggedTile = draggingTileId ? grid.find((tile) => tile.id === draggingTileId) ?? null : null;

  const renderPlaying = () => (
    <div className="w-full max-w-2xl mx-auto px-4 py-8 flex flex-col items-center select-none relative pb-20">
      <h1 className="text-4xl font-black mb-1 tracking-tight">Verbindungen</h1>
      <p className="text-sm font-medium text-stone-600 mb-8">Finde vier Gruppen mit je vier Wörtern.</p>

      <div className="w-full max-w-[580px] flex flex-col gap-3">
        {solvedCategories.map((catId) => {
          const category = categories.find((c) => c.id === catId);
          if (!category) return null;

          return (
            <div
              key={catId}
              className="w-full min-h-20 rounded-xl flex flex-col items-center justify-center text-center p-3 shadow-tile animate-[bounce_0.3s_ease-out]"
              style={{ backgroundColor: category.color }}
            >
              <div className="font-bold text-lg mb-1">{category.title}</div>
              <div className="text-sm whitespace-nowrap overflow-hidden text-ellipsis w-full">
                {category.words.join(', ')}
              </div>
            </div>
          );
        })}

        <div className="grid grid-cols-4 gap-4 mt-2">
          {grid.map((tile, index) => {
            const isSelected = selectedIds.includes(tile.id);
            const shakeClass = isShaking && isSelected ? 'animate-shake' : '';
            const isDragged = draggingTileId === tile.id;
            const isDropCandidate = dragOverTileId === tile.id;
            const isGuessHoverHighlight = hoveredGuessTileIds.has(tile.id) && !isSelected;
            return (
              <button
                key={tile.id}
                data-tile-id={tile.id}
                onPointerDown={(e) => handleTilePointerDown(e, tile.id, index)}
                onPointerMove={handleTilePointerMove}
                onPointerUp={(e) => handleTilePointerUp(e, tile.id)}
                onPointerCancel={handleTilePointerCancel}
                disabled={gameState !== 'playing'}
                className={[
                  'tile-transition touch-none aspect-square rounded-xl text-center shadow-tile uppercase p-3 flex items-center justify-center overflow-hidden',
                  shakeClass,
                  isSelected ? 'bg-stone-700 text-white' : 'bg-stone-200 text-stone-900 hover:bg-stone-300',
                  isDragged ? 'opacity-60 z-10' : '',
                  isDropCandidate ? '-translate-y-1 ring-2 ring-stone-500' : '',
                  isGuessHoverHighlight ? 'ring-2 ring-amber-300/80 bg-amber-100' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <AutoFitTileWord word={tile.word} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex items-center gap-3">
        <span className="text-sm font-medium text-stone-700">Fehler übrig:</span>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-300 ${i < mistakesRemaining ? 'bg-stone-700' : 'bg-stone-300'}`}
            ></div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-3 w-full">
        <button
          onClick={handleShuffle}
          disabled={gameState !== 'playing' || !!draggingTileId}
          className="border border-black rounded-full px-6 py-3 font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Mischen
        </button>
        <button
          onClick={handleDeselectAll}
          disabled={selectedIds.length === 0 || gameState !== 'playing' || !!draggingTileId}
          className="border border-black rounded-full px-6 py-3 font-semibold text-sm hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Auswahl aufheben
        </button>
        <button
          onClick={handleSubmit}
          disabled={selectedIds.length !== 4 || gameState !== 'playing' || !!draggingTileId}
          className="border border-black rounded-full px-6 py-3 font-semibold text-sm bg-transparent disabled:opacity-50 disabled:border-gray-300 disabled:text-gray-400 enabled:bg-black enabled:text-white transition-colors"
        >
          Prufen
        </button>
        <button
          onClick={handleShare}
          className="border border-black rounded-full px-6 py-3 font-semibold text-sm hover:bg-gray-100 transition-colors"
        >
          Teilen
        </button>
        <button
          onClick={goToSelect}
          className="border border-black rounded-full px-6 py-3 font-semibold text-sm hover:bg-gray-100 transition-colors"
        >
          Zur Rätselauswahl
        </button>
      </div>

      <div className="w-full max-w-[580px] mt-8 rounded-xl border border-stone-300 bg-white/90 p-4 shadow-sm">
        <div className="text-sm font-semibold text-stone-700 mb-3">Bisher falsche Versuche</div>
        {wrongGuesses.length === 0 ? (
          <div className="text-sm text-stone-500">Noch keine falschen Versuche.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {wrongGuesses.map((guess) => (
              <button
                key={guess.id}
                onMouseEnter={() => setHoveredGuessId(guess.id)}
                onMouseLeave={() => setHoveredGuessId((current) => (current === guess.id ? null : current))}
                onFocus={() => setHoveredGuessId(guess.id)}
                onBlur={() => setHoveredGuessId((current) => (current === guess.id ? null : current))}
                onClick={() => handleGuessClick(guess)}
                className="w-full text-left rounded-lg border border-stone-300 bg-stone-50 hover:bg-stone-100 transition-colors px-3 py-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium text-stone-800 truncate">{guess.words.join(', ')}</div>
                  {guess.oneAway && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-200 text-amber-800 text-[11px] font-bold">
                      !
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {gameState === 'won' && (
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Gewonnen!</h2>
          <button onClick={goToSelect} className="bg-black text-white px-6 py-2 rounded-full font-bold">
            Anderes Rätsel wählen
          </button>
        </div>
      )}

      {gameState === 'lost' && solvedCategories.length === 4 && (
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Verloren!</h2>
          <button onClick={goToSelect} className="bg-black text-white px-6 py-2 rounded-full font-bold">
            Anderes Rätsel wählen
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-3 rounded-md shadow-lg z-50 text-sm font-medium">
          {toast}
        </div>
      )}

      {draggedTile && dragPointer && dragTileSize && (
        <div
          className="fixed pointer-events-none z-[70] rounded-xl text-center shadow-xl uppercase p-3 flex items-center justify-center bg-stone-700 text-white opacity-60 overflow-hidden"
          style={{
            width: `${dragTileSize.width}px`,
            height: `${dragTileSize.height}px`,
            left: `${dragPointer.x}px`,
            top: `${dragPointer.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <AutoFitTileWord word={draggedTile.word} />
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-100 via-stone-50 to-white text-stone-900 font-sans">
      <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      {gameState === 'select' ? renderSelect() : renderPlaying()}
    </div>
  );
}

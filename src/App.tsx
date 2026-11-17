import { useCallback, useEffect, useRef, useState } from 'react';
import { ResultsScreen } from './components/ResultsScreen';
import { SelectScreen } from './components/SelectScreen';
import { divide, redivide } from './lib/distribute';
import {
  addNames,
  clearSelection,
  removeName,
  selectAll,
  togglePresent,
  withDivision,
  type AppData,
} from './lib/state';
import { loadState, saveState, type View } from './lib/storage';

const RESULTS_HASH = '#results';

/**
 * The address decides which screen is open, so the browser's Back button
 * moves between the two screens. On a visit without a hash, the screen that
 * was open last is restored.
 */
function initialHash(lastView: View): string {
  if (lastView === 'results' && window.location.hash !== RESULTS_HASH) {
    window.history.replaceState(null, '', RESULTS_HASH);
  }
  return window.location.hash;
}

export function App() {
  const [boot] = useState(loadState);
  const [data, setData] = useState<AppData>(() => ({
    bank: boot.state.bank,
    present: boot.state.present,
    division: boot.state.division,
  }));
  const [hash, setHash] = useState(() => initialHash(boot.state.view));
  const [storageAvailable, setStorageAvailable] = useState(boot.available);

  // The results screen exists only while a division matches the attendance.
  const view: View = hash === RESULTS_HASH && data.division !== null ? 'results' : 'select';

  useEffect(() => {
    const sync = () => setHash(window.location.hash);
    window.addEventListener('popstate', sync);
    window.addEventListener('hashchange', sync);
    return () => {
      window.removeEventListener('popstate', sync);
      window.removeEventListener('hashchange', sync);
    };
  }, []);

  // An address that points at results without a valid division is corrected.
  useEffect(() => {
    if (hash === RESULTS_HASH && data.division === null) {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
      setHash('');
    }
  }, [hash, data.division]);

  useEffect(() => {
    setStorageAvailable(saveState({ ...data, view }));
  }, [data, view]);

  // On a change of screen the page starts at the top and focus moves into it.
  const mainRef = useRef<HTMLElement>(null);
  const shownView = useRef(view);
  useEffect(() => {
    if (shownView.current === view) return;
    shownView.current = view;
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [view]);

  const navigate = useCallback((target: View) => {
    const url = target === 'results' ? RESULTS_HASH : window.location.pathname + window.location.search;
    window.history.pushState(null, '', url);
    setHash(window.location.hash);
  }, []);

  const handleDivide = (pending: string[]) => {
    const next = addNames(data, pending);
    if (next.present.length === 0) {
      setData(next);
      return;
    }
    setData(withDivision(next, divide(next.present)));
    navigate('results');
  };

  const handleReshuffle = () => {
    if (data.division) setData(withDivision(data, redivide(data.division)));
  };

  if (view === 'results' && data.division) {
    return (
      <ResultsScreen
        division={data.division}
        mainRef={mainRef}
        storageAvailable={storageAvailable}
        onReshuffle={handleReshuffle}
        onEdit={() => navigate('select')}
      />
    );
  }

  return (
    <SelectScreen
      data={data}
      mainRef={mainRef}
      storageAvailable={storageAvailable}
      onAddNames={(names) => setData((current) => addNames(current, names))}
      onToggle={(name) => setData((current) => togglePresent(current, name))}
      onSelectAll={() => setData(selectAll)}
      onClearSelection={() => setData(clearSelection)}
      onRemove={(name) => setData((current) => removeName(current, name))}
      onDivide={handleDivide}
    />
  );
}

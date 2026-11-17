import { useEffect, useRef, useState, type MouseEvent, type RefObject } from 'react';
import type { Division } from '../lib/distribute';
import { divisionToText, groupTitle, participantsLabel } from '../lib/format';
import { PHONE_QUERY, useMediaQuery } from '../lib/hooks';
import { Logo, StorageNote } from './shared';

interface Props {
  division: Division;
  mainRef: RefObject<HTMLElement | null>;
  storageAvailable: boolean;
  onReshuffle: () => void;
  onEdit: () => void;
}

type CopyState = 'idle' | 'copied' | 'failed';

/** Copies text, with a fallback for browsers without the Clipboard API. */
async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission refused or insecure context. Try the fallback below.
  }
  const helper = document.createElement('textarea');
  helper.value = text;
  helper.setAttribute('readonly', '');
  helper.style.position = 'fixed';
  helper.style.opacity = '0';
  document.body.appendChild(helper);
  helper.select();
  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  helper.remove();
  return copied;
}

export function ResultsScreen({ division, mainRef, storageAvailable, onReshuffle, onEdit }: Props) {
  const isPhone = useMediaQuery(PHONE_QUERY);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [announcement, setAnnouncement] = useState('');
  const resetTimer = useRef<number | undefined>(undefined);

  const total = division.reduce((sum, group) => sum + group.length, 0);

  useEffect(() => () => window.clearTimeout(resetTimer.current), []);

  const handleCopy = async () => {
    const copied = await copyText(divisionToText(division));
    setCopyState(copied ? 'copied' : 'failed');
    setAnnouncement(copied ? 'החלוקה הועתקה.' : 'ההעתקה נכשלה.');
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => setCopyState('idle'), 2500);
  };

  const handleReshuffle = () => {
    onReshuffle();
    setCopyState('idle');
    setAnnouncement('החלוקה עורבבה מחדש.');
  };

  // A plain click stays in the page. A modified click may open a new tab.
  const handleEdit = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    onEdit();
  };

  const copyLabel = copyState === 'copied' ? 'הועתקה' : copyState === 'failed' ? 'ההעתקה נכשלה' : 'העתיקי חלוקה';

  const copyButton = (
    <button type="button" className="pill-button copy-button" onClick={handleCopy}>
      <span className="copy-button-sizer" aria-hidden="true">
        העתיקי חלוקה
      </span>
      <span>{copyLabel}</span>
    </button>
  );
  const reshuffleButton = (
    <button type="button" className="pill-button" disabled={total < 2} onClick={handleReshuffle}>
      ערבבי מחדש
    </button>
  );

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <Logo tone="gray" />
          <div className="results-nav">
            <a href="#" className="text-link" onClick={handleEdit}>
              עריכת משתתפים
            </a>
            {!isPhone && copyButton}
            {!isPhone && reshuffleButton}
          </div>
        </div>
      </header>

      <main className="page page--results" ref={mainRef} tabIndex={-1}>
        {isPhone && (
          <div className="results-buttons">
            {reshuffleButton}
            {copyButton}
          </div>
        )}

        <div className="groups">
          {division.map((group, index) => {
            const headingId = `group-${index + 1}`;
            const tone = group.length === 0 ? 'tone-empty' : `tone-${index + 1}`;
            return (
              <section key={index} className="group" aria-labelledby={headingId}>
                <div className={`group-head ${tone}`}>
                  <h2 id={headingId}>{groupTitle(index)}</h2>
                  <p>{participantsLabel(group.length)}</p>
                </div>
                {group.length === 0 ? (
                  <p className="group-empty">הקבוצה ריקה</p>
                ) : (
                  <ol className="group-list">
                    {group.map((name, position) => (
                      <li key={name}>
                        <span className="tag-slot" aria-hidden="true">
                          <span className={`tag ${tone}`}>{position + 1}</span>
                        </span>
                        <span className="group-name">{name}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            );
          })}
        </div>

        <StorageNote available={storageAvailable} />
        <p className="visually-hidden" role="status">
          {announcement}
        </p>
      </main>
    </div>
  );
}

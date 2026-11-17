import { useEffect, useMemo, useRef, useState, type ClipboardEvent, type KeyboardEvent, type RefObject } from 'react';
import { groupSizes } from '../lib/distribute';
import { additionSummary } from '../lib/format';
import { PHONE_QUERY, useMediaQuery } from '../lib/hooks';
import { countItems, looksLikeList, mergeIntoBank, parseNames } from '../lib/names';
import { addNames, type AppData } from '../lib/state';
import { Logo, StorageNote } from './shared';

interface Props {
  data: AppData;
  mainRef: RefObject<HTMLElement | null>;
  storageAvailable: boolean;
  onAddNames: (names: string[]) => void;
  onToggle: (name: string) => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onRemove: (name: string) => void;
  onDivide: (pending: string[]) => void;
}

function CheckMark() {
  return (
    <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.2 6.4l2.5 2.5L9.8 3.5" />
    </svg>
  );
}

export function SelectScreen({
  data,
  mainRef,
  storageAvailable,
  onAddNames,
  onToggle,
  onSelectAll,
  onClearSelection,
  onRemove,
  onDivide,
}: Props) {
  const { bank, present } = data;
  const isEmpty = bank.length === 0;
  const isPhone = useMediaQuery(PHONE_QUERY);

  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');
  const [managing, setManaging] = useState(false);

  const fieldRef = useRef<HTMLTextAreaElement>(null);
  const gridRef = useRef<HTMLUListElement>(null);
  const focusAfterRemoval = useRef<number | null>(null);

  const presentSet = useMemo(() => new Set(present), [present]);
  const pending = useMemo(() => parseNames(draft), [draft]);

  // The main button also takes the names still in the field, so the forecast
  // counts them.
  const expectedCount = useMemo(
    () => (pending.length === 0 ? present.length : addNames(data, pending).present.length),
    [data, pending, present.length],
  );
  const sizes = groupSizes(expectedCount);

  const submit = (text: string) => {
    const names = parseNames(text);
    setDraft('');
    if (names.length === 0) return;
    const added = mergeIntoBank(bank, names).added.length;
    onAddNames(names);
    setStatus(additionSummary(countItems(text), added));
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    submit(draft);
  };

  // A pasted list goes straight into the bank. A single pasted name stays in
  // the field like typed text.
  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = event.clipboardData.getData('text');
    if (!looksLikeList(pasted)) return;
    event.preventDefault();
    const field = event.currentTarget;
    submit(draft.slice(0, field.selectionStart) + pasted + draft.slice(field.selectionEnd));
  };

  const handleRemove = (name: string) => {
    const index = bank.indexOf(name);
    focusAfterRemoval.current = Math.min(index, bank.length - 2);
    onRemove(name);
  };

  // After a deletion, focus moves to the neighbouring name. When the bank is
  // emptied, it returns to the field.
  useEffect(() => {
    const index = focusAfterRemoval.current;
    if (index === null) return;
    focusAfterRemoval.current = null;
    if (bank.length === 0) {
      setManaging(false);
      fieldRef.current?.focus();
      return;
    }
    gridRef.current?.querySelectorAll<HTMLButtonElement>('.cell-delete')[index]?.focus();
  }, [bank]);

  let placeholder = 'דנה לוי, יואב כהן, נועה פרידמן…';
  if (!isEmpty) placeholder = isPhone ? 'הקלידי או הדביקי רשימה' : 'הקלידי שם, או הדביקי רשימה שלמה';

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-inner">
          <Logo tone="purple" />
          <p className="counter" aria-live="polite">
            {present.length === 1 ? (
              'משתתף אחד'
            ) : (
              <>
                <strong>{present.length}</strong> משתתפים
              </>
            )}
            {!isEmpty && <span className="counter-of"> מתוך {bank.length}</span>}
          </p>
        </div>
      </header>

      <main className="page page--select" ref={mainRef} tabIndex={-1}>
        <div className="container">
          <div className="entry">
            <label htmlFor="names" className="label">
              שמות המשתתפים
            </label>
            <textarea
              id="names"
              ref={fieldRef}
              className={isEmpty ? 'field field--tall' : 'field'}
              rows={isEmpty ? 5 : 2}
              placeholder={placeholder}
              value={draft}
              autoFocus={isEmpty}
              autoComplete="off"
              autoCapitalize="words"
              spellCheck={false}
              enterKeyHint="done"
              aria-describedby="names-hint"
              onChange={(event) => {
                setDraft(event.target.value);
                setStatus('');
              }}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
            />
            <div className="entry-foot">
              <p id="names-hint" className={isEmpty ? 'hint hint--lead' : 'hint'} aria-live="polite">
                {status ? (
                  status
                ) : isEmpty ? (
                  'אפשר להדביק כאן רשימה שלמה של שמות, והם ייכנסו לבנק ויסומנו מיד.'
                ) : (
                  <>
                    <span className="hint-wide">מקש Enter מוסיף שם. </span>
                    הדבקת רשימה מוסיפה את כולם ומסמנת אותם.
                  </>
                )}
              </p>
              <button type="button" className="pill-button" disabled={pending.length === 0} onClick={() => submit(draft)}>
                הוסיפי שמות
              </button>
            </div>
          </div>

          {!isEmpty && (
            <section className="bank" aria-labelledby="bank">
              <div className="bank-head">
                <h2 id="bank" className="label">
                  בנק השמות
                </h2>
                <div className="bank-actions">
                  <button type="button" className="text-button" onClick={onSelectAll}>
                    בחרי הכול
                  </button>
                  <button type="button" className="text-button" onClick={onClearSelection}>
                    נקי בחירה
                  </button>
                  <button type="button" className="text-button" onClick={() => setManaging((value) => !value)}>
                    {managing ? 'סיום ניהול' : 'ניהול שמות'}
                  </button>
                </div>
              </div>
              <ul className="bank-grid" ref={gridRef}>
                {bank.map((name) => {
                  const selected = presentSet.has(name);
                  return (
                    <li key={name}>
                      {managing ? (
                        <div className={selected ? 'cell cell--manage cell--selected' : 'cell cell--manage'}>
                          <span className="cell-name">{name}</span>
                          <button
                            type="button"
                            className="cell-delete"
                            aria-label={`מחקי את ${name}`}
                            onClick={() => handleRemove(name)}
                          >
                            מחקי
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className={selected ? 'cell cell--selected' : 'cell'}
                          aria-pressed={selected}
                          onClick={() => onToggle(name)}
                        >
                          <span className="check" aria-hidden="true">
                            {selected && <CheckMark />}
                          </span>
                          <span className="cell-name">{name}</span>
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <div className={isEmpty ? 'actions actions--first-run' : 'actions actions--docked'}>
            <button
              type="button"
              className="primary-button"
              disabled={expectedCount === 0}
              onClick={() => {
                setDraft('');
                setStatus('');
                onDivide(pending);
              }}
            >
              חלקי ל-3 קבוצות
            </button>
            {expectedCount > 0 && (
              <div className="forecast">
                <div className="forecast-pills" role="img" aria-label={`גודל הקבוצות: ${sizes.join(', ')}`}>
                  {sizes.map((size, index) => (
                    <span key={index} className={size === 0 ? 'forecast-pill tone-empty' : `forecast-pill tone-${index + 1}`}>
                      {size}
                    </span>
                  ))}
                </div>
                <p className="forecast-label">משתתפים בכל קבוצה</p>
              </div>
            )}
          </div>

          <StorageNote available={storageAvailable} />
        </div>
      </main>
    </div>
  );
}

import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  IconArrowUpRight,
  IconCheck,
  IconChevronDown,
  IconCopy,
  IconSearch,
  IconX,
} from "@/components/ui/icons";
import type { ToolLocale as Locale } from "@/tools/messages";
import {
  collectionIds,
  groupsFor,
  matchesColor,
  pantoneUrl,
  references,
  rgbOf,
  type CollectionId,
  type PaletteColor,
} from "./data";
import { paletteMessages } from "./messages";

const ExternalIcon = () => <IconArrowUpRight size={16} aria-hidden="true" />;

export default function ColorPalettes({
  locale,
  collections: colors,
}: {
  locale: Locale;
  collections: Record<CollectionId, PaletteColor[]>;
}) {
  const t = paletteMessages[locale];
  const [collection, setCollection] = useState<CollectionId>("japanese");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<PaletteColor>(colors.japanese[0]);
  const [format, setFormat] = useState<"HEX" | "RGB" | "OKLCH">("HEX");
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const search = useRef<HTMLInputElement>(null);
  const visible = colors[collection].filter((color) =>
    matchesColor(color, query),
  );
  const groups = groupsFor(visible);
  const value =
    format === "RGB"
      ? `rgb(${rgbOf(selected.hex)})`
      : format === "OKLCH" && selected.css
        ? selected.css
        : selected.hex;
  useEffect(() => () => clearTimeout(timer.current), []);

  const choose = (color: PaletteColor) => {
    setSelected(color);
    setCopied(false);
    setNotice("");
    clearTimeout(timer.current);
    if (!color.css && format === "OKLCH") setFormat("HEX");
  };
  const switchCollection = (id: CollectionId) => {
    setCollection(id);
    setQuery("");
    if (colors[id].length) choose(colors[id][0]);
  };
  const chooseFormat = (next: typeof format) => {
    setFormat(next);
    setCopied(false);
    setNotice("");
    clearTimeout(timer.current);
  };
  const copy = async () => {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setNotice(`${t.copied}: ${value}`);
      timer.current = setTimeout(() => {
        setCopied(false);
        setNotice("");
      }, 2400);
    } catch {
      setCopied(false);
      setNotice(t.copyError);
    }
  };

  return (
    <div className="palette-app" data-palette-app>
      <nav className="palette-collections" aria-label={t.collections}>
        {collectionIds.map((id) => (
          <button
            key={id}
            type="button"
            aria-pressed={collection === id}
            onClick={() => switchCollection(id)}
            data-collection={id}
          >
            <span
              className={`palette-mini palette-mini-${id}`}
              aria-hidden="true"
            >
              {(id === "wada"
                ? ["#CCCCCC", "#999999", "#555555"]
                : [
                    colors[id][0].hex,
                    colors[id][Math.floor(colors[id].length / 2)].hex,
                    colors[id].at(-1)!.hex,
                  ]
              ).map((hex, i) => (
                <span key={i} style={{ backgroundColor: hex }} />
              ))}
            </span>
            {t.names[id]}
          </button>
        ))}
      </nav>

      <div className="palette-workspace">
        <div className="palette-browser">
          <div className="palette-section-intro">
            <div>
              <h2>{t.names[collection]}</h2>
              <p>{t.summaries[collection]}</p>
            </div>
          </div>

          {collection === "wada" ? (
            <section className="palette-reference">
              <h3>{t.wadaOriginal}</h3>
              <p>{t.wadaReference}</p>
              <a
                href={references.wada.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.original}
                <ExternalIcon />
              </a>
            </section>
          ) : (
            <>
              <div className="palette-toolbar">
                <div className="palette-search">
                  <IconSearch size={20} aria-hidden="true" />
                  <input
                    ref={search}
                    type="search"
                    aria-label={t.search}
                    placeholder={t.search}
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                  {query && (
                    <button
                      type="button"
                      aria-label={t.clear}
                      onClick={() => {
                        setQuery("");
                        search.current?.focus();
                      }}
                    >
                      <IconX size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
                <p className="palette-result-count" role="status">
                  {t.count.replace("{count}", String(visible.length))}
                </p>
              </div>

              <p className="palette-help">{t.help}</p>
              <div className={`palette-grid palette-grid-${collection}`}>
                {groups.map((group) => (
                  <section
                    key={group.name}
                    className="palette-group"
                    aria-label={group.name || t.names[collection]}
                  >
                    {group.name && <h3>{group.name}</h3>}
                    <div className="palette-swatches">
                      {group.colors.map((color) => (
                        <button
                          type="button"
                          key={color.id}
                          className="palette-swatch"
                          aria-pressed={
                            selected.id === color.id &&
                            selected.hex === color.hex
                          }
                          onClick={() => choose(color)}
                          aria-label={`${locale === "en" && color.romanized ? color.romanized : color.name} ${color.hex}`}
                        >
                          <span
                            className="palette-chip"
                            style={
                              { backgroundColor: color.hex } as CSSProperties
                            }
                          >
                            {selected.id === color.id &&
                              selected.hex === color.hex && (
                                <span className="palette-chip-check">
                                  <IconCheck size={16} aria-hidden="true" />
                                </span>
                              )}
                          </span>
                          <span
                            className="palette-color-name"
                            lang={
                              collection === "japanese" && locale === "ja"
                                ? "ja"
                                : "en"
                            }
                          >
                            {color.shade ||
                              (locale === "en"
                                ? color.romanized || color.name
                                : color.name)}
                          </span>
                          <span className="palette-code">{color.hex}</span>
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
              {visible.length === 0 && (
                <div className="palette-empty">
                  <p>{t.empty}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setQuery("");
                      search.current?.focus();
                    }}
                  >
                    {t.reset}
                  </button>
                </div>
              )}
            </>
          )}

          <details className="palette-sources" key={collection}>
            <summary>{t.sources}</summary>
            <div className="palette-source-body">
              <p>{t.notes[collection]}</p>
              <p>{t.sourceNames[collection]}</p>
              {collection === "japanese" && <p>{t.japaneseChanges}</p>}
              <div className="palette-source-links">
                <a
                  href={references[collection].url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.sourceLink}
                  <ExternalIcon />
                </a>
                <a
                  href={references[collection].licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {references[collection].license}
                  <ExternalIcon />
                </a>
                {collection !== "wada" && (
                  <a
                    href={`/palette-data/${collection}.json`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.data}
                    <ExternalIcon />
                  </a>
                )}
              </div>
            </div>
          </details>
        </div>

        {colors[collection].length > 0 && (
          <aside className="palette-inspector" aria-label={t.selected}>
            <div
              className="palette-inspector-chip"
              style={{ backgroundColor: selected.hex }}
            />
            <div className="palette-inspector-body">
              <p className="palette-eyebrow">{t.selected}</p>
              <h2>
                {locale === "en"
                  ? selected.romanized || selected.name
                  : selected.name}
              </h2>
              {selected.kana && (
                <p className="palette-reading" lang="ja">
                  {locale === "ja" ? selected.kana : selected.name}
                </p>
              )}
              <div className="palette-format" role="group" aria-label={t.copy}>
                {(
                  ["HEX", "RGB", ...(selected.css ? ["OKLCH"] : [])] as const
                ).map((f) => (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={format === f}
                    onClick={() => chooseFormat(f as typeof format)}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="palette-copy-row">
                <input
                  aria-label={format}
                  className="palette-value"
                  readOnly
                  value={value}
                  onFocus={(event) => event.target.select()}
                />
                <button
                  type="button"
                  onClick={copy}
                  aria-label={copied ? t.copied : t.copy}
                  title={t.copy}
                >
                  {copied ? (
                    <IconCheck size={20} aria-hidden="true" />
                  ) : (
                    <IconCopy size={20} aria-hidden="true" />
                  )}
                </button>
              </div>
              <a
                className="palette-open-hex"
                href={`${locale === "en" ? "/en" : ""}/hex/${selected.hex.slice(1)}`}
              >
                {t.openHex}
                <ExternalIcon />
              </a>
              <a
                className="palette-color-source"
                href={selected.source}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t.source}
                <ExternalIcon />
              </a>
            </div>
          </aside>
        )}
      </div>

      {colors[collection].length > 0 && (
        <aside className="palette-mobile-inspector" aria-label={t.selected}>
          <span
            className="palette-mobile-chip"
            style={{ backgroundColor: selected.hex }}
          />
          <div className="palette-mobile-value">
            <a href={selected.source} target="_blank" rel="noopener noreferrer">
              {locale === "en"
                ? selected.romanized || selected.name
                : selected.name}
              <ExternalIcon />
            </a>
            <input
              aria-label={format}
              className="palette-value"
              readOnly
              value={value}
              onFocus={(event) => event.target.select()}
            />
          </div>
          <div className="palette-mobile-format">
            <select
              aria-label={t.format}
              value={format}
              onChange={(event) =>
                chooseFormat(event.target.value as typeof format)
              }
            >
              <option value="HEX">HEX</option>
              <option value="RGB">RGB</option>
              {selected.css && <option value="OKLCH">OKLCH</option>}
            </select>
            <IconChevronDown size={16} />
          </div>
          <button
            type="button"
            aria-label={copied ? t.copied : t.copy}
            onClick={copy}
          >
            {copied ? <IconCheck size={20} /> : <IconCopy size={20} />}
          </button>
          <a
            href={`${locale === "en" ? "/en" : ""}/hex/${selected.hex.slice(1)}`}
            aria-label={t.openHex}
          >
            <ExternalIcon />
          </a>
        </aside>
      )}

      <section className="palette-pantone" aria-labelledby="pantone-heading">
        <div>
          <p className="palette-eyebrow">{t.official}</p>
          <h2 id="pantone-heading">Pantone</h2>
          <p>{t.pantoneDescription}</p>
        </div>
        <a href={pantoneUrl} target="_blank" rel="noopener noreferrer">
          {t.pantoneLink}
          <ExternalIcon />
        </a>
      </section>
      <div
        className="palette-toast"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {notice && <span>{notice}</span>}
      </div>
    </div>
  );
}

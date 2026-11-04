import { useEffect, useRef, useState } from "react";
import {
  IconArrowUpRight,
  IconCheck,
  IconChevronDown,
  IconCopy,
} from "@/components/ui/icons";
import type { ToolLocale as Locale } from "@/tools/messages";
import {
  collectionIds,
  dicUrl,
  groupsFor,
  pantoneUrl,
  references,
  type CollectionId,
  type PaletteColor,
  type PaletteGroup,
  type NameReference,
} from "./data";
import { colorValues, hueGroup, hueIds } from "./color-values";
import { paletteMessages } from "./messages";

const ExternalIcon = () => <IconArrowUpRight size={16} aria-hidden="true" />;

export default function ColorPalettes({
  locale,
  collections: colors,
  nameReferences,
}: {
  locale: Locale;
  collections: Record<CollectionId, PaletteColor[]>;
  nameReferences: NameReference[];
}) {
  const t = paletteMessages[locale];
  const [collection, setCollection] = useState<CollectionId>("japanese");
  const [selected, setSelected] = useState<PaletteColor>(colors.japanese[0]);
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mobileDetails = useRef<HTMLDetailsElement>(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const visible = colors[collection];
  const isNamedCollection = collection === "japanese" || collection === "world";
  const byHue = isNamedCollection || collection === "jis";
  const nameOf = (color: PaletteColor) =>
    locale === "en" ? color.romanized || color.name : color.name;
  let groups: PaletteGroup[];
  if (byHue) {
    const buckets = new Map(hueIds.map((id) => [id, [] as PaletteColor[]]));
    for (const color of visible) buckets.get(hueGroup(color.hex))!.push(color);
    groups = hueIds
      .map((id) => ({ name: id, colors: buckets.get(id)! }))
      .filter((group) => group.colors.length);
  } else if (collection === "catppuccin") {
    groups = groupsFor(
      visible.map((color) => ({ ...color, group: color.name })),
    );
  } else if (collection === "dracula") {
    groups = groupsFor(
      visible.map((color) => ({ ...color, group: color.variant! })),
    );
  } else if (collection === "radix") {
    groups = [...new Set(visible.map((color) => color.group))].flatMap(
      (family) =>
        ["Light", "Dark"].map((variant) => ({
          name: `${family} · ${variant}`,
          colors: visible.filter(
            (color) => color.group === family && color.variant === variant,
          ),
        })),
    );
  } else groups = groupsFor(visible);
  const groupLabel = (name: string) =>
    byHue ? t.hues[name as keyof typeof t.hues] : name;
  const choose = (color: PaletteColor) => {
    setSelected(color);
    setCopied("");
    setNotice("");
    clearTimeout(timer.current);
  };
  const switchCollection = (id: CollectionId) => {
    setCollection(id);
    choose(
      colors[id].find(
        (color) => color.id === selected.id && color.hex === selected.hex,
      ) ?? colors[id][0],
    );
    if (mobileDetails.current) mobileDetails.current.open = false;
  };
  const copy = async (value: string) => {
    clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(value);
      setCopied(value);
      setNotice(`${t.copied}: ${value}`);
      timer.current = setTimeout(() => {
        setCopied("");
        setNotice("");
      }, 2400);
    } catch {
      setCopied("");
      setNotice(t.copyError);
    }
  };
  const values = colorValues(selected.hex);
  const valueRow = (label: string, value: string, hint?: string) => (
    <div className="palette-value-field" key={label}>
      <div className="palette-value-label">
        {label}
        {hint && <span title={t.cmykNote}>{hint}</span>}
      </div>
      <div className="palette-copy-row">
        <input
          aria-label={label}
          className="palette-value"
          readOnly
          value={value}
          onFocus={(event) => event.target.select()}
        />
        <button
          type="button"
          onClick={() => copy(value)}
          aria-label={`${t.copy} ${label}`}
          title={`${t.copy} ${label}`}
        >
          {copied === value ? (
            <IconCheck size={18} aria-hidden="true" />
          ) : (
            <IconCopy size={18} aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
  const badges = () =>
    selected.nameSources?.length ? (
      <div className="palette-reference-badges" aria-label={t.nameReferences}>
        {nameReferences
          .filter((ref) => selected.nameSources!.includes(ref.id))
          .map((ref) => (
            <a
              key={ref.id}
              href={ref.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`${t.nameReferences}: ${ref.label}`}
            >
              {ref.label}
              <ExternalIcon />
            </a>
          ))}
      </div>
    ) : null;
  const numericValues = () => (
    <>
      <div className="palette-primary-values">
        {valueRow("HEX", values.HEX)}
        {valueRow("RGB", values.RGB)}
        {valueRow("CMYK", values.CMYK, t.referenceValue)}
      </div>
      <details className="palette-more-values">
        <summary>
          {t.more}
          <IconChevronDown size={16} aria-hidden="true" />
        </summary>
        {valueRow("HSV", values.HSV)}
        {valueRow("HSL", values.HSL)}
        {valueRow("OKLCH", selected.css ?? values.OKLCH)}
        {selected.css && (
          <p className="palette-value-note">{t.originalOklch}</p>
        )}
        {selected.munsell && valueRow(t.munsellOriginal, selected.munsell)}
        {selected.munsellEstimate &&
          valueRow(t.munsellEstimate, selected.munsellEstimate)}
        <p className="palette-value-note">{t.munsellNote}</p>
        <p className="palette-value-note">{t.cmykNote}</p>
      </details>
    </>
  );
  const hexUrl = `${locale === "en" ? "/en" : ""}/hex/${selected.hex.slice(1)}`;
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
              {[
                colors[id][0].hex,
                colors[id][Math.floor(colors[id].length / 2)].hex,
                colors[id].at(-1)!.hex,
              ].map((hex, i) => (
                <span key={i} style={{ backgroundColor: hex }} />
              ))}
            </span>
            {t.names[id]}
          </button>
        ))}
        <div className="palette-official-links">
          {[
            ["PANTONE", pantoneUrl, t.pantoneLink],
            ["DIC", dicUrl, t.dicLink],
          ].map(([label, href, title]) => (
            <a
              key={label}
              className="palette-official-link"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={title}
              title={title}
            >
              {label}
              <ExternalIcon />
            </a>
          ))}
        </div>
      </nav>
      <div className="palette-workspace">
        <div className="palette-browser">
          <div className="palette-section-intro">
            <div>
              <h2>{t.names[collection]}</h2>
              <p>{t.summaries[collection]}</p>
            </div>
            <span className="palette-count">
              {t.count.replace("{count}", String(visible.length))}
            </span>
          </div>
          {collection === "jis" && (
            <p className="palette-help">{t.jisNotice}</p>
          )}
          {byHue && (
            <>
              <nav className="palette-hue-nav" aria-label={t.hueNavigation}>
                {groups.map((group) => (
                  <a
                    key={group.name}
                    href={`#palette-${collection}-${group.name}`}
                  >
                    <span
                      style={{
                        backgroundColor:
                          group.name === "neutral"
                            ? "#999"
                            : `hsl(${hueIds.indexOf(group.name as (typeof hueIds)[number]) * 30} 65% 55%)`,
                      }}
                      aria-hidden="true"
                    />
                    {groupLabel(group.name)}
                    <small>{group.colors.length}</small>
                  </a>
                ))}
              </nav>
              <p className="palette-help">{t.hueNote}</p>
            </>
          )}
          <div className={`palette-grid palette-grid-${collection}`}>
            {groups.map((group) => (
              <section
                key={group.name}
                id={byHue ? `palette-${collection}-${group.name}` : undefined}
                className="palette-group"
                aria-label={groupLabel(group.name) || t.names[collection]}
              >
                {group.name && (
                  <div className="palette-group-heading">
                    <h3>{groupLabel(group.name)}</h3>
                    {byHue && (
                      <span className="palette-count">
                        {group.colors.length}
                      </span>
                    )}
                  </div>
                )}
                <div className="palette-swatches">
                  {group.colors.map((color) => (
                    <button
                      type="button"
                      key={color.id}
                      data-color-id={color.id}
                      className="palette-swatch"
                      aria-pressed={
                        selected.id === color.id && selected.hex === color.hex
                      }
                      onClick={() => choose(color)}
                      aria-label={`${color.variant ? `${color.variant} · ` : ""}${nameOf(color)}${color.nameQualifier ? ` (${color.nameQualifier})` : ""} ${color.hex}`}
                    >
                      <span
                        className="palette-chip"
                        style={{ backgroundColor: color.hex }}
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
                          /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(
                            nameOf(color),
                          )
                            ? "ja"
                            : "en"
                        }
                      >
                        {collection === "catppuccin"
                          ? color.variant
                          : color.shade || nameOf(color)}
                        {color.nameQualifier && (
                          <span className="palette-color-reading" lang="ja">
                            （{color.nameQualifier}）
                          </span>
                        )}
                      </span>
                      <span className="palette-code">{color.hex}</span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <details className="palette-sources" key={collection}>
            <summary>{t.sources}</summary>
            <div className="palette-source-body">
              <p>{t.notes[collection]}</p>
              <p>{t.sourceNames[collection]}</p>
              <p>
                {t.conversions}{" "}
                <a
                  href="https://github.com/privet-kitty/munsell.js"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  munsell.js 1.1.7 <ExternalIcon />
                </a>
              </p>
              {isNamedCollection && (
                <>
                  <p>{t.namedChanges}</p>
                  <p>{t.nameReferenceNote}</p>
                  <div className="palette-source-links">
                    {nameReferences.map((ref) => (
                      <a
                        key={ref.id}
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {ref.label}
                        <ExternalIcon />
                      </a>
                    ))}
                  </div>
                </>
              )}
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
                <a
                  href={`/palette-data/${collection}.json`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t.data}
                  <ExternalIcon />
                </a>
              </div>
            </div>
          </details>
        </div>
        <aside className="palette-inspector" aria-label={t.selected}>
          <div
            className="palette-inspector-chip"
            style={{ backgroundColor: selected.hex }}
          />
          <div className="palette-inspector-body">
            <p className="palette-eyebrow">{t.selected}</p>
            <h2>{nameOf(selected)}</h2>
            {selected.variant && (
              <p className="palette-reading">{selected.variant}</p>
            )}
            {selected.kana && (
              <p className="palette-reading" lang="ja">
                {locale === "ja" ? selected.kana : selected.name}
              </p>
            )}
            {badges()}
            {numericValues()}
            <a className="palette-open-hex" href={hexUrl}>
              {t.openHex}
              <ExternalIcon />
            </a>
          </div>
        </aside>
      </div>
      <aside className="palette-mobile-inspector" aria-label={t.selected}>
        <span
          className="palette-mobile-chip"
          style={{ backgroundColor: selected.hex }}
        />
        <div className="palette-mobile-value">
          <span>
            {selected.variant
              ? `${selected.variant} · ${nameOf(selected)}`
              : nameOf(selected)}
          </span>
          <input
            aria-label="HEX"
            className="palette-value"
            readOnly
            value={selected.hex}
            onFocus={(event) => event.target.select()}
          />
        </div>
        <button
          type="button"
          aria-label={`${t.copy} HEX`}
          onClick={() => copy(selected.hex)}
        >
          {copied === selected.hex ? (
            <IconCheck size={20} />
          ) : (
            <IconCopy size={20} />
          )}
        </button>
        <details className="palette-mobile-details" ref={mobileDetails}>
          <summary aria-label={t.more} title={t.more}>
            <IconChevronDown size={20} aria-hidden="true" />
          </summary>
          <div className="palette-mobile-expanded">
            <h2>{nameOf(selected)}</h2>
            {badges()}
            {numericValues()}
          </div>
        </details>
        <a href={hexUrl} aria-label={t.openHex}>
          <ExternalIcon />
        </a>
      </aside>
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

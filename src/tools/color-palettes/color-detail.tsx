import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import {
  IconArrowLeft,
  IconArrowUpRight,
  IconCheck,
  IconCopy,
} from "@/components/ui/icons";
import type { ToolLocale as Locale } from "@/tools/messages";
import {
  pagePath,
  paletteUrl,
  type CollectionId,
  type NameReference,
  type PaletteColor,
} from "./data";
import { colorValues, contrastRatio } from "./color-values";
import { paletteMessages } from "./messages";
import ColorUiPreview from "./ui-preview";
import { latinName } from "./romaji";

const langOf = (text: string) =>
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text)
    ? "ja"
    : "en";

/** The name shown first: the romanized name in English when there is one. */
export const displayName = (color: PaletteColor, locale: Locale) =>
  locale === "en" ? color.romanized || color.name : color.name;
/**
 * The line under the name: the reading, or the English name of a katakana
 * name; in English, the original name under a romanized one.
 */
export const subName = (color: PaletteColor, locale: Locale) =>
  locale === "en" && color.romanized
    ? color.name
    : (color.kana ?? color.romanized);

/**
 * A named color's page (/colors/<slug>): the color fills the top of the
 * screen with its name, as Just HEX's color screen does; its values, the
 * name references, a UI preview and the source follow.
 */
export default function ColorDetail({
  locale,
  color,
  palette,
  nameReferences,
  onBack,
}: {
  locale: Locale;
  color: PaletteColor;
  /** Opened in place on the palette page: the way back is history's back. */
  onBack?: (event: ReactMouseEvent<HTMLAnchorElement>) => void;
  /** The palette the color is listed in, for the way back. */
  palette: CollectionId;
  nameReferences: NameReference[];
}) {
  const t = paletteMessages[locale];
  const c = t.colorPage;
  // A Japanese color is in the world colors too. On its own page (reloaded,
  // or opened in a new tab), the way back is the palette it was opened from:
  // the one the history entry records, or the page that linked to it.
  const [from, setFrom] = useState(palette);
  useEffect(() => {
    if (onBack || palette !== "japanese") return;
    const state = history.state as { palette?: CollectionId } | null;
    let referrer = "";
    try {
      const url = new URL(document.referrer);
      if (url.origin === location.origin) referrer = url.pathname;
    } catch {
      // No referrer.
    }
    if (state?.palette === "world" || referrer === paletteUrl("world", locale))
      setFrom("world");
  }, [onBack, palette, locale]);
  const values = colorValues(color.hex);
  const ink =
    contrastRatio(color.hex, "#FFFFFF") >= contrastRatio(color.hex, "#000000")
      ? "#FFFFFF"
      : "#000000";
  const latin = latinName(color);
  // A katakana name is its own reading.
  const reading = color.kana !== color.name ? color.kana : undefined;
  const shown = new Set([color.name, color.kana, color.romanized]);
  const otherNames = (color.aliases ?? []).filter((alias) => !shown.has(alias));
  const references = nameReferences.filter((ref) =>
    color.nameSources?.includes(ref.id),
  );
  const [copied, setCopied] = useState("");
  const [notice, setNotice] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
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
  const valueRow = (label: string, value: string) => (
    <div className="palette-value-field" key={label}>
      <div className="palette-value-label">{label}</div>
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
  return (
    <div className="palette-app palette-color-page" data-palette-app>
      <section
        className="palette-color-hero"
        style={{ backgroundColor: color.hex, color: ink }}
        data-tone={ink === "#FFFFFF" ? "dark" : "light"}
      >
        <a
          className="palette-color-back"
          href={paletteUrl(from, locale)}
          onClick={onBack}
        >
          <IconArrowLeft size={20} aria-hidden="true" />
          {c.backTo.replace("{palette}", t.names[from])}
        </a>
        {/* SHINBASHI / 新橋色 / しんばしいろ: the Latin name small above the
            name, the reading under it, in both languages. */}
        <div className="palette-color-title">
          {latin && (
            <p className="palette-color-latin" lang="en">
              {latin}
            </p>
          )}
          <h1 lang={langOf(color.name)}>{color.name}</h1>
          {reading && (
            <p className="palette-color-kana" lang="ja">
              {reading}
            </p>
          )}
        </div>
      </section>
      <div className="palette-color-body">
        <section aria-labelledby="palette-color-values">
          <h2 id="palette-color-values">{c.values}</h2>
          <div className="palette-color-values">
            {valueRow("HEX", values.HEX)}
            {valueRow("RGB", values.RGB)}
            {valueRow("HSL", values.HSL)}
            {valueRow("HSV", values.HSV)}
            {valueRow("OKLCH", values.OKLCH)}
            {color.munsellEstimate &&
              valueRow(t.munsellEstimate, color.munsellEstimate)}
          </div>
          <p className="palette-value-note">{t.munsellNote}</p>
          <a
            className="palette-open-hex"
            href={pagePath(`/hex/${color.hex.slice(1)}`, locale)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t.openHex}
            <IconArrowUpRight size={16} aria-hidden="true" />
          </a>
        </section>
        {(otherNames.length > 0 || references.length > 0) && (
          <section aria-labelledby="palette-color-names">
            <h2 id="palette-color-names">{t.nameReferences}</h2>
            {otherNames.length > 0 && (
              <p>
                {c.otherNames}：
                {otherNames.map((alias, index) => (
                  <span key={alias} lang={langOf(alias)}>
                    {index > 0 && "、"}
                    {alias}
                  </span>
                ))}
              </p>
            )}
            {references.length > 0 && (
              <div className="palette-reference-badges">
                {references.map((ref) => (
                  <span key={ref.id}>{ref.label}</span>
                ))}
              </div>
            )}
          </section>
        )}
        <section aria-labelledby="palette-color-preview">
          <h2 id="palette-color-preview">{t.uiPreview}</h2>
          <ColorUiPreview hex={color.hex} locale={locale} />
        </section>
        <section aria-labelledby="palette-color-about">
          <h2 id="palette-color-about">{c.about}</h2>
          <p>{t.notes.world}</p>
          {references.length > 0 && <p>{t.nameReferenceNote}</p>}
        </section>
      </div>
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

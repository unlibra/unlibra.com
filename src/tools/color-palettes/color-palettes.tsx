import { useEffect, useRef, useState } from "react";
import {
  IconArrowUpRight,
  IconCheck,
  IconChevronDown,
  IconCopy,
} from "@/components/ui/icons";
import type { ToolLocale as Locale } from "@/tools/messages";
import {
  dicUrl,
  groupsFor,
  pantoneUrl,
  references,
  type CollectionId,
  type PaletteColor,
  type PaletteGroup,
  type NameReference,
} from "./data";
import { colorValues, hueGroup, hueIds, hueAngles } from "./color-values";
import { paletteMessages } from "./messages";
import ColorUiPreview from "./ui-preview";

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
  const previewDialog = useRef<HTMLDialogElement>(null);
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const mobileDetails = useRef<HTMLDetailsElement>(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const visible = colors[collection];
  const isNamedCollection = collection === "japanese" || collection === "world";
  const byHue = isNamedCollection;
  const nameOf = (color: PaletteColor) =>
    locale === "en" ? color.romanized || color.name : color.name;
  let groups: PaletteGroup[];
  if (byHue) {
    const buckets = new Map(hueIds.map((id) => [id, [] as PaletteColor[]]));
    for (const color of visible) buckets.get(hueGroup(color.hex))!.push(color);
    groups = hueIds
      .map((id) => ({ name: id, colors: buckets.get(id)! }))
      .filter((group) => group.colors.length);
    const metrics = new Map(
      visible.map((color) => [color.id, colorValues(color.hex)]),
    );
    for (const group of groups)
      group.colors.sort((first, second) => {
        const a = metrics.get(first.id)!,
          b = metrics.get(second.id)!;
        if (group.name === "neutral") return b.lightness - a.lightness;
        const angle = (hue: number) =>
          group.name === "red" && hue >= 315 ? hue - 360 : hue;
        return angle(a.hue) - angle(b.hue) || b.lightness - a.lightness;
      });
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
  const badges = () =>
    selected.nameSources?.length ? (
      <div className="palette-reference-badges" aria-label={t.nameReferences}>
        {nameReferences
          .filter((ref) => selected.nameSources!.includes(ref.id))
          .map((ref) => (
            <span key={ref.id} title={`${t.nameReferences}: ${ref.label}`}>
              {ref.label}
            </span>
          ))}
      </div>
    ) : null;
  const numericValues = () => (
    <>
      <div className="palette-primary-values">
        {valueRow("HEX", values.HEX)}
        {valueRow("RGB", values.RGB)}
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
        {selected.munsellEstimate &&
          valueRow(t.munsellEstimate, selected.munsellEstimate)}
        <p className="palette-value-note">{t.munsellNote}</p>
      </details>
    </>
  );
  const inspectorContent = () => (
    <>
      {numericValues()}
      <button
        className="palette-preview-launch"
        type="button"
        onClick={() => previewDialog.current?.showModal()}
      >
        {t.uiPreview}
      </button>
    </>
  );
  const hexUrl = `${locale === "en" ? "/en" : ""}/hex/${selected.hex.slice(1)}`;
  return (
    <div className="palette-app" data-palette-app>
      <nav className="palette-collections" aria-label={t.collections}>
        {(
          [
            {
              label: t.collectionKinds.names,
              ids: ["japanese", "world"],
              external: true,
            },
            {
              label: t.collectionKinds.scales,
              ids: ["tailwind", "radix", "open-color"],
            },
            {
              label: t.collectionKinds.themes,
              ids: ["nord", "catppuccin", "dracula"],
            },
          ] as const
        ).map((section) => (
          <div className="palette-collection-section" key={section.label}>
            <p className="palette-collection-label">{section.label}</p>
            <div className="palette-collection-options">
              {section.ids.map((id) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={collection === id}
                  onClick={() => switchCollection(id)}
                  data-collection={id}
                >
                  {t.names[id]}
                </button>
              ))}
              {"external" in section && (
                <div className="palette-official-links">
                  {[
                    ["DIC", dicUrl, t.dicLink],
                    ["PANTONE", pantoneUrl, t.pantoneLink],
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
              )}
            </div>
          </div>
        ))}
      </nav>
      <dialog
        ref={previewDialog}
        className="palette-preview-dialog"
        aria-label={t.uiPreview}
        onClick={(event) => {
          if (event.target === event.currentTarget)
            previewDialog.current?.close();
        }}
      >
        <div className="palette-preview-dialog-body">
          <header>
            <div>
              <h2>{t.uiPreview}</h2>
              <p>
                {nameOf(selected)} · {selected.hex}
              </p>
            </div>
            <button
              type="button"
              onClick={() => previewDialog.current?.close()}
            >
              {locale === "ja" ? "閉じる" : "Close"}
            </button>
          </header>
          <ColorUiPreview hex={selected.hex} locale={locale} />
        </div>
      </dialog>
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
          {byHue && (
            <>
              <p className="palette-hue-label">{t.findByHue}</p>
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
                            : `hsl(${hueAngles[group.name as (typeof hueIds)[number]]} 65% 55%)`,
                      }}
                      aria-hidden="true"
                    />
                    {groupLabel(group.name)}
                    <small>{group.colors.length}</small>
                    <IconChevronDown size={14} aria-hidden="true" />
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
              {!isNamedCollection && <p>{t.notes[collection]}</p>}
              <p>
                {locale === "ja" ? "出典・著作者：" : "Source / authors: "}
                {t.sourceNames[collection]}
              </p>
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
                  <p>{t.nameReferenceNote}</p>
                  <p>
                    {locale === "ja"
                      ? "色名・色値を抜粋し、表記を整理しています。"
                      : "Color names and values excerpted; notation normalized."}
                  </p>
                  <div className="palette-source-links">
                    {[...nameReferences]
                      .sort(
                        (a, b) =>
                          ["jis", "dic", "pantone", "wada"].indexOf(a.id) -
                          ["jis", "dic", "pantone", "wada"].indexOf(b.id),
                      )
                      .map((ref) => (
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
                  {isNamedCollection ? "Wikipedia" : t.names[collection]}
                  <ExternalIcon />
                </a>
                <a
                  href={references[collection].licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {locale === "ja"
                    ? "色データのライセンス："
                    : "Color data license: "}
                  {references[collection].license}
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
            {inspectorContent()}
            <a
              className="palette-open-hex"
              href={hexUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
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
            {inspectorContent()}
          </div>
        </details>
        <a
          href={hexUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t.openHex}
        >
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

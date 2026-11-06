import {
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { flushSync } from "react-dom";
import {
  IconArrowUpRight,
  IconCheck,
  IconChevronDown,
  IconCopy,
  IconX,
} from "@/components/ui/icons";
import type { ToolLocale as Locale } from "@/tools/messages";
import {
  dicUrl,
  groupsFor,
  pantoneUrl,
  colorUrl,
  isNamedCollection,
  paletteUrl,
  references,
  type CollectionId,
  type PaletteColor,
  type PaletteGroup,
  type NameReference,
} from "./data";
import {
  colorValues,
  hueGroup,
  hueIds,
  hueMarkers,
  lightToDark,
  type HueId,
} from "./color-values";
import { paletteMessages } from "./messages";
import ColorUiPreview from "./ui-preview";
import ColorDetail, { displayName } from "./color-detail";
import { sweep } from "./sweep";

const ExternalIcon = () => <IconArrowUpRight size={16} aria-hidden="true" />;

function namedGroups(visible: PaletteColor[]): PaletteGroup[] {
  const buckets = new Map(hueIds.map((id) => [id, [] as PaletteColor[]]));
  for (const color of visible) {
    if (!color.munsellEstimate)
      throw new Error(`Missing Munsell estimate: ${color.hex}`);
    buckets.get(hueGroup(color.munsellEstimate))!.push(color);
  }
  return hueIds
    .map((id) => ({ name: id, colors: lightToDark(buckets.get(id)!) }))
    .filter((group) => group.colors.length);
}

const langOf = (text: string) =>
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(text)
    ? "ja"
    : "en";

export default function ColorPalettes({
  locale,
  collection,
  colors: visible,
  nameReferences,
  license,
}: {
  locale: Locale;
  /** The palette of this page; the others are links to their pages. */
  collection: CollectionId;
  colors: PaletteColor[];
  nameReferences: NameReference[];
  /** The license of a named palette's data, shown on its colors' pages. */
  license?: { name: string; url: string };
}) {
  const t = paletteMessages[locale];
  // Named colors open their own pages; the other palettes keep the inspector.
  const named = isNamedCollection(collection);
  const [selected, setSelected] = useState<PaletteColor>(() => visible[0]);
  const previewDialog = useRef<HTMLDialogElement>(null);
  const [notice, setNotice] = useState("");
  const [copied, setCopied] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  // A named color opens in place, as Just HEX opens a color: its color
  // floods the screen from the swatch, its page comes under it, and the
  // address becomes the color's page (/colors/<slug>). Back shrinks it
  // into the swatch again. Its page also exists by itself at that address.
  const [open, setOpen] = useState<PaletteColor | null>(null);
  // The color shown now, for the history's events (outside React's state).
  const openRef = useRef<PaletteColor | null>(null);
  const listScroll = useRef(0);
  const listTitle = useRef("");
  const sweeping = useRef(false);
  const swatchChip = (slug: string) =>
    document.querySelector(
      `a.palette-swatch[data-slug="${slug}"] .palette-chip`,
    );
  /** Shows a color's page in place of the list, or the list again. */
  const show = (color: PaletteColor | null) => {
    openRef.current = color;
    flushSync(() => setOpen(color));
    document.documentElement.toggleAttribute("data-palette-color", !!color);
    if (color) {
      const site = listTitle.current.split(" - ").at(-1);
      document.title = `${displayName(color, locale)}${t.colorPage.titleSuffix} ${color.hex} - ${t.heading} - ${site}`;
      scrollTo(0, 0);
    } else {
      document.title = listTitle.current;
      scrollTo(0, listScroll.current);
    }
  };
  const run = (job: Promise<void>) => {
    sweeping.current = true;
    void job.finally(() => (sweeping.current = false));
  };
  const openColor = (
    event: ReactMouseEvent<HTMLAnchorElement>,
    color: PaletteColor,
  ) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    event.preventDefault();
    if (sweeping.current) return;
    listScroll.current = scrollY;
    listTitle.current = document.title;
    const chip = event.currentTarget.querySelector(".palette-chip");
    run(
      sweep(
        color.hex,
        "out",
        () => chip,
        () => {
          history.pushState(
            { paletteColor: color.slug },
            "",
            colorUrl(color.slug!, locale),
          );
          show(color);
        },
      ),
    );
  };
  useEffect(() => {
    if (!named) return;
    const onPopState = () => {
      const slug = (history.state as { paletteColor?: string } | null)
        ?.paletteColor;
      const color = slug && visible.find((item) => item.slug === slug);
      const current = openRef.current;
      if (color)
        show(color); // Forward again: no flood.
      else if (current)
        run(
          sweep(
            current.hex,
            "in",
            () => swatchChip(current.slug!),
            () => show(null),
          ),
        );
    };
    addEventListener("popstate", onPopState);
    return () => removeEventListener("popstate", onPopState);
  });
  const byHue = named;
  const nameOf = (color: PaletteColor) =>
    locale === "en" ? color.romanized || color.name : color.name;
  /**
   * Under a named color: its reading, or its English name for a katakana
   * name. In English, a romanized name has the original name under it.
   */
  const subNameOf = (color: PaletteColor) =>
    locale === "en" && color.romanized
      ? color.name
      : (color.kana ?? color.romanized);
  let groups: PaletteGroup[];
  if (byHue) {
    groups = namedGroups(visible);
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
        {valueRow(
          selected.css ? t.originalOklch : "OKLCH",
          selected.css ?? values.OKLCH,
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
    <>
      {open && license && (
        <ColorDetail
          locale={locale}
          color={open}
          palette={collection}
          nameReferences={nameReferences}
          license={license}
          onBack={(event) => {
            event.preventDefault();
            history.back();
          }}
        />
      )}
      <div className="palette-app" data-palette-app hidden={!!open}>
        <nav className="palette-collections" aria-label={t.collections}>
          <div className="palette-collection-heading">
            <h2>{t.collections}</h2>
          </div>
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
                  <a
                    key={id}
                    href={paletteUrl(id, locale)}
                    aria-current={collection === id ? "page" : undefined}
                    data-collection={id}
                  >
                    {t.names[id]}
                  </a>
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
        {!named && (
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
              <div className="palette-preview-heading">
                <div>
                  <h2>{t.uiPreview}</h2>
                  <p>
                    {nameOf(selected)} · {selected.hex}
                  </p>
                </div>
                <button
                  type="button"
                  className="palette-dialog-close"
                  aria-label={locale === "ja" ? "閉じる" : "Close"}
                  onClick={() => previewDialog.current?.close()}
                >
                  <IconX size={20} aria-hidden="true" />
                </button>
              </div>
              <ColorUiPreview hex={selected.hex} locale={locale} />
            </div>
          </dialog>
        )}
        <div
          className="palette-workspace"
          data-layout={named ? "full" : "inspector"}
        >
          <div className="palette-browser">
            <div className="palette-section-intro">
              <div>
                <h2>
                  {named
                    ? t.groupCount
                        .replace("{name}", t.names[collection])
                        .replace("{count}", String(visible.length))
                    : t.names[collection]}
                </h2>
                <p>{t.summaries[collection]}</p>
              </div>
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
                        className="palette-hue-dot"
                        style={{
                          backgroundColor: hueMarkers[group.name as HueId],
                        }}
                        aria-hidden="true"
                      />
                      <span>{groupLabel(group.name)}</span>
                    </a>
                  ))}
                </nav>
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
                      <h3>
                        {byHue
                          ? t.groupCount
                              .replace("{name}", groupLabel(group.name))
                              .replace("{count}", String(group.colors.length))
                          : groupLabel(group.name)}
                      </h3>
                    </div>
                  )}
                  <div className="palette-swatches">
                    {group.colors.map((color) => {
                      const label = `${color.variant ? `${color.variant} · ` : ""}${nameOf(color)}${color.nameQualifier ? ` (${color.nameQualifier})` : ""} ${color.hex}`;
                      const content = (
                        <>
                          <span
                            className="palette-chip"
                            style={{ backgroundColor: color.hex }}
                          />
                          <span
                            className="palette-color-name"
                            lang={langOf(nameOf(color))}
                          >
                            {collection === "catppuccin"
                              ? color.variant
                              : color.shade || nameOf(color)}
                          </span>
                          {named && subNameOf(color) && (
                            <span
                              className="palette-color-reading"
                              lang={langOf(subNameOf(color)!)}
                            >
                              {subNameOf(color)}
                            </span>
                          )}
                        </>
                      );
                      if (named) {
                        if (!color.slug)
                          throw new Error(`Missing slug: ${color.id}`);
                        return (
                          <a
                            key={color.id}
                            href={colorUrl(color.slug, locale)}
                            onClick={(event) => openColor(event, color)}
                            data-slug={color.slug}
                            data-color-id={color.id}
                            className="palette-swatch"
                            aria-label={label}
                          >
                            {content}
                          </a>
                        );
                      }
                      return (
                        <button
                          type="button"
                          key={color.id}
                          data-color-id={color.id}
                          className="palette-swatch"
                          aria-pressed={
                            selected.id === color.id &&
                            selected.hex === color.hex
                          }
                          onClick={() => choose(color)}
                          aria-label={label}
                        >
                          {content}
                        </button>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
            <details className="palette-sources" key={collection}>
              <summary>{t.sources}</summary>
              <div className="palette-source-body">
                <div className="palette-source-links palette-source-row">
                  <span>{locale === "ja" ? "出典：" : "Source: "}</span>
                  <a
                    href={references[collection].url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {named ? "Wikipedia" : t.names[collection]}
                    <ExternalIcon />
                  </a>
                </div>
                <div className="palette-source-links palette-source-row">
                  <span>{locale === "ja" ? "ライセンス：" : "License: "}</span>
                  <a
                    href={references[collection].licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {references[collection].license}
                    <ExternalIcon />
                  </a>
                </div>

                <p>
                  {locale === "ja" ? "著作者：" : "Authors: "}
                  {t.sourceNames[collection]}
                </p>
                <p>
                  {locale === "ja" ? "データについて：" : "About the data: "}
                  {named ? t.nameReferenceNote : t.notes[collection]}
                </p>
                <p>{t.conversions}</p>
                {named && (
                  <>
                    <div className="palette-source-links">
                      <span>{t.nameReferences}：</span>
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
              </div>
            </details>
          </div>
          {!named && (
            <aside className="palette-inspector" aria-label={t.selected}>
              <div
                className="palette-inspector-chip"
                style={{ backgroundColor: selected.hex }}
              />
              <div className="palette-inspector-body">
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
          )}
        </div>
        {!named && (
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
            <details className="palette-mobile-details">
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
        )}
        <div
          className="palette-toast"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {notice && <span>{notice}</span>}
        </div>
      </div>
    </>
  );
}

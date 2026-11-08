import type { CSSProperties } from "react";
import { contrastRatio } from "./color-values";
import type { ToolLocale } from "@/tools/messages";
import { IconSun, IconMoon } from "@/components/ui/icons";

export default function ColorUiPreview({
  hex,
  locale,
}: {
  hex: string;
  locale: ToolLocale;
}) {
  const foreground =
    contrastRatio(hex, "#FFFFFF") >= contrastRatio(hex, "#000000")
      ? "#FFFFFF"
      : "#000000";
  const ja = locale === "ja";
  return (
    <div className="palette-ui-preview">
      <p className="palette-preview-note">
        {ja
          ? "選んだ色をアクセントにした表示例。ボタン文字にはコントラストの高い白か黒を使っています。"
          : "Your color as an interface accent. Button text uses whichever has higher contrast: white or black."}
      </p>
      {[
        { mode: "light", background: "#FFFFFF", label: "Light" },
        { mode: "dark", background: "#181C25", label: "Dark" },
      ].map(({ mode, background, label }) => {
        const ratio = contrastRatio(hex, background);
        return (
          <div
            className="palette-demo-card"
            data-mode={mode}
            key={mode}
            style={
              {
                "--demo-accent": hex,
                "--demo-on-accent": foreground,
              } as CSSProperties
            }
          >
            <span
              className="palette-demo-mode"
              role="img"
              aria-label={label}
              title={label}
            >
              {mode === "light" ? (
                <IconSun size={20} />
              ) : (
                <IconMoon size={20} />
              )}
            </span>
            <div
              className="palette-demo-samples"
              role="group"
              aria-label={
                ja
                  ? `${label}のボタン・入力欄・リンク・チェックボックス・ラジオボタン・トグルの見本`
                  : `${label} button, field, link, checkbox, radio, and toggle examples`
              }
            >
              <strong>{ja ? "新しいプロジェクト" : "New project"}</strong>
              <input
                type="text"
                className="palette-demo-field"
                aria-label={ja ? "プロジェクト名" : "Project name"}
                placeholder={ja ? "プロジェクト名" : "Project name"}
              />
              <span className="palette-demo-selected">
                <label className="palette-demo-checkbox">
                  <input type="checkbox" defaultChecked />
                  {ja ? "通知を受け取る" : "Receive notifications"}
                </label>
                <span className="palette-demo-pill">
                  {ja ? "ラベル" : "Label"}
                </span>
              </span>
              <fieldset className="palette-demo-radios">
                <legend>{ja ? "表示形式" : "View"}</legend>
                {["list", "grid"].map((view) => (
                  <label className="palette-demo-control" key={view}>
                    <input
                      type="radio"
                      name={`palette-demo-view-${mode}`}
                      value={view}
                      defaultChecked={view === "list"}
                    />
                    {view === "list"
                      ? ja
                        ? "リスト"
                        : "List"
                      : ja
                        ? "グリッド"
                        : "Grid"}
                  </label>
                ))}
              </fieldset>
              <label className="palette-demo-control palette-demo-toggle">
                <input type="checkbox" role="switch" defaultChecked />
                <span
                  className="palette-demo-toggle-track"
                  aria-hidden="true"
                />
                {ja ? "自動保存" : "Autosave"}
              </label>
              <button type="button" className="palette-demo-link">
                {ja ? "詳細を見る" : "View details"} →
              </button>
              <button type="button" className="palette-demo-button">
                {ja ? "続ける" : "Continue"} →
              </button>
            </div>
            <div className="palette-demo-contrast">
              <span data-sufficient={ratio >= 4.5}>
                {ja ? "アクセント文字" : "Accent text"}
                <strong>{ratio.toFixed(2)}:1</strong>
              </span>
              <span>
                {ja ? "ボタン文字" : "Button text"}
                <strong>{contrastRatio(hex, foreground).toFixed(2)}:1</strong>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import type { CSSProperties } from "react";
import { contrastRatio } from "./color-values";
import type { ToolLocale } from "@/tools/messages";

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
          ? "選んだ色をアクセントにした表示例。"
          : "Your color as an interface accent."}
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
            <span className="palette-demo-mode">{label}</span>
            <div
              className="palette-demo-samples"
              role="img"
              aria-label={
                ja
                  ? `${label}のボタン・入力欄・リンク・選択状態の見本`
                  : `${label} button, field, link, and selection examples`
              }
            >
              <strong>{ja ? "新しいプロジェクト" : "New project"}</strong>
              <span className="palette-demo-field">
                {ja ? "プロジェクト名" : "Project name"}
              </span>
              <span className="palette-demo-selected">
                <span>✓</span>
                {ja ? "選択済み" : "Selected"}
                <span className="palette-demo-pill">
                  {ja ? "ラベル" : "Label"}
                </span>
              </span>
              <span className="palette-demo-link">
                {ja ? "詳細を見る" : "View details"} →
              </span>
              <span className="palette-demo-button">
                {ja ? "続ける" : "Continue"} →
              </span>
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
      <p className="palette-preview-note">
        {ja
          ? "通常サイズの文字は4.5:1以上が目安。ボタン文字にはコントラストの高い白か黒を使っています。"
          : "Normal text needs 4.5:1 contrast. Button text uses whichever has higher contrast: white or black."}
      </p>
    </div>
  );
}

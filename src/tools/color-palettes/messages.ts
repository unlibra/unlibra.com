import type { ToolLocale as Locale } from "@/tools/messages";

type SameStructure<T> = {
  [K in keyof T]: T[K] extends string
    ? string
    : T[K] extends object
      ? SameStructure<T[K]>
      : T[K];
};

const ja = {
  title: "Color Palettes",
  description:
    "名前から、配色から。使いたい色を見つけるための、小さな色見本帳。",
  collections: "色見本を選ぶ",
  names: {
    japanese: "日本の色",
    wada: "和田三造",
    tailwind: "Tailwind CSS",
    nord: "Nord",
  },
  summaries: {
    japanese: "風景や草花、暮らしから生まれた、名前のある色。",
    wada: "和田三造がまとめた、色と色の組み合わせ。",
    tailwind: "UIづくりに使いやすい、明るさのそろったカラースケール。",
    nord: "北欧の風景を思わせる、落ち着いた16色。",
  },
  notes: {
    japanese:
      "Wikipedia各記事の色見本から選んだ表示例です。同じ色名にも複数の色値があり、唯一の標準値を示すものではありません。",
    wada: "『配色総鑑』A篇第10輯から選んだ3配色・12色。色名と組み合わせを原典で照合し、表示色はMIT公開のデジタル版のCMYKから変換しています。HEX・RGBは画面表示用の近似値です。",
    tailwind:
      "Tailwind CSS 4.3.3の色定義。HEX・RGBはsRGBへの近似変換です。元のOKLCHもコピーできます。",
    nord: "公式の16色を、Polar Night・Snow Storm・Frost・Auroraの4グループで掲載しています。",
  },
  search: "色名・読み・HEXで検索",
  clear: "検索をクリア",
  count: "{count}色",
  combinations: "{count}配色",
  empty: "一致する色が見つかりませんでした。",
  reset: "検索条件をクリア",
  selected: "選んだ色",
  copy: "コピー",
  format: "コードの形式",
  copied: "コピーしました",
  copyError: "コピーできませんでした。コードを選択してコピーしてください。",
  openHex: "Just HEXで見る",
  source: "この色の出典",
  sources: "出典とデータ",
  sourceLink: "出典を見る",
  data: "数値データ",
  license: "ライセンス",
  help: "色を選ぶと、コードと出典を確認できます。",
  official: "公式サイトで探す",
  pantoneDescription:
    "Pantoneの色名・色番号から探すなら、公式のColor Finderへ。",
  pantoneLink: "Color Finderを開く",
  external: "外部サイト",
  wadaOriginal: "和田三造『配色総鑑』A篇 第10輯（1935年）",
  wadaReference:
    "色名・組み合わせ：原典（パブリックドメイン）。数値：Dain Blodornのデジタル版（MIT）。同版は青幻舎『配色事典 新装・改訂版』を出典としています。",
  wadaEdition: "デジタル版が参照した復刻版",
  originalPage: "この配色の原典",
  sourceNames: {
    japanese: "日本語版Wikipedia 各色の記事・執筆者",
    wada: "Dain Blodorn / sanzo-wada",
    tailwind: "Tailwind Labs",
    nord: "Sven Greb / Nord",
  },
  japaneseChanges:
    "色名・HEXを抽出し、HEXの表記を統一。読み・ローマ字表記を付記しています。各色の出典リンクから参照版と執筆履歴を確認できます。",
  original: "原典",
  digital: "デジタル版",
  combination: "配色",
} as const;

const en: SameStructure<typeof ja> = {
  title: "Color Palettes",
  description:
    "Find a color by its name, or a palette by its combinations. A small collection of color references.",
  collections: "Choose a collection",
  names: {
    japanese: "Japanese colors",
    wada: "Sanzo Wada",
    tailwind: "Tailwind CSS",
    nord: "Nord",
  },
  summaries: {
    japanese:
      "Named colors drawn from landscapes, flowers, and everyday life in Japan.",
    wada: "Color combinations collected by the artist Sanzo Wada.",
    tailwind: "Consistent color scales for building interfaces.",
    nord: "Sixteen quiet colors inspired by Nordic landscapes.",
  },
  notes: {
    japanese:
      "Selected examples from individual Wikipedia articles. A traditional color name can have several color values; these are not definitive standards.",
    wada: "Twelve colors in three selected combinations from Haishoku Sōkan, A10. Names and combinations checked against the original; display colors converted from CMYK in the MIT digital edition. HEX and RGB are screen approximations.",
    tailwind:
      "Color definitions from Tailwind CSS 4.3.3. HEX and RGB approximate sRGB. You can also copy the original OKLCH.",
    nord: "The sixteen official colors, grouped into Polar Night, Snow Storm, Frost, and Aurora.",
  },
  search: "Search by name, reading, or HEX",
  clear: "Clear search",
  count: "{count} colors",
  combinations: "{count} combinations",
  empty: "No matching colors found.",
  reset: "Clear search",
  selected: "Selected color",
  copy: "Copy",
  format: "Code format",
  copied: "Copied",
  copyError: "Could not copy. Select the code and copy it manually.",
  openHex: "View in Just HEX",
  source: "Source of this color",
  sources: "Sources and data",
  sourceLink: "View source",
  data: "Color data",
  license: "License",
  help: "Select a color to see its codes and source.",
  official: "Explore the official reference",
  pantoneDescription:
    "Looking for a Pantone color name or number? Explore the official Color Finder.",
  pantoneLink: "Open Color Finder",
  external: "External site",
  wadaOriginal: "Sanzo Wada, Haishoku Sōkan, A10 (1935)",
  wadaReference:
    "Names and combinations: public-domain original. Numeric data: Dain Blodorn’s MIT digital edition, which cites Seigensha’s revised A Dictionary of Color Combinations.",
  wadaEdition: "Reprint cited by the digital edition",
  originalPage: "Original combination",
  sourceNames: {
    japanese: "Japanese Wikipedia contributors",
    wada: "Dain Blodorn / sanzo-wada",
    tailwind: "Tailwind Labs",
    nord: "Sven Greb / Nord",
  },
  japaneseChanges:
    "Color names and HEX values extracted; HEX case normalized; readings and romanization added. Each color links to the referenced revision and its contributor history.",
  original: "Original",
  digital: "Digital edition",
  combination: "Combination",
};

export const paletteMessages: Record<Locale, SameStructure<typeof ja>> = {
  ja,
  en,
};

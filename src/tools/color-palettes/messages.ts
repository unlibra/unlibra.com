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
  more: "その他の数値",
  collectionKinds: {
    names: "色名・色見本",
    scales: "UIカラースケール",
    themes: "配色テーマ",
  },
  detailView: "色の詳細表示",
  values: "数値",
  uiPreview: "UIプレビュー",
  findByHue: "色相から探す",
  jumpHint: "見出しへ移動 ↓",
  munsellEstimate: "マンセル（近似換算）",
  originalOklch: "OKLCH（元の値）",
  hueNavigation: "色相グループ",
  hues: {
    red: "赤",
    orange: "橙",
    yellow: "黄",
    green: "緑",
    blue: "青",
    purple: "紫",
    neutral: "無彩色",
  },
  munsellNote:
    "換算値はsRGBからの近似です。光源Cへの順応変換・補間／外挿を使用しており、測色値や規格値を示すものではありません。",
  dicLink: "DIC公式 カラーガイド情報検索（新しいタブで開く）",
  conversions: "追加の数値は表示用sRGBから算出しています。",
  names: {
    japanese: "日本の色",
    world: "世界の色",
    tailwind: "Tailwind CSS",
    nord: "Nord",
    radix: "Radix Colors",
    catppuccin: "Catppuccin",
    dracula: "Dracula",
    "open-color": "Open Color",
  },
  summaries: {
    japanese: "和の名前を手がかりに、使いたい色を探す。",
    world: "日本の色も含めた、名前のある色のコレクション。",
    tailwind: "UIづくりに使いやすい、明るさのそろったカラースケール。",
    nord: "北欧の風景を思わせる、落ち着いた16色。",
    radix: "背景・境界線・文字に役割を持たせた、12段階の色。",
    catppuccin: "4つの味わいから選ぶ、やわらかなパステルカラー。",
    dracula: "暗色のDraculaと明色のAlucard。鮮やかなアクセントを楽しむ配色。",
    "open-color": "13色の10段階スケールと白・黒。UIに使いやすい色のセット。",
  },
  notes: {
    japanese:
      "世界の色のうち、代表名がカタカナで始まらない色名を掲載しています。同じ色名にも複数の色値があり、唯一の標準値を示すものではありません。",
    world:
      "Wikipediaの色名一覧から選んだ表示例です。日本の色もすべて含みます。同じ色名にも複数の色値があり、唯一の標準値を示すものではありません。",
    tailwind:
      "Tailwind CSS 4.3.3の色定義。HEX・RGBはsRGBへの近似変換です。元のOKLCHもコピーできます。",
    nord: "公式の16色を、Polar Night・Snow Storm・Frost・Auroraの4グループで掲載しています。",
    radix:
      "公式の31スケールをLight・Darkそれぞれ12段階で掲載しています。表示・コピーは不透明なsRGB値です。透過色・Display P3版は含みません。",
    catppuccin:
      "公式のLatte・Frappé・Macchiato・Mochaを、各26色で掲載しています。公式のHEX値を使用しています。",
    dracula:
      "公式リポジトリのOSS配色表から、Dracula・Alucardの各12トークンを掲載しています。同じHEXでも用途が異なるトークンは残しています。",
    "open-color":
      "公式の13スケール（0〜9）と白・黒の132色です。公式のHEX値を使用しています。",
  },
  count: "{count}色",
  selected: "選んだ色",
  copy: "コピー",
  copied: "コピーしました",
  copyError: "コピーできませんでした。コードを選択してコピーしてください。",
  openHex: "Just HEXで見る",
  sources: "出典とデータ",
  sourceLink: "出典を見る",
  data: "数値データ",
  license: "ライセンス",
  pantoneLink: "PANTONE公式 Color Finder（新しいタブで開く）",
  sourceNames: {
    japanese: "日本語版Wikipedia 色名一覧・各色の記事の執筆者",
    world: "日本語版Wikipedia 色名一覧・各色の記事の執筆者",
    tailwind: "Tailwind Labs",
    nord: "Sven Greb / Nord",
    radix: "Modulz / WorkOS",
    catppuccin: "Catppuccin",
    dracula: "Dracula Theme",
    "open-color": "heeyeun / Open Color",
  },
  namedChanges:
    "色名・HEXを抽出し、表記と別名を整理しています。以前から掲載している色は個別記事の色値を保持しています。数値データ内の出典リンクから参照版と執筆履歴を確認できます。",
  nameReferences: "色名の参考",
  nameReferenceNote: "Wikipediaの色名・色値を抜粋し、表記を整理しています。",
} as const;

const en: SameStructure<typeof ja> = {
  title: "Color Palettes",
  description:
    "Find a color by its name, or a palette by its combinations. A small collection of color references.",
  collections: "Choose a collection",
  more: "More values",
  collectionKinds: {
    names: "Color names & references",
    scales: "UI color scales",
    themes: "Color themes",
  },
  detailView: "Color detail view",
  values: "Values",
  uiPreview: "UI preview",
  findByHue: "Browse by hue",
  jumpHint: "Jump to a section ↓",
  munsellEstimate: "Munsell (approx.)",
  originalOklch: "OKLCH (original)",
  hueNavigation: "Hue groups",
  hues: {
    red: "Red",
    orange: "Orange",
    yellow: "Yellow",
    green: "Green",
    blue: "Blue",
    purple: "Purple",
    neutral: "Neutrals",
  },
  munsellNote:
    "Estimates convert sRGB with adaptation to Illuminant C and interpolation/extrapolation. They are not measured colors or standard reference values.",
  dicLink: "DIC official color guide search (opens in a new tab)",
  conversions: "Additional values are calculated from display sRGB.",
  names: {
    japanese: "Japanese colors",
    world: "World colors",
    tailwind: "Tailwind CSS",
    nord: "Nord",
    radix: "Radix Colors",
    catppuccin: "Catppuccin",
    dracula: "Dracula",
    "open-color": "Open Color",
  },
  summaries: {
    japanese: "A selection of Japanese color names from the world collection.",
    world: "Named colors from around the world, including all Japanese colors.",
    tailwind: "Consistent color scales for building interfaces.",
    nord: "Sixteen quiet colors inspired by Nordic landscapes.",
    radix: "Twelve-step scales with roles for backgrounds, borders, and text.",
    catppuccin: "Soft pastel colors in four distinct flavors.",
    dracula: "Vivid accents in dark Dracula and light Alucard palettes.",
    "open-color":
      "Thirteen ten-step scales, plus white and black, for interfaces.",
  },
  notes: {
    japanese:
      "Colors from the world collection whose representative names do not start with katakana. A color name can have several color values; these are not definitive standards.",
    world:
      "Selected examples from Japanese Wikipedia color-name lists, including all Japanese colors. A color name can have several color values; these are not definitive standards.",
    tailwind:
      "Color definitions from Tailwind CSS 4.3.3. HEX and RGB approximate sRGB. You can also copy the original OKLCH.",
    nord: "The sixteen official colors, grouped into Polar Night, Snow Storm, Frost, and Aurora.",
    radix:
      "The 31 official scales, each with 12 steps in Light and Dark. Display and copy use opaque sRGB values; alpha and Display P3 variants are not included.",
    catppuccin:
      "The official Latte, Frappé, Macchiato, and Mocha flavors, each with 26 colors. Uses official HEX values.",
    dracula:
      "The 12 role tokens in each official Dracula and Alucard OSS palette table. Tokens with the same HEX but different roles remain separate.",
    "open-color":
      "The 13 official scales (0–9), plus white and black: 132 colors using official HEX values.",
  },
  count: "{count} colors",
  selected: "Selected color",
  copy: "Copy",
  copied: "Copied",
  copyError: "Could not copy. Select the code and copy it manually.",
  openHex: "View in Just HEX",
  sources: "Sources and data",
  sourceLink: "View source",
  data: "Color data",
  license: "License",
  pantoneLink: "PANTONE official Color Finder (opens in a new tab)",
  sourceNames: {
    japanese: "Japanese Wikipedia contributors",
    world: "Japanese Wikipedia contributors",
    tailwind: "Tailwind Labs",
    nord: "Sven Greb / Nord",
    radix: "Modulz / WorkOS",
    catppuccin: "Catppuccin",
    dracula: "Dracula Theme",
    "open-color": "heeyeun / Open Color",
  },
  namedChanges:
    "Names and HEX values extracted; names and aliases normalized. Previously featured colors retain their individual-article values. Source links in the downloadable data identify the referenced revisions and contributor history.",
  nameReferences: "Color-name references",
  nameReferenceNote:
    "Color names and values excerpted from Wikipedia; notation normalized.",
};

export const paletteMessages: Record<Locale, SameStructure<typeof ja>> = {
  ja,
  en,
};

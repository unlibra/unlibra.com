// Hepburn romanization of hiragana readings, as the named colors' romanized
// names are written (Kikyo, Oni, Shinbashi): no long vowels (おう, こう,
// ゅう and うう drop their second vowel), n kept before b, m and p, and a
// doubled consonant for っ. The colors' URL names (slugs) were made this way.
const syllables: Record<string, string> = {
  あ: "a",
  い: "i",
  う: "u",
  え: "e",
  お: "o",
  か: "ka",
  き: "ki",
  く: "ku",
  け: "ke",
  こ: "ko",
  さ: "sa",
  し: "shi",
  す: "su",
  せ: "se",
  そ: "so",
  た: "ta",
  ち: "chi",
  つ: "tsu",
  て: "te",
  と: "to",
  な: "na",
  に: "ni",
  ぬ: "nu",
  ね: "ne",
  の: "no",
  は: "ha",
  ひ: "hi",
  ふ: "fu",
  へ: "he",
  ほ: "ho",
  ま: "ma",
  み: "mi",
  む: "mu",
  め: "me",
  も: "mo",
  や: "ya",
  ゆ: "yu",
  よ: "yo",
  ら: "ra",
  り: "ri",
  る: "ru",
  れ: "re",
  ろ: "ro",
  わ: "wa",
  を: "o",
  ん: "n",
  が: "ga",
  ぎ: "gi",
  ぐ: "gu",
  げ: "ge",
  ご: "go",
  ざ: "za",
  じ: "ji",
  ず: "zu",
  ぜ: "ze",
  ぞ: "zo",
  だ: "da",
  ぢ: "ji",
  づ: "zu",
  で: "de",
  ど: "do",
  ば: "ba",
  び: "bi",
  ぶ: "bu",
  べ: "be",
  ぼ: "bo",
  ぱ: "pa",
  ぴ: "pi",
  ぷ: "pu",
  ぺ: "pe",
  ぽ: "po",
  ゐ: "i",
  ゑ: "e",
};
const small: Record<string, string> = { ゃ: "a", ゅ: "u", ょ: "o" };

/** The romanization of a hiragana reading; throws on any other character. */
export function romaji(kana: string): string {
  const parts: string[] = [];
  for (let i = 0; i < kana.length; i++) {
    const char = kana[i];
    const next = kana[i + 1];
    if (char === "っ") {
      parts.push("*");
      continue;
    }
    const base = syllables[char];
    if (base === undefined) throw new Error(`Not hiragana: ${char} in ${kana}`);
    if (next && small[next]) {
      // きゃ → kya, しゃ → sha, ちゃ → cha, じゃ → ja
      parts.push(
        (/(shi|chi|ji)$/.test(base)
          ? base.slice(0, -1)
          : base.slice(0, -1) + "y") + small[next],
      );
      i++;
      continue;
    }
    parts.push(base);
  }
  let out = "";
  parts.forEach((part, i) => {
    if (part === "*") {
      const next = parts[i + 1] ?? "";
      out += next.startsWith("ch") ? "t" : (next[0] ?? "");
      return;
    }
    const long =
      (part === "u" && /[ou]$/.test(out) && parts[i - 1] !== "*") ||
      (part === "o" && /o$/.test(out));
    if (!long) out += part;
  });
  return out;
}

const isKatakana = (name: string) =>
  /^[\p{Script=Katakana}ー・\s]+$/u.test(name.normalize("NFKC"));

/**
 * A named color's name in Latin letters: its romanized name when it has one
 * (an English name for a katakana name), otherwise its reading romanized
 * without the trailing 色 (桜色 → sakura).
 */
export function latinName(color: {
  name: string;
  kana?: string;
  romanized?: string;
}): string | undefined {
  if (color.romanized) return color.romanized;
  if (!color.kana || isKatakana(color.name)) return undefined;
  return romaji(
    color.name.endsWith("色") ? color.kana.replace(/いろ$/, "") : color.kana,
  );
}

import type { Locale } from "@/config/locales";
import en, { type Messages } from "@/messages/en";
import ja from "@/messages/ja";

export type { Messages };

/** Texts of the pages in each language (the header and footer: ./layout.ts). */
export const messages: Record<Locale, Messages> = { ja, en };

import { locales, type Locale } from "@/config/locales";

/** The page's language, from `<html lang>` (BaseLayout sets it). */
export const pageLocale = (): Locale => {
  const lang = document.documentElement.lang;
  const locale = locales.find((candidate) => candidate === lang);
  if (!locale) throw new Error(`<html lang="${lang}"> is not a site locale`);
  return locale;
};

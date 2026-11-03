import { CopyButton } from "@/components/ui/copy-button";
import type { ToolLocale } from "@/tools/messages";
import { ToolRoot } from "@/tools/tool-root";

/**
 * Island entry: the donate page's copy button, the password generator's. It
 * gets no address: it copies the text of the page's [data-donate-email],
 * which the build encodes and /email-decode.js restores in the browser.
 */
export default function DonateCopyButton({
  locale,
  label,
  failed,
}: {
  /** The page's language, for the button's "コピー" and "完了". */
  locale: ToolLocale;
  label: string;
  failed: string;
}) {
  const address = () =>
    document.querySelector("[data-donate-email]")?.textContent?.trim() ?? "";
  return (
    <ToolRoot locale={locale}>
      <CopyButton
        // Before the decoder restores the address, the text is a
        // placeholder without an address: copy nothing then.
        text={() => (/^[^\s@]+@[^\s@]+$/.test(address()) ? address() : "")}
        label={label}
        failed={failed}
      />
    </ToolRoot>
  );
}

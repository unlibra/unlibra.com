// E2E: Favicon Generator (replaces the Phase 4 E7 checks). The downloaded
// files are read back: ICO entries, ZIP contents, PNG sizes and pixels.
import { expect, test } from "@playwright/test";
import JSZip from "jszip";

import { formatMessage } from "../../src/tools/messages/format.ts";

import {
  chooseFile,
  download,
  dropFile,
  LOCALES,
  open,
  pngFile,
  readIco,
  readPng,
  setRange,
  svgFile,
  toast,
  toolUrl,
  waitForDropZone,
} from "./helpers.js";

const VIEWBOX_SVG = svgFile(
  "wide.svg",
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 60"><rect width="120" height="60" fill="#36c"/></svg>',
);

for (const locale of LOCALES) {
  const { t } = locale;
  const m = t.faviconGenerator;

  test.describe(`favicon generator (${locale.lang})`, () => {
    test.beforeEach(async ({ page }) => {
      await open(page, toolUrl(locale, "favicon-generator"));
    });

    const downloadButton = (page) =>
      page.getByRole("button", { name: t.common.download, exact: true });
    /**
     * Output format or size button ("favicon.ico", "Apple Touch Icon",
     * "48×48"), named by its visible text (final-review 4).
     */
    const toggle = (page, label) =>
      page.getByRole("button", { name: label, exact: true });
    const preview = (page) => page.getByAltText(t.common.preview);

    const loadPng = async (page) => {
      await chooseFile(page, await pngFile("logo.png", 300, 200));
      await expect(preview(page)).toBeVisible();
    };

    test("a selected image is previewed as a square of its shorter side", async ({
      page,
    }) => {
      await expect(downloadButton(page)).toBeDisabled();
      await loadPng(page);
      await expect
        .poll(() =>
          preview(page).evaluate((img) => [
            img.naturalWidth,
            img.naturalHeight,
          ]),
        )
        .toEqual([200, 200]);
    });

    test("an SVG with only a viewBox takes its size from the viewBox", async ({
      page,
    }) => {
      await chooseFile(page, VIEWBOX_SVG);
      await expect(preview(page)).toBeVisible();
      await expect
        .poll(() =>
          preview(page).evaluate((img) => [
            img.naturalWidth,
            img.naturalHeight,
          ]),
        )
        .toEqual([60, 60]);
    });

    test("by default one favicon.ico with 16 and 32 pixel images is downloaded", async ({
      page,
    }) => {
      await loadPng(page);
      const file = await download(page, downloadButton(page));
      expect(file.name).toBe("favicon.ico");
      const images = readIco(file.buffer);
      expect(images.map((image) => image.size)).toEqual([16, 32]);
      for (const { size, png } of images) {
        const { format, width, height } = await readPng(png);
        expect([format, width, height]).toEqual(["png", size, size]);
      }
    });

    test("several files are downloaded as one ZIP, sizes in order", async ({
      page,
    }) => {
      await loadPng(page);
      await toggle(page, "Apple Touch Icon").click();
      await toggle(page, "Android Icon").click();
      // Selected out of order: 48, then 16 off and on again.
      await toggle(page, "48×48").click();
      await toggle(page, "16×16").click();
      await toggle(page, "16×16").click();
      const file = await download(page, downloadButton(page));
      expect(file.name).toBe("favicons.zip");
      const zip = await JSZip.loadAsync(file.buffer);
      expect(Object.keys(zip.files).sort()).toEqual([
        "apple-touch-icon.png",
        "favicon.ico",
        "icon-192.png",
        "icon-512.png",
      ]);
      const ico = readIco(await zip.file("favicon.ico").async("nodebuffer"));
      expect(ico.map((image) => image.size)).toEqual([16, 32, 48]);
      for (const [name, size] of [
        ["apple-touch-icon.png", 180],
        ["icon-192.png", 192],
        ["icon-512.png", 512],
      ]) {
        const png = await readPng(await zip.file(name).async("nodebuffer"));
        expect([png.width, png.height], name).toEqual([size, size]);
      }
    });

    test("only the selected formats are output", async ({ page }) => {
      await loadPng(page);
      await toggle(page, "favicon.ico").click();
      await toggle(page, "Apple Touch Icon").click();
      const apple = await download(page, downloadButton(page));
      expect(apple.name).toBe("apple-touch-icon.png");
      const png = await readPng(apple.buffer);
      expect([png.width, png.height]).toEqual([180, 180]);
      // Always on a white background.
      expect(png.pixel).toEqual([255, 255, 255, 255]);

      await toggle(page, "Apple Touch Icon").click();
      await toggle(page, "Android Icon").click();
      const android = await download(page, downloadButton(page));
      expect(android.name).toBe("favicons.zip");
      const zip = await JSZip.loadAsync(android.buffer);
      expect(Object.keys(zip.files).sort()).toEqual([
        "icon-192.png",
        "icon-512.png",
      ]);
    });

    test("the corner radius and the background color reach the files", async ({
      page,
    }) => {
      await loadPng(page);
      await toggle(page, "favicon.ico").click();
      await toggle(page, "Android Icon").click();
      const corner = async () => {
        const file = await download(page, downloadButton(page));
        const zip = await JSZip.loadAsync(file.buffer);
        return (
          await readPng(await zip.file("icon-192.png").async("nodebuffer"))
        ).pixel;
      };
      // The image's corners are transparent.
      expect(await corner()).toEqual([0, 0, 0, 0]);

      await page.getByLabel(m.addBackgroundColor).check();
      const code = page.getByRole("textbox", { name: m.backgroundColorCode });
      await code.fill("#00ff00");
      expect(await corner()).toEqual([0, 255, 0, 255]);

      // Fully rounded: the corner is outside the circle, background or not.
      await setRange(page.getByRole("slider", { name: m.borderRadius }), 100);
      expect((await corner())[3]).toBe(0);
    });

    test("the corner radius and the background color show in the preview", async ({
      page,
    }) => {
      await loadPng(page);
      // A settings update revokes the old blob URL before publishing the
      // replacement. Wait for that replacement before asking img.decode()
      // to read its pixels; decoding the previous URL can reject mid-update.
      const updatePreview = async (change) => {
        const previous = await preview(page).getAttribute("src");
        await change();
        await expect(preview(page)).not.toHaveAttribute("src", previous);
      };
      /** A pixel of the preview image, read by drawing it on a canvas. */
      const pixel = (x, y) =>
        preview(page).evaluate(
          async (img, [px, py]) => {
            await img.decode();
            const canvas = document.createElement("canvas");
            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;
            const context = canvas.getContext("2d");
            context.drawImage(img, 0, 0);
            return [...context.getImageData(px, py, 1, 1).data];
          },
          [x, y],
        );
      // The image's corners are transparent; its middle is red.
      await expect.poll(() => pixel(0, 0)).toEqual([0, 0, 0, 0]);
      expect(await pixel(100, 100)).toEqual([255, 0, 0, 255]);

      await updatePreview(() => page.getByLabel(m.addBackgroundColor).check());
      await updatePreview(() =>
        page
          .getByRole("textbox", { name: m.backgroundColorCode })
          .fill("#00ff00"),
      );
      await expect.poll(() => pixel(0, 0)).toEqual([0, 255, 0, 255]);
      expect(await pixel(100, 100)).toEqual([255, 0, 0, 255]);

      // Fully rounded: the corner is outside the circle, background or not.
      await updatePreview(() =>
        setRange(page.getByRole("slider", { name: m.borderRadius }), 100),
      );
      await expect.poll(async () => (await pixel(0, 0))[3]).toBe(0);
      expect(await pixel(100, 100)).toEqual([255, 0, 0, 255]);
    });

    test("without an output format the download button is disabled", async ({
      page,
    }) => {
      await loadPng(page);
      await expect(toggle(page, "16×16")).toBeVisible();
      await toggle(page, "favicon.ico").click();
      await expect(downloadButton(page)).toBeDisabled();
      // The sizes are only for favicon.ico.
      await expect(toggle(page, "16×16")).toHaveCount(0);
    });

    test("favicon.ico without sizes asks for a size", async ({ page }) => {
      await loadPng(page);
      await toggle(page, "16×16").click();
      await toggle(page, "32×32").click();
      await downloadButton(page).click();
      await expect(toast(page, m.errors.selectSize)).toBeVisible();
    });

    test("a file that is not an image, or too large an image, is refused", async ({
      page,
    }) => {
      await chooseFile(page, {
        name: "notes.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("hello"),
      });
      await expect(toast(page, t.common.fileErrors.selectImage)).toBeVisible();
      await chooseFile(page, await pngFile("huge.png", 5000, 10));
      await expect(
        toast(
          page,
          formatMessage(t.common.fileErrors.dimensionsTooLarge, {
            width: 4096,
            height: 4096,
          }),
        ),
      ).toBeVisible();
      await expect(downloadButton(page)).toBeDisabled();
    });

    test("an image can be dropped anywhere on the page", async ({ page }) => {
      await dropFile(page, VIEWBOX_SVG, t.common.dropToUpload);
      await expect(preview(page)).toBeVisible();
      const file = await download(page, downloadButton(page));
      expect(file.name).toBe("favicon.ico");
      expect(readIco(file.buffer).map((image) => image.size)).toEqual([16, 32]);
    });
  });
}

for (const locale of LOCALES) {
  const { t } = locale;
  const m = t.faviconGenerator;

  test.describe(`favicon generator, final review (${locale.lang})`, () => {
    test.beforeEach(async ({ page }) => {
      await open(page, toolUrl(locale, "favicon-generator"));
    });
    const preview = (page) => page.getByAltText(t.common.preview);

    test("final-review 1: an SVG with stroke-width (a Tabler icon) is loaded", async ({
      page,
    }) => {
      await chooseFile(
        page,
        svgFile(
          "icon.svg",
          '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#36c" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
        ),
      );
      await expect(preview(page)).toBeVisible();
      await expect(toast(page, m.errors.imageLoadFailed)).toHaveCount(0);
    });

    test("final-review 2: the overlay goes away after a text drag or a drag over an input", async ({
      page,
    }) => {
      const transfer = (kind) =>
        page.evaluateHandle((k) => {
          const dt = new DataTransfer();
          if (k === "file") {
            dt.items.add(new File(["x"], "a.png", { type: "image/png" }));
          } else {
            dt.setData("text/plain", "some text");
          }
          return dt;
        }, kind);
      const overlay = page.getByText(t.common.dropToUpload, { exact: true });
      const text = await transfer("text");
      const file = await transfer("file");
      await waitForDropZone(page);

      // A text drag that enters and leaves: not counted either way.
      await page.dispatchEvent("body", "dragenter", { dataTransfer: text });
      await page.dispatchEvent("body", "dragleave", { dataTransfer: text });
      // Over the slider (an input): not counted either way.
      const slider = page.getByRole("slider", { name: m.borderRadius });
      await slider.dispatchEvent("dragenter", { dataTransfer: file });
      await slider.dispatchEvent("dragleave", { dataTransfer: file });
      await expect(overlay).toBeHidden();

      // A file drag, then cancelled (it leaves): the overlay goes away.
      await page.dispatchEvent("body", "dragenter", { dataTransfer: file });
      await expect(overlay).toBeVisible();
      await overlay.dispatchEvent("dragenter", { dataTransfer: file });
      await page.dispatchEvent("body", "dragleave", { dataTransfer: file });
      await expect(overlay).toBeVisible();
      await overlay.dispatchEvent("dragleave", { dataTransfer: file });
      await expect(overlay).toBeHidden();

      // More leaves than enters do not keep it from going away next time.
      await page.dispatchEvent("body", "dragleave", { dataTransfer: file });
      await page.dispatchEvent("body", "dragenter", { dataTransfer: file });
      await expect(overlay).toBeVisible();
      await page.dispatchEvent("body", "dragleave", { dataTransfer: file });
      await expect(overlay).toBeHidden();
    });

    test("final-review 3: a preview that ends after a newer one is dropped, and its URL revoked", async ({
      page,
    }) => {
      // Each toBlob waits the next delay of window.__toBlobDelays (ms).
      // createObjectURL and revokeObjectURL are recorded.
      await page.evaluate(() => {
        window.__toBlobDelays = [];
        const toBlob = HTMLCanvasElement.prototype.toBlob;
        HTMLCanvasElement.prototype.toBlob = function (...args) {
          const delay = window.__toBlobDelays.shift() ?? 0;
          setTimeout(() => toBlob.apply(this, args), delay);
        };
        window.__created = [];
        window.__revoked = [];
        const create = URL.createObjectURL;
        const revoke = URL.revokeObjectURL;
        URL.createObjectURL = (blob) => {
          const url = create(blob);
          window.__created.push(url);
          return url;
        };
        URL.revokeObjectURL = (url) => {
          window.__revoked.push(url);
          revoke(url);
        };
      });
      await chooseFile(page, await pngFile("logo.png", 300, 200));
      await expect(preview(page)).toBeVisible();

      // The preview for 50% ends after the one for 100%.
      await page.evaluate(() => {
        window.__toBlobDelays = [800, 0];
      });
      const slider = page.getByRole("slider", { name: m.borderRadius });
      await setRange(slider, 50);
      await setRange(slider, 100);
      await page.waitForTimeout(1500);

      const src = await preview(page).getAttribute("src");
      const { created, revoked } = await page.evaluate(() => ({
        created: window.__created,
        revoked: window.__revoked,
      }));
      // The shown preview is the newest settings' (the older one ended
      // later and was dropped), and every other URL is revoked.
      expect(created).toContain(src);
      expect(revoked).not.toContain(src);
      expect(created.filter((url) => !revoked.includes(url))).toEqual([src]);
    });

    test("final-review 10: toasts are in live regions, errors in an alert", async ({
      page,
    }) => {
      await chooseFile(page, {
        name: "notes.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("hello"),
      });
      const alert = page.getByRole("alert");
      await expect(alert).toHaveAttribute("aria-live", "assertive");
      await expect(
        alert.getByText(t.common.fileErrors.selectImage, { exact: true }),
      ).toBeVisible();
      const status = page.getByRole("status");
      await expect(status).toHaveAttribute("aria-live", "polite");
      // The close button is named in the page's language.
      await alert.getByRole("button", { name: t.common.close }).click();
      await expect(
        alert.getByText(t.common.fileErrors.selectImage, { exact: true }),
      ).toHaveCount(0);
    });
  });
}

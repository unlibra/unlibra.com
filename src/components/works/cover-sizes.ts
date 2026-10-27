// The `sizes` of a photo shown with object-cover in a 4:3 frame. The photo is
// as tall as the frame, so a photo wider than 4:3 is drawn wider than the
// frame, by its aspect ratio over 4:3 (16:9: 1.33 times). `sizes` names the
// width the photo is drawn at, so the browser picks a file large enough not
// to be scaled up.

/** A frame's width for a media condition (null: the last, default entry). */
export type FrameWidth = [
  media: string | null,
  width: number,
  unit: "px" | "vw",
];

/** The photo frames' aspect ratio (`aspect-4/3`). */
const FRAME_RATIO = 4 / 3;

export const coverSizes = (
  image: { width: number; height: number },
  frames: readonly FrameWidth[],
): string => {
  const scale = Math.max(1, image.width / image.height / FRAME_RATIO);
  return frames
    .map(([media, width, unit]) => {
      const drawn = `${Math.ceil(width * scale)}${unit}`;
      return media ? `${media} ${drawn}` : drawn;
    })
    .join(", ");
};

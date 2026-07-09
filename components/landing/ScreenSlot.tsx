import Image from "next/image";
import type { ReactNode } from "react";

type SlotImage = { src: string; alt: string; width: number; height: number };

/**
 * Seam untuk layar di dalam device frame. Sekarang merender stand-in mini-UI
 * (children). Fase demo mengganti dengan screenshot e2e asli lewat prop
 * `image` (next/image, bukan iframe) tanpa mengubah bezel di sekitarnya.
 * ponytail: cukup image-or-children; penataan fit khusus diserahkan ke fase
 * demo saat screenshot nyata tersedia.
 */
export function ScreenSlot({
  image,
  children,
}: {
  image?: SlotImage;
  children: ReactNode;
}) {
  if (image) {
    return (
      <Image
        src={image.src}
        alt={image.alt}
        width={image.width}
        height={image.height}
        style={{ display: "block", width: "100%", height: "auto" }}
      />
    );
  }
  return <>{children}</>;
}

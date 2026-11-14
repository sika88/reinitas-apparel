"use client";

import Image from "next/image";
import { useState } from "react";

export default function Gallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const current = images[index] ?? images[0];

  if (!current) {
    return (
      <div className="flex aspect-[4/5] items-center justify-center rounded-2xl bg-cream font-display text-9xl text-accent/25">
        {name.charAt(0)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-cream">
        <Image
          key={current}
          src={current}
          alt={`${name}, photo ${index + 1} of ${images.length}`}
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
        />
      </div>
      {images.length > 1 && (
        <ul className="grid grid-cols-5 gap-2.5" aria-label="Product photos">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={`relative block aspect-square w-full overflow-hidden rounded-lg border-2 transition ${
                  i === index ? "border-accent" : "border-transparent hover:border-border"
                }`}
              >
                <Image src={src} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

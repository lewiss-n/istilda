"use client";

import { useState } from "react";
import { imageUrl } from "@/lib/img";
import { CategoryIcon } from "./CategoryIcon";

export function Gallery({ images, name, category, toneBg, toneFg }: { images: string[]; name: string; category: string; toneBg: string; toneFg: string }) {
  const [active, setActive] = useState(0);
  if (!images.length) {
    return (
      <div className={`grid aspect-square place-items-center rounded-[28px] ${toneBg} ${toneFg}`}>
        <CategoryIcon slug={category} className="h-1/3 w-1/3" strokeWidth={1} />
      </div>
    );
  }
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row lg:sticky lg:top-24 lg:self-start">
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto sm:w-20 sm:flex-col">
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === active}
              className={`h-20 w-20 shrink-0 overflow-hidden rounded-[12px] border-2 bg-alt transition ${i === active ? "border-g9" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              <img src={imageUrl(img, "sm")} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative aspect-square flex-1 overflow-hidden rounded-[28px] bg-alt">
        <img key={images[active]} src={imageUrl(images[active])} alt={name} className="h-full w-full animate-[rise_.35s_ease-out] object-cover" />
        {images.length > 1 && (
          <span className="absolute right-4 bottom-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-g9">
            {active + 1} / {images.length}
          </span>
        )}
      </div>
    </div>
  );
}

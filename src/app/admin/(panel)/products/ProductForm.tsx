"use client";

import { useActionState, useRef, useState } from "react";
import type { Product } from "@/lib/products";
import { CATEGORIES } from "@/lib/categories";
import { imageUrl } from "@/lib/img";
import { saveProductAction } from "../../actions";
import { useSubmit } from "@/components/useSubmit";
import { shrinkImage } from "@/components/shrinkImage";

type Upload = { id: string; filename?: string; preview?: string; error?: string; name: string };

export function ProductForm({ product }: { product?: Product }) {
  const [state, action, pending] = useActionState(saveProductAction, undefined);
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [optionValues, setOptionValues] = useState(product?.option_values ?? "");
  const fileRef = useRef<HTMLInputElement>(null);
  const onSubmit = useSubmit(action);
  const fe = state?.fieldErrors ?? {};
  const uploading = uploads.some((u) => !u.filename && !u.error);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    for (const file of list) {
      const id = Math.random().toString(36).slice(2);
      const preview = URL.createObjectURL(file);
      setUploads((u) => [...u, { id, preview, name: file.name }]);
      try {
        const body = new FormData();
        body.append("file", await shrinkImage(file));
        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json().catch(() => ({}));
        if (res.status === 413) throw new Error("This photo is too large. Try a smaller one (under 4 MB).");
        if (!res.ok) throw new Error(data.error || "Upload failed.");
        setImages((imgs) => [...imgs, data.filename]);
        setUploads((u) => u.filter((x) => x.id !== id));
        URL.revokeObjectURL(preview);
      } catch (e) {
        setUploads((u) => u.map((x) => (x.id === id ? { ...x, error: e instanceof Error ? e.message : "Upload failed." } : x)));
      }
    }
  }

  const move = (i: number, dir: -1 | 1) =>
    setImages((imgs) => {
      const j = i + dir;
      if (j < 0 || j >= imgs.length) return imgs;
      const next = [...imgs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const makeCover = (i: number) => setImages((imgs) => [imgs[i], ...imgs.filter((_, k) => k !== i)]);

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="images" value={JSON.stringify(images)} />

      <div className="space-y-6">
        <section className="rounded-[20px] bg-white p-5 ring-1 ring-line/70 sm:p-6">
          <h2 className="font-display text-lg font-extrabold text-g9">Details</h2>
          <div className="mt-4 space-y-4">
            <div>
              <label htmlFor="name" className="label">Product name</label>
              <input id="name" name="name" defaultValue={product?.name} required className="field" placeholder="e.g. Brazilian body wave bundle, 3 pcs" />
              {fe.name && <p className="mt-1 text-sm text-danger">{fe.name}</p>}
            </div>
            <div>
              <label htmlFor="category" className="label">Category</label>
              <select id="category" name="category" defaultValue={product?.category ?? ""} required className="field">
                <option value="" disabled>Choose a category</option>
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>{c.name}</option>
                ))}
              </select>
              {fe.category && <p className="mt-1 text-sm text-danger">{fe.category}</p>}
            </div>
            <div>
              <label htmlFor="description" className="label">Description</label>
              <textarea
                id="description"
                name="description"
                defaultValue={product?.description}
                rows={7}
                className="field"
                placeholder={"What is it, what's it made of, sizes, what's in the box…\nLine breaks are kept."}
              />
            </div>
          </div>
        </section>

        <section className="rounded-[20px] bg-white p-5 ring-1 ring-line/70 sm:p-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="font-display text-lg font-extrabold text-g9">Photos</h2>
            <span className="text-sm text-muted">The first photo is the cover. Up to 12.</span>
          </div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              handleFiles(e.dataTransfer.files);
            }}
            className={`mt-4 rounded-[16px] border-2 border-dashed p-4 transition ${dragOver ? "border-g7 bg-mint" : "border-line"}`}
          >
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {images.map((f, i) => (
                <div key={f} className="group relative aspect-square overflow-hidden rounded-[12px] bg-alt ring-1 ring-line">
                  <img src={imageUrl(f, "sm")} alt="" className="h-full w-full object-cover" />
                  {i === 0 && <span className="badge absolute top-1.5 left-1.5 bg-lime text-g9">Cover</span>}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-g9/85 p-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                    <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="grid h-8 w-8 place-items-center rounded-md text-white hover:bg-g7 disabled:opacity-30" aria-label="Move left">←</button>
                    {i !== 0 && (
                      <button type="button" onClick={() => makeCover(i)} className="rounded-md px-1.5 text-[11px] font-bold text-lime hover:bg-g7">Cover</button>
                    )}
                    <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="grid h-8 w-8 place-items-center rounded-md text-white hover:bg-g7 disabled:opacity-30" aria-label="Move right">→</button>
                    <button type="button" onClick={() => setImages((imgs) => imgs.filter((x) => x !== f))} className="grid h-8 w-8 place-items-center rounded-md text-white hover:bg-danger" aria-label="Remove photo">✕</button>
                  </div>
                </div>
              ))}
              {uploads.map((u) => (
                <div key={u.id} className="relative aspect-square overflow-hidden rounded-[12px] bg-alt ring-1 ring-line">
                  {u.preview && <img src={u.preview} alt="" className={`h-full w-full object-cover ${u.error ? "opacity-30" : "opacity-50"}`} />}
                  <div className="absolute inset-0 grid place-items-center p-2 text-center text-xs font-semibold">
                    {u.error ? (
                      <span className="text-danger">
                        {u.error}
                        <button type="button" className="mt-1 block w-full underline" onClick={() => setUploads((x) => x.filter((y) => y.id !== u.id))}>Dismiss</button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 rounded-full bg-white px-2.5 py-1 text-g9">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-g9 border-t-transparent" /> Uploading
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {images.length + uploads.length < 12 && (
                <button type="button" onClick={() => fileRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-[12px] bg-mint text-g9 hover:bg-lime">
                  <span className="text-3xl leading-none font-light">+</span>
                  <span className="text-xs font-bold">Add photos</span>
                </button>
              )}
            </div>
            <p className="mt-3 text-center text-[13px] text-muted">Drag photos here or tap “Add photos”. JPG, PNG or WebP, up to 12 MB each. Photos are resized automatically.</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(e) => {
                if (e.target.files) handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="rounded-[20px] bg-white p-5 ring-1 ring-line/70 sm:p-6">
          <h2 className="font-display text-lg font-extrabold text-g9">Price</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="price" className="label">Price (KSh)</label>
              <input id="price" name="price" inputMode="numeric" defaultValue={product?.price} required className="field" placeholder="4500" />
              {fe.price && <p className="mt-1 text-sm text-danger">{fe.price}</p>}
            </div>
            <div>
              <label htmlFor="compare_price" className="label">Was (KSh)</label>
              <input id="compare_price" name="compare_price" inputMode="numeric" defaultValue={product?.compare_price ?? ""} className="field" placeholder="Optional" />
              {fe.compare_price && <p className="mt-1 text-sm text-danger">{fe.compare_price}</p>}
            </div>
          </div>
          <p className="mt-2 text-[13px] text-muted">Fill in “Was” to show a sale price with the old price crossed out.</p>
        </section>

        <section className="rounded-[20px] bg-white p-5 ring-1 ring-line/70 sm:p-6">
          <h2 className="font-display text-lg font-extrabold text-g9">Options <span className="text-sm font-normal text-muted">(optional)</span></h2>
          <p className="mt-1 text-[13px] text-muted">For sizes, colours, lengths and so on. Customers must pick one before ordering.</p>
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="option_label" className="label">Option name</label>
              <input id="option_label" name="option_label" defaultValue={product?.option_label} className="field" placeholder="Size, Colour, Length…" />
            </div>
            <div>
              <label htmlFor="option_values" className="label">Choices, separated by commas</label>
              <input id="option_values" name="option_values" value={optionValues} onChange={(e) => setOptionValues(e.target.value)} className="field" placeholder="e.g. 38, 39, 40, 41  or  12in, 14in, 16in" />
            </div>
            {optionValues.split(",").filter((s) => s.trim()).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {optionValues.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                  <span key={s} className="rounded-[8px] border-[1.5px] border-line px-2.5 py-1 text-sm font-semibold">{s}</span>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[20px] bg-white p-5 ring-1 ring-line/70 sm:p-6">
          <h2 className="font-display text-lg font-extrabold text-g9">Visibility</h2>
          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="in_stock" defaultChecked={product ? Boolean(product.in_stock) : true} className="mt-1 h-5 w-5 accent-g9" />
            <span><b className="block">In stock</b><span className="text-sm text-muted">Untick to show it as sold out.</span></span>
          </label>
          <label className="mt-4 flex cursor-pointer items-start gap-3">
            <input type="checkbox" name="featured" defaultChecked={Boolean(product?.featured)} className="mt-1 h-5 w-5 accent-g9" />
            <span><b className="block">Top pick</b><span className="text-sm text-muted">Show it in “Top picks” on the home page.</span></span>
          </label>
        </section>

        <div className="sticky bottom-4 rounded-[20px] bg-g9 p-4 shadow-xl">
          {state?.error && <p className="mb-3 rounded-[10px] bg-white px-3 py-2 text-sm font-semibold text-danger" role="alert">{state.error}</p>}
          <button className="btn-lime h-12 w-full text-base" disabled={pending || uploading}>
            {pending ? "Saving…" : uploading ? "Waiting for photos…" : product ? "Save changes" : "Add product"}
          </button>
        </div>
      </div>
    </form>
  );
}

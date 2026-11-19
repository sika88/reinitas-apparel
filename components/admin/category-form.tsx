"use client";

import { useState, useTransition } from "react";
import { useToast } from "@/components/admin/toast";
import { createCategory } from "@/lib/actions/categories";
import type { SizeType } from "@/lib/types";

const OPTIONS: { value: SizeType; title: string; hint: string }[] = [
  { value: "none", title: "No sizes", hint: "Bags, accessories, bundles. Stock is just a number." },
  { value: "clothing", title: "Clothing sizes", hint: "XS, S, M, L, XL, XXL. Other sizes can be added per product." },
  { value: "shoe", title: "Shoe sizes", hint: "36 to 45. Other sizes can be added per product." },
];

export default function CategoryForm() {
  const toast = useToast();
  const [name, setName] = useState("");
  const [sizeType, setSizeType] = useState<SizeType>("none");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    start(async () => {
      const r = await createCategory({ name, sizeType });
      if (r.ok) {
        toast.success(`“${name.trim()}” added. It's in your shop menu now.`);
        setName("");
        setSizeType("none");
      } else toast.error(r.error);
    });
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
      <h2 className="font-display text-2xl font-medium">Add a category</h2>
      <p className="mt-1 text-sm text-muted">A new category appears in the shop menu straight away. You can hide it until you have products.</p>

      <label className="mt-5 block max-w-sm">
        <span className="mb-1.5 block text-sm font-medium">Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={40} placeholder="e.g. Jewellery" className="field" />
      </label>

      <fieldset className="mt-5">
        <legend className="mb-2 text-sm font-medium">Do these products come in sizes?</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {OPTIONS.map((o) => (
            <label
              key={o.value}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${sizeType === o.value ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"}`}
            >
              <input type="radio" name="size-type" checked={sizeType === o.value} onChange={() => setSizeType(o.value)} className="mt-1 h-4 w-4 accent-[var(--accent)]" />
              <span className="text-sm">
                <span className="block font-medium">{o.title}</span>
                <span className="text-muted">{o.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <button type="submit" disabled={pending} className="btn-primary mt-6">
        {pending ? "Adding…" : "Add category"}
      </button>
    </form>
  );
}

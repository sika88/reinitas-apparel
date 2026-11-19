"use client";

import { useId, useState, useTransition } from "react";
import { useToast } from "@/components/admin/toast";
import { renameCategory } from "@/lib/actions/categories";

export default function RenameCategory({ id, name }: { id: string; name: string }) {
  const toast = useToast();
  const inputId = useId();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [pending, start] = useTransition();

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => {
          setValue(name);
          setEditing(true);
        }}
        className="text-sm text-accent underline underline-offset-4"
      >
        Rename<span className="sr-only"> {name}</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await renameCategory(id, value);
          if (r.ok) {
            toast.success("Category renamed");
            setEditing(false);
          } else toast.error(r.error);
        });
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <label htmlFor={inputId} className="sr-only">
        New name for {name}
      </label>
      <input id={inputId} value={value} onChange={(e) => setValue(e.target.value)} required minLength={2} maxLength={40} autoFocus className="field max-w-48 py-2" />
      <button type="submit" disabled={pending} className="inline-flex min-h-10 items-center rounded-full bg-accent px-5 text-sm font-medium text-white transition hover:bg-accent-dark disabled:opacity-50">
        {pending ? "Saving…" : "Save"}
      </button>
      <button type="button" onClick={() => setEditing(false)} className="text-sm text-muted underline underline-offset-4">
        Cancel
      </button>
    </form>
  );
}

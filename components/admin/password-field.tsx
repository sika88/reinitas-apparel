"use client";

import { useId, useState } from "react";

export default function PasswordField() {
  const id = useId();
  const [show, setShow] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium">
        Password
      </label>
      <div className="relative">
        <input
          id={id}
          name="password"
          type={show ? "text" : "password"}
          required
          autoComplete="current-password"
          className="field pr-16"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-pressed={show}
          className="absolute inset-y-0 right-0 px-4 text-xs text-muted transition hover:text-foreground"
        >
          {show ? "Hide" : "Show"}
          <span className="sr-only"> password</span>
        </button>
      </div>
    </div>
  );
}

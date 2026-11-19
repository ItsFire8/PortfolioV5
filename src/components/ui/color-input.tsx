"use client";

import { useEffect, useId, useState } from "react";
import { Label } from "./input";

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const id = useId();
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2 rounded-ui border border-border-strong bg-surface-2 p-1 pr-2 focus-within:border-primary">
        <input
          type="color"
          aria-label={label}
          value={HEX.test(value) && value.length === 7 ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="size-7 shrink-0 cursor-pointer rounded-[6px] border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-[6px] [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
        />
        <input
          id={id}
          value={text}
          spellCheck={false}
          onChange={(e) => {
            setText(e.target.value);
            if (HEX.test(e.target.value)) onChange(e.target.value.toLowerCase());
          }}
          onBlur={() => setText(value)}
          className="w-full min-w-0 bg-transparent font-mono text-xs uppercase text-fg outline-none"
        />
      </div>
    </div>
  );
}

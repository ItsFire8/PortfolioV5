import type { Modifier } from "@dnd-kit/core";

/** Same as @dnd-kit/modifiers' restrictToVerticalAxis – inlined to avoid an extra dependency. */
export const restrictToVerticalAxis: Modifier = ({ transform }) => ({ ...transform, x: 0 });

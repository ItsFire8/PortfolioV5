"use client";

import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "./modifiers";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { ReactNode } from "react";

function Row({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Translate.toString(transform), transition }} className={`flex items-center gap-1 rounded-ui border border-border bg-surface-2 ${isDragging ? "relative z-10 shadow-lg" : ""}`}>
      <button type="button" {...attributes} {...listeners} className="grid h-10 w-7 shrink-0 cursor-grab touch-none place-items-center text-subtle hover:text-fg active:cursor-grabbing" aria-label="Drag">
        <GripVertical className="size-4" />
      </button>
      {children}
    </li>
  );
}

/** Vertical drag-and-drop list (keyboard accessible). */
export function SortableList<T extends { id: string }>({ items, onReorder, render }: { items: T[]; onReorder: (from: string, to: string) => void; render: (item: T) => ReactNode }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const onEnd = (e: DragEndEvent) => e.over && e.active.id !== e.over.id && onReorder(String(e.active.id), String(e.over.id));
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onEnd} modifiers={[restrictToVerticalAxis]}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-1.5">
          {items.map((it) => (
            <Row key={it.id} id={it.id}>
              {render(it)}
            </Row>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

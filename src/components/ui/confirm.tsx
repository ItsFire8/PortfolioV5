"use client";

import { create } from "zustand";
import { Button } from "./button";
import { Dialog } from "./dialog";

interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger: boolean;
  resolve?: (v: boolean) => void;
}

const useConfirm = create<ConfirmState>(() => ({ open: false, title: "", message: "", confirmLabel: "OK", cancelLabel: "Cancel", danger: false }));

/** Promise-based confirmation dialog (accessible replacement for window.confirm). */
export function confirmDialog(opts: { title: string; message?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean }): Promise<boolean> {
  return new Promise((resolve) =>
    useConfirm.setState({
      open: true,
      title: opts.title,
      message: opts.message ?? "",
      confirmLabel: opts.confirmLabel ?? "OK",
      cancelLabel: opts.cancelLabel ?? "Cancel",
      danger: !!opts.danger,
      resolve,
    }),
  );
}

export function ConfirmHost() {
  const s = useConfirm();
  const done = (v: boolean) => {
    s.resolve?.(v);
    useConfirm.setState({ open: false, resolve: undefined });
  };
  return (
    <Dialog
      open={s.open}
      onClose={() => done(false)}
      title={s.title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => done(false)}>
            {s.cancelLabel}
          </Button>
          <Button variant={s.danger ? "danger" : "primary"} onClick={() => done(true)} data-autofocus>
            {s.confirmLabel}
          </Button>
        </>
      }
    >
      {s.message && <p className="text-sm text-muted">{s.message}</p>}
    </Dialog>
  );
}

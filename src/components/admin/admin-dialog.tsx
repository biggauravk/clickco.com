import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type DialogOptions = {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  input?: { label: string; defaultValue?: string; type?: "text" | "number" };
};

type DialogState = DialogOptions & {
  resolve: (value: boolean | string | null) => void;
};

let openDialog: ((options: DialogOptions) => Promise<boolean>) | null = null;
let openPrompt: ((options: DialogOptions) => Promise<string | null>) | null = null;

export function AdminDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [inputValue, setInputValue] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    openDialog = (options) => new Promise<boolean>((resolve) => setDialog({ ...options, resolve: (value) => resolve(value === true) }));
    openPrompt = (options) => new Promise<string | null>((resolve) => {
      setInputValue(options.input?.defaultValue ?? "");
      setDialog({ ...options, resolve: (value) => resolve(typeof value === "string" ? value : null) });
    });
    return () => {
      openDialog = null;
      openPrompt = null;
    };
  }, []);

  useEffect(() => {
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    const focusTarget = dialog.input ? inputRef.current : confirmRef.current;
    focusTarget?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        finish(dialog.input ? null : false);
      }
      if (event.key === "Enter" && dialog.input && event.target === inputRef.current) {
        event.preventDefault();
        finish((event.target as HTMLInputElement).value);
        return;
      }
      if (event.key === "Tab") {
        const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>("button, input, [href], select, textarea, [tabindex]:not([tabindex='-1'])") ?? []).filter((element) => !element.hasAttribute("disabled"));
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previous?.focus();
    };
  }, [dialog]);

  function finish(value: boolean | string | null) {
    if (!dialog) return;
    dialog.resolve(value);
    setDialog(null);
  }

  const isAlert = !dialog?.cancelLabel && !dialog?.input;

  return <>
    {children}
    {dialog ? <div className="fixed inset-0 z-[100] grid min-h-dvh place-items-center bg-black/45 p-3 sm:p-4" role="presentation">
      <div ref={dialogRef} className="max-h-[calc(100dvh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-background p-5 text-left shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6" role="alertdialog" aria-modal="true" aria-labelledby="admin-dialog-title" aria-describedby="admin-dialog-description">
        <h2 id="admin-dialog-title" className="break-words text-lg font-semibold tracking-tight sm:text-xl">{dialog.title}</h2>
        <p id="admin-dialog-description" className="mt-3 break-words text-sm leading-relaxed text-muted-foreground">{dialog.description}</p>
        {dialog.input ? <label className="mt-5 block space-y-2 text-sm font-medium"><span>{dialog.input.label}</span><input ref={inputRef} type={dialog.input.type ?? "text"} value={inputValue} onChange={(event) => setInputValue(event.target.value)} className="h-11 w-full rounded-lg bg-foreground/5 px-3.5 text-sm text-foreground ring-1 ring-ring/60 outline-none focus-visible:ring-2 focus-visible:ring-ring" /></label> : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {!isAlert ? <Button ref={closeRef} type="button" variant="secondary" onClick={() => finish(dialog.input ? null : false)}>{dialog.cancelLabel ?? "Cancel"}</Button> : null}
          <Button ref={confirmRef} type="button" variant={dialog.destructive ? "danger" : "primary"} onClick={() => finish(dialog.input ? inputValue : true)}>{dialog.confirmLabel ?? (isAlert ? "Done" : "OK")}</Button>
        </div>
      </div>
    </div> : null}
  </>;
}

export function useAdminDialog() {
  return {
    alert: async (options: Omit<DialogOptions, "cancelLabel" | "destructive" | "input">) => { await openDialog?.(options); },
    confirm: (options: DialogOptions) => openDialog?.(options) ?? Promise.resolve(false),
    prompt: (options: DialogOptions & { input: NonNullable<DialogOptions["input"]> }) => openPrompt?.(options) ?? Promise.resolve(null),
  };
}

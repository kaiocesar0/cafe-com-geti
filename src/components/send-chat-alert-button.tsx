"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { previewItemChatAlert, sendItemChatAlert } from "@/actions/items";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const warningButton =
  "border-amber-300 bg-amber-50 text-amber-950 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-50 dark:hover:bg-amber-950/60";

export function SendChatAlertButton({
  itemId,
  itemName,
}: {
  itemId: string;
  itemName: string;
}) {
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<{
    message: string;
    environment: string;
  } | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function openDialog() {
    setPreview(null);
    setPreviewError(null);
    setOpen(true);
    startTransition(async () => {
      const result = await previewItemChatAlert(itemId);
      if (result.error || !result.message || !result.environment) {
        setPreviewError(result.error ?? "Não foi possível montar o aviso");
        return;
      }
      setPreview({
        message: result.message,
        environment: result.environment,
      });
    });
  }

  function confirmSend() {
    startTransition(async () => {
      const result = await sendItemChatAlert(itemId);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setOpen(false);
      toast.success(`Aviso de ${itemName} enviado ao chat`);
    });
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={warningButton}
        onClick={openDialog}
      >
        ⚠️ Avisar no chat
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>⚠️ Confirmar aviso no chat</DialogTitle>
            <DialogDescription>
              Nada é enviado até você confirmar neste diálogo.
            </DialogDescription>
          </DialogHeader>
          {previewError ? (
            <p className="text-sm text-destructive">{previewError}</p>
          ) : preview ? (
            <div className="space-y-3">
              <p className="text-sm">
                Ambiente:{" "}
                <span className="font-semibold">{preview.environment}</span>
              </p>
              <pre className="whitespace-pre-wrap rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-50">
                {preview.message}
              </pre>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Montando o aviso…</p>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="outline"
              className={warningButton}
              disabled={pending || !preview}
              onClick={confirmSend}
            >
              ⚠️ Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

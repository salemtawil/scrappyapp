"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ShareCompetitionDialog({ roomCode, url }: { roomCode: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  async function share() {
    if (typeof navigator.share !== "function") return copy();
    try {
      await navigator.share({ title: "Sala en vivo", url });
    } catch {
      // El usuario canceló la hoja de compartir: no es un error que deba mostrarse.
    }
  }

  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="mx-auto rounded-lg bg-white p-2 sm:mx-0">
          <QRCodeSVG size={112} value={url} title={`Código QR de la sala ${roomCode}`} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Sala pública</p>
          <p className="tabular mt-1 text-2xl font-bold tracking-widest text-brand-strong">{roomCode}</p>
          <p className="mt-1 break-all text-xs text-muted-foreground">{url}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button onClick={share} variant="secondary">
              <Share2 size={16} />
              Compartir
            </Button>
            <Button onClick={copy} variant="secondary">
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copiado" : "Copiar enlace"}
            </Button>
          </div>
          <p aria-live="polite" className="sr-only">
            {copied ? "Enlace copiado al portapapeles" : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

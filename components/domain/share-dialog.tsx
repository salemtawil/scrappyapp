"use client";

import { QRCodeSVG } from "qrcode.react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareCompetitionDialog({ url }: { url: string }) {
  return (
    <div className="rounded-lg border border-emerald-950/10 bg-white p-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="mx-auto sm:mx-0">
          <QRCodeSVG value={url} size={112} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Enlace publico</p>
          <p className="break-all text-sm text-slate-600">{url}</p>
          <Button
            className="mt-3 w-full sm:w-auto"
            variant="secondary"
            type="button"
            onClick={() => navigator.share?.({ url }).catch(() => navigator.clipboard.writeText(url))}
          >
            <Share2 size={16} />
            Compartir
          </Button>
        </div>
      </div>
    </div>
  );
}

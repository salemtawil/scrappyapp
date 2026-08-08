"use client";

import { QRCodeSVG } from "qrcode.react";
import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ShareCompetitionDialog({ url }: { url: string }) {
  return (
    <div className="rounded-lg border border-emerald-950/10 bg-white p-4">
      <div className="flex items-center gap-4">
        <QRCodeSVG value={url} size={96} />
        <div className="min-w-0">
          <p className="text-sm font-semibold">Enlace publico</p>
          <p className="truncate text-sm text-slate-600">{url}</p>
          <Button
            className="mt-3"
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

"use client";

import { Children, useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface RoundTab {
  hint?: string;
  id: string;
  label: string;
  tone?: "pending" | "done";
}

/**
 * Navegación por rondas. En pista casi siempre interesa una sola ronda,
 * así que se abre por defecto en la ronda activa y el resto queda a un toque.
 */
export function RoundTabs({
  children,
  defaultIndex = 0,
  label = "Rondas",
  tabs,
}: {
  children: ReactNode;
  defaultIndex?: number;
  label?: string;
  tabs: RoundTab[];
}) {
  const baseId = useId();
  const panels = Children.toArray(children);
  const [selected, setSelected] = useState(() =>
    Math.min(Math.max(defaultIndex, 0), Math.max(tabs.length - 1, 0)),
  );

  if (tabs.length === 0) return null;

  return (
    <div className="space-y-4">
      <div
        aria-label={label}
        className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1"
        role="tablist"
      >
        {tabs.map((tab, index) => {
          const active = index === selected;
          return (
            <button
              aria-controls={`${baseId}-panel-${index}`}
              aria-selected={active}
              className={cn(
                "min-h-11 shrink-0 snap-start rounded-lg border px-3 py-2 text-sm font-semibold",
                active
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-surface text-foreground hover:bg-surface-muted",
              )}
              id={`${baseId}-tab-${index}`}
              key={tab.id}
              onClick={() => setSelected(index)}
              role="tab"
              tabIndex={active ? 0 : -1}
              type="button"
            >
              <span className="block">{tab.label}</span>
              {tab.hint && (
                <span className={cn("block text-[11px] font-medium", active ? "text-white/85" : "text-muted-foreground")}>
                  {tab.hint}
                </span>
              )}
            </button>
          );
        })}
      </div>
      {panels.map((panel, index) => (
        <div
          aria-labelledby={`${baseId}-tab-${index}`}
          hidden={index !== selected}
          id={`${baseId}-panel-${index}`}
          key={tabs[index]?.id ?? index}
          role="tabpanel"
          tabIndex={0}
        >
          {panel}
        </div>
      ))}
    </div>
  );
}

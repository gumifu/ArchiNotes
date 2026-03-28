"use client";

import { BuildingCard } from "@/components/building-card";
import { Button } from "@/components/ui/button";
import type { Building } from "@/types/building";
import { ChevronDown, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type SheetHeight = "closed" | "peek" | "expanded";

const PEEK_HEIGHT = "40vh";
const EXPANDED_HEIGHT = "65vh";

type BuildingBottomSheetProps = {
  building: Building | null;
  onClose: () => void;
};

export function BuildingBottomSheet({
  building,
  onClose,
}: BuildingBottomSheetProps) {
  const [height, setHeight] = useState<SheetHeight>("closed");
  const [isDragging, setIsDragging] = useState(false);
  const startY = useRef(0);
  const startHeight = useRef<SheetHeight>("peek");

  const isOpen = building != null;

  useEffect(() => {
    if (isOpen) setHeight("peek");
    else setHeight("closed");
  }, [isOpen]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isOpen) return;
      setIsDragging(true);
      startY.current = e.clientY;
      startHeight.current = height;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [isOpen, height],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging || !isOpen) return;
      const dy = e.clientY - startY.current;
      if (dy > 80) {
        onClose();
        setIsDragging(false);
        return;
      }
      if (dy < -40 && startHeight.current === "peek") {
        setHeight("expanded");
      } else if (dy > 40 && startHeight.current === "expanded") {
        setHeight("peek");
      }
    },
    [isDragging, isOpen, onClose],
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const toggleExpand = useCallback(() => {
    setHeight((h) => (h === "peek" ? "expanded" : "peek"));
  }, []);

  if (!isOpen || !building) return null;

  const heightStyle =
    height === "closed"
      ? "0"
      : height === "peek"
        ? PEEK_HEIGHT
        : EXPANDED_HEIGHT;

  return (
    <>
      <div
        className="fixed inset-0 z-30 bg-black/20 transition-opacity"
        aria-hidden
        style={{ pointerEvents: height === "closed" ? "none" : "auto" }}
      />
      <div
        className="bg-background fixed right-0 left-0 z-40 flex flex-col rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.12)] transition-[height] duration-200 ease-out"
        style={{
          bottom: 0,
          height: heightStyle,
          maxHeight: "90vh",
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Building details"
      >
        <div
          className="flex shrink-0 cursor-grab touch-pan-y flex-col items-center pt-3 active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <button
            type="button"
            onClick={toggleExpand}
            className="text-muted-foreground hover:text-foreground rounded-full p-1 transition-colors"
            aria-label={height === "peek" ? "Expand" : "Collapse"}
          >
            <div className="bg-muted-foreground/30 h-1 w-10 rounded-full" />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 pb-6">
          <BuildingCard building={building} />
          <div className="mt-4 flex flex-col gap-2">
            <Button asChild size="sm" className="w-full" variant="outline">
              <Link
                href={`/buildings/${building.slug || building.id}`}
                className="flex items-center justify-center gap-2"
              >
                View Full Details
                <ExternalLink className="size-4" />
              </Link>
            </Button>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 py-2 text-sm transition-colors"
            >
              <ChevronDown className="size-4" />
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

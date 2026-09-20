"use client";
import { Fragment, useState } from "react";
import type { FloorCardId, HallwayLayout, MobileFloorCardLayout, ProjectionId } from "@/config/hallway";

function RangeField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="mb-1 flex items-center gap-2">
      <span className="w-[3.4rem] shrink-0 font-mono text-[10px] text-white/55">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="min-w-0 flex-1" />
      <input
        type="number"
        step={step}
        value={Number(value.toFixed(4))}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-[4.25rem] rounded border border-white/15 bg-black/40 px-1 py-0.5 font-mono text-[10px]"
      />
    </label>
  );
}

export function FloorAlignPanel({
  layout,
  activeId,
  onSelect,
  onPatch,
  onReset,
  onCopy,
  onClose,
  onPreview,
}: {
  layout: HallwayLayout;
  activeId: FloorCardId;
  onSelect: (id: FloorCardId) => void;
  onPatch: (id: FloorCardId, patch: Partial<MobileFloorCardLayout>) => void;
  onReset: () => void;
  onCopy: () => Promise<void>;
  onClose: () => void;
  onPreview: (id: ProjectionId | null) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [editVisual, setEditVisual] = useState(false);
  const card = layout.mobileFloorCards[activeId];
  const copy = async () => {
    await onCopy();
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  const matchVisual = () => onPatch(activeId, { hitX: card.x, hitY: card.y, hitWidth: card.width, hitHeight: card.height });
  const field = (label: string, key: keyof MobileFloorCardLayout, min: number, max: number, step: number) => (
    <RangeField label={label} value={card[key]} min={min} max={max} step={step} onChange={(v) => onPatch(activeId, { [key]: v })} />
  );

  return (
    <div className="absolute top-14 left-3 right-3 z-[55] max-h-[min(52vh,28rem)] overflow-auto rounded-xl border border-[#2563eb]/50 bg-black/92 p-3 text-xs text-white shadow-2xl backdrop-blur-md md:top-16 md:right-auto md:left-4 md:w-[380px]">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="tracking-[0.18em] text-[#2563eb] uppercase">Floor hit area</span>
        <button type="button" className="rounded border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wider" onClick={onClose}>
          Close
        </button>
      </div>
      <p className="mb-2 text-[10px] text-white/50">
        Champagne / teal outline = pressable zone only. Drag it or use arrows. Visual card stays put unless you open Visual.
      </p>
      <div className="mb-2 flex flex-wrap gap-1">
        {(["offer", "how"] as FloorCardId[]).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              onSelect(id);
              onPreview(null);
            }}
            className={`rounded border px-2 py-0.5 text-[10px] uppercase tracking-wider ${activeId === id ? "border-[#2563eb] text-[#2563eb]" : "border-white/15 text-white/55"}`}
          >
            {id === "offer" ? "Place your offer" : "How it works"}
          </button>
        ))}
      </div>
      <p className="mb-1 text-[9px] tracking-[0.16em] text-[#2563eb]/80 uppercase">Pressable hit box</p>
      {field("hitX", "hitX", 0, 1, 0.001)}
      {field("hitY", "hitY", 0, 1, 0.001)}
      {field("hitW", "hitWidth", 0.05, 0.9, 0.001)}
      {field("hitH", "hitHeight", 0.04, 0.5, 0.001)}
      <div className="mt-2 mb-2 flex flex-wrap gap-2">
        <button type="button" onClick={matchVisual} className="rounded border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/70">
          Match visual
        </button>
        <button type="button" onClick={() => setEditVisual((v) => !v)} className="rounded border border-white/20 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/70">
          {editVisual ? "Hide visual" : "Edit visual"}
        </button>
      </div>
      {editVisual && (
        <Fragment>
          <p className="mb-1 text-[9px] tracking-[0.16em] text-white/35 uppercase">Visual card (label only)</p>
          {field("x", "x", 0, 1, 0.001)}
          {field("y", "y", 0, 1, 0.001)}
          {field("width", "width", 0.08, 0.9, 0.001)}
          {field("height", "height", 0.04, 0.35, 0.001)}
          {field("persp", "perspective", 200, 2000, 10)}
          {field("rotX", "rotateX", -80, 80, 0.5)}
          {field("rotY", "rotateY", -60, 60, 0.5)}
          {field("rotZ", "rotateZ", -45, 45, 0.5)}
        </Fragment>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={() => void copy()} className="rounded border border-[#2563eb]/60 px-2 py-1 text-[10px] uppercase tracking-wider text-[#2563eb]">
          {copied ? "Copied" : "Copy config"}
        </button>
        <button type="button" onClick={onReset} className="rounded border border-white/20 px-2 py-1 text-[10px] uppercase tracking-wider text-white/60">
          Reset
        </button>
      </div>
    </div>
  );
}

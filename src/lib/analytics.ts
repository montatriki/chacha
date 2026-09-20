type TrackFn = (event: string, props?: Record<string, unknown>) => void;

let tracker: TrackFn | null = null;

export function setTracker(fn: TrackFn | null) {
  tracker = fn;
}

/** Analytics hook point. The original site ships with no tracker attached, so this is a no-op by default. */
export function track(event: string, props?: Record<string, unknown>) {
  try {
    tracker?.(event, props);
  } catch {
    /* ignore */
  }
}

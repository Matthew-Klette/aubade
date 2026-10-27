"use client";

import { useSyncExternalStore } from "react";
import { hourFromDate, msUntilNextMinute, sampleDay, type DaySample } from "@/lib/daylight";

export type DaylightNow = {
  readonly sample: DaySample;
  /** City from the visitor's time zone ("Africa/Johannesburg" → "Johannesburg"). No geolocation prompt. */
  readonly city: string;
};

let cachedKey = "";
let cachedValue: DaylightNow | null = null;

function cityFromTimeZone(): string {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
  const city = zone.split("/").pop()?.replace(/_/g, " ");
  return city && city !== "UTC" ? city : "your window";
}

function getSnapshot(): DaylightNow {
  const now = new Date();
  const key = `${now.getHours()}:${now.getMinutes()}`;
  if (key !== cachedKey || !cachedValue) {
    cachedKey = key;
    cachedValue = { sample: sampleDay(hourFromDate(now)), city: cityFromTimeZone() };
  }
  return cachedValue;
}

// One timer for every clock on the page, fired on the minute, so the header and the hero never disagree.
const listeners = new Set<() => void>();
let timer: number | undefined;

function scheduleTick() {
  timer = window.setTimeout(() => {
    listeners.forEach((listener) => listener());
    scheduleTick();
  }, msUntilNextMinute(Date.now()));
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  if (listeners.size === 1) scheduleTick();
  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) window.clearTimeout(timer);
  };
}

/** Live daylight sample for the visitor's local time; null during server render. */
export function useDaylightNow(): DaylightNow | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

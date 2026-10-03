"use client";

import { useSyncExternalStore } from "react";
import { hourFromDate, sampleDay, type DaySample } from "@/lib/daylight";

export type DaylightNow = {
  readonly sample: DaySample;
  /** City from the visitor's time zone ("Africa/Johannesburg" → "Johannesburg"). No geolocation prompt. */
  readonly city: string;
};

const TICK_MS = 20_000;

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

function subscribe(onChange: () => void) {
  const id = window.setInterval(onChange, TICK_MS);
  return () => window.clearInterval(id);
}

/** Live daylight sample for the visitor's local time; null during server render. */
export function useDaylightNow(): DaylightNow | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

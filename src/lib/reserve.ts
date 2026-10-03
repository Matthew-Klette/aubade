import { EDITION_SIZE } from "./catalog";

/** Reservation form validation. Pure, so the dialog and tests share one source of truth. */

export type ReservationInput = {
  readonly name: string;
  readonly email: string;
  readonly country: string;
};

export type ReservationErrors = Partial<Record<keyof ReservationInput, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_NAME_LENGTH = 80;

export const COUNTRIES = [
  "United States",
  "United Kingdom",
  "South Africa",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Italy",
  "Netherlands",
  "Denmark",
  "Japan",
  "Other",
] as const;

export function validateReservation(input: ReservationInput): ReservationErrors {
  const errors: ReservationErrors = {};
  const name = input.name.trim();
  const email = input.email.trim();

  if (name.length < 2) errors.name = "Please tell us your name.";
  else if (name.length > MAX_NAME_LENGTH) errors.name = `Keep it under ${MAX_NAME_LENGTH} characters.`;

  if (!email) errors.email = "We need an email to hold your number.";
  else if (!EMAIL_PATTERN.test(email)) errors.email = "That email doesn't look right.";

  if (!(COUNTRIES as readonly string[]).includes(input.country)) errors.country = "Choose where it will live.";

  return errors;
}

export const hasErrors = (errors: ReservationErrors) => Object.keys(errors).length > 0;

/** Deterministic edition number for an email, so the same person always sees the same number. */
export function editionNumber(email: string): string {
  let hash = 2166136261;
  for (const char of email.trim().toLowerCase()) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  const number = (Math.abs(hash) % EDITION_SIZE) + 1;
  return String(number).padStart(3, "0");
}

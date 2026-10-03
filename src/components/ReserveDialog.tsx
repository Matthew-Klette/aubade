"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { describeConfiguration, EDITION_SIZE, formatPrice, RESERVATION_DEPOSIT, type Configuration } from "@/lib/catalog";
import {
  COUNTRIES,
  editionNumber,
  hasErrors,
  validateReservation,
  type ReservationErrors,
  type ReservationInput,
} from "@/lib/reserve";
import { useLenis } from "./SmoothScroll";
import { ArrowRight, Close } from "./Icons";

type Status = "idle" | "submitting" | "done";

/** Simulated round trip: this is a concept, so nothing leaves the browser. */
const SUBMIT_DELAY_MS = 1100;
const EMPTY: ReservationInput = { name: "", email: "", country: "" };
const FIELD_ORDER: readonly (keyof ReservationInput)[] = ["name", "email", "country"];

type ReserveDialogProps = {
  readonly open: boolean;
  readonly onClose: () => void;
  readonly config: Configuration;
  readonly price: number;
};

export function ReserveDialog({ open, onClose, config, price }: ReserveDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const successTitleRef = useRef<HTMLHeadingElement>(null);
  const lenis = useLenis();
  const [values, setValues] = useState<ReservationInput>(EMPTY);
  const [errors, setErrors] = useState<ReservationErrors>({});
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  // Separate from showModal so a Lenis instance that arrives late is still paused.
  useEffect(() => {
    if (open) lenis?.stop();
  }, [open, lenis]);

  // Move focus to the confirmation so it is read out and keyboard users aren't stranded.
  useEffect(() => {
    if (status === "done") successTitleRef.current?.focus();
  }, [status]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const handleClose = () => {
    window.clearTimeout(timerRef.current);
    lenis?.start();
    if (status === "done") setValues(EMPTY);
    setStatus("idle");
    setErrors({});
    onClose();
  };

  const setField = (key: keyof ReservationInput, value: string) => {
    setValues((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => Object.fromEntries(Object.entries(current).filter(([k]) => k !== key)));
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validateReservation(values);
    setErrors(found);
    if (hasErrors(found)) {
      const first = FIELD_ORDER.find((key) => found[key]);
      if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setStatus("submitting");
    timerRef.current = window.setTimeout(() => setStatus("done"), SUBMIT_DELAY_MS);
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={handleClose}
      aria-labelledby="reserve-title"
      className="reserve-dialog m-auto w-[min(34rem,calc(100vw-2rem))] rounded-[1.75rem] border border-line bg-ink-2 p-0 text-paper backdrop:bg-ink/70 backdrop:backdrop-blur-md"
      data-lenis-prevent
    >
      <div className="relative p-7 sm:p-10">
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="absolute top-4 right-4 grid h-11 w-11 place-items-center rounded-full text-mist transition-colors hover:bg-paper/10 hover:text-paper"
          aria-label="Close reservation"
        >
          <Close />
        </button>

        {status === "done" ? (
          <div className="caption-in">
            <p className="eyebrow text-mist">Reserved</p>
            <h2
              ref={successTitleRef}
              id="reserve-title"
              tabIndex={-1}
              className="display mt-5 t-display-sm focus:outline-none"
            >
              No. {editionNumber(values.email)}
              <span className="text-mist"> of {EDITION_SIZE}</span>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-mist">
              Thank you, {values.name.trim().split(" ")[0]}. Your {describeConfiguration(config)} is held. We&apos;ll write to{" "}
              <span className="text-paper">{values.email.trim()}</span> before the workshop begins your piece.
            </p>
            <p className="mt-8 border-t border-line pt-5 text-sm text-mist">
              Aubade is a design concept. No payment was taken and nothing was sent.
            </p>
            <button type="button" onClick={() => dialogRef.current?.close()} className="btn-brass mt-8">
              Back to the light <ArrowRight />
            </button>
          </div>
        ) : (
          <form ref={formRef} onSubmit={submit} noValidate>
            <p className="eyebrow text-mist">Reserve · Edition One</p>
            <h2 id="reserve-title" className="display mt-5 t-display-sm">
              Hold your number.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-mist">
              {describeConfiguration(config)} · {formatPrice(price)}. A {formatPrice(RESERVATION_DEPOSIT)} deposit, refundable
              until your lamp ships.
            </p>

            <div className="mt-8 flex flex-col gap-5">
              <Field id="name" label="Name" error={errors.name}>
                <input
                  id="name"
                  name="name"
                  autoComplete="name"
                  value={values.name}
                  onChange={(e) => setField("name", e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className="field-input"
                />
              </Field>
              <Field id="email" label="Email" error={errors.email}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={(e) => setField("email", e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className="field-input"
                />
              </Field>
              <Field id="country" label="Where it will live" error={errors.country}>
                <select
                  id="country"
                  name="country"
                  autoComplete="country-name"
                  value={values.country}
                  onChange={(e) => setField("country", e.target.value)}
                  aria-invalid={Boolean(errors.country)}
                  aria-describedby={errors.country ? "country-error" : undefined}
                  className="field-input appearance-none"
                >
                  <option value="" disabled>
                    Choose a country
                  </option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <button type="submit" disabled={status === "submitting"} className="btn-brass mt-9 w-full justify-center">
              {status === "submitting" ? (
                "Holding your number…"
              ) : (
                <>
                  Reserve {formatPrice(RESERVATION_DEPOSIT)} <ArrowRight />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="eyebrow text-mist">
        {label}
      </label>
      <div className="mt-2">{children}</div>
      {error && (
        <p id={`${id}-error`} className="mt-2 text-sm text-[#f0a58a]">
          {error}
        </p>
      )}
    </div>
  );
}

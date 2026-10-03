"use client";

import { useRef, useState } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import {
  BASES,
  DEFAULT_CONFIGURATION,
  EDITION_SIZE,
  FINISHES,
  RESERVATION_DEPOSIT,
  SIZES,
  describeConfiguration,
  formatPrice,
  getSize,
  priceOf,
  type Configuration,
} from "@/lib/catalog";
import { LampCanvas } from "./LampCanvas";
import { ReserveDialog } from "./ReserveDialog";
import { ArrowRight } from "./Icons";

const PREVIEW_LIGHT = "#ffd8a6";
const PREVIEW_INTENSITY = 0.62;
const DEFAULT_PRICE = priceOf(DEFAULT_CONFIGURATION);

export function Configurator() {
  const [config, setConfig] = useState<Configuration>(DEFAULT_CONFIGURATION);
  const [dialogOpen, setDialogOpen] = useState(false);
  const priceRef = useRef<HTMLSpanElement>(null);
  const shownPrice = useRef(DEFAULT_PRICE);
  const price = priceOf(config);

  const update = <K extends keyof Configuration>(key: K, value: Configuration[K]) =>
    setConfig((current) => ({ ...current, [key]: value }));

  // Price rolls to its new value, like a mechanical counter.
  useGSAP(
    () => {
      const el = priceRef.current;
      if (!el) return;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const counter = { v: shownPrice.current };
      gsap.to(counter, {
        v: price,
        duration: reduce ? 0 : 0.9,
        ease: "expo.out",
        overwrite: true,
        onUpdate: () => {
          shownPrice.current = counter.v;
          el.textContent = formatPrice(counter.v);
        },
      });
    },
    { dependencies: [price] },
  );

  return (
    <section id="configure" aria-labelledby="configure-title" className="bg-paper text-ink">
      <div className="mx-auto grid max-w-[1600px] gap-12 px-5 py-28 sm:px-8 lg:grid-cols-12 lg:gap-16 lg:px-12 lg:py-40">
        <div className="relative h-[62svh] min-h-[28rem] overflow-hidden rounded-[2rem] bg-[radial-gradient(90%_70%_at_50%_30%,#f6f1e8_0%,#e3d9c8_60%,#d4c7b1_100%)] lg:sticky lg:top-24 lg:col-span-7 lg:h-[calc(100svh-8rem)]">
          <LampCanvas
            label={`Preview of your configuration: ${describeConfiguration(config)}.`}
            light={PREVIEW_LIGHT}
            intensity={PREVIEW_INTENSITY}
            finish={config.finish}
            base={config.base}
            size={config.size}
            halo={false}
            framing={1.42}
          />
          <p className="eyebrow absolute top-6 left-6 text-stone">Edition One · {EDITION_SIZE} pieces</p>
          <p className="eyebrow absolute bottom-6 left-6 text-stone">{getSize(config.size).dimensions}</p>
          <p className="eyebrow absolute right-6 bottom-6 hidden text-stone sm:block">Move your cursor to turn it</p>
        </div>

        <div className="lg:col-span-5 lg:py-6">
          <p className="eyebrow text-stone">04 · Configure</p>
          <h2 id="configure-title" className="display mt-6 t-section">
            Make it <em>yours.</em>
          </h2>
          <p className="mt-6 max-w-[26rem] text-base leading-relaxed text-stone">
            Each lamp is assembled to order in the workshop and numbered by hand. Choose its metal, its stone and its size.
          </p>

          <div className="mt-12 flex flex-col gap-10">
            <OptionGroup
              legend="Metal"
              name="finish"
              options={FINISHES}
              value={config.finish}
              onChange={(v) => update("finish", v)}
            />
            <OptionGroup legend="Base" name="base" options={BASES} value={config.base} onChange={(v) => update("base", v)} />
            <SizeGroup value={config.size} onChange={(v) => update("size", v)} />
          </div>

          <div className="mt-12 border-t border-line-dark pt-8">
            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div>
                <p className="eyebrow text-stone">Your Aubade</p>
                <p className="mt-2 text-base text-ink">{describeConfiguration(config)}</p>
              </div>
              <p className="display tabular t-display-sm">
                <span ref={priceRef} aria-hidden="true">
                  {formatPrice(DEFAULT_PRICE)}
                </span>
                <span className="sr-only" aria-live="polite">
                  {formatPrice(price)}
                </span>
              </p>
            </div>
            <button type="button" onClick={() => setDialogOpen(true)} className="btn-brass mt-8 w-full justify-center">
              Reserve with a {formatPrice(RESERVATION_DEPOSIT)} deposit <ArrowRight />
            </button>
            <p className="mt-4 text-center text-sm text-stone">Fully refundable until it ships · Spring 2027</p>
          </div>
        </div>
      </div>

      <ReserveDialog open={dialogOpen} onClose={() => setDialogOpen(false)} config={config} price={price} />
    </section>
  );
}

type Swatched<Id extends string> = {
  readonly id: Id;
  readonly name: string;
  readonly note: string;
  readonly swatch: string;
  readonly price: number;
};

const OPTION_CARD =
  "relative flex flex-col justify-between rounded-2xl border border-line-dark transition-colors duration-300 hover:border-ink/40 has-[:checked]:border-ink has-[:checked]:bg-paper-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brass";

const surcharge = (value: number) => (value ? `+${formatPrice(value)}` : "Included");

function OptionGroup<Id extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string;
  name: string;
  options: readonly Swatched<Id>[];
  value: Id;
  onChange: (value: Id) => void;
}) {
  const selected = options.find((o) => o.id === value);
  return (
    <fieldset>
      <div className="flex items-baseline justify-between gap-4">
        <legend className="eyebrow text-stone">{legend}</legend>
        <p className="text-right text-sm text-stone">{selected?.note}</p>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {options.map((option) => (
          <label key={option.id} className={`group min-h-[4.5rem] gap-3 p-3.5 ${OPTION_CARD}`}>
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className="h-6 w-6 rounded-full ring-1 ring-ink/15 ring-offset-2 ring-offset-paper transition-shadow group-has-[:checked]:ring-ink"
              style={{ background: option.swatch }}
            />
            <span className="text-sm leading-tight">
              {option.name}
              <span className="mt-0.5 block text-stone">{surcharge(option.price)}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function SizeGroup({ value, onChange }: { value: Configuration["size"]; onChange: (value: Configuration["size"]) => void }) {
  return (
    <fieldset>
      <legend className="eyebrow text-stone">Size</legend>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {SIZES.map((size) => (
          <label key={size.id} className={`min-h-[5.5rem] p-4 ${OPTION_CARD}`}>
            <input
              type="radio"
              name="size"
              value={size.id}
              checked={value === size.id}
              onChange={() => onChange(size.id)}
              className="sr-only"
            />
            <span className="flex items-baseline justify-between">
              <span className="display t-display-sm">{size.name}</span>
              <span className="text-sm text-stone">{surcharge(size.price)}</span>
            </span>
            <span className="text-sm text-stone">{size.dimensions}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

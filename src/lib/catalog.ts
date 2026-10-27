/** Edition One options and pricing. Prices in USD. */

export type FinishId = "brass" | "bronze" | "nickel";
export type BaseId = "travertine" | "marble" | "oak";
export type SizeId = "petite" | "grand";

type Option<Id extends string> = {
  readonly id: Id;
  readonly name: string;
  readonly note: string;
  /** Swatch colour for the picker. */
  readonly swatch: string;
  readonly price: number;
};

export const FINISHES: readonly Option<FinishId>[] = [
  { id: "brass", name: "Brushed brass", note: "Unlacquered. Darkens with your hands.", swatch: "#c9a46a", price: 0 },
  { id: "bronze", name: "Blackened bronze", note: "Hand-patinated, oiled, nearly black.", swatch: "#3b2f26", price: 240 },
  { id: "nickel", name: "Satin nickel", note: "Cool, quiet, bead-blasted.", swatch: "#c3c6c6", price: 120 },
];

export const BASES: readonly Option<BaseId>[] = [
  { id: "travertine", name: "Honed travertine", note: "Roman stone, open pores filled by hand.", swatch: "#d8cbb3", price: 0 },
  { id: "marble", name: "Nero Marquina", note: "Black marble with white veining.", swatch: "#1c1b1b", price: 320 },
  { id: "oak", name: "Smoked oak", note: "Fumed white oak, oil finish.", swatch: "#4a3527", price: 180 },
];

export const SIZES: readonly (Option<SizeId> & { readonly dimensions: string })[] = [
  { id: "petite", name: "Petite", note: "Bedside, reading chair.", dimensions: "Ø\u00a028\u00a0cm globe · H\u00a046\u00a0cm", swatch: "", price: 0 },
  { id: "grand", name: "Grand", note: "Living room, studio, desk.", dimensions: "Ø\u00a040\u00a0cm globe · H\u00a064\u00a0cm", swatch: "", price: 900 },
];

export const BASE_PRICE = 2400;
export const RESERVATION_DEPOSIT = 200;
export const EDITION_SIZE = 500;

export type Configuration = {
  readonly finish: FinishId;
  readonly base: BaseId;
  readonly size: SizeId;
};

export const DEFAULT_CONFIGURATION: Configuration = { finish: "brass", base: "travertine", size: "petite" };

function findOption<T extends { id: string }>(options: readonly T[], id: string): T {
  const option = options.find((o) => o.id === id);
  if (!option) throw new Error(`Unknown option: ${id}`);
  return option;
}

export const getFinish = (id: FinishId) => findOption(FINISHES, id);
export const getBase = (id: BaseId) => findOption(BASES, id);
export const getSize = (id: SizeId) => findOption(SIZES, id);

export function priceOf(config: Configuration): number {
  return BASE_PRICE + getFinish(config.finish).price + getBase(config.base).price + getSize(config.size).price;
}

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export function describeConfiguration(config: Configuration): string {
  return `${getSize(config.size).name} · ${getFinish(config.finish).name} · ${getBase(config.base).name}`;
}

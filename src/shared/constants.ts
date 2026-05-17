/**
 * Constants for Terminy Leczenia NFZ MCP Server
 */

export const SERVER_CONFIG = {
  NAME: "terminy-leczenia",
  VERSION: "1.0.0",
} as const;

/**
 * NFZ "Informator o Terminach Leczenia" API.
 * Public, anonymous, JSON:API format.
 * Version observed live (probe 01-version.json, 2026-05-17): 1.3.0, not deprecated.
 */
export const NFZ_API = {
  BASE_URL: "https://api.nfz.gov.pl/app-itl-api",
  TIMEOUT_MS: 10_000,
  MAX_LIMIT: 25,
} as const;

/**
 * KV cache TTLs (seconds).
 * - Dictionaries (benefits/localities/providers): NFZ updates daily, KV refreshed once per day
 * - Queue results: first-available dates drift faster than monthly snapshot — 1 h is a good balance
 */
export const KV_TTL = {
  DICTIONARY: 24 * 60 * 60,
  QUEUE: 60 * 60,
  VERSION: 24 * 60 * 60,
} as const;

/**
 * NFZ voivodeship code → human-readable name (Polish).
 * From docs/api1.md and Swagger UI (docs/api5.md).
 */
export const PROVINCE_NAMES: Record<string, string> = {
  "01": "dolnośląskie",
  "02": "kujawsko-pomorskie",
  "03": "lubelskie",
  "04": "lubuskie",
  "05": "łódzkie",
  "06": "małopolskie",
  "07": "mazowieckie",
  "08": "opolskie",
  "09": "podkarpackie",
  "10": "podlaskie",
  "11": "pomorskie",
  "12": "śląskie",
  "13": "świętokrzyskie",
  "14": "warmińsko-mazurskie",
  "15": "wielkopolskie",
  "16": "zachodniopomorskie",
};

export const PROVINCE_CODES = Object.keys(PROVINCE_NAMES) as Array<keyof typeof PROVINCE_NAMES>;

/**
 * Terminy Leczenia NFZ — Prompt Definitions
 *
 * Slash-command prompts for the host UI. Substitute for the removed
 * sampling/createMessage path (SEP-2577): each prompt seeds a user-turn
 * (plus optional persona preamble or few-shot exemplar) that instructs the
 * host LLM to drive the correct tool sequence — no server-side LLM call.
 *
 * Registration pattern mirrors projects/ads-roi/src/optional/prompts/index.ts
 * (individual `{ name, config, handler }` objects exported in an array; the
 * server registers them individually to keep TS arg inference per-prompt).
 *
 * UI text is Polish per `feedback_polish_market`; code/comments English per
 * CLAUDE.md rule #4.
 */

import * as z from "zod/v4";

// ============================================================================
// Prompt 1: /znajdz-termin — guided NFZ appointment search
// ============================================================================
//
// Seeds a single user-turn that tells the host LLM to (1) translate a lay
// specialty term into an NFZ dictionary name via `lookup_benefit` when the
// input isn't already uppercase, then (2) call `search_appointments` with
// the resolved name. Encodes the canonical map-server chain so the LLM
// doesn't have to discover it from tool descriptions alone.

interface ZnajdzTerminArgs {
  specialty: string;
  province?: string;
  locality?: string;
  urgent?: boolean;
  children?: boolean;
}

const PROVINCE_HINT =
  "Kod województwa (01-16): 01=dolnośląskie, 02=kujawsko-pomorskie, 03=lubelskie, " +
  "04=lubuskie, 05=łódzkie, 06=małopolskie, 07=mazowieckie, 08=opolskie, 09=podkarpackie, " +
  "10=podlaskie, 11=pomorskie, 12=śląskie, 13=świętokrzyskie, 14=warmińsko-mazurskie, " +
  "15=wielkopolskie, 16=zachodniopomorskie.";

function looksLikeNfzDictionaryName(s: string): boolean {
  // NFZ dictionary entries are uppercase Polish (with diacritics), e.g.
  // "ODDZIAŁ KARDIOLOGICZNY". Heuristic: at least 4 chars and entirely
  // uppercase after stripping non-letters.
  const letters = s.replace(/[^A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/g, "");
  return letters.length >= 4 && letters === letters.toUpperCase();
}

export const znajdzTerminPrompt = {
  name: "znajdz-termin",
  config: {
    title: "Znajdź termin NFZ",
    description:
      "Wyszukaj najwcześniejszy publiczny termin NFZ dla wskazanego świadczenia. " +
      "Jeśli specjalność nie jest oficjalną nazwą NFZ (UPPERCASE), promp najpierw uruchomi " +
      "lookup_benefit, a następnie search_appointments z dopasowanym hasłem.",
    argsSchema: {
      specialty: z.string().min(2).meta({
        description:
          "Specjalność lub świadczenie (np. 'kardiolog', 'rezonans kolana', 'OTOLARYNGOLOGIA'). " +
          "Jeśli to lay-term — lookup_benefit przetłumaczy do nazwy NFZ.",
      }),
      province: z
        .enum([
          "01","02","03","04","05","06","07","08",
          "09","10","11","12","13","14","15","16",
        ])
        .optional()
        .meta({ description: PROVINCE_HINT }),
      locality: z.string().optional().meta({
        description: "Konkretna miejscowość (np. 'WARSZAWA'). Pomiń jeśli pacjent pyta o całe województwo.",
      }),
      urgent: z.coerce.boolean().optional().meta({
        description: "true = przypadek pilny (case=2); domyślnie stable (case=1).",
      }),
      children: z.coerce.boolean().optional().meta({
        description: "true = ogranicz do oddziałów dziecięcych (benefit_for_children=true).",
      }),
    },
  },
  handler: async (args: ZnajdzTerminArgs) => {
    const { specialty, province, locality, urgent, children } = args;
    const filters: string[] = [];
    if (province) filters.push(`województwo ${province}`);
    if (locality) filters.push(`miejscowość "${locality}"`);
    if (urgent) filters.push("case=2 (pilny)");
    if (children) filters.push("benefit_for_children=true");
    const filterLine = filters.length > 0 ? ` Filtry: ${filters.join(", ")}.` : "";

    const isDictName = looksLikeNfzDictionaryName(specialty);
    const guidance = isDictName
      ? `Wywołaj search_appointments z benefit="${specialty}" — wygląda już jak nazwa NFZ.`
      : `Najpierw wywołaj lookup_benefit(query="${specialty}") aby znaleźć oficjalną nazwę NFZ, ` +
        `następnie wywołaj search_appointments z najlepszym dopasowaniem jako parametr 'benefit'. ` +
        `Jeżeli wynik search_appointments ma count=0 i pole did_you_mean[] — ponów z jedną z propozycji.`;

    return {
      description: `Znajdź termin NFZ dla "${specialty}"`,
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text:
              `Pomóż mi znaleźć najszybszy termin NFZ na świadczenie: "${specialty}".${filterLine}\n\n` +
              `${guidance}\n\n` +
              `Po otrzymaniu wyników: podaj 3 najwcześniejsze terminy z datą, lokalizacją i telefonem. ` +
              `Jeśli zwrócony rekord ma has_other_places=true — zaproponuj wywołanie list_other_places ` +
              `dla potencjalnie szybszej alternatywy u tego samego świadczeniodawcy.`,
          },
        },
      ],
    };
  },
};

// ============================================================================
// Prompt 2: /sprawdz-objaw — symptom-to-benefit translator (LLM-first)
// ============================================================================
//
// Pacjent opisuje objaw potocznie ("boli mnie krzyż", "guzek na szyi"); prompt
// instruuje LLM jakim oficjalnym specjalnościom NFZ to odpowiada, następnie
// żeby uruchomić znajdz-termin / search_appointments dla wybranej. Pełni rolę
// front-doora dla `nfz-benefits` companion (jeszcze nieobsługiwanego tu).

interface SprawdzObjawArgs {
  objaw: string;
  province?: string;
}

export const sprawdzObjawPrompt = {
  name: "sprawdz-objaw",
  config: {
    title: "Sprawdź objaw → świadczenie NFZ",
    description:
      "Z opisu objawu zaproponuj 1-3 oddziały/poradnie NFZ, a potem znajdź najszybszy termin " +
      "dla wskazanej specjalności (chain: objaw → lookup_benefit → search_appointments).",
    argsSchema: {
      objaw: z.string().min(3).meta({
        description: "Krótki opis objawu lub problemu pacjenta po polsku, np. 'boli mnie krzyż od miesiąca'.",
      }),
      province: z
        .enum([
          "01","02","03","04","05","06","07","08",
          "09","10","11","12","13","14","15","16",
        ])
        .optional()
        .meta({ description: PROVINCE_HINT }),
    },
  },
  handler: async (args: SprawdzObjawArgs) => {
    const { objaw, province } = args;
    const provinceLine = province ? ` Województwo do wyszukiwania: ${province}.` : "";
    return {
      description: `Sprawdź objaw NFZ: "${objaw}"`,
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text:
              `Pacjent zgłasza: "${objaw}".${provinceLine}\n\n` +
              `Krok 1: zaproponuj 1-3 oddziały lub poradnie NFZ, które obsługują takie objawy ` +
              `(np. ból krzyża → ORTOPEDIA / NEUROCHIRURGIA / REHABILITACJA). ` +
              `NIE diagnozuj — tylko mapuj objaw na specjalność medyczną.\n\n` +
              `Krok 2: dla najbardziej prawdopodobnej specjalności wywołaj lookup_benefit(query=...) ` +
              `aby znaleźć dokładną nazwę słownikową NFZ (np. "ODDZIAŁ ORTOPEDII I TRAUMATOLOGII NARZĄDU RUCHU"), ` +
              `następnie search_appointments z tą nazwą.\n\n` +
              `Krok 3: podaj 3 najwcześniejsze terminy. Jeśli wynik ma did_you_mean[] — ponów wyszukiwanie.\n\n` +
              `Zaznacz, że to NIE jest porada medyczna i pacjent powinien skonsultować objawy z lekarzem POZ.`,
          },
        },
      ],
    };
  },
};

export const terminyLeczeniaPrompts = [znajdzTerminPrompt, sprawdzObjawPrompt];

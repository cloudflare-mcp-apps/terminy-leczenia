/**
 * Patient-term → NFZ dictionary-substring hints.
 *
 * When `lookup_benefit(query=X)` returns 0 results, we probe these
 * hint substrings against NFZ /benefits to populate `did_you_mean[]`.
 *
 * Keys are uppercased patient terms; values are substrings KNOWN to
 * return ≥1 NFZ benefit. Match logic: key overlaps with the user query
 * (substring either direction, min 5 chars).
 *
 * Maintenance: add an entry when an eval iteration shows the LLM
 * burning ≥3 tool calls on a fallback search. Don't add speculative
 * mappings — each one is paid for with one extra NFZ probe in the
 * 0-result branch.
 */
export const BENEFIT_SYNONYMS: Record<string, string[]> = {
  // Okulistyka
  ZAĆMA: ["SOCZEWKI", "OKULISTYCZNY"],
  KATARAKT: ["SOCZEWKI", "OKULISTYCZNY"],
  JASKR: ["OKULISTYCZNY"],

  // Laryngologia
  PRZEGRODA: ["OTOLARYNGOLOG"],
  SEPTOPLASTYKA: ["OTOLARYNGOLOG"],
  MIGDAŁ: ["OTOLARYNGOLOG"],
  USZU: ["OTOLARYNGOLOG"],
  ZATOK: ["OTOLARYNGOLOG"],

  // Ortopedia / endoprotezy
  ENDOPROTEZ: ["ORTOPED"],
  BIODR: ["ORTOPED", "ENDOPROTEZ"],
  KOLAN: ["ORTOPED", "REZONANS"],
  ŁĄKOTK: ["ORTOPED"],
  KRĘGOSŁ: ["NEUROCHIRURG", "ORTOPED"],

  // Kardiologia / naczynia
  SERC: ["KARDIOLOG"],
  NADCIŚN: ["KARDIOLOG", "INTERNIST"],
  ŻYŁ: ["CHIRURGIA NACZYNIO"],
  ŻYLAK: ["CHIRURGIA NACZYNIO"],

  // Onkologia
  RAK: ["ONKOLOG"],
  NOWOTW: ["ONKOLOG"],
  CHEMIO: ["ONKOLOG"],

  // Inne częste
  TARCZYC: ["ENDOKRYNOLOG"],
  CUKRZYC: ["DIABETOLOG"],
  ALERG: ["ALERGOLOG"],
  ASTM: ["PULMONOLOG", "ALERGOLOG"],
  SKÓR: ["DERMATOLOG"],
  PROSTATY: ["UROLOG"],
  PRZEPUKLI: ["CHIRURG"],
  "WOREK ŻÓŁCIOW": ["CHIRURG"],
  CIĄŻ: ["GINEKOLOG", "POŁOŻNIC"],
  REUMA: ["REUMATOLOG"],
};

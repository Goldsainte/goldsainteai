/* taxIdByCountry (31 Jul) — localizes the business tax-ID field on the agent
 * application. A UK agency asked for an "EIN" doesn't know what that is;
 * every country in WORLD_COUNTRIES gets its own identifier name and a
 * format example. Placeholders are illustrative formats, not validators —
 * we accept what the applicant enters and humans review it.
 * Fallback (country not listed / not yet chosen): generic "Business Tax ID". */

export interface TaxIdInfo {
  label: string;
  placeholder: string;
  helper?: string;
}

export const DEFAULT_TAX_ID: TaxIdInfo = {
  label: "Business Tax ID",
  placeholder: "Your country's business tax identifier",
};

export const TAX_ID_BY_COUNTRY: Record<string, TaxIdInfo> = {
  US: { label: "EIN (Employer Identification Number)", placeholder: "XX-XXXXXXX", helper: "9-digit EIN — not your SSN. Free to obtain at irs.gov/ein." },
  GB: { label: "VAT Registration Number", placeholder: "GB123456789", helper: "Not VAT-registered? Enter your Company Number or UTR." },
  CA: { label: "Business Number (BN)", placeholder: "123456789" },
  AU: { label: "ABN (Australian Business Number)", placeholder: "12 345 678 901" },
  NZ: { label: "NZBN or IRD Number", placeholder: "9429041234567" },
  IE: { label: "VAT Number", placeholder: "IE1234567X" },
  FR: { label: "SIRET", placeholder: "123 456 789 00012" },
  DE: { label: "USt-IdNr. (VAT ID)", placeholder: "DE123456789", helper: "Or your Steuernummer if not VAT-registered." },
  ES: { label: "NIF / CIF", placeholder: "B12345678" },
  PT: { label: "NIF (Número de Identificação Fiscal)", placeholder: "123456789" },
  IT: { label: "Partita IVA", placeholder: "IT12345678901" },
  NL: { label: "KVK Number", placeholder: "12345678" },
  BE: { label: "Enterprise Number (KBO/BCE)", placeholder: "0123.456.789" },
  CH: { label: "UID (Enterprise ID)", placeholder: "CHE-123.456.789" },
  AT: { label: "UID (ATU Number)", placeholder: "ATU12345678" },
  SE: { label: "Organisationsnummer", placeholder: "556123-4567" },
  NO: { label: "Organisasjonsnummer", placeholder: "123 456 789" },
  DK: { label: "CVR Number", placeholder: "12345678" },
  FI: { label: "Business ID (Y-tunnus)", placeholder: "1234567-8" },
  PL: { label: "NIP", placeholder: "1234567890" },
  CZ: { label: "IČO", placeholder: "12345678" },
  GR: { label: "AFM (Tax Number)", placeholder: "123456789" },
  HR: { label: "OIB", placeholder: "12345678901" },
  RO: { label: "CUI", placeholder: "RO1234567" },
  HU: { label: "Tax Number (Adószám)", placeholder: "12345678-1-12" },
  MX: { label: "RFC", placeholder: "ABC123456XYZ" },
  BR: { label: "CNPJ", placeholder: "12.345.678/0001-90" },
  AR: { label: "CUIT", placeholder: "30-12345678-9" },
  CL: { label: "RUT", placeholder: "12.345.678-9" },
  CO: { label: "NIT", placeholder: "123456789-0" },
  PE: { label: "RUC", placeholder: "12345678901" },
  CR: { label: "Cédula Jurídica", placeholder: "3-101-123456" },
  JP: { label: "Corporate Number (法人番号)", placeholder: "1234567890123" },
  SG: { label: "UEN (Unique Entity Number)", placeholder: "201812345A" },
  HK: { label: "Business Registration Number", placeholder: "12345678-000" },
  TH: { label: "Tax ID", placeholder: "1234567890123" },
  MY: { label: "SSM Registration Number", placeholder: "201901123456" },
  ID: { label: "NPWP", placeholder: "12.345.678.9-012.345" },
  PH: { label: "TIN", placeholder: "123-456-789-000" },
  VN: { label: "Tax Code (MST)", placeholder: "0123456789" },
  IN: { label: "GSTIN", placeholder: "22ABCDE1234F1Z5", helper: "Or your PAN if not GST-registered." },
  AE: { label: "TRN (Tax Registration Number)", placeholder: "123456789012345" },
  SA: { label: "VAT Number", placeholder: "312345678900003" },
  IL: { label: "Company Number (ח.פ.)", placeholder: "512345678" },
  TR: { label: "Vergi Kimlik Numarası", placeholder: "1234567890" },
  ZA: { label: "VAT / Tax Reference Number", placeholder: "4123456789" },
  KE: { label: "KRA PIN", placeholder: "P051234567X" },
  MA: { label: "ICE (Identifiant Commun de l'Entreprise)", placeholder: "001234567000089" },
  EG: { label: "Tax Registration Number", placeholder: "123-456-789" },
  TZ: { label: "TIN", placeholder: "123-456-789" },
  KR: { label: "Business Registration Number (사업자등록번호)", placeholder: "123-45-67890" },
  TW: { label: "Unified Business Number (統一編號)", placeholder: "12345678" },
};

export const taxIdInfoFor = (countryCode: string | null | undefined): TaxIdInfo =>
  (countryCode && TAX_ID_BY_COUNTRY[countryCode]) || DEFAULT_TAX_ID;

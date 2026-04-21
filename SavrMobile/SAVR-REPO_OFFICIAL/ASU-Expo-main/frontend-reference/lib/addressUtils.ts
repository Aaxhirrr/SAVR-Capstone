// Shared address utilities used by SignupPage and OnboardingSignupModal

export const PROVINCES = [
  { code: "AB", name: "Alberta" },
  { code: "BC", name: "British Columbia" },
  { code: "MB", name: "Manitoba" },
  { code: "NB", name: "New Brunswick" },
  { code: "NL", name: "Newfoundland and Labrador" },
  { code: "NS", name: "Nova Scotia" },
  { code: "NT", name: "Northwest Territories" },
  { code: "NU", name: "Nunavut" },
  { code: "ON", name: "Ontario" },
  { code: "PE", name: "Prince Edward Island" },
  { code: "QC", name: "Quebec" },
  { code: "SK", name: "Saskatchewan" },
  { code: "YT", name: "Yukon" },
] as const;

export const PROVINCE_NAME_TO_CODE: Record<string, string> = {};
PROVINCES.forEach((p) => {
  PROVINCE_NAME_TO_CODE[p.name.toLowerCase()] = p.code;
  PROVINCE_NAME_TO_CODE[p.code.toLowerCase()] = p.code;
});

export function formatPostalCode(input: string): string {
  let formatted = input.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (formatted.length > 3) {
    formatted = `${formatted.slice(0, 3)} ${formatted.slice(3, 6)}`;
  }
  return formatted.slice(0, 7);
}

export function formatPhoneNumber(input: string): string {
  const digitsOnly = input.replace(/\D/g, "");
  if (digitsOnly.length <= 3) {
    return digitsOnly;
  } else if (digitsOnly.length <= 6) {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
  } else {
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
  }
}

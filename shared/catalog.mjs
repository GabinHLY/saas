// Listes partagées entre l’API et l’interface. Les libellés sont dans src/i18n.js.
export const PRODUCT_TYPES = [
  "TOOL",
  "SAAS",
  "GAME",
  "GENERATOR",
  "SERVICE",
  "COMMUNITY",
  "B2B",
  "B2C",
  "CONTENT",
  "DIRECTORY",
  "WIDGET",
  "MARKETPLACE",
  "EXPERIMENT",
  "OTHER",
];
export const BUSINESS_MODELS = [
  "SUBSCRIPTION",
  "ONE_TIME_PAYMENT",
  "ADVERTISING",
  "SPONSORSHIP",
  "AFFILIATE",
  "COMMISSION",
  "CREDITS",
  "DONATION",
  "PAID_SERVICE",
  "PREMIUM_FEATURE",
  "LEAD_GENERATION",
  "DIGITAL_PRODUCT",
  "OTHER",
];
// Anciennes valeurs, migrées au démarrage de l’API.
export const LEGACY_MODELS = { ONE_TIME: "ONE_TIME_PAYMENT", ADS: "ADVERTISING" };

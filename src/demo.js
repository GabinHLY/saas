// Données fictives du mode démonstration, jamais écrites en base.
// [nom, type de produit, modèle principal, sources de revenus (centimes), statut, décision]
const specimens = [
  ["Formdrop", "TOOL", "SUBSCRIPTION", { SUBSCRIPTION: 14200 }, "PROMISING", "CONTINUE"],
  ["TinyInvoice", "SAAS", "SUBSCRIPTION", { SUBSCRIPTION: 9600 }, "SHIPPED", "OBSERVE"],
  ["Shiplog", "WIDGET", "PREMIUM_FEATURE", { PREMIUM_FEATURE: 4800 }, "SHIPPED", "OBSERVE"],
  ["Waitlist.run", "TOOL", "ONE_TIME_PAYMENT", {}, "FAILED", "KILL"],
  ["Pixel Duel", "GAME", "ADVERTISING", { ADVERTISING: 4200, SPONSORSHIP: 10000 }, "PROMISING", "CONTINUE"],
  ["Screenshot API", "SAAS", "CREDITS", { CREDITS: 11500 }, "SHIPPED", "OBSERVE"],
  ["Focusroom", "COMMUNITY", "DONATION", { DONATION: 2400 }, "SHIPPED", "PAUSE"],
  ["Proofwall", "WIDGET", "SUBSCRIPTION", { SUBSCRIPTION: 18900 }, "PROFITABLE", "CONTINUE"],
  ["Palette.work", "GENERATOR", "ONE_TIME_PAYMENT", { ONE_TIME_PAYMENT: 8700, AFFILIATE: 3200 }, "PROMISING", "OBSERVE"],
  ["Stack Atlas", "DIRECTORY", "SPONSORSHIP", {}, "SHIPPED", "OBSERVE"],
  ["Logo Sprint", "SERVICE", "PAID_SERVICE", { PAID_SERVICE: 4000 }, "SHIPPED", "OBSERVE"],
  ["Changelog.so", "CONTENT", "ADVERTISING", { ADVERTISING: 900 }, "SHIPPED", "PAUSE"],
  ["Invoice Nudger", "B2B", "LEAD_GENERATION", { LEAD_GENERATION: 1300 }, "SHIPPED", "OBSERVE"],
  ["Dailydraft", "GENERATOR", "PREMIUM_FEATURE", {}, "BUILDING", "OBSERVE"],
];
const copy = {
  fr: {
    pitches: [
      "Les formulaires ont enfin une boîte de réception.",
      "Une facture. Un lien. C’est payé.",
      "Le journal de bord des produits qui avancent.",
      "Valider une idée avant d’écrire du code.",
      "Un duel de pixels en trente secondes, dans le navigateur.",
      "Une capture parfaite. Une simple requête.",
      "Un espace calme pour faire le travail, ensemble.",
      "La preuve sociale, sans les complications.",
      "Des palettes pensées pour les interfaces.",
      "L’annuaire des outils des petites équipes.",
      "Un logo propre en 24 heures, pour 40 €.",
      "Chaque amélioration mérite d’être vue.",
      "Les relances que vous n’avez plus à écrire.",
      "De la page blanche à la première version.",
    ],
    hypothesis:
      "Un produit très ciblé, simple à prendre en main, peut trouver des gens prêts à payer dès le premier jour.",
    description:
      " Une expérience pour tester une seule idée : faire moins, mais le faire vraiment bien.",
    result:
      "Les premiers retours permettent de préciser le besoin. Prochaine étape : observer la rétention.",
  },
  en: {
    pitches: [
      "Forms finally get an inbox.",
      "One invoice. One link. Paid.",
      "The logbook for products that keep moving.",
      "Validate an idea before writing any code.",
      "A thirty-second pixel duel, right in the browser.",
      "A perfect screenshot. One simple request.",
      "A quiet space to get the work done, together.",
      "Social proof, without the hassle.",
      "Palettes designed for interfaces.",
      "The directory of tools small teams use.",
      "A clean logo in 24 hours, for €40.",
      "Every improvement deserves to be seen.",
      "The reminders you no longer have to write.",
      "From blank page to first version.",
    ],
    hypothesis:
      "A narrowly focused product that is easy to pick up can find people willing to pay on day one.",
    description:
      " An experiment to test a single idea: do less, but do it really well.",
    result:
      "Early feedback helps pin down the need. Next step: watch retention.",
  },
};
const build = (lang) =>
  specimens.map(([name, type, model, sources, status, decision], i) => {
    const revenue = Object.values(sources).reduce((s, v) => s + v, 0),
      hours = [4.35, 5.2, 3.75, 6.1][i % 4],
      costs = [1200, 800, 2500, 400][i % 4];
    return {
      id: i + 1,
      day: i + 1,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      pitch: copy[lang].pitches[i],
      status,
      decision,
      product_type: type,
      model,
      category: "",
      revenueSources: sources,
      hours,
      revenue,
      costs,
      profit: revenue - costs,
      profitHour: (revenue - costs) / hours,
      mrr: model === "SUBSCRIPTION" ? Math.round(revenue / 3) : 0,
      users: [284, 132, 86, 41, 612, 107, 49, 198, 241, 32, 6, 83, 48, 0][i],
      visitors: 1120 + i * 117,
      customers: Math.max(0, 14 - i),
      launch: `2026-10-${String(i + 1).padStart(2, "0")}`,
      hypothesis: copy[lang].hypothesis,
      description: copy[lang].pitches[i] + copy[lang].description,
      result: copy[lang].result,
      stack: "React · Node.js · SQLite",
      demo: true,
    };
  });
export const demoProjects = { fr: build("fr"), en: build("en") };

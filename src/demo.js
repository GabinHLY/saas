const names = [
  "Formdrop",
  "TinyInvoice",
  "Shiplog",
  "Waitlist.run",
  "Linkbrief",
  "Screenshot API",
  "Focusroom",
  "Proofwall",
  "Pinglet",
  "Readwise Lite",
  "Palette.work",
  "Changelog.so",
  "Invoice Nudger",
  "Dailydraft",
];
const copy = {
  fr: {
    pitches: [
      "Les formulaires ont enfin une boîte de réception.",
      "Une facture. Un lien. C’est payé.",
      "Le journal de bord des produits qui avancent.",
      "Valider une idée avant d’écrire du code.",
      "Vos liens sauvegardés, vraiment utiles.",
      "Une capture parfaite. Une simple requête.",
      "Un espace calme pour faire le travail.",
      "La preuve sociale, sans les complications.",
      "Votre site tombe. Vous le savez.",
      "Moins de favoris. Plus de connaissances.",
      "Des palettes pensées pour les interfaces.",
      "Chaque amélioration mérite d’être vue.",
      "Les relances que vous n’avez plus à écrire.",
      "De la page blanche à la première version.",
    ],
    hypothesis:
      "Un outil très ciblé, simple à prendre en main, peut faire gagner assez de temps pour devenir un produit que l’on choisit de payer.",
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
      "Your saved links, actually useful.",
      "A perfect screenshot. One simple request.",
      "A quiet space to get the work done.",
      "Social proof, without the hassle.",
      "Your site goes down. You know about it.",
      "Fewer bookmarks. More knowledge.",
      "Palettes designed for interfaces.",
      "Every improvement deserves to be seen.",
      "The reminders you no longer have to write.",
      "From blank page to first version.",
    ],
    hypothesis:
      "A narrowly focused tool that is easy to pick up can save enough time to become something people choose to pay for.",
    description:
      " An experiment to test a single idea: do less, but do it really well.",
    result:
      "Early feedback helps pin down the need. Next step: watch retention.",
  },
};
const build = (lang) =>
  names.map((name, i) => ({
    id: i + 1,
    day: i + 1,
    name,
    slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    pitch: copy[lang].pitches[i],
    status:
      i === 13
        ? "BUILDING"
        : i === 3
          ? "FAILED"
          : i === 7
            ? "PROFITABLE"
            : i === 0 || i === 8
              ? "PROMISING"
              : "SHIPPED",
    category: ["PRODUCTIVITY", "FINANCE", "DEVELOPER TOOLS", "MARKETING"][
      i % 4
    ],
    model: i % 3 ? "SUBSCRIPTION" : "ONE_TIME",
    hours: [4.35, 5.2, 3.75, 6.1][i % 4],
    revenue: [
      14200, 9600, 4800, 0, 3200, 11500, 2400, 18900, 12600, 0, 2100, 3500,
      1300, 0,
    ][i],
    mrr: [4900, 2900, 1900, 0, 900, 3900, 900, 4900, 1900, 0, 0, 900, 0, 0][i],
    users: [284, 132, 86, 41, 63, 107, 49, 198, 241, 32, 65, 83, 48, 0][i],
    visitors: 1120 + i * 117,
    customers: Math.max(0, 14 - i),
    costs: 1200,
    profit: 0,
    launch: `2026-10-${String(i + 1).padStart(2, "0")}`,
    hypothesis: copy[lang].hypothesis,
    description: copy[lang].pitches[i] + copy[lang].description,
    result: copy[lang].result,
    decision: "OBSERVE",
    stack: "React · Node.js · SQLite",
    demo: true,
  }));
export const demoProjects = { fr: build("fr"), en: build("en") };

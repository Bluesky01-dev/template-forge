/** Industry vocabulary (kept aligned with template manifests' `industries`). */
export const INDUSTRY_KEYWORDS: Record<string, string[]> = {
  saas: ["saas", "software", "platform", "dashboard", "api", "integrations", "workflow", "automation", "sign up", "free trial", "product"],
  ai: ["ai", "artificial intelligence", "machine learning", "llm", "gpt", "copilot"],
  fintech: ["payments", "banking", "finance", "invoice", "crypto", "fintech"],
  agency: ["agency", "studio", "we help brands", "our work", "case studies", "clients", "creative", "branding", "design studio"],
  portfolio: ["portfolio", "selected work", "projects", "photography", "photographer", "illustrator"],
  marketing: ["marketing", "seo", "growth", "campaigns", "social media"],
  restaurant: ["restaurant", "menu", "reservations", "dining", "chef", "cafe", "coffee", "bakery", "bar"],
  health: ["clinic", "dental", "dentist", "health", "medical", "physio", "therapy", "doctor", "patients"],
  wellness: ["wellness", "yoga", "spa", "massage", "meditation", "salon", "beauty"],
  fitness: ["gym", "fitness", "personal training", "workout", "crossfit", "pilates"],
  trades: ["electrician", "electrical", "plumbing", "plumber", "roofing", "hvac", "builder", "construction", "landscaping", "licensed", "repairs", "installation"],
  "real-estate": ["real estate", "realty", "property", "properties", "homes for sale", "listings", "realtor", "agents"],
  hospitality: ["hotel", "stay", "rooms", "booking", "resort", "accommodation"],
  ecommerce: ["shop", "cart", "add to cart", "free shipping", "collection", "products"],
  education: ["courses", "students", "learn", "school", "academy", "tutoring"],
  legal: ["law firm", "lawyer", "attorney", "legal"],
  nonprofit: ["donate", "nonprofit", "charity", "volunteer"],
};

const NEEDS: Record<string, RegExp> = {
  pricing: /\b(pricing|plans|per month|\/mo\b|packages)\b/i,
  testimonials: /\b(testimonials?|reviews?|what (our )?(clients|customers) say|rated)\b/i,
  faq: /\b(faq|frequently asked|questions)\b/i,
  portfolio: /\b(portfolio|our work|case stud(y|ies)|projects|gallery)\b/i,
  booking: /\b(book (now|online|an appointment)|appointments?|reserve|reservations?|schedule a)\b/i,
  team: /\b(our team|meet the team|founders?|staff)\b/i,
  stats: /\b(\d+\+|\d+%|years of experience|customers served)\b/i,
  logos: /\b(trusted by|our clients|as seen in|partners)\b/i,
  contact: /\b(contact|get in touch|call us|email us)\b/i,
};

export function classifyIndustry(text: string): { industry?: string; scores: Record<string, number> } {
  const t = ` ${text.toLowerCase()} `;
  const scores: Record<string, number> = {};
  for (const [ind, kws] of Object.entries(INDUSTRY_KEYWORDS)) {
    let s = 0;
    for (const kw of kws) {
      const re = new RegExp(`[^a-z]${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[^a-z]`, "g");
      s += Math.min(5, (t.match(re) ?? []).length) * (kw.includes(" ") ? 2 : 1);
    }
    if (s) scores[ind] = s;
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return { industry: best && best[1] >= 2 ? best[0] : undefined, scores };
}

export function detectNeeds(text: string): string[] {
  return Object.entries(NEEDS)
    .filter(([, re]) => re.test(text))
    .map(([k]) => k);
}

export function detectTone(text: string): string[] {
  const t = text.toLowerCase();
  const tone: string[] = [];
  if (/\b(friendly|family|local|neighbou?r|community)\b/.test(t)) tone.push("friendly");
  if (/\b(enterprise|secure|compliance|scalable|teams)\b/.test(t)) tone.push("professional");
  if (/\b(luxury|bespoke|exclusive|premium|crafted)\b/.test(t)) tone.push("premium");
  if (/\b(bold|disrupt|unapologetic|refuse|radical)\b/.test(t)) tone.push("bold");
  if (/\b(fun|playful|delight|love)\b/.test(t)) tone.push("playful");
  return tone;
}

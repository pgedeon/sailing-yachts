/**
 * Maps glossary term slugs to relevant yacht browse links.
 * Each entry provides 1-2 contextual links to filtered yacht listings
 * or specific yacht pages, giving search engines crawlable internal links
 * from glossary content to yacht discovery pages.
 */

export interface GlossaryYachtLink {
  href: string
  label: string   // en
  labelFr: string  // fr
}

const LINK_MAP: Record<string, GlossaryYachtLink[]> = {
  "loa": [
    { href: "/yachts?filters[lengthMin]=12&filters[lengthMax]=15", label: "Browse yachts 12–15m", labelFr: "Yachts de 12 à 15 m" },
    { href: "/yachts?filters[lengthMin]=15", label: "Browse yachts over 15m", labelFr: "Yachts de plus de 15 m" },
  ],
  "beam": [
    { href: "/yachts?filters[lengthMin]=10&filters[lengthMax]=14", label: "Browse 10–14m cruising yachts", labelFr: "Yachts de croisière de 10 à 14 m" },
  ],
  "draft": [
    { href: "/yachts?filters[lengthMin]=9&filters[lengthMax]=12", label: "Browse shallow-draft yachts", labelFr: "Yachts à faible tirant d'eau" },
  ],
  "displacement": [
    { href: "/yachts?filters[lengthMin]=12", label: "Browse large displacement yachts", labelFr: "Yachts à déplacement lourds" },
  ],
  "ballast": [
    { href: "/yachts?filters[lengthMin]=10&filters[lengthMax]=14", label: "Browse performance cruisers", labelFr: "Yachts de croisière performants" },
  ],
  "ballast-ratio": [
    { href: "/yachts?filters[lengthMin]=10", label: "Compare yacht stability", labelFr: "Comparer la stabilité des yachts" },
  ],
  "fin-keel": [
    { href: "/yachts?filters[keelType]=Fin+Keel", label: "Browse fin-keel yachts", labelFr: "Yachts à quille pendulaire" },
  ],
  "wing-keel": [
    { href: "/yachts?filters[keelType]=Wing+Keel", label: "Browse wing-keel yachts", labelFr: "Yachts à quille ailettes" },
  ],
  "cutter-rig": [
    { href: "/yachts?filters[rigType]=Cutter", label: "Browse cutter-rigged yachts", labelFr: "Yachts gréés en cotre" },
  ],
  "sloop-rig": [
    { href: "/yachts?filters[rigType]=Sloop", label: "Browse sloop-rigged yachts", labelFr: "Yachts gréés en sloop" },
  ],
  "ketch-rig": [
    { href: "/yachts?filters[rigType]=Ketch", label: "Browse ketch-rigged yachts", labelFr: "Yachts gréés en ketch" },
  ],
  "shoal-draft": [
    { href: "/yachts?filters[keelType]=Shoal+Draft", label: "Browse shoal-draft yachts", labelFr: "Yachts à faible tirant d'eau" },
  ],
  "lwl": [
    { href: "/yachts?filters[lengthMin]=9&filters[lengthMax]=12", label: "Browse medium-length yachts", labelFr: "Yachts de taille moyenne" },
  ],
  "hull-speed": [
    { href: "/yachts?filters[lengthMin]=12", label: "Browse fast yachts", labelFr: "Yachts rapides" },
  ],
  "cabin": [
    { href: "/yachts?filters[cabinsMin]=3", label: "Browse yachts with 3+ cabins", labelFr: "Yachts avec 3 cabines ou plus" },
  ],
  "berth": [
    { href: "/yachts?filters[cabinsMin]=2", label: "Browse family-friendly yachts", labelFr: "Yachts familiaux" },
  ],
  "head": [
    { href: "/yachts?filters[cabinsMin]=2", label: "Browse yachts with multiple heads", labelFr: "Yachts avec plusieurs salles d'eau" },
  ],
  "bluewater": [
    { href: "/yachts?filters[lengthMin]=12", label: "Browse bluewater cruising yachts", labelFr: "Yachts pour la grande croisière" },
    { href: "/compare", label: "Compare bluewater yachts", labelFr: "Comparer les yachts hauturiers" },
  ],
  "coastal-cruiser": [
    { href: "/yachts?filters[lengthMin]=8&filters[lengthMax]=12", label: "Browse coastal cruising yachts", labelFr: "Yachts pour la croisière côtière" },
  ],
  "liveaboard": [
    { href: "/yachts?filters[lengthMin]=12&filters[cabinsMin]=3", label: "Browse liveaboard yachts", labelFr: "Yachts pour vivre à bord" },
  ],
}

/**
 * Get yacht browse links for a glossary term slug.
 * Returns an empty array if no relevant links are defined.
 */
export function getYachtLinksForTerm(slug: string, locale: string): GlossaryYachtLink[] {
  const links = LINK_MAP[slug]
  if (!links) return []
  return links.map((link) => ({
    ...link,
    href: `/${locale}${link.href}`,
  }))
}

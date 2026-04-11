/**
 * Seed manufacturer spotlights for top builders
 *
 * Run with: npx tsx scripts/seed-manufacturer-spotlights.ts
 */

import { pool } from "../lib/db";
import { slugify } from "../lib/utils/slugify";

interface SpotlightSeed {
  manufacturerName: string;
  title: string;
  metaDescription: string;
  historyMarkdown: string;
  brandPositioning: string;
  notableModels: { yachtSlug: string; reason: string }[];
  milestones: { year: number; event: string }[];
}

const spotlights: SpotlightSeed[] = [
  {
    manufacturerName: "Beneteau",
    title: "Beneteau: From Atlantic Fishing Boats to the World's Largest Sailboat Builder",
    metaDescription:
      "Discover Beneteau's 140-year journey from a small Atlantic boatyard to the world's leading sailboat manufacturer, with iconic ranges like Oceanis, First, and Jeanneau.",
    historyMarkdown: `## Origins on the Atlantic Coast (1884–1950)

Beneteau was founded in 1884 by Benjamin Bénéteau in Croix-de-Vie, a small fishing port on France's Atlantic coast. The shipyard began by building sailing trawlers for the local fishing fleet—stout, seaworthy vessels designed to handle the demanding conditions of the Bay of Biscay.

By the 1920s, the yard had passed to Benjamin's descendants and began transitioning from purely commercial fishing boats to pleasure craft. This pivot, driven by the growing French leisure sailing market, set the stage for the company's dramatic post-war expansion.

## The Fibreglass Revolution (1960–1985)

Beneteau embraced fibreglass construction in the 1960s, well ahead of many European competitors. The 1964 launch of the **Muscadet**—a 6.95 m one-design racer—demonstrated that production fibreglass sailboats could be both affordable and fun to sail. The Muscadet became a class boat in France and established Beneteau's reputation for value-oriented performance.

The **First 30** (1978) marked another leap. Designed by Philippe Briand, it combined modern underbody geometry with a comfortable interior at a price point that made yacht ownership accessible to a much broader audience. The First series would go on to define performance-cruising for decades.

## Global Expansion (1985–2010)

The 1980s and 1990s saw Beneteau expand aggressively. The **Oceanis** range, launched in 1986, targeted the charter and cruising market with voluminous interiors and easy sailing characteristics. Models like the Oceanis 351 and Oceanis 411 became the backbone of charter fleets worldwide.

In 1995, Beneteau acquired Jeanneau, creating Groupe Beneteau and cementing its position as the world's largest sailboat manufacturer. The group later acquired Lagoon (catamarans), Wauquiez (performance cruisers), and Monte Carlo (motor yachts).

The **First 40.7** (1999) and **First 27.7** (2002) kept the brand relevant in performance circles, while the Oceanis line continued to dominate the volume cruiser segment.

## Modern Era (2010–Present)

Recent Beneteau designs have pushed the boundaries of production boat design. The **Oceanis 51.1** (2018) featured chined hulls by Marc Lombard, delivering surprising performance without sacrificing comfort. The **First 53** (2020) by Roberto Biscontini returned the First range to its performance roots.

Today, Beneteau produces over 3,000 sailboats annually across its brands, with manufacturing facilities in France, Poland, and the United States. The company remains family-controlled (the Bénéteau family holds significant voting shares) while being publicly traded on the Euronext Paris exchange.`,
    brandPositioning:
      "Beneteau occupies the volume-leadership position in production sailboats. Their strategy centres on offering the broadest range of hull sizes and configurations—from 22-foot daysailers to 55-foot ocean cruisers—at competitive price points. The dual Oceanis (comfort-cruising) and First (performance) ranges allow the brand to serve both charter fleets and private owners. Beneteau's scale gives them an advantage in dealer networks, parts availability, and resale value transparency.",
    notableModels: [
      { yachtSlug: "beneteau-oceanis-461", reason: "Charter fleet staple with voluminous interior and proven sailing characteristics" },
      { yachtSlug: "beneteau-first-40-7", reason: "One of the most successful cruiser-racers of the early 2000s, still competitive today" },
      { yachtSlug: "beneteau-oceanis-51-1", reason: "Modern chined-hull design that redefined the production cruiser segment" },
    ],
    milestones: [
      { year: 1884, event: "Benjamin Bénéteau founds the shipyard in Croix-de-Vie, France" },
      { year: 1964, event: "Launch of the Muscadet — first mass-production fibreglass sailboat" },
      { year: 1978, event: "First 30 launches, establishing the performance-cruising First range" },
      { year: 1986, event: "Oceanis range debuts, targeting charter and cruising markets" },
      { year: 1995, event: "Acquisition of Jeanneau; Groupe Beneteau becomes world's largest sailboat builder" },
      { year: 2018, event: "Oceanis 51.1 introduces chined hull to the volume cruiser segment" },
    ],
  },
  {
    manufacturerName: "Jeanneau",
    title: "Jeanneau: French Innovation from the Sun Kissed Coast to Global Sailing Dominance",
    metaDescription:
      "Explore Jeanneau's evolution from a small French boatyard to a global sailing brand known for the Sun Odyssey and Sun Fast lines.",
    historyMarkdown: `## From Cars to Boats (1957–1975)

Jeanneau was founded in 1957 by Henri Jeanneau in Les Herbiers, Vendée, France. Originally a manufacturer of automobile and motorcycle parts, the company pivoted to boat building when Henri Jeanneau built a small motorboat to race in the 1957 Paris–Six-Fours rally. The success of that boat led to a rapid expansion into production powerboats and, by the mid-1960s, sailboats.

The **Sangria** (1970), a 7.5 m fibreglass sailboat, became one of Jeanneau's first major sailing successes. Affordable, easy to sail, and fun, it helped democratize sailing in France.

## The Sun Odyssey Era (1985–2005)

The **Sun Odyssey** range, launched in the mid-1980s, defined Jeanneau's sailboat identity for decades. Where Beneteau's First range emphasised performance, Jeanneau positioned Sun Odyssey as the thinking sailor's cruiser—slightly more elegant, slightly more refined, with better light and ventilation in the saloon.

The Sun Odyssey 35 (2001) and Sun Odyssey 40.3 (2003) became fixtures in Mediterranean charter fleets, prized for their manageable sail plans and comfortable interiors.

## Modern Jeanneau (2005–Present)

After the 1995 Beneteau acquisition, Jeanneau maintained its own design teams and production lines, preserving a distinct brand character. The **Sun Odyssey 440** (2018) introduced a forward-sloping hard chine—a Marc Lombard innovation—that increased interior volume without compromising sailing performance.

The **Sun Fast 3300** (2019) by Daniel Andrieu brought Jeanneau back into competitive offshore racing, winning its class in the RORC Transatlantic Race and establishing the brand in the fast-growing shorthanded racing segment.`,
    brandPositioning:
      "Jeanneau positions itself as the 'refined' alternative in the production sailboat market. While sharing industrial infrastructure with sister brand Beneteau, Jeanneau maintains distinct design language: slightly more elegant joinery, more innovative deck layouts (like the forward-sloping hard chine), and a focus on the owner-operator rather than the charter fleet. The Sun Fast range targets the growing shorthanded racing market.",
    notableModels: [
      { yachtSlug: "jeanneau-sun-odyssey-440", reason: "Revolutionary hull shape with forward chine that maximises interior volume" },
      { yachtSlug: "jeanneau-sun-fast-3300", reason: "Dominant in shorthanded offshore racing; won class in RORC Transatlantic" },
      { yachtSlug: "jeanneau-sun-odyssey-40-3", reason: "Mediterranean charter fleet workhorse with excellent value retention" },
    ],
    milestones: [
      { year: 1957, event: "Henri Jeanneau builds first boat in Les Herbiers, France" },
      { year: 1970, event: "Sanguria launch brings affordable fibreglass sailing to the masses" },
      { year: 1985, event: "Sun Odyssey range debuts, establishing Jeanneau's cruising identity" },
      { year: 1995, event: "Acquired by Groupe Beneteau; continues as independent brand" },
      { year: 2018, event: "Sun Odyssey 440 introduces innovative hull chine design" },
      { year: 2019, event: "Sun Fast 3300 launches to dominate shorthanded racing" },
    ],
  },
  {
    manufacturerName: "Bavaria Yachts",
    title: "Bavaria Yachts: German Engineering Meets Affordable Sailing",
    metaDescription:
      "How Bavaria Yachts became Europe's second-largest sailboat manufacturer through German engineering efficiency, innovative production, and value-driven design.",
    historyMarkdown: `## The German Boatyard (1978–2000)

Bavaria Yachtbau was founded in 1978 in Giebelstadt, Bavaria, Germany. The company started as a modest boatyard producing small fibreglass sailboats for the German domestic market. From the beginning, Bavaria's approach was distinctively German: efficient production processes, consistent quality control, and a focus on delivering value.

By the 1990s, Bavaria had grown into one of Europe's most efficient sailboat production facilities. The company invested heavily in CNC-milled moulds and assembly-line techniques borrowed from the automotive industry, allowing them to produce boats at significantly lower cost than French competitors.

## Private Equity and Expansion (2000–2010)

In 2003, Bavaria was acquired by private equity firm BC Partners, which fuelled a dramatic expansion. Production capacity tripled, and the model range expanded to include motor yachts under the Bavaria Motor Boat brand. At peak, the yard produced over 3,000 boats annually.

The **Bavaria 36** and **Bavaria 42** of this era became synonymous with affordable, no-nonsense cruising. While some purists criticised the 'cookie-cutter' interiors, the value proposition was undeniable.

## Restructuring and Modern Era (2010–Present)

The global financial crisis hit Bavaria hard. After a period of restructuring and ownership changes (Bain Capital, then eventually a management buyout), the company refocused on core sailing products. The **Bavaria C-line** (C42, C45, C50) introduced more contemporary styling and better sailing characteristics, designed by Marc Lombard and winch designer judel/vrolijk.

The **Bavaria SR-line** brought a fresh approach to deck layout with walk-around side decks and innovative cockpit configurations, signalling Bavaria's ambition to compete on design rather than just price.`,
    brandPositioning:
      "Bavaria occupies the value-leadership position in European sailboats. Their German manufacturing heritage provides a quality perception advantage, while their efficient production processes enable competitive pricing. The brand targets cost-conscious buyers who want a 'proper' yacht without paying French premium pricing. Recent collaborations with judel/vrolijk and Marc Lombard signal a shift toward design-driven differentiation.",
    notableModels: [
      { yachtSlug: "bavaria-c42", reason: "Marc Lombard design that proved Bavaria can compete on sailing performance, not just price" },
      { yachtSlug: "bavaria-36", reason: "Defined affordable cruising for a generation of European sailors" },
      { yachtSlug: "bavaria-c50", reason: "Largest in the C-line, offering 50 feet of cruising at an unprecedented price point" },
    ],
    milestones: [
      { year: 1978, event: "Bavaria Yachtbau founded in Giebelstadt, Germany" },
      { year: 1998, event: "Reaches 1,000 boats produced annually" },
      { year: 2003, event: "BC Partners acquisition fuels major capacity expansion" },
      { year: 2007, event: "Peak production: over 3,000 boats per year" },
      { year: 2015, event: "C-line launch with Marc Lombard designs signals quality pivot" },
      { year: 2020, event: "SR-line introduces innovative deck layouts" },
    ],
  },
  {
    manufacturerName: "Hanse Yachts",
    title: "Hanse Yachts: The Baltic Challenger with Bold Design Ambitions",
    metaDescription:
      "From a small East German boatyard to a global brand—explore Hanse Yachts' journey and how their Greifswald factory produces distinctive performance cruisers.",
    historyMarkdown: `## Post-Rebirth in Greifswald (1990–2005)

Hanse Yachts was founded in 1990 in Greifswald, on Germany's Baltic coast, shortly after German reunification. The company began by building the Hanse 291, a modest 29-foot cruiser designed by Karl C. Müller. The location in the former East Germany gave Hanse access to skilled labour at competitive costs—a crucial advantage in the price-sensitive production sailboat market.

The breakthrough came with the **Hanse 371** (2001), designed by judel/vrolijk. It introduced Hanse's signature features: a self-tacking jib, clean deck layout, and a focus on easy shorthanded sailing. The 371 won European Yacht of the Year and put Hanse on the map.

## Expansion and Portfolio Growth (2005–2020)

Hanse expanded aggressively, acquiring the Moody (deck-saloon cruisers), Varianta (entry-level), and Sealine (motor yachts) brands. The **Hanse 575** (2015) demonstrated that the yard could produce a credible 57-foot cruiser, pushing into territory previously dominated by Swan, Hallberg-Rassy, and Amel.

The judel/vrolijk partnership continued to define the brand's sailing DNA: fast, stiff hulls with a bias toward reaching rather than running, and interiors that prioritise light and space over traditional joinery.

## Modern Hanse (2020–Present)

The **Hanse 460** (2022) and **Hanse 348** represent the current generation: modern plumb bows, chined hulls, and an increasing focus on sustainable materials in the interior. Hanse has also invested in electric propulsion options and solar integration, positioning the brand for the green-sailing transition.`,
    brandPositioning:
      "Hanse positions itself as the 'smart performance' brand—offering judel/vrolijk design pedigree at prices below Scandinavian competitors. The self-tacking jib (standard on most models) reinforces the easy-sailing message. Hanse targets experienced sailors who value sailing performance but don't want to pay Hallberg-Rassy prices, and who appreciate the German build quality narrative.",
    notableModels: [
      { yachtSlug: "hanse-371", reason: "European Yacht of the Year 2002; the model that put Hanse on the global stage" },
      { yachtSlug: "hanse-575", reason: "Proved Hanse could compete in the 55+ ft segment" },
      { yachtSlug: "hanse-460", reason: "Modern chined hull with plumb bow; current-generation flagship of the range" },
    ],
    milestones: [
      { year: 1990, event: "Hanse Yachts founded in Greifswald, Germany" },
      { year: 2001, event: "Hanse 371 wins European Yacht of the Year" },
      { year: 2005, event: "Acquires Moody brand for deck-saloon cruisers" },
      { year: 2011, event: "Hanse Group IPO on Frankfurt Stock Exchange" },
      { year: 2022, event: "Hanse 460 launches with next-generation hull design" },
    ],
  },
  {
    manufacturerName: "Dufour",
    title: "Dufour Yachts: French Elegance and Performance on the Water",
    metaDescription:
      "Explore Dufour's legacy from 1964 La Rochelle to modern performance cruisers—the Grand Large and Performance ranges that define French sailing style.",
    historyMarkdown: `## La Rochelle Origins (1964–1990)

Dufour Yachts was founded in 1964 by Michel Dufour in La Rochelle, France. Dufour was one of the first European builders to adopt fibreglass construction for production sailboats, and the **Sylphe** (1965) was among the earliest French GRP sailboats.

The **Dufour 2800** and **Dufour 4800** of the 1970s established the brand's reputation for well-built, good-sailing cruisers with elegant French styling. Michel Dufour was a keen racer, and this performance DNA ran through the entire range.

## The Grand Large Era (1990–2015)

After financial difficulties in the 1980s, Dufour was restructured and refocused. The **Grand Large** range, launched in the early 2000s, brought a new level of design sophistication. The Dufour 40 Grand Large (2005) won European Yacht of the Year and established the brand as a serious alternative to Beneteau and Jeanneau.

The range expanded to include both cruising (Grand Large) and performance (Performance) lines, designed by Umberto Felci. The dual-range strategy allowed Dufour to serve both the charter market and performance-oriented private owners.

## Modern Dufour (2015–Present)

Recent Dufour designs have pushed toward more aggressive styling. The **Dufour 530** (2020) features a versatile cockpit that converts between sailing and lounging configurations, while the **Dufour 390** (2021) brings premium features to the 38-40 foot segment. The brand continues to manufacture in La Rochelle, maintaining its French identity.`,
    brandPositioning:
      "Dufour positions itself between the volume brands (Beneteau, Jeanneau, Bavaria) and the premium brands (Hallberg-Rassy, Swan). The brand emphasises French design elegance, good sailing performance, and slightly more exclusive positioning than the mass-market alternatives. The dual Grand Large / Performance range strategy lets Dufour serve both charter operators and owner-occupiers.",
    notableModels: [
      { yachtSlug: "dufour-40-grand-large", reason: "European Yacht of the Year 2005; defined the modern Dufour identity" },
      { yachtSlug: "dufour-530", reason: "Versatile cockpit design with dual sailing/lounging configurations" },
      { yachtSlug: "dufour-390", reason: "Premium features in the accessible 38-40 ft segment" },
    ],
    milestones: [
      { year: 1964, event: "Michel Dufour founds the shipyard in La Rochelle, France" },
      { year: 1965, event: "Sylphe launches — one of the first French fibreglass sailboats" },
      { year: 2005, event: "Dufour 40 Grand Large wins European Yacht of the Year" },
      { year: 2015, event: "Performance range launched alongside Grand Large" },
      { year: 2020, event: "Dufour 530 introduces convertible cockpit concept" },
    ],
  },
  {
    manufacturerName: "Lagoon",
    title: "Lagoon: The Catamaran Pioneer That Defined Modern Multihull Cruising",
    metaDescription:
      "From Jeanneau's racing catamaran division to the world's best-selling cruising catamaran brand—Lagoon's story of innovation and market dominance.",
    historyMarkdown: `## Racing Roots (1984–1995)

Lagoon was born in 1984 as the catamaran division of Jeanneau. The original Lagoon cats were designed for racing—lightweight, high-performance multihulls that competed in major offshore events. The **Lagoon 55** (1984) was one of the first production cruising catamarans, but it was the racing pedigree that initially defined the brand.

## The Cruising Pivot (1995–2010)

When Beneteau acquired Jeanneau in 1995, Lagoon was retained as a standalone brand focused exclusively on catamarans. The strategic decision to pivot from racing to cruising proved visionary. The cruising catamaran market was nascent in the 1990s, but charter companies were beginning to recognise the appeal of catamarans for Caribbean and Mediterranean holidays.

The **Lagoon 380** (1999) became one of the most popular charter catamarans ever built. Over 800 units were produced, and the 380 remains a common sight in charter fleets worldwide. The **Lagoon 410** (2000) and **Lagoon 440** (2004) extended the range upward.

## Market Dominance (2010–Present)

The **Lagoon 450** (2012) introduced the flybridge concept to production catamarans, providing excellent visibility and a dedicated seating area above the saloon. This design innovation was widely copied and became the industry standard for 45+ foot cruising cats.

Today, Lagoon produces over 300 catamarans annually, making it the world's best-selling cruising catamaran brand by a significant margin. The range spans from 40 feet (Lagoon 40) to 78 feet (Lagoon Seventy 8), with manufacturing in Bordeaux, France.`,
    brandPositioning:
      "Lagoon is the market leader in production cruising catamarans. The brand's positioning is built on three pillars: (1) the most extensive dealer network of any catamaran brand, (2) strong resale value driven by brand recognition, and (3) a design language that prioritises living space and comfort over sailing performance. Lagoon cats are not the fastest or most agile, but they are the most spacious and the easiest to resell.",
    notableModels: [
      { yachtSlug: "lagoon-380", reason: "Over 800 built; the most popular charter catamaran in history" },
      { yachtSlug: "lagoon-450", reason: "Introduced the flybridge concept that defined modern catamaran design" },
      { yachtSlug: "lagoon-40", reason: "Current entry-level model; accessible entry to the Lagoon brand" },
    ],
    milestones: [
      { year: 1984, event: "Lagoon born as Jeanneau's catamaran division" },
      { year: 1995, event: "Becomes standalone brand under Groupe Beneteau" },
      { year: 1999, event: "Lagoon 380 launches; becomes best-selling charter catamaran" },
      { year: 2012, event: "Lagoon 450 introduces flybridge to production catamarans" },
      { year: 2018, event: "Lagoon Seventy 8 enters the superyacht catamaran market" },
    ],
  },
  {
    manufacturerName: "Hallberg-Rassy",
    title: "Hallberg-Rassy: The Swedish Bluewater Legend Built for Ocean Crossing",
    metaDescription:
      "From Ellös, Sweden to every ocean—how Hallberg-Rassy built a cult following among serious bluewater sailors through unwavering quality and Olaf Enderlein's designs.",
    historyMarkdown: `## Swedish Shipbuilding Heritage (1943–1970)

Hallberg-Rassy's roots trace to 1943, when Harry Hallberg began building wooden boats in Ellös, on Sweden's west coast. Hallberg was a master craftsman who built a reputation for exceptionally strong, seaworthy vessels designed for the demanding conditions of the North Sea and Baltic.

In 1972, Hallberg merged with Christoph Rassy's yard (the 'Rassy' in the name), and the modern Hallberg-Rassy brand was born. The timing coincided with the fibreglass revolution, and the yard quickly transitioned from wood to GRP construction.

## The Enderlein Era (1970–2008)

The hiring of designer Olaf Enderlein in the early 1970s was transformative. Enderlein's designs—characterised by heavy displacement, long keels (later fin keels), pilothouse configurations, and incredibly strong construction—defined the Hallberg-Rassy identity for four decades.

The **Hallberg-Rassy 42** (1980) became the archetypal bluewater cruiser: a centre-cockpit, pilothouse yacht with a reputation for surviving conditions that would break lesser boats. The **HR 42F** (Fitzroy) famously completed a non-stop circumnavigation.

The **HR 46** (2005) and **HR 48** (2008) continued the tradition with more modern underbodies (spade rudders, fin keels) while retaining the trademark pilothouse and tank-tested hull shapes.

## Modern Hallberg-Rassy (2008–Present)

After Enderlein's passing, the yard engaged Spanish designer Germán Frers for new designs. The **HR 44** (2017) and **HR 57** (2019) brought more contemporary hull shapes and lighter interiors while maintaining the build quality that justifies prices 2-3x higher than production brands.

Hallberg-Rassy remains a semi-custom builder in Ellös, producing approximately 60-80 boats per year. Every yacht is built to order, with a waiting list that can extend to 18 months.`,
    brandPositioning:
      "Hallberg-Rassy is the quintessential premium bluewater brand. Pricing sits well above production brands (Beneteau, Hanse) but below luxury brands (Swan, Oyster). The brand's cult following is built on three things: (1) proven ocean survivability, (2) exceptional Swedish build quality, and (3) the iconic pilothouse/centre-cockpit layout. HR owners are typically experienced sailors planning extended cruising, not weekend warriors.",
    notableModels: [
      { yachtSlug: "hallberg-rassy-42", reason: "The archetypal bluewater cruiser; non-stop circumnavigation proven" },
      { yachtSlug: "hallberg-rassy-46", reason: "Modern fin-keel/spade-rudder underbody with traditional HR solidity" },
      { yachtSlug: "hallberg-rassy-44", reason: "Germán Frers design bringing modern hull geometry to the HR tradition" },
    ],
    milestones: [
      { year: 1943, event: "Harry Hallberg begins building wooden boats in Ellös, Sweden" },
      { year: 1972, event: "Merger with Christoph Rassy creates Hallberg-Rassy" },
      { year: 1980, event: "HR 42 launches; becomes the definitive bluewater cruiser" },
      { year: 2005, event: "HR 46 modernises the range with fin keel and spade rudder" },
      { year: 2017, event: "HR 44 by Germán Frers continues the evolution" },
    ],
  },
  {
    manufacturerName: "X-Yachts",
    title: "X-Yachts: Danish Performance Cruising at Its Purest",
    metaDescription:
      "From a small Danish yard to ISAF world champions—how X-Yachts built a reputation for the best-sailing production boats in the world.",
    historyMarkdown: `## The Nielsen Brothers' Vision (1979–1995)

X-Yachts was founded in 1979 by brothers Lars and Børge Nielsen in Haderslev, Denmark. Both accomplished sailors (Lars represented Denmark in the Olympics), the Nielsen brothers set out to build sailboats that genuinely excelled on the water—not just looked good at boat shows.

The **X-79** (1979) was the first product: a 26-foot one-design racer that became the largest one-design class in Scandinavia. Over 600 X-79s were built, and the class remains active today.

The **X-99** (1985) continued the theme, becoming a widely popular IMS racer-cruiser. But it was the **X-332** (1993) and later **X-382** (1996) that brought X-Yachts to international attention, winning major IMS championships and establishing the brand as a serious competitor to the likes of J/Boats and Farr.

## The Performance-Cruising Pivot (1995–2010)

As IMS racing declined, X-Yachts pivoted toward performance cruising while retaining its racing DNA. The **X-43** (2004) and **X-50** (2007) showed that the yard could build comfortable cruisers without sacrificing the sailing experience that defined the brand.

## Pure X and IMX Lines (2010–Present)

The current range is split into **Pure X** (cruiser-racers) and **IMX** (sportsboats). The **X4⁶** (2022) represents the current state of the art: a 46-foot performance cruiser that can hold its own on the racecourse while providing genuine cruising comfort.

X-Yachts remains a relatively small builder, producing approximately 80-100 boats per year in Haderslev. The company's independence allows it to focus on sailing quality over volume—a strategy that has earned it one of the highest owner-loyalty rates in the industry.`,
    brandPositioning:
      "X-Yachts occupies the 'sailing enthusiast' niche in the premium segment. The brand targets experienced sailors who prioritise sailing performance above all else—including interior volume and charter-market appeal. X-Yachts owners are typically knowledgeable sailors who appreciate the difference between a boat that sails well and one that merely accommodates well. Pricing is comparable to Hallberg-Rassy but for a very different customer.",
    notableModels: [
      { yachtSlug: "x-yachts-x79", reason: "The original; over 600 built and still the largest Scandinavian one-design class" },
      { yachtSlug: "x-yachts-x332", reason: "IMS championship winner that put X-Yachts on the international map" },
      { yachtSlug: "x-yachts-x46", reason: "Current-generation performance cruiser embodying the X-Yachts philosophy" },
    ],
    milestones: [
      { year: 1979, event: "Nielsen brothers found X-Yachts in Haderslev, Denmark; X-79 launches" },
      { year: 1985, event: "X-99 becomes dominant IMS racer in Northern Europe" },
      { year: 1993, event: "X-332 wins major IMS championships internationally" },
      { year: 2004, event: "X-43 marks the brand's move into serious cruising" },
      { year: 2022, event: "X4⁶ launches as the current flagship" },
    ],
  },
  {
    manufacturerName: "Catalina Yachts",
    title: "Catalina Yachts: America's Sailboat — Value, Durability, and Community",
    metaDescription:
      "How Frank Butler built Catalina Yachts into America's most popular sailboat brand, from the Catalina 22 to the modern Catalina 545.",
    historyMarkdown: `## Frank Butler's Vision (1969–1985)

Catalina Yachts was founded in 1969 by Frank Butler in Woodland Hills, California. Butler, a tool-and-die maker by trade, approached boat building with an engineer's eye for efficiency. His goal was simple: build good sailboats that ordinary people could afford.

The **Catalina 22** (1970) was the first product and remains one of the best-selling sailboats in history. Over 16,000 Catalina 22s have been built, and active class associations exist in dozens of countries. The boat's simplicity, trailerability, and forgiving sailing characteristics made it the entry point for an entire generation of American sailors.

The **Catalina 30** (1972) extended the formula to a larger, more capable cruiser. Over 6,500 were built, making it one of the most popular 30-foot sailboats ever.

## Building a Community (1985–2010)

What truly distinguished Catalina was not just the boats but the community. Catalina organised **Catalina Rendezvous** events, maintained an active owner network, and published technical bulletins that helped owners maintain and upgrade their boats. The **Catalina 36** and **Catalina 42** became staples of American coastal cruising, particularly on the East Coast and in the Pacific Northwest.

The company also established a reputation for standing behind its products—offering parts and support for models decades old, long after most manufacturers would have moved on.

## Modern Catalina (2010–Present)

The **Catalina 545** (2017) represented the brand's most ambitious project: a 54-foot ocean cruiser designed by Gerry Douglas. While smaller than European competitors' ranges, Catalina's US manufacturing (in Largo, Florida) and strong dealer network maintain a loyal domestic following.

Frank Butler passed in 2020, but the company continues under family leadership, maintaining its focus on the North American market and the values that made it America's sailboat brand.`,
    brandPositioning:
      "Catalina is the American value brand. The company's positioning is built on three pillars: (1) strong US manufacturing and dealer network, (2) exceptional parts availability and owner support for older models, and (3) a loyal owner community organised through Catalina Rendezvous events and class associations. Catalina does not compete on cutting-edge design; it competes on value, durability, and the reassurance of a strong domestic support network.",
    notableModels: [
      { yachtSlug: "catalina-22", reason: "Over 16,000 built; one of the best-selling sailboats in history" },
      { yachtSlug: "catalina-30", reason: "Over 6,500 built; defined affordable 30-foot cruising" },
      { yachtSlug: "catalina-545", reason: "The brand's most ambitious modern design; 54-foot ocean cruiser" },
    ],
    milestones: [
      { year: 1969, event: "Frank Butler founds Catalina Yachts in California" },
      { year: 1970, event: "Catalina 22 launches; eventually sells over 16,000 units" },
      { year: 1972, event: "Catalina 30 debuts; becomes one of the most popular 30-footers" },
      { year: 1990, event: "Catalina 36 and 42 dominate American coastal cruising" },
      { year: 2017, event: "Catalina 545 pushes into the 50+ ft ocean cruising segment" },
    ],
  },
  {
    manufacturerName: "Sunbeam",
    title: "Sunbeam Yachts: Austrian Precision on the Adriatic and Beyond",
    metaDescription:
      "From a small Austrian boatyard to a respected Mediterranean cruiser brand—Sunbeam's story of quality-first sailboat building.",
    historyMarkdown: `## Alpine Boatbuilding (1970–2000)

Sunbeam Yachts was founded by the Schöchl family in Goldegg im Pongau, Austria—hardly a traditional boatbuilding location. Yet the Schöchl family's engineering background and proximity to the Adriatic coast (a short drive south) gave them both the skills and the market access to build a viable sailboat business.

The early Sunbeam boats were small to mid-size cruisers designed for the Adriatic charter and cruising market. The boats earned a reputation for solid construction, well-thought-out interiors, and reliable systems—qualities that appealed to the pragmatic Central European sailor.

## The Modern Range (2000–Present)

Sunbeam's collaboration with the Judel/vrolijk design team brought a significant step up in sailing performance. The **Sunbeam 46.1** and **Sunbeam 50.1** offer a compelling combination of performance hull shapes and high-quality interiors built in the Austrian factory.

The brand maintains a relatively small production volume (approximately 30-40 boats per year), which allows for a high degree of customisation and personal attention to each build. Sunbeam owners often visit the factory during construction—a level of involvement that larger brands cannot offer.`,
    brandPositioning:
      "Sunbeam occupies a niche between production brands and true custom builders. The brand targets Central European sailors who value Austrian build quality, personal factory relationships, and judel/vrolijk design pedigree. Pricing is above Bavaria/Hanse but below Hallberg-Rassy. The brand's strength is its owner-builder relationship and the ability to customise each boat significantly.",
    notableModels: [
      { yachtSlug: "sunbeam-46-1", reason: "Judel/vrolijk design offering premium performance in a mid-size package" },
      { yachtSlug: "sunbeam-50-1", reason: "Larger cruiser with extensive customisation options" },
    ],
    milestones: [
      { year: 1970, event: "Schöchl family founds Sunbeam Yachts in Austria" },
      { year: 2000, event: "Partnership with judel/vrolijk elevates sailing performance" },
      { year: 2015, event: "Sunbeam 46.1 launches to strong Central European demand" },
    ],
  },
];

async function seed() {
  console.log("Seeding manufacturer spotlights...\n");

  for (const spotlight of spotlights) {
    // Find manufacturer by name
    const result = await pool.query(
      `SELECT id, name FROM manufacturers WHERE name ILIKE $1 LIMIT 1`,
      [spotlight.manufacturerName],
    );

    if (result.rows.length === 0) {
      console.log(`⚠ Manufacturer not found: ${spotlight.manufacturerName} — skipping`);
      continue;
    }

    const manufacturerId = result.rows[0].id;
    const manufacturerName = result.rows[0].name;
    const slug = slugify(manufacturerName) + "-spotlight";

    // Check if spotlight already exists
    const existing = await pool.query(
      `SELECT id FROM manufacturer_spotlights WHERE manufacturer_id = $1`,
      [manufacturerId],
    );

    if (existing.rows.length > 0) {
      console.log(`⏭ Spotlight already exists for ${manufacturerName} — updating`);
      await pool.query(
        `UPDATE manufacturer_spotlights SET
          title = $1, meta_description = $2, history_markdown = $3,
          brand_positioning = $4, notable_models = $5::jsonb, milestones = $6::jsonb,
          is_published = true, published_at = COALESCE(published_at, NOW()),
          updated_at = NOW()
        WHERE manufacturer_id = $7`,
        [
          spotlight.title,
          spotlight.metaDescription,
          spotlight.historyMarkdown,
          spotlight.brandPositioning,
          JSON.stringify(spotlight.notableModels),
          JSON.stringify(spotlight.milestones),
          manufacturerId,
        ],
      );
    } else {
      await pool.query(
        `INSERT INTO manufacturer_spotlights (
          manufacturer_id, slug, title, meta_description, history_markdown,
          brand_positioning, notable_models, milestones, is_published, published_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, true, NOW())`,
        [
          manufacturerId,
          slug,
          spotlight.title,
          spotlight.metaDescription,
          spotlight.historyMarkdown,
          spotlight.brandPositioning,
          JSON.stringify(spotlight.notableModels),
          JSON.stringify(spotlight.milestones),
        ],
      );
    }

    console.log(`✅ ${manufacturerName}: "${spotlight.title}"`);
  }

  console.log("\nDone! Manufacturer spotlights seeded.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

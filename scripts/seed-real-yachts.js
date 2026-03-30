require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') });
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Real sailing yacht manufacturers and popular models
const manufacturers = [
  { name: 'Bavaria Yachts', country: 'Germany', foundedYear: 1978, websiteUrl: 'https://www.bavariayachts.com', description: 'German yacht builder known for quality production sailing yachts' },
  { name: 'Catalina Yachts', country: 'USA', foundedYear: 1969, websiteUrl: 'https://www.catalinayachts.com', description: 'American sailboat manufacturer, one of the largest in the world' },
  { name: 'Hanse Yachts', country: 'Germany', foundedYear: 1990, websiteUrl: 'https://www.hanseyachts.com', description: 'German yacht builder producing innovative sailing yachts' },
  { name: 'Dufour Yachts', country: 'France', foundedYear: 1964, websiteUrl: 'https://www.dufour-yachts.com', description: 'French sailboat manufacturer with a heritage of performance cruising yachts' },
  { name: 'Lagoon', country: 'France', foundedYear: 1984, websiteUrl: 'https://www.cata-lagoon.com', description: 'World leader in cruising catamarans' },
  { name: 'Hunter Yachts', country: 'USA', foundedYear: 1973, websiteUrl: 'https://www.hunteryachts.com', description: 'American sailboat manufacturer known for innovative cruiser-racers' },
  { name: 'Elan Yachts', country: 'Slovenia', foundedYear: 1949, websiteUrl: 'https://www.elan-yachts.com', description: 'Slovenian yacht builder combining performance and comfort' },
  { name: 'Sunbeam Yachts', country: 'Austria', foundedYear: 1968, websiteUrl: 'https://www.sunbeam-yachts.com', description: 'Austrian yacht builder known for premium quality sailing yachts' },
  { name: 'Grand Soleil', country: 'Italy', foundedYear: 1973, websiteUrl: 'https://www.grandsoleil.net', description: 'Italian yacht builder specializing in performance cruiser-racers' },
  { name: 'X-Yachts', country: 'Denmark', foundedYear: 1979, websiteUrl: 'https://www.x-yachts.com', description: 'Danish yacht builder known for high-performance sailing yachts' },
  { name: 'Swan (Nautor)', country: 'Finland', foundedYear: 1966, websiteUrl: 'https://www.nautorgroup.com', description: 'Finnish builder of luxury sailing yachts, the iconic Swan range' },
  { name: 'Moody Yachts', country: 'UK', foundedYear: 1827, websiteUrl: 'https://www.moodyyachts.com', description: 'Historic British yacht builder, one of the oldest in the world' },
  { name: 'Oyster Yachts', country: 'UK', foundedYear: 1973, websiteUrl: 'https://www.ostryachts.com', description: 'British luxury bluewater sailing yacht builder' },
  { name: 'Wauquiez', country: 'France', foundedYear: 1965, websiteUrl: 'https://www.wauquiez.com', description: 'French shipyard building premium bluewater cruising yachts' },
  { name: 'Hallberg-Rassy', country: 'Sweden', foundedYear: 1974, websiteUrl: 'https://www.hallberg-rassy.com', description: 'Swedish builder of premium bluewater cruising yachts' },
  { name: 'Amel', country: 'France', foundedYear: 1965, websiteUrl: 'https://www.amel.fr', description: 'French builder of luxury bluewater cruising yachts' },
  { name: 'Island Packet', country: 'USA', foundedYear: 1979, websiteUrl: 'https://www.islandpacket.com', description: 'American builder of premium bluewater cruising sailboats' },
  { name: 'Tartan Yachts', country: 'USA', foundedYear: 1971, websiteUrl: 'https://www.tartanyachts.com', description: 'American yacht builder known for performance cruisers' },
  { name: 'Dehler', country: 'Germany', foundedYear: 1963, websiteUrl: 'https://www.dehler.com', description: 'German yacht builder specializing in performance cruiser-racers' },
  { name: 'Delphia Yachts', country: 'Poland', foundedYear: 1990, websiteUrl: 'https://www.delphiayachts.com', description: 'Polish yacht builder producing affordable cruising yachts' },
];

// Real yacht models with accurate specs
const yachtModels = [
  // Bavaria
  { manufacturer: 'Bavaria Yachts', modelName: 'Cruiser 34', year: 2023, lengthOverall: 9.99, beam: 3.42, draft: 1.95, displacement: 5400, ballast: 1500, sailAreaMain: 52, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 2, berths: 6, heads: 1, maxOccupancy: 6, engineHp: 29, engineType: 'Diesel', fuelCapacity: 130, waterCapacity: 160, description: 'The Bavaria Cruiser 34 is a versatile family cruiser with excellent sailing performance and a spacious interior.' },
  { manufacturer: 'Bavaria Yachts', modelName: 'Cruiser 40', year: 2022, lengthOverall: 11.99, beam: 3.99, draft: 2.05, displacement: 7800, ballast: 2100, sailAreaMain: 72, rigType: 'Sloop', keelType: 'Fin keel with bulb', hullMaterial: 'Fiberglass', cabins: 3, berths: 8, heads: 2, maxOccupancy: 8, engineHp: 45, engineType: 'Diesel', fuelCapacity: 200, waterCapacity: 260, description: 'A spacious family cruiser with modern design and excellent handling characteristics.' },
  { manufacturer: 'Bavaria Yachts', modelName: 'Cruiser 46', year: 2024, lengthOverall: 14.27, beam: 4.35, draft: 2.10, displacement: 10500, ballast: 3000, sailAreaMain: 88, rigType: 'Sloop', keelType: 'Fin keel with bulb', hullMaterial: 'Fiberglass', cabins: 4, berths: 10, heads: 2, maxOccupancy: 10, engineHp: 57, engineType: 'Diesel', fuelCapacity: 280, waterCapacity: 360, description: 'Premium family cruiser offering outstanding comfort and impressive sailing performance for longer voyages.' },
  { manufacturer: 'Bavaria Yachts', modelName: 'Vision 42', year: 2021, lengthOverall: 12.55, beam: 4.20, draft: 1.80, displacement: 8200, ballast: 2300, sailAreaMain: 75, rigType: 'Sloop', keelType: 'Shoal draft keel', hullMaterial: 'Fiberglass', cabins: 3, berths: 8, heads: 1, maxOccupancy: 8, engineHp: 45, engineType: 'Diesel', fuelCapacity: 210, waterCapacity: 290, description: 'The Vision 42 combines easy handling with a bright, open interior perfect for coastal cruising.' },

  // Catalina
  { manufacturer: 'Catalina Yachts', modelName: 'Catalina 315', year: 2023, lengthOverall: 9.60, beam: 3.35, draft: 1.52, displacement: 4300, ballast: 1300, sailAreaMain: 44, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 2, berths: 4, heads: 1, maxOccupancy: 6, engineHp: 21, engineType: 'Diesel', fuelCapacity: 95, waterCapacity: 120, description: 'A compact cruiser with surprising interior volume and seaworthy handling for its size.' },
  { manufacturer: 'Catalina Yachts', modelName: 'Catalina 355', year: 2022, lengthOverall: 10.74, beam: 3.58, draft: 1.78, displacement: 6000, ballast: 1800, sailAreaMain: 58, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 2, berths: 6, heads: 1, maxOccupancy: 6, engineHp: 30, engineType: 'Diesel', fuelCapacity: 151, waterCapacity: 189, description: 'One of Catalina\'s most popular models, offering an excellent balance of performance and comfort.' },
  { manufacturer: 'Catalina Yachts', modelName: 'Catalina 425', year: 2024, lengthOverall: 12.80, beam: 4.11, draft: 1.96, displacement: 9300, ballast: 2900, sailAreaMain: 78, rigType: 'Sloop', keelType: 'Fin keel with wing', hullMaterial: 'Fiberglass', cabins: 3, berths: 8, heads: 2, maxOccupancy: 8, engineHp: 45, engineType: 'Diesel', fuelCapacity: 208, waterCapacity: 284, description: 'A modern bluewater cruiser with a spacious cockpit and well-appointed interior for extended cruising.' },
  { manufacturer: 'Catalina Yachts', modelName: 'Catalina 545', year: 2023, lengthOverall: 16.61, beam: 4.88, draft: 2.29, displacement: 14800, ballast: 4500, sailAreaMain: 110, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 4, berths: 10, heads: 3, maxOccupancy: 12, engineHp: 80, engineType: 'Diesel', fuelCapacity: 380, waterCapacity: 490, description: 'Catalina\'s flagship, a true bluewater cruiser with luxurious accommodations and powerful sailing performance.' },

  // Hanse
  { manufacturer: 'Hanse Yachts', modelName: 'Hanse 348', year: 2023, lengthOverall: 10.40, beam: 3.50, draft: 1.85, displacement: 5600, ballast: 1600, sailAreaMain: 55, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 2, berths: 6, heads: 1, maxOccupancy: 6, engineHp: 29, engineType: 'Diesel', fuelCapacity: 130, waterCapacity: 180, description: 'Easy to sail single-handed with self-tacking jib and all lines led aft.' },
  { manufacturer: 'Hanse Yachts', modelName: 'Hanse 415', year: 2022, lengthOverall: 12.40, beam: 3.95, draft: 2.05, displacement: 8100, ballast: 2400, sailAreaMain: 72, rigType: 'Sloop', keelType: 'Fin keel with bulb', hullMaterial: 'Fiberglass', cabins: 3, berths: 6, heads: 1, maxOccupancy: 8, engineHp: 40, engineType: 'Diesel', fuelCapacity: 180, waterCapacity: 240, description: 'A fast cruiser with Hanse\'s signature easy-sailing concept and modern interior design.' },
  { manufacturer: 'Hanse Yachts', modelName: 'Hanse 458', year: 2024, lengthOverall: 13.60, beam: 4.30, draft: 2.10, displacement: 10200, ballast: 3100, sailAreaMain: 90, rigType: 'Sloop', keelType: 'Fin keel with bulb', hullMaterial: 'Fiberglass', cabins: 3, berths: 8, heads: 2, maxOccupancy: 8, engineHp: 57, engineType: 'Diesel', fuelCapacity: 250, waterCapacity: 320, description: 'Premium performance cruiser designed for comfortable long-distance sailing with a powerful rig.' },
  { manufacturer: 'Hanse Yachts', modelName: 'Hanse 548', year: 2023, lengthOverall: 16.20, beam: 4.76, draft: 2.40, displacement: 14000, ballast: 4200, sailAreaMain: 115, rigType: 'Sloop', keelType: 'Fin keel with bulb', hullMaterial: 'Fiberglass', cabins: 4, berths: 10, heads: 2, maxOccupancy: 10, engineHp: 80, engineType: 'Diesel', fuelCapacity: 360, waterCapacity: 440, description: 'Luxurious performance cruiser for ambitious sailors seeking speed and comfort on ocean passages.' },

  // Dufour
  { manufacturer: 'Dufour Yachts', modelName: 'Dufour 390 Grand Large', year: 2023, lengthOverall: 11.30, beam: 3.90, draft: 1.85, displacement: 6200, ballast: 1800, sailAreaMain: 65, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 3, berths: 6, heads: 1, maxOccupancy: 8, engineHp: 40, engineType: 'Diesel', fuelCapacity: 160, waterCapacity: 220, description: 'Elegant cruiser combining performance with a bright, comfortable interior.' },
  { manufacturer: 'Dufour Yachts', modelName: 'Dufour 430 Grand Large', year: 2022, lengthOverall: 12.75, beam: 4.20, draft: 1.95, displacement: 8400, ballast: 2500, sailAreaMain: 82, rigType: 'Sloop', keelType: 'Fin keel with bulb', hullMaterial: 'Fiberglass', cabins: 3, berths: 8, heads: 2, maxOccupancy: 8, engineHp: 55, engineType: 'Diesel', fuelCapacity: 200, waterCapacity: 280, description: 'A performance-oriented cruiser with a powerful sail plan and well-designed deck layout.' },
  { manufacturer: 'Dufour Yachts', modelName: 'Dufour 530', year: 2024, lengthOverall: 15.35, beam: 4.74, draft: 2.20, displacement: 12600, ballast: 3800, sailAreaMain: 105, rigType: 'Sloop', keelType: 'Fin keel with bulb', hullMaterial: 'Fiberglass', cabins: 4, berths: 10, heads: 3, maxOccupancy: 10, engineHp: 75, engineType: 'Diesel', fuelCapacity: 320, waterCapacity: 400, description: 'Dufour\'s flagship combining race-bred performance with luxury cruising accommodations.' },

  // Lagoon (catamarans)
  { manufacturer: 'Lagoon', modelName: 'Lagoon 40', year: 2023, lengthOverall: 11.74, beam: 6.76, draft: 1.35, displacement: 9200, ballast: 0, sailAreaMain: 95, rigType: 'Sloop', keelType: 'Daggerboards', hullMaterial: 'Fiberglass', cabins: 4, berths: 8, heads: 4, maxOccupancy: 12, engineHp: 45, engineType: 'Diesel', fuelCapacity: 300, waterCapacity: 340, description: 'A compact cruising catamaran offering exceptional space and stability for family sailing.' },
  { manufacturer: 'Lagoon', modelName: 'Lagoon 46', year: 2022, lengthOverall: 13.99, beam: 7.94, draft: 1.30, displacement: 12500, ballast: 0, sailAreaMain: 120, rigType: 'Sloop', keelType: 'Daggerboards', hullMaterial: 'Fiberglass', cabins: 4, berths: 12, heads: 4, maxOccupancy: 14, engineHp: 57, engineType: 'Diesel', fuelCapacity: 400, waterCapacity: 500, description: 'Spacious cruising catamaran with flybridge and elegant interior designed for comfortable living aboard.' },
  { manufacturer: 'Lagoon', modelName: 'Lagoon 51', year: 2024, lengthOverall: 15.24, beam: 8.50, draft: 1.40, displacement: 16000, ballast: 0, sailAreaMain: 140, rigType: 'Sloop', keelType: 'Daggerboards', hullMaterial: 'Fiberglass', cabins: 6, berths: 14, heads: 6, maxOccupancy: 16, engineHp: 80, engineType: 'Diesel', fuelCapacity: 520, waterCapacity: 620, description: 'Luxury catamaran with immense living space, perfect for charter or long-range cruising.' },

  // Elan
  { manufacturer: 'Elan Yachts', modelName: 'Elan E3', year: 2023, lengthOverall: 9.18, beam: 3.18, draft: 1.80, displacement: 3900, ballast: 1200, sailAreaMain: 50, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 2, berths: 4, heads: 1, maxOccupancy: 6, engineHp: 18, engineType: 'Diesel', fuelCapacity: 80, waterCapacity: 100, description: 'A sporty cruiser-racer designed by Rob Humphreys with excellent upwind performance.' },
  { manufacturer: 'Elan Yachts', modelName: 'Elan E4', year: 2022, lengthOverall: 10.50, beam: 3.49, draft: 1.90, displacement: 5100, ballast: 1500, sailAreaMain: 62, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 2, berths: 6, heads: 1, maxOccupancy: 6, engineHp: 29, engineType: 'Diesel', fuelCapacity: 110, waterCapacity: 140, description: 'Performance cruiser with an aggressive sail plan and refined interior, ideal for club racing and fast cruising.' },
  { manufacturer: 'Elan Yachts', modelName: 'Elan E6', year: 2024, lengthOverall: 13.10, beam: 4.10, draft: 2.15, displacement: 8200, ballast: 2600, sailAreaMain: 95, rigType: 'Sloop', keelType: 'Fin keel with bulb', hullMaterial: 'Fiberglass', cabins: 3, berths: 8, heads: 2, maxOccupancy: 8, engineHp: 45, engineType: 'Diesel', fuelCapacity: 180, waterCapacity: 250, description: 'High-performance cruiser that excels both on the race course and during long-distance passages.' },

  // Dehler
  { manufacturer: 'Dehler', modelName: 'Dehler 30 OD', year: 2023, lengthOverall: 9.15, beam: 3.15, draft: 1.90, displacement: 3600, ballast: 1200, sailAreaMain: 52, rigType: 'Sloop', keelType: 'Fin keel with bulb', hullMaterial: 'Fiberglass', cabins: 1, berths: 4, heads: 1, maxOccupancy: 6, engineHp: 18, engineType: 'Diesel', fuelCapacity: 60, waterCapacity: 80, description: 'A pure one-design racer with carbon construction options and a high-performance sail plan.' },
  { manufacturer: 'Dehler', modelName: 'Dehler 38', year: 2022, lengthOverall: 11.30, beam: 3.65, draft: 2.00, displacement: 6500, ballast: 2000, sailAreaMain: 75, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 2, berths: 6, heads: 1, maxOccupancy: 8, engineHp: 29, engineType: 'Diesel', fuelCapacity: 130, waterCapacity: 170, description: 'Fast cruiser-racer with a well-balanced hull and dual-purpose interior for racing and cruising.' },
  { manufacturer: 'Dehler', modelName: 'Dehler 46', year: 2024, lengthOverall: 14.00, beam: 4.35, draft: 2.25, displacement: 10200, ballast: 3200, sailAreaMain: 105, rigType: 'Sloop', keelType: 'Fin keel with bulb', hullMaterial: 'Fiberglass', cabins: 3, berths: 8, heads: 2, maxOccupancy: 10, engineHp: 57, engineType: 'Diesel', fuelCapacity: 230, waterCapacity: 300, description: 'A powerful performance cruiser designed for ambitious sailors seeking both speed and luxury.' },

  // X-Yachts
  { manufacturer: 'X-Yachts', modelName: 'X4³', year: 2023, lengthOverall: 12.80, beam: 3.90, draft: 2.15, displacement: 7800, ballast: 2500, sailAreaMain: 82, rigType: 'Sloop', keelType: 'Fin keel with bulb', hullMaterial: 'Fiberglass', cabins: 3, berths: 6, heads: 1, maxOccupancy: 8, engineHp: 40, engineType: 'Diesel', fuelCapacity: 160, waterCapacity: 220, description: 'A true performance cruiser with exceptional build quality and sailing characteristics.' },
  { manufacturer: 'X-Yachts', modelName: 'X5⁶', year: 2024, lengthOverall: 17.00, beam: 4.95, draft: 2.60, displacement: 14500, ballast: 4800, sailAreaMain: 130, rigType: 'Sloop', keelType: 'Fin keel with bulb', hullMaterial: 'Fiberglass', cabins: 4, berths: 10, heads: 2, maxOccupancy: 10, engineHp: 80, engineType: 'Diesel', fuelCapacity: 350, waterCapacity: 440, description: 'The flagship X-Yacht offering the ultimate combination of luxury and high-performance sailing.' },

  // Swan
  { manufacturer: 'Swan (Nautor)', modelName: 'Swan 48', year: 2023, lengthOverall: 14.60, beam: 4.42, draft: 2.55, displacement: 11800, ballast: 3800, sailAreaMain: 98, rigType: 'Sloop', keelType: 'Fin keel with bulb', hullMaterial: 'Fiberglass', cabins: 3, berths: 6, heads: 2, maxOccupancy: 8, engineHp: 75, engineType: 'Diesel', fuelCapacity: 300, waterCapacity: 380, description: 'An iconic bluewater cruiser combining Finnish craftsmanship with elegant design by German Frers.' },
  { manufacturer: 'Swan (Nautor)', modelName: 'Swan 55', year: 2024, lengthOverall: 16.75, beam: 4.80, draft: 2.80, displacement: 15500, ballast: 5200, sailAreaMain: 125, rigType: 'Sloop', keelType: 'Fin keel with bulb', hullMaterial: 'Fiberglass', cabins: 4, berths: 8, heads: 2, maxOccupancy: 10, engineHp: 110, engineType: 'Diesel', fuelCapacity: 400, waterCapacity: 500, description: 'Luxury bluewater cruiser offering world-class sailing performance and supremely comfortable living spaces.' },

  // Amel
  { manufacturer: 'Amel', modelName: 'Amel 50', year: 2023, lengthOverall: 14.90, beam: 4.70, draft: 2.10, displacement: 13200, ballast: 4000, sailAreaMain: 105, rigType: 'Ketch', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 3, berths: 6, heads: 2, maxOccupancy: 8, engineHp: 110, engineType: 'Diesel', fuelCapacity: 520, waterCapacity: 620, description: 'Purpose-built bluewater cruiser with legendary Amel quality and go-anywhere capability.' },
  { manufacturer: 'Amel', modelName: 'Amel 60', year: 2024, lengthOverall: 18.00, beam: 5.20, draft: 2.30, displacement: 18500, ballast: 5800, sailAreaMain: 145, rigType: 'Ketch', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 4, berths: 8, heads: 3, maxOccupancy: 10, engineHp: 150, engineType: 'Diesel', fuelCapacity: 700, waterCapacity: 800, description: 'The ultimate bluewater sailing yacht, designed for circumnavigation with unparalleled comfort and safety.' },

  // Oyster
  { manufacturer: 'Oyster Yachts', modelName: 'Oyster 495', year: 2023, lengthOverall: 15.10, beam: 4.60, draft: 2.40, displacement: 14200, ballast: 4600, sailAreaMain: 112, rigType: 'Sloop', keelType: 'Fin keel with bulb', hullMaterial: 'Fiberglass', cabins: 3, berths: 6, heads: 2, maxOccupancy: 8, engineHp: 110, engineType: 'Diesel', fuelCapacity: 450, waterCapacity: 500, description: 'Luxury bluewater cruiser built for safe, comfortable ocean passages with a dedicated crew layout option.' },
  { manufacturer: 'Oyster Yachts', modelName: 'Oyster 565', year: 2024, lengthOverall: 17.10, beam: 5.00, draft: 2.60, displacement: 18000, ballast: 5800, sailAreaMain: 138, rigType: 'Sloop', keelType: 'Fin keel with bulb', hullMaterial: 'Fiberglass', cabins: 4, berths: 8, heads: 3, maxOccupancy: 10, engineHp: 150, engineType: 'Diesel', fuelCapacity: 600, waterCapacity: 700, description: 'World-class bluewater cruiser offering luxurious accommodation and powerful sailing performance.' },

  // More Beneteau models
  { manufacturer: 'Beneteau', modelName: 'First 24', year: 2023, lengthOverall: 7.30, beam: 2.50, draft: 1.50, displacement: 1800, ballast: 600, sailAreaMain: 30, rigType: 'Sloop', keelType: 'Lifting keel', hullMaterial: 'Fiberglass', cabins: 1, berths: 4, heads: 0, maxOccupancy: 4, engineHp: 0, engineType: 'Outboard', fuelCapacity: 20, waterCapacity: 0, description: 'A nimble daysailer and weekender with a retractable keel for easy trailering and shallow-water exploration.' },
  { manufacturer: 'Beneteau', modelName: 'First 27', year: 2022, lengthOverall: 8.20, beam: 2.80, draft: 1.60, displacement: 2200, ballast: 750, sailAreaMain: 38, rigType: 'Sloop', keelType: 'Lifting keel', hullMaterial: 'Fiberglass', cabins: 1, berths: 4, heads: 0, maxOccupancy: 4, engineHp: 0, engineType: 'Outboard', fuelCapacity: 25, waterCapacity: 30, description: 'A versatile sporty sailboat designed for both competitive racing and weekend cruising adventures.' },
  { manufacturer: 'Beneteau', modelName: 'Oceanis 40.1', year: 2024, lengthOverall: 12.43, beam: 3.92, draft: 1.85, displacement: 7400, ballast: 2100, sailAreaMain: 71, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 3, berths: 8, heads: 2, maxOccupancy: 8, engineHp: 45, engineType: 'Diesel', fuelCapacity: 200, waterCapacity: 260, description: 'A best-selling cruiser offering unmatched interior space and a choice of keel options for different sailing grounds.' },
  { manufacturer: 'Beneteau', modelName: 'Oceanis 46.1', year: 2023, lengthOverall: 14.16, beam: 4.35, draft: 1.95, displacement: 9800, ballast: 2900, sailAreaMain: 88, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 4, berths: 10, heads: 2, maxOccupancy: 10, engineHp: 57, engineType: 'Diesel', fuelCapacity: 260, waterCapacity: 320, description: 'A luxurious cruiser with a powerful hull designed by Marc Lombard, offering exhilarating sailing and supreme comfort.' },

  // More Jeanneau models
  { manufacturer: 'Jeanneau', modelName: 'Sun Odyssey 380', year: 2024, lengthOverall: 11.22, beam: 3.76, draft: 1.80, displacement: 5800, ballast: 1700, sailAreaMain: 62, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 2, berths: 6, heads: 1, maxOccupancy: 6, engineHp: 30, engineType: 'Diesel', fuelCapacity: 145, waterCapacity: 195, description: 'Modern cruiser with Marc Lombard hull design, offering responsive helm feel and a well-lit interior.' },
  { manufacturer: 'Jeanneau', modelName: 'Sun Odyssey 410', year: 2023, lengthOverall: 12.44, beam: 4.05, draft: 1.95, displacement: 7600, ballast: 2300, sailAreaMain: 76, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 3, berths: 8, heads: 2, maxOccupancy: 8, engineHp: 40, engineType: 'Diesel', fuelCapacity: 180, waterCapacity: 240, description: 'Award-winning cruiser with innovative walk-around sidedecks and a spacious, ergonomic cockpit.' },
  { manufacturer: 'Jeanneau', modelName: 'Sun Odyssey 490', year: 2022, lengthOverall: 14.60, beam: 4.49, draft: 2.24, displacement: 11400, ballast: 3400, sailAreaMain: 100, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 4, berths: 10, heads: 2, maxOccupancy: 10, engineHp: 75, engineType: 'Diesel', fuelCapacity: 280, waterCapacity: 380, description: 'A large, comfortable cruiser designed for long-distance sailing with family and friends.' },

  // Moody
  { manufacturer: 'Moody Yachts', modelName: 'Moody 41', year: 2023, lengthOverall: 12.50, beam: 4.10, draft: 1.80, displacement: 8500, ballast: 2600, sailAreaMain: 72, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 3, berths: 6, heads: 2, maxOccupancy: 8, engineHp: 55, engineType: 'Diesel', fuelCapacity: 220, waterCapacity: 300, description: 'A deck saloon cruiser offering panoramic views from the salon and excellent bluewater capability.' },
  { manufacturer: 'Moody Yachts', modelName: 'Moody 45', year: 2022, lengthOverall: 13.72, beam: 4.30, draft: 1.90, displacement: 10200, ballast: 3200, sailAreaMain: 88, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 3, berths: 8, heads: 2, maxOccupancy: 8, engineHp: 75, engineType: 'Diesel', fuelCapacity: 280, waterCapacity: 360, description: 'A distinctive deck saloon yacht combining the comfort of a motor yacht with sailing performance.' },

  // Hallberg-Rassy additional
  { manufacturer: 'Hallberg-Rassy', modelName: 'Hallberg-Rassy 340', year: 2023, lengthOverall: 10.42, beam: 3.35, draft: 1.80, displacement: 6200, ballast: 2200, sailAreaMain: 55, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 2, berths: 6, heads: 1, maxOccupancy: 6, engineHp: 30, engineType: 'Diesel', fuelCapacity: 150, waterCapacity: 200, description: 'A compact bluewater cruiser built to Hallberg-Rassy\'s exacting standards with a protected center cockpit.' },
  { manufacturer: 'Hallberg-Rassy', modelName: 'Hallberg-Rassy 44', year: 2024, lengthOverall: 13.54, beam: 4.02, draft: 1.95, displacement: 10200, ballast: 3500, sailAreaMain: 88, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 3, berths: 6, heads: 2, maxOccupancy: 8, engineHp: 55, engineType: 'Diesel', fuelCapacity: 260, waterCapacity: 350, description: 'A serious bluewater cruiser with legendary Hallberg-Rassy build quality, designed for comfortable ocean sailing.' },

  // Island Packet
  { manufacturer: 'Island Packet', modelName: 'Island Packet 349', year: 2023, lengthOverall: 10.52, beam: 3.58, draft: 1.22, displacement: 5900, ballast: 2000, sailAreaMain: 52, rigType: 'Cutter', keelType: 'Full keel', hullMaterial: 'Fiberglass', cabins: 2, berths: 4, heads: 1, maxOccupancy: 6, engineHp: 30, engineType: 'Diesel', fuelCapacity: 140, waterCapacity: 190, description: 'A sturdy full-keel cruiser designed for safe, comfortable cruising with shallow draft capability.' },

  // Wauquiez
  { manufacturer: 'Wauquiez', modelName: 'Wauquiez PS 42', year: 2023, lengthOverall: 12.80, beam: 4.10, draft: 2.10, displacement: 8800, ballast: 2800, sailAreaMain: 80, rigType: 'Sloop', keelType: 'Fin keel with bulb', hullMaterial: 'Fiberglass', cabins: 3, berths: 6, heads: 2, maxOccupancy: 8, engineHp: 55, engineType: 'Diesel', fuelCapacity: 200, waterCapacity: 280, description: 'A performance cruiser designed for fast passage-making with a luxurious interior finished to the highest standards.' },

  // Grand Soleil
  { manufacturer: 'Grand Soleil', modelName: 'Grand Soleil 40', year: 2024, lengthOverall: 12.20, beam: 3.80, draft: 2.15, displacement: 7200, ballast: 2400, sailAreaMain: 85, rigType: 'Sloop', keelType: 'Fin keel with bulb', hullMaterial: 'Fiberglass', cabins: 3, berths: 6, heads: 1, maxOccupancy: 8, engineHp: 40, engineType: 'Diesel', fuelCapacity: 150, waterCapacity: 200, description: 'Italian-designed performance cruiser-racer with a powerful hull and refined accommodations.' },

  // Sunbeam
  { manufacturer: 'Sunbeam Yachts', modelName: 'Sunbeam 32.1', year: 2023, lengthOverall: 9.75, beam: 3.20, draft: 1.70, displacement: 4500, ballast: 1400, sailAreaMain: 48, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 2, berths: 4, heads: 1, maxOccupancy: 6, engineHp: 21, engineType: 'Diesel', fuelCapacity: 80, waterCapacity: 120, description: 'An Austrian-built quality cruiser with meticulous craftsmanship and a comfortable, seaworthy design.' },

  // Tartan
  { manufacturer: 'Tartan Yachts', modelName: 'Tartan 365', year: 2023, lengthOverall: 11.12, beam: 3.58, draft: 1.88, displacement: 6200, ballast: 2000, sailAreaMain: 65, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 2, berths: 6, heads: 1, maxOccupancy: 6, engineHp: 30, engineType: 'Diesel', fuelCapacity: 140, waterCapacity: 180, description: 'American-built performance cruiser with a reputation for quality construction and excellent sailing manners.' },

  // Delphia
  { manufacturer: 'Delphia Yachts', modelName: 'Delphia 31', year: 2023, lengthOverall: 9.45, beam: 3.25, draft: 1.60, displacement: 3800, ballast: 1100, sailAreaMain: 44, rigType: 'Sloop', keelType: 'Fin keel', hullMaterial: 'Fiberglass', cabins: 2, berths: 4, heads: 1, maxOccupancy: 6, engineHp: 18, engineType: 'Diesel', fuelCapacity: 80, waterCapacity: 100, description: 'An affordable and well-built entry-level cruiser ideal for coastal sailing and weekend getaways.' },
];

async function seed() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get existing manufacturers
    const existingMfg = await client.query('SELECT id, name FROM manufacturers');
    const mfgMap = new Map(existingMfg.rows.map(r => [r.name, r.id]));
    console.log(`Existing manufacturers: ${mfgMap.size}`);

    // Insert new manufacturers
    for (const mfg of manufacturers) {
      if (mfgMap.has(mfg.name)) {
        console.log(`  Manufacturer exists: ${mfg.name}`);
        continue;
      }
      const res = await client.query(
        `INSERT INTO manufacturers (name, country, founded_year, website_url, description)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [mfg.name, mfg.country, mfg.foundedYear, mfg.websiteUrl, mfg.description]
      );
      mfgMap.set(mfg.name, res.rows[0].id);
      console.log(`  Added manufacturer: ${mfg.name} (id: ${res.rows[0].id})`);
    }

    // Get existing yacht model names to avoid duplicates
    const existingYachts = await client.query('SELECT model_name, manufacturer_id FROM yacht_models');
    const existingSet = new Set(existingYachts.rows.map(r => `${r.manufacturer_id}:${r.model_name}`));
    console.log(`\nExisting yacht models: ${existingSet.size}`);

    // Insert yacht models
    let added = 0;
    for (const yacht of yachtModels) {
      const mfgId = mfgMap.get(yacht.manufacturer);
      if (!mfgId) {
        console.log(`  SKIP ${yacht.manufacturer} ${yacht.modelName} - no manufacturer found`);
        continue;
      }
      const key = `${mfgId}:${yacht.modelName}`;
      if (existingSet.has(key)) {
        console.log(`  SKIP ${yacht.manufacturer} ${yacht.modelName} - already exists`);
        continue;
      }

      const slug = slugify(`${yacht.manufacturer}-${yacht.modelName}`);
      await client.query(
        `INSERT INTO yacht_models (
          manufacturer_id, model_name, year, slug,
          length_overall, beam, draft, displacement, ballast, sail_area_main,
          rig_type, keel_type, hull_material,
          cabins, berths, heads, max_occupancy,
          engine_hp, engine_type, fuel_capacity, water_capacity,
          description
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)`,
        [
          mfgId, yacht.modelName, yacht.year, slug,
          yacht.lengthOverall, yacht.beam, yacht.draft, yacht.displacement, yacht.ballast, yacht.sailAreaMain,
          yacht.rigType, yacht.keelType, yacht.hullMaterial,
          yacht.cabins, yacht.berths, yacht.heads, yacht.maxOccupancy,
          yacht.engineHp, yacht.engineType, yacht.fuelCapacity, yacht.waterCapacity,
          yacht.description
        ]
      );
      added++;
      console.log(`  Added: ${yacht.manufacturer} ${yacht.modelName} (${yacht.year})`);
    }

    await client.query('COMMIT');
    console.log(`\nDone! Added ${added} new yacht models.`);

    // Summary
    const total = await client.query('SELECT COUNT(*) as count FROM yacht_models');
    const totalMfg = await client.query('SELECT COUNT(*) as count FROM manufacturers');
    console.log(`Totals: ${total.rows[0].count} yachts, ${totalMfg.rows[0].count} manufacturers`);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(e => { console.error(e); process.exit(1); });

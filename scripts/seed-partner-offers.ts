import { db, manufacturers, partnerOffers } from "@/lib/db";

async function seedPartnerOffers() {
  console.log("🌟 Seeding partner offers...");

  // Get manufacturers
  const manufacturerRows = await db.select().from(manufacturers);
  if (manufacturerRows.length === 0) {
    console.log("❌ No manufacturers found. Please seed manufacturers first.");
    return;
  }

  // Sample partner offers data
  const sampleOffers = [
    // Beneteau offers
    {
      manufacturerId: manufacturerRows.find(m => m.name.toLowerCase().includes('beneteau'))?.id || 1,
      dealerName: "Mediterranean Yacht Sales",
      dealerType: "dealer",
      contactName: "Jean Dupont",
      email: "sales@mediterraneanyachts.com",
      phone: "+33 4 93 56 78 90",
      websiteUrl: "https://www.mediterraneanyachts.com",
      locationCity: "Marseille",
      locationCountry: "France",
      serviceArea: "Provence-Alpes-Côte d'Azur",
      specializations: ["New Sales", "Brokerage", "Service"],
      offerType: "new_sales",
      offerTitle: "Beneteau Oceanis 38.1 - New Yachts Available",
      offerDescription: "Authorized Beneteau dealer offering new Oceanis 38.1 models with full factory warranty. Competitive pricing and flexible financing options available.",
      priceRangeMin: 180000,
      priceRangeMax: 220000,
      currency: "EUR",
      dataSource: "Official Dealer Network",
      sourceConfidence: 5,
      isActive: true,
    },
    {
      manufacturerId: manufacturerRows.find(m => m.name.toLowerCase().includes('beneteau'))?.id || 1,
      dealerName: "Atlantic Marine Services",
      dealerType: "service",
      contactName: "Sarah Williams",
      email: "service@atlanticmarine.fr",
      phone: "+33 2 98 56 78 90",
      locationCity: "La Rochelle",
      locationCountry: "France",
      serviceArea: "Brittany and Loire Valley",
      specializations: ["Service", "Repair", "Parts"],
      offerType: "service",
      offerTitle: "Authorized Beneteau Service & Repair Center",
      offerDescription: "Factory-certified service center for all Beneteau models. Full maintenance, repairs, and genuine parts availability. Open year-round.",
      priceRangeMin: 75,
      priceRangeMax: 150,
      currency: "EUR",
      dataSource: "Service Network",
      sourceConfidence: 5,
      isActive: true,
    },
    {
      manufacturerId: manufacturerRows.find(m => m.name.toLowerCase().includes('beneteau'))?.id || 1,
      dealerName: "Caribbean Yacht Brokers",
      dealerType: "broker",
      contactName: "Mike Johnson",
      email: "mike@caribbanyachts.com",
      phone: "+1 305 555 0123",
      websiteUrl: "https://www.caribbanyachts.com",
      locationCity: "Miami",
      locationCountry: "United States",
      serviceArea: "Caribbean and Florida",
      specializations: ["Brokerage", "Charter", "Consultation"],
      offerType: "brokerage",
      offerTitle: "Professional Beneteau Yacht Brokerage",
      offerDescription: "Specialized brokerage services for Beneteau sailboats. Expert knowledge of models from past 20 years. Worldwide marketing network.",
      priceRangeMin: 50000,
      priceRangeMax: 500000,
      currency: "USD",
      dataSource: "Brokerage Network",
      sourceConfidence: 4,
      isActive: true,
    },

    // Jeanneau offers
    {
      manufacturerId: manufacturerRows.find(m => m.name.toLowerCase().includes('jeanneau'))?.id || 2,
      dealerName: "Nordic Yacht Center",
      dealerType: "dealer",
      contactName: "Erik Svensson",
      email: "info@nordicyacht.se",
      phone: "+46 8 123 456 78",
      websiteUrl: "https://www.nordicyacht.se",
      locationCity: "Stockholm",
      locationCountry: "Sweden",
      serviceArea: "Sweden, Norway, Denmark",
      specializations: ["New Sales", "Used Sales"],
      offerType: "new_sales",
      offerTitle: "Jeanneau Sun Odyssey 349 - New Stock",
      offerDescription: "Authorized Jeanneau dealer with multiple Sun Odyssey 349 in stock. Extended manufacturer warranty included. Professional delivery service available.",
      priceRangeMin: 165000,
      priceRangeMax: 195000,
      currency: "EUR",
      validityStart: new Date("2024-01-01"),
      validityEnd: new Date("2024-12-31"),
      dataSource: "Official Dealer Network",
      sourceConfidence: 5,
      isActive: true,
    },
    {
      manufacturerId: manufacturerRows.find(m => m.name.toLowerCase().includes('jeanneau'))?.id || 2,
      dealerName: "Baltic Marine Services",
      dealerType: "chandler",
      contactName: "Anna Petrov",
      email: "parts@balticmarine.lv",
      phone: "+371 67 123 456",
      locationCity: "Riga",
      locationCountry: "Latvia",
      serviceArea: "Baltic States",
      specializations: ["Parts", "Chandlery", "Consultation"],
      offerType: "parts",
      offerTitle: "Jeanneau Parts & Chandlery Specialist",
      offerDescription: "Complete inventory of genuine Jeanneau parts and accessories. Fast shipping across Baltic region. Expert advice for maintenance and upgrades.",
      priceRangeMin: 25,
      priceRangeMax: 2500,
      currency: "EUR",
      dataSource: "Parts Network",
      sourceConfidence: 4,
      isActive: true,
    },

    // Bavaria offers
    {
      manufacturerId: manufacturerRows.find(m => m.name.toLowerCase().includes('bavaria'))?.id || 3,
      dealerName: "Adriatic Yacht Sales",
      dealerType: "dealer",
      contactName: "Marko Kovac",
      email: "sales@adriatic-yachts.hr",
      phone: "+385 91 234 567",
      websiteUrl: "https://www.adriatic-yachts.hr",
      locationCity: "Split",
      locationCountry: "Croatia",
      serviceArea: "Dalmatia Coast",
      specializations: ["New Sales", "Charter"],
      offerType: "new_sales",
      offerTitle: "Bavaria Cruiser 37 - Mediterranean Delivery",
      offerDescription: "Authorized Bavaria dealer offering new Cruiser 37 with Mediterranean delivery package. VAT compliant sales for EU clients. Charter options available.",
      priceRangeMin: 190000,
      priceRangeMax: 235000,
      currency: "EUR",
      validityStart: new Date("2024-06-01"),
      validityEnd: new Date("2024-12-31"),
      dataSource: "Official Dealer Network",
      sourceConfidence: 5,
      isActive: true,
    },

    // Default offers for manufacturers without specific ones
    ...manufacturerRows.map(manufacturer => ({
      manufacturerId: manufacturer.id,
      dealerName: `${manufacturer.name} Official Network`,
      dealerType: "manufacturer",
      contactName: "Partner Network Manager",
      email: "partners@manufacturer.com",
      phone: "+1 800 555 0199",
      locationCity: manufacturer.country || "Global",
      locationCountry: manufacturer.country || "International",
      serviceArea: "Global",
      specializations: ["Authorized Sales", "Service", "Support"],
      offerType: "new_sales",
      offerTitle: `${manufacturer.name} Official Sales Network`,
      offerDescription: `Official ${manufacturer.name} sales and service network with authorized dealers worldwide. Full manufacturer warranty and support.`,
      priceRangeMin: 50000,
      priceRangeMax: 1000000,
      currency: "EUR",
      dataSource: "Manufacturer Direct",
      sourceConfidence: 5,
      isActive: true,
    })).slice(0, 3), // Limit to 3 default offers
  ];

  // Insert offers
  let insertedCount = 0;
  for (const offer of sampleOffers) {
    try {
      // Check if offer already exists
      const existing = await db
        .select()
        .from(partnerOffers)
        .where({
          manufacturerId: offer.manufacturerId,
          dealerName: offer.dealerName,
        })
        .limit(1);

      if (existing.length === 0) {
        await db.insert(partnerOffers).values(offer);
        insertedCount++;
        console.log(`✅ Added partner offer: ${offer.dealerName} for manufacturer ${offer.manufacturerId}`);
      } else {
        console.log(`⏭️ Partner offer already exists: ${offer.dealerName}`);
      }
    } catch (error) {
      console.error(`❌ Error adding partner offer ${offer.dealerName}:`, error);
    }
  }

  console.log(`🎉 Seeding completed! Added ${insertedCount} partner offers.`);
}

// Run the seed
seedPartnerOffers().catch(console.error);
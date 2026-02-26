import { NextRequest, NextResponse } from "next/server";
import { db, yachtModels, manufacturers } from "@/lib/db";
import { eq } from "drizzle-orm";

// Simple API key auth middleware
function authorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization") || "";
  const key = authHeader.replace("Bearer ", "");
  // In production, use a secure env variable and proper hashing
  return key === process.env.ADMIN_API_KEY;
}

export async function GET() {
  if (!authorized({ headers: { authorization: "" } } as any)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const yachts = await db
      .select({
        yacht: yachtModels,
        manufacturer: manufacturers.name,
      })
      .from(yachtModels)
      .leftJoin(manufacturers, eq(yachtModels.manufacturerId, manufacturers.id))
      .orderBy(yachtModels.modelName);

    return NextResponse.json(
      yachts.map((y) => ({
        ...y.yacht,
        manufacturer: y.manufacturer,
      })),
    );
  } catch (error) {
    console.error("Error fetching admin yachts:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    // Insert/update logic would go here
    return NextResponse.json({ message: "Not implemented yet" });
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

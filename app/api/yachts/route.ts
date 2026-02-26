import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { yachts } from "@/drizzle/schema";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const sort = searchParams.get("sort") || "manufacturer";
  const order = searchParams.get("order") || "asc";
  const manufacturers = searchParams.get("manufacturers");

  const offset = (page - 1) * limit;
  const where = manufacturers
    ? { manufacturer: { in: manufacturers.split(",").filter(Boolean) } }
    : undefined;
  const orderBy: any = {};
  orderBy[sort] = order;

  const [data, total] = await Promise.all([
    db.select().from(yachts).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ count: yachts.id }).where(where).then((res) => res[0]?.count ?? 0),
  ]);

  return NextResponse.json({
    yachts: data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

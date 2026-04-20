/**
 * Admin API: List and update feature flags
 *
 * GET  /api/admin/flags — list all flags with current values
 * POST /api/admin/flags — update a flag's override value
 *
 * Both endpoints require admin authentication.
 */

import { NextRequest, NextResponse } from "next/server";
import { getFlagDefinitions, getAllFlags, type FlagKey } from "@/lib/feature-flags";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const isAdmin = (session.user as any).role === "admin";
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const definitions = getFlagDefinitions();
    const currentValues = getAllFlags();

    const result = Object.entries(definitions).map(([key, def]) => ({
      key,
      type: def.type,
      description: def.description,
      defaultValue: def.defaultValue,
      currentValue: currentValues[key as FlagKey],
      ...(def.type === "variant" ? { variants: (def as any).variants } : {}),
      envOverride: process.env[`FEATURE_FLAG_${key.toUpperCase().replace(/\./g, "_")}`] ?? null,
    }));

    return NextResponse.json({ flags: result, total: result.length });
  } catch (error) {
    console.error("[flags] Error listing flags:", error);
    return NextResponse.json(
      { error: "Failed to list feature flags" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAdmin = (session.user as any).role === "admin";
    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || typeof key !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid 'key' field" },
        { status: 400 },
      );
    }

    // Set environment variable override (runtime only — won't persist across deployments)
    const envKey = `FEATURE_FLAG_${key.toUpperCase().replace(/\./g, "_")}`;
    process.env[envKey] = String(value);

    // Verify the flag exists
    const { flags } = await import("@/lib/feature-flags/flags");
    if (!(key in flags)) {
      return NextResponse.json(
        { error: `Unknown flag: ${key}` },
        { status: 404 },
      );
    }

    const flagDef = (flags as any)[key];
    // Validate value
    if (flagDef.type === "boolean" && !["true", "false", "1", "0"].includes(String(value))) {
      return NextResponse.json(
        { error: `Flag ${key} expects a boolean value` },
        { status: 400 },
      );
    }
    if (flagDef.type === "variant" && !flagDef.variants.includes(value)) {
      return NextResponse.json(
        { error: `Flag ${key} expects one of: ${flagDef.variants.join(", ")}` },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      key,
      value: String(value),
      note: "Runtime override set. Will reset on next deployment. Use Vercel environment variables for persistent overrides.",
    });
  } catch (error) {
    console.error("[flags] Error updating flag:", error);
    return NextResponse.json(
      { error: "Failed to update feature flag" },
      { status: 500 },
    );
  }
}

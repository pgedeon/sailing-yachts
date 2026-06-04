import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { getYachtDetailData, getPrimaryImage } from "@/lib/yachts";

// In-memory rate limiter (per IP, resets on redeploy)
const rateLimiter = new Map<string, { count: number; resetAt: number }>();
const MAX_EMAILS_PER_HOUR = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimiter.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }

  if (entry.count >= MAX_EMAILS_PER_HOUR) {
    return true;
  }

  entry.count++;
  return false;
}

// Clean up old entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimiter.entries()) {
      if (now > entry.resetAt) {
        rateLimiter.delete(ip);
      }
    }
  }, 5 * 60 * 1000);
}

export interface EmailYachtRequest {
  recipientEmail: string;
  senderName?: string;
  message?: string;
  yachtSlug: string;
  locale?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Rate limited", message: "Too many emails. Please wait before sending another." },
        { status: 429 }
      );
    }

    const body: EmailYachtRequest = await request.json();
    const { recipientEmail, senderName, message, yachtSlug, locale } = body;

    // Validate recipient email
    if (!recipientEmail || typeof recipientEmail !== "string") {
      return NextResponse.json(
        { error: "Recipient email is required" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail.trim().toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate yacht slug
    if (!yachtSlug || typeof yachtSlug !== "string") {
      return NextResponse.json(
        { error: "Yacht slug is required" },
        { status: 400 }
      );
    }

    // Optional message length check
    if (message && message.length > 500) {
      return NextResponse.json(
        { error: "Message must be 500 characters or less" },
        { status: 400 }
      );
    }

    // Fetch yacht data
    const yachtDataResult = await getYachtDetailData(yachtSlug);
    if (!yachtDataResult) {
      return NextResponse.json(
        { error: "Yacht not found" },
        { status: 404 }
      );
    }

    const yachtRow = yachtDataResult.yacht;
    const manufacturerName = yachtDataResult.manufacturer;
    const imageUrl = await getPrimaryImage(yachtSlug);
    const lang = locale === "fr" ? "fr" : "en";
    const siteBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://info.sailboats.fr";
    const yachtUrl = `${siteBaseUrl}/${lang}/yachts/${yachtSlug}`;

    const yachtDisplayName = `${manufacturerName} ${yachtRow.modelName}`;
    const senderDisplay = senderName?.trim() || undefined;

    // Parse numeric fields from string (Neon decimal columns)
    const loa = yachtRow.lengthOverall ? parseFloat(yachtRow.lengthOverall) : null;
    const beamVal = yachtRow.beam ? parseFloat(yachtRow.beam) : null;
    const draftVal = yachtRow.draft ? parseFloat(yachtRow.draft) : null;
    const dispVal = yachtRow.displacement ? parseFloat(yachtRow.displacement) : null;
    const cabinsVal = yachtRow.cabins;
    const berthsVal = yachtRow.berths;

    // Build subject
    const subject = senderDisplay
      ? `${senderDisplay} recommends the ${yachtDisplayName}`
      : `Check out the ${yachtDisplayName}`;

    // Build HTML email
    const html = buildEmailHtml({
      manufacturer: manufacturerName,
      modelName: yachtRow.modelName,
      year: yachtRow.year,
      lengthOverall: loa,
      beam: beamVal,
      draft: draftVal,
      displacement: dispVal,
      cabins: cabinsVal,
      berths: berthsVal,
      rigType: yachtRow.rigType,
      hullMaterial: yachtRow.hullMaterial,
      keelType: yachtRow.keelType,
      yachtDisplayName,
      yachtUrl,
      imageUrl,
      senderName: senderDisplay,
      message: message?.trim() || undefined,
      lang,
    });

    const text = buildEmailText({
      manufacturer: manufacturerName,
      modelName: yachtRow.modelName,
      year: yachtRow.year,
      lengthOverall: loa,
      beam: beamVal,
      draft: draftVal,
      displacement: dispVal,
      cabins: cabinsVal,
      berths: berthsVal,
      yachtDisplayName,
      yachtUrl,
      senderName: senderDisplay,
      message: message?.trim() || undefined,
      lang,
    });

    // Send email
    const result = await sendEmail({
      to: recipientEmail.trim().toLowerCase(),
      subject,
      html,
      text,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to send email", details: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error: any) {
    console.error("[email-yacht] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

interface SpecParams {
  manufacturer: string;
  modelName: string;
  year: number;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  cabins: number | null;
  berths: number | null;
  rigType: string | null;
  hullMaterial: string | null;
  keelType: string | null;
  yachtDisplayName: string;
  yachtUrl: string;
  imageUrl: string | null;
  senderName?: string;
  message?: string;
  lang: string;
}

function buildEmailHtml(params: SpecParams): string {
  const { yachtDisplayName, yachtUrl, imageUrl, senderName, message, lang, year,
    lengthOverall, beam, draft, displacement, cabins, berths, rigType, hullMaterial, keelType } = params;
  const isFr = lang === "fr";

  const specRows = [
    { label: isFr ? "Longueur hors tout" : "Length Overall", value: lengthOverall ? `${lengthOverall} m` : null },
    { label: isFr ? "Largeur" : "Beam", value: beam ? `${beam} m` : null },
    { label: isFr ? "Tirant d\u2019eau" : "Draft", value: draft ? `${draft} m` : null },
    { label: isFr ? "D\u00e9placement" : "Displacement", value: displacement ? `${displacement.toLocaleString()} kg` : null },
    { label: isFr ? "Cabines" : "Cabins", value: cabins?.toString() || null },
    { label: isFr ? "Couchettes" : "Berths", value: berths?.toString() || null },
    { label: isFr ? "Gr\u00e9ement" : "Rig Type", value: rigType },
    { label: isFr ? "Quille" : "Keel Type", value: keelType },
    { label: isFr ? "Coque" : "Hull Material", value: hullMaterial },
  ].filter((row) => row.value);

  const greeting = senderName
    ? (isFr ? `${senderName} vous recommande ce voilier` : `${senderName} recommends this yacht`)
    : (isFr ? "D\u00e9couvrez ce voilier" : "Check out this yacht");

  const siteBaseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://info.sailboats.fr";

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${yachtDisplayName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;">
    <!-- Header -->
    <tr>
      <td style="padding:24px 32px;background:#1e3a5f;text-align:center;">
        <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:600;">
          \u26f5 ${greeting}
        </h1>
      </td>
    </tr>
    ${imageUrl ? `
    <!-- Yacht Image -->
    <tr>
      <td style="padding:0;">
        <img src="${imageUrl}" alt="${yachtDisplayName}" style="width:100%;max-height:300px;object-fit:cover;display:block;" />
      </td>
    </tr>` : ""}
    <!-- Yacht Name -->
    <tr>
      <td style="padding:24px 32px 8px;">
        <h2 style="margin:0;font-size:24px;color:#1e3a5f;">${yachtDisplayName}${year ? ` (${year})` : ""}</h2>
      </td>
    </tr>
    ${message ? `
    <!-- Personal Message -->
    <tr>
      <td style="padding:8px 32px 16px;">
        <div style="background:#f0f7ff;border-left:4px solid #2563eb;padding:12px 16px;border-radius:0 8px 8px 0;font-style:italic;color:#374151;">
          ${escapeHtml(message)}
        </div>
      </td>
    </tr>` : ""}
    <!-- Specs Table -->
    <tr>
      <td style="padding:8px 32px 24px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          ${specRows.map((row) => `
          <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#6b7280;font-size:14px;width:40%;">${row.label}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#1f2937;font-size:14px;font-weight:500;">${row.value}</td>
          </tr>`).join("")}
        </table>
      </td>
    </tr>
    <!-- CTA Button -->
    <tr>
      <td style="padding:0 32px 32px;text-align:center;">
        <a href="${yachtUrl}" style="display:inline-block;padding:14px 32px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
          ${isFr ? "Voir les d\u00e9tails complets" : "View Full Details"} \u2192
        </a>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="padding:16px 32px;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          ${isFr ? "Envoy\u00e9 via" : "Sent via"} <a href="${siteBaseUrl}" style="color:#6b7280;">Sailing Yacht Info</a>
          ${isFr ? " \u2014 Sp\u00e9cifications d\u00e9taill\u00e9es de voiliers" : " \u2014 Detailed sailing yacht specifications"}
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildEmailText(params: {
  manufacturer: string;
  modelName: string;
  year: number;
  lengthOverall: number | null;
  beam: number | null;
  draft: number | null;
  displacement: number | null;
  cabins: number | null;
  berths: number | null;
  yachtDisplayName: string;
  yachtUrl: string;
  senderName?: string;
  message?: string;
  lang: string;
}): string {
  const { yachtDisplayName, yachtUrl, senderName, message, lang, year,
    lengthOverall, beam, draft, displacement, cabins, berths } = params;
  const isFr = lang === "fr";

  const greeting = senderName
    ? (isFr ? `${senderName} vous recommande ce voilier` : `${senderName} recommends this yacht`)
    : (isFr ? "D\u00e9couvrez ce voilier" : "Check out this yacht");

  const lines = [
    greeting,
    "",
    `${yachtDisplayName}${year ? ` (${year})` : ""}`,
    "",
  ];

  if (lengthOverall) lines.push(`${isFr ? "Longueur" : "Length"}: ${lengthOverall} m`);
  if (beam) lines.push(`${isFr ? "Largeur" : "Beam"}: ${beam} m`);
  if (draft) lines.push(`${isFr ? "Tirant d\u2019eau" : "Draft"}: ${draft} m`);
  if (displacement) lines.push(`${isFr ? "D\u00e9placement" : "Displacement"}: ${displacement.toLocaleString()} kg`);
  if (cabins) lines.push(`${isFr ? "Cabines" : "Cabins"}: ${cabins}`);
  if (berths) lines.push(`${isFr ? "Couchettes" : "Berths"}: ${berths}`);

  lines.push("");
  if (message) {
    lines.push(`"${message}"`);
    lines.push("");
  }

  lines.push(`${isFr ? "Voir les d\u00e9tails" : "View details"}: ${yachtUrl}`);
  lines.push("");
  lines.push(`\u2014 ${isFr ? "Envoy\u00e9 via" : "Sent via"} Sailing Yacht Info`);

  return lines.join("\n");
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

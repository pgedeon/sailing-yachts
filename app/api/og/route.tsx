import { ImageResponse } from "next/og";

export const runtime = "edge";

const WIDTH = 1200;
const HEIGHT = 630;

function trimText(value: string | null, maxLength: number, fallback: string): string {
  if (!value) return fallback;

  const normalized = value.trim();
  if (!normalized) return fallback;

  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength - 1)}…`
    : normalized;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const title = trimText(searchParams.get("title"), 64, "Sailing Yacht Specs");
  const description = trimText(
    searchParams.get("description"),
    80,
    "Manufacturer profile and dimensions",
  );
  const length = trimText(searchParams.get("length"), 24, "Detailed specs");

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "56px",
          position: "relative",
          overflow: "hidden",
          background:
            "linear-gradient(135deg, #082f49 0%, #0f5fa8 42%, #38bdf8 100%)",
          color: "#f8fafc",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: "-120px",
            top: "-120px",
            width: "420px",
            height: "420px",
            borderRadius: "999px",
            background: "rgba(255,255,255,0.10)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "-40px",
            bottom: "-160px",
            width: "520px",
            height: "320px",
            borderRadius: "999px",
            background: "rgba(14, 165, 233, 0.16)",
          }}
        />

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "32px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(248,250,252,0.92)",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.22)",
                fontSize: "24px",
              }}
            >
              ⛵
            </div>
            <div>Sailing Yachts Database</div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "210px",
              padding: "16px 24px",
              borderRadius: "999px",
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.22)",
              fontSize: "26px",
              fontWeight: 700,
            }}
          >
            {length}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            maxWidth: "900px",
            gap: "18px",
            zIndex: 1,
          }}
        >
          <div
            style={{
              fontSize: "84px",
              lineHeight: 1,
              fontWeight: 800,
              letterSpacing: "-0.04em",
              wordBreak: "break-word",
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: "34px",
              lineHeight: 1.25,
              color: "rgba(226,232,240,0.95)",
            }}
          >
            {description}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "24px",
            fontSize: "28px",
            color: "rgba(226,232,240,0.96)",
            zIndex: 1,
          }}
        >
          <div style={{ display: "flex", gap: "18px" }}>
            <span>Specs</span>
            <span>•</span>
            <span>Comparisons</span>
            <span>•</span>
            <span>Reviews</span>
          </div>
          <div style={{ fontWeight: 600 }}>sailing-yachts.vercel.app</div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
    },
  );
}

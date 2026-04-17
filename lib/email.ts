/**
 * Email sending utility using Resend API.
 * Falls back to logging when RESEND_API_KEY is not configured.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

const RESEND_API_URL = "https://api.resend.com/emails";
const FROM_ADDRESS = process.env.EMAIL_FROM || "Sailing Yacht Info <alerts@sailboats.fr>";

/**
 * Send an email via Resend API.
 * If RESEND_API_KEY is not set, logs the email and returns success.
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[email] No RESEND_API_KEY — would send to ${payload.to}: ${payload.subject}`);
    return { success: true, messageId: `mock-${Date.now()}` };
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_ADDRESS,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[email] Resend API error (${response.status}):`, errorBody);
      return { success: false, error: `HTTP ${response.status}: ${errorBody}` };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error: any) {
    console.error("[email] Send error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate a secure unsubscribe token.
 */
export function generateUnsubscribeToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const array = new Uint8Array(48);
  // Use crypto.getRandomValues if available (Node 15+)
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for older Node
    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array)
    .map((b) => chars[b % chars.length])
    .join("");
}

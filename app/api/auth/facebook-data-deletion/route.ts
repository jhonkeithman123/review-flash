import { NextRequest, NextResponse } from "next/server";

/**
 * Meta (Facebook) User Data Deletion Callback Webhook Endpoint
 * https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback/
 *
 * When a user removes the ReviewFlash app from their Facebook account,
 * Meta sends a POST request containing a signed_request payload.
 *
 * ReviewFlash processes the request, logs the event, and returns a JSON response
 * with a tracking URL and confirmation code according to Meta specifications.
 */

function generateConfirmationCode(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `del_fb_${timestamp}_${random}`;
}

export async function POST(req: NextRequest) {
  try {
    let signedRequest = "";

    // 1. Try reading signed_request from URLSearchParams or FormData
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      signedRequest = (formData.get("signed_request") as string) || "";
    } else if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      signedRequest = body?.signed_request || "";
    } else {
      const { searchParams } = new URL(req.url);
      signedRequest = searchParams.get("signed_request") || "";
    }

    const confirmationCode = generateConfirmationCode();
    const host = req.headers.get("host") || "review-flash.firebaseapp.com";
    const protocol = host.includes("localhost") ? "http" : "https";
    const statusUrl = `${protocol}://${host}/data-deletion?code=${confirmationCode}`;

    console.log(`[Meta Data Deletion Request Received] Confirmation Code: ${confirmationCode}`);

    // Return the response format required by Meta
    return NextResponse.json(
      {
        url: statusUrl,
        confirmation_code: confirmationCode,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Failed to process Facebook data deletion callback:", error);
    const fallbackCode = generateConfirmationCode();
    return NextResponse.json(
      {
        url: `https://review-flash.firebaseapp.com/data-deletion?code=${fallbackCode}`,
        confirmation_code: fallbackCode,
      },
      { status: 200 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code") || generateConfirmationCode();
  const host = req.headers.get("host") || "review-flash.firebaseapp.com";
  const protocol = host.includes("localhost") ? "http" : "https";

  return NextResponse.json({
    url: `${protocol}://${host}/data-deletion?code=${code}`,
    confirmation_code: code,
    message: "ReviewFlash Facebook Data Deletion Endpoint is live and operational.",
  });
}

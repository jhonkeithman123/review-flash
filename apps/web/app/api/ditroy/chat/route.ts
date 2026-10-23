import { NextResponse } from "next/server";
import { getDitroyApiUrl } from "@/lib/ditroy";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (typeof body?.message !== "string" || !body.message.trim()) {
      return NextResponse.json(
        { detail: "A non-empty message is required." },
        { status: 400 },
      );
    }

    const response = await fetch(`${getDitroyApiUrl()}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: body.message,
        conversation_id: body.conversation_id || "default",
        user_id: body.user_id,
      }),
      cache: "no-store",
    });

    const responseBody = await response.json();
    return NextResponse.json(responseBody, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        detail:
          error instanceof Error ? error.message : "DITroy AI request failed.",
      },
      { status: 502 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { contactSchema, escapeHtml } from "@/lib/contact";
import { OWNER_EMAIL } from "@/lib/config";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  if (!request.headers.get("content-type")?.includes("application/json"))
    return NextResponse.json(
      { error: "Send a JSON request." },
      { status: 415 },
    );
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin)
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw) > 12000)
      return NextResponse.json(
        { error: "Your letter is too long." },
        { status: 413 },
      );
    let input;
    try {
      input = JSON.parse(raw);
    } catch {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }
    const result = contactSchema.safeParse(input);
    if (!result.success)
      return NextResponse.json(
        {
          error:
            "Enter your name, a valid email, and a message between 10 and 5,000 characters.",
        },
        { status: 400 },
      );
    const { name, email, message, website } = result.data;
    if (website) return NextResponse.json({ success: true });
    const user = process.env.GMAIL_USER,
      pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass)
      return NextResponse.json(
        {
          error: "Email is temporarily unavailable. Please use the email link.",
        },
        { status: 503 },
      );
    const transport = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
    });
    try {
      await transport.sendMail({
        from: { name: "Kevin Chiputra Newspaper", address: user },
        to: OWNER_EMAIL,
        replyTo: { name, address: email },
        subject: "A letter from the portfolio",
        text: `From: ${name}\nEmail: ${email}\n\n${message}`,
        html: `<div style="font-family:Georgia,serif;max-width:600px;padding:32px;background:#fcf9f2"><h1>Letters to the Editor</h1><p>From: ${escapeHtml(name)} &lt;${escapeHtml(email)}&gt;</p><p>${escapeHtml(message).replace(/\r?\n/g, "<br>")}</p></div>`,
      });
    } finally {
      transport.close();
    }
    return NextResponse.json({ success: true });
  } catch {
    console.error("Contact delivery failed");
    return NextResponse.json(
      { error: "Your letter could not be sent. Please try again later." },
      { status: 502 },
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Nodemailer uses native Node.js net/tls modules — must not run on Edge runtime
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 },
      );
    }

    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;

    if (!user || !pass) {
      console.error("Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env.local");
      return NextResponse.json(
        { error: "Email service not configured." },
        { status: 500 },
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Kevin Chiputra Newspaper" <${user}>`,
      to: "chiputrakevin@gmail.com",
      replyTo: email,
      subject: "Email from Personal Website",
      text: `New message from Kevin Chiputra Newspaper contact form.\n\nName: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family:'Georgia',serif;max-width:600px;margin:0 auto;padding:32px;background:#fcf9f2;border:1px solid #e5e2db;">
          <div style="border-bottom:3px solid #000;padding-bottom:16px;margin-bottom:24px;">
            <p style="font-family:'Courier New',monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.3em;color:#777;margin:0 0 8px;">
              Kevin Chiputra Newspaper — Incoming Correspondence
            </p>
            <h1 style="font-size:28px;font-weight:900;margin:0;letter-spacing:-0.02em;">
              Letters to the Editor
            </h1>
          </div>

          <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
            <tr>
              <td style="font-family:'Courier New',monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#777;padding:8px 0;border-bottom:1px solid #e5e2db;width:100px;">From</td>
              <td style="font-size:14px;padding:8px 0 8px 16px;border-bottom:1px solid #e5e2db;">${name}</td>
            </tr>
            <tr>
              <td style="font-family:'Courier New',monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#777;padding:8px 0;border-bottom:1px solid #e5e2db;">Reply To</td>
              <td style="font-size:14px;padding:8px 0 8px 16px;border-bottom:1px solid #e5e2db;">
                <a href="mailto:${email}" style="color:#000;">${email}</a>
              </td>
            </tr>
          </table>

          <div style="border-left:4px solid #000;padding-left:20px;margin-bottom:32px;">
            <p style="font-size:16px;line-height:1.7;margin:0;font-style:italic;">
              ${message.replace(/\n/g, "<br/>")}
            </p>
          </div>

          <div style="border-top:1px solid #e5e2db;padding-top:16px;">
            <p style="font-family:'Courier New',monospace;font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#aaa;margin:0;">
              © ${new Date().getFullYear()} Kevin Chiputra — Kevin Chiputra Newspaper
            </p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Contact form error:", err);
    return NextResponse.json(
      { error: "Failed to send message. Please try again." },
      { status: 500 },
    );
  }
}

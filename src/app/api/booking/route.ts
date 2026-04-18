import pool from "@/lib/db";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { name, email, phone, organization, eventType, location, dates, message } = await request.json() as {
      name: string; email: string; phone: string; organization: string;
      eventType: string; location: string; dates: string[]; message: string;
    };

    if (!name?.trim() || !email?.trim() || !organization?.trim()) {
      return Response.json({ error: "Name, email, and organization are required." }, { status: 400 });
    }

    const preferredDates = Array.isArray(dates) ? dates.join(", ") : (dates || "");

    // Save to DB
    await pool.execute(
      "INSERT INTO booking_submissions (name, email, phone, organization, event_type, location, preferred_dates, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [name.trim(), email.trim(), phone?.trim() || "", organization.trim(), eventType?.trim() || "", location?.trim() || "", preferredDates, message?.trim() || ""]
    );

    // Attempt email if SMTP configured
    try {
      const [cfgRows] = await pool.execute(
        "SELECT smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name FROM email_config LIMIT 1"
      );
      const cfgs = cfgRows as { smtp_host: string; smtp_port: number; smtp_user: string; smtp_password: string; from_email: string; from_name: string }[];
      const cfg = cfgs[0];

      if (cfg?.smtp_host && cfg?.smtp_user) {
        const transporter = nodemailer.createTransport({
          host: cfg.smtp_host,
          port: cfg.smtp_port || 587,
          secure: (cfg.smtp_port || 587) === 465,
          auth: { user: cfg.smtp_user, pass: cfg.smtp_password },
        });

        const details = [
          `Name: ${name}`,
          `Email: ${email}`,
          `Phone: ${phone || "—"}`,
          `Organization: ${organization}`,
          `Event Type: ${eventType || "—"}`,
          `Location: ${location || "—"}`,
          `Preferred Dates: ${preferredDates || "—"}`,
          `\nAdditional Details:\n${message || "—"}`,
        ].join("\n");

        await transporter.sendMail({
          from: `"${cfg.from_name || "Website"}" <${cfg.from_email || cfg.smtp_user}>`,
          to: cfg.from_email || cfg.smtp_user,
          replyTo: email,
          subject: `[Booking Inquiry] ${eventType || "Event"} — ${organization}`,
          text: details,
          html: details.replace(/\n/g, "<br/>"),
        });
      }
    } catch {
      // Email failed silently
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Booking form error:", error);
    return Response.json({ error: "Failed to submit. Please try again." }, { status: 500 });
  }
}

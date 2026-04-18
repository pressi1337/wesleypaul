import pool from "@/lib/db";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json() as {
      name: string; email: string; subject: string; message: string;
    };

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return Response.json({ error: "Name, email, and message are required." }, { status: 400 });
    }

    // Save to DB
    await pool.execute(
      "INSERT INTO contact_submissions (name, email, subject, message) VALUES (?, ?, ?, ?)",
      [name.trim(), email.trim(), subject?.trim() || "", message.trim()]
    );

    // Attempt to send email if SMTP is configured
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

        await transporter.sendMail({
          from: `"${cfg.from_name || "Website"}" <${cfg.from_email || cfg.smtp_user}>`,
          to: cfg.from_email || cfg.smtp_user,
          replyTo: email,
          subject: `[Contact Form] ${subject || "New Message"} — from ${name}`,
          text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
          html: `<p><strong>Name:</strong> ${name}</p><p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p><p><strong>Subject:</strong> ${subject}</p><hr/><p>${message.replace(/\n/g, "<br/>")}</p>`,
        });
      }
    } catch {
      // Email failed — submission is saved in DB so no error returned to user
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return Response.json({ error: "Failed to submit. Please try again." }, { status: 500 });
  }
}

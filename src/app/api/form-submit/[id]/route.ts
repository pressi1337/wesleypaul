import pool from '@/lib/db';
import { ensureTables } from '@/lib/init-db';
import nodemailer from 'nodemailer';

interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder: string;
  required: boolean;
  options: string[];
}

interface FormRow {
  id: number;
  name: string;
  fields_json: unknown;
  success_message: string;
}

function parseFields(raw: unknown): FormField[] {
  if (Array.isArray(raw)) return raw as FormField[];
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as FormField[]; } catch { return []; }
  }
  return [];
}

function buildEmailHtml(formName: string, fields: FormField[], data: Record<string, string>): string {
  const rows = fields
    .map(f => {
      const value = data[f.id];
      if (!value && value !== '0') return '';
      const display = f.type === 'checkbox' ? (value === 'true' ? '✔ Yes' : '✘ No') : String(value);
      return `
        <tr>
          <td style="padding:10px 14px;font-weight:600;color:#374151;white-space:nowrap;border-bottom:1px solid #f1f5f9;width:35%">${f.label || f.id}</td>
          <td style="padding:10px 14px;color:#0f172a;border-bottom:1px solid #f1f5f9">${display.replace(/\n/g, '<br/>')}</td>
        </tr>`;
    })
    .filter(Boolean)
    .join('');

  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto">
      <div style="background:#0d1b2e;padding:20px 28px;border-radius:8px 8px 0 0">
        <h2 style="color:#fff;margin:0;font-size:18px">New Form Submission</h2>
        <p style="color:rgba(255,255,255,0.65);margin:4px 0 0;font-size:13px">${formName}</p>
      </div>
      <div style="border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;overflow:hidden">
        <table style="width:100%;border-collapse:collapse">${rows}</table>
      </div>
      <p style="color:#94a3b8;font-size:11px;margin-top:16px;text-align:center">
        Submitted via Wesley Paul International Ministries website
      </p>
    </div>`;
}

function buildEmailText(formName: string, fields: FormField[], data: Record<string, string>): string {
  const lines = [`New Form Submission: ${formName}`, ''];
  for (const f of fields) {
    const value = data[f.id];
    if (!value && value !== '0') continue;
    const display = f.type === 'checkbox' ? (value === 'true' ? 'Yes' : 'No') : String(value);
    lines.push(`${f.label || f.id}: ${display}`);
  }
  return lines.join('\n');
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  await ensureTables();

  try {
    const [rows] = await pool.execute('SELECT * FROM forms WHERE id = ?', [id]);
    const forms = rows as FormRow[];
    if (forms.length === 0) return Response.json({ error: 'Form not found' }, { status: 404 });

    const form = forms[0];
    const fields = parseFields(form.fields_json);
    const data = await request.json() as Record<string, string>;

    // Validate required fields
    const errors: Record<string, string> = {};
    for (const field of fields) {
      if (field.required && (!data[field.id] || !String(data[field.id]).trim())) {
        errors[field.id] = `${field.label} is required`;
      }
    }
    if (Object.keys(errors).length > 0) {
      return Response.json({ error: 'Validation failed', errors }, { status: 422 });
    }

    // Save submission to DB
    await pool.execute(
      'INSERT INTO form_submissions (form_id, form_name, data_json) VALUES (?, ?, ?)',
      [form.id, form.name, JSON.stringify(data)]
    );

    // Send email notification
    try {
      const [cfgRows] = await pool.execute(
        'SELECT smtp_host, smtp_port, smtp_user, smtp_password, from_email, from_name FROM email_config LIMIT 1'
      );
      const cfgs = cfgRows as {
        smtp_host: string; smtp_port: number;
        smtp_user: string; smtp_password: string;
        from_email: string; from_name: string;
      }[];
      const cfg = cfgs[0];

      if (cfg?.smtp_host && cfg?.smtp_user) {
        const transporter = nodemailer.createTransport({
          host: cfg.smtp_host,
          port: cfg.smtp_port || 587,
          secure: (cfg.smtp_port || 587) === 465,
          auth: { user: cfg.smtp_user, pass: cfg.smtp_password },
        });

        // Use submitter's email as replyTo if an email field exists
        const emailField = fields.find(f => f.type === 'email');
        const replyTo = emailField ? data[emailField.id] : undefined;

        // Recipient: from_email (notify address) or fall back to smtp_user
        const to = cfg.from_email || cfg.smtp_user;

        await transporter.sendMail({
          from: `"${cfg.from_name || 'Website'}" <${cfg.from_email || cfg.smtp_user}>`,
          to,
          ...(replyTo ? { replyTo } : {}),
          subject: `[Form] ${form.name}`,
          text: buildEmailText(form.name, fields, data),
          html: buildEmailHtml(form.name, fields, data),
        });
      }
    } catch {
      // Email failure is non-fatal — submission is already saved in DB
    }

    return Response.json({ success: true, message: form.success_message });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

import pool from '@/lib/db';
import { ensureTables } from '@/lib/init-db';

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
  fields_json: unknown; // mysql2 returns JSON columns as already-parsed objects
  success_message: string;
}

/** Safely extract a fields array regardless of whether mysql2 already parsed the JSON column */
function parseFields(raw: unknown): FormField[] {
  if (Array.isArray(raw)) return raw as FormField[];
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as FormField[]; } catch { return []; }
  }
  return [];
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

    await pool.execute(
      'INSERT INTO form_submissions (form_id, form_name, data_json) VALUES (?, ?, ?)',
      [form.id, form.name, JSON.stringify(data)]
    );

    return Response.json({ success: true, message: form.success_message });
  } catch (error) {
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

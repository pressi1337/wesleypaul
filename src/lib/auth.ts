import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'wesleypaul-cms-secret-2024';

export interface AdminPayload {
  id: number;
  username: string;
}

export function signToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload;
  } catch {
    return null;
  }
}

export function getAdminFromRequest(request: Request): AdminPayload | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = Object.fromEntries(
    cookieHeader.split(';').map((c) => {
      const [k, ...v] = c.trim().split('=');
      return [k.trim(), v.join('=')];
    })
  );

  const token = cookies['admin_token'];
  if (!token) return null;

  return verifyToken(token);
}

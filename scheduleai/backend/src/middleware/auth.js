import { OAuth2Client } from 'google-auth-library';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.slice(7);

    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const googleId = payload.sub;
    const email = payload.email || '';
    const name = payload.name || null;

    let user = await prisma.user.findUnique({ where: { googleId } });
    if (!user) {
      // Try to link by email (preserves data for existing users)
      user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        user = await prisma.user.update({ where: { id: user.id }, data: { googleId } });
      } else {
        user = await prisma.user.create({
          data: { googleId, email, name, settings: { create: {} } },
        });
      }
    }

    req.user = user;
    req.prisma = prisma;
    next();
  } catch (err) {
    next(err);
  }
}

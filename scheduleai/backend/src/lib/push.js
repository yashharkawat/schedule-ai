import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured — push notifications disabled');
    return;
  }
  webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@scheduleai.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  vapidConfigured = true;
}

export async function sendPush(subscription, payload) {
  ensureVapid();
  if (!vapidConfigured) return;

  const pushSub = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
  };

  try {
    await webpush.sendNotification(pushSub, JSON.stringify(payload));
  } catch (err) {
    if (err.statusCode === 410) {
      // Subscription expired — remove it
      await prisma.pushSubscription.deleteMany({
        where: { endpoint: subscription.endpoint },
      });
    } else {
      console.error('Push error:', err.message);
    }
  }
}

export async function sendScheduledNotifications() {
  ensureVapid();
  if (!vapidConfigured) return;

  const nowUtc = new Date();

  // Find all users with notifications enabled
  const settings = await prisma.userSettings.findMany({
    where: {
      notifEnabled: true,
    },
    include: {
      user: {
        include: { pushSubs: true },
      },
    },
  });

  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  for (const s of settings) {
    // Convert UTC time to user's local time using their timezone offset (minutes east of UTC)
    const tzOffset = s.notifTimezone ?? 0;
    const localMs = nowUtc.getTime() + tzOffset * 60 * 1000;
    const localDate = new Date(localMs);
    const currentTime = `${String(localDate.getUTCHours()).padStart(2, '0')}:${String(localDate.getUTCMinutes()).padStart(2, '0')}`;
    const currentDay = dayNames[localDate.getUTCDay()];

    if (s.notifTime !== currentTime) continue;
    const notifDays = Array.isArray(s.notifDays) ? s.notifDays : JSON.parse(s.notifDays || '[]');
    if (!notifDays.includes(currentDay)) continue;
    if (!s.user.pushSubs.length) continue;

    await Promise.all(
      s.user.pushSubs.map(sub => sendPush(sub, {
        title: 'ScheduleAI',
        body: s.notifMessage || 'Time for your session!',
        url: '/',
      }))
    );
  }
}

export function getVapidPublicKey() {
  return process.env.VAPID_PUBLIC_KEY || '';
}

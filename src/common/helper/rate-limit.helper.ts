import { PrismaService } from '@/prisma/prisma.service';

const prisma = new PrismaService();
const MAX_ATTEMPTS = 5;
const PENALTY_STEPS = [60, 180, 300, 600]; // seconds

function normalize(identifier: string, ip: string) {
  return {
    identifier: identifier.trim().toLowerCase(),
    ipAddress: ip || 'unknown',
  };
}

export async function handleAuthFailure(identifier: string, ip: string) {
  const key = normalize(identifier, ip);
  const existing = await prisma.authRateLimit.findFirst({ where: key });
  const attempts = (existing?.attempts ?? 0) + 1;
  const shouldBlock = attempts % MAX_ATTEMPTS === 0;
  const penaltyLevel = shouldBlock
    ? (existing?.penaltyLevel ?? 0) + 1
    : (existing?.penaltyLevel ?? 0);

  const blockSeconds =
    PENALTY_STEPS[Math.min(penaltyLevel - 1, PENALTY_STEPS.length - 1)];

  const data = {
    attempts,
    penaltyLevel,
    blockedUntil: shouldBlock
      ? new Date(Date.now() + blockSeconds * 1000)
      : existing?.blockedUntil,
    lastAttemptAt: new Date(),
  };

  if (existing) {
    await prisma.authRateLimit.update({
      where: { id: existing.id },
      data,
    });
    return;
  }

  await prisma.authRateLimit.create({
    data: {
      ...key,
      ...data,
    },
  });
}

export async function resetAuthLimits(identifier: string, ip: string) {
  const key = normalize(identifier, ip);
  await prisma.authRateLimit.deleteMany({ where: key });
}

export async function getActiveBlockTtl(
  identifier: string,
  ip: string,
): Promise<number> {
  const key = normalize(identifier, ip);
  const record = await prisma.authRateLimit.findFirst({ where: key });

  if (!record?.blockedUntil) return 0;

  const ttl = Math.ceil((record.blockedUntil.getTime() - Date.now()) / 1000);
  if (ttl <= 0) {
    await prisma.authRateLimit.update({
      where: { id: record.id },
      data: { blockedUntil: null },
    });
    return 0;
  }

  return ttl;
}

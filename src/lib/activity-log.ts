import prisma from '@/lib/prisma';

interface LogActivityInput {
  userId: string;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, unknown>;
}

export async function logActivity({ userId, action, entity, entityId, details }: LogActivityInput) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details: details ? JSON.stringify(details) : null,
      },
    });
  } catch (error) {
    console.error('Failed to write activity log:', error);
  }
}

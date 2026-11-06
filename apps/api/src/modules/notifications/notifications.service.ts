import type { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '../../db/prisma.js';
import { AppError } from '../../lib/errors.js';

export class NotificationsService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  async listNotifications(staffUserId: string, limit = 50) {
    const items = await this.prisma.staffNotification.findMany({
      where: { staffUserId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return items.map((n) => ({
      id: n.id,
      staffUserId: n.staffUserId,
      title: n.title,
      message: n.message,
      type: n.type,
      linkUrl: n.linkUrl,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
      readAt: n.readAt?.toISOString() || null,
    }));
  }

  async getUnreadCount(staffUserId: string): Promise<number> {
    return this.prisma.staffNotification.count({
      where: {
        staffUserId,
        isRead: false,
      },
    });
  }

  async markRead(id: string, staffUserId: string) {
    const notification = await this.prisma.staffNotification.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new AppError(404, 'NOT_FOUND', `Notification '${id}' not found`);
    }

    if (notification.staffUserId !== staffUserId) {
      throw new AppError(
        403,
        'FORBIDDEN',
        'You cannot modify notifications belonging to other staff members',
      );
    }

    return this.prisma.staffNotification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllRead(staffUserId: string) {
    return this.prisma.staffNotification.updateMany({
      where: {
        staffUserId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }
}

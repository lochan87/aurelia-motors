import { Router } from 'express';
import { authenticateStaff } from '../../middleware/auth.js';
import { AppError } from '../../lib/errors.js';
import { NotificationsService } from './notifications.service.js';

export function createStaffNotificationsRouter(
  service: NotificationsService = new NotificationsService(),
): Router {
  const router = Router();

  router.use(authenticateStaff);

  router.get('/', async (req, res, next) => {
    try {
      if (!req.staffUser) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }
      const items = await service.listNotifications(req.staffUser.id);
      res.json({ items, total: items.length });
    } catch (err) {
      next(err);
    }
  });

  router.get('/unread-count', async (req, res, next) => {
    try {
      if (!req.staffUser) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }
      const count = await service.getUnreadCount(req.staffUser.id);
      res.json({ unreadCount: count });
    } catch (err) {
      next(err);
    }
  });

  router.patch('/:id/read', async (req, res, next) => {
    try {
      if (!req.staffUser) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }
      const updated = await service.markRead(req.params.id, req.staffUser.id);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  });

  router.post('/mark-all-read', async (req, res, next) => {
    try {
      if (!req.staffUser) {
        throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
      }
      const result = await service.markAllRead(req.staffUser.id);
      res.json({ markedCount: result.count });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

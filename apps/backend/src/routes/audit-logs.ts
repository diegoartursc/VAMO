import { Router, Request, Response } from 'express';
import { adminAuthMiddleware, AdminAuthRequest } from '../middleware/admin-auth';
import prisma from '../lib/prisma';

const router = Router();

/**
 * GET /api/admin/audit-logs
 * Get audit trail with filtering capabilities
 * Query params:
 *   - action: 'CREATE' | 'UPDATE' | 'DELETE'
 *   - target: filter by resource (e.g. 'packages', 'packages/pkg-123')
 *   - who: filter by user who performed action
 *   - startDate: ISO date string (YYYY-MM-DD)
 *   - endDate: ISO date string (YYYY-MM-DD)
 *   - limit: number of records (default 100, max 1000)
 *   - offset: pagination offset (default 0)
 */
router.get('/', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
    try {
        const {
            action,
            target,
            who,
            startDate,
            endDate,
            limit = 100,
            offset = 0,
        } = req.query;

        // Build where clause
        const where: any = {};

        if (action && typeof action === 'string') {
            where.action = action;
        }

        if (target && typeof target === 'string') {
            where.target = { contains: target };
        }

        if (who && typeof who === 'string') {
            where.who = who;
        }

        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate && typeof startDate === 'string') {
                where.timestamp.gte = new Date(startDate);
            }
            if (endDate && typeof endDate === 'string') {
                // Add 1 day to include entire endDate
                const end = new Date(endDate);
                end.setDate(end.getDate() + 1);
                where.timestamp.lt = end;
            }
        }

        // Parse limit and offset
        const parsedLimit = Math.min(parseInt(limit as string) || 100, 1000);
        const parsedOffset = Math.max(parseInt(offset as string) || 0, 0);

        // Fetch audit logs
        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { timestamp: 'desc' },
                take: parsedLimit,
                skip: parsedOffset,
            }),
            prisma.auditLog.count({ where }),
        ]);

        res.json({
            data: logs.map(log => ({
                id: log.id,
                action: log.action,
                target: log.target,
                who: log.who,
                timestamp: log.timestamp,
                ip: log.ip,
                changes: log.changes,
            })),
            pagination: {
                total,
                limit: parsedLimit,
                offset: parsedOffset,
                pages: Math.ceil(total / parsedLimit),
            },
        });
    } catch (error) {
        console.error('[AUDIT] Error fetching audit logs:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

/**
 * GET /api/admin/audit-logs/:id
 * Get details of a specific audit log entry
 */
router.get('/:id', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        if (!id || typeof id !== 'string') {
            return res.status(400).json({ error: 'Invalid ID' });
        }

        const log = await prisma.auditLog.findUnique({
            where: { id: id as string },
        });

        if (!log) {
            return res.status(404).json({ error: 'Audit log not found' });
        }

        res.json(log);
    } catch (error) {
        console.error('[AUDIT] Error fetching audit log:', error);
        res.status(500).json({ error: 'Failed to fetch audit log' });
    }
});

/**
 * GET /api/admin/audit-logs/stats/summary
 * Get summary statistics of audit logs
 */
router.get('/stats/summary', adminAuthMiddleware, async (req: AdminAuthRequest, res: Response) => {
    try {
        const { startDate, endDate } = req.query;

        const where: any = {};
        if (startDate || endDate) {
            where.timestamp = {};
            if (startDate && typeof startDate === 'string') {
                where.timestamp.gte = new Date(startDate);
            }
            if (endDate && typeof endDate === 'string') {
                const end = new Date(endDate);
                end.setDate(end.getDate() + 1);
                where.timestamp.lt = end;
            }
        }

        // Count by action
        const [creates, updates, deletes, totalLogs] = await Promise.all([
            prisma.auditLog.count({ where: { ...where, action: 'CREATE' } }),
            prisma.auditLog.count({ where: { ...where, action: 'UPDATE' } }),
            prisma.auditLog.count({ where: { ...where, action: 'DELETE' } }),
            prisma.auditLog.count({ where }),
        ]);

        // Get top 10 most active users
        const topUsers = await prisma.auditLog.groupBy({
            by: ['who'],
            where,
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });

        // Get top 10 most modified resources
        const topTargets = await prisma.auditLog.groupBy({
            by: ['target'],
            where,
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });

        res.json({
            summary: {
                total: totalLogs,
                creates,
                updates,
                deletes,
            },
            topUsers: topUsers.map(u => ({
                userId: u.who,
                count: u._count.id,
            })),
            topTargets: topTargets.map(t => ({
                resource: t.target,
                count: t._count.id,
            })),
        });
    } catch (error) {
        console.error('[AUDIT] Error fetching audit summary:', error);
        res.status(500).json({ error: 'Failed to fetch audit summary' });
    }
});

export default router;

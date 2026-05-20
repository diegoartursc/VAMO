import { Request, Response, NextFunction } from 'express';
import prisma from '../lib/prisma';

export interface AuditRequest extends Request {
    auditAction?: 'CREATE' | 'UPDATE' | 'DELETE';
    auditTarget?: string;
    auditUser?: string;
    auditOriginalBody?: any;
}

/**
 * Audit middleware — logs all POST/PUT/DELETE operations to audit_logs
 * Must be applied to routes AFTER auth middleware so req.agency or req.traveler are set
 */
export function createAuditMiddleware(action: 'CREATE' | 'UPDATE' | 'DELETE') {
    return async (req: AuditRequest, res: Response, next: NextFunction) => {
        // Capture original request body for UPDATE/DELETE comparison
        req.auditAction = action;
        req.auditOriginalBody = req.body;

        // Determine who is making the request
        const userId =
            (req as any).agency?.agencyId ||
            (req as any).employee?.id ||
            (req as any).traveler?.travelerId ||
            (req as any).admin?.id ||
            'unknown';

        req.auditUser = userId;

        // Extract target from route (e.g. /api/packages/pkg-123 → 'packages/pkg-123')
        const pathParts = req.path.split('/').filter(Boolean);
        const target = pathParts.join('/');
        req.auditTarget = target;

        // Intercept res.json to log after successful response
        const originalJson = res.json.bind(res);
        res.json = function (data: any) {
            // Only log successful operations (2xx status codes)
            if (res.statusCode >= 200 && res.statusCode < 300 && req.auditTarget && req.auditUser) {
                // Log audit asynchronously (don't block response)
                logAudit({
                    action: req.auditAction!,
                    target: req.auditTarget,
                    who: req.auditUser,
                    ip: req.ip,
                    changes: action === 'UPDATE'
                        ? { before: req.auditOriginalBody, after: data }
                        : {},
                }).catch(err => {
                    console.error('[AUDIT] Failed to log operation:', err);
                });
            }
            return originalJson(data);
        };

        next();
    };
}

/**
 * Log an operation to audit_logs table
 */
async function logAudit(params: {
    action: string;
    target: string;
    who: string;
    ip?: string;
    changes?: any;
}) {
    try {
        await prisma.auditLog.create({
            data: {
                action: params.action,
                target: params.target,
                who: params.who,
                ip: params.ip,
                changes: params.changes || {},
            },
        });
    } catch (error) {
        console.error('[AUDIT] Error creating audit log:', error);
        // Don't throw — audit logging shouldn't break the app
    }
}

/**
 * Helper to manually log operations (useful for batch operations)
 */
export async function auditLog(params: {
    action: string;
    target: string;
    who: string;
    ip?: string;
    changes?: any;
}) {
    return logAudit(params);
}

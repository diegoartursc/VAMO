/**
 * Router do Express 4 que encaminha Promises rejeitadas para o error handler
 * (SEC-10). No Express 4 um handler `async` que lança vira unhandledRejection e
 * a requisição fica pendurada; aqui toda rejeição chega ao `next(err)`.
 * Mesma API do `express.Router()`; usar em todas as rotas montadas em app.ts.
 */
import express from 'express';

type AnyFn = (...args: any[]) => any;

function forwardAsyncErrors(fn: unknown): unknown {
    if (typeof fn !== 'function') return fn;
    const handler = fn as AnyFn;
    // Error handlers (4 argumentos) e routers aninhados ficam como estão.
    if (handler.length === 4 || (handler as any).stack) return handler;
    return function wrapped(this: unknown, req: any, res: any, next: AnyFn) {
        try {
            const result = handler.call(this, req, res, next);
            if (result && typeof result.then === 'function') {
                result.then(undefined, (err: unknown) => next(err ?? new Error('Rejected without reason')));
            }
        } catch (err) {
            next(err);
        }
    };
}

const METHODS = ['get', 'post', 'put', 'patch', 'delete', 'all', 'use'] as const;

export function Router(options?: express.RouterOptions): express.Router {
    const router = express.Router(options);
    for (const method of METHODS) {
        const original = (router as any)[method].bind(router);
        (router as any)[method] = (...args: unknown[]) =>
            original(...args.map((arg) => (Array.isArray(arg) ? arg.map(forwardAsyncErrors) : forwardAsyncErrors(arg))));
    }
    return router;
}

import 'dotenv/config';
import app from './app';
import { startReviewRequestScheduler } from './jobs/reviewRequests';
import { startPayoutScheduler } from './jobs/payouts';
import { assertSafeConfig } from './lib/config';

const PORT = process.env.PORT || 3333;

// Recusa subir com configuração insegura (ver lib/config.ts).
assertSafeConfig();

// Express 4 não encaminha Promises rejeitadas: os handlers usam lib/router.ts,
// e isto é a última rede para nunca derrubar o processo por uma rejeição solta.
process.on('unhandledRejection', (reason) => {
    console.error('[process] unhandledRejection:', (reason as any)?.message || reason);
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    startReviewRequestScheduler();
    startPayoutScheduler();
});

export default app;

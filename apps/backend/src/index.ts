import 'dotenv/config';
import app from './app';
import { startReviewRequestScheduler } from './jobs/reviewRequests';
import { startPayoutScheduler } from './jobs/payouts';
import { startCurrencyRatesScheduler } from './lib/currencyRates';
import { assertSafeConfig } from './lib/config';

const PORT = process.env.PORT || 3333;

// Recusa subir com configuração insegura (ver lib/config.ts).
assertSafeConfig();

// Express 4 não encaminha Promises rejeitadas: os handlers usam lib/router.ts,
// e isto é a última rede para nunca derrubar o processo por uma rejeição solta.
process.on('unhandledRejection', (reason) => {
    console.error('[process] unhandledRejection:', (reason as any)?.message || reason);
});

// Fora de produção, só escuta na própria máquina (não expõe o backend local,
// que usa o banco de produção, para a rede).
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : (process.env.HOST || '127.0.0.1');

app.listen(Number(PORT), HOST, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    startReviewRequestScheduler();
    startPayoutScheduler();
    startCurrencyRatesScheduler();
});

export default app;

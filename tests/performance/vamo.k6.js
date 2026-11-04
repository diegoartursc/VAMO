/**
 * Testes de carga da VAMO (k6). Só contra o ambiente ISOLADO local.
 *
 *   k6 run -e PROFILE=smoke tests/performance/vamo.k6.js
 *   k6 run -e PROFILE=load -e VUS=50 tests/performance/vamo.k6.js
 *
 * Perfis: smoke | baseline | load | stress | spike | soak (VUS ajusta o pico).
 * Variáveis: API (padrão http://localhost:4334), FIXTURES (credenciais de teste).
 * Critério de parada: aborta se a taxa de erro inesperado passar de 5%.
 */
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const API = __ENV.API || 'http://localhost:4334';
if (!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(API)) throw new Error('Recusado: k6 só roda contra o ambiente local de auditoria.');
const F = JSON.parse(open(__ENV.FIXTURES || '../security/.fixtures.local.json'));
const PROFILE = __ENV.PROFILE || 'smoke';
const PEAK = Number(__ENV.VUS || 20);

const profiles = {
    smoke: { executor: 'constant-vus', vus: 1, duration: '30s' },
    baseline: { executor: 'constant-vus', vus: 5, duration: '1m' },
    load: { executor: 'ramping-vus', startVUs: 0, stages: [{ duration: '30s', target: PEAK }, { duration: '2m', target: PEAK }, { duration: '20s', target: 0 }] },
    stress: { executor: 'ramping-vus', startVUs: 0, stages: [5, 20, 50, 100, 150, 200].flatMap((t) => [{ duration: '30s', target: Math.min(t, PEAK * 10) }, { duration: '45s', target: Math.min(t, PEAK * 10) }]).concat([{ duration: '20s', target: 0 }]) },
    spike: { executor: 'ramping-vus', startVUs: 0, stages: [{ duration: '20s', target: 5 }, { duration: '10s', target: PEAK * 5 }, { duration: '40s', target: PEAK * 5 }, { duration: '10s', target: 5 }, { duration: '30s', target: 5 }] },
    soak: { executor: 'constant-vus', vus: PEAK, duration: __ENV.DURATION || '20m' },
    step: { executor: 'constant-vus', vus: PEAK, duration: __ENV.DURATION || '45s' },
};

export const options = {
    scenarios: { main: { ...profiles[PROFILE], gracefulStop: '10s' } },
    thresholds: {
        'http_req_duration{critical:yes}': ['p(95)<1000'],
        unexpected_errors: [{ threshold: 'rate<0.01', abortOnFail: false }, { threshold: 'rate<0.05', abortOnFail: true, delayAbortEval: '30s' }],
        cross_user_leak: ['count==0'],
    },
    summaryTrendStats: ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

const unexpected = new Rate('unexpected_errors');
const leak = new Counter('cross_user_leak');
const slow = new Counter('slow_requests_over_1s');
// Métricas do k6 precisam ser criadas no contexto de inicialização.
const NAMES = ['home_featured', 'catalog', 'search_filter', 'detail', 'creator_profile', 'reviews_public', 'me', 'my_trips', 'purchased', 'purchased_other_denied', 'saved', 'creator_stats', 'creator_sales', 'creator_earnings'];
const byEndpoint = Object.fromEntries(NAMES.map((n) => [n, new Trend(`ep_${n}`, true)]));
const trend = (name) => byEndpoint[name];

let ipCounter = 0;
function req(name, method, path, { token, body, expect = [200], critical = true, discard = false } = {}) {
    // Cada VU como um cliente diferente (o limite por IP é medido à parte).
    const headers = { 'x-forwarded-for': `10.${__VU % 250}.${(ipCounter++) % 250}.1`, 'x-request-id': `k6-${__VU}-${__ITER}-${name}` };
    if (token) headers.authorization = `Bearer ${token}`;
    if (body) headers['content-type'] = 'application/json';
    const res = http.request(method, API + path, body ? JSON.stringify(body) : null, { headers, tags: { name, critical: critical ? 'yes' : 'no' }, ...(discard ? { responseType: 'none' } : {}) });
    trend(name).add(res.timings.duration);
    const ok = expect.includes(res.status);
    unexpected.add(!ok);
    if (res.timings.duration > 1000) {
        slow.add(1, { name });
        console.warn(JSON.stringify({ slow: name, ms: Math.round(res.timings.duration), status: res.status, reqId: headers['x-request-id'], vus: __VU }));
    }
    check(res, { [`${name} status ok`]: () => ok });
    return res;
}

export function setup() {
    const tokens = {};
    for (const k of ['buyerA', 'buyerB', 'creatorA', 'creatorB']) {
        const r = http.post(`${API}/api/auth/traveler/login`, JSON.stringify({ email: F[k].email, password: F[k].password }), { headers: { 'content-type': 'application/json', 'x-forwarded-for': `10.250.0.${k.length}` } });
        tokens[k] = r.json('accessToken');
    }
    return { tokens };
}

const DESTS = ['Lisbon', 'Kyoto', 'Cusco', 'Rome', 'Bali'];
const SORTS = ['', 'price_asc', 'rating', 'newest', 'sales'];

export default function ({ tokens }) {
    const I = F.itineraries;
    const r = Math.random();
    if (r < 0.55) {
        group('visitante', () => {
            req('home_featured', 'GET', '/api/itineraries/featured?limit=12', { discard: true });
            req('catalog', 'GET', '/api/itineraries', { discard: true });
            const d = DESTS[Math.floor(Math.random() * DESTS.length)];
            const s = SORTS[Math.floor(Math.random() * SORTS.length)];
            req('search_filter', 'GET', `/api/itineraries?destination=${d}${s ? `&sort=${s}` : ''}`, { discard: true });
            req('detail', 'GET', `/api/itineraries/${Math.random() < 0.5 ? I.A1 : I.B1}`);
            req('creator_profile', 'GET', `/api/creators/${F.creatorA.creatorId}`, { critical: false });
            req('reviews_public', 'GET', `/api/reviews?itineraryId=${I.B1}`, { critical: false });
        });
    } else if (r < 0.9) {
        group('comprador', () => {
            const who = Math.random() < 0.5 ? 'buyerA' : 'buyerB';
            const mine = who === 'buyerA' ? I.A1 : I.B1;
            const other = who === 'buyerA' ? I.B1 : I.A1;
            req('me', 'GET', '/api/auth/traveler/me', { token: tokens[who] });
            const trips = req('my_trips', 'GET', '/api/my-trips', { token: tokens[who] });
            if (trips.body && trips.body.includes(other)) leak.add(1);
            const p = req('purchased', 'GET', `/api/itineraries/${mine}/purchased`, { token: tokens[who] });
            if (p.body && /PAID-SECRET-[A-Z-]*(A1|B1)/.test(p.body) && !p.body.includes(`-${who === 'buyerA' ? 'A1' : 'B1'}`)) leak.add(1);
            const denied = req('purchased_other_denied', 'GET', `/api/itineraries/${other}/purchased`, { token: tokens[who], expect: [401, 403, 404], critical: false });
            if (denied.status === 200) leak.add(1);
            req('saved', 'GET', '/api/saved-items', { token: tokens[who], critical: false });
        });
    } else {
        group('roteirista', () => {
            const who = Math.random() < 0.5 ? 'creatorA' : 'creatorB';
            req('creator_stats', 'GET', '/api/itineraries/dashboard/stats', { token: tokens[who] });
            const sales = req('creator_sales', 'GET', '/api/itineraries/dashboard/sales', { token: tokens[who] });
            if (sales.body && sales.body.includes(who === 'creatorA' ? I.B1 : I.A1)) leak.add(1);
            req('creator_earnings', 'GET', '/api/creators/me/earnings', { token: tokens[who] });
        });
    }
    sleep(Math.random() * 1.5 + 0.5);
}

export function handleSummary(data) {
    const rows = Object.entries(data.metrics).filter(([k]) => k.startsWith('ep_')).map(([k, m]) => ({ endpoint: k.slice(3), p50: m.values.med, p95: m.values['p(95)'], p99: m.values['p(99)'], max: m.values.max }));
    const out = {
        profile: PROFILE, peakVUs: PEAK, ranAt: new Date().toISOString(),
        rps: data.metrics.http_reqs?.values.rate, requests: data.metrics.http_reqs?.values.count,
        p95: data.metrics.http_req_duration?.values['p(95)'], unexpectedErrorRate: data.metrics.unexpected_errors?.values.rate,
        slowOver1s: data.metrics.slow_requests_over_1s?.values.count || 0, leaks: data.metrics.cross_user_leak?.values.count || 0, endpoints: rows,
    };
    return { [`results/k6-${PROFILE}-${PEAK}.json`]: JSON.stringify(out, null, 2), stdout: JSON.stringify(out, null, 2) + '\n' };
}

'use client';

import Link from 'next/link';
import { LEGAL_DOCS, LEGAL_DOC_ORDER, LEGAL_LAST_UPDATED, type LegalDocKey } from '@vamo/shared/legal';

const ROUTES: Record<LegalDocKey, string> = {
  terms: '/termos',
  privacy: '/privacidade',
  refunds: '/reembolsos',
  creators: '/termos-criadores',
};

/** Renders one of the legal documents from @vamo/shared/legal (same text as the app). */
export default function LegalDocPage({ docKey }: { docKey: LegalDocKey }) {
  const doc = LEGAL_DOCS[docKey];
  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f1b2d 0%, #1a3263 50%, #0f1b2d 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '60px 20px',
    }}>
      <div style={{
        maxWidth: 800,
        width: '100%',
        background: 'rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: '48px 40px',
        backdropFilter: 'blur(12px)',
      }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8 }}>{doc.title}</h1>
        <p style={{ color: '#8fa3c4', marginBottom: 8 }}>Last updated: {LEGAL_LAST_UPDATED}</p>
        <p style={{ color: '#c5d0e0', marginBottom: 32 }}>{doc.summary}</p>

        {doc.sections.map((section) => (
          <section key={section.heading} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: '#28c9bf', marginBottom: 8 }}>{section.heading}</h2>
            {section.paragraphs.map((p, i) => (
              <p key={i} style={{ color: '#c5d0e0', lineHeight: 1.7, marginBottom: 10 }}>{p}</p>
            ))}
          </section>
        ))}

        <nav style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {LEGAL_DOC_ORDER.filter((k) => k !== docKey).map((k) => (
            <Link key={k} href={ROUTES[k]} style={{ color: '#28c9bf', textDecoration: 'none', fontWeight: 600 }}>
              {LEGAL_DOCS[k].title}
            </Link>
          ))}
        </nav>
      </div>
    </main>
  );
}

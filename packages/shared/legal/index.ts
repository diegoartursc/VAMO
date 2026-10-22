/**
 * Legal documents (US market) — single source of truth for the app and the site.
 *
 * DRAFT FOR ATTORNEY REVIEW. Bracketed items in LEGAL_PLACEHOLDERS must be filled
 * in with the real company details before launch. This text is not legal advice.
 * Bump LEGAL_VERSION whenever any document changes (used later to record acceptance).
 */

export const LEGAL_VERSION = "2026-10-22";
export const LEGAL_LAST_UPDATED = "October 22, 2026";

export const LEGAL_PLACEHOLDERS = {
    /** Legal name of the LLC that operates VAMO, e.g. "Example Travel LLC". */
    company: "[COMPANY LEGAL NAME], LLC",
    /** State whose law governs the Terms and where disputes are heard. */
    state: "[STATE]",
    /** Business mailing address. */
    address: "[BUSINESS MAILING ADDRESS]",
    /** Official support and privacy contact. */
    email: "vamoappviagens@gmail.com",
} as const;

export type LegalDocKey = "terms" | "privacy" | "refunds" | "creators";

export interface LegalSection {
    heading: string;
    paragraphs: string[];
}

export interface LegalDoc {
    key: LegalDocKey;
    title: string;
    summary: string;
    sections: LegalSection[];
}

const P = LEGAL_PLACEHOLDERS;

const TERMS: LegalDoc = {
    key: "terms",
    title: "Terms of Use",
    summary: "The rules for using VAMO to browse, buy and sell digital travel itineraries.",
    sections: [
        {
            heading: "1. About these Terms",
            paragraphs: [
                `VAMO is a marketplace for digital travel itineraries created by travelers ("Creators") and bought by other travelers ("Buyers"). VAMO is operated by ${P.company} ("VAMO", "we", "us"). By creating an account, buying an itinerary or otherwise using the VAMO app or website (the "Service"), you agree to these Terms, our Privacy Policy and our Refund Policy. If you do not agree, do not use the Service.`,
                "You must be at least 18 years old to create an account or make a purchase.",
            ],
        },
        {
            heading: "2. Your account",
            paragraphs: [
                "You must give accurate information and keep your password secure. You are responsible for everything that happens under your account. Tell us right away at the support email below if you suspect unauthorized use.",
                "One person, one account. Creator features are an extension of your traveler account, not a separate account.",
            ],
        },
        {
            heading: "3. Buying an itinerary",
            paragraphs: [
                "An itinerary is a digital product: a guide with day-by-day plans, recommendations, cost references and tips written by a Creator. When you buy one, you get a personal, non-transferable, non-exclusive license to access and use it for your own travel, with lifetime access through your account for as long as the Service operates.",
                "Prices are shown in US dollars (or the currency shown at checkout). Payments are processed by Stripe; VAMO never sees or stores your full card number. Taxes, if any, are shown at checkout.",
                "You may not copy, resell, redistribute, publicly post or share your purchased itinerary, except through the sharing features the Service provides.",
            ],
        },
        {
            heading: "4. What an itinerary is, and is not",
            paragraphs: [
                "Itineraries reflect the Creator's own trip and opinions. Prices, opening hours, availability, visa and entry rules, health and safety conditions change over time. VAMO and Creators do not guarantee that any information is current, complete or suitable for you. Always verify critical details (flights, bookings, entry requirements, safety) with official sources before you travel.",
                "Travel involves risk. You are solely responsible for your own travel decisions and safety. VAMO does not sell or arrange flights, hotels, tours or transportation, and is not a party to your bookings with third parties.",
            ],
        },
        {
            heading: "5. Content you submit",
            paragraphs: [
                "You keep ownership of content you submit (itineraries, photos, reviews, questions and answers). You grant VAMO a worldwide, non-exclusive, royalty-free license to host, display, reproduce, adapt (for formatting and translation) and promote that content in connection with operating and marketing the Service. For purchased itineraries, this license continues as needed to give Buyers the access they paid for.",
                "You promise that you own or have the rights to what you submit, that it is accurate to the best of your knowledge, that it does not infringe anyone's rights, and that it is not unlawful, misleading, hateful, harassing or sexually explicit.",
                "We may review, reject, remove or suspend content or accounts that violate these Terms or that we reasonably believe could harm users or VAMO.",
            ],
        },
        {
            heading: "6. Acceptable use",
            paragraphs: [
                "Do not: use the Service for anything unlawful; impersonate others; post fake reviews or manipulate ratings; scrape or copy the catalog; attempt to access other accounts or non-public areas; interfere with or overload the Service; upload malware; or circumvent payments (for example, by selling a VAMO itinerary outside the platform).",
            ],
        },
        {
            heading: "7. Creators",
            paragraphs: [
                "Creators who sell itineraries also agree to the Creator Terms. In case of conflict, the Creator Terms control for Creator activity.",
            ],
        },
        {
            heading: "8. Reviews and questions",
            paragraphs: [
                "Only Buyers can review an itinerary. Reviews must be honest and based on your own experience. We may remove reviews that break these Terms. Creators may answer questions about their itineraries; those answers are the Creator's own statements, not VAMO's.",
            ],
        },
        {
            heading: "9. Third-party services",
            paragraphs: [
                "The Service links to or depends on third parties (for example Stripe for payments, map and booking links added by Creators). We are not responsible for third-party sites, products or policies.",
            ],
        },
        {
            heading: "10. Intellectual property",
            paragraphs: [
                "The VAMO name, logo, app and site design, and software are owned by VAMO and its licensors. Except for the licenses described in these Terms, you get no rights in them. Creators keep the rights in their itineraries.",
            ],
        },
        {
            heading: "11. Copyright complaints",
            paragraphs: [
                `If you believe content on VAMO infringes your copyright, email ${P.email} with: your contact details; a description of the work; the location of the material; a statement that you have a good-faith belief the use is not authorized; and a statement, under penalty of perjury, that your notice is accurate and that you own or may act for the owner. We may remove material and terminate repeat infringers.`,
            ],
        },
        {
            heading: "12. Suspension and termination",
            paragraphs: [
                "You may stop using the Service and close your account at any time by contacting support. We may suspend or end your access if you violate these Terms, if required by law, or to protect users or the Service. Sections that by nature should survive (ownership, disclaimers, limitation of liability, disputes) survive termination.",
            ],
        },
        {
            heading: "13. Disclaimers",
            paragraphs: [
                'THE SERVICE AND ALL ITINERARIES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY AND NON-INFRINGEMENT, TO THE FULLEST EXTENT PERMITTED BY LAW. Some jurisdictions do not allow certain disclaimers, so some of this may not apply to you.',
            ],
        },
        {
            heading: "14. Limitation of liability",
            paragraphs: [
                "TO THE FULLEST EXTENT PERMITTED BY LAW, VAMO AND ITS OWNERS, OFFICERS AND EMPLOYEES WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL OR PUNITIVE DAMAGES, OR FOR LOSS OF PROFITS, DATA OR GOODWILL, OR FOR ANY LOSS ARISING FROM YOUR TRAVEL. OUR TOTAL LIABILITY FOR ANY CLAIM RELATED TO THE SERVICE WILL NOT EXCEED THE GREATER OF THE AMOUNT YOU PAID VAMO IN THE 12 MONTHS BEFORE THE CLAIM OR US$100.",
            ],
        },
        {
            heading: "15. Indemnity",
            paragraphs: [
                "You agree to defend and indemnify VAMO against claims, damages and costs (including reasonable attorneys' fees) arising from content you submit or your breach of these Terms or the law.",
            ],
        },
        {
            heading: "16. Governing law and disputes",
            paragraphs: [
                `These Terms are governed by the laws of the State of ${P.state}, without regard to conflict-of-law rules. Before filing a claim, please contact us at ${P.email} and give us 30 days to try to resolve it informally. Any dispute that is not resolved will be brought in the state or federal courts located in ${P.state}, and you and VAMO consent to that venue. Nothing here limits consumer rights that cannot be waived under your local law.`,
            ],
        },
        {
            heading: "17. Changes to the Service and these Terms",
            paragraphs: [
                "We may update the Service and these Terms. If we make material changes, we will notify you in the app or by email. Continuing to use the Service after the change means you accept the updated Terms.",
            ],
        },
        {
            heading: "18. Contact",
            paragraphs: [`${P.company}, ${P.address}. Email: ${P.email}.`],
        },
    ],
};

const PRIVACY: LegalDoc = {
    key: "privacy",
    title: "Privacy Policy",
    summary: "What personal information VAMO collects, why, who sees it, and your choices.",
    sections: [
        {
            heading: "1. Who we are",
            paragraphs: [
                `${P.company} ("VAMO") operates the VAMO app and website. This policy explains how we handle personal information when you use them. Contact: ${P.email}, ${P.address}.`,
            ],
        },
        {
            heading: "2. Information we collect",
            paragraphs: [
                "Account information: name, email address, password (stored only as a one-way hash), phone number if you add it, and profile photo or bio if you add them.",
                "Content you provide: itineraries, photos and files you upload, reviews, questions and answers, support messages, and your own saved items, favorites and customized itinerary versions.",
                "Purchase information: which itineraries you bought, amounts, currency and dates. Card details are entered on Stripe's checkout and are handled by Stripe; we receive a payment confirmation and limited details such as payment status, not your full card number.",
                "Creator information: if you become a Creator, the information needed to review your itineraries and, when payouts are enabled, the details our payment provider requires to pay you.",
                "Technical information: device and browser type, app version, IP address, and basic logs needed to run, secure and debug the Service.",
            ],
        },
        {
            heading: "3. How we use it",
            paragraphs: [
                "To provide the Service (create and secure your account, process purchases, deliver your itineraries, show Creator sales and reviews); to send transactional emails (welcome, purchase confirmation, password reset and security notices, review and sale notices); to review content and prevent fraud and abuse; to provide support; to improve the Service; and to comply with the law.",
                "We send marketing or newsletter emails only if you opt in, and you can opt out at any time.",
            ],
        },
        {
            heading: "4. Who we share it with",
            paragraphs: [
                "We do not sell your personal information, and we do not share it for cross-context behavioral advertising.",
                "We share it only with service providers that help us run VAMO and are bound to protect it: payment processing (Stripe), hosting, database and file storage (cloud infrastructure providers), and email delivery. We also share it when required by law, to protect rights and safety, or in a merger or sale of the business.",
                "What other users see: Creators' public profile and itineraries are visible to everyone. Reviews show the reviewer's name in shortened form. Creators see sales and review information about their own itineraries in anonymized form, without Buyers' contact details.",
            ],
        },
        {
            heading: "5. Cookies and similar technologies",
            paragraphs: [
                "We use local storage and similar technologies to keep you signed in and remember preferences. We do not use third-party advertising cookies. Our payment provider may set its own cookies on its checkout pages.",
            ],
        },
        {
            heading: "6. How long we keep it",
            paragraphs: [
                "We keep account and purchase information while your account is open and as needed to meet legal, tax, accounting and dispute-resolution obligations. When you ask us to delete your account, we delete or de-identify your personal information, except what we must keep by law (such as transaction records).",
            ],
        },
        {
            heading: "7. Security",
            paragraphs: [
                "We use industry-standard safeguards, including encryption in transit, hashed passwords and access controls. No system is perfectly secure; please use a strong, unique password.",
            ],
        },
        {
            heading: "8. Your choices and rights",
            paragraphs: [
                `You can access, correct or delete much of your information in the app (Profile → Account). You can also email ${P.email} to request a copy of your data, correction or deletion, or to opt out of marketing. We will respond within the time required by law (45 days for California requests, extendable once).`,
                "California residents (CCPA/CPRA): you have the right to know what personal information we collect, use and disclose; to request deletion and correction; to opt out of the sale or sharing of personal information (we do neither); and not to be discriminated against for exercising these rights. Residents of other states with similar laws (such as Colorado, Connecticut, Virginia and Texas) have comparable rights, and we honor them. You may use an authorized agent; we may need to verify your identity.",
            ],
        },
        {
            heading: "9. Children",
            paragraphs: [
                "VAMO is not for anyone under 18, and we do not knowingly collect personal information from children under 13. If you believe a child has given us information, email us and we will delete it.",
            ],
        },
        {
            heading: "10. International users and data location",
            paragraphs: [
                "VAMO is operated from the United States and your information is processed and stored in the United States. If you use VAMO from another country, you understand your information will be transferred there.",
            ],
        },
        {
            heading: "11. Changes to this policy",
            paragraphs: [
                "We may update this policy. We will post the new version with a new date and, for material changes, notify you in the app or by email.",
            ],
        },
        {
            heading: "12. Contact",
            paragraphs: [`Questions or requests: ${P.email}, ${P.company}, ${P.address}.`],
        },
    ],
};

const REFUNDS: LegalDoc = {
    key: "refunds",
    title: "Refund Policy",
    summary: "When you can get your money back for a digital itinerary.",
    sections: [
        {
            heading: "1. The basics",
            paragraphs: [
                "Itineraries are digital products delivered immediately after purchase, so we cannot take them back once you have used them. We still want you to feel safe buying on VAMO, so we refund in the situations below.",
            ],
        },
        {
            heading: "2. You can get a full refund if",
            paragraphs: [
                "You request it within 7 days of purchase and you have not opened the full itinerary content; or",
                "The itinerary is materially different from its listing (for example, a day-by-day section, module or content shown in the listing is missing or empty), or it cannot be opened or used because of a technical problem we cannot fix within a reasonable time; or",
                "You were charged more than once for the same itinerary, or by mistake.",
            ],
        },
        {
            heading: "3. What is not refundable",
            paragraphs: [
                "A change of mind after you have accessed the content, trips you cancel or change, differences between your own experience and the Creator's, or third-party changes such as prices, closures or availability (itineraries reflect a point in time).",
            ],
        },
        {
            heading: "4. How to request a refund",
            paragraphs: [
                `Email ${P.email} from the address on your account with the itinerary name and a short description of the problem. We aim to reply within 3 business days.`,
                "Approved refunds go back to your original payment method through Stripe. Your bank may take 5–10 business days to show it. When a purchase is refunded, your access to that itinerary ends and the Creator's earnings from that sale are reversed.",
            ],
        },
        {
            heading: "5. Canceling and your rights",
            paragraphs: [
                "VAMO is a one-time purchase, not a subscription, so there is nothing to cancel or auto-renew. This policy does not limit any refund or consumer right you have under applicable law.",
            ],
        },
    ],
};

const CREATORS: LegalDoc = {
    key: "creators",
    title: "Creator Terms",
    summary: "Extra terms for travelers who publish and sell itineraries on VAMO.",
    sections: [
        {
            heading: "1. Applies to Creators",
            paragraphs: [
                "These terms apply when you create, submit or sell itineraries on VAMO, in addition to the Terms of Use. You must be at least 18 years old and able to enter a binding agreement.",
            ],
        },
        {
            heading: "2. Original, truthful content",
            paragraphs: [
                "You must only submit itineraries based on a trip you actually took (you may be asked to provide proof of travel), written in your own words, with photos you own or have the right to use. Do not copy other guides, websites or books. Disclose whether costs are estimated or verified, and do not mislead Buyers about what the itinerary includes.",
                "Each active module you enable is a promise to Buyers. Itineraries must be complete for every module you turn on.",
            ],
        },
        {
            heading: "3. Review and publishing",
            paragraphs: [
                "Every itinerary is reviewed by VAMO before it is published. We may approve it, request changes or reject it, and we may unpublish an itinerary later if it violates these terms, receives well-founded complaints, or contains outdated or unsafe information. Approval is not an endorsement or guarantee of accuracy.",
            ],
        },
        {
            heading: "4. License and ownership",
            paragraphs: [
                "You keep ownership of your itineraries. You give VAMO a worldwide, non-exclusive license to host, display, promote, format, translate and sell access to them on the platform and in VAMO marketing. Buyers who purchased keep their access even if you later unpublish or delete the itinerary, unless it must be removed for legal reasons.",
            ],
        },
        {
            heading: "5. Price, commission and payouts",
            paragraphs: [
                "You set the price of your itinerary within the limits shown in the app. VAMO keeps a platform commission on each sale; the current commission rate and your earnings are shown in your Creator dashboard, and we will give notice before changing the rate for future sales. Payment-processing fees and refunds are handled as shown in the dashboard.",
                "Payouts, when enabled, are made through our payment provider after you complete its identity and tax onboarding. You are responsible for reporting and paying your own taxes. VAMO may withhold or reverse earnings for refunded sales, fraud or breach of these terms. Until automated payouts are available, we will tell you how and when earnings are paid.",
            ],
        },
        {
            heading: "6. Customer questions and support",
            paragraphs: [
                "Please answer Buyers' questions about your itineraries promptly and politely. Do not move Buyers off the platform to sell them directly, and do not ask for their personal contact details.",
            ],
        },
        {
            heading: "7. Responsibility",
            paragraphs: [
                "You are responsible for the accuracy and legality of your itineraries and for any claim that your content infringes third-party rights. You agree to indemnify VAMO as stated in the Terms of Use.",
            ],
        },
        {
            heading: "8. Ending your participation",
            paragraphs: [
                `You may stop selling at any time by pausing your itineraries or contacting ${P.email}. We may suspend or remove Creators who breach these terms. Earnings already owed for valid, non-refunded sales will still be paid.`,
            ],
        },
    ],
};

export const LEGAL_DOCS: Record<LegalDocKey, LegalDoc> = {
    terms: TERMS,
    privacy: PRIVACY,
    refunds: REFUNDS,
    creators: CREATORS,
};

export const LEGAL_DOC_ORDER: LegalDocKey[] = ["terms", "privacy", "refunds", "creators"];

export function isLegalDocKey(value: unknown): value is LegalDocKey {
    return typeof value === "string" && value in LEGAL_DOCS;
}

import LegalLayout, { type LegalSection } from './LegalLayout';

const sections: LegalSection[] = [
    {
        title: '1. About FreshDrop',
        paragraphs: [
            'FreshDrop is a technology platform for discovering produce, submitting orders, arranging delivery, and communicating about an order. FreshDrop may operate as an intermediary between you, produce suppliers, hubs, and independent delivery riders. The supplier remains responsible for the description, quality, lawful sale, preparation, packaging, and availability of products, except where FreshDrop is identified as the seller.',
        ],
    },
    {
        title: '2. Accounts and eligibility',
        paragraphs: [
            "You must be at least 18 years old, or have the legal capacity required in your location, to create an account. Information such as your name, email address, phone number, delivery address, and payment details must be accurate and kept up to date. Keep your credentials and delivery PIN confidential. You are responsible for activity carried out through your account unless it resulted from FreshDrop's failure to use reasonable security measures.",
        ],
        bullets: [
            'Do not share, sell, or transfer your account.',
            "Do not create an account using someone else's identity.",
            'Tell us promptly if you suspect unauthorised access or payment activity.',
        ],
    },
    {
        title: '3. Orders and delivery',
        paragraphs: [
            'Product availability, quantities, images, and prices can change because produce is seasonal and sourced from different hubs. The checkout screen shows the applicable subtotal, service fee, distance-based delivery fee, and total before you confirm. You are responsible for providing a complete delivery address, apartment or house details, landmark, and a reachable phone number. Delivery estimates are indicative and may be affected by weather, traffic, stock, hub operations, or events beyond reasonable control.',
        ],
        bullets: [
            'A rider may need to contact you about substitutions, access, or delivery instructions.',
            'You should be available at the chosen delivery location and provide the delivery PIN when requested.',
            'FreshDrop may refuse or cancel an order that is unlawful, unsafe, outside the service area, or impossible to fulfil.',
        ],
    },
    {
        title: '4. Price, payment, substitutions, and refunds',
        paragraphs: [
            'You authorise FreshDrop and its payment providers to collect the amount shown at checkout using the available payment method, including wallet or supported mobile-money flows. Payment providers may process payment information under their own terms. If an item is unavailable, your selected replacement or refund preference will guide fulfilment. Any refund is returned through the method and timing reasonably available for the transaction and may be subject to payment-provider processing times.',
        ],
        bullets: [
            'Promotions apply only to the stated audience, period, and order conditions and cannot be exchanged for cash.',
            'A cancellation fee or product charge may apply after a supplier or rider has started processing an order, where permitted by law and shown to you.',
            'Report missing, damaged, incorrect, or unavailable items through Support as soon as reasonably possible, with useful evidence where available.',
        ],
    },
    {
        title: '5. Acceptable use and restricted items',
        paragraphs: [
            'Use FreshDrop only for lawful, personal purposes. Do not misuse the platform, interfere with its security, scrape it, upload malicious code, harass another person, submit fraudulent orders, or request delivery of prohibited, dangerous, stolen, or unlawfully obtained goods. FreshDrop may restrict, suspend, or close an account when necessary to protect users, suppliers, riders, the platform, or the public.',
        ],
    },
    {
        title: '6. Reviews and content',
        paragraphs: [
            "If FreshDrop enables reviews, messages, photos, or other content, you retain ownership of your content and give FreshDrop a non-exclusive, worldwide, royalty-free licence to host, display, moderate, and use it to operate and improve the service. Do not submit content that is unlawful, misleading, abusive, discriminatory, infringing, or that exposes another person's private information.",
        ],
    },
    {
        title: '7. Service availability and responsibility',
        paragraphs: [
            'The platform is provided as available. We work to keep it accurate, secure, and available, but we cannot promise uninterrupted operation or guarantee the conduct, timing, quality, safety, or legality of an independent supplier or rider. Nothing in these terms excludes liability that cannot legally be excluded, including liability for fraud, negligence causing death or personal injury, or your mandatory consumer rights.',
        ],
    },
    {
        title: '8. Changes, complaints, and governing law',
        paragraphs: [
            'We may update these terms when the service, law, or operating arrangements change. We will provide notice of material changes where required. Contact support@freshdrop.co.ke first so we can investigate a complaint. These terms are governed by the laws of Kenya, subject to any mandatory consumer protection rights and the jurisdiction of Kenyan courts.',
        ],
    },
];

export default function Terms() {
    return (
        <LegalLayout
            title="Terms of use"
            intro="These terms explain how FreshDrop connects customers with fresh produce, hubs, and delivery riders in Kenya. By creating an account or placing an order, you agree to use the service lawfully and to these terms."
            sections={sections}
        />
    );
}

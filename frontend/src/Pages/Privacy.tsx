import LegalLayout, { type LegalSection } from './LegalLayout';

const sections: LegalSection[] = [
    {
        title: '1. Who controls your information',
        paragraphs: [
            'FreshDrop is the platform operator and data controller for information processed to provide the FreshDrop service. For questions, requests, or complaints about personal information, contact support@freshdrop.co.ke. Where a payment provider, map provider, authentication provider, or other independent service processes information under its own responsibility, its privacy notice may also apply.',
        ],
    },
    {
        title: '2. Information we collect',
        paragraphs: [
            'We collect information you provide, information created when you use the service, and information from service partners where needed to fulfil an order. This may include:',
        ],
        bullets: [
            'Account and contact details, profile information, saved addresses, delivery instructions, and authentication records.',
            'Order items, quantities, prices, substitutions, order status, support tickets, notifications, and delivery PIN activity.',
            'Payment, wallet, transaction, refund, and fraud-prevention information. Full card details should be handled by the relevant payment provider.',
            'Device, browser, IP address, app activity, diagnostics, and approximate or precise location when you choose to enable location services.',
            'Messages, feedback, reviews, and information you provide when contacting Support.',
        ],
    },
    {
        title: '3. Why we use it',
        paragraphs: [
            'We use information to create and secure accounts, show products and serviceable hubs, calculate delivery fees, accept and fulfil orders, coordinate riders, process payments and refunds, send transactional notifications, respond to Support requests, prevent fraud and abuse, improve reliability, meet legal obligations, and protect the rights and safety of FreshDrop and the people using it. We use marketing information only where permitted and give you a way to opt out.',
        ],
    },
    {
        title: '4. Sharing',
        paragraphs: [
            'We share only what is reasonably necessary with suppliers and hubs involved in your order, the assigned rider, payment and wallet providers, mapping and communications providers, hosting and security providers, customer-support providers, professional advisers, insurers, and public authorities where legally required. We do not sell your personal information. A supplier or rider may receive delivery details needed to complete the order and should use them only for that purpose.',
        ],
    },
    {
        title: '5. Location, profiling, and automated tools',
        paragraphs: [
            'Location is used to find a delivery point, determine service availability, calculate distance-based fees, and support delivery. You can manage device permissions, but disabling location may limit features. We may use non-sensitive activity such as order history, hub proximity, and product preferences to show relevant products or improve the service. We do not make decisions with legal or similarly significant effects based solely on automated processing.',
        ],
    },
    {
        title: '6. Retention and security',
        paragraphs: [
            'We keep information for as long as needed to provide the service, manage the account, resolve disputes, prevent fraud, and meet tax, accounting, regulatory, or legal obligations. Retention periods vary by record type. We use reasonable technical and organisational safeguards, but no online service can guarantee absolute security.',
        ],
    },
    {
        title: '7. Your rights and choices',
        paragraphs: [
            'Subject to applicable law, you may ask to access, correct, delete, restrict, or receive a copy of your information, object to certain uses, withdraw consent where processing relies on consent, and opt out of marketing. Requests can be sent to support@freshdrop.co.ke. We may need to verify your identity and may retain information where the law requires or permits it. You may complain to the Office of the Data Protection Commissioner in Kenya.',
        ],
    },
    {
        title: '8. Updates',
        paragraphs: [
            'We may update this notice as FreshDrop changes. The date shown below identifies the current version. Where required, we will give additional notice of material changes.',
        ],
    },
];

export default function Privacy() {
    return (
        <LegalLayout
            title="Privacy notice"
            intro="This notice describes the personal information FreshDrop collects, why we use it, who may receive it, and the choices available to you. It applies to customers, riders, suppliers, and visitors who interact with FreshDrop."
            sections={sections}
        />
    );
}

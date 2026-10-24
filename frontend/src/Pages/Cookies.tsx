import LegalLayout, { type LegalSection } from './LegalLayout';

const sections: LegalSection[] = [
    {
        title: '1. What cookies are',
        paragraphs: [
            'A cookie is a small text file stored on your browser or device. Similar technologies can recognise a browser, remember a session, measure performance, or store a preference. Some are set by FreshDrop and some may be set by providers that help us run the service.',
        ],
    },
    {
        title: '2. Categories',
        paragraphs: [
            'Essential technologies are needed for login, security, routing, checkout, fraud prevention, and basic operation and cannot be switched off through a consent tool. Preference technologies remember choices such as language or delivery settings. Analytics technologies help us understand performance and usage in aggregated form. Marketing technologies, if introduced, help measure campaigns or show relevant communications and are used only where consent or another lawful basis is required.',
        ],
    },
    {
        title: '3. Your choices',
        paragraphs: [
            'Where non-essential cookies are used, we will ask for your choice before setting them where required. You may accept or reject optional categories, change your choices later, or control cookies through your browser settings. Blocking essential technologies can affect sign-in, carts, checkout, and other platform features.',
        ],
    },
    {
        title: '4. Third parties and retention',
        paragraphs: [
            'Third-party providers may process information collected through their technologies under their own privacy notices. Cookie lifetimes vary: session technologies expire when the session ends, while persistent technologies remain until they expire or you delete them. We review technologies used on the platform and update this policy when they change.',
        ],
    },
    {
        title: '5. Contact',
        paragraphs: [
            'For questions about cookies or your privacy choices, email support@freshdrop.co.ke. This policy should be read with the FreshDrop Privacy Notice.',
        ],
    },
];

export default function Cookies() {
    return (
        <LegalLayout
            title="Cookie settings"
            intro="Cookies and similar technologies help FreshDrop remember choices, keep accounts secure, understand platform performance, and improve the experience. This policy explains the categories and the choices available to you."
            sections={sections}
        />
    );
}

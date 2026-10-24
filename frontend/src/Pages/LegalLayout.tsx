import { Link } from 'react-router';

export type LegalSection = {
    title: string;
    paragraphs: string[];
    bullets?: string[];
};

type LegalLayoutProps = {
    title: string;
    intro: string;
    sections: LegalSection[];
};

export default function LegalLayout({
    title,
    intro,
    sections,
}: LegalLayoutProps) {
    return (
        <div className="min-h-screen bg-[#fdfcf8] text-[#2d3025]">
            <header className="border-b border-[#e5e1d8] bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 md:px-12">
                    <Link
                        to="/auth/login"
                        className="font-caveat text-3xl font-bold text-[#4c6b36]"
                    >
                        FreshDrop
                    </Link>
                    <Link
                        to="/auth/login"
                        className="text-sm font-bold text-[#4c6b36] hover:underline"
                    >
                        Back to FreshDrop
                    </Link>
                </div>
            </header>
            <main className="mx-auto max-w-5xl px-6 py-14 md:px-12 md:py-20">
                <div className="mb-12 max-w-3xl">
                    <p className="mb-3 text-xs font-black tracking-[0.2em] text-[#4c6b36] uppercase">
                        FreshDrop legal
                    </p>
                    <h1 className="text-4xl font-black tracking-tight md:text-6xl">
                        {title}
                    </h1>
                    <p className="mt-6 text-lg leading-8 text-[#6b705c]">
                        {intro}
                    </p>
                    <p className="mt-4 text-xs font-bold tracking-widest text-[#8c877e] uppercase">
                        Last updated: 8 September 2026
                    </p>
                </div>
                <div className="grid gap-10 lg:grid-cols-[220px_1fr]">
                    <nav className="hidden h-fit border-l-2 border-[#a6ce86] pl-4 text-sm font-bold text-[#6b705c] lg:block">
                        <Link
                            className="block py-2 hover:text-[#4c6b36]"
                            to="/legal/terms"
                        >
                            Terms of use
                        </Link>
                        <Link
                            className="block py-2 hover:text-[#4c6b36]"
                            to="/legal/privacy"
                        >
                            Privacy notice
                        </Link>
                        <Link
                            className="block py-2 hover:text-[#4c6b36]"
                            to="/legal/cookies"
                        >
                            Cookie settings
                        </Link>
                    </nav>
                    <article className="space-y-10">
                        {sections.map((section) => (
                            <section key={section.title}>
                                <h2 className="text-2xl font-black text-[#1b310f]">
                                    {section.title}
                                </h2>
                                {section.paragraphs.map((paragraph) => (
                                    <p
                                        key={paragraph}
                                        className="mt-4 leading-8 text-[#4f5243]"
                                    >
                                        {paragraph}
                                    </p>
                                ))}
                                {section.bullets && (
                                    <ul className="mt-4 list-disc space-y-2 pl-6 leading-7 text-[#4f5243]">
                                        {section.bullets.map((bullet) => (
                                            <li key={bullet}>{bullet}</li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        ))}
                    </article>
                </div>
            </main>
        </div>
    );
}

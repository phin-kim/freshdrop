// frontend/src/Components/Others/SEO.tsx
import { Helmet } from 'react-helmet-async';

interface SEOProps {
    title: string;
    description: string;
    name?: string;
    type?: string;
    image?: string;
    url?: string;
}

export const SEO = ({
    title,
    description,
    name = 'FreshDrop', // 🚨 Changed from Phinance
    type = 'website',
    image = 'https://www.freshdop.co.ke/og-image.png', // 🚨 Use your actual domain and a real image
    url = 'https://www.freshdop.co.ke', // 🚨 Changed to your domain
}: SEOProps) => {
    return (
        <Helmet>
            <title>{title}</title>
            <meta name="description" content={description} />

            <meta property="og:type" content={type} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:site_name" content={name} />
            <meta property="og:url" content={url} />
            <meta property="og:image" content={image} />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
        </Helmet>
    );
};

import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const SEOHead = ({ 
    title = 'KingdomCraft', 
    description = 'Serwer Minecraft KingdomCraft - dołącz do naszej społeczności!',
    keywords = 'minecraft, server, kingdomcraft, gaming, multiplayer',
    image = 'https://customer-assets.emergentagent.com/job_ee42f2e5-9f02-4b6b-8a8e-96c0caeac022/artifacts/ncvnytcd_logo-kdc-vector.png'
}) => {
    const location = useLocation();
    const currentUrl = window.location.href;

    // Track page view
    useEffect(() => {
        const trackPageView = async () => {
            try {
                await axios.post(`${API_URL}/api/analytics/pageview`, {
                    path: location.pathname
                });
            } catch (error) {
                // Silently fail
            }
        };
        trackPageView();
    }, [location.pathname]);

    return (
        <Helmet>
            {/* Basic Meta Tags */}
            <title>{title}</title>
            <meta name="description" content={description} />
            <meta name="keywords" content={keywords} />
            
            {/* Open Graph / Facebook */}
            <meta property="og:type" content="website" />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content="KingdomCraft" />
            
            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:url" content={currentUrl} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={image} />
            
            {/* Additional SEO */}
            <meta name="robots" content="index, follow" />
            <meta name="language" content="Polish" />
            <meta name="author" content="KingdomCraft" />
            <link rel="canonical" href={currentUrl} />
            
            {/* Favicon */}
            <link rel="icon" type="image/png" href={image} />
        </Helmet>
    );
};

import React from 'react';

export const BlockRenderer = ({ block, isPreview = false }) => {
    const renderBlock = (b) => {
        const style = b.style || {};
        
        switch (b.type) {
            case 'text':
                const Tag = b.content?.tag || 'p';
                return (
                    <Tag 
                        style={style}
                        className={Tag === 'h1' ? 'text-gradient font-display' : ''}
                    >
                        {b.content?.text || 'Tekst'}
                    </Tag>
                );
            
            case 'image':
                return b.content?.src ? (
                    <img
                        src={b.content.src.startsWith('http') ? b.content.src : `${process.env.REACT_APP_BACKEND_URL}${b.content.src}`}
                        alt={b.content?.alt || ''}
                        style={style}
                        className="rounded-lg"
                    />
                ) : (
                    <div 
                        style={{ ...style, minHeight: '100px' }}
                        className="bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground border-2 border-dashed border-border"
                    >
                        Kliknij aby dodać obraz
                    </div>
                );
            
            case 'button':
                return (
                    <a
                        href={isPreview ? undefined : b.content?.url || '#'}
                        style={style}
                        className="inline-block text-center cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={isPreview ? (e) => e.preventDefault() : undefined}
                    >
                        {b.content?.text || 'Przycisk'}
                    </a>
                );
            
            case 'container':
                return (
                    <div style={style} className="rounded-lg">
                        {b.children?.map((child) => (
                            <div key={child.id}>
                                {renderBlock(child)}
                            </div>
                        ))}
                        {(!b.children || b.children.length === 0) && (
                            <div className="p-4 border-2 border-dashed border-border/30 rounded text-center text-muted-foreground text-sm">
                                Kontener (dodaj elementy)
                            </div>
                        )}
                    </div>
                );
            
            case 'gallery':
                return (
                    <div style={style} className="rounded-lg">
                        {b.content?.images?.length > 0 ? (
                            b.content.images.map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img.src.startsWith('http') ? img.src : `${process.env.REACT_APP_BACKEND_URL}${img.src}`}
                                    alt={img.alt || ''}
                                    className="rounded-lg object-cover w-full h-40"
                                />
                            ))
                        ) : (
                            <div className="col-span-full p-8 border-2 border-dashed border-border/30 rounded text-center text-muted-foreground">
                                Galeria (dodaj obrazy)
                            </div>
                        )}
                    </div>
                );
            
            case 'video':
                if (b.content?.url) {
                    const videoId = extractYouTubeId(b.content.url);
                    if (videoId) {
                        return (
                            <div style={style} className="rounded-lg overflow-hidden">
                                <iframe
                                    src={`https://www.youtube.com/embed/${videoId}`}
                                    title="Video"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className="w-full h-full"
                                    style={{ aspectRatio: '16/9' }}
                                />
                            </div>
                        );
                    }
                }
                return (
                    <div 
                        style={{ ...style, minHeight: '200px' }}
                        className="bg-muted/50 rounded-lg flex items-center justify-center text-muted-foreground border-2 border-dashed border-border"
                    >
                        Wklej link YouTube
                    </div>
                );
            
            case 'spacer':
                return <div style={style} className="bg-muted/20 rounded" />;
            
            default:
                return <div>Nieznany typ bloku: {b.type}</div>;
        }
    };

    return renderBlock(block);
};

// Helper to extract YouTube video ID
const extractYouTubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
};

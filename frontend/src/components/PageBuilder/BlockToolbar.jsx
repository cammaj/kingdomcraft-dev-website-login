import React from 'react';
import { Type, Image, Square, Layout, Grid, Video, Minus, Heading } from 'lucide-react';
import { Button } from '../ui/button';

const blockTypes = [
    { type: 'heading', label: 'Nagłówek', icon: Heading },
    { type: 'text', label: 'Tekst', icon: Type },
    { type: 'image', label: 'Obraz', icon: Image },
    { type: 'button', label: 'Przycisk', icon: Square },
    { type: 'container', label: 'Kontener', icon: Layout },
    { type: 'gallery', label: 'Galeria', icon: Grid },
    { type: 'video', label: 'Video', icon: Video },
    { type: 'spacer', label: 'Odstęp', icon: Minus },
];

export const BlockToolbar = ({ onAddBlock }) => {
    return (
        <div className="w-48 shrink-0 glass-card rounded-xl p-4 space-y-2" data-testid="block-toolbar">
            <h3 className="font-display text-sm font-bold mb-4 text-muted-foreground uppercase tracking-wider">
                Elementy
            </h3>
            <div className="space-y-1">
                {blockTypes.map(({ type, label, icon: Icon }) => (
                    <Button
                        key={type}
                        variant="ghost"
                        className="w-full justify-start gap-2 h-10"
                        onClick={() => onAddBlock(type)}
                        data-testid={`add-${type}-btn`}
                    >
                        <Icon className="h-4 w-4 text-primary" />
                        <span className="text-sm">{label}</span>
                    </Button>
                ))}
            </div>
        </div>
    );
};

import React, { useState, useRef } from 'react';
import { X, Upload, Loader2 } from 'lucide-react';
import axios from 'axios';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const BlockEditor = ({ block, onUpdate, onClose }) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);

    const updateContent = (key, value) => {
        onUpdate({
            content: { ...block.content, [key]: value }
        });
    };

    const updateStyle = (key, value) => {
        onUpdate({
            style: { ...block.style, [key]: value }
        });
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post(`${API_URL}/api/admin/upload`, formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            updateContent('src', response.data.url);
        } catch (error) {
            console.error('Upload failed:', error);
        }
        setUploading(false);
    };

    const renderEditor = () => {
        switch (block.type) {
            case 'text':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Tekst</label>
                            <textarea
                                value={block.content?.text || ''}
                                onChange={(e) => updateContent('text', e.target.value)}
                                className="w-full mt-1 p-2 rounded-md bg-background border border-input min-h-[100px] resize-none"
                                data-testid="editor-text-input"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Typ</label>
                            <select
                                value={block.content?.tag || 'p'}
                                onChange={(e) => updateContent('tag', e.target.value)}
                                className="w-full mt-1 p-2 rounded-md bg-background border border-input"
                            >
                                <option value="h1">Nagłówek H1</option>
                                <option value="h2">Nagłówek H2</option>
                                <option value="h3">Nagłówek H3</option>
                                <option value="p">Paragraf</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Rozmiar czcionki</label>
                            <Input
                                type="text"
                                value={block.style?.fontSize || '1rem'}
                                onChange={(e) => updateStyle('fontSize', e.target.value)}
                                placeholder="np. 1.5rem, 24px"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Wyrównanie</label>
                            <select
                                value={block.style?.textAlign || 'left'}
                                onChange={(e) => updateStyle('textAlign', e.target.value)}
                                className="w-full mt-1 p-2 rounded-md bg-background border border-input"
                            >
                                <option value="left">Do lewej</option>
                                <option value="center">Środek</option>
                                <option value="right">Do prawej</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Grubość</label>
                            <select
                                value={block.style?.fontWeight || '400'}
                                onChange={(e) => updateStyle('fontWeight', e.target.value)}
                                className="w-full mt-1 p-2 rounded-md bg-background border border-input"
                            >
                                <option value="300">Cienki</option>
                                <option value="400">Normalny</option>
                                <option value="600">Półgruby</option>
                                <option value="700">Gruby</option>
                                <option value="900">Bardzo gruby</option>
                            </select>
                        </div>
                    </div>
                );

            case 'image':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Obraz</label>
                            <div className="mt-1 space-y-2">
                                {block.content?.src && (
                                    <img
                                        src={block.content.src.startsWith('http') ? block.content.src : `${API_URL}${block.content.src}`}
                                        alt="Preview"
                                        className="w-full h-32 object-cover rounded-lg"
                                    />
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                    ) : (
                                        <Upload className="h-4 w-4 mr-2" />
                                    )}
                                    Prześlij obraz
                                </Button>
                                <div className="text-center text-xs text-muted-foreground">lub</div>
                                <Input
                                    type="text"
                                    value={block.content?.src || ''}
                                    onChange={(e) => updateContent('src', e.target.value)}
                                    placeholder="URL obrazu"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Tekst alternatywny</label>
                            <Input
                                type="text"
                                value={block.content?.alt || ''}
                                onChange={(e) => updateContent('alt', e.target.value)}
                                placeholder="Opis obrazu"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Szerokość</label>
                            <Input
                                type="text"
                                value={block.style?.width || '100%'}
                                onChange={(e) => updateStyle('width', e.target.value)}
                                placeholder="np. 100%, 500px"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Maks. szerokość</label>
                            <Input
                                type="text"
                                value={block.style?.maxWidth || ''}
                                onChange={(e) => updateStyle('maxWidth', e.target.value)}
                                placeholder="np. 600px"
                            />
                        </div>
                    </div>
                );

            case 'button':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Tekst przycisku</label>
                            <Input
                                type="text"
                                value={block.content?.text || ''}
                                onChange={(e) => updateContent('text', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Link (URL)</label>
                            <Input
                                type="text"
                                value={block.content?.url || ''}
                                onChange={(e) => updateContent('url', e.target.value)}
                                placeholder="https://..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Kolor tła</label>
                            <div className="flex gap-2 mt-1">
                                <input
                                    type="color"
                                    value={block.style?.backgroundColor || '#D946EF'}
                                    onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                                    className="w-10 h-10 rounded cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={block.style?.backgroundColor || '#D946EF'}
                                    onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Kolor tekstu</label>
                            <div className="flex gap-2 mt-1">
                                <input
                                    type="color"
                                    value={block.style?.color || '#ffffff'}
                                    onChange={(e) => updateStyle('color', e.target.value)}
                                    className="w-10 h-10 rounded cursor-pointer"
                                />
                                <Input
                                    type="text"
                                    value={block.style?.color || '#ffffff'}
                                    onChange={(e) => updateStyle('color', e.target.value)}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Zaokrąglenie</label>
                            <Input
                                type="text"
                                value={block.style?.borderRadius || '0.5rem'}
                                onChange={(e) => updateStyle('borderRadius', e.target.value)}
                                placeholder="np. 0.5rem, 8px"
                            />
                        </div>
                    </div>
                );

            case 'container':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Kierunek</label>
                            <select
                                value={block.style?.flexDirection || 'column'}
                                onChange={(e) => updateStyle('flexDirection', e.target.value)}
                                className="w-full mt-1 p-2 rounded-md bg-background border border-input"
                            >
                                <option value="column">Pionowo</option>
                                <option value="row">Poziomo</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Wyrównanie</label>
                            <select
                                value={block.style?.alignItems || 'stretch'}
                                onChange={(e) => updateStyle('alignItems', e.target.value)}
                                className="w-full mt-1 p-2 rounded-md bg-background border border-input"
                            >
                                <option value="flex-start">Początek</option>
                                <option value="center">Środek</option>
                                <option value="flex-end">Koniec</option>
                                <option value="stretch">Rozciągnij</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Odstęp</label>
                            <Input
                                type="text"
                                value={block.style?.gap || '1rem'}
                                onChange={(e) => updateStyle('gap', e.target.value)}
                                placeholder="np. 1rem, 16px"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Padding</label>
                            <Input
                                type="text"
                                value={block.style?.padding || '1rem'}
                                onChange={(e) => updateStyle('padding', e.target.value)}
                                placeholder="np. 1rem, 16px"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Kolor tła</label>
                            <Input
                                type="text"
                                value={block.style?.backgroundColor || ''}
                                onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                                placeholder="np. rgba(0,0,0,0.1)"
                            />
                        </div>
                    </div>
                );

            case 'video':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Link YouTube</label>
                            <Input
                                type="text"
                                value={block.content?.url || ''}
                                onChange={(e) => updateContent('url', e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Maks. szerokość</label>
                            <Input
                                type="text"
                                value={block.style?.maxWidth || '800px'}
                                onChange={(e) => updateStyle('maxWidth', e.target.value)}
                            />
                        </div>
                    </div>
                );

            case 'spacer':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Wysokość</label>
                            <Input
                                type="text"
                                value={block.style?.height || '2rem'}
                                onChange={(e) => updateStyle('height', e.target.value)}
                                placeholder="np. 2rem, 32px"
                            />
                        </div>
                    </div>
                );

            case 'gallery':
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Galeria - funkcja w przygotowaniu
                        </p>
                        <div>
                            <label className="text-sm font-medium">Kolumny</label>
                            <Input
                                type="text"
                                value={block.style?.gridTemplateColumns || 'repeat(3, 1fr)'}
                                onChange={(e) => updateStyle('gridTemplateColumns', e.target.value)}
                                placeholder="np. repeat(3, 1fr)"
                            />
                        </div>
                    </div>
                );

            default:
                return <p className="text-muted-foreground">Brak opcji dla tego typu bloku</p>;
        }
    };

    return (
        <div className="w-72 shrink-0 glass-card rounded-xl p-4 overflow-auto max-h-[calc(100vh-200px)]" data-testid="block-editor">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    Edycja bloku
                </h3>
                <Button size="icon" variant="ghost" onClick={onClose} className="h-6 w-6">
                    <X className="h-4 w-4" />
                </Button>
            </div>
            
            <div className="text-xs text-primary mb-4 px-2 py-1 bg-primary/10 rounded">
                Typ: {block.type}
            </div>

            {renderEditor()}
        </div>
    );
};

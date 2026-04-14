import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Copy } from 'lucide-react';
import { BlockRenderer } from './BlockRenderer';
import { Button } from '../ui/button';

export const SortableBlock = ({ block, isSelected, onSelect, onDelete, onDuplicate }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative mb-2 rounded-lg transition-all ${
                isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
            } ${isDragging ? 'z-50' : ''}`}
            onClick={(e) => {
                e.stopPropagation();
                onSelect();
            }}
            data-testid={`block-${block.id}`}
        >
            {/* Block Controls */}
            <div className={`absolute -left-10 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'opacity-100' : ''}`}>
                <button
                    {...attributes}
                    {...listeners}
                    className="p-1 rounded bg-muted hover:bg-muted/80 cursor-grab active:cursor-grabbing"
                    data-testid={`drag-handle-${block.id}`}
                >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                </button>
            </div>

            {/* Actions */}
            <div className={`absolute -right-2 top-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isSelected ? 'opacity-100' : ''}`}>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate();
                    }}
                    data-testid={`duplicate-${block.id}`}
                >
                    <Copy className="h-3 w-3" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    data-testid={`delete-${block.id}`}
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>

            {/* Block Content */}
            <div className="p-2 rounded-lg border border-transparent hover:border-border/50 transition-colors">
                <BlockRenderer block={block} />
            </div>
        </div>
    );
};

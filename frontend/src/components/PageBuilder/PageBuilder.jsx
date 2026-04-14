import React, { useState, useCallback } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableBlock } from './SortableBlock';
import { BlockRenderer } from './BlockRenderer';
import { BlockToolbar } from './BlockToolbar';
import { BlockEditor } from './BlockEditor';
import { v4 as uuidv4 } from 'uuid';

// Generate unique ID
const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export const PageBuilder = ({ blocks, onChange, language }) => {
    const [activeId, setActiveId] = useState(null);
    const [selectedBlockId, setSelectedBlockId] = useState(null);
    const [editingBlock, setEditingBlock] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const findBlockIndex = (id, blockList = blocks) => {
        return blockList.findIndex(b => b.id === id);
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id) {
            const oldIndex = findBlockIndex(active.id);
            const newIndex = findBlockIndex(over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newBlocks = arrayMove(blocks, oldIndex, newIndex);
                onChange(newBlocks);
            }
        }
    };

    const addBlock = (type, afterId = null) => {
        const newBlock = createDefaultBlock(type);
        
        if (afterId) {
            const index = findBlockIndex(afterId);
            const newBlocks = [...blocks];
            newBlocks.splice(index + 1, 0, newBlock);
            onChange(newBlocks);
        } else {
            onChange([...blocks, newBlock]);
        }
        
        setSelectedBlockId(newBlock.id);
        setEditingBlock(newBlock);
    };

    const createDefaultBlock = (type) => {
        const id = generateId();
        const defaults = {
            text: {
                id,
                type: 'text',
                content: { text: 'Nowy tekst', tag: 'p' },
                style: { fontSize: '1rem', textAlign: 'left' }
            },
            heading: {
                id,
                type: 'text',
                content: { text: 'Nagłówek', tag: 'h2' },
                style: { fontSize: '2rem', fontWeight: '700', textAlign: 'center' }
            },
            image: {
                id,
                type: 'image',
                content: { src: '', alt: 'Obraz' },
                style: { width: '100%', maxWidth: '600px', height: 'auto', margin: '0 auto' }
            },
            button: {
                id,
                type: 'button',
                content: { text: 'Przycisk', url: '#' },
                style: { padding: '0.75rem 1.5rem', backgroundColor: '#D946EF', color: 'white', borderRadius: '0.5rem' }
            },
            container: {
                id,
                type: 'container',
                content: {},
                style: { display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' },
                children: []
            },
            gallery: {
                id,
                type: 'gallery',
                content: { images: [] },
                style: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }
            },
            video: {
                id,
                type: 'video',
                content: { url: '', type: 'youtube' },
                style: { width: '100%', maxWidth: '800px', aspectRatio: '16/9', margin: '0 auto' }
            },
            spacer: {
                id,
                type: 'spacer',
                content: {},
                style: { height: '2rem' }
            }
        };
        return defaults[type] || defaults.text;
    };

    const updateBlock = (blockId, updates) => {
        const updateBlockRecursive = (blockList) => {
            return blockList.map(block => {
                if (block.id === blockId) {
                    return { ...block, ...updates };
                }
                if (block.children) {
                    return { ...block, children: updateBlockRecursive(block.children) };
                }
                return block;
            });
        };
        onChange(updateBlockRecursive(blocks));
        
        if (editingBlock?.id === blockId) {
            setEditingBlock({ ...editingBlock, ...updates });
        }
    };

    const deleteBlock = (blockId) => {
        const deleteBlockRecursive = (blockList) => {
            return blockList.filter(block => {
                if (block.id === blockId) return false;
                if (block.children) {
                    block.children = deleteBlockRecursive(block.children);
                }
                return true;
            });
        };
        onChange(deleteBlockRecursive(blocks));
        
        if (selectedBlockId === blockId) {
            setSelectedBlockId(null);
            setEditingBlock(null);
        }
    };

    const duplicateBlock = (blockId) => {
        const index = findBlockIndex(blockId);
        if (index === -1) return;
        
        const duplicateWithNewIds = (block) => {
            const newBlock = {
                ...block,
                id: generateId(),
                children: block.children ? block.children.map(duplicateWithNewIds) : undefined
            };
            return newBlock;
        };
        
        const newBlock = duplicateWithNewIds(blocks[index]);
        const newBlocks = [...blocks];
        newBlocks.splice(index + 1, 0, newBlock);
        onChange(newBlocks);
    };

    const activeBlock = activeId ? blocks.find(b => b.id === activeId) : null;

    return (
        <div className="flex gap-4 h-full" data-testid="page-builder">
            {/* Toolbar */}
            <BlockToolbar onAddBlock={addBlock} />

            {/* Canvas */}
            <div className="flex-1 bg-background/50 rounded-xl border border-border overflow-auto">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
                        <div className="p-4 min-h-[500px]" data-testid="builder-canvas">
                            {blocks.length === 0 ? (
                                <div className="flex items-center justify-center h-[400px] border-2 border-dashed border-border/50 rounded-xl">
                                    <p className="text-muted-foreground">
                                        Kliknij element w panelu po lewej, aby dodać go do strony
                                    </p>
                                </div>
                            ) : (
                                blocks.map((block) => (
                                    <SortableBlock
                                        key={block.id}
                                        block={block}
                                        isSelected={selectedBlockId === block.id}
                                        onSelect={() => {
                                            setSelectedBlockId(block.id);
                                            setEditingBlock(block);
                                        }}
                                        onDelete={() => deleteBlock(block.id)}
                                        onDuplicate={() => duplicateBlock(block.id)}
                                    />
                                ))
                            )}
                        </div>
                    </SortableContext>

                    <DragOverlay>
                        {activeBlock ? (
                            <div className="opacity-80 shadow-xl">
                                <BlockRenderer block={activeBlock} isPreview />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            {/* Properties Panel */}
            {editingBlock && (
                <BlockEditor
                    block={editingBlock}
                    onUpdate={(updates) => updateBlock(editingBlock.id, updates)}
                    onClose={() => {
                        setEditingBlock(null);
                        setSelectedBlockId(null);
                    }}
                />
            )}
        </div>
    );
};

"use client";

import { useState, useRef, useCallback, type ReactNode } from "react";

interface DraggableListProps<T> {
    items: T[];
    onReorder: (newItems: T[]) => void;
    renderItem: (item: T, index: number, dragHandleProps: DragHandleProps) => ReactNode;
    keyExtractor: (item: T, index: number) => string | number;
}

export interface DragHandleProps {
    draggable: boolean;
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    className: string;
    role: string;
    "aria-grabbed"?: boolean;
}

export default function DraggableList<T>({
    items,
    onReorder,
    renderItem,
    keyExtractor,
}: DraggableListProps<T>) {
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [overIndex, setOverIndex] = useState<number | null>(null);
    const dragItemRef = useRef<number | null>(null);

    const handleDragStart = useCallback((index: number) => (e: React.DragEvent) => {
        dragItemRef.current = index;
        setDragIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Make the drag image semi-transparent
        if (e.currentTarget instanceof HTMLElement) {
            e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
        }
    }, []);

    const handleDragEnd = useCallback(() => {
        setDragIndex(null);
        setOverIndex(null);
        dragItemRef.current = null;
    }, []);

    const handleDragOver = useCallback((index: number) => (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setOverIndex(index);
    }, []);

    const handleDrop = useCallback((dropIndex: number) => (e: React.DragEvent) => {
        e.preventDefault();
        const fromIndex = dragItemRef.current;
        if (fromIndex === null || fromIndex === dropIndex) {
            handleDragEnd();
            return;
        }

        const newItems = [...items];
        const [moved] = newItems.splice(fromIndex, 1);
        newItems.splice(dropIndex, 0, moved);
        onReorder(newItems);
        handleDragEnd();
    }, [items, onReorder, handleDragEnd]);

    return (
        <div className="drag-list">
            {items.map((item, index) => {
                const isDragging = dragIndex === index;
                const isOver = overIndex === index && dragIndex !== index;

                const dragHandleProps: DragHandleProps = {
                    draggable: true,
                    onDragStart: handleDragStart(index),
                    onDragEnd: handleDragEnd,
                    className: "drag-handle",
                    role: "button",
                    "aria-grabbed": isDragging,
                };

                return (
                    <div
                        key={keyExtractor(item, index)}
                        className={`drag-item ${isDragging ? "dragging" : ""} ${isOver ? "drag-over" : ""}`}
                        onDragOver={handleDragOver(index)}
                        onDrop={handleDrop(index)}
                    >
                        {renderItem(item, index, dragHandleProps)}
                    </div>
                );
            })}
        </div>
    );
}

/* Drag handle icon component */
export function DragHandle(props: DragHandleProps) {
    return (
        <span {...props} title="Arraste para reordenar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="9" cy="6" r="1.5" fill="currentColor" />
                <circle cx="15" cy="6" r="1.5" fill="currentColor" />
                <circle cx="9" cy="12" r="1.5" fill="currentColor" />
                <circle cx="15" cy="12" r="1.5" fill="currentColor" />
                <circle cx="9" cy="18" r="1.5" fill="currentColor" />
                <circle cx="15" cy="18" r="1.5" fill="currentColor" />
            </svg>
        </span>
    );
}

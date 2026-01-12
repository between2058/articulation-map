/**
 * PartListPanel Component
 * 
 * Displays a list of all parts in the loaded model.
 * Shows part name, type tag, and selection state.
 * Clicking a part selects it in both the list and 3D viewer.
 */

import React from 'react';

// Icon mapping for part types
const typeIcons = {
    link: '🔗',
    joint: '⚙️',
    base: '🏠',
    tool: '🔧',
};

// Get a color class for the type tag
const getTypeClass = (type) => {
    switch (type) {
        case 'base': return 'type-base';
        case 'link': return 'type-link';
        case 'tool': return 'type-tool';
        default: return '';
    }
};

export function PartListPanel({
    parts = [],
    selectedPartId,
    onSelectPart
}) {
    if (parts.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <p className="empty-state-text">
                    No parts loaded.<br />
                    Upload a GLB model to see parts.
                </p>
            </div>
        );
    }

    return (
        <>
            <div style={{
                padding: 'var(--space-sm) var(--space-md)',
                borderBottom: '1px solid var(--border-color)',
                fontSize: '12px',
                color: 'var(--text-muted)'
            }}>
                {parts.length} part{parts.length !== 1 ? 's' : ''}
            </div>

            <ul className="part-list">
                {parts.map((part) => (
                    <li
                        key={part.id}
                        className={`part-item ${selectedPartId === part.id ? 'selected' : ''}`}
                        onClick={() => onSelectPart(part.id)}
                    >
                        <div className="part-item-icon">
                            {typeIcons[part.type] || '📦'}
                        </div>

                        <div className="part-item-info">
                            <div className="part-item-name">{part.name}</div>
                            <div className="part-item-meta">
                                {part.vertexCount?.toLocaleString() || 0} vertices
                            </div>
                        </div>

                        <span className={`part-item-tag ${getTypeClass(part.type)}`}>
                            {part.type}
                        </span>
                    </li>
                ))}
            </ul>
        </>
    );
}

export default PartListPanel;

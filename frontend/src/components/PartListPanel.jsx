/**
 * PartListPanel Component
 * 
 * Displays a list of all parts in the loaded model.
 * Shows part name, type tag, and selection state.
 * Clicking a part selects it in both the list and 3D viewer.
 */

import React from 'react';

import { MATERIAL_PRESETS } from '../data/materials';

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
    // ... empty state logic ...

    // Helper to get material display
    const getMaterialDisplay = (part) => {
        if (!part.materialId) return null;
        const preset = MATERIAL_PRESETS.find(m => m.id === part.materialId);
        if (!preset) return null;

        return (
            <span style={{
                fontSize: '9px',
                color: part.isMaterialCustom ? 'var(--accent-warning)' : 'var(--text-secondary)',
                background: 'rgba(255,255,255,0.05)',
                padding: '1px 4px',
                borderRadius: '3px',
                display: 'inline-flex',
                alignItems: 'center',
                marginLeft: 'auto' // Push to right if in flex container
            }} title={part.isMaterialCustom ? "Customized Material" : "Standard Material"}>
                {preset.name}
                {part.isMaterialCustom && '*'}
            </span>
        );
    };

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
                            <div className="part-item-name">
                                {part.name}
                            </div>
                            <div className="part-item-meta" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <span>{part.vertexCount?.toLocaleString() || 0} verts</span>
                                {getMaterialDisplay(part)}
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

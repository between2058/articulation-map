import React from 'react';
import { MATERIAL_PRESETS } from '../data/materials';

export function MaterialLibraryPanel({ selectedPart, onUpdatePart }) {
    if (!selectedPart) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">🎨</div>
                <h3>No Part Selected</h3>
                <p>Select a part in the 3D view to apply a material preset.</p>
            </div>
        );
    }

    return (
        <div className="material-library-panel">
            <div className="panel-section">
                <h3>Material Library</h3>
                <p className="text-muted mb-md" style={{ fontSize: '12px' }}>
                    Select a material below to instantly apply physical properties (Friction, Restitution, Density) to <strong>{selectedPart.name || selectedPart.id}</strong>.
                </p>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)', // Use 2 columns to prevent overflow
                    gap: '8px',
                    paddingBottom: '16px'
                }}>
                    {MATERIAL_PRESETS.map((mat) => (
                        <button
                            key={mat.id}
                            className="btn btn-ghost"
                            style={{
                                padding: '8px',
                                width: '100%',
                                height: '130px', // Fixed height for alignment
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'flex-start', // Always align to top
                                gap: '8px',
                                border: '1px solid var(--border-color)',
                                background: 'var(--bg-tertiary)',
                                transition: 'all 0.2s ease'
                            }}
                            title={`${mat.name}\nDensity: ${mat.properties.density}\nFriction: ${mat.properties.staticFriction}`}
                            onClick={() => {
                                // Batch update all physics properties
                                // Batch update all physics properties
                                onUpdatePart(selectedPart.id, {
                                    staticFriction: mat.properties.staticFriction,
                                    dynamicFriction: mat.properties.dynamicFriction,
                                    restitution: mat.properties.restitution,
                                    density: mat.properties.density,
                                    mass: null, // Switch to density mode
                                    materialId: mat.id,
                                    isMaterialCustom: false
                                });
                            }}
                        >
                            <div style={{
                                width: '64px',
                                height: '64px',
                                flexShrink: 0, // Prevent image squishing
                                overflow: 'hidden', // Ensure zoomed image doesn't bleed out
                                borderRadius: '50%',
                                border: selectedPart.materialId === mat.id
                                    ? `3px solid var(--accent-primary)` // Highlight selected
                                    : '3px solid transparent', // Fixed border width to prevent jump
                                boxSizing: 'border-box'
                            }}>
                                <img
                                    src={mat.icon}
                                    alt={mat.name}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'cover',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                                        transform: 'scale(1.35)', // Stronger zoom for v1 images
                                        transformOrigin: 'center'
                                    }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.closest('button').querySelector('.fallback').style.display = 'block'; // Show fallback
                                    }}
                                />
                            </div>
                            {/* Fallback avatar - utilizing parent container */}
                            <div className="fallback" style={{
                                display: 'none',
                                width: '64px',
                                height: '64px',
                                borderRadius: '50%',
                                background: '#555',
                                lineHeight: '64px',
                                color: '#fff',
                                fontSize: '24px',
                                textAlign: 'center',
                                margin: '0 auto'
                            }}>
                                {mat.name.substring(0, 1)}
                            </div>

                            <div style={{
                                textAlign: 'center',
                                width: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '2px',
                                flex: 1
                            }}>
                                <div style={{
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    width: '100%'
                                }}>{mat.name}</div>
                                <div style={{ fontSize: '9px', opacity: 0.7 }}>
                                    ρ: {mat.properties.density}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            <div className="panel-section" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                <h4>Current Properties</h4>
                <div style={{ fontSize: '11px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                        <span className="text-muted">Density:</span> {selectedPart.density || 'Auto'}
                    </div>
                    <div>
                        <span className="text-muted">Mass:</span> {selectedPart.mass ? `${selectedPart.mass} kg` : 'Auto'}
                    </div>
                    <div>
                        <span className="text-muted">Static Fric:</span> {selectedPart.staticFriction}
                    </div>
                    <div>
                        <span className="text-muted">Dyn Fric:</span> {selectedPart.dynamicFriction}
                    </div>
                </div>
            </div>
        </div>
    );
}

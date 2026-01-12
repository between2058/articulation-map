/**
 * TagEditorPanel Component
 * 
 * Form for editing semantic tags on the selected part.
 * Allows setting:
 * - Type (link, joint, base, tool)
 * - Role (actuator, support, gripper, sensor, other)
 * - Mobility (fixed, revolute, prismatic)
 */

import React from 'react';

export function TagEditorPanel({
    selectedPart,
    onUpdatePart
}) {
    if (!selectedPart) {
        return (
            <div className="empty-state">
                <div className="empty-state-icon">🏷️</div>
                <p className="empty-state-text">
                    Select a part to edit its tags
                </p>
            </div>
        );
    }

    const handleChange = (field, value) => {
        onUpdatePart(selectedPart.id, { [field]: value });
    };

    return (
        <div>
            {/* Part name display */}
            <div className="form-group">
                <label className="form-label">Selected Part</label>
                <div style={{
                    padding: 'var(--space-md)',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    fontWeight: 500
                }}>
                    {selectedPart.name}
                </div>
            </div>

            {/* Part name edit */}
            <div className="form-group">
                <label className="form-label">Display Name</label>
                <input
                    type="text"
                    className="form-input"
                    value={selectedPart.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter part name"
                />
            </div>

            {/* Type dropdown */}
            <div className="form-group">
                <label className="form-label">Type</label>
                <select
                    className="form-select"
                    value={selectedPart.type}
                    onChange={(e) => handleChange('type', e.target.value)}
                >
                    <option value="link">Link - Movable rigid body</option>
                    <option value="base">Base - Fixed root part</option>
                    <option value="tool">Tool - End effector</option>
                    <option value="joint">Joint - Connection point</option>
                </select>
                <div className="text-muted mt-sm" style={{ fontSize: '11px' }}>
                    {selectedPart.type === 'base' && 'Base parts are fixed in world space'}
                    {selectedPart.type === 'link' && 'Links are rigid bodies that can move via joints'}
                    {selectedPart.type === 'tool' && 'Tools are end effectors like grippers'}
                    {selectedPart.type === 'joint' && 'Marks this as a joint connector'}
                </div>
            </div>

            {/* Role dropdown */}
            <div className="form-group">
                <label className="form-label">Role</label>
                <select
                    className="form-select"
                    value={selectedPart.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                >
                    <option value="other">Other</option>
                    <option value="actuator">Actuator - Applies force/motion</option>
                    <option value="support">Support - Structural element</option>
                    <option value="gripper">Gripper - Grasping mechanism</option>
                    <option value="sensor">Sensor - Sensor mount</option>
                </select>
            </div>

            {/* Mobility dropdown */}
            <div className="form-group">
                <label className="form-label">Mobility</label>
                <select
                    className="form-select"
                    value={selectedPart.mobility}
                    onChange={(e) => handleChange('mobility', e.target.value)}
                >
                    <option value="fixed">Fixed - Cannot move</option>
                    <option value="revolute">Revolute - Rotates around axis</option>
                    <option value="prismatic">Prismatic - Slides along axis</option>
                </select>
                <div className="text-muted mt-sm" style={{ fontSize: '11px' }}>
                    {selectedPart.mobility === 'fixed' && 'Part is welded to its parent'}
                    {selectedPart.mobility === 'revolute' && 'Part rotates like a hinge'}
                    {selectedPart.mobility === 'prismatic' && 'Part slides like a piston'}
                </div>
            </div>

            {/* Mass Properties Section */}
            <div style={{
                marginTop: 'var(--space-lg)',
                paddingTop: 'var(--space-md)',
                borderTop: '1px solid var(--border-color)'
            }}>
                <label className="form-label" style={{ color: 'var(--accent-primary)' }}>
                    ⚖️ Mass Properties
                </label>

                <div className="form-group">
                    <label className="form-label" style={{ fontSize: '11px' }}>
                        Mass Mode
                    </label>
                    <select
                        className="form-select"
                        value={selectedPart.mass !== null ? 'manual' : 'auto'}
                        onChange={(e) => {
                            if (e.target.value === 'auto') {
                                handleChange('mass', null);
                            } else {
                                handleChange('mass', 1.0);
                            }
                        }}
                    >
                        <option value="auto">Auto (from density)</option>
                        <option value="manual">Manual (specify kg)</option>
                    </select>
                </div>

                {selectedPart.mass !== null ? (
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '11px' }}>
                            Mass (kg)
                        </label>
                        <input
                            type="number"
                            className="form-input"
                            value={selectedPart.mass ?? 1.0}
                            min="0.001"
                            step="0.1"
                            onChange={(e) => handleChange('mass', parseFloat(e.target.value) || 0.001)}
                        />
                        <div className="text-muted mt-sm" style={{ fontSize: '10px' }}>
                            Common values: 0.1kg (small part), 1kg (medium), 10kg (heavy)
                        </div>
                    </div>
                ) : (
                    <div className="form-group">
                        <label className="form-label" style={{ fontSize: '11px' }}>
                            Density (kg/m³)
                        </label>
                        <input
                            type="number"
                            className="form-input"
                            value={selectedPart.density ?? 1000}
                            min="1"
                            step="100"
                            onChange={(e) => handleChange('density', parseFloat(e.target.value) || 1000)}
                        />
                        <div className="text-muted mt-sm" style={{ fontSize: '10px' }}>
                            Reference: Water=1000, Plastic=1200, Aluminum=2700, Steel=7800
                        </div>
                    </div>
                )}
            </div>

            {/* Geometry info */}
            <div className="form-group mt-lg">
                <label className="form-label">Geometry Info</label>
                <div style={{
                    padding: 'var(--space-md)',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '12px',
                    color: 'var(--text-secondary)'
                }}>
                    <div>Vertices: {selectedPart.vertexCount?.toLocaleString() || 'N/A'}</div>
                    <div>Faces: {selectedPart.faceCount?.toLocaleString() || 'N/A'}</div>
                </div>
            </div>
        </div>
    );
}

export default TagEditorPanel;

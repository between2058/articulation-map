/**
 * JointEditorPanel Component
 * 
 * UI for defining articulation joints between parts.
 * Features:
 * - List of defined joints
 * - Add new joint form
 * - Edit existing joints
 * - Delete joints
 */

import React, { useState } from 'react';

// Icons for joint types
const jointIcons = {
    revolute: '🔄',
    prismatic: '↔️',
    fixed: '🔒',
};

export function JointEditorPanel({
    parts = [],
    joints = [],
    selectedJointIndex,
    onSelectJoint,
    onAddJoint,
    onUpdateJoint,
    onRemoveJoint,
}) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newJoint, setNewJoint] = useState({
        parent: '',
        child: '',
        type: 'revolute',
        axis: 'Z',
    });

    // Get the currently selected joint for editing
    const selectedJoint = selectedJointIndex !== null ? joints[selectedJointIndex] : null;

    // Handle adding a new joint
    const handleAdd = () => {
        if (!newJoint.parent || !newJoint.child) {
            alert('Please select both parent and child parts');
            return;
        }
        if (newJoint.parent === newJoint.child) {
            alert('Parent and child must be different parts');
            return;
        }

        const axis = {
            'X': [1, 0, 0],
            'Y': [0, 1, 0],
            'Z': [0, 0, 1],
        }[newJoint.axis] || [0, 0, 1];

        onAddJoint(newJoint.parent, newJoint.child);

        // Update the newly added joint with type and axis
        const newIndex = joints.length;
        setTimeout(() => {
            onUpdateJoint(newIndex, { type: newJoint.type, axis });
        }, 0);

        // Reset form
        setNewJoint({
            parent: '',
            child: '',
            type: 'revolute',
            axis: 'Z',
        });
        setShowAddForm(false);
    };

    // Handle updating selected joint
    const handleUpdateSelected = (field, value) => {
        if (selectedJointIndex !== null) {
            if (field === 'axis') {
                const axisVec = {
                    'X': [1, 0, 0],
                    'Y': [0, 1, 0],
                    'Z': [0, 0, 1],
                }[value] || [0, 0, 1];
                onUpdateJoint(selectedJointIndex, { axis: axisVec });
            } else {
                onUpdateJoint(selectedJointIndex, { [field]: value });
            }
        }
    };

    // Get axis label from vector
    const getAxisLabel = (axis) => {
        if (!axis) return 'Z';
        if (axis[0] === 1) return 'X';
        if (axis[1] === 1) return 'Y';
        return 'Z';
    };

    // Get part name by ID
    const getPartName = (id) => {
        const part = parts.find(p => p.id === id);
        return part?.name || id;
    };

    return (
        <div>
            {/* Joint list */}
            {joints.length > 0 ? (
                <ul className="joint-list">
                    {joints.map((joint, index) => (
                        <li
                            key={index}
                            className={`joint-item ${selectedJointIndex === index ? 'selected' : ''}`}
                            onClick={() => onSelectJoint(index)}
                            style={{
                                border: selectedJointIndex === index
                                    ? '1px solid var(--accent-primary)'
                                    : '1px solid transparent',
                                cursor: 'pointer'
                            }}
                        >
                            <div className="joint-item-header">
                                <span className="joint-item-name">
                                    {jointIcons[joint.type]} {joint.name}
                                </span>
                                <span className={`joint-item-type ${joint.type}`}>
                                    {joint.type}
                                </span>
                            </div>
                            <div className="joint-item-connection">
                                <span>{getPartName(joint.parent)}</span>
                                <span className="joint-item-arrow">→</span>
                                <span>{getPartName(joint.child)}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="empty-state">
                    <div className="empty-state-icon">⚙️</div>
                    <p className="empty-state-text">
                        No joints defined.<br />
                        Add joints to connect parts.
                    </p>
                </div>
            )}

            {/* Selected joint editor */}
            {selectedJoint && (
                <div style={{
                    marginTop: 'var(--space-lg)',
                    padding: 'var(--space-md)',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)'
                }}>
                    <div className="flex justify-between items-center mb-md">
                        <label className="form-label" style={{ margin: 0 }}>
                            Edit Joint
                        </label>
                        <button
                            className="btn btn-ghost btn-sm text-error"
                            onClick={() => onRemoveJoint(selectedJointIndex)}
                        >
                            Delete
                        </button>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Name</label>
                        <input
                            type="text"
                            className="form-input"
                            value={selectedJoint.name}
                            onChange={(e) => handleUpdateSelected('name', e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Type</label>
                        <select
                            className="form-select"
                            value={selectedJoint.type}
                            onChange={(e) => handleUpdateSelected('type', e.target.value)}
                        >
                            <option value="revolute">Revolute (Rotation)</option>
                            <option value="prismatic">Prismatic (Sliding)</option>
                            <option value="fixed">Fixed (Locked)</option>
                        </select>
                    </div>

                    {selectedJoint.type !== 'fixed' && (
                        <>
                            <div className="form-group">
                                <label className="form-label">Axis</label>
                                <select
                                    className="form-select"
                                    value={getAxisLabel(selectedJoint.axis)}
                                    onChange={(e) => handleUpdateSelected('axis', e.target.value)}
                                >
                                    <option value="X">X Axis</option>
                                    <option value="Y">Y Axis</option>
                                    <option value="Z">Z Axis</option>
                                </select>
                            </div>

                            {/* Joint Limits Section */}
                            <div style={{
                                marginTop: 'var(--space-md)',
                                paddingTop: 'var(--space-md)',
                                borderTop: '1px solid var(--border-color)'
                            }}>
                                <label className="form-label" style={{ color: 'var(--accent-primary)' }}>
                                    📐 Joint Limits
                                </label>
                                <div className="flex gap-sm">
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label" style={{ fontSize: '11px' }}>
                                            Lower {selectedJoint.type === 'revolute' ? '(°)' : '(m)'}
                                        </label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={selectedJoint.lowerLimit ?? -180}
                                            onChange={(e) => handleUpdateSelected('lowerLimit', parseFloat(e.target.value))}
                                        />
                                    </div>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label" style={{ fontSize: '11px' }}>
                                            Upper {selectedJoint.type === 'revolute' ? '(°)' : '(m)'}
                                        </label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={selectedJoint.upperLimit ?? 180}
                                            onChange={(e) => handleUpdateSelected('upperLimit', parseFloat(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Drive Parameters Section */}
                            <div style={{
                                marginTop: 'var(--space-md)',
                                paddingTop: 'var(--space-md)',
                                borderTop: '1px solid var(--border-color)'
                            }}>
                                <label className="form-label" style={{ color: 'var(--accent-primary)' }}>
                                    ⚡ Drive (Motor)
                                </label>

                                <div className="form-group">
                                    <label className="form-label" style={{ fontSize: '11px' }}>Control Mode</label>
                                    <select
                                        className="form-select"
                                        value={selectedJoint.driveType || 'position'}
                                        onChange={(e) => handleUpdateSelected('driveType', e.target.value)}
                                    >
                                        <option value="position">Position Control</option>
                                        <option value="velocity">Velocity Control</option>
                                        <option value="none">No Drive</option>
                                    </select>
                                </div>

                                {selectedJoint.driveType !== 'none' && (
                                    <>
                                        <div className="flex gap-sm">
                                            <div className="form-group" style={{ flex: 1 }}>
                                                <label className="form-label" style={{ fontSize: '11px' }}>
                                                    Stiffness (Kp)
                                                </label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    value={selectedJoint.driveStiffness ?? 1000}
                                                    onChange={(e) => handleUpdateSelected('driveStiffness', parseFloat(e.target.value))}
                                                />
                                            </div>
                                            <div className="form-group" style={{ flex: 1 }}>
                                                <label className="form-label" style={{ fontSize: '11px' }}>
                                                    Damping (Kd)
                                                </label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    value={selectedJoint.driveDamping ?? 100}
                                                    onChange={(e) => handleUpdateSelected('driveDamping', parseFloat(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label" style={{ fontSize: '11px' }}>
                                                Max Force/Torque
                                            </label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={selectedJoint.driveMaxForce ?? 1000}
                                                onChange={(e) => handleUpdateSelected('driveMaxForce', parseFloat(e.target.value))}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Add joint form */}
            {showAddForm ? (
                <div style={{
                    marginTop: 'var(--space-lg)',
                    padding: 'var(--space-md)',
                    background: 'rgba(99, 102, 241, 0.1)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    borderRadius: 'var(--radius-sm)'
                }}>
                    <div className="form-group">
                        <label className="form-label">Parent Part</label>
                        <select
                            className="form-select"
                            value={newJoint.parent}
                            onChange={(e) => setNewJoint(prev => ({ ...prev, parent: e.target.value }))}
                        >
                            <option value="">Select parent...</option>
                            {parts.map(part => (
                                <option key={part.id} value={part.id}>{part.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Child Part</label>
                        <select
                            className="form-select"
                            value={newJoint.child}
                            onChange={(e) => setNewJoint(prev => ({ ...prev, child: e.target.value }))}
                        >
                            <option value="">Select child...</option>
                            {parts.map(part => (
                                <option key={part.id} value={part.id}>{part.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Joint Type</label>
                        <select
                            className="form-select"
                            value={newJoint.type}
                            onChange={(e) => setNewJoint(prev => ({ ...prev, type: e.target.value }))}
                        >
                            <option value="revolute">Revolute (Rotation)</option>
                            <option value="prismatic">Prismatic (Sliding)</option>
                            <option value="fixed">Fixed (Locked)</option>
                        </select>
                    </div>

                    {newJoint.type !== 'fixed' && (
                        <div className="form-group">
                            <label className="form-label">Axis</label>
                            <select
                                className="form-select"
                                value={newJoint.axis}
                                onChange={(e) => setNewJoint(prev => ({ ...prev, axis: e.target.value }))}
                            >
                                <option value="X">X Axis</option>
                                <option value="Y">Y Axis</option>
                                <option value="Z">Z Axis</option>
                            </select>
                        </div>
                    )}

                    <div className="flex gap-sm">
                        <button className="btn btn-primary flex-1" onClick={handleAdd}>
                            Add Joint
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowAddForm(false)}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <button
                    className="btn btn-primary btn-block mt-lg"
                    onClick={() => setShowAddForm(true)}
                    disabled={parts.length < 2}
                >
                    + Add Joint
                </button>
            )}

            {parts.length < 2 && (
                <p className="text-muted mt-sm" style={{ fontSize: '11px', textAlign: 'center' }}>
                    Need at least 2 parts to create joints
                </p>
            )}
        </div>
    );
}

export default JointEditorPanel;

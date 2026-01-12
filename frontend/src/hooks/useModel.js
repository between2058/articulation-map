/**
 * useModel Hook
 * 
 * Manages the state for the 3D model including:
 * - Model URL and loading state
 * - Parts list with semantic tags
 * - Joints definitions
 * - Selection state
 * 
 * This is the central state management for the articulation editor.
 */

import { useState, useCallback } from 'react';

// Default part structure
const createDefaultPart = (parsed) => ({
    id: parsed.id,
    name: parsed.name,
    type: 'link',
    role: 'other',
    mobility: 'fixed',
    vertexCount: parsed.vertex_count || 0,
    faceCount: parsed.face_count || 0,
    boundsMin: parsed.bounds_min || [0, 0, 0],
    boundsMax: parsed.bounds_max || [0, 0, 0],
    // Mass properties
    mass: null,  // null = auto-compute from density
    density: 1000,  // kg/m³ (water density as default)
    centerOfMass: null,  // null = auto-compute
    collisionType: 'convexHull', // 'mesh' | 'convexHull' | 'convexDecomposition' | 'none'
});

// Default joint structure
const createDefaultJoint = (name, parent, child) => ({
    name,
    parent,
    child,
    type: 'revolute',
    axis: [0, 0, 1],
    anchor: [0, 0, 0], // x, y, z relative to child (optional)
    // Joint limits (degrees for revolute, meters for prismatic)
    lowerLimit: -180,
    upperLimit: 180,
    // Drive parameters
    driveStiffness: 1000,
    driveDamping: 100,
    driveMaxForce: 1000,
    driveType: 'position',
    disableCollision: true, // Disable collision between parent and child by default
});

export function useModel() {
    // Model file state
    const [modelUrl, setModelUrl] = useState(null);
    const [modelFilename, setModelFilename] = useState(null);
    const [modelName, setModelName] = useState('robot');

    // Loading states
    const [isLoading, setIsLoading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);

    // Parts and joints
    const [parts, setParts] = useState([]);
    const [joints, setJoints] = useState([]);

    // Selection
    const [selectedPartId, setSelectedPartId] = useState(null);
    const [selectedJointIndex, setSelectedJointIndex] = useState(null);

    /**
     * Upload a GLB file to the server
     */
    const uploadModel = useCallback(async (file) => {
        setIsLoading(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Upload failed');
            }

            const data = await response.json();

            // Set model URL for viewer
            setModelUrl(data.model_url);
            setModelFilename(data.filename);

            // Extract model name from filename
            const name = file.name.replace(/\.glb$/i, '').replace(/[^a-zA-Z0-9]/g, '_');
            setModelName(name);

            // Convert parsed parts to our format
            const newParts = data.parts.map(createDefaultPart);
            setParts(newParts);

            // Clear joints when new model loaded
            setJoints([]);
            setSelectedPartId(null);
            setSelectedJointIndex(null);

            return data;

        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    /**
     * Update a part's properties
     */
    const updatePart = useCallback((partId, updates) => {
        setParts(prev => prev.map(part =>
            part.id === partId ? { ...part, ...updates } : part
        ));
    }, []);

    /**
     * Select a part by ID
     */
    const selectPart = useCallback((partId) => {
        setSelectedPartId(partId);
        setSelectedJointIndex(null);
    }, []);

    /**
     * Get the currently selected part
     */
    const getSelectedPart = useCallback(() => {
        return parts.find(p => p.id === selectedPartId) || null;
    }, [parts, selectedPartId]);

    /**
     * Add a new joint
     */
    const addJoint = useCallback((parent, child) => {
        const jointName = `joint_${joints.length + 1}`;
        const newJoint = createDefaultJoint(jointName, parent, child);
        setJoints(prev => [...prev, newJoint]);
        setSelectedJointIndex(joints.length);
        return newJoint;
    }, [joints]);

    /**
     * Update a joint's properties
     */
    const updateJoint = useCallback((index, updates) => {
        setJoints(prev => prev.map((joint, i) =>
            i === index ? { ...joint, ...updates } : joint
        ));
    }, []);

    /**
     * Remove a joint
     */
    const removeJoint = useCallback((index) => {
        setJoints(prev => prev.filter((_, i) => i !== index));
        if (selectedJointIndex === index) {
            setSelectedJointIndex(null);
        } else if (selectedJointIndex > index) {
            setSelectedJointIndex(prev => prev - 1);
        }
    }, [selectedJointIndex]);

    /**
     * Select a joint by index
     */
    const selectJoint = useCallback((index) => {
        setSelectedJointIndex(index);
        setSelectedPartId(null);
    }, []);

    /**
     * Export the articulation to USD
     */
    const exportToUSD = useCallback(async () => {
        if (!modelFilename) {
            throw new Error('No model loaded');
        }

        setIsExporting(true);
        setError(null);

        try {
            // Convert parts to API format
            const apiParts = parts.map(part => ({
                id: part.id,
                name: part.name,
                type: part.type,
                role: part.role,
                mobility: part.mobility,
                mass: part.mass,
                density: part.density,
                center_of_mass: part.centerOfMass,
                collision_type: part.collisionType,
            }));

            // Convert joints to API format
            const apiJoints = joints.map(joint => ({
                name: joint.name,
                parent: joint.parent,
                child: joint.child,
                type: joint.type,
                axis: joint.axis,
                anchor: joint.anchor,
                lower_limit: joint.lowerLimit,
                upper_limit: joint.upperLimit,
                drive_stiffness: joint.driveStiffness,
                drive_damping: joint.driveDamping,
                drive_max_force: joint.driveMaxForce,
                drive_type: joint.driveType,
                disable_collision: joint.disableCollision !== false, // Default to true if undefined
            }));

            const requestBody = {
                glb_filename: modelFilename,
                articulation: {
                    model_name: modelName,
                    parts: apiParts,
                    joints: apiJoints,
                },
            };

            const response = await fetch('/api/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Export failed');
            }

            const data = await response.json();

            // Trigger download
            if (data.download_url) {
                const link = document.createElement('a');
                link.href = data.download_url;
                link.download = data.filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            return data;

        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsExporting(false);
        }
    }, [modelFilename, modelName, parts, joints]);

    /**
     * Reset the entire state
     */
    const reset = useCallback(() => {
        setModelUrl(null);
        setModelFilename(null);
        setModelName('robot');
        setParts([]);
        setJoints([]);
        setSelectedPartId(null);
        setSelectedJointIndex(null);
        setError(null);
    }, []);

    return {
        // Model state
        modelUrl,
        modelFilename,
        modelName,
        setModelName,

        // Loading states
        isLoading,
        isExporting,
        error,

        // Parts
        parts,
        selectedPartId,
        selectPart,
        getSelectedPart,
        updatePart,

        // Joints
        joints,
        selectedJointIndex,
        selectJoint,
        addJoint,
        updateJoint,
        removeJoint,

        // Actions
        uploadModel,
        exportToUSD,
        reset,
    };
}

export default useModel;

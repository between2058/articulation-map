/**
 * SceneViewer Component
 * 
 * Three.js-based 3D viewer for GLB models using react-three-fiber.
 * Features:
 * - GLB model loading and display
 * - Click-to-select mesh parts
 * - Visual highlighting of selected parts
 * - Orbit controls for camera manipulation
 * - Click empty space to deselect
 */

import React, { Suspense, useRef, useState, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, Center } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Individual mesh part that can be selected
 */
function SelectableMesh({ mesh, isSelected, onSelect, partId }) {
    const meshRef = useRef();
    const [hovered, setHovered] = useState(false);

    // Clone the material to avoid affecting other instances
    const material = mesh.material.clone();

    // Modify material based on state
    if (isSelected) {
        material.emissive = new THREE.Color(0x6366f1);
        material.emissiveIntensity = 0.3;
    } else if (hovered) {
        material.emissive = new THREE.Color(0x8b5cf6);
        material.emissiveIntensity = 0.15;
    }

    return (
        <mesh
            ref={meshRef}
            geometry={mesh.geometry}
            material={material}
            position={mesh.position}
            rotation={mesh.rotation}
            scale={mesh.scale}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(partId);
            }}
            onPointerOver={(e) => {
                e.stopPropagation();
                setHovered(true);
                document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
                setHovered(false);
                document.body.style.cursor = 'auto';
            }}
        />
    );
}

/**
 * Background click handler - deselects when clicking empty space
 */
function BackgroundClickHandler({ onDeselect }) {
    const { gl } = useThree();

    useEffect(() => {
        const canvas = gl.domElement;

        const handleClick = (e) => {
            // This will be called for clicks that don't hit any mesh
            // The mesh onClick stops propagation, so this only fires on empty space
        };

        return () => {
            // cleanup
        };
    }, [gl, onDeselect]);

    return (
        <mesh
            position={[0, 0, -100]}
            onClick={(e) => {
                onDeselect();
            }}
        >
            <planeGeometry args={[1000, 1000]} />
            <meshBasicMaterial visible={false} />
        </mesh>
    );
}


/**
 * Visualizes a joint pivot and axis attached to a mesh
 */
function JointVisualizer({ joint, childMesh, isSelected, isHovered }) {
    useEffect(() => {
        if (!childMesh) return;

        const group = new THREE.Group();
        childMesh.add(group);

        // Position at anchor
        const anchorPos = new THREE.Vector3(...(joint.anchor || [0, 0, 0]));
        group.position.copy(anchorPos);

        // 1. Pivot Marker (Sphere)
        const radius = isSelected ? 0.04 : 0.02; // Small sphere
        const color = isSelected ? 0xffcc00 : 0xffffff;

        const sphereGeo = new THREE.SphereGeometry(radius, 16, 16);
        const sphereMat = new THREE.MeshBasicMaterial({
            color,
            depthTest: false,
            transparent: true,
            opacity: 0.8
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        sphere.renderOrder = 999; // Always on top
        group.add(sphere);

        // 2. Axis Arrow
        // Axis is in Child Frame? Yes, assuming joint.axis is in child frame for simplicity/visuals,
        // although physics joint axis is technically usually defined in joint frame.
        // For this editor, we assume Axis is local to the part for now.
        const axisVec = new THREE.Vector3(...(joint.axis || [0, 0, 1])).normalize();
        const arrowLength = 0.2; // 20cm
        const arrowColor = 0xff0000;

        const arrowHelper = new THREE.ArrowHelper(axisVec, new THREE.Vector3(0, 0, 0), arrowLength, arrowColor);
        arrowHelper.line.material.depthTest = false;
        arrowHelper.cone.material.depthTest = false;
        arrowHelper.renderOrder = 999;
        group.add(arrowHelper);

        return () => {
            childMesh.remove(group);
            sphereGeo.dispose();
            sphereMat.dispose();
            // ArrowHelper cleanup handled by itself mostly, but geometries stay if not disposed.
            // standard three.js dispose necessary? usually yes.
        };
    }, [childMesh, joint, isSelected]);

    return null;
}

/**
 * Model loader and renderer
 */
function Model({ url, selectedPartId, onSelectPart, onPartsLoaded, joints, selectedJointIndex }) {
    const { scene } = useGLTF(url);
    const groupRef = useRef();

    // Extract mesh parts from the loaded scene
    const [meshParts, setMeshParts] = useState([]);

    useEffect(() => {
        const parts = [];

        scene.traverse((child) => {
            if (child.isMesh) {
                // Use original mesh name - same logic as backend glb_parser.py
                const originalName = child.name || `Part_${parts.length}`;

                // Generate ID matching backend's _generate_unique_id logic
                const id = originalName
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '') || `part_${parts.length}`;

                // Ensure material has necessary properties for highlighting
                if (child.material) {
                    if (!child.material.userData.originalEmissive) {
                        child.material.userData.originalEmissive = child.material.emissive.clone();
                    }
                    child.material = child.material.clone();
                }

                parts.push({
                    id,
                    name: originalName,
                    mesh: child,
                });
            }
        });

        setMeshParts(parts);

        // Notify parent of loaded parts
        if (onPartsLoaded) {
            onPartsLoaded(parts.map(p => ({ id: p.id, name: p.name })));
        }
    }, [scene, onPartsLoaded]);

    return (
        <group ref={groupRef}>
            <Center>
                <primitive object={scene} />
                {/* Overlay selectable meshes for interaction */}
                {meshParts.map((part) => (
                    <SelectableMesh
                        key={part.id}
                        mesh={part.mesh}
                        partId={part.id}
                        isSelected={selectedPartId === part.id}
                        onSelect={onSelectPart}
                    />
                ))}

                {/* Visualizers for Joints */}
                {joints && joints.map((joint, index) => {
                    const childPart = meshParts.find(p => p.id === joint.child);
                    if (!childPart) return null;

                    return (
                        <JointVisualizer
                            key={index}
                            joint={joint}
                            childMesh={childPart.mesh}
                            isSelected={selectedJointIndex === index}
                        />
                    );
                })}
            </Center>
        </group>
    );
}

/**
 * Loading fallback
 */
function Loader() {
    return (
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#333" wireframe />
        </mesh>
    );
}

/**
 * Main scene viewer component
 */
export function SceneViewer({
    modelUrl,
    selectedPartId,
    onSelectPart,
    onDeselect,
    joints,
    selectedJointIndex
}) {
    return (
        <div className="viewer-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
            {modelUrl ? (
                <Canvas
                    shadows
                    camera={{ position: [3, 3, 3], fov: 50 }}
                    gl={{ antialias: true, alpha: true }}
                    style={{ background: 'linear-gradient(180deg, #0a0a0f 0%, #12121a 100%)' }}
                    onPointerMissed={() => onDeselect && onDeselect()}
                >
                    {/* Lighting */}
                    <ambientLight intensity={0.4} />
                    <directionalLight position={[10, 10, 5]} intensity={1} castShadow />
                    <directionalLight position={[-10, -10, -5]} intensity={0.3} />

                    {/* Environment for reflections */}
                    <Environment preset="night" />

                    {/* Model */}
                    <Suspense fallback={<Loader />}>
                        <Model
                            url={modelUrl}
                            selectedPartId={selectedPartId}
                            onSelectPart={onSelectPart}
                            joints={joints}
                            selectedJointIndex={selectedJointIndex}
                        />
                    </Suspense>

                    {/* Controls */}
                    <OrbitControls
                        enableDamping
                        dampingFactor={0.05}
                        minDistance={0.1}
                        maxDistance={50}
                        makeDefault
                    />

                    {/* Grid helper */}
                    <gridHelper args={[10, 10, '#333', '#222']} />
                </Canvas>
            ) : (
                <div className="viewer-empty" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    color: 'var(--text-secondary)'
                }}>
                    <div className="viewer-empty-icon" style={{ fontSize: '48px', marginBottom: '1rem' }}>📦</div>
                    <p>Upload a GLB model to start</p>
                </div>
            )}

            {modelUrl && (
                <div className="viewer-overlay" style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.5)',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.8)',
                    pointerEvents: 'none'
                }}>
                    Click Part: Select • Drag: Rotate • Scroll: Zoom • Joint Anchors are shown for selected joints
                </div>
            )}
        </div>
    );
}

export default SceneViewer;


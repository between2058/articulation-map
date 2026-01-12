/**
 * Phidias Articulation Editor - Main App Component
 * 
 * Layout structure:
 * - Header with title and export button
 * - Main area with three panels:
 *   - Left: Part list + File uploader
 *   - Center: 3D viewer
 *   - Right: Tag editor + Joint editor (tabbed)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useModel } from './hooks/useModel';
import { FileUploader } from './components/FileUploader';
import { SceneViewer } from './components/SceneViewer';
import { PartListPanel } from './components/PartListPanel';
import { TagEditorPanel } from './components/TagEditorPanel';
import { JointEditorPanel } from './components/JointEditorPanel';

function App() {
    // Right panel tab state
    const [activeTab, setActiveTab] = useState('tags');

    // Model state from custom hook
    const {
        modelUrl,
        modelName,
        setModelName,
        isLoading,
        isExporting,
        error,
        parts,
        selectedPartId,
        selectPart,
        getSelectedPart,
        updatePart,
        joints,
        selectedJointIndex,
        selectJoint,
        addJoint,
        updateJoint,
        removeJoint,
        uploadModel,
        exportToUSD,
        reset,
    } = useModel();

    // Handle file upload
    const handleUpload = useCallback(async (file) => {
        try {
            await uploadModel(file);
        } catch (err) {
            console.error('Upload error:', err);
        }
    }, [uploadModel]);

    // Handle export
    const handleExport = useCallback(async () => {
        try {
            await exportToUSD();
        } catch (err) {
            console.error('Export error:', err);
            alert(`Export failed: ${err.message}`);
        }
    }, [exportToUSD]);

    // Handle deselect (ESC key or click on empty space)
    const handleDeselect = useCallback(() => {
        selectPart(null);
    }, [selectPart]);

    // ESC key listener to deselect
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleDeselect();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleDeselect]);

    // Get selected part for editing
    const selectedPart = getSelectedPart();

    // Check if we can export (need at least one part)
    const canExport = parts.length > 0 && !isExporting;

    return (
        <div className="app">
            {/* Header */}
            <header className="app-header">
                <div className="flex items-center gap-md">
                    <h1>Phidias</h1>
                    <span className="text-muted" style={{ fontSize: '12px' }}>
                        Articulation Editor
                    </span>
                </div>

                <div className="flex items-center gap-md">
                    {modelUrl && (
                        <div className="flex items-center gap-sm">
                            <label className="text-muted" style={{ fontSize: '12px' }}>
                                Model Name:
                            </label>
                            <input
                                type="text"
                                className="form-input"
                                style={{ width: '150px', padding: '4px 8px' }}
                                value={modelName}
                                onChange={(e) => setModelName(e.target.value)}
                            />
                        </div>
                    )}

                    <button
                        className="btn btn-primary"
                        onClick={handleExport}
                        disabled={!canExport}
                    >
                        {isExporting ? (
                            <>
                                <span className="loading-spinner" style={{ width: '16px', height: '16px' }} />
                                Exporting...
                            </>
                        ) : (
                            <>Export USD</>
                        )}
                    </button>

                    {modelUrl && (
                        <button className="btn btn-ghost" onClick={reset}>
                            New
                        </button>
                    )}
                </div>
            </header>

            {/* Main content */}
            <main className="app-main">
                {/* Left Panel - Parts */}
                <aside className="panel panel-left">
                    <div className="panel-header">
                        <h2>Parts</h2>
                    </div>

                    <div className="panel-content">
                        {!modelUrl ? (
                            <FileUploader onUpload={handleUpload} isLoading={isLoading} />
                        ) : (
                            <PartListPanel
                                parts={parts}
                                selectedPartId={selectedPartId}
                                onSelectPart={selectPart}
                            />
                        )}

                        {error && (
                            <div className="text-error mt-md" style={{ fontSize: '12px' }}>
                                Error: {error}
                            </div>
                        )}
                    </div>
                </aside>

                {/* Center - 3D Viewer */}
                <SceneViewer
                    modelUrl={modelUrl}
                    selectedPartId={selectedPartId}
                    onSelectPart={selectPart}
                    onDeselect={handleDeselect}
                />

                {/* Right Panel - Editor */}
                <aside className="panel panel-right">
                    {/* Tabs */}
                    <div className="tabs">
                        <button
                            className={`tab ${activeTab === 'tags' ? 'active' : ''}`}
                            onClick={() => setActiveTab('tags')}
                        >
                            Tags
                        </button>
                        <button
                            className={`tab ${activeTab === 'joints' ? 'active' : ''}`}
                            onClick={() => setActiveTab('joints')}
                        >
                            Joints ({joints.length})
                        </button>
                    </div>

                    <div className="panel-content">
                        {activeTab === 'tags' ? (
                            <TagEditorPanel
                                selectedPart={selectedPart}
                                onUpdatePart={updatePart}
                            />
                        ) : (
                            <JointEditorPanel
                                parts={parts}
                                joints={joints}
                                selectedJointIndex={selectedJointIndex}
                                onSelectJoint={selectJoint}
                                onAddJoint={addJoint}
                                onUpdateJoint={updateJoint}
                                onRemoveJoint={removeJoint}
                            />
                        )}
                    </div>
                </aside>
            </main>
        </div>
    );
}

export default App;


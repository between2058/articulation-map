/**
 * FileUploader Component
 * 
 * Drag-and-drop file upload zone for GLB models.
 * Supports both drag-drop and click-to-browse.
 */

import React, { useRef, useState, useCallback } from 'react';

export function FileUploader({ onUpload, isLoading }) {
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = useRef(null);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.name.toLowerCase().endsWith('.glb')) {
                onUpload(file);
            } else {
                alert('Please upload a .glb file');
            }
        }
    }, [onUpload]);

    const handleClick = useCallback(() => {
        inputRef.current?.click();
    }, []);

    const handleFileChange = useCallback((e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.name.toLowerCase().endsWith('.glb')) {
                onUpload(file);
            } else {
                alert('Please upload a .glb file');
            }
        }
        // Reset input so same file can be uploaded again
        e.target.value = '';
    }, [onUpload]);

    return (
        <div
            className={`file-uploader ${isDragOver ? 'dragover' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".glb"
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />

            {isLoading ? (
                <>
                    <div className="loading-spinner" style={{ margin: '0 auto var(--space-md)' }} />
                    <div className="file-uploader-text">Uploading...</div>
                </>
            ) : (
                <>
                    <div className="file-uploader-icon">📦</div>
                    <div className="file-uploader-text">
                        Drop a GLB file here or click to browse
                    </div>
                    <div className="file-uploader-hint">
                        Supports binary glTF (.glb) files
                    </div>
                </>
            )}
        </div>
    );
}

export default FileUploader;

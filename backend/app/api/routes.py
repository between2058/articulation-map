"""
API Routes for Phidias Articulation MVP

Endpoints:
- POST /upload: Upload GLB file, parse and return parts list
- POST /export: Generate USD from articulation data
- GET /download/{filename}: Download generated USD files
- GET /models/{filename}: Serve uploaded GLB files for frontend viewer
"""

import os
import uuid
import logging
from pathlib import Path
from typing import List

from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import FileResponse

from app.models.schemas import (
    UploadResponse, 
    ExportRequest, 
    ExportResponse,
    Part,
    ArticulationData
)
from app.services.glb_parser import glb_parser
from app.services.usd_builder import usd_builder
from app.services.physics_injector import physics_injector

logger = logging.getLogger(__name__)

router = APIRouter()

# Directories for file storage
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")

# Ensure directories exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload", response_model=UploadResponse)
async def upload_glb(file: UploadFile = File(...)):
    """
    Upload a GLB file and parse its mesh structure.
    
    The file is saved to the uploads directory and parsed using trimesh
    to extract all mesh parts with their geometric properties.
    
    Returns:
        UploadResponse with parsed parts list and model URL
    """
    # Validate file extension
    if not file.filename.lower().endswith('.glb'):
        raise HTTPException(
            status_code=400, 
            detail="Only .glb files are supported"
        )
    
    # Generate unique filename to avoid collisions
    unique_id = str(uuid.uuid4())[:8]
    safe_filename = f"{unique_id}_{file.filename}"
    filepath = UPLOAD_DIR / safe_filename
    
    try:
        # Save uploaded file
        content = await file.read()
        with open(filepath, 'wb') as f:
            f.write(content)
        
        logger.info(f"Saved uploaded file: {filepath}")
        
        # Parse the GLB file
        parts = glb_parser.parse_glb(str(filepath))
        
        # Construct model URL for frontend
        model_url = f"/api/models/{safe_filename}"
        
        return UploadResponse(
            success=True,
            message=f"Successfully parsed {len(parts)} parts from {file.filename}",
            filename=safe_filename,
            model_url=model_url,
            parts=parts
        )
        
    except ValueError as e:
        # Clean up file if parsing failed
        if filepath.exists():
            filepath.unlink()
        raise HTTPException(status_code=400, detail=str(e))
    
    except Exception as e:
        # Clean up file on any error
        if filepath.exists():
            filepath.unlink()
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@router.post("/export", response_model=ExportResponse)
async def export_usd(request: ExportRequest):
    """
    Export articulation data to a physics-enabled USD file.
    
    Takes the GLB filename and articulation data (parts + joints),
    converts to USD with proper physics schemas for Isaac Sim.
    
    Returns:
        ExportResponse with download URL for the generated USD
    """
    glb_path = UPLOAD_DIR / request.glb_filename
    
    if not glb_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"GLB file not found: {request.glb_filename}"
        )
    
    try:
        # Generate output filename
        base_name = request.articulation.model_name or "robot"
        output_filename = f"{base_name}_{str(uuid.uuid4())[:8]}.usda"
        
        # Get mesh data from GLB
        mesh_data = glb_parser.get_all_mesh_data(str(glb_path))
        
        if not mesh_data:
            raise HTTPException(
                status_code=400,
                detail="No mesh data found in GLB file"
            )
        
        # Build part info list from articulation data
        part_info = [
            {
                'id': part.id,
                'name': part.name,
                'type': part.type,
                'role': part.role,
                'mobility': part.mobility
            }
            for part in request.articulation.parts
        ]
        
        # Build USD stage with meshes
        stage, part_paths = usd_builder.build_from_parts(
            filename=output_filename,
            model_name=request.articulation.model_name,
            mesh_data=mesh_data,
            part_info=part_info
        )
        
        # Inject physics schemas
        physics_injector.inject_physics(
            stage=stage,
            articulation_data=request.articulation,
            part_paths=part_paths
        )
        
        # Save the stage
        output_path = usd_builder.save_stage(stage)
        
        # Construct download URL
        download_url = f"/api/download/{output_filename}"
        
        logger.info(f"Exported USD: {output_path}")
        
        return ExportResponse(
            success=True,
            message=f"Successfully exported to {output_filename}",
            download_url=download_url,
            filename=output_filename
        )
        
    except Exception as e:
        logger.error(f"Export failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Export failed: {str(e)}"
        )


@router.get("/download/{filename}")
async def download_usd(filename: str):
    """
    Download a generated USD file.
    
    Args:
        filename: Name of the USD file to download
        
    Returns:
        File download response
    """
    filepath = OUTPUT_DIR / filename
    
    if not filepath.exists():
        raise HTTPException(
            status_code=404,
            detail=f"File not found: {filename}"
        )
    
    return FileResponse(
        path=str(filepath),
        filename=filename,
        media_type="application/octet-stream"
    )


@router.get("/models/{filename}")
async def serve_model(filename: str):
    """
    Serve an uploaded GLB model file.
    
    Used by the frontend 3D viewer to load the model.
    
    Args:
        filename: Name of the GLB file
        
    Returns:
        File response with appropriate MIME type
    """
    filepath = UPLOAD_DIR / filename
    
    if not filepath.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Model not found: {filename}"
        )
    
    return FileResponse(
        path=str(filepath),
        filename=filename,
        media_type="model/gltf-binary"
    )


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "phidias-articulation-api"}

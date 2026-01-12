"""
USD Builder Service

Builds USD (Universal Scene Description) stages from mesh data.
Creates the scene hierarchy with Xform and Mesh prims.

This module handles:
- Creating USD stage with proper metadata
- Adding mesh geometry as Mesh prims
- Setting up Xform hierarchy for parts
- Basic geometry conversion from numpy arrays

The physics schemas are added separately by physics_injector.py
"""

import os
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

import numpy as np

# USD imports
from pxr import Usd, UsdGeom, Gf, Vt, Sdf

logger = logging.getLogger(__name__)


class USDBuilder:
    """
    Builds USD stages from mesh data.
    
    Creates a well-structured USD file with proper hierarchy
    suitable for physics simulation in Isaac Sim.
    """
    
    def __init__(self, output_dir: str = "outputs"):
        """
        Initialize the USD builder.
        
        Args:
            output_dir: Directory to save generated USD files
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def create_stage(
        self, 
        filename: str,
        model_name: str = "Robot",
        up_axis: str = "Z",
        meters_per_unit: float = 1.0
    ) -> Usd.Stage:
        """
        Create a new USD stage with proper settings.
        
        Args:
            filename: Output filename (without path)
            model_name: Name for the root prim
            up_axis: Up axis ("Y" or "Z")
            meters_per_unit: Scale factor (1.0 = meters)
            
        Returns:
            Usd.Stage object
        """
        filepath = self.output_dir / filename
        
        # Create the stage
        stage = Usd.Stage.CreateNew(str(filepath))
        
        # Set stage metadata
        UsdGeom.SetStageUpAxis(stage, UsdGeom.Tokens.z if up_axis == "Z" else UsdGeom.Tokens.y)
        UsdGeom.SetStageMetersPerUnit(stage, meters_per_unit)
        
        # Create root prim
        root_path = f"/{self._sanitize_prim_name(model_name)}"
        root_xform = UsdGeom.Xform.Define(stage, root_path)
        
        # Set as default prim
        stage.SetDefaultPrim(root_xform.GetPrim())
        
        logger.info(f"Created USD stage: {filepath}")
        
        return stage
    
    def add_physics_scene(self, stage: Usd.Stage) -> str:
        """
        Add a PhysicsScene prim to the stage.
        
        The PhysicsScene is required for simulation and defines
        global physics parameters like gravity.
        
        Args:
            stage: USD stage
            
        Returns:
            Path to the PhysicsScene prim
        """
        from pxr import UsdPhysics
        
        root_prim = stage.GetDefaultPrim()
        scene_path = root_prim.GetPath().AppendChild("PhysicsScene")
        
        # Define physics scene
        physics_scene = UsdPhysics.Scene.Define(stage, scene_path)
        
        # Set gravity (default -9.81 m/s² in Z-down, but Isaac uses Z-up)
        # So gravity should be (0, 0, -9.81) for Z-up stages
        physics_scene.CreateGravityDirectionAttr(Gf.Vec3f(0, 0, -1))
        physics_scene.CreateGravityMagnitudeAttr(9.81)
        
        logger.info(f"Added PhysicsScene at {scene_path}")
        
        return str(scene_path)
    
    def add_mesh_prim(
        self,
        stage: Usd.Stage,
        parent_path: str,
        name: str,
        vertices: np.ndarray,
        faces: np.ndarray,
        normals: Optional[np.ndarray] = None,
        transform: Optional[Tuple[Tuple[float, ...], ...]] = None
    ) -> str:
        """
        Add a mesh geometry prim to the stage.
        
        Creates an Xform parent with a Mesh child containing the geometry.
        
        Args:
            stage: USD stage
            parent_path: Parent prim path
            name: Name for the mesh prim
            vertices: Nx3 array of vertex positions
            faces: Mx3 array of face indices (triangles)
            normals: Optional Nx3 array of vertex normals
            transform: Optional 4x4 transform matrix
            
        Returns:
            Path to the Xform prim containing the mesh
        """
        # Sanitize name for USD
        safe_name = self._sanitize_prim_name(name)
        
        # Create Xform for the part
        xform_path = f"{parent_path}/{safe_name}"
        xform = UsdGeom.Xform.Define(stage, xform_path)
        
        # Apply transform if provided
        if transform is not None:
            xform_op = xform.AddTransformOp()
            xform_op.Set(Gf.Matrix4d(*[item for row in transform for item in row]))
        
        # Create Mesh prim under the Xform
        mesh_path = f"{xform_path}/mesh"
        mesh = UsdGeom.Mesh.Define(stage, mesh_path)
        
        # Set vertex positions - convert numpy to native Python floats
        points = Vt.Vec3fArray([
            Gf.Vec3f(float(v[0]), float(v[1]), float(v[2])) 
            for v in vertices
        ])
        mesh.CreatePointsAttr(points)
        
        # Set face vertex counts (all triangles = 3)
        face_vertex_counts = Vt.IntArray([3] * len(faces))
        mesh.CreateFaceVertexCountsAttr(face_vertex_counts)
        
        # Set face vertex indices (flattened)
        face_vertex_indices = Vt.IntArray([int(i) for i in faces.flatten()])
        mesh.CreateFaceVertexIndicesAttr(face_vertex_indices)
        
        # Set normals if provided - convert numpy to native Python floats
        if normals is not None:
            normal_array = Vt.Vec3fArray([
                Gf.Vec3f(float(n[0]), float(n[1]), float(n[2])) 
                for n in normals
            ])
            mesh.CreateNormalsAttr(normal_array)
            mesh.SetNormalsInterpolation(UsdGeom.Tokens.vertex)
        
        # Set subdivision scheme to none (we want to render actual triangles)
        mesh.CreateSubdivisionSchemeAttr(UsdGeom.Tokens.none)
        
        logger.info(f"Added mesh '{safe_name}' with {len(vertices)} vertices, {len(faces)} faces")
        
        return xform_path
    
    def build_from_parts(
        self,
        filename: str,
        model_name: str,
        mesh_data: Dict[str, Dict[str, Any]],
        part_info: List[Dict[str, Any]]
    ) -> Tuple[Usd.Stage, Dict[str, str]]:
        """
        Build a complete USD stage from parsed mesh data.
        
        Creates the stage, adds all meshes as prims, and returns
        a mapping from part IDs to their USD prim paths.
        
        Args:
            filename: Output USD filename
            model_name: Name for the root prim
            mesh_data: Dict mapping part_id to {vertices, faces, normals}
            part_info: List of part dicts with id and type info
            
        Returns:
            Tuple of (stage, part_id_to_path mapping)
        """
        # Create stage
        stage = self.create_stage(filename, model_name)
        root_prim = stage.GetDefaultPrim()
        root_path = str(root_prim.GetPath())
        
        # Add physics scene
        self.add_physics_scene(stage)
        
        # Track part paths
        part_paths = {}
        
        # Create part info lookup
        part_info_map = {p['id']: p for p in part_info}
        
        # Add each mesh as a prim
        for part_id, data in mesh_data.items():
            # Get part metadata if available
            info = part_info_map.get(part_id, {'type': 'link'})
            part_name = info.get('name', part_id)
            
            # Add the mesh
            prim_path = self.add_mesh_prim(
                stage=stage,
                parent_path=root_path,
                name=part_name,
                vertices=data['vertices'],
                faces=data['faces'],
                normals=data.get('normals')
            )
            
            part_paths[part_id] = prim_path
        
        logger.info(f"Built USD stage with {len(part_paths)} parts")
        
        return stage, part_paths
    
    def save_stage(self, stage: Usd.Stage) -> str:
        """
        Save the USD stage to disk.
        
        Args:
            stage: USD stage to save
            
        Returns:
            Path to saved file
        """
        stage.GetRootLayer().Save()
        filepath = stage.GetRootLayer().realPath
        logger.info(f"Saved USD stage: {filepath}")
        return filepath
    
    def _sanitize_prim_name(self, name: str) -> str:
        """
        Sanitize a name for use as a USD prim name.
        
        USD prim names must:
        - Start with a letter or underscore
        - Contain only letters, numbers, and underscores
        
        Args:
            name: Raw name
            
        Returns:
            Sanitized prim name
        """
        # Replace invalid characters with underscore
        sanitized = ''.join(c if c.isalnum() or c == '_' else '_' for c in name)
        
        # Ensure starts with letter or underscore
        if sanitized and sanitized[0].isdigit():
            sanitized = '_' + sanitized
        
        # Handle empty string
        if not sanitized:
            sanitized = '_unnamed'
        
        # Remove consecutive underscores
        while '__' in sanitized:
            sanitized = sanitized.replace('__', '_')
        
        return sanitized


# Singleton instance
usd_builder = USDBuilder()

"""
GLB Parser Service

Extracts mesh data from GLB (binary glTF) files using trimesh.
Returns structured part information for the frontend to display.

Key assumptions:
- Each mesh node in the GLB represents a selectable part
- Mesh names from GLB are used as part IDs
- Scene graphs are flattened for simplicity in MVP
"""

import os
import logging
from typing import List, Dict, Any, Tuple
from pathlib import Path

import trimesh
import numpy as np

from app.models.schemas import ParsedPart

logger = logging.getLogger(__name__)


class GLBParser:
    """
    Parses GLB files and extracts mesh information.
    
    Uses trimesh library to load binary glTF files and extract
    individual mesh nodes with their geometric properties.
    """
    
    def __init__(self, upload_dir: str = "uploads"):
        """
        Initialize the parser.
        
        Args:
            upload_dir: Directory where uploaded GLB files are stored
        """
        self.upload_dir = Path(upload_dir)
        self.upload_dir.mkdir(parents=True, exist_ok=True)
    
    def parse_glb(self, filepath: str) -> List[ParsedPart]:
        """
        Parse a GLB file and extract all mesh parts.
        
        Args:
            filepath: Path to the GLB file
            
        Returns:
            List of ParsedPart objects with mesh info
            
        Raises:
            FileNotFoundError: If GLB file doesn't exist
            ValueError: If file cannot be parsed as GLB
        """
        filepath = Path(filepath)
        
        if not filepath.exists():
            raise FileNotFoundError(f"GLB file not found: {filepath}")
        
        logger.info(f"Parsing GLB file: {filepath}")
        
        try:
            # Load the GLB file
            # force='scene' ensures we get a Scene even for single meshes
            scene = trimesh.load(str(filepath), force='scene')
        except Exception as e:
            raise ValueError(f"Failed to parse GLB file: {e}")
        
        parts = []
        
        # Handle both Scene and single Trimesh objects
        if isinstance(scene, trimesh.Scene):
            parts = self._extract_parts_from_scene(scene)
        elif isinstance(scene, trimesh.Trimesh):
            # Single mesh - create a part from it
            part = self._create_part_from_mesh(scene, "mesh_0", "mesh_0")
            parts.append(part)
        else:
            logger.warning(f"Unexpected trimesh type: {type(scene)}")
        
        logger.info(f"Extracted {len(parts)} parts from GLB")
        return parts
    
    def _extract_parts_from_scene(self, scene: trimesh.Scene) -> List[ParsedPart]:
        """
        Extract parts from a trimesh Scene object.
        
        Iterates through the scene graph to get original GLB node names,
        then extracts the corresponding mesh geometry.
        
        Args:
            scene: Trimesh Scene object
            
        Returns:
            List of ParsedPart objects
        """
        parts = []
        
        # Track used IDs to avoid duplicates
        used_ids = set()
        
        # Build a mapping from geometry key to node name using the scene graph
        geometry_to_node = {}
        try:
            # scene.graph.to_flattened() gives us node info with geometry references
            for node_name in scene.graph.nodes:
                if node_name == scene.graph.base_frame:
                    continue
                try:
                    # Get the transform and geometry name for this node
                    transform, geometry_name = scene.graph.get(node_name)
                    if geometry_name and geometry_name in scene.geometry:
                        # Store node_name -> geometry_name mapping
                        if geometry_name not in geometry_to_node:
                            geometry_to_node[geometry_name] = node_name
                except (ValueError, TypeError):
                    # Node doesn't have geometry reference
                    continue
        except Exception as e:
            logger.warning(f"Could not parse scene graph: {e}")
        
        # Now iterate over geometry, using node names where available
        for i, (geometry_key, mesh) in enumerate(scene.geometry.items()):
            if not isinstance(mesh, trimesh.Trimesh):
                # Skip non-mesh geometry (e.g., point clouds, paths)
                continue
            
            # Try to get the original node name from the scene graph
            # Fall back to geometry key if not found
            node_name = geometry_to_node.get(geometry_key, geometry_key)
            original_name = node_name or f"Part_{i}"
            
            # Generate unique part ID (sanitized for internal use)
            part_id = self._generate_unique_id(original_name, used_ids)
            used_ids.add(part_id)
            
            # Keep original name for display
            part = self._create_part_from_mesh(mesh, part_id, original_name)
            parts.append(part)
        
        return parts
    
    def _create_part_from_mesh(
        self, 
        mesh: trimesh.Trimesh, 
        part_id: str, 
        name: str
    ) -> ParsedPart:
        """
        Create a ParsedPart from a trimesh mesh.
        
        Args:
            mesh: Trimesh mesh object
            part_id: Unique identifier for the part
            name: Display name for the part
            
        Returns:
            ParsedPart with geometric information
        """
        # Get bounding box
        bounds = mesh.bounds if mesh.bounds is not None else np.zeros((2, 3))
        
        return ParsedPart(
            id=part_id,
            name=name,
            vertex_count=len(mesh.vertices) if mesh.vertices is not None else 0,
            face_count=len(mesh.faces) if mesh.faces is not None else 0,
            bounds_min=tuple(bounds[0].tolist()),
            bounds_max=tuple(bounds[1].tolist())
        )
    
    def _generate_unique_id(self, base_name: str, used_names: set) -> str:
        """
        Generate a unique part ID.
        
        Sanitizes the name and adds a suffix if already used.
        
        Args:
            base_name: Preferred name
            used_names: Set of already used names
            
        Returns:
            Unique, sanitized ID string
        """
        # Sanitize: lowercase, replace spaces/special chars with underscore
        sanitized = base_name.lower()
        sanitized = ''.join(c if c.isalnum() else '_' for c in sanitized)
        sanitized = '_'.join(filter(None, sanitized.split('_')))  # Remove empty parts
        
        if not sanitized:
            sanitized = "part"
        
        # Ensure uniqueness
        unique_name = sanitized
        counter = 1
        while unique_name in used_names:
            unique_name = f"{sanitized}_{counter}"
            counter += 1
        
        return unique_name
    
    def _clean_name(self, name: str) -> str:
        """
        Clean up a mesh name for display.
        
        Removes common prefixes/suffixes added by 3D software.
        
        Args:
            name: Raw mesh name
            
        Returns:
            Cleaned display name
        """
        # Remove common suffixes
        for suffix in ['.001', '.002', '_mesh', '_geo', '_Mesh']:
            if name.endswith(suffix):
                name = name[:-len(suffix)]
        
        # Replace underscores with spaces for display
        name = name.replace('_', ' ')
        
        # Capitalize words
        name = name.title()
        
        return name
    
    def get_mesh_data(self, filepath: str, part_id: str) -> Dict[str, Any]:
        """
        Get detailed mesh data for a specific part.
        
        Used when exporting to USD to get vertex/face data.
        
        Args:
            filepath: Path to GLB file
            part_id: ID of the part to extract
            
        Returns:
            Dict with vertices, faces, and normals
        """
        filepath = Path(filepath)
        scene = trimesh.load(str(filepath), force='scene')
        
        # Find the matching mesh
        if isinstance(scene, trimesh.Trimesh):
            if part_id in ["mesh_0", "part_0"]:
                return self._mesh_to_dict(scene)
        elif isinstance(scene, trimesh.Scene):
            # Search in geometry
            for name, mesh in scene.geometry.items():
                if not isinstance(mesh, trimesh.Trimesh):
                    continue
                sanitized_name = self._generate_unique_id(name, set())
                if sanitized_name == part_id or name == part_id:
                    return self._mesh_to_dict(mesh)
        
        raise ValueError(f"Part not found: {part_id}")
    
    def _mesh_to_dict(self, mesh: trimesh.Trimesh) -> Dict[str, Any]:
        """Convert trimesh to dict with numpy arrays."""
        return {
            'vertices': mesh.vertices.astype(np.float32),
            'faces': mesh.faces.astype(np.int32),
            'normals': mesh.vertex_normals.astype(np.float32) if mesh.vertex_normals is not None else None
        }
    
    def get_all_mesh_data(self, filepath: str) -> Dict[str, Dict[str, Any]]:
        """
        Get mesh data for all parts in a GLB file.
        
        Args:
            filepath: Path to GLB file
            
        Returns:
            Dict mapping part_id to mesh data dict
        """
        filepath = Path(filepath)
        scene = trimesh.load(str(filepath), force='scene')
        
        result = {}
        used_names = set()
        
        if isinstance(scene, trimesh.Trimesh):
            result["mesh_0"] = self._mesh_to_dict(scene)
        elif isinstance(scene, trimesh.Scene):
            # Build geometry key to node name mapping (same as _extract_parts_from_scene)
            geometry_to_node = {}
            try:
                for node_name in scene.graph.nodes:
                    if node_name == scene.graph.base_frame:
                        continue
                    try:
                        transform, geometry_name = scene.graph.get(node_name)
                        if geometry_name and geometry_name in scene.geometry:
                            if geometry_name not in geometry_to_node:
                                geometry_to_node[geometry_name] = node_name
                    except (ValueError, TypeError):
                        continue
            except Exception:
                pass
            
            # Iterate using node names
            for geometry_key, mesh in scene.geometry.items():
                if not isinstance(mesh, trimesh.Trimesh):
                    continue
                node_name = geometry_to_node.get(geometry_key, geometry_key)
                original_name = node_name or geometry_key
                part_id = self._generate_unique_id(original_name, used_names)
                used_names.add(part_id)
                result[part_id] = self._mesh_to_dict(mesh)
        
        return result


# Singleton instance for use in API routes
glb_parser = GLBParser()

#!/usr/bin/env python3
"""
USD Physics Validation Script for Phidias

Validates that a USD file has all required physics schemas
for simulation in NVIDIA Isaac Sim.

Usage:
    python validate_usd.py <path_to_usd_file>

Example:
    python validate_usd.py outputs/robot.usda
"""

import sys
from pathlib import Path

try:
    from pxr import Usd, UsdPhysics, UsdGeom
except ImportError:
    print("Error: USD libraries not found.")
    print("Install with: pip install usd-core")
    sys.exit(1)


def validate_physics_usd(usd_path: str) -> dict:
    """
    Validate a USD file for physics simulation readiness.
    
    Args:
        usd_path: Path to the USD file
        
    Returns:
        Dict with validation results
    """
    
    stage = Usd.Stage.Open(usd_path)
    if not stage:
        return {
            "valid": False,
            "errors": [f"Could not open USD file: {usd_path}"],
            "warnings": [],
            "info": {}
        }
    
    results = {
        "valid": True,
        "errors": [],
        "warnings": [],
        "info": {
            "file": usd_path
        }
    }
    
    # =========================================
    # Check 1: Physics Scene
    # =========================================
    physics_scenes = [p for p in stage.Traverse() 
                      if p.IsA(UsdPhysics.Scene)]
    if not physics_scenes:
        results["errors"].append("No PhysicsScene found - simulation won't run")
        results["valid"] = False
    else:
        scene = UsdPhysics.Scene(physics_scenes[0])
        gravity = scene.GetGravityMagnitudeAttr().Get()
        results["info"]["physics_scene"] = str(physics_scenes[0].GetPath())
        results["info"]["gravity"] = gravity
    
    # =========================================
    # Check 2: Articulation Root
    # =========================================
    artic_roots = []
    for prim in stage.Traverse():
        if prim.HasAPI(UsdPhysics.ArticulationRootAPI):
            artic_roots.append(prim)
    
    if not artic_roots:
        results["warnings"].append(
            "No ArticulationRootAPI found - model may not simulate as a unified articulation"
        )
    else:
        results["info"]["articulation_root"] = str(artic_roots[0].GetPath())
    
    # =========================================
    # Check 3: Rigid Bodies
    # =========================================
    rigid_bodies = []
    kinematic_bodies = []
    for prim in stage.Traverse():
        if prim.HasAPI(UsdPhysics.RigidBodyAPI):
            rigid_bodies.append(prim)
            rb = UsdPhysics.RigidBodyAPI(prim)
            if rb.GetKinematicEnabledAttr().Get():
                kinematic_bodies.append(prim)
    
    results["info"]["rigid_body_count"] = len(rigid_bodies)
    results["info"]["kinematic_body_count"] = len(kinematic_bodies)
    
    if len(rigid_bodies) == 0:
        results["errors"].append("No RigidBodyAPI found - nothing will simulate")
        results["valid"] = False
    
    # =========================================
    # Check 4: Collision Shapes
    # =========================================
    colliders = []
    for prim in stage.Traverse():
        if prim.HasAPI(UsdPhysics.CollisionAPI):
            colliders.append(prim)
    
    results["info"]["collider_count"] = len(colliders)
    
    if len(colliders) == 0:
        results["warnings"].append(
            "No CollisionAPI found - parts won't collide with each other or environment"
        )
    elif len(colliders) < len(rigid_bodies):
        results["warnings"].append(
            f"Fewer colliders ({len(colliders)}) than rigid bodies ({len(rigid_bodies)}) - some parts may not collide"
        )
    
    # =========================================
    # Check 5: Joints
    # =========================================
    joints = {
        "revolute": [],
        "prismatic": [],
        "fixed": [],
        "other": []
    }
    
    for prim in stage.Traverse():
        if prim.IsA(UsdPhysics.RevoluteJoint):
            joints["revolute"].append(prim)
        elif prim.IsA(UsdPhysics.PrismaticJoint):
            joints["prismatic"].append(prim)
        elif prim.IsA(UsdPhysics.FixedJoint):
            joints["fixed"].append(prim)
        elif prim.IsA(UsdPhysics.Joint):
            joints["other"].append(prim)
    
    total_joints = sum(len(v) for v in joints.values())
    results["info"]["joint_count"] = total_joints
    results["info"]["revolute_joints"] = len(joints["revolute"])
    results["info"]["prismatic_joints"] = len(joints["prismatic"])
    results["info"]["fixed_joints"] = len(joints["fixed"])
    
    # Validate joint body relationships
    joints_with_limits = 0
    joints_with_drives = 0
    
    for joint_list in joints.values():
        for joint_prim in joint_list:
            joint = UsdPhysics.Joint(joint_prim)
            body0 = joint.GetBody0Rel().GetTargets()
            body1 = joint.GetBody1Rel().GetTargets()
            
            if not body0:
                results["errors"].append(
                    f"Joint {joint_prim.GetPath()} has no body0 (parent)"
                )
                results["valid"] = False
            if not body1:
                results["errors"].append(
                    f"Joint {joint_prim.GetPath()} has no body1 (child)"
                )
                results["valid"] = False
            
            # Check for joint limits (revolute or prismatic)
            if joint_prim.IsA(UsdPhysics.RevoluteJoint):
                rev = UsdPhysics.RevoluteJoint(joint_prim)
                lower = rev.GetLowerLimitAttr().Get()
                upper = rev.GetUpperLimitAttr().Get()
                if lower is not None and upper is not None:
                    joints_with_limits += 1
            elif joint_prim.IsA(UsdPhysics.PrismaticJoint):
                pris = UsdPhysics.PrismaticJoint(joint_prim)
                lower = pris.GetLowerLimitAttr().Get()
                upper = pris.GetUpperLimitAttr().Get()
                if lower is not None and upper is not None:
                    joints_with_limits += 1
            
            # Check for DriveAPI
            if (joint_prim.HasAPI(UsdPhysics.DriveAPI, "angular") or
                joint_prim.HasAPI(UsdPhysics.DriveAPI, "linear")):
                joints_with_drives += 1
    
    results["info"]["joints_with_limits"] = joints_with_limits
    results["info"]["joints_with_drives"] = joints_with_drives
    
    # Warn if joints don't have limits or drives
    movable_joints = len(joints["revolute"]) + len(joints["prismatic"])
    if movable_joints > 0 and joints_with_limits == 0:
        results["warnings"].append(
            "No joint limits defined - joints can move without restriction"
        )
    if movable_joints > 0 and joints_with_drives == 0:
        results["warnings"].append(
            "No joint drives defined - joints won't have motor control"
        )
    
    # =========================================
    # Check 6: Mesh Geometry
    # =========================================
    meshes = [p for p in stage.Traverse() if p.IsA(UsdGeom.Mesh)]
    results["info"]["mesh_count"] = len(meshes)
    
    total_vertices = 0
    total_faces = 0
    
    for mesh_prim in meshes:
        mesh = UsdGeom.Mesh(mesh_prim)
        points = mesh.GetPointsAttr().Get()
        face_counts = mesh.GetFaceVertexCountsAttr().Get()
        
        if not points or len(points) == 0:
            results["errors"].append(
                f"Mesh {mesh_prim.GetPath()} has no vertices"
            )
            results["valid"] = False
        else:
            total_vertices += len(points)
        
        if face_counts:
            total_faces += len(face_counts)
    
    results["info"]["total_vertices"] = total_vertices
    results["info"]["total_faces"] = total_faces
    
    # =========================================
    # Check 7: Up Axis
    # =========================================
    up_axis = UsdGeom.GetStageUpAxis(stage)
    results["info"]["up_axis"] = up_axis
    
    if up_axis != UsdGeom.Tokens.z:
        results["warnings"].append(
            f"Up axis is '{up_axis}', Isaac Sim defaults to 'Z' - may need adjustment"
        )
    
    # =========================================
    # Check 8: Units
    # =========================================
    meters_per_unit = UsdGeom.GetStageMetersPerUnit(stage)
    results["info"]["meters_per_unit"] = meters_per_unit
    
    if meters_per_unit != 1.0:
        results["warnings"].append(
            f"Stage scale is {meters_per_unit} meters/unit (not 1.0) - verify scale in Isaac Sim"
        )
    
    return results


def print_report(results: dict):
    """Print a formatted validation report."""
    
    print("\n" + "=" * 60)
    print("         USD PHYSICS VALIDATION REPORT")
    print("=" * 60)
    
    # Status
    if results["valid"]:
        print("\n✅ STATUS: VALID - Ready for simulation")
    else:
        print("\n❌ STATUS: INVALID - Issues found")
    
    # Info
    print("\n📊 SUMMARY:")
    info = results["info"]
    print(f"   File: {info.get('file', 'N/A')}")
    print(f"   Up Axis: {info.get('up_axis', 'N/A')}")
    print(f"   Scale: {info.get('meters_per_unit', 'N/A')} meters/unit")
    print(f"   Gravity: {info.get('gravity', 'N/A')} m/s²")
    
    print("\n📦 COMPONENTS:")
    print(f"   Articulation Root: {info.get('articulation_root', 'None')}")
    print(f"   Physics Scene: {info.get('physics_scene', 'None')}")
    print(f"   Meshes: {info.get('mesh_count', 0)}")
    print(f"   Vertices: {info.get('total_vertices', 0):,}")
    print(f"   Faces: {info.get('total_faces', 0):,}")
    
    print("\n⚙️  PHYSICS:")
    print(f"   Rigid Bodies: {info.get('rigid_body_count', 0)}")
    print(f"   Kinematic Bodies: {info.get('kinematic_body_count', 0)}")
    print(f"   Colliders: {info.get('collider_count', 0)}")
    print(f"   Joints: {info.get('joint_count', 0)}")
    print(f"     - Revolute: {info.get('revolute_joints', 0)}")
    print(f"     - Prismatic: {info.get('prismatic_joints', 0)}")
    print(f"     - Fixed: {info.get('fixed_joints', 0)}")
    print(f"     - With Limits: {info.get('joints_with_limits', 0)}")
    print(f"     - With Drives: {info.get('joints_with_drives', 0)}")
    
    # Errors
    if results["errors"]:
        print("\n❌ ERRORS:")
        for err in results["errors"]:
            print(f"   • {err}")
    
    # Warnings
    if results["warnings"]:
        print("\n⚠️  WARNINGS:")
        for warn in results["warnings"]:
            print(f"   • {warn}")
    
    print("\n" + "=" * 60)
    
    # Sim-ready checklist
    print("\n📋 SIM-READY CHECKLIST:")
    movable_joints = info.get('revolute_joints', 0) + info.get('prismatic_joints', 0)
    checks = [
        ("PhysicsScene", info.get("physics_scene") is not None),
        ("ArticulationRoot", info.get("articulation_root") is not None),
        ("Rigid Bodies", info.get("rigid_body_count", 0) > 0),
        ("Colliders", info.get("collider_count", 0) > 0),
        ("Mesh Geometry", info.get("mesh_count", 0) > 0),
        ("Joint Limits", movable_joints == 0 or info.get("joints_with_limits", 0) > 0),
        ("Joint Drives", movable_joints == 0 or info.get("joints_with_drives", 0) > 0),
        ("No Errors", len(results["errors"]) == 0)
    ]
    
    for name, passed in checks:
        status = "✅" if passed else "❌"
        print(f"   {status} {name}")
    
    print("\n")


def main():
    if len(sys.argv) < 2:
        print("Usage: python validate_usd.py <path_to_usd>")
        print("\nExample:")
        print("  python validate_usd.py outputs/robot.usda")
        sys.exit(1)
    
    usd_path = sys.argv[1]
    
    if not Path(usd_path).exists():
        print(f"Error: File not found: {usd_path}")
        sys.exit(1)
    
    results = validate_physics_usd(usd_path)
    print_report(results)
    
    # Exit with error code if invalid
    sys.exit(0 if results["valid"] else 1)


if __name__ == "__main__":
    main()

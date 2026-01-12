# Phidias MVP - Usage Guide

This guide explains how to use the Phidias Articulation Editor to create simulation-ready USD files for NVIDIA Isaac Sim.

---

## Table of Contents

1. [What This MVP Does](#what-this-mvp-does)
2. [Workflow Overview](#workflow-overview)
3. [Step-by-Step Usage](#step-by-step-usage)
4. [Understanding the Data Model](#understanding-the-data-model)
5. [Downstream Integration](#downstream-integration)
6. [Validating Sim-Ready USD](#validating-sim-ready-usd)
7. [Troubleshooting](#troubleshooting)

---

## What This MVP Does

The Phidias MVP provides a **GLB → USD articulation pipeline** that transforms static 3D models into physics-enabled assets for robotics simulation.

### Input
- **GLB file** (binary glTF) containing a 3D model with multiple mesh parts

### Processing
- **Semantic tagging** - Label parts as base, link, tool, etc.
- **Joint definition** - Define kinematic relationships between parts
- **Physics injection** - Add rigid body, collision, and articulation schemas

### Output
- **USDA file** compatible with NVIDIA Isaac Sim containing:
  - Mesh geometry for all parts
  - `UsdPhysics.ArticulationRootAPI` for reduced-coordinate simulation
  - `UsdPhysics.RigidBodyAPI` on each dynamic part
  - `UsdPhysics.CollisionAPI` for physics collision
  - Joint prims (`RevoluteJoint`, `PrismaticJoint`, `FixedJoint`)

---

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PHIDIAS WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐    ┌──────────┐    ┌─────────┐    ┌────────────┐  │
│   │  Upload │ -> │  Select  │ -> │  Define │ -> │   Export   │  │
│   │   GLB   │    │  & Tag   │    │  Joints │    │    USD     │  │
│   └─────────┘    └──────────┘    └─────────┘    └────────────┘  │
│                                                                  │
│   3D Model        Semantic        Kinematic       Sim-Ready      │
│   with parts      Labels          Structure       Physics        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Usage

### 1. Prepare Your GLB Model

Before using Phidias, ensure your GLB model:
- Contains **separate mesh objects** for each movable part
- Has **meaningful mesh names** (e.g., `base`, `arm_1`, `gripper_left`)
- Uses **meters** as the unit (or scale appropriately in Isaac Sim)

### 2. Upload the Model

1. Open the app at `http://localhost:3000`
2. Drag your `.glb` file onto the upload area, or click to browse
3. Wait for the model to load in the 3D viewer

### 3. Select and Tag Parts

For each part in your model:

1. **Click on the part** in the 3D viewer or part list to select it
2. In the **Tags** panel, set:

| Field | Options | Description |
|-------|---------|-------------|
| **Type** | `base`, `link`, `tool`, `joint` | Semantic classification |
| **Role** | `actuator`, `support`, `gripper`, `sensor`, `other` | Functional purpose |
| **Mobility** | `fixed`, `revolute`, `prismatic` | Movement capability |

#### Type Recommendations:
- **base** - The fixed root of your robot (bolted to ground)
- **link** - Movable rigid bodies in the kinematic chain
- **tool** - End effectors like grippers or tools
- **joint** - Connector parts (rarely used)

### 4. Define Joints

Switch to the **Joints** tab and click **+ Add Joint**:

1. **Parent Part** - Select the upstream part (closer to base)
2. **Child Part** - Select the downstream part (closer to end effector)
3. **Joint Type**:
   - `revolute` - Rotation (like a hinge)
   - `prismatic` - Linear sliding (like a piston)
   - `fixed` - Welded together (no movement)
4. **Axis** - Direction of rotation/translation (X, Y, or Z)

#### Joint Chain Example (Robot Arm):
```
base (fixed in world)
  └── shoulder_link (revolute, Z axis) ← Joint 1
        └── elbow_link (revolute, Y axis) ← Joint 2
              └── wrist_link (revolute, Z axis) ← Joint 3
                    └── gripper (prismatic, X axis) ← Joint 4
```

### 5. Export USD

1. (Optional) Set the **Model Name** in the header
2. Click **Export USD**
3. The file downloads automatically

---

## Understanding the Data Model

### Part Properties

```json
{
  "id": "arm_link_1",
  "name": "Arm Link 1",
  "type": "link",
  "role": "actuator",
  "mobility": "revolute"
}
```

### Joint Properties

```json
{
  "name": "shoulder_joint",
  "parent": "base",
  "child": "arm_link_1",
  "type": "revolute",
  "axis": [0, 0, 1]
}
```

### Axis Convention

| Axis | Vector | Typical Use |
|------|--------|-------------|
| X | `[1, 0, 0]` | Left/Right rotation or sliding |
| Y | `[0, 1, 0]` | Forward/Back rotation or sliding |
| Z | `[0, 0, 1]` | Up/Down (vertical) rotation |

---

## Downstream Integration

### Loading in NVIDIA Isaac Sim

1. Open Isaac Sim
2. Go to **File → Open** or use the Content Browser
3. Navigate to your exported `.usda` file
4. The articulation should be ready for simulation

### Python API Access (Isaac Sim)

```python
from omni.isaac.core import World
from omni.isaac.core.articulations import Articulation

# Create world
world = World()

# Load USD
world.scene.add_default_ground_plane()
robot = world.scene.add(
    Articulation(
        prim_path="/World/Robot",
        usd_path="/path/to/your_robot.usda",
        name="my_robot"
    )
)

# Initialize
world.reset()

# Control joints
robot.set_joint_positions([0.5, -0.3, 0.0])  # radians
```

### Integration with Isaac Gym / Orbit

The exported USD can be used directly with:
- **Isaac Gym** - High-performance GPU simulation
- **Isaac Orbit** - Robot learning framework
- **Isaac ROS** - ROS2 integration

---

## Validating Sim-Ready USD

### Method 1: USD Viewer (usdview)

```bash
# Install USD tools if not available
pip install usd-core

# View the USD file
usdview your_robot.usda
```

**Check for:**
- ✅ All mesh parts visible in hierarchy
- ✅ `PhysicsScene` prim exists
- ✅ Root prim has `PhysicsArticulationRootAPI`
- ✅ Part prims have `PhysicsRigidBodyAPI`
- ✅ Mesh prims have `PhysicsCollisionAPI`
- ✅ Joint prims under `/Robot/Joints/`

### Method 2: Python Validation Script

```python
"""
USD Physics Validation Script
Checks if a USD file has the required physics schemas for Isaac Sim
"""

from pxr import Usd, UsdPhysics, UsdGeom

def validate_physics_usd(usd_path: str) -> dict:
    """Validate a USD file for physics simulation readiness."""
    
    stage = Usd.Stage.Open(usd_path)
    results = {
        "valid": True,
        "errors": [],
        "warnings": [],
        "info": {}
    }
    
    # Check 1: Physics Scene exists
    physics_scenes = [p for p in stage.Traverse() 
                      if p.IsA(UsdPhysics.Scene)]
    if not physics_scenes:
        results["errors"].append("No PhysicsScene found")
        results["valid"] = False
    else:
        results["info"]["physics_scene"] = str(physics_scenes[0].GetPath())
    
    # Check 2: Articulation Root exists
    artic_roots = []
    for prim in stage.Traverse():
        if prim.HasAPI(UsdPhysics.ArticulationRootAPI):
            artic_roots.append(prim)
    
    if not artic_roots:
        results["warnings"].append("No ArticulationRootAPI found - may not simulate as articulation")
    else:
        results["info"]["articulation_root"] = str(artic_roots[0].GetPath())
    
    # Check 3: Rigid bodies
    rigid_bodies = []
    for prim in stage.Traverse():
        if prim.HasAPI(UsdPhysics.RigidBodyAPI):
            rigid_bodies.append(prim)
    
    results["info"]["rigid_body_count"] = len(rigid_bodies)
    if len(rigid_bodies) == 0:
        results["errors"].append("No RigidBodyAPI found on any prims")
        results["valid"] = False
    
    # Check 4: Collision shapes
    colliders = []
    for prim in stage.Traverse():
        if prim.HasAPI(UsdPhysics.CollisionAPI):
            colliders.append(prim)
    
    results["info"]["collider_count"] = len(colliders)
    if len(colliders) == 0:
        results["warnings"].append("No CollisionAPI found - parts won't collide")
    
    # Check 5: Joints
    joints = []
    for prim in stage.Traverse():
        if prim.IsA(UsdPhysics.Joint):
            joints.append(prim)
    
    results["info"]["joint_count"] = len(joints)
    
    # Check 6: Meshes have geometry
    meshes = [p for p in stage.Traverse() if p.IsA(UsdGeom.Mesh)]
    results["info"]["mesh_count"] = len(meshes)
    
    for mesh_prim in meshes:
        mesh = UsdGeom.Mesh(mesh_prim)
        points = mesh.GetPointsAttr().Get()
        if not points or len(points) == 0:
            results["errors"].append(f"Mesh {mesh_prim.GetPath()} has no vertices")
            results["valid"] = False
    
    return results


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python validate_usd.py <path_to_usd>")
        sys.exit(1)
    
    result = validate_physics_usd(sys.argv[1])
    
    print("\n" + "="*50)
    print("USD PHYSICS VALIDATION REPORT")
    print("="*50)
    
    print(f"\n✅ Valid: {result['valid']}")
    
    print(f"\n📊 Info:")
    for key, value in result["info"].items():
        print(f"   - {key}: {value}")
    
    if result["errors"]:
        print(f"\n❌ Errors:")
        for err in result["errors"]:
            print(f"   - {err}")
    
    if result["warnings"]:
        print(f"\n⚠️  Warnings:")
        for warn in result["warnings"]:
            print(f"   - {warn}")
    
    print("\n" + "="*50)
```

Save this as `validate_usd.py` and run:
```bash
python validate_usd.py outputs/your_robot.usda
```

### Method 3: Load in Isaac Sim

The ultimate validation is loading in Isaac Sim:

1. Open Isaac Sim
2. Create a new stage
3. Add a ground plane: **Create → Physics → Ground Plane**
4. Import your USD: **File → Import → USD**
5. Click **Play** (▶️)
6. Check:
   - ✅ Model doesn't fall through ground
   - ✅ Joints move correctly
   - ✅ Parts don't explode apart
   - ✅ Collision works properly

### Expected USD Structure

```
/Robot                          ← ArticulationRootAPI
├── PhysicsScene               ← Gravity, simulation settings
├── base                       ← RigidBodyAPI (kinematic=true)
│   └── mesh                   ← CollisionAPI
├── link_1                     ← RigidBodyAPI
│   └── mesh                   ← CollisionAPI
├── link_2                     ← RigidBodyAPI
│   └── mesh                   ← CollisionAPI
└── Joints
    ├── joint_1                ← RevoluteJoint (base → link_1)
    └── joint_2                ← RevoluteJoint (link_1 → link_2)
```

---

## Troubleshooting

### "Model explodes on simulation start"

**Cause:** Overlapping collision geometry or incorrect joint limits

**Fix:**
- Ensure parts don't physically overlap in rest pose
- Add joint limits during export (future feature)
- Use convex hull collision instead of mesh

### "Parts fall through ground"

**Cause:** Missing CollisionAPI or ground plane

**Fix:**
- Verify CollisionAPI is on mesh prims (not xform)
- Add a ground plane in Isaac Sim

### "Articulation doesn't move"

**Cause:** Missing joints or incorrect parent/child

**Fix:**
- Check joint hierarchy is correct
- Ensure base part is marked as `type: base` (kinematic)
- Verify joint body0/body1 relationships

### "Import fails in Isaac Sim"

**Cause:** USD schema incompatibility

**Fix:**
- Ensure using usd-core 24.x or compatible version
- Check for syntax errors with `usdview`

---

## Best Practices

1. **Name parts clearly** in your source 3D model before exporting to GLB
2. **Mark exactly one part as `base`** - this is the fixed root
3. **Create joints from parent to child** following the kinematic chain
4. **Use Z-up convention** which matches Isaac Sim default
5. **Test with simple models first** before complex assemblies
6. **Validate USD before importing** to catch issues early

---

## API Reference

See the main [README.md](../README.md) for API endpoints and data model details.

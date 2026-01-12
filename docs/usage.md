# Phidias MVP - Usage Guide

This guide explains how to use the Phidias Articulation Editor to create simulation-ready USD files for NVIDIA Isaac Sim.

---

## Table of Contents

1. [What This MVP Does](#what-this-mvp-does)
2. [Workflow Overview](#workflow-overview)
3. [Step-by-Step Usage](#step-by-step-usage)
    - [1. Upload](#1-upload-model)
    - [2. Part Settings](#2-configure-parts-tags-mass-collision-material)
    - [3. Joint Creation](#3-create-joints)
    - [4. Joint Editing](#4-edit-joint-properties)
    - [5. Export](#5-export-usd)
4. [Understanding the Data Model](#understanding-the-data-model)
5. [Downstream Integration](#downstream-integration)
6. [Validating Sim-Ready USD](#validating-sim-ready-usd)
7. [Troubleshooting](#troubleshooting)

---

## What This MVP Does

The Phidias MVP provides a **GLB → USD articulation pipeline** that transforms static 3D models into physics-enabled assets for robotics simulation.

### Core Features

*   **Semantic Tagging**: Define Base vs. Link vs. Tool.
*   **Mass Properties**: Auto-compute from density or set explicit mass.
*   **Collision Settings**: Convex Hull, Mesh, or decomposition options.
*   **Physics Materials**: Set Friction (Static/Dynamic) and Restitution (Bounciness).
*   **Joint Editing**:
    *   **Pivots (Anchors)**: Visual editing of joint rotation centers.
    *   **Limits**: Set rotation/translation limits.
    *   **Drives**: Configure motor stiffness and damping.
    *   **Collision Filtering**: Prevent "explosions" between connected parts.

---

## Workflow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PHIDIAS WORKFLOW                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌─────────┐    ┌──────────┐    ┌─────────┐    ┌────────────┐  │
│   │  Upload │ -> │  Parts   │ -> │  Joints │ -> │   Export   │  │
│   │   GLB   │    │  Config  │    │  Config │    │    USD     │  │
│   └─────────┘    └──────────┘    └─────────┘    └────────────┘  │
│                                                                  │
│   3D Model        Mass, Coll,     Pivots,         Sim-Ready      │
│                   Material        Limits,         Physics        │
│                                   Drives                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Usage

### 1. Upload Model

1. Open the app at `http://localhost:3000`
2. Drag your `.glb` file onto the upload area.
3. The model loads in the **center 3D viewer**.

> **Note**: Your GLB should have separate nodes/meshes for each moving part.

### 2. Configure Parts (Tags, Mass, Collision, Material)

Select a part in the 3D viewer or the left **Part List**. The right panel (**Tags** tab) shows its properties.

#### A. Semantic Tags
*   **Type**: `base` (fixed root), `link` (moving body), `tool`.
    *   *Tip*: Always mark one part as `base`.
*   **Role**: `actuator`, `support`, `gripper`, etc. (Informational).
*   **Mobility**: `fixed`, `revolute`, `prismatic`.

#### B. Mass Properties
Choose **Auto (Density)** or **Manual (Mass)**.
*   **Density**: Standard is 1000 kg/m³ (Water). Aluminum ~2700, Steel ~7800.
*   **Mass**: Explicitly set weight in kg.

#### C. Collision Settings
Defines how the object reacts physically.
*   **Convex Hull** (Default): Fast, stable. Wraps the object like shrink-wrap. Fills holes.
*   **Mesh**: Detailed but computationally expensive.
*   **Convex Decomposition**: Breaks complex concave shapes into multiple convex hulls (best for cup-like shapes).
*   **None**: Phantom object.

#### D. Physics Material
*   **Static Friction**: Resistance to start moving (0.0 - 1.0+).
*   **Dynamic Friction**: Resistance while sliding (0.0 - 1.0+).
*   **Restitution**: Bounciness (0.0 = clay, 1.0 = superball).

### 3. Create Joints

Switch to the **Joints** tab in the right panel.

1. Click **+ Add Joint**.
2. Select **Parent** (upstream) and **Child** (downstream) parts.
3. Click **Add**.

### 4. Edit Joint Properties

Select a joint from the list to edit its properties.

#### A. Basic Settings
*   **Type**:
    *   `Revolute`: Rotates (hinge, motor).
    *   `Prismatic`: Slides (piston, linear rail).
    *   `Fixed`: Locks two parts together.
*   **Axis**: The axis of motion (X, Y, or Z).

#### B. Anchor (Pivot) 📍
This defines **where** the joint rotates/slides relative to the Child part.
*   Edit **X, Y, Z** values to move the pivot.
*   **Visual Aid**: Look for the **Yellow Sphere** and **Red Axis Arrow** in the 3D viewer to confirm placement.

#### C. Limits & Drives
*   **Limits**:
    *   Revolute: Degrees (e.g., -180 to 180).
    *   Prismatic: Meters.
*   **Drive (Motor)**:
    *   **Stiffness (P)**: Position control strength. High = rigid position holding.
    *   **Damping (D)**: Velocity resistance. Prevents oscillation.
    *   **Max Force**: Torque/Force limit.

#### D. Collision Filtering ⚠️
*   **Disable Collision with Parent**: (Default: Checked).
    *   **Critical**: Prevents the Child part from colliding with the Parent part.
    *   If unchecked, overlapping parts will violently explode or jitter upon simulation start.

### 5. Export USD

1. Click **Export USD** in the header.
2. The `.usda` file will download automatically.
3. Import this file directly into NVIDIA Isaac Sim.

---

## Understanding the Data Model

### Physics Schema Mapping

| Phidias Setting | USD Schema API | Attribute |
|:---|:---|:---|
| **Joint Anchor** | `UsdPhysics.Joint` | `physics:localPos0` (Parent), `physics:localPos1` (Child) |
| **Mass** | `UsdPhysics.MassAPI` | `physics:mass` |
| **Density** | `UsdPhysics.MassAPI` | `physics:density` |
| **Collision Type** | `UsdPhysics.CollisionAPI` | `physics:approximation` |
| **Friction** | `UsdPhysics.MaterialAPI` | `physics:staticFriction`, `physics:dynamicFriction` |
| **Restitution** | `UsdPhysics.MaterialAPI` | `physics:restitution` |
| **Drive Stiffness** | `UsdPhysics.DriveAPI` | `drive:stiffness` |
| **Filtered Pair** | `UsdPhysics.FilteredPairsAPI` | `physics:filteredPairs` |

---

## Validating Sim-Ready USD

### Method 1: Load in Isaac Sim (Recommended)
1. Open Isaac Sim.
2. **File > Import > USD**.
3. Add a **Physics > Ground Plane**.
4. Press **Play**.
    *   ✅ Robot stands still (doesn't fall through floor).
    *   ✅ Joints don't explode (Collision Filtering works).
    *   ✅ Joints hold position (Drive Stiffness works).

### Method 2: Python Script
Use the provided `scripts/validate_usd.py` to check for missing schemas:

```bash
python scripts/validate_usd.py your_robot.usda
```

---

## Troubleshooting

### "Model Explodes Instantly"
*   **Cause**: Self-collision between touching parts.
*   **Fix**: Ensure **"Disable Collision with Parent"** is checked for all joints.

### "Robot Falls Through Floor"
*   **Cause**: Missing Collision API or Ground Plane.
*   **Fix**: Ensure Collision Type is not "None". Add Ground Plane in Isaac Sim.

### "Joints Are Floppy"
*   **Cause**: Low Drive Stiffness.
*   **Fix**: Increase **Drive Stiffness** (e.g., 10000+ for heavy robots) or verify the joint is not "Fixed".

### "Pivot Point is Wrong"
*   **Cause**: Anchor coordinates are relative to the *Child* part's origin, not World.
*   **Fix**: Use the 3D visualizer (Yellow Sphere) to guide adjustment.

# Phidias Articulation MVP

A web-based tool for the GLB → USD articulation pipeline, enabling semantic tagging and joint definition for robotics simulation in NVIDIA Isaac Sim.

## Overview

This MVP allows you to:
1. **Upload** a `.glb` 3D model
2. **Visualize** it in the browser with Three.js
3. **Select and tag** mesh parts with semantic labels (type, role, mobility)
4. **Define joints** between parts (revolute, prismatic, fixed)
5. **Export** a physics-enabled USD file compatible with NVIDIA Isaac Sim

## Project Structure

```
articulation-mvp/
├── backend/                    # Python FastAPI server
│   ├── app/
│   │   ├── main.py            # FastAPI application
│   │   ├── api/routes.py      # API endpoints
│   │   ├── models/schemas.py  # Pydantic data models
│   │   └── services/
│   │       ├── glb_parser.py      # GLB mesh extraction
│   │       ├── usd_builder.py     # USD stage creation
│   │       └── physics_injector.py # Physics schema injection
│   └── requirements.txt
├── frontend/                   # React + Vite application
│   ├── src/
│   │   ├── App.jsx            # Main application
│   │   ├── components/        # UI components
│   │   ├── hooks/             # State management
│   │   └── styles/            # CSS
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Quick Start

### Prerequisites

- Python 3.10+ with pip
- Node.js 18+ with npm
- (Optional) NVIDIA Omniverse for full PhysxSchema support

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

The app will be available at `http://localhost:3000`.

## Usage

1. Open `http://localhost:3000` in your browser
2. Drag and drop a `.glb` file onto the upload area
3. Click on mesh parts in the 3D viewer to select them
4. Use the **Tags** tab to assign semantic labels:
   - **Type**: link, base, tool, joint
   - **Role**: actuator, support, gripper, sensor
   - **Mobility**: fixed, revolute, prismatic
5. Use the **Joints** tab to define articulation:
   - Select parent and child parts
   - Choose joint type (revolute, prismatic, fixed)
   - Set rotation/translation axis
6. Click **Export USD** to generate the physics-enabled USD file

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload` | POST | Upload GLB file, returns parsed parts |
| `/api/export` | POST | Generate USD from articulation data |
| `/api/download/{filename}` | GET | Download generated USD file |
| `/api/models/{filename}` | GET | Serve uploaded GLB for viewer |
| `/api/health` | GET | Health check |

## USD Output

The generated USD file includes:

- **Xform hierarchy** for all parts
- **Mesh prims** with geometry data
- **UsdPhysics.ArticulationRootAPI** on the base part
- **UsdPhysics.RigidBodyAPI** on all dynamic parts
- **UsdPhysics.CollisionAPI** for collision detection
- **UsdPhysics.RevoluteJoint** / **PrismaticJoint** / **FixedJoint** prims
- **PhysicsScene** with gravity settings

The output is compatible with NVIDIA Isaac Sim for robotics simulation.

## Data Model

### Part
```json
{
  "id": "gripper_left",
  "name": "Gripper Left",
  "type": "link",       // link | base | tool | joint
  "role": "gripper",    // actuator | support | gripper | sensor | other
  "mobility": "revolute" // fixed | revolute | prismatic
}
```

### Joint
```json
{
  "name": "joint_1",
  "parent": "base",
  "child": "link_1",
  "type": "revolute",   // revolute | prismatic | fixed
  "axis": [0, 0, 1]     // Rotation/translation axis
}
```

## Technical Notes

### GLB Parsing
- Uses `trimesh` library to extract mesh geometry
- Each mesh node in GLB becomes a selectable part
- Mesh names are sanitized for USD compatibility

### USD Generation
- Uses `pxr` (OpenUSD) Python bindings
- Meters used as default unit (Isaac Sim convention)
- Z-up axis orientation
- Mesh collision shapes (triangle mesh by default)

### Physics Schema
- `ArticulationRootAPI` marks the base of the kinematic chain
- `RigidBodyAPI` enables physics simulation
- `MassAPI` with density-based mass computation
- Joint frames default to child part origin

## Limitations (MVP)

- No support for preserving GLB materials in USD
- Joint positions default to child origin (no custom offset)
- No URDF/MJCF export (USD only)
- Single-user, no persistence
- No physics simulation preview in browser

## Future Enhancements

1. Joint position/offset editor
2. Mass and inertia properties
3. Collision shape approximation (convex hull)
4. URDF/MJCF export options
5. Physics preview in browser (via PhysX.js or similar)
6. Project save/load functionality

## License

MIT License - See LICENSE file for details.

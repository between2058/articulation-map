# Phidias Articulation MVP

A web-based tool for the GLB → USD articulation pipeline, enabling semantic tagging, physics property definition, and joint configuration for robotics simulation in NVIDIA Isaac Sim.

## Overview

Phidias bridges the gap between static 3D meshes (GLB) and dynamic physics simulations (USD).

**Key Capabilities:**
1.  **Semantic Tagging**: Define parts as Base, Link, or Tool.
2.  **Physics Properties**:
    *   **Mass**: Auto-compute from density or set explicit mass.
    *   **Collision**: Convex decomposition, convex hull, or exact mesh.
    *   **Material**: Friction (static/dynamic) and restitution (bounciness).
3.  **Joint Definition**:
    *   **Types**: Revolute, Prismatic, Fixed.
    *   **Editing**: Visual pivot (anchor) editing, limits, drive stiffness/damping.
    *   **Filtering**: Collision filtering for parent/child pairs.
4.  **Sim-Ready Export**: Generates `.usda` files fully compatible with NVIDIA Isaac Sim.

---

## 📚 Documentation

Detailed guides are available in the `docs` directory:

*   **[Usage Guide](docs/usage.md)**: Complete step-by-step user manual.
*   **[Articulation Guide](docs/articulation.md)**: Physics principles and parameter tuning guide.
*   **[Workflow Example](docs/example.md)**: End-to-end walkthrough for a **Bulldozer** asset.

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+

### 1. Start Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Usage
Open `http://localhost:3000`. Drag & Drop a `.glb` file to begin.

---

## Project Structure

```
articulation-mvp/
├── backend/                    # Python FastAPI (USD/PhysX Logic)
│   ├── app/services/
│   │   ├── physics_injector.py # Core physics injection logic
│   │   └── usd_builder.py      # USD stage composition
├── frontend/                   # React + Three.js (UI/UX)
│   ├── src/components/
│   │   ├── JointEditorPanel.jsx # Joint configuration UI
│   │   └── TagEditorPanel.jsx   # Physics property UI
├── docs/                       # User Documentation
└── scripts/
    └── validate_usd.py         # Validation script for exported assets
```

## Features & Limitations

| Feature | Status | Notes |
|:---|:---|:---|
| **Joint Types** | ✅ | Revolute, Prismatic, Fixed |
| **Pivot Editing** | ✅ | Visual 3D anchor adjustment |
| **Joint Drives** | ✅ | Stiffness, Damping, Max Force |
| **Joint Limits** | ✅ | Angular/Linear limits |
| **Mass Props** | ✅ | Density-based or Explicit Mass |
| **Collision** | ✅ | Convex Hull, Decomposition, Mesh |
| **Physics Material** | ✅ | Friction, Restitution |
| **Project Save/Load** | ❌ | **Coming Soon** |
| **Undo/Redo** | ❌ | Not implemented |

## License

MIT License

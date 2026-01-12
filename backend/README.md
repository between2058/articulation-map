# Phidias Backend

FastAPI backend for the GLB → USD articulation pipeline.

## Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run server
uvicorn app.main:app --reload --port 8000
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Dependencies

- **FastAPI**: Web framework
- **trimesh**: GLB/glTF parsing
- **usd-core**: OpenUSD Python bindings (includes UsdPhysics)
- **numpy**: Numerical operations

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app entry point
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py        # API endpoints
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py       # Pydantic models
│   └── services/
│       ├── __init__.py
│       ├── glb_parser.py    # GLB mesh extraction
│       ├── usd_builder.py   # USD stage building
│       └── physics_injector.py  # Physics schema
├── uploads/                  # Uploaded GLB files
├── outputs/                  # Generated USD files
└── requirements.txt
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server host |
| `PORT` | `8000` | Server port |

## Notes

### USD Libraries

The `usd-core` package provides basic USD and UsdPhysics support. For full NVIDIA PhysxSchema support (advanced physics features like gear joints, angular drives, etc.), you'll need:

1. Install NVIDIA Omniverse
2. Use the Omniverse Kit Python environment
3. Or install the `omni.physics` extension

The basic UsdPhysics schemas (RigidBodyAPI, CollisionAPI, RevoluteJoint, PrismaticJoint) are available in `usd-core` and sufficient for the MVP.

### File Storage

- Uploaded GLB files are stored in `uploads/`
- Generated USD files are stored in `outputs/`
- Files are not automatically cleaned up (add cleanup logic for production)

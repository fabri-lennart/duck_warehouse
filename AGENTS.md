# Agent Instructions

Build and maintain a static 3D warehouse digital twin with Three.js, DuckDB-WASM, Apache Parquet, GSAP, and Vite.

## Rules

1. Use no icons, SVG icons, icon fonts, or emoji in the application UI. Use text, typography, spacing, and borders.
2. Render products with `THREE.InstancedMesh`. Target smooth interaction with up to 10,000 products; measure performance on actual target hardware before claiming a guaranteed frame rate.
3. Animate camera navigation from its current position. Never reset the camera between searches.
4. Keep database code in `src/duckdb.js`, scene code in `src/scene.js`, and camera code in `src/camera.js`.
5. Use the dark palette anchored by `#0f1115` and restrained translucent panels.
6. Keep all application text and documentation in English.
7. Use Parquet as the only inventory data format. Do not add a CSV pipeline.

## Project layout

- `public/data/inventory.parquet`: bundled inventory fixture
- `scripts/generate_inventory.py`: deterministic fixture generator
- `src/duckdb.js`: DuckDB-WASM setup and queries
- `src/scene.js`: Three.js warehouse and product instances
- `src/camera.js`: continuous camera flight
- `src/main.js`: UI and application flow
- `src/style.css`: visual design

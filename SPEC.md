# Specification: Warehouse 3D Digital Twin

## Purpose

A static browser application for locating inventory in a 3D warehouse. An operator searches by product name or SKU and the camera flies to the matching box.

## Data

- DuckDB-WASM runs in the browser and reads `public/data/inventory.parquet`.
- Required columns: `id` string, `sku` string, `name` string, `aisle` string, `rack` integer 1–15, `level` integer 1–3, `position` integer 0–2.
- Parquet is the only inventory format in this project.
- The included generator creates 10,000 deterministic sample products. Logical slots can hold multiple products; small offsets keep those boxes separately visible.

## 3D warehouse

- Draw a gridded floor, CanvasTexture bay labels, and metal racks.
- Render all product boxes using a single `THREE.InstancedMesh`.
- Aisle centers follow `X = (aisle.charCodeAt(0) - 65) * 14`; rack centers follow `Z = (rack - 1) * 12`; level centers are `1.5`, `4.5`, and `7.5` for levels 1, 2, and 3. Position 0–2 offsets X within the rack.
- Use instance color for the selected product and a red point light at its world position. The base material supports emissive lighting; per-instance colors make only the selected box red.

## Search and navigation

- Search case-insensitively by name or SKU, returning the first match. After DuckDB loads the Parquet rows, a small normalized JavaScript index serves interactive searches without a worker round trip.
- Animate the camera continuously from its current position to a view of the selected box.
- Project the selected box to a floating HTML tooltip showing SKU, name, aisle, and rack.
- Show status text for loading, searching, success, empty results, and errors.

## UI and performance

- Dark, text-only control panel on the left and a central status HUD.
- The panel adapts to tablets and small screens.
- DuckDB and rendering should feel responsive with the 10,000-row fixture. The proposed 100 ms query and 60 FPS goals require measurement on the intended browser and hardware.

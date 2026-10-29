# Learning resources

## Frontend pattern used here

This project uses a small, modular browser application rather than a UI framework. `main.js` coordinates the DOM, queries, and rendering. `duckdb.js` owns data access. `scene.js` owns Three.js objects. `camera.js` owns camera transitions. Vite serves ES modules during development and bundles them for deployment.

Study in this order:

1. [JavaScript modules (MDN)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules): understand imports, exports, and module boundaries.
2. [Vite guide](https://vite.dev/guide/): understand the development server, assets, and production build.
3. [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh): understand how many boxes share one geometry and material while retaining separate transforms.
4. Read `src/main.js`, then `src/duckdb.js`, `src/scene.js`, and `src/camera.js` in that order. Trace what happens after a search submission.

## WebAssembly and DuckDB-WASM

1. [WebAssembly concepts (MDN)](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Concepts): what Wasm is and how it works with JavaScript.
2. [Using the WebAssembly JavaScript API (MDN)](https://developer.mozilla.org/en-US/docs/WebAssembly/Guides/Using_the_JavaScript_API): how a browser loads and runs a Wasm module.
3. [DuckDB-WASM overview](https://duckdb.org/docs/stable/clients/wasm/overview): how DuckDB runs in the browser and exchanges Arrow data.
4. [DuckDB-WASM instantiation](https://duckdb.org/docs/stable/clients/wasm/instantiation): how the worker and Wasm bundle start.
5. [DuckDB-WASM data ingestion](https://duckdb.org/docs/stable/clients/wasm/data_ingestion): how the Parquet file becomes available to SQL queries.

In this app, Vite serves the Wasm and worker assets. The browser starts DuckDB inside a worker, fetches `inventory.parquet`, registers its bytes, creates a SQL view, and queries the view when the user searches. Python only generates the sample Parquet file during development.

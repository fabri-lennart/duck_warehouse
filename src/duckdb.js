import * as duckdb from '@duckdb/duckdb-wasm';
import mvpWasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url';
import ehWasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import mvpWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url';
import ehWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';

let db;
let connection;
let searchRows = [];

export async function loadInventory() {
  const bundle = await duckdb.selectBundle({
    mvp: { mainModule: mvpWasm, mainWorker: mvpWorker },
    eh: { mainModule: ehWasm, mainWorker: ehWorker },
  });
  const worker = new Worker(bundle.mainWorker);
  db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  connection = await db.connect();

  const response = await fetch(`${import.meta.env.BASE_URL}data/inventory.parquet`);
  if (!response.ok) throw new Error(`Inventory download failed (${response.status}).`);
  await db.registerFileBuffer('inventory.parquet', new Uint8Array(await response.arrayBuffer()));
  await connection.query("CREATE VIEW inventory AS SELECT * FROM read_parquet('inventory.parquet')");
  const table = await connection.query('SELECT * FROM inventory ORDER BY id');
  const products = table.toArray().map((row) => ({ ...row }));
  searchRows = products.map((product) => ({
    product,
    name: product.name.toLowerCase(),
    sku: product.sku.toLowerCase(),
  }));
  return products;
}

export function searchInventory(input) {
  if (!connection) throw new Error('Inventory is still loading.');
  const query = input.trim().toLowerCase();
  if (!query) return null;
  return searchRows.find(({ name, sku }) => name.includes(query) || sku.includes(query))?.product ?? null;
}

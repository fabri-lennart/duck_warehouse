import './style.css';
import * as THREE from 'three';
import { loadInventory, searchInventory } from './duckdb.js';
import { createWarehouse } from './scene.js';
import { createCamera } from './camera.js';

const app = document.querySelector('#app');
app.innerHTML = `
  <canvas id="warehouse-canvas" aria-label="3D warehouse view"></canvas>
  <div id="status" class="status" role="status" aria-live="polite">LOADING INVENTORY</div>
  <aside class="panel">
    <h1>Mega Warehouse 3D</h1>
    <p class="intro">Continuous journey. Find a product, then search again to watch the camera travel from its current location.</p>
    <form id="search-form">
      <label for="search-input">PRODUCT NAME OR SKU</label>
      <input id="search-input" type="text" placeholder="Search a product or SKU" autocomplete="off" disabled />
      <button id="search-button" type="submit" disabled>Go to Product</button>
    </form>
    <p class="suggestion-label">TRY THE ROUTE:</p>
    <div id="suggestions" class="suggestions"></div>
    <div id="result" class="result" aria-live="polite"><p>Search to locate a product.</p></div>
  </aside>
  <div id="tooltip" class="tooltip" hidden></div>
`;

const canvas = document.querySelector('#warehouse-canvas');
const status = document.querySelector('#status');
const form = document.querySelector('#search-form');
const input = document.querySelector('#search-input');
const button = document.querySelector('#search-button');
const result = document.querySelector('#result');
const tooltip = document.querySelector('#tooltip');
const suggestions = document.querySelector('#suggestions');

let warehouse;
let cameraController;
let selectedPoint;
let searchSerial = 0;
const projected = new THREE.Vector3();

function setStatus(message) { status.textContent = message.toUpperCase(); }

function renderSelection(product) {
  result.replaceChildren();

  const sku = document.createElement('strong');
  sku.textContent = product.sku;
  const name = document.createElement('p');
  name.textContent = product.name;
  const location = document.createElement('div');
  location.className = 'location';
  location.textContent = `AISLE ${product.aisle}  /  RACK ${product.rack}  /  LEVEL ${product.level}  /  POSITION ${product.position}`;
  result.append(sku, name, location);

  tooltip.replaceChildren();
  const tipSku = document.createElement('strong');
  tipSku.textContent = product.sku;
  const tipName = document.createElement('span');
  tipName.textContent = product.name;
  const tipLocation = document.createElement('small');
  tipLocation.textContent = `AISLE ${product.aisle} / RACK ${product.rack}`;
  tooltip.append(tipSku, tipName, tipLocation);
  tooltip.hidden = false;
}

function renderFrame() {
  requestAnimationFrame(renderFrame);
  if (!warehouse) return;
  warehouse.renderer.render(warehouse.scene, cameraController.camera);
  if (!selectedPoint || tooltip.hidden) return;
  projected.copy(selectedPoint).project(cameraController.camera);
  const onScreen = window.innerWidth <= 650 ||
    (projected.z < 1 && Math.abs(projected.x) < 1.1 && Math.abs(projected.y) < 1.1);
  tooltip.style.visibility = onScreen ? 'visible' : 'hidden';
  if (onScreen) {
    tooltip.style.left = `${(projected.x * 0.5 + 0.5) * window.innerWidth}px`;
    tooltip.style.top = `${(-projected.y * 0.5 + 0.5) * window.innerHeight}px`;
  }
}

async function start() {
  try {
    const products = await loadInventory();
    warehouse = createWarehouse(canvas, products);
    cameraController = createCamera(canvas.clientWidth, canvas.clientHeight);
    for (const [label, query] of [['Screw (A1)', 'Screw'], ['Screwdriver (M15)', 'Screwdriver'], ['Hammer (G7)', 'Hammer'], ['Tape (D10)', 'Tape']]) {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.textContent = label;
      chip.addEventListener('click', () => { input.value = query; form.requestSubmit(); });
      suggestions.append(chip);
    }
    input.disabled = false;
    button.disabled = false;
    setStatus('System ready');
    input.focus();
    const onResize = () => {
      const { width, height } = warehouse.resize();
      cameraController.camera.aspect = width / height;
      cameraController.camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);
    onResize();
  } catch (error) {
    console.error(error);
    setStatus('Inventory unavailable');
    result.querySelector('p').textContent = error.message;
  }
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!warehouse || !input.value.trim()) return;
  const serial = ++searchSerial;
  setStatus('Searching');
  button.disabled = true;
  try {
    const product = await searchInventory(input.value);
    if (serial !== searchSerial) return;
    if (!product) {
      setStatus('No product found');
      return;
    }
    selectedPoint = warehouse.selectProduct(product.id);
    renderSelection(product);
    setStatus('Flying to product');
    await cameraController.flyTo(selectedPoint);
    if (serial === searchSerial) setStatus('Arrived at destination');
  } catch (error) {
    console.error(error);
    setStatus('Search failed');
  } finally {
    button.disabled = false;
  }
});

renderFrame();
start();

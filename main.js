import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.160.0/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x151515);

// Simple in-app logger
const logBuffer = [];
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  logBuffer.push(line);
  if (logBuffer.length > 2000) logBuffer.shift();
  console.log(line);
}
window.__getLog = () => logBuffer.join('\n');
log('App start');

const camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 8, 14);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.5, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.maxPolarAngle = Math.PI / 2.1;

// Lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 1.0);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0.8);
dir.position.set(5, 10, 5);
scene.add(dir);

// Floor
const floorGeo = new THREE.PlaneGeometry(30, 20);
const floorMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
const floor = new THREE.Mesh(floorGeo, floorMat);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Dimensions (metres)
const conveyorLength = 5.0; // 0.5m units * 10 = 5m for visibility
const conveyorWidth = 0.6;
const conveyorHeight = 0.4;
const conveyorGap = 3.0;

// Conveyor geometry
function makeConveyor(x, z) {
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(conveyorLength, 0.15, conveyorWidth),
    new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.1, roughness: 0.7 })
  );
  base.position.set(x, conveyorHeight, z);
  scene.add(base);

  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(conveyorLength * 0.98, 0.06, conveyorWidth * 0.92),
    new THREE.MeshStandardMaterial({ color: 0x1f1f1f, metalness: 0.05, roughness: 0.9 })
  );
  belt.position.set(x, conveyorHeight + 0.11, z);
  scene.add(belt);

  return { base, belt };
}

const conveyor1 = makeConveyor(0, 3); // top
const conveyor2 = makeConveyor(0, -3); // bottom

// Gantry
const gantry = new THREE.Group();
const gantryBeam = new THREE.Mesh(
  new THREE.BoxGeometry(0.4, 0.2, conveyorGap + 6.0),
  new THREE.MeshStandardMaterial({ color: 0x777777 })
);

const gantryHead = new THREE.Mesh(
  new THREE.BoxGeometry(0.6, 0.4, 0.6),
  new THREE.MeshStandardMaterial({ color: 0x888888 })
);

const gantryGrip = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 0.2, 0.3),
  new THREE.MeshStandardMaterial({ color: 0xaaaaaa })
);

// Position gantry above conveyors
const gantryY = 2.2;
const gantryX = 0;
const gantryZ = 0;

gantryBeam.position.set(gantryX, gantryY, gantryZ);

const gantryCart = new THREE.Group();
gantryCart.add(gantryHead);

const gripOffsetY = -0.6;
gantryGrip.position.set(0, gripOffsetY, 0);
gantryCart.add(gantryGrip);

scene.add(gantryBeam);
scene.add(gantryCart);

// Robot Arm (simple stylized)
const robot = new THREE.Group();
const base = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.3, 20), new THREE.MeshStandardMaterial({ color: 0xbfbfbf }));
base.position.set(4.8, 0.15, -3);
robot.add(base);

const arm1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.2, 0.4), new THREE.MeshStandardMaterial({ color: 0xd0d0d0 }));
arm1.position.set(4.8, 0.9, -3);
robot.add(arm1);

const arm2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.25, 0.25), new THREE.MeshStandardMaterial({ color: 0xd0d0d0 }));
arm2.position.set(5.5, 1.35, -3);
robot.add(arm2);

const gripper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.3), new THREE.MeshStandardMaterial({ color: 0x999999 }));
gripper.position.set(6.2, 1.25, -3);
robot.add(gripper);

scene.add(robot);

// Pallet
const pallet = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 1.0), new THREE.MeshStandardMaterial({ color: 0x6b4e2e }));
pallet.position.set(6.6, 0.08, -3);
scene.add(pallet);

// Boxes
const boxColors = [0xbfbfbf, 0x999999, 0xd4b000, 0x7a4cff];
const boxes = [];

function spawnBox() {
  const color = boxColors[Math.floor(Math.random() * boxColors.length)];
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), new THREE.MeshStandardMaterial({ color }));
  box.position.set(2.5, 0.6, 3);
  box.userData = { state: 'on1', t: 0 };
  scene.add(box);
  boxes.push(box);
  log('Spawn box');
}

let spawnTimer = 0;

// Animation state
let paused = false;
let gantryT = 0;
let gantryDir = 1;

function updateGantry(delta) {
  gantryT += delta * gantryDir * 0.3;
  if (gantryT > 1) { gantryT = 1; gantryDir = -1; }
  if (gantryT < 0) { gantryT = 0; gantryDir = 1; }

  // Lerp between conveyor1 pickup and conveyor2 drop
  const pickup = new THREE.Vector3(-2.0, gantryY, 3);
  const drop = new THREE.Vector3(2.0, gantryY, -3);
  const pos = pickup.clone().lerp(drop, gantryT);
  gantryCart.position.copy(pos);

  // bob the gripper
  gantryGrip.position.y = gripOffsetY + Math.sin(performance.now() * 0.002) * 0.05;
}

function updateBoxes(delta) {
  for (const box of boxes) {
    const state = box.userData.state;
    if (state === 'on1') {
      box.position.x += delta * 1.0;
      if (box.position.x >= -0.5) {
        box.userData.state = 'lift';
      }
    } else if (state === 'lift') {
      // snap to gantry cart
      box.position.copy(gantryCart.position).add(new THREE.Vector3(0, -0.6, 0));
      if (gantryT > 0.9) {
        box.userData.state = 'on2';
        box.position.set(-2.5, 0.6, -3);
        log('Drop to conveyor 2');
      }
    } else if (state === 'on2') {
      box.position.x += delta * 1.0;
      if (box.position.x >= 5.5) {
        box.userData.state = 'sorted';
        log('Reached robot/pallet');
      }
    } else if (state === 'sorted') {
      // place on pallet
      box.position.set(6.6 + (Math.random() - 0.5) * 0.6, 0.35, -3 + (Math.random() - 0.5) * 0.6);
      box.userData.state = 'done';
    }
  }
}

function animate() {
  requestAnimationFrame(animate);
  if (!paused) {
    const delta = 0.016;
    spawnTimer += delta;
    if (spawnTimer > 1.6 && boxes.length < 12) {
      spawnTimer = 0;
      spawnBox();
    }
    updateGantry(delta);
    updateBoxes(delta);
  }
  controls.update();
  renderer.render(scene, camera);
}

animate();

// UI
const toggleBtn = document.getElementById('toggle');
const resetBtn = document.getElementById('reset');
const downloadLogBtn = document.getElementById('downloadLog');

toggleBtn.addEventListener('click', () => {
  paused = !paused;
  toggleBtn.textContent = paused ? 'Play' : 'Pause';
  log(paused ? 'Paused' : 'Resumed');
});

resetBtn.addEventListener('click', () => {
  for (const b of boxes) scene.remove(b);
  boxes.length = 0;
  spawnTimer = 0;
  log('Reset');
});

downloadLogBtn.addEventListener('click', () => {
  const blob = new Blob([window.__getLog()], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'factory-demo.log.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

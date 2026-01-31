/**
 * Example: Real-Time Data Injector for Smart Factory Digital Twin
 *
 * This script demonstrates how to send simulated sensor data to the digital twin
 * via WebSocket. In a real scenario, replace the simulated data with actual
 * readings from your IoT sensors, PLCs, or SCADA systems.
 *
 * Usage:
 *   1. Start the server: npm start
 *   2. In another terminal: node example-data-injector.js
 */

const WebSocket = require('ws');

// Connect to digital twin WebSocket server
const ws = new WebSocket('ws://127.0.0.1:8000');

ws.on('open', () => {
  console.log('✓ Connected to Smart Factory Digital Twin');
  console.log('  Sending simulated sensor data...\n');

  // Simulate sensor data updates every 2 seconds
  setInterval(() => {
    const data = generateSimulatedData();

    console.log('📡 Sending data:', JSON.stringify(data, null, 2));
    ws.send(JSON.stringify(data));
  }, 2000);
});

ws.on('message', (message) => {
  const msg = JSON.parse(message);
  if (msg.type === 'connected') {
    console.log('Server says:', msg.message);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  console.log('   Make sure the server is running (npm start)');
  process.exit(1);
});

ws.on('close', () => {
  console.log('Connection closed');
  process.exit(0);
});

// ============================================
// Simulated Sensor Data Generator
// ============================================

let tickCount = 0;

function generateSimulatedData() {
  tickCount++;

  // Simulate varying equipment status
  const gantryStatus = tickCount % 10 < 5 ? 'active' : 'idle';
  const conveyor1Status = tickCount % 15 < 12 ? 'running' : 'idle';
  const conveyor2Status = 'running'; // always running
  const robotStatus = tickCount % 8 < 3 ? 'active' : 'ready';

  // Simulate throughput variations (8-16 boxes/min)
  const throughput = 8 + Math.random() * 8;

  // Build data packet
  const data = {
    equipment: {
      gantry: {
        status: gantryStatus,
        utilization: gantryStatus === 'active' ? 85 + Math.random() * 10 : 0
      },
      conveyor1: {
        status: conveyor1Status,
        speed: conveyor1Status === 'running' ? 1.0 : 0
      },
      conveyor2: {
        status: conveyor2Status,
        speed: 1.0
      },
      robot: {
        status: robotStatus,
        utilization: robotStatus === 'active' ? 75 + Math.random() * 15 : 0
      }
    },
    throughput: parseFloat(throughput.toFixed(1)),
    timestamp: new Date().toISOString()
  };

  return data;
}

// ============================================
// Alternative: Manual Data Injection Examples
// ============================================

// Example 1: Send custom equipment status
function sendEquipmentStatus(equipmentId, status) {
  const data = {
    equipment: {
      [equipmentId]: { status }
    }
  };
  ws.send(JSON.stringify(data));
}

// Example 2: Send throughput reading
function sendThroughput(boxesPerMinute) {
  const data = {
    throughput: boxesPerMinute
  };
  ws.send(JSON.stringify(data));
}

// Example 3: Send complete factory snapshot
function sendFactorySnapshot(snapshot) {
  ws.send(JSON.stringify(snapshot));
}

// Uncomment to test manual injection:
// setTimeout(() => {
//   sendEquipmentStatus('gantry', 'active');
//   sendThroughput(15.5);
// }, 3000);

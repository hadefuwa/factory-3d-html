# PLC Integration Guide

## Overview
This factory digital twin supports seamless switching between **Simulation Mode** and **Real PLC Mode**. The architecture separates IO handling from visualization, making it easy to connect to real industrial equipment.

## Quick Start

### Switching Modes

Edit `io-config.js` line 12:

```javascript
// For simulation (default)
export const OPERATION_MODE = MODE.SIMULATION;

// For real PLC connection
export const OPERATION_MODE = MODE.REAL_PLC;
```

## Configuration

### 1. PLC Connection Settings

Edit `PLC_CONFIG` in `io-config.js`:

```javascript
export const PLC_CONFIG = {
  ip: '192.168.1.100',      // Your PLC IP address
  rack: 0,                   // S7 rack number (usually 0)
  slot: 1,                   // S7 slot number (usually 1)
  pollInterval: 100,         // How often to read PLC (ms)
  timeout: 5000              // Connection timeout (ms)
};
```

### 2. IO Mapping Tables

All IO points are defined in mapping tables with DB numbers, offsets, and bit positions.

#### Digital Inputs (Sensors)
Located in `DIGITAL_INPUTS` object:

```javascript
conv1End: {
  db: 1,           // Data Block number
  offset: 0,       // Byte offset within DB
  bit: 0,          // Bit position (0-7)
  description: 'Conveyor 1 end sensor',
  position: -2.5   // 3D position for visualization
}
```

#### Digital Outputs (Actuators)
Located in `DIGITAL_OUTPUTS` object:

```javascript
conveyor1Run: {
  db: 2,
  offset: 0,
  bit: 0,
  description: 'Conveyor 1 motor run'
}
```

#### Analog Inputs
Located in `ANALOG_INPUTS` object:

```javascript
gantryPositionX: {
  db: 3,
  offset: 0,
  type: 'REAL',    // S7 data type
  description: 'Gantry X position (meters)',
  scale: { min: -5.0, max: 5.0 }
}
```

#### Analog Outputs
Located in `ANALOG_OUTPUTS` object - similar structure to inputs.

## Using the IO Interface

### In main.js

```javascript
import { IOInterface, MODE } from './io-config.js';

// Create IO interface
const io = new IOInterface();

// Check if connected
if (io.isConnected()) {
  console.log(`Running in ${io.getMode()} mode`);
}

// Read sensor
const conv1EndActive = io.readDigitalInput('conv1End');

// Write output
io.writeDigitalOutput('conveyor1Run', true);

// Read analog value
const gantryX = io.readAnalogInput('gantryPositionX');

// Write analog value
io.writeAnalogOutput('gantryTargetX', 2.5);
```

### Simulation Mode

In simulation mode, you can manually trigger sensors:

```javascript
// Simulate a sensor activation
io.setSimulatedInput('conv1End', true);

// Simulate analog value
io.setSimulatedInput('gantryPositionX', 1.5);
```

## Integration Steps

### Step 1: Install PLC Library

For real PLC connection, install a Siemens S7 client library:

```bash
npm install nodes7
```

### Step 2: Import and Initialize

Edit `io-config.js` line 163:

```javascript
async initializePLC() {
  console.log(`Connecting to PLC at ${PLC_CONFIG.ip}...`);
  
  // Example with nodes7 library
  const nodes7 = require('nodes7');
  this.plcClient = new nodes7();
  
  this.plcClient.initiateConnection({
    host: PLC_CONFIG.ip,
    rack: PLC_CONFIG.rack,
    slot: PLC_CONFIG.slot,
    timeout: PLC_CONFIG.timeout
  }, (err) => {
    if (err) {
      console.error('PLC connection failed:', err);
      this.connected = false;
    } else {
      console.log('PLC connected successfully');
      this.connected = true;
      this.startPolling();
    }
  });
}
```

### Step 3: Implement Read/Write

Update the read/write methods in `IOInterface` class:

```javascript
readDigitalInput(name) {
  if (this.mode === MODE.SIMULATION) {
    return this.simulatedInputs[name] || false;
  } else {
    const config = DIGITAL_INPUTS[name];
    if (!config) return false;
    
    // Read from PLC
    const address = `DB${config.db}.DBX${config.offset}.${config.bit}`;
    return this.plcClient.readValue(address);
  }
}
```

### Step 4: Update main.js

Replace hard-coded sensor logic with IO interface calls:

```javascript
// OLD (simulation only):
sensors.conv1End.active = true;

// NEW (works with both modes):
const sensorValue = io.readDigitalInput('conv1End');
sensors.conv1End.active = sensorValue;
```

## Architecture Benefits

✅ **Single Flag Switch** - Change one line to switch modes  
✅ **Centralized Configuration** - All IO in one file  
✅ **Easy Mapping** - Clear DB/offset/bit definitions  
✅ **Gradual Migration** - Test in simulation, deploy to real  
✅ **Visualization Stays Same** - 3D view works in both modes  

## Example: Adding New Sensor

1. Add to `DIGITAL_INPUTS`:
```javascript
newSensor: {
  db: 1,
  offset: 1,
  bit: 0,
  description: 'My new sensor',
  position: 5.0
}
```

2. Use in code:
```javascript
const sensorActive = io.readDigitalInput('newSensor');
```

3. Works in both simulation and real mode!

## Troubleshooting

### Can't Connect to PLC
- Check IP address in `PLC_CONFIG`
- Verify network connectivity
- Confirm rack/slot numbers
- Check firewall settings

### Wrong Values
- Verify DB numbers in PLC match config
- Check offset and bit positions
- Confirm data types (BOOL vs REAL)
- Use PLC diagnostic tools to verify addresses

### Performance Issues
- Adjust `pollInterval` in `PLC_CONFIG`
- Batch read multiple values at once
- Use PLC interrupts instead of polling

## Next Steps

1. Test in simulation mode first
2. Configure your PLC addresses in `io-config.js`
3. Install PLC client library
4. Implement actual PLC read/write in `IOInterface`
5. Switch mode flag and test with real equipment

## Support

For issues or questions, check:
- PLC manual for address mapping
- Node.js S7 client documentation
- Factory network configuration

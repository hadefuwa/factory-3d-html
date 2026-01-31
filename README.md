# Smart Factory Digital Twin

A real-time 3D digital twin of Smart Factory 2 with hybrid data support (simulation + real IoT/PLC data).

## Factory Process

The digital twin simulates the complete Smart Factory 2 process:

1. **Hopper** - Mixed material cubes (Steel, Aluminum, Plastic Yellow, Plastic Purple)
2. **Conveyor 1** - Auto-feeds cubes, stops when sensor detects cube at end
3. **Vision Inspection** - Camera checks color and defects (15% defect rate)
4. **Defect Rejection** - Piston knocks defective cubes into reject bin
5. **Gantry Transfer** - Moves good cubes from Conveyor 1 to Conveyor 2
6. **Metal Detection** - Two sensors on Conveyor 2 detect Steel/Aluminum
7. **Conveyor 2** - Stops when final sensor detects cube at end
8. **Robot Sorting** - Sorts cubes into 4 bays by material type:
   - **Bay 1**: Steel (Silver)
   - **Bay 2**: Aluminum (Grey)
   - **Bay 3**: Plastic Yellow
   - **Bay 4**: Plastic Purple
9. **Cycle Complete** - Ready for next batch (bay clearing coming soon)

## Features

### 🎯 Core Capabilities
- **Automated Operation**: Sensor-driven process flow
- **3D Visualization**: Interactive Three.js-based factory layout
- **Real-Time Metrics Dashboard**: Live KPIs and performance tracking
- **Hybrid Data Layer**: Supports both simulated and real PLC/IoT data
- **Equipment Monitoring**: Visual status indicators for all machines
- **Production Analytics**: Throughput, cycle time, and queue tracking
- **Material Detection**: Vision system + metal sensors

### 📊 Metrics Tracked
- **Throughput**: Boxes per minute with historical chart
- **Boxes Processed**: Total count of completed boxes
- **Average Cycle Time**: Time from hopper to sorted bay
- **Equipment Status**: Gantry, Conveyors, Robot, Sensors (with 3D indicators)
- **Queue Statistics**: Waiting in hopper, In Transit, Sorted by bay
- **Defect Rate**: Percentage rejected

### 🎨 Visual Indicators
- **3D Status Lights** (above equipment):
  - 🟢 Green: Running/Active
  - 🟡 Yellow: Idle/Ready
  - 🔴 Red: Stopped/Error
- **Sensor Indicators** (at sensor locations):
  - 🟢 Green: Sensor triggered
  - 🔴 Red: Sensor idle
- **Dashboard Status**: Real-time UI updates
- **Throughput Chart**: 60-second rolling history
- **Sorting Bays**: Color-coded indicators for each material type

### 🤖 Equipment Simulation

#### Conveyor 1
- Auto-feeds cubes from hopper every 3 seconds
- Stops when sensor detects cube at end
- Speed: 0.8 m/s (simulated)

#### Vision/Camera System
- Inspects cube for 1.5 seconds
- Detects material color (Steel, Aluminum, Plastic Yellow, Plastic Purple)
- 15% random defect rate (configurable via IoT data)

#### Defect Rejection
- Piston pushes defective cubes off conveyor
- Cubes fall into defect bin
- Automatic cycle continues

#### Gantry Crane
- Picks good cubes from Conveyor 1
- Transfers to Conveyor 2
- Manual positioning: Arrow keys (Shift = faster)

#### Conveyor 2
- Two metal detection sensors:
  - Sensor 1: Detects Steel
  - Sensor 2: Detects Aluminum
- Stops when cube reaches end sensor

#### Robot Arm
- 2-second pick and place cycle
- Sorts to correct bay based on material
- Visual feedback during operation

#### Sorting Bays
- 4 bays with visual indicators
- Stack capacity: 4 cubes per bay
- Color-coded labels

## Getting Started

### Installation

1. Install dependencies:
```bash
cd factory-3d-html
npm install
```

2. Start the server:
```bash
npm start
```

3. Open in browser:
```
http://127.0.0.1:8000
```

## Usage

### Controls
- **Pause/Play**: Stop/start the simulation
- **Reset Cycle**: Clear all cubes and restart from hopper
- **Manual Release**: Manually trigger cube release (overrides auto-release)
- **Download Log**: Export event log to file
- **Arrow Keys**: Move gantry base position (Hold Shift for faster movement)
- **Mouse**:
  - Left drag: Rotate camera
  - Scroll: Zoom in/out
  - Right drag: Pan view

### Auto-Release
The system automatically releases cubes from the hopper every 3 seconds, ensuring smooth continuous operation. Manual release can override this for testing.

## Raspberry Pi + PLC Integration

### Current Setup
The digital twin is designed to run on a Raspberry Pi with Snap7 PLC communication already configured.

### Integration Approach

Since you have Snap7 PLC comms set up, you can inject real sensor data directly:

#### Option 1: Browser Console (Testing)
```javascript
// Override defect status from real vision system
window.injectFactoryData({
  equipment: {
    conveyor1: { status: 'running' },
    gantry: { status: 'active' }
  }
});
```

#### Option 2: WebSocket from Python (Raspberry Pi)
```python
import snap7
import websocket
import json
import time

# Connect to PLC
plc = snap7.client.Client()
plc.connect('192.168.0.1', 0, 1)

# Connect to digital twin
ws = websocket.create_connection("ws://localhost:8000")

while True:
    # Read PLC tags
    conv1_running = plc.db_read(1, 0, 1)[0]  # Example
    gantry_position = plc.db_read(1, 10, 4)  # Example

    # Send to digital twin
    data = {
        "equipment": {
            "conveyor1": {"status": "running" if conv1_running else "stopped"},
            "gantry": {"status": "active"}
        },
        "throughput": calculate_throughput()  # Your logic
    }

    ws.send(json.dumps(data))
    time.sleep(0.5)
```

#### Option 3: Direct JavaScript (on Pi)
Create a Node.js script on the Pi that reads PLC data via node-snap7 and injects into the digital twin.

### PLC Tag Mapping (Example)

| PLC Tag | Equipment | Digital Twin Field |
|---------|-----------|-------------------|
| DB1.DBX0.0 | Conveyor 1 Running | equipment.conveyor1.status |
| DB1.DBX0.1 | Conveyor 2 Running | equipment.conveyor2.status |
| DB1.DBX0.2 | Gantry Active | equipment.gantry.status |
| DB1.DBX0.3 | Robot Active | equipment.robot.status |
| DB1.DBW10 | Sensor Conv1 End | sensors.conv1End.active |
| DB1.DBW12 | Sensor Conv2 End | sensors.conv2End.active |
| DB1.DBW14 | Metal Sensor 1 | sensors.metalSensor1.active |
| DB1.DBW16 | Metal Sensor 2 | sensors.metalSensor2.active |
| DB1.DBD20 | Throughput | throughput |

## Hybrid Data Integration

The digital twin supports real-time data injection from external sources (PLC, IoT sensors, SCADA systems).

### Method 1: WebSocket (Real-Time)

Connect to WebSocket server:
```javascript
const ws = new WebSocket('ws://127.0.0.1:8000');

ws.onopen = () => {
  // Send equipment status
  ws.send(JSON.stringify({
    equipment: {
      gantry: { status: 'active' },
      conveyor1: { status: 'running' },
      conveyor2: { status: 'running' },
      robot: { status: 'ready' }
    },
    throughput: 15.5
  }));
};
```

### Method 2: Browser Console (Testing)

Open browser console and inject data directly:
```javascript
// Inject custom equipment status
window.injectFactoryData({
  equipment: {
    gantry: { status: 'active' },
    conveyor1: { status: 'running' }
  },
  throughput: 12.5
});
```

## Data Format

### Equipment Status
```json
{
  "equipment": {
    "gantry": {
      "status": "active|idle|stopped"
    },
    "conveyor1": {
      "status": "running|idle|stopped"
    },
    "conveyor2": {
      "status": "running|idle|stopped"
    },
    "robot": {
      "status": "active|ready|stopped"
    }
  }
}
```

### Sensor Data
```json
{
  "sensors": {
    "conv1End": { "active": true },
    "metalSensor1": { "active": false },
    "metalSensor2": { "active": true },
    "conv2End": { "active": false }
  }
}
```

### Material/Defect Override
```json
{
  "defectRate": 0.20,
  "customDefects": {
    "cube_123": true
  }
}
```

### Throughput Data
```json
{
  "throughput": 12.5
}
```

## Architecture

```
┌──────────────────────────────────────────┐
│     Physical Factory (Raspberry Pi)      │
│  ┌────────────┐        ┌──────────────┐ │
│  │ PLC (Snap7)│◄──────►│ Sensors/IO   │ │
│  └──────┬─────┘        └──────────────┘ │
│         │                                │
└─────────┼────────────────────────────────┘
          │ Snap7 Protocol
          │
┌─────────▼────────────────────────────────┐
│    Node.js/Python Bridge (on Pi)         │
│    - Reads PLC tags                      │
│    - Converts to JSON                    │
└─────────┬────────────────────────────────┘
          │ WebSocket
          │
┌─────────▼────────────────────────────────┐
│      Digital Twin Server (server.js)     │
│  - WebSocket Server                      │
│  - HTTP Server                           │
│  - Logging                               │
└─────────┬────────────────────────────────┘
          │ Real-time updates
          │
┌─────────▼────────────────────────────────┐
│      Digital Twin Client (Browser)       │
│  - MetricsTracker                        │
│  - 3D Scene (Three.js)                   │
│  - Dashboard UI                          │
│  - Hybrid Data Layer                     │
└──────────────────────────────────────────┘
```

## File Structure

```
factory-3d-html/
├── index.html              # Main HTML page with dashboard UI
├── main.js                 # 3D scene, process logic, and digital twin
├── server.js               # HTTP + WebSocket server
├── package.json            # Dependencies
├── example-data-injector.js # Example IoT data simulator
├── logs/                   # Application logs
│   └── app.log
└── README.md               # This file
```

## Process State Machine

Each cube goes through these states:

1. `hopper` → Waiting in hopper queue
2. `on_conv1` → Moving on Conveyor 1
3. `inspecting` → Being inspected by vision system
4. `rejecting` → Being pushed off by piston (if defect)
5. `rejected` → In defect bin (terminal state)
6. `ready_for_gantry` → Waiting for gantry pickup
7. `gantry_lift` → Being transferred by gantry
8. `on_conv2` → Moving on Conveyor 2
9. `waiting_robot` → At end of Conveyor 2, being picked by robot
10. `done` → Sorted into bay (terminal state)

## Customization

### Adjust Defect Rate
Edit [main.js:271](main.js#L271):
```javascript
const DEFECT_RATE = 0.15; // 15% → Change to desired %
```

### Adjust Auto-Release Interval
Edit [main.js:432](main.js#L432):
```javascript
const AUTO_RELEASE_INTERVAL = 3.0; // 3 seconds → Change as needed
```

### Change Conveyor Speed
Edit conveyor speed in [main.js](main.js) (search for `delta * 0.8`):
```javascript
box.position.x -= delta * 0.8; // 0.8 m/s → adjust speed
```

### Modify Material Types
Edit [main.js:267-272](main.js#L267):
```javascript
const MATERIALS = {
  STEEL: { color: 0xbfbfbf, name: 'Steel', isMetal: true, bay: 0 },
  // Add or modify materials here
};
```

## Development

### Adding New Sensors

1. Add to sensors object in [main.js](main.js):
```javascript
const sensors = {
  newSensor: { position: 2.0, active: false }
};
```

2. Create visual indicator:
```javascript
const sensorIndicators = {
  newSensor: createSensorIndicator(2.0, height, z, 'Label')
};
```

3. Add detection logic in `updateBoxes()` state machine

### Adding New Equipment

1. Create 3D model in [main.js](main.js)
2. Add status indicator with `createStatusLight()`
3. Add equipment to `metrics.equipment` object
4. Update dashboard UI in [index.html](index.html)

## Troubleshooting

### WebSocket Not Connecting
- Ensure server is running (`npm start`)
- Check browser console for errors
- WebSocket features are optional - simulation mode still works

### Cubes Not Auto-Releasing
- Check browser console for errors
- Ensure simulation is not paused
- Check `AUTO_RELEASE_INTERVAL` setting

### Sensors Not Triggering
- Verify cube is reaching sensor position
- Check sensor indicator colors (should turn green)
- Look for state machine errors in console

### Metrics Not Updating
- Check browser console for JavaScript errors
- Verify animation is not paused
- Ensure dashboard elements exist in HTML

### 3D View Not Loading
- Check browser compatibility (Chrome, Firefox, Edge recommended)
- Verify internet connection (Three.js loads from CDN)
- Check browser console for module loading errors

## Future Enhancements

- [x] Automated hopper release
- [x] Sensor-driven conveyor stops
- [x] Vision inspection with defect detection
- [x] Metal detection sensors
- [x] Material-based sorting to 4 bays
- [ ] Bay clearing/tipping mechanism (linear actuator)
- [ ] Full cycle automation (clear → return to hopper)
- [ ] REST API endpoint for data injection
- [ ] Historical data storage (database integration)
- [ ] Predictive maintenance alerts
- [ ] Multi-factory support
- [ ] AR/VR viewing modes
- [ ] Export reports (PDF, Excel)
- [ ] User authentication
- [ ] Mobile app integration
- [ ] OEE (Overall Equipment Effectiveness) calculation

## Performance Notes

- Optimized for Raspberry Pi 4 (2GB+ RAM recommended)
- Runs smoothly on modern browsers
- WebSocket overhead: ~1-5 KB/s for typical sensor updates
- 3D rendering: ~30-60 FPS on Raspberry Pi with hardware acceleration

## License

MIT

## Support

For issues or questions:
1. Check browser console for error messages
2. Review server logs in `logs/app.log`
3. Include error messages in support requests
4. For PLC integration issues, verify Snap7 connection first

## Credits

Built with:
- [Three.js](https://threejs.org/) - 3D Graphics
- [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket) - Real-time communication
- [Node.js](https://nodejs.org/) - Server runtime
- [Snap7](https://snap7.sourceforge.net/) - PLC communication (on Raspberry Pi)

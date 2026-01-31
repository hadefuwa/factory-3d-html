# Error Logging System

## Log Files Created

1. **app-errors.log** - Backend server errors
   - Location: `C:\Users\Hamed\Documents\factory-3d-html\app-errors.log`
   - Logs server crashes, port conflicts, file system errors

2. **logs/app.log** - Frontend application logs  
   - Location: `C:\Users\Hamed\Documents\factory-3d-html\logs\app.log`
   - Logs cube movements, sensor triggers, process events

## How to Check Logs

### Real-time monitoring:
```powershell
# Watch error log
Get-Content app-errors.log -Wait

# Watch app log
Get-Content logs\app.log -Wait -Tail 20
```

### View last entries:
```powershell
Get-Content app-errors.log -Tail 50
Get-Content logs\app.log -Tail 50
```

### Download from browser:
- Click **"Download Log"** button in the UI
- Saves as `factory-demo.log.txt`

## Status

✅ **Collision Detection Fixed** - Boxes now properly queue behind each other
✅ **Syntax Errors Fixed** - No more double quote issues  
✅ **Error Logging Active** - All errors tracked to files
✅ **Server Running** - http://127.0.0.1:8000

## Testing Collision Detection

Watch for these log entries:
- `Released: [Material] [DEFECT]` - Cube spawned
- `Sensor 1: Cube detected` - Reached conveyor 1 end
- `Vision: OK/DEFECT` - Inspection complete
- `Gantry: Placed on conveyor 2` - Transfer complete
- `Robot: Sorted to [Bay]` - Final sorting

If cubes queue properly, you'll see gaps between "Released" messages as boxes wait for space.

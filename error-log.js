// Enhanced error logging for debugging
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, 'app-errors.log');

function logError(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // Append to file
  fs.appendFileSync(logFile, logMessage);
  
  // Also output to console
  console.error(logMessage);
}

// Clear log file on start
fs.writeFileSync(logFile, `=== App Started: ${new Date().toISOString()} ===\n`);

module.exports = { logError };

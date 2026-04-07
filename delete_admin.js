const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'apps', 'web', 'src', 'app', '(admin)');

try {
  fs.rmSync(targetPath, { recursive: true, force: true });
  console.log("Successfully deleted (admin)");
} catch (e) {
  console.error("Error deleting (admin):", e.message);
}

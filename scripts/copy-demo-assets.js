// Copies the static demo shell (HTML/CSS) next to the bundled demo script.
const fs = require('fs');
const path = require('path');

const sourceDir = path.resolve(__dirname, '..', 'demo', 'public');
const targetDir = path.resolve(__dirname, '..', 'demo-dist');

fs.mkdirSync(targetDir, { recursive: true });
for (const entry of fs.readdirSync(sourceDir)) {
  fs.copyFileSync(path.join(sourceDir, entry), path.join(targetDir, entry));
}

// Prevent GitHub Pages from running the output through Jekyll.
fs.writeFileSync(path.join(targetDir, '.nojekyll'), '');

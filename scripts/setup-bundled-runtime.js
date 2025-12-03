const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const RUNTIME_DIR = path.join(__dirname, '..', 'playwright-runtime');

console.log('🚀 Setting up bundled Playwright runtime...');
console.log(`   Target directory: ${RUNTIME_DIR}`);

// Create runtime directory structure
if (!fs.existsSync(RUNTIME_DIR)) {
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  console.log('✅ Created runtime directory');
} else {
  console.log('📁 Runtime directory already exists');
}

// Copy Node.js executable
const nodeExecutable = process.platform === 'win32' ? 'node.exe' : 'node';
const systemNodePath = process.execPath; // Path to current Node.js executable
const bundledNodePath = path.join(RUNTIME_DIR, nodeExecutable);

if (!fs.existsSync(systemNodePath)) {
  console.error(`❌ Error: Cannot find Node.js at ${systemNodePath}`);
  process.exit(1);
}

console.log(`📦 Copying Node.js from ${systemNodePath}...`);
try {
  fs.copyFileSync(systemNodePath, bundledNodePath);
  // Make executable on Unix systems
  if (process.platform !== 'win32') {
    fs.chmodSync(bundledNodePath, '755');
  }
  console.log(`✅ Node.js copied to ${bundledNodePath}`);
} catch (error) {
  console.error(`❌ Error copying Node.js: ${error.message}`);
  process.exit(1);
}

// Create package.json for runtime
const runtimePackageJson = {
  name: 'playwright-runtime',
  version: '1.0.0',
  private: true,
  dependencies: {
    '@playwright/test': '^1.40.0',
    'playwright': '^1.40.0',
  },
};

const packageJsonPath = path.join(RUNTIME_DIR, 'package.json');
fs.writeFileSync(
  packageJsonPath,
  JSON.stringify(runtimePackageJson, null, 2)
);
console.log('✅ Created package.json for runtime');

// Install Playwright using the bundled Node.js
console.log('📥 Installing Playwright dependencies...');
const npmPath = path.join(process.cwd(), 'node_modules', '.bin', process.platform === 'win32' ? 'npm.cmd' : 'npm');

if (!fs.existsSync(npmPath)) {
  // Fallback: use system npm
  const systemNpm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  console.log(`⚠️  Using system npm (${systemNpm})`);
  
  try {
    execSync(`${systemNpm} install`, {
      cwd: RUNTIME_DIR,
      stdio: 'inherit',
      env: {
        ...process.env,
        PLAYWRIGHT_BROWSERS_PATH: path.join(RUNTIME_DIR, 'ms-playwright'),
      },
    });
  } catch (error) {
    console.error(`❌ Error installing Playwright: ${error.message}`);
    process.exit(1);
  }
} else {
  try {
    execSync(`"${npmPath}" install`, {
      cwd: RUNTIME_DIR,
      stdio: 'inherit',
      env: {
        ...process.env,
        PLAYWRIGHT_BROWSERS_PATH: path.join(RUNTIME_DIR, 'ms-playwright'),
      },
    });
  } catch (error) {
    console.error(`❌ Error installing Playwright: ${error.message}`);
    process.exit(1);
  }
}

// Install browsers
console.log('🌐 Installing Playwright browsers (this may take a few minutes)...');
const playwrightCli = path.join(RUNTIME_DIR, 'node_modules', '@playwright', 'test', 'cli.js');

if (!fs.existsSync(playwrightCli)) {
  console.error(`❌ Error: Playwright CLI not found at ${playwrightCli}`);
  process.exit(1);
}

try {
  // Install chromium and firefox (most commonly used)
  execSync(`"${bundledNodePath}" "${playwrightCli}" install chromium firefox`, {
    cwd: RUNTIME_DIR,
    stdio: 'inherit',
    env: {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: path.join(RUNTIME_DIR, 'ms-playwright'),
    },
  });
  console.log('✅ Browsers installed successfully');
} catch (error) {
  console.error(`❌ Error installing browsers: ${error.message}`);
  console.log('⚠️  Continuing anyway - browsers can be installed later via the app');
}

// Verify installation
console.log('\n🔍 Verifying installation...');
const nodeVersion = execSync(`"${bundledNodePath}" --version`, { encoding: 'utf-8' }).trim();
console.log(`   Node.js version: ${nodeVersion}`);

if (fs.existsSync(playwrightCli)) {
  console.log('   ✅ Playwright CLI found');
} else {
  console.log('   ❌ Playwright CLI not found');
}

const browsersPath = path.join(RUNTIME_DIR, 'ms-playwright');
if (fs.existsSync(browsersPath)) {
  const browsers = fs.readdirSync(browsersPath).filter(f => 
    fs.statSync(path.join(browsersPath, f)).isDirectory()
  );
  console.log(`   ✅ Browsers installed: ${browsers.length > 0 ? browsers.join(', ') : 'none yet'}`);
} else {
  console.log('   ⚠️  Browsers directory not found (will be created on first use)');
}

console.log('\n✅ Bundled runtime setup complete!');
console.log(`   Runtime directory: ${RUNTIME_DIR}`);
console.log(`   Node.js: ${bundledNodePath}`);
console.log(`   Browsers: ${browsersPath}`);
console.log('\n💡 This runtime will be bundled with your Electron app.');


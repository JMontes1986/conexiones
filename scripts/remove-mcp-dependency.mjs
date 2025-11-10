import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.join(__dirname, '..');
const TARGET_PACKAGE = '@modelcontextprotocol/sdk';

async function readJson(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

async function writeJson(filePath, data, originalExists) {
  if (!originalExists) {
    return;
  }

  const json = `${JSON.stringify(data, null, 2)}\n`;
  await fs.writeFile(filePath, json, 'utf8');
}

function removeFromContainer(container, key) {
  if (container && Object.prototype.hasOwnProperty.call(container, key)) {
    delete container[key];
    return true;
  }
  return false;
}

function sanitizePackageLock(lockJson) {
  if (!lockJson) return false;
  let modified = false;

  if (lockJson.packages) {
    for (const [name, pkg] of Object.entries(lockJson.packages)) {
      if (name === `node_modules/${TARGET_PACKAGE}`) {
        delete lockJson.packages[name];
        modified = true;
        continue;
      }

      if (pkg?.dependencies && removeFromContainer(pkg.dependencies, TARGET_PACKAGE)) {
        modified = true;
      }
    }

    if (lockJson.packages['']) {
      const rootPkg = lockJson.packages[''];
      if (removeFromContainer(rootPkg.dependencies, TARGET_PACKAGE)) {
        modified = true;
      }
      if (removeFromContainer(rootPkg.devDependencies, TARGET_PACKAGE)) {
        modified = true;
      }
      if (removeFromContainer(rootPkg.optionalDependencies, TARGET_PACKAGE)) {
        modified = true;
      }
    }
  }

  if (lockJson.dependencies && removeFromContainer(lockJson.dependencies, TARGET_PACKAGE)) {
    modified = true;
  }

  return modified;
}

function sanitizePackageJson(pkgJson) {
  if (!pkgJson) return false;
  let modified = false;

  if (removeFromContainer(pkgJson.dependencies, TARGET_PACKAGE)) {
    modified = true;
  }
  if (removeFromContainer(pkgJson.devDependencies, TARGET_PACKAGE)) {
    modified = true;
  }
  if (removeFromContainer(pkgJson.optionalDependencies, TARGET_PACKAGE)) {
    modified = true;
  }

  return modified;
}

async function main() {
  const packageJsonPath = path.join(ROOT, 'package.json');
  const packageLockPath = path.join(ROOT, 'package-lock.json');

  const [pkgJson, lockJson] = await Promise.all([
    readJson(packageJsonPath),
    readJson(packageLockPath),
  ]);

  const pkgModified = sanitizePackageJson(pkgJson);
  const lockModified = sanitizePackageLock(lockJson);

  if (pkgModified) {
    await writeJson(packageJsonPath, pkgJson, true);
    console.log(`Removed ${TARGET_PACKAGE} from package.json`);
  }

  if (lockModified) {
    await writeJson(packageLockPath, lockJson, Boolean(lockJson));
    console.log(`Removed ${TARGET_PACKAGE} from package-lock.json`);
  }
}

main().catch((error) => {
  console.error(`Failed to sanitize ${TARGET_PACKAGE} references:`, error);
  process.exitCode = 1;
});

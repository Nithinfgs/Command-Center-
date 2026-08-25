import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const testRoot = mkdtempSync(join(tmpdir(), 'mission-control-tests-'));
const compilerPath = join(repositoryRoot, 'node_modules', 'typescript', 'bin', 'tsc');
let exitCode = 1;

try {
  const configPath = join(testRoot, 'tsconfig.json');
  const outputPath = join(testRoot, 'compiled');
  writeFileSync(configPath, JSON.stringify({
    compilerOptions: {
      target: 'ES2023',
      module: 'CommonJS',
      moduleResolution: 'Node',
      ignoreDeprecations: '6.0',
      outDir: outputPath,
      rootDir: repositoryRoot,
      skipLibCheck: true,
      esModuleInterop: true,
      types: ['node'],
      typeRoots: [join(repositoryRoot, 'node_modules', '@types')],
      noEmitOnError: true
    },
    files: [join(repositoryRoot, 'tests', 'test-suite.ts')]
  }, null, 2));

  const compile = spawnSync(process.execPath, [compilerPath, '-p', configPath], {
    cwd: repositoryRoot,
    stdio: 'inherit'
  });

  if (compile.status === 0) {
    const testFile = join(outputPath, 'tests', 'test-suite.js');
    const testRun = spawnSync(process.execPath, [testFile], {
      cwd: repositoryRoot,
      stdio: 'inherit'
    });
    exitCode = testRun.status ?? 1;
  }
} finally {
  const safeTempRoot = resolve(tmpdir());
  const resolvedTestRoot = resolve(testRoot);
  if (resolvedTestRoot.startsWith(safeTempRoot) && resolvedTestRoot.includes('mission-control-tests-')) {
    rmSync(resolvedTestRoot, { recursive: true, force: true });
  }
}

process.exit(exitCode);

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT_FILES = ['package.json', 'package-lock.json', 'tsconfig.json'];

export interface BuildAttestation {
  algorithm: 'sha256';
  fingerprint: string;
  fileCount: number;
  files: string[];
  projectRoot: string;
}

function findProjectRoot(): string {
  const starts = [process.cwd(), dirname(fileURLToPath(import.meta.url))];

  for (const start of starts) {
    let cursor = resolve(start);
    for (let depth = 0; depth < 8; depth += 1) {
      if (existsSync(join(cursor, 'package.json')) && existsSync(join(cursor, 'src'))) {
        return cursor;
      }
      const parent = dirname(cursor);
      if (parent === cursor) break;
      cursor = parent;
    }
  }

  throw new Error('Unable to locate the Pentimento project root for build attestation.');
}

function collectSourceFiles(directory: string): string[] {
  const files: string[] = [];

  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === '__pycache__') continue;
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSourceFiles(absolute));
      continue;
    }
    if (!entry.isFile() || entry.name.endsWith('.pyc')) continue;
    files.push(absolute);
  }

  return files;
}

export function computeBuildAttestation(projectRoot = findProjectRoot()): BuildAttestation {
  const absoluteRoot = resolve(projectRoot);
  const candidates = [
    ...ROOT_FILES.map(name => join(absoluteRoot, name)).filter(existsSync),
    ...collectSourceFiles(join(absoluteRoot, 'src')),
  ];
  const files = candidates
    .map(absolute => relative(absoluteRoot, absolute).replace(/\\/g, '/'))
    .sort();
  const hash = createHash('sha256');

  for (const file of files) {
    const absolute = join(absoluteRoot, file);
    const bytes = readFileSync(absolute);
    const size = statSync(absolute).size;
    hash.update(file, 'utf8');
    hash.update('\0');
    hash.update(String(size), 'utf8');
    hash.update('\0');
    hash.update(bytes);
    hash.update('\0');
  }

  return {
    algorithm: 'sha256',
    fingerprint: hash.digest('hex'),
    fileCount: files.length,
    files,
    projectRoot: absoluteRoot,
  };
}

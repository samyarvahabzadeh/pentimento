import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

function collectFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolute = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(absolute));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function main(): void {
  const root = resolve(process.cwd());
  const sourceRoot = join(root, 'src');
  const files = collectFiles(sourceRoot);
  const violations: string[] = [];

  for (const absolute of files) {
    const relativePath = relative(root, absolute).replace(/\\/g, '/');
    const text = readFileSync(absolute, 'utf8');

    if (/^live_mtproto.*\.py$/i.test(relativePath.split('/').pop() ?? '')) {
      violations.push(`${relativePath}: unauthorized live Telegram harness`);
    }
    if (/(?:API_HASH|TG_API_HASH)[\s\S]{0,80}["'][0-9a-f]{24,}["']/i.test(text)) {
      violations.push(`${relativePath}: hard-coded API hash`);
    }
    if (/(?:API_ID|TG_API_ID)[\s\S]{0,80}["']?\d{6,}["']?/i.test(text)) {
      violations.push(`${relativePath}: hard-coded API ID`);
    }
    if (/(?:TG_PHONE|PHONE)[\s\S]{0,80}["']\+\d{7,}["']/i.test(text)) {
      violations.push(`${relativePath}: hard-coded phone number`);
    }
    if (/TELEGRAM_BOT_TOKEN[\s\S]{0,80}["']\d{6,}:[A-Za-z0-9_-]{20,}["']/i.test(text)) {
      violations.push(`${relativePath}: hard-coded bot token`);
    }
  }

  assert.deepEqual(violations, [], `source credential hygiene violations:\n${violations.join('\n')}`);
  console.log('PASS sourceSecurityRegressionTest');
}

main();


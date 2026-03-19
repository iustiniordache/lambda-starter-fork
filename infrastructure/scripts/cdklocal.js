#!/usr/bin/env node

const { spawnSync } = require('node:child_process');
const path = require('node:path');

process.env.CDK_DISABLE_LEGACY_EXPORT_WARNING = process.env.CDK_DISABLE_LEGACY_EXPORT_WARNING || '1';

const executable = process.platform === 'win32' ? 'cdklocal.cmd' : 'cdklocal';
const command = path.resolve(__dirname, '..', 'node_modules', '.bin', executable);

const result = spawnSync(command, process.argv.slice(2), {
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env,
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
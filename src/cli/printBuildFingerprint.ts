import { computeBuildAttestation } from '../core/buildAttestation.js';

const attestation = computeBuildAttestation();

if (process.argv.includes('--hash-only')) {
  console.log(attestation.fingerprint);
} else {
  console.log(JSON.stringify({
    algorithm: attestation.algorithm,
    fingerprint: attestation.fingerprint,
    fileCount: attestation.fileCount,
    files: attestation.files,
  }, null, 2));
}


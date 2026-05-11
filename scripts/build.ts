import { build } from 'esbuild';
import { join } from 'path';
import { rmSync } from 'fs';

async function runBuild(): Promise<void> {
  rmSync(join(__dirname, '../dist'), { recursive: true, force: true });

  await build({
    entryPoints: [
      join(__dirname, '../lib/services/products/*.ts'),
      join(__dirname, '../lib/services/import-file/*.ts'),
    ],
    bundle: true,
    minify: true,
    sourcemap: true,
    platform: 'node',
    target: 'node20',
    outdir: join(__dirname, '../dist'),
    outbase: join(__dirname, '../lib/services'),
    entryNames: '[name]',
    format: 'esm',
    outExtension: { '.js': '.mjs' },
    external: ['@aws-sdk/*'],
  });
  console.log('⚡ TS Build complete!');
}

runBuild().catch((e) => {
  console.error(e);
  process.exit(1);
});

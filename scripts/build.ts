import { build } from 'esbuild';
import { join } from 'path';

async function runBuild(): Promise<void> {
  await build({
    entryPoints: [join(__dirname, '../services/products/*.ts')],
    bundle: true,
    minify: true,
    sourcemap: true,
    platform: 'node',
    target: 'node20',
    outdir: join(__dirname, '../dist'),
    format: 'esm',
    external: ['@aws-sdk/*'],
  });
  console.log('⚡ TS Build complete!');
}

runBuild().catch((e) => {
  console.error(e);
  process.exit(1);
});

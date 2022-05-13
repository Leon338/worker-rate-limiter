import path from 'path';
import { fileURLToPath } from 'url';
import { build } from 'esbuild';
import gzipPlugin from '@luncheon/esbuild-plugin-gzip';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename) + '/..';

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

try {
  const result = await build({
    bundle: true,
    sourcemap: false,
    format: 'esm',
    target: 'esnext',
    entryPoints: [path.join(__dirname, 'src', 'index.ts')],
    outdir: path.join(__dirname, 'dist'),
    outExtension: { '.js': '.mjs' },
    write: false,
    plugins: [
      gzipPlugin({
        uncompressed: true,
        gzip: true,
        brotli: false,
        onEnd: ({ outputFiles }) => {
          const oneMB = 1048576;
          const uncompressedSize = Buffer.byteLength(outputFiles[0].contents);
          const compressedSize = Buffer.byteLength(outputFiles[1].contents);

          console.log(
            'Uncompressed Size: %s (%s Bytes) - %s (%s%) left',
            formatBytes(uncompressedSize),
            uncompressedSize,
            formatBytes(oneMB - uncompressedSize),
            (100 - (uncompressedSize * 100) / oneMB).toFixed(1)
          );
          console.log(
            'Compressed Size: %s (%s Bytes) - %s (%s%) left',
            formatBytes(compressedSize),
            compressedSize,
            formatBytes(oneMB - compressedSize),
            (100 - (compressedSize * 100) / oneMB).toFixed(1)
          );
        },
      }),
    ],
  });
} catch {
  process.exitCode = 1;
}

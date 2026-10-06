import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
const source = process.env.RS_MAP_VIEWER_SOURCE;
if (!source) throw new Error('Set RS_MAP_VIEWER_SOURCE to the osrs.world source checkout');
const result = await build({
  entryPoints:['src/renderer-entry.ts'], bundle:true, platform:'node', format:'cjs', target:'node22',
  alias:{'osrs-map':path.resolve(source,'src')}, packages:'external',
  outfile:'vendor/osrs-minimap.cjs', legalComments:'eof', metafile:true,
});
await writeFile('vendor/osrs-map-viewer-LICENSE', await readFile(path.join(source,'LICENSE')));
console.log('Bundled osrs.world renderer;', Object.keys(result.metafile.inputs).length, 'source modules');
console.log('Runtime imports:', [...new Set(Object.values(result.metafile.outputs).flatMap(o=>o.imports.map(i=>i.path)))]);

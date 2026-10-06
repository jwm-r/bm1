import { mkdir, access, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
// Pinned to the cache used in the initial BM1 map verification. Update deliberately.
const info={name:'osrs-235_2025-11-05',game:'oldschool',environment:'live',revision:235,timestamp:'2025-11-05T11:15:06.637335Z',size:163334367};
const root=path.resolve(process.env.OSRS_CACHE_DIR || 'cache');
const dir=path.join(root,info.name);
await mkdir(dir,{recursive:true});
const indices=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,17,18,19,20,21,22,24,255];
for(const file of ['keys.json','main_file_cache.dat2',...indices.map(i=>`main_file_cache.idx${i}`)]) {
  const dest=path.join(dir,file);
  try{await access(dest);continue;}catch{}
  const url=`https://osrs.world/caches/${info.name}/${file}`;
  let success=false;
  for(let attempt=0;attempt<3;attempt++) {
    try {
      const response=await fetch(url,{signal:AbortSignal.timeout(180000)});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const buffer=Buffer.from(await response.arrayBuffer());
      if(buffer.length===0 || response.headers.get('content-type')?.includes('text/html'))throw new Error('Invalid cache file');
      await writeFile(`${dest}.tmp`,buffer);await rename(`${dest}.tmp`,dest);success=true;break;
    } catch(error){if(attempt===2)throw new Error(`Cache download failed for ${file}: ${error.message}`);}
  }
  if(success)console.log(`Downloaded ${file}`);
}
await writeFile(path.join(root,'caches.json'),JSON.stringify([info]));

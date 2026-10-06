// Build-time adapter over the BSD-licensed osrs.world renderer; no browser needed.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { CacheFiles } from 'osrs-map/rs/cache/CacheFiles';
import { CacheSystem } from 'osrs-map/rs/cache/CacheSystem';
import { detectCacheType } from 'osrs-map/rs/cache/CacheType';
import { getCacheLoaderFactory } from 'osrs-map/rs/cache/loader/CacheLoaderFactory';
import { Bzip2 } from 'osrs-map/rs/compression/Bzip2';
import { LocModelLoader } from 'osrs-map/rs/config/loctype/LocModelLoader';
import { MapImageRenderer } from 'osrs-map/rs/map/MapImageRenderer';
import { LocLoadType, SceneBuilder } from 'osrs-map/rs/scene/SceneBuilder';
import { Hasher } from 'osrs-map/util/Hasher';
export async function createRenderer(cacheDirectory: string) {
  const infos = JSON.parse(await readFile(path.join(cacheDirectory,'caches.json'),'utf8'));
  const info = infos.filter((i:any)=>i.game === 'oldschool' && i.environment === 'live').sort((a:any,b:any)=>b.revision-a.revision || Date.parse(b.timestamp)-Date.parse(a.timestamp))[0];
  if (!info || !/^[a-zA-Z0-9_-]+$/.test(info.name)) throw new Error('Invalid OSRS cache manifest');
  const dir = path.join(cacheDirectory,info.name);
  const files = new Map();
  for(const name of await readdir(dir)) if(name.startsWith('main_file_cache.')) {
    const b = await readFile(path.join(dir,name));
    files.set(name,b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));
  }
  const keys = JSON.parse(await readFile(path.join(dir,'keys.json'),'utf8'));
  const xteas = new Map(Object.entries(keys).map(([id,key])=>[Number(id),key]));
  await Promise.all([Bzip2.initWasm(), Hasher.init()]);
  const factory = getCacheLoaderFactory(info, CacheSystem.fromFiles(detectCacheType(info),new CacheFiles(files)));
  const locs = factory.getLocTypeLoader();
  const textures = factory.getTextureLoader();
  const modelLoader = new LocModelLoader(locs,factory.getModelLoader(),textures,factory.getSeqTypeLoader(),factory.getSeqFrameLoader(),factory.getSkeletalSeqLoader());
  const builder = new SceneBuilder(info,factory.getMapFileLoader(),factory.getUnderlayTypeLoader(),factory.getOverlayTypeLoader(),locs,modelLoader,xteas);
  const renderer = new MapImageRenderer(textures,locs,factory.getMapScenes(),factory.getMapFunctions());
  return {
    info,
    render(x:number,y:number,plane:number) {
      if(![x,y,plane].every(Number.isInteger) || x<0 || y<0 || x>255 || y>255 || plane<0 || plane>3) throw new Error('Invalid map square');
      if(!builder.getTerrainData(x,y)) return undefined;
      const scene=builder.buildScene(x*64-6,y*64-6,76,76,false,LocLoadType.NO_MODELS);
      const pixels=renderer.renderMinimapHd(scene,plane,true);
      const rgba=new Uint8Array(pixels.length*4);
      for(let i=0;i<pixels.length;i++) {
        rgba[i*4]=(pixels[i]>>>16)&255; rgba[i*4+1]=(pixels[i]>>>8)&255;
        rgba[i*4+2]=pixels[i]&255; rgba[i*4+3]=255;
      }
      return rgba;
    },
  };
}

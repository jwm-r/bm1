import { mkdir, writeFile, rename, access } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';
import { ENDPOINT, joinFrame, dataFrame, decodeFrame, passphraseId, randomId } from './protocol.mjs';
import { applyEvent, createSnapshot, requiredTiles } from './snapshot.mjs';
const require = createRequire(import.meta.url);

export async function sampleParty({passphrase='bm1', sampleMs=25000, WebSocketImpl=WebSocket}={}) {
  const partyId=await passphraseId(passphrase.toLowerCase());
  const memberId=randomId(), members=new Map();
  return new Promise((resolve,reject)=>{
    const ws=new WebSocketImpl(`${ENDPOINT}?sessionId=${crypto.randomUUID()}`);
    ws.binaryType='arraybuffer';
    let ack=false, finished=false, sampledAt, collectionTimer;
    const deadline=setTimeout(()=>finish(new Error('RuneLite did not acknowledge party join')),12000);
    const shutdown=()=>{if(ws.readyState===1) ws.send(new Uint8Array([18,0]));ws.close();};
    const finish=(error)=>{
      if(finished)return; finished=true;
      clearTimeout(deadline);clearTimeout(collectionTimer);
      shutdown();
      if(error)reject(error);else resolve(createSnapshot(members,sampledAt,new Date().toISOString(),passphrase.toUpperCase()));
    };
    ws.addEventListener('open',()=>ws.send(joinFrame(partyId,memberId)));
    ws.addEventListener('message',({data})=>{
      if(finished || !(data instanceof ArrayBuffer))return;
      let event;
      try{event=decodeFrame(new Uint8Array(data));}catch{return;}
      if(!event || event.partyId!==partyId)return;
      if(event.kind==='join' && event.memberId===memberId.toString() && !ack){
        ack=true;sampledAt=new Date().toISOString();clearTimeout(deadline);
        ws.send(dataFrame('UserSync'));
        collectionTimer=setTimeout(()=>finish(),sampleMs);
      }
      applyEvent(members,event,memberId.toString());
    });
    ws.addEventListener('error',()=>finish(new Error('RuneLite WebSocket failed; previous snapshot preserved')));
    ws.addEventListener('close',()=>{if(!finished)finish(new Error('RuneLite disconnected before collection completed'));});
  });
}

export async function renderSnapshot(snapshot, {cacheDir, outputDir}) {
  const {createRenderer}=require('../vendor/osrs-minimap.cjs');
  const renderer=await createRenderer(cacheDir);
  const root=`tiles/${renderer.info.name}`;
  const tiles=[];
  for(const [key,{x,y,plane}] of requiredTiles(snapshot.players)) {
    const file=path.join(outputDir,root,`${key}.webp`);
    let exists=true;
    try{await access(file);}catch{exists=false;}
    if(!exists) {
      const pixels=renderer.render(x,y,plane);
      if(!pixels)continue;
      await mkdir(path.dirname(file),{recursive:true});
      await sharp(pixels,{raw:{width:304,height:304,channels:4}})
        .extract({left:24,top:24,width:256,height:256}).webp({quality:85}).toFile(file);
    }
    tiles.push(key);
  }
  snapshot.map={source:'osrs.world',cache:renderer.info.name,cacheDate:renderer.info.timestamp,tileRoot:root,tiles};
  return snapshot;
}

async function main() {
  const outputDir=path.resolve(process.env.FEED_DIR || 'feed');
  const cacheDir=path.resolve(process.env.OSRS_CACHE_DIR || 'cache');
  const snapshot=await sampleParty({passphrase:process.env.PARTY_PASSPHRASE || 'bm1'});
  await renderSnapshot(snapshot,{cacheDir,outputDir});
  await mkdir(outputDir,{recursive:true});
  // Publish only after a full acknowledged sample and successful map generation.
  const file=path.join(outputDir,'latest.json');
  await writeFile(`${file}.tmp`,JSON.stringify(snapshot)+'\n');
  await rename(`${file}.tmp`,file);
  console.log(`Snapshot ready: ${snapshot.players.length} players, ${snapshot.map.tiles.length} map tiles.`);
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) main().catch(error=>{console.error(error.message);process.exitCode=1;});

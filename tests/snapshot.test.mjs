import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { MAX_ID, joinFrame, decodeFrame, passphraseId, bytesField, varint } from '../src/protocol.mjs';
import { applyEvent, createSnapshot, requiredTiles } from '../src/snapshot.mjs';
import { sampleParty } from '../src/collect.mjs';
const id='9007199254740999';
const join={kind:'join',partyId:1n,memberId:id};
const data=message=>({kind:'data',partyId:1n,memberId:id,message});
test('Guava little-endian SHA-256 and lossless int64 wire IDs',async()=>{
 assert.equal(await passphraseId('bm1'),createHash('sha256').update('bm1').digest().readBigUInt64LE() & MAX_ID);
 assert.equal(decodeFrame(joinFrame(1n,MAX_ID)).memberId,MAX_ID.toString());
 assert.throws(()=>decodeFrame(new Uint8Array([10,99,8])));
});
test('snapshot includes only joined named players and positions, never inventory or chat',()=>{
 const m=new Map();applyEvent(m,join,'self');
 applyEvent(m,data({type:'StatusUpdate',n:'Tester',hc:99}),'self');
 applyEvent(m,data({type:'PartyBatchedChange',i:[4151,1],m:[{t:'W',v:420}]}),'self');
 applyEvent(m,data({type:'LocationUpdate',c:(2<<28)|(3222<<14)|3218}),'self','2026-10-05T01:00:00.000Z');
 const s=createSnapshot(m,'2026-10-05T01:00:00.000Z','2026-10-05T01:00:25.000Z');
 assert.deepEqual(s.players[0],{id,name:'Tester',world:420,position:{x:3222,y:3218,plane:2},observedAt:'2026-10-05T01:00:00.000Z'});
 assert.equal(JSON.stringify(s).includes('4151'),false);
 applyEvent(m,{...join,kind:'part'},'self');assert.equal(createSnapshot(m,'a','b').players.length,0);
});
test('logout clears position; late messages cannot resurrect departed players',()=>{
 const m=new Map();applyEvent(m,join,'self');
 applyEvent(m,data({type:'StatusUpdate',n:'Tester'}),'self');
 applyEvent(m,data({type:'LocationUpdate',c:123}),'self');
 applyEvent(m,data({type:'StatusUpdate',n:''}),'self');
 assert.equal(m.get(id).position,null);assert.equal(createSnapshot(m,'a','b').players.length,0);
 applyEvent(m,{...join,kind:'part'},'self');applyEvent(m,data({type:'StatusUpdate',n:'Tester'}),'self');assert.equal(m.size,0);
});
test('nearby tiles deduplicate and separate planes',()=>{
 assert.equal(requiredTiles([{position:{x:3222,y:3218,plane:0}},{position:{x:3222,y:3218,plane:0}}]).size,49);
 assert.equal(requiredTiles([{position:{x:3222,y:3218,plane:0}},{position:{x:3222,y:3218,plane:1}}]).size,98);
});
test('collector waits for acknowledgement, includes members announced first, leaves explicitly',async()=>{
 let sentPart=false;
 class FakeSocket extends EventTarget {
   readyState=1;
   constructor(){super();queueMicrotask(()=>this.dispatchEvent(new Event('open')));}
   send(buffer){
     if(buffer[0]===18){sentPart=true;return;}
     if(buffer[0]!==10)return;
     const {partyId,memberId}=decodeFrame(buffer);
     const emit=bytes=>this.dispatchEvent(new MessageEvent('message',{data:bytes.buffer}));
     emit(joinFrame(partyId,BigInt(id)));
     emit(joinFrame(partyId,BigInt(memberId)));
     const payload=[8,...varint(partyId),16,...varint(BigInt(id)),...bytesField(3,new TextEncoder().encode(JSON.stringify({type:'StatusUpdate',n:'Fixture'})))];
     emit(new Uint8Array(bytesField(3,payload)));
   }
   close(){this.readyState=3;this.dispatchEvent(new Event('close'));}
 }
 const result=await sampleParty({sampleMs:1,WebSocketImpl:FakeSocket});
 assert.equal(result.players[0].name,'Fixture');assert.equal(sentPart,true);
});
test('disconnected collection fails instead of publishing an empty success',async()=>{
 class FailedSocket extends EventTarget {
   readyState=3;
   constructor(){super();queueMicrotask(()=>this.dispatchEvent(new Event('close')));}
   close(){}
 }
 await assert.rejects(()=>sampleParty({WebSocketImpl:FailedSocket}),/disconnected/);
});

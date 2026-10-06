export function applyEvent(members, event, selfId, now = new Date().toISOString()) {
  if (event.memberId === selfId) return;
  if (event.kind === 'part') { members.delete(event.memberId); return; }
  if (event.kind === 'join') {
    if (!members.has(event.memberId)) members.set(event.memberId, { id:event.memberId, name:null, world:null, position:null, observedAt:null });
    return;
  }
  if (event.kind !== 'data' || !members.has(event.memberId)) return;
  const member = members.get(event.memberId), m = event.message;
  if(m.type === 'StatusUpdate' && typeof m.n === 'string') {
    member.name = m.n.slice(0,40);
    if(!m.n) { member.position=null; member.observedAt=null; }
  }
  if(m.type === 'PartyBatchedChange' && Array.isArray(m.m)) for(const change of m.m.slice(0,30)) {
    if(change?.t === 'U' && typeof change.s === 'string') {
      member.name=change.s.slice(0,40);
      if(!change.s) {member.position=null;member.observedAt=null;}
    }
    if(change?.t === 'W' && Number.isInteger(change.v) && change.v>=0 && change.v<10000) member.world=change.v || null;
  }
  if(m.type === 'LocationUpdate' && Number.isInteger(m.c) && m.c >= 0 && m.c <= 0x3fffffff) {
    member.position={x:(m.c>>>14)&16383,y:m.c&16383,plane:(m.c>>>28)&3};
    member.observedAt=now;
  }
}
export function createSnapshot(members, sampledAt, completedAt, channel='BM1') {
  const players = [...members.values()].filter(m=>m.name).sort((a,b)=>a.name.localeCompare(b.name));
  return { schemaVersion:1, channel, sampledAt, completedAt, expectedIntervalSeconds:300, players };
}
export function requiredTiles(players, radius=3) {
  const result = new Map();
  for(const player of players) if(player.position) {
    const {x,y,plane} = player.position;
    for(let dx=-radius;dx<=radius;dx++) for(let dy=-radius;dy<=radius;dy++) {
      const mx=(x>>6)+dx, my=(y>>6)+dy;
      if(mx<0 || my<0 || mx>255 || my>255) continue;
      result.set(`${plane}/${mx}_${my}`,{x:mx,y:my,plane});
    }
  }
  return result;
}

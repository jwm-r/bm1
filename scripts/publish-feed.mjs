import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
const dir=path.resolve(process.env.FEED_DIR || 'feed');
const snapshot=JSON.parse(await readFile(path.join(dir,'latest.json'),'utf8'));
if(snapshot.schemaVersion!==1 || !Array.isArray(snapshot.players))throw new Error('Invalid feed');
const git=(args,options={})=>execFileSync('git',args,{encoding:'utf8',...options}).trim();
const tmp=await mkdtemp(path.join(os.tmpdir(),'bm1-index-'));
const env={...process.env,GIT_INDEX_FILE:path.join(tmp,'index')};
git(['--work-tree',dir,'add','--all'],{env});
const tree=git(['write-tree'],{env});
let parent;
try{parent=git(['rev-parse','--verify','refs/remotes/origin/data']);}catch{}
const args=['commit-tree',tree];if(parent)args.push('-p',parent);
const commit=git(args,{input:`Update BM1 snapshot ${snapshot.completedAt}\n`});
git(['push','origin',`${commit}:refs/heads/data`]);
console.log('Published snapshot to data branch.');

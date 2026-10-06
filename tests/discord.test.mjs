import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeEvents, normalizeLoot, collectDiscord } from '../src/discord.mjs';
const id = '123456789012345678';
test('Discord event export excludes ended events and attendee/profile data', () => {
 const e = normalizeEvents([{id, status: 1, name: 'Raid', description: 'Join us', scheduled_start_time: '2026-10-06T12:00:00Z', creator: {email:'private'}}, {id, status: 3}], id);
 assert.equal(e.length, 1); assert.equal(e[0].name, 'Raid'); assert.ok(!JSON.stringify(e).includes('private'));
});
test('Loot export only includes allowed automated authors and selected fields', () => {
 const m = {id, timestamp:'2026-10-06T12:00:00Z', content:'Drop!', author:{id, bot:true}, attachments:[{url:'private'}]};
 const output = normalizeLoot([m, {...m,author:{id,bot:false}}, {...m,author:{id:'999',bot:true}}],id,id,[id]);
 assert.equal(output.length,1); assert.equal(output[0].text,'Drop!'); assert.ok(!JSON.stringify(output).includes('private'));
});
test('Missing bot token skips requests and invalid configuration fails before network', async () => {
 const fetch = () => {throw new Error('network should not run')};
 await collectDiscord({},fetch);
 await assert.rejects(collectDiscord({DISCORD_BOT_TOKEN:'test'},fetch),/DISCORD_GUILD_ID/);
});

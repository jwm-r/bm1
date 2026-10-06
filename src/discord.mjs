import { mkdir, rename, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const snowflake = value => /^\d{17,20}$/.test(value ?? '');
const clean = (value, max = 2000) => typeof value === 'string' ? value.slice(0, max) : '';
export function normalizeEvents(events, guildId) {
  return events.filter(e => snowflake(e.id) && [1, 2].includes(e.status)).map(e => ({
    id: e.id, name: clean(e.name, 100), description: clean(e.description),
    startsAt: e.scheduled_start_time, endsAt: e.scheduled_end_time ?? null,
    status: e.status === 2 ? 'active' : 'scheduled',
    url: `https://discord.com/events/${guildId}/${e.id}`,
  })).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}
export function normalizeLoot(messages, guildId, channelId, authorIds) {
  return messages.filter(m => snowflake(m.id) && authorIds.includes(m.author?.id) && (m.author?.bot || m.webhook_id)).map(m => ({
    id: m.id, postedAt: m.timestamp, text: clean(m.content),
    embeds: (m.embeds ?? []).slice(0, 10).map(e => ({title: clean(e.title, 256), description: clean(e.description), fields: (e.fields ?? []).slice(0, 25).map(f => ({name: clean(f.name, 256), value: clean(f.value, 1024)}))})),
    url: `https://discord.com/channels/${guildId}/${channelId}/${m.id}`,
  }));
}
export async function collectDiscord(env = process.env, fetchImpl = fetch) {
  if (!env.DISCORD_BOT_TOKEN) { console.log('Discord not configured; skipping.'); return; }
  const guildId = env.DISCORD_GUILD_ID;
  if (!snowflake(guildId)) throw new Error('Set DISCORD_GUILD_ID to the server ID');
  async function get(path) {
    for (let attempt = 0; attempt < 3; attempt++) {
      const response = await fetchImpl(`https://discord.com/api/v10${path}`, {headers: {Authorization: `Bot ${env.DISCORD_BOT_TOKEN}`}, signal: AbortSignal.timeout(15000)});
      if (response.status === 429 && attempt < 2) {
        const delay = Number((await response.json()).retry_after);
        if (!Number.isFinite(delay) || delay < 0 || delay > 30) throw new Error('Discord rate limit; retry next run');
        await new Promise(r => setTimeout(r, Math.ceil(delay * 1000))); continue;
      }
      if (!response.ok) throw new Error(`Discord request failed: HTTP ${response.status}`);
      return response.json();
    }
  }
  const events = normalizeEvents(await get(`/guilds/${guildId}/scheduled-events`), guildId);
  let loot = [];
  if (env.DISCORD_LOOT_CHANNEL_ID) {
    const channelId = env.DISCORD_LOOT_CHANNEL_ID;
    const authors = (env.DISCORD_LOOT_AUTHOR_IDS ?? '').split(',').map(s => s.trim()).filter(Boolean);
    if (!snowflake(channelId) || !authors.length || !authors.every(snowflake)) throw new Error('Loot requires channel ID and allowed bot/webhook author IDs');
    const channel = await get(`/channels/${channelId}`);
    if (channel.guild_id !== guildId) throw new Error('Loot channel belongs to a different server');
    loot = normalizeLoot(await get(`/channels/${channelId}/messages?limit=100`), guildId, channelId, authors);
  }
  const directory = resolve(env.FEED_DIR ?? 'feed');
  await mkdir(directory, {recursive: true});
  await writeFile(resolve(directory, 'discord.json.tmp'), JSON.stringify({schemaVersion: 1, sampledAt: new Date().toISOString(), events, loot}) + '\n');
  await rename(resolve(directory, 'discord.json.tmp'), resolve(directory, 'discord.json'));
  console.log(`Collected ${events.length} events and ${loot.length} loot posts`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) collectDiscord().catch(e => {console.error(e.message); process.exitCode = 1;});

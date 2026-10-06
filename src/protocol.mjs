// Schema: RuneLite's party/Party.java. Keep int64 IDs as bigint throughout.
const encoder = new TextEncoder();
const decoder = new TextDecoder();
export const ENDPOINT = "wss://api.runelite.net/ws2";
export const MAX_ID = (1n << 63n) - 1n;
export function varint(value) {
    if (value < 0n || value > MAX_ID)
        throw new Error("Invalid identifier");
    const bytes = [];
    do {
        const b = Number(value & 127n);
        value >>= 7n;
        bytes.push(b | (value ? 128 : 0));
    } while (value);
    return bytes;
}
export function bytesField(field, bytes) {
    return [...varint(BigInt(field * 8 + 2)), ...varint(BigInt(bytes.length)), ...bytes];
}
export function joinFrame(party, member) {
    return new Uint8Array(bytesField(1, [8, ...varint(party), 16, ...varint(member)]));
}
export function dataFrame(type, data = {}) {
    return new Uint8Array(bytesField(3, [
        ...bytesField(1, encoder.encode(JSON.stringify({ ...data, type }))),
        ...bytesField(2, encoder.encode(type)),
    ]));
}
export async function passphraseId(passphrase) {
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(passphrase));
    // Guava HashCode.asLong() reads the first eight digest bytes little endian.
    return new DataView(digest).getBigUint64(0, true) & MAX_ID;
}
export function randomId() {
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    return new DataView(bytes.buffer).getBigUint64(0, true) & MAX_ID || 1n;
}
export function fields(bytes) {
    if (bytes.length > 1048576)
        throw new Error("Frame too large");
    let offset = 0;
    const read = () => {
        let n = 0n;
        for (let i = 0; i < 10; i++) {
            if (offset >= bytes.length)
                throw new Error("Truncated varint");
            const b = bytes[offset++];
            n |= BigInt(b & 127) << BigInt(i * 7);
            if (!(b & 128))
                return n;
        }
        throw new Error("Invalid varint");
    };
    const result = new Map();
    while (offset < bytes.length) {
        const tag = Number(read());
        const wire = tag & 7;
        const field = tag >>> 3;
        if (!field)
            throw new Error("Invalid field");
        if (wire === 0)
            result.set(field, read());
        else if (wire === 2 || wire === 1 || wire === 5) {
            const length = wire === 2 ? Number(read()) : wire === 1 ? 8 : 4;
            if (!Number.isSafeInteger(length) || length < 0 || offset + length > bytes.length)
                throw new Error("Truncated field");
            if (wire === 2)
                result.set(field, bytes.slice(offset, offset + length));
            offset += length;
        }
        else
            throw new Error("Unsupported wire type");
    }
    return result;
}
export function decodeFrame(bytes) {
    const outer = fields(bytes);
    for (const kind of [1, 2, 3]) {
        const payload = outer.get(kind);
        if (!(payload instanceof Uint8Array))
            continue;
        const inner = fields(payload);
        const partyId = inner.get(1) ?? 0n;
        const memberId = inner.get(2) ?? 0n;
        if (typeof partyId !== "bigint" || typeof memberId !== "bigint")
            throw new Error("Invalid member event");
        if (kind < 3)
            return { kind: kind === 1 ? "join" : "part", partyId, memberId: memberId.toString() };
        const json = inner.get(3);
        if (!(json instanceof Uint8Array))
            throw new Error("Invalid data event");
        const message = JSON.parse(decoder.decode(json));
        if (!message || typeof message !== "object" || Array.isArray(message))
            throw new Error("Invalid message");
        return { kind: "data", partyId, memberId: memberId.toString(), message };
    }
}

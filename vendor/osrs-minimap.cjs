var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/renderer-entry.ts
var renderer_entry_exports = {};
__export(renderer_entry_exports, {
  createRenderer: () => createRenderer
});
module.exports = __toCommonJS(renderer_entry_exports);
var import_promises = require("node:fs/promises");
var import_node_path = __toESM(require("node:path"), 1);

// ../rs-party-dashboard/src/rs/cache/store/SectorCluster.ts
var SectorCluster = class _SectorCluster {
  constructor(size, sector) {
    this.size = size;
    this.sector = sector;
  }
  static {
    this.SIZE = 6;
  }
  static decode(buffer) {
    const size = buffer.readMedium();
    const sector = buffer.readMedium();
    return new _SectorCluster(size, sector);
  }
};

// ../rs-party-dashboard/src/rs/cache/CacheFiles.ts
var CacheFiles = class _CacheFiles {
  constructor(files) {
    this.files = files;
  }
  static {
    this.DAT_FILE_NAME = "main_file_cache.dat";
  }
  static {
    this.DAT2_FILE_NAME = "main_file_cache.dat2";
  }
  static {
    this.INDEX_FILE_PREFIX = "main_file_cache.idx";
  }
  static {
    this.META_FILE_NAME = "main_file_cache.idx255";
  }
  static {
    this.DAT_INDEX_COUNT = 5;
  }
  static fetchFiles(cacheType, baseUrl, name, shared = false, signal, progressListener) {
    switch (cacheType) {
      case "legacy":
        return _CacheFiles.fetchLegacy(baseUrl, name, shared, signal, progressListener);
      case "dat":
        return _CacheFiles.fetchDat(baseUrl, name, shared, signal, progressListener);
      case "dat2":
        return _CacheFiles.fetchDat2(baseUrl, name, [], shared, signal, progressListener);
    }
    throw new Error("Not implemented");
  }
  static async fetchLegacy(baseUrl, cacheName, shared = false, signal, progressListener) {
    const files = /* @__PURE__ */ new Map();
    const cache = await caches.open(cacheName);
    const modelsFilePromise = fetchCachedFile(
      baseUrl,
      "models",
      shared,
      false,
      cache,
      signal,
      progressListener
    );
    const fileNames = ["title", "config", "media", "textures"];
    const filePromises = fileNames.map(
      (name) => fetchCachedFile(baseUrl, name, shared, false, cache, signal)
    );
    let mapNames = [];
    try {
      mapNames = await fetch(baseUrl + "maps.json").then((resp) => resp.json());
    } catch (e) {
    }
    for (const mapName of mapNames) {
      filePromises.push(
        fetchCachedFile(baseUrl, "maps/" + mapName, shared, false, cache, signal)
      );
    }
    const cachedFiles = await Promise.all([modelsFilePromise, ...filePromises]);
    for (const file of cachedFiles) {
      files.set(file.name, file.data);
    }
    return new _CacheFiles(files);
  }
  static async fetchDat(baseUrl, cacheName, shared = false, signal, progressListener) {
    const files = /* @__PURE__ */ new Map();
    const cache = await caches.open(cacheName);
    const dataFilePromise = fetchCachedFile(
      baseUrl,
      _CacheFiles.DAT_FILE_NAME,
      shared,
      true,
      cache,
      signal,
      progressListener
    );
    const indexFilePromises = [];
    for (let i = 0; i < _CacheFiles.DAT_INDEX_COUNT; i++) {
      indexFilePromises.push(
        fetchCachedFile(baseUrl, _CacheFiles.INDEX_FILE_PREFIX + i, shared, false, cache)
      );
    }
    const dataAndIndices = await Promise.all([dataFilePromise, ...indexFilePromises]);
    for (const file of dataAndIndices) {
      files.set(file.name, file.data);
    }
    return new _CacheFiles(files);
  }
  static async fetchDat2(baseUrl, cacheName, indicesToLoad = [], shared = false, signal, progressListener) {
    const files = /* @__PURE__ */ new Map();
    const cache = await caches.open(cacheName);
    const dataFilePromise = fetchCachedFile(
      baseUrl,
      _CacheFiles.DAT2_FILE_NAME,
      shared,
      true,
      cache,
      signal,
      progressListener
    );
    const metaFile = await fetchCachedFile(
      baseUrl,
      _CacheFiles.META_FILE_NAME,
      shared,
      false,
      cache
    );
    const indexCount = metaFile.data.byteLength / SectorCluster.SIZE;
    if (indicesToLoad.length === 0) {
      indicesToLoad = Array.from({ length: indexCount }, (_, i) => i);
    }
    const indexPromises = indicesToLoad.map(
      (indexId) => fetchCachedFile(
        baseUrl,
        _CacheFiles.INDEX_FILE_PREFIX + indexId,
        shared,
        false,
        cache
      ).catch(console.error)
    );
    const dataAndIndices = await Promise.all([dataFilePromise, ...indexPromises]);
    for (const file of dataAndIndices) {
      if (file) {
        files.set(file.name, file.data);
      }
    }
    files.set(metaFile.name, metaFile.data);
    return new _CacheFiles(files);
  }
};
function ReadableBufferStream(ab) {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(ab));
      controller.close();
    }
  });
}
async function toBufferParts(response, offset, progressListener) {
  if (!response.body) {
    return [];
  }
  const contentLength = offset + Number(response.headers.get("Content-Length") || 0);
  const reader = response.body.getReader();
  const parts = [];
  let currentLength = offset;
  if (progressListener) {
    progressListener({
      total: contentLength,
      current: currentLength,
      part: new Uint8Array(0)
    });
  }
  for (let res = await reader.read(); !res.done && res.value; res = await reader.read()) {
    parts.push(res.value);
    currentLength += res.value.byteLength;
    if (progressListener) {
      progressListener({
        total: contentLength,
        current: currentLength,
        part: res.value
      });
    }
  }
  return parts;
}
function partsToBuffer(parts, shared) {
  let totalLength = 0;
  for (const part of parts) {
    totalLength += part.byteLength;
  }
  const outputBuffer = new ArrayBuffer(totalLength);
  const u8 = new Uint8Array(outputBuffer);
  let offset = 0;
  for (const buffer of parts) {
    u8.set(buffer, offset);
    offset += buffer.byteLength;
  }
  return outputBuffer;
}
async function fetchCachedFile(baseUrl, name, shared, incremental, cache, signal, progressListener) {
  const path2 = baseUrl + name;
  const cachedResp = await cache.match(path2);
  if (cachedResp) {
    const parts2 = await toBufferParts(cachedResp, 0, progressListener);
    return {
      name,
      data: partsToBuffer(parts2, shared)
    };
  }
  const partUrls = [];
  const partBuffers = [];
  if (incremental) {
    const partResponses = await cache.matchAll(path2 + "/part/", {
      ignoreSearch: true
    });
    for (const partResp of partResponses) {
      const index = parseInt(partResp.headers.get("Cache-Part") || "0");
      partUrls.push(path2 + "/part/?p=" + index);
      partBuffers[index] = await toBufferParts(partResp, 0);
    }
  }
  const parts = [];
  let partCount = 0;
  let offset = 0;
  for (let i = 0; i < partBuffers.length; i++) {
    const partBuffer = partBuffers[i];
    if (!partBuffer) {
      break;
    }
    partCount++;
    for (const part of partBuffer) {
      parts.push(part);
      offset += part.byteLength;
    }
  }
  const headers = {};
  if (offset > 0) {
    headers["Range"] = `bytes=${offset}-${Number.MAX_SAFE_INTEGER}`;
  }
  const resp = await fetch(path2, {
    headers,
    signal
  });
  if (resp.status !== 200 && resp.status !== 206) {
    throw new Error("Failed downloading " + path2 + ", " + resp.status);
  }
  const cacheUpdates = [];
  let partCache = [];
  let partCacheLength = 0;
  const partProgressListener = (progress) => {
    if (incremental && progress.part.byteLength > 0) {
      partCache.push(progress.part);
      partCacheLength += progress.part.byteLength;
      const partCacheThreshold = Math.max(progress.total * 0.01, 1e3 * 1024);
      if (partCacheLength > partCacheThreshold) {
        const partUrl = path2 + "/part/?p=" + partCount;
        partUrls.push(partUrl);
        const partResp = new Response(
          ReadableBufferStream(partsToBuffer(partCache, false)),
          {
            status: 200,
            headers: {
              "Content-Type": "application/octet-stream",
              "Content-Length": partCacheLength.toString(),
              "Cache-Part": partCount.toString()
            }
          }
        );
        Object.defineProperty(partResp, "url", { value: partUrl });
        const update = cache.put(partUrl, partResp);
        cacheUpdates.push(update);
        partCount++;
        partCache = [];
        partCacheLength = 0;
      }
    }
    if (progressListener) {
      progressListener(progress);
    }
  };
  const newParts = await toBufferParts(resp, offset, partProgressListener);
  for (const part of newParts) {
    parts.push(part);
  }
  const buffer = partsToBuffer(parts, shared);
  cache.put(
    path2,
    new Response(ReadableBufferStream(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": buffer.byteLength.toString()
      }
    })
  );
  if (incremental) {
    await Promise.all(cacheUpdates);
    for (const url of partUrls) {
      cache.delete(url);
    }
  }
  return {
    name,
    data: buffer
  };
}

// ../rs-party-dashboard/src/rs/util/StringUtil.ts
var StringUtil = class {
  // An implementation of Dan Bernstein's {@code djb2} hash function which is
  // slightly modified. Instead of the initial hash being 5381, it is zero.
  static hashDjb2(str) {
    let hash = 0;
    if (str.length === 0) {
      return hash;
    }
    let char;
    for (let i = 0; i < str.length; i++) {
      char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return hash;
  }
  static hashOld(name) {
    name = name.toUpperCase();
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = hash * 61 + name.charCodeAt(i) - 32 | 0;
    }
    return hash;
  }
};

// ../rs-party-dashboard/src/rs/compression/Bzip2.ts
var import_wasm_bz2 = __toESM(require("@foxglove/wasm-bz2"));
var bzip2 = require("bzip2");
var Bzip2 = class _Bzip2 {
  static {
    this.bzip2Header = new Uint8Array("BZh1".split("").map((char) => char.charCodeAt(0)));
  }
  static async initWasm() {
    const bzip = await import_wasm_bz2.default.init();
    _Bzip2.wasmBzip = bzip;
    return bzip;
  }
  static decompress(compressed, actualSize) {
    const compressedBzip = new Uint8Array(compressed.length + 4);
    compressedBzip.set(_Bzip2.bzip2Header, 0);
    compressedBzip.set(compressed, 4);
    if (_Bzip2.wasmBzip) {
      const decompressed = _Bzip2.wasmBzip.decompress(compressedBzip, actualSize, {
        small: false
      });
      return new Int8Array(decompressed.buffer);
    }
    return new Int8Array(bzip2.simple(bzip2.array(compressedBzip)).buffer);
  }
};

// ../rs-party-dashboard/src/rs/compression/Gzip.ts
var import_pako = __toESM(require("pako"));
var Gzip = class {
  static async initWasm() {
  }
  static decompress(compressed) {
    const decompressed = new Int8Array(import_pako.default.ungzip(compressed).buffer);
    return decompressed;
  }
};

// ../rs-party-dashboard/src/util/FloatUtil.ts
var FloatUtil = class _FloatUtil {
  static {
    this.MAX_VALUE = 34028234663852886e22;
  }
  static {
    this.float = new Float32Array(1);
  }
  static {
    this.integer = new Int32Array(_FloatUtil.float.buffer);
  }
  static floatBitsToInt(n) {
    _FloatUtil.float[0] = n;
    return _FloatUtil.integer[0];
  }
  static intBitsToFloat(n) {
    _FloatUtil.integer[0] = n;
    return _FloatUtil.float[0];
  }
  static packFloat11(v) {
    return 1024 - Math.round(v / (1 / 64));
  }
  static unpackFloat11(v) {
    return 16 - v / 64;
  }
  // 0-1, 1/63 decimal precision
  static packFloat6(v) {
    return Math.round(v / (1 / 63));
  }
  static unpackFloat6(v) {
    return v / 63;
  }
};

// ../rs-party-dashboard/src/rs/io/ByteBuffer.ts
var ByteBuffer = class {
  constructor(dataOrSize) {
    this.offset = 0;
    if (dataOrSize instanceof Int8Array) {
      this._data = dataOrSize;
    } else if (dataOrSize instanceof ArrayBuffer) {
      this._data = new Int8Array(dataOrSize);
    } else {
      this._data = new Int8Array(dataOrSize);
    }
  }
  readByte() {
    if (this.offset > this._data.length - 1) {
      throw new Error("Buffer overflow");
    }
    return this._data[this.offset++];
  }
  readUnsignedByte() {
    return this.readByte() & 255;
  }
  readShort() {
    return (this.readUnsignedByte() << 8 | this.readUnsignedByte()) << 16 >> 16;
  }
  readUnsignedShort() {
    return this.readShort() & 65535;
  }
  // cg2
  readSignedShort() {
    const v = this.readUnsignedShort();
    if (v > 32767) {
      return v - 65536;
    }
    return v;
  }
  readMedium() {
    return this.readUnsignedByte() << 16 | this.readUnsignedByte() << 8 | this.readUnsignedByte();
  }
  readUnsignedMedium() {
    return this.readMedium() & 16777215;
  }
  readInt() {
    return this.readUnsignedByte() << 24 | this.readUnsignedByte() << 16 | this.readUnsignedByte() << 8 | this.readUnsignedByte();
  }
  readFloat() {
    return FloatUtil.intBitsToFloat(this.readInt());
  }
  readBigSmart() {
    if (this.getByte(this.offset) < 0) {
      return this.readInt() & 2147483647;
    } else {
      const v = this.readUnsignedShort();
      if (v === 32767) {
        return -1;
      }
      return v;
    }
  }
  readUnsignedSmart() {
    if (this.getUnsignedByte(this.offset) < 128) {
      return this.readUnsignedByte();
    } else {
      return this.readUnsignedShort() - 32768;
    }
  }
  readUnsignedSmartMin1() {
    if (this.getUnsignedByte(this.offset) < 128) {
      return this.readUnsignedByte() - 1;
    } else {
      return this.readUnsignedShort() - 32769;
    }
  }
  readSmart2() {
    if (this.getByte(this.offset) >= 0) {
      return this.readUnsignedByte() - 64;
    } else {
      return this.readUnsignedShort() - 49152;
    }
  }
  readSmart3() {
    let i = 0;
    let i_33_ = this.readUnsignedSmart();
    while (i_33_ === 32767) {
      i_33_ = this.readUnsignedSmart();
      i += 32767;
    }
    i += i_33_;
    return i;
  }
  readString(endValue = 0) {
    let str = "";
    while (this.getByte(this.offset) !== endValue) {
      str += String.fromCharCode(this.readUnsignedByte());
    }
    this.readByte();
    return str;
  }
  readNullString() {
    if (this.getByte(this.offset) === 0) {
      this.offset++;
      return void 0;
    } else {
      return this.readString();
    }
  }
  readVerString() {
    if (this.readByte() !== 0) {
      return void 0;
    }
    return this.readString();
  }
  getByte(offset) {
    return this._data[offset];
  }
  getUnsignedByte(offset) {
    return this.getByte(offset) & 255;
  }
  getShort(offset) {
    return this.getUnsignedByte(offset) << 8 | this.getUnsignedByte(offset + 1);
  }
  getUnsignedShort(offset) {
    return this.getShort(offset) & 65535;
  }
  getInt(offset) {
    return this.getUnsignedByte(offset) << 24 | this.getUnsignedByte(offset + 1) << 16 | this.getUnsignedByte(offset + 2) << 8 | this.getUnsignedByte(offset + 3);
  }
  readBytes(amount) {
    const bytes = this._data.subarray(this.offset, this.offset + amount);
    this.offset += amount;
    return bytes;
  }
  readUnsignedBytes(amount) {
    const bytes = new Uint8Array(this._data.buffer).subarray(this.offset, this.offset + amount);
    this.offset += amount;
    return bytes;
  }
  writeBytes(bytes) {
    this._data.set(bytes, this.offset);
    this.offset += bytes.length;
  }
  writeInt(v) {
    this._data[this.offset++] = v >> 24;
    this._data[this.offset++] = v >> 16;
    this._data[this.offset++] = v >> 8;
    this._data[this.offset++] = v;
  }
  setInt(offset, v) {
    this._data[offset++] = v >> 24;
    this._data[offset++] = v >> 16;
    this._data[offset++] = v >> 8;
    this._data[offset++] = v;
  }
  get length() {
    return this._data.length;
  }
  get remaining() {
    return this.length - this.offset;
  }
  get data() {
    return this._data;
  }
};

// ../rs-party-dashboard/src/rs/cache/ArchiveFile.ts
var ArchiveFile = class {
  constructor(id, archiveId, data) {
    this.id = id;
    this.archiveId = archiveId;
    this.data = data;
  }
  getDataAsBuffer() {
    return new ByteBuffer(this.data);
  }
};

// ../rs-party-dashboard/src/rs/cache/Archive.ts
var Archive = class _Archive {
  constructor(_hashFunction, id, lastFileId, fileCount, fileIds, fileNameHashes, _files, _fileNameHashIdMap = /* @__PURE__ */ new Map()) {
    this._hashFunction = _hashFunction;
    this.id = id;
    this.lastFileId = lastFileId;
    this.fileCount = fileCount;
    this.fileIds = fileIds;
    this.fileNameHashes = fileNameHashes;
    this._files = _files;
    this._fileNameHashIdMap = _fileNameHashIdMap;
    if (fileNameHashes) {
      for (let i = 0; i < this.fileIds.length; i++) {
        this._fileNameHashIdMap.set(this.fileNameHashes[i], this.fileIds[i]);
      }
    }
  }
  static create(id, data) {
    const fileCount = 1;
    const lastFileId = fileCount - 1;
    const fileIds = new Int32Array(fileCount);
    const fileNameHashes = new Int32Array(fileCount);
    const files = /* @__PURE__ */ new Map();
    files.set(lastFileId, new ArchiveFile(lastFileId, id, data));
    return new _Archive(
      StringUtil.hashOld,
      id,
      lastFileId,
      fileCount,
      fileIds,
      fileNameHashes,
      files
    );
  }
  static decodeOld(id, data, multipleFiles) {
    const buffer = new ByteBuffer(data);
    const files = /* @__PURE__ */ new Map();
    let fileCount;
    let fileIds;
    let fileNameHashes;
    if (multipleFiles) {
      const actualSize = buffer.readMedium();
      const size = buffer.readMedium();
      const isCompressed = actualSize !== size;
      let dataBuffer;
      let metaBuffer;
      if (isCompressed) {
        const data2 = buffer.readUnsignedBytes(size);
        const decompressed = Bzip2.decompress(data2, actualSize);
        dataBuffer = new ByteBuffer(decompressed);
        metaBuffer = new ByteBuffer(decompressed);
      } else {
        dataBuffer = new ByteBuffer(data);
        metaBuffer = buffer;
      }
      fileCount = metaBuffer.readUnsignedShort();
      dataBuffer.offset = metaBuffer.offset + fileCount * 10;
      fileIds = new Int32Array(fileCount);
      fileNameHashes = new Int32Array(fileCount);
      for (let i = 0; i < fileCount; i++) {
        const nameHash = metaBuffer.readInt();
        const fileActualSize = metaBuffer.readMedium();
        const fileSize = metaBuffer.readMedium();
        let decompressedFile;
        if (isCompressed) {
          decompressedFile = dataBuffer.readBytes(fileSize);
        } else {
          const data2 = dataBuffer.readUnsignedBytes(fileSize);
          decompressedFile = Bzip2.decompress(data2, fileActualSize);
        }
        files.set(i, new ArchiveFile(i, id, decompressedFile));
        fileIds[i] = i;
        fileNameHashes[i] = nameHash;
      }
    } else {
      const decompressed = Gzip.decompress(buffer.readUnsignedBytes(buffer.remaining));
      fileCount = 1;
      fileIds = new Int32Array(fileCount);
      fileNameHashes = new Int32Array(fileCount);
      files.set(0, new ArchiveFile(0, id, decompressed));
    }
    const lastFileId = fileCount - 1;
    return new _Archive(
      StringUtil.hashOld,
      id,
      lastFileId,
      fileCount,
      fileIds,
      fileNameHashes,
      files
    );
  }
  static decode(id, lastFileId, fileCount, fileIds, fileNameHashes, buffer) {
    const files = /* @__PURE__ */ new Map();
    if (fileCount === 1) {
      files.set(lastFileId, new ArchiveFile(lastFileId, id, buffer.data));
    } else {
      buffer.offset = buffer.length - 1;
      const chunks = buffer.readUnsignedByte();
      buffer.offset = buffer.length - 1 - chunks * (fileCount * 4);
      const chunkSizes = new Int32Array(chunks * fileCount);
      const fileSizes = new Int32Array(fileCount);
      for (let chunk = 0; chunk < chunks; chunk++) {
        let lastFileSize = 0;
        for (let fileIdx = 0; fileIdx < fileCount; fileIdx++) {
          lastFileSize += buffer.readInt();
          chunkSizes[chunk * fileCount + fileIdx] = lastFileSize;
          fileSizes[fileIdx] += lastFileSize;
        }
      }
      const fileData = new Array(fileCount);
      for (let fileIdx = 0; fileIdx < fileCount; fileIdx++) {
        fileData[fileIdx] = new ByteBuffer(fileSizes[fileIdx]);
      }
      buffer.offset = 0;
      for (let chunk = 0; chunk < chunks; chunk++) {
        for (let fileIdx = 0; fileIdx < fileCount; fileIdx++) {
          const chunkSize = chunkSizes[chunk * fileCount + fileIdx];
          const bytes = buffer.readBytes(chunkSize);
          fileData[fileIdx].writeBytes(bytes);
        }
      }
      for (let fileIdx = 0; fileIdx < fileCount; fileIdx++) {
        const fileId = fileIds[fileIdx];
        const data = fileData[fileIdx].data;
        files.set(fileId, new ArchiveFile(fileId, id, data));
      }
    }
    return new _Archive(
      StringUtil.hashDjb2,
      id,
      lastFileId,
      fileCount,
      fileIds,
      fileNameHashes,
      files
    );
  }
  getFile(id) {
    return this._files.get(id);
  }
  getFileId(name) {
    const hash = this._hashFunction(name);
    return this._fileNameHashIdMap.get(hash) ?? -1;
  }
  getFileNamed(name) {
    const id = this.getFileId(name);
    if (id === -1) {
      return void 0;
    }
    return this.getFile(id);
  }
  get files() {
    return Array.from(this._files.values());
  }
};

// ../rs-party-dashboard/src/rs/compression/CompressionType.ts
var CompressionType = /* @__PURE__ */ ((CompressionType2) => {
  CompressionType2[CompressionType2["None"] = 0] = "None";
  CompressionType2[CompressionType2["Bzip2"] = 1] = "Bzip2";
  CompressionType2[CompressionType2["Gzip"] = 2] = "Gzip";
  return CompressionType2;
})(CompressionType || {});

// ../rs-party-dashboard/src/rs/crypto/Xtea.ts
var Xtea = class _Xtea {
  static {
    this.GOLDEN_RATIO = 2654435769;
  }
  static {
    this.ROUNDS = 32;
  }
  static {
    this.INITIAL_SUM = Math.imul(_Xtea.GOLDEN_RATIO, _Xtea.ROUNDS);
  }
  static isValidKey(key) {
    return key !== void 0 && key.length === 4 && (key[0] !== 0 || key[1] !== 0 || key[2] !== 0 || key[3] !== 0);
  }
  static decrypt(buf, start, end, key) {
    if (key.length !== 4) {
      throw new Error("Xtea: key is not 128 bits");
    }
    const n = Math.floor((end - start) / 8);
    for (let i = 0; i < n; i++) {
      const offset = start + i * 8;
      let sum = _Xtea.INITIAL_SUM;
      let v0 = buf.getInt(offset);
      let v1 = buf.getInt(offset + 4);
      for (let j = 0; j < _Xtea.ROUNDS; j++) {
        v1 -= (v0 << 4 ^ v0 >>> 5) + v0 ^ sum + key[sum >>> 11 & 3];
        sum -= _Xtea.GOLDEN_RATIO;
        v0 -= (v1 << 4 ^ v1 >>> 5) + v1 ^ sum + key[sum & 3];
      }
      buf.setInt(offset, v0);
      buf.setInt(offset + 4, v1);
    }
  }
};

// ../rs-party-dashboard/src/rs/cache/Container.ts
var Container = class _Container {
  constructor(compression, data) {
    this.compression = compression;
    this.data = data;
  }
  static decode(buffer, key) {
    if (buffer.remaining === 0) {
      throw new Error("Empty container");
    }
    const compression = buffer.readUnsignedByte();
    const size = buffer.readInt();
    if (Xtea.isValidKey(key)) {
      Xtea.decrypt(buffer, buffer.offset, buffer.offset + 4 + size, key);
    }
    switch (compression) {
      case 0 /* None */:
        return new _Container(compression, buffer.readBytes(size));
      case 1 /* Bzip2 */:
      case 2 /* Gzip */:
        const actualSize = buffer.readInt() & 4294967295;
        const data = buffer.readUnsignedBytes(size);
        let decompressed;
        if (compression === 1 /* Bzip2 */) {
          decompressed = Bzip2.decompress(data, actualSize);
        } else {
          decompressed = Gzip.decompress(data);
        }
        if (decompressed.length !== actualSize) {
          throw new Error(
            "Container: Size mismatch. Compressed: " + actualSize + ", Decompressed: " + decompressed.length + ", Type: " + CompressionType[compression]
          );
        }
        return new _Container(compression, decompressed);
      default:
        throw new Error("Container: Unsupported compression: " + compression);
    }
  }
};

// ../rs-party-dashboard/src/rs/cache/IndexType.ts
var IndexType = class {
  static {
    this.LEGACY = {
      configs: 0,
      media: 1,
      textures: 2,
      models: 3,
      maps: 4
    };
  }
  static {
    this.DAT = {
      configs: 0,
      models: 1,
      animations: 2,
      sounds: 3,
      maps: 4
    };
  }
  static {
    this.DAT2 = {
      animations: 0,
      skeletons: 1,
      configs: 2,
      interfaces: 3,
      soundEffects: 4,
      maps: 5,
      musicTracks: 6,
      models: 7,
      sprites: 8,
      textures: 9,
      binary: 10,
      musicJingles: 11,
      clientScript: 12,
      fonts: 13,
      musicSamples: 14,
      musicPatches: 15
    };
  }
  static {
    this.OSRS = {
      worldMapOld: 16,
      graphicDefaults: 17,
      worldMapGeography: 18,
      worldMap: 19,
      worldMapGround: 20,
      dbTableIndex: 21,
      animKeyFrames: 22
    };
  }
  static {
    this.RS2 = {
      locs: 16,
      enums: 17,
      npcs: 18,
      objs: 19,
      seqs: 20,
      spotAnims: 21,
      varbits: 22,
      materials: 26,
      particles: 27,
      defaults: 28
    };
  }
};

// ../rs-party-dashboard/src/rs/cache/ref/ArchiveFileReference.ts
var ArchiveFileReference = class {
  constructor(id, archiveId, nameHash) {
    this.id = id;
    this.archiveId = archiveId;
    this.nameHash = nameHash;
  }
};

// ../rs-party-dashboard/src/rs/cache/ref/ArchiveReference.ts
var ArchiveReference = class {
  constructor(id, nameHash, whirlpool, crc, revision, fileCount, lastFileId, _fileIdIndexMap, fileIds, fileNameHashes) {
    this.id = id;
    this.nameHash = nameHash;
    this.whirlpool = whirlpool;
    this.crc = crc;
    this.revision = revision;
    this.fileCount = fileCount;
    this.lastFileId = lastFileId;
    this._fileIdIndexMap = _fileIdIndexMap;
    this.fileIds = fileIds;
    this.fileNameHashes = fileNameHashes;
  }
  getFileReference(id) {
    const i = this._fileIdIndexMap.get(id);
    if (i === void 0) {
      return void 0;
    }
    return new ArchiveFileReference(
      this.fileIds[i],
      id,
      this.fileNameHashes ? this.fileNameHashes[i] : 0
    );
  }
  get fileReferences() {
    const refs = new Array(this.fileIds.length);
    for (let i = 0; i < this.fileIds.length; i++) {
      const ref = this.getFileReference(this.fileIds[i]);
      if (ref) {
        refs[i] = ref;
      }
    }
    return refs;
  }
};

// ../rs-party-dashboard/src/rs/cache/ref/ReferenceTable.ts
var ReferenceTable = class _ReferenceTable {
  constructor(protocol, revision, named, usesWhirlpool, archiveCount, lastArchiveId, _archiveIdIndexMap, archiveIds, _archiveNameHashes, _archiveWhirlpools, _archiveCrcs, _archiveRevisions, _archiveFileCounts, _archiveLastFileIds, _archiveFileIds, _archiveFileNameHashes, _archiveNameHashIdMap = /* @__PURE__ */ new Map()) {
    this.protocol = protocol;
    this.revision = revision;
    this.named = named;
    this.usesWhirlpool = usesWhirlpool;
    this.archiveCount = archiveCount;
    this.lastArchiveId = lastArchiveId;
    this._archiveIdIndexMap = _archiveIdIndexMap;
    this.archiveIds = archiveIds;
    this._archiveNameHashes = _archiveNameHashes;
    this._archiveWhirlpools = _archiveWhirlpools;
    this._archiveCrcs = _archiveCrcs;
    this._archiveRevisions = _archiveRevisions;
    this._archiveFileCounts = _archiveFileCounts;
    this._archiveLastFileIds = _archiveLastFileIds;
    this._archiveFileIds = _archiveFileIds;
    this._archiveFileNameHashes = _archiveFileNameHashes;
    this._archiveNameHashIdMap = _archiveNameHashIdMap;
    if (named) {
      for (let i = 0; i < this.archiveIds.length; i++) {
        this._archiveNameHashIdMap.set(this._archiveNameHashes[i], this.archiveIds[i]);
      }
    }
  }
  static {
    this.INVALID_TABLE = new _ReferenceTable(
      -1,
      -1,
      false,
      false,
      0,
      -1,
      /* @__PURE__ */ new Map(),
      new Int32Array(),
      new Int32Array(),
      [],
      new DataView(new ArrayBuffer(0)),
      new DataView(new ArrayBuffer(0)),
      new Int32Array(),
      new Int32Array(),
      [],
      []
    );
  }
  static fromArchiveCount(archiveCount) {
    const archiveIds = new Int32Array(archiveCount);
    const archiveIdIndexMap = /* @__PURE__ */ new Map();
    for (let i = 0; i < archiveCount; i++) {
      archiveIds[i] = i;
      archiveIdIndexMap.set(i, i);
    }
    const lastArchiveId = archiveCount - 1;
    const archiveNameHashes = new Int32Array(archiveCount);
    const archiveWhirlpools = new Array(archiveCount);
    const archiveFileCounts = new Int32Array(archiveCount).fill(-1);
    const archiveFileIds = new Array(archiveCount);
    const archiveLastFileIds = new Int32Array(archiveCount);
    const archiveFileNameHashes = new Array(archiveCount);
    return new _ReferenceTable(
      -1,
      -1,
      false,
      false,
      archiveCount,
      lastArchiveId,
      archiveIdIndexMap,
      archiveIds,
      archiveNameHashes,
      archiveWhirlpools,
      new DataView(new ArrayBuffer(archiveCount * 4)),
      new DataView(new ArrayBuffer(archiveCount * 4)),
      archiveFileCounts,
      archiveLastFileIds,
      archiveFileIds,
      archiveFileNameHashes
    );
  }
  static decode(buffer) {
    const protocol = buffer.readUnsignedByte();
    if (protocol < 5 || protocol > 7) {
      throw new Error("Invalid protocol: " + protocol);
    }
    const revision = protocol > 5 ? buffer.readInt() : 0;
    const flag = buffer.readUnsignedByte();
    const hasNames = (flag & 1) !== 0;
    const hasWhirlpool = (flag & 2) !== 0;
    const hasSizes = (flag & 4) !== 0;
    const hasUncompressedCrcs = (flag & 8) !== 0;
    const archiveCount = protocol === 7 ? buffer.readBigSmart() : buffer.readUnsignedShort();
    let lastArchiveId = 0;
    const archiveIds = new Int32Array(archiveCount);
    const archiveIdIndexMap = /* @__PURE__ */ new Map();
    if (protocol === 7) {
      for (let i = 0; i < archiveCount; i++) {
        lastArchiveId += buffer.readBigSmart();
        archiveIds[i] = lastArchiveId;
        archiveIdIndexMap.set(lastArchiveId, i);
      }
    } else {
      for (let i = 0; i < archiveCount; i++) {
        lastArchiveId += buffer.readUnsignedShort();
        archiveIds[i] = lastArchiveId;
        archiveIdIndexMap.set(lastArchiveId, i);
      }
    }
    const archiveNameHashes = new Int32Array(archiveCount);
    if (hasNames) {
      for (let i = 0; i < archiveCount; i++) {
        archiveNameHashes[i] = buffer.readInt();
      }
    }
    const archiveWhirlpools = new Array(archiveCount);
    if (hasWhirlpool) {
      for (let i = 0; i < archiveCount; i++) {
        archiveWhirlpools[i] = buffer.readBytes(64);
      }
    }
    const archiveCrcs = new DataView(buffer.data.buffer, buffer.offset, archiveCount * 4);
    buffer.offset += archiveCrcs.byteLength;
    if (hasSizes) {
      buffer.offset += archiveCount * 8;
    }
    const archiveRevisions = new DataView(buffer.data.buffer, buffer.offset, archiveCount * 4);
    buffer.offset += archiveRevisions.byteLength;
    const archiveFileCounts = new Int32Array(archiveCount);
    for (let i = 0; i < archiveCount; i++) {
      archiveFileCounts[i] = protocol === 7 ? buffer.readBigSmart() : buffer.readUnsignedShort();
    }
    const archiveFileIds = new Array(archiveCount);
    const archiveLastFileIds = new Int32Array(archiveCount);
    for (let i = 0; i < archiveCount; i++) {
      archiveFileIds[i] = new Int32Array(archiveFileCounts[i]);
    }
    for (let archiveIdx = 0; archiveIdx < archiveCount; archiveIdx++) {
      let lastFileId = 0;
      for (let fileIdx = 0; fileIdx < archiveFileCounts[archiveIdx]; fileIdx++) {
        lastFileId += protocol === 7 ? buffer.readBigSmart() : buffer.readUnsignedShort();
        archiveFileIds[archiveIdx][fileIdx] = lastFileId;
      }
      archiveLastFileIds[archiveIdx] = lastFileId;
    }
    const archiveFileNameHashes = new Array(archiveCount);
    if (hasNames) {
      for (let i = 0; i < archiveCount; i++) {
        archiveFileNameHashes[i] = new Int32Array(archiveFileCounts[i]);
      }
      for (let archiveIdx = 0; archiveIdx < archiveCount; archiveIdx++) {
        for (let fileIdx = 0; fileIdx < archiveFileCounts[archiveIdx]; fileIdx++) {
          archiveFileNameHashes[archiveIdx][fileIdx] = buffer.readInt();
        }
      }
    }
    return new _ReferenceTable(
      protocol,
      revision,
      hasNames,
      hasWhirlpool,
      archiveCount,
      lastArchiveId,
      archiveIdIndexMap,
      archiveIds,
      archiveNameHashes,
      archiveWhirlpools,
      archiveCrcs,
      archiveRevisions,
      archiveFileCounts,
      archiveLastFileIds,
      archiveFileIds,
      archiveFileNameHashes
    );
  }
  getArchiveId(name) {
    return this._archiveNameHashIdMap.get(StringUtil.hashDjb2(name));
  }
  archiveExists(id) {
    return this._archiveIdIndexMap.has(id);
  }
  getArchiveReference(id) {
    const i = this._archiveIdIndexMap.get(id);
    if (i === void 0) {
      return void 0;
    }
    const nameHash = this._archiveNameHashes[i];
    const whirlpool = this._archiveWhirlpools[i];
    const crc = this._archiveCrcs.getInt32(i * 4, false);
    const revision = this._archiveRevisions.getInt32(i * 4, false);
    const fileCount = this._archiveFileCounts[i];
    const lastFileId = this._archiveLastFileIds[i];
    const fileIds = this._archiveFileIds[i];
    const fileNameHashes = this._archiveFileNameHashes[i];
    const fileIdIndexMap = /* @__PURE__ */ new Map();
    for (let fileIdx = 0; fileIdx < fileCount; fileIdx++) {
      fileIdIndexMap.set(fileIds[fileIdx], fileIdx);
    }
    return new ArchiveReference(
      id,
      nameHash,
      whirlpool,
      crc,
      revision,
      fileCount,
      lastFileId,
      fileIdIndexMap,
      fileIds,
      fileNameHashes
    );
  }
  get archiveReferences() {
    const refs = new Array(this.archiveIds.length);
    for (let i = 0; i < this.archiveIds.length; i++) {
      const ref = this.getArchiveReference(this.archiveIds[i]);
      if (ref) {
        refs[i] = ref;
      }
    }
    return refs;
  }
};

// ../rs-party-dashboard/src/rs/cache/CacheIndex.ts
var CacheIndex = class {
  constructor(id, table) {
    this.id = id;
    this.table = table;
  }
  static {
    this.META_INDEX_ID = 255;
  }
  getArchiveIds() {
    return this.table.archiveIds;
  }
  getArchiveCount() {
    return this.table.archiveCount;
  }
  getLastArchiveId() {
    return this.table.lastArchiveId;
  }
  getArchiveReference(archiveId) {
    return this.table.getArchiveReference(archiveId);
  }
  getArchiveId(name) {
    return this.table.getArchiveId(name) ?? -1;
  }
  getFileIds(archiveId) {
    return this.getArchiveReference(archiveId)?.fileIds;
  }
  archiveExists(archiveId) {
    return this.table.archiveExists(archiveId);
  }
  getFileCount(archiveId) {
    return this.table.getArchiveReference(archiveId)?.fileCount ?? 0;
  }
  getFileSmart(id, key) {
    if (this.getArchiveCount() === 1) {
      return this.getFile(0, id, key);
    } else if (this.getFileCount(id) === 1) {
      return this.getFile(id, 0, key);
    }
    throw new Error("Invalid archive");
  }
};
var CacheStoreIndex = class extends CacheIndex {
  constructor(id, table, store) {
    super(id, table);
    this.store = store;
  }
  read(archiveId) {
    return this.store.read(this.id, archiveId);
  }
};
var CacheStoreIndexSync = class extends CacheStoreIndex {
  getFile(archiveId, fileId, key) {
    return this.getArchive(archiveId, key).getFile(fileId);
  }
};
var CacheIndexDat = class _CacheIndexDat extends CacheStoreIndexSync {
  static fromStore(id, store, indexFile) {
    const table = ReferenceTable.fromArchiveCount(indexFile.byteLength / SectorCluster.SIZE);
    return new _CacheIndexDat(id, table, store);
  }
  getArchive(id, key) {
    const data = this.read(id);
    return Archive.decodeOld(id, data, this.id === IndexType.DAT.configs);
  }
};
function decodeTable(data) {
  if (data.length) {
    const container = Container.decode(new ByteBuffer(data));
    return ReferenceTable.decode(new ByteBuffer(container.data));
  }
  return ReferenceTable.INVALID_TABLE;
}
function decodeArchiveData(index, id, data, key) {
  const archiveRef = index.getArchiveReference(id);
  if (!archiveRef) {
    throw new Error("Archive reference not found for: " + id);
  }
  const container = Container.decode(new ByteBuffer(data), key);
  return Archive.decode(
    id,
    archiveRef.lastFileId,
    archiveRef.fileCount,
    archiveRef.fileIds,
    archiveRef.fileNameHashes,
    new ByteBuffer(container.data)
  );
}
var CacheIndexDat2 = class _CacheIndexDat2 extends CacheStoreIndexSync {
  static fromStore(id, store) {
    const data = store.read(CacheIndex.META_INDEX_ID, id);
    try {
      const table = decodeTable(data);
      return new _CacheIndexDat2(id, table, store);
    } catch (e) {
      console.error(data, e);
      throw new Error("Failed to decode index: " + id);
    }
  }
  getArchive(id, key) {
    const data = this.read(id);
    return decodeArchiveData(this, id, data, key);
  }
};
var LegacyCacheIndex = class extends CacheIndex {
  constructor(id, archives, archiveNameHashes = /* @__PURE__ */ new Map()) {
    super(id, ReferenceTable.INVALID_TABLE);
    this.id = id;
    this.archives = archives;
    this.archiveNameHashes = archiveNameHashes;
  }
  getArchive(archiveId, key) {
    return this.archives[archiveId];
  }
  getArchiveId(name) {
    return this.archiveNameHashes.get(StringUtil.hashOld(name)) ?? -1;
  }
  getFile(archiveId, fileId, key) {
    return this.archives[archiveId]?.getFile(fileId);
  }
};

// ../rs-party-dashboard/src/rs/cache/store/Sector.ts
var Sector = class _Sector {
  static {
    this.HEADER_SIZE = 8;
  }
  static {
    this.DATA_SIZE = 512;
  }
  static {
    this.EXTENDED_HEADER_SIZE = 10;
  }
  static {
    this.EXTENDED_DATA_SIZE = 510;
  }
  static {
    this.SIZE = _Sector.HEADER_SIZE + _Sector.DATA_SIZE;
  }
  static decodeNew(buffer) {
    return _Sector.decode(new _Sector(), buffer);
  }
  static decodeExtendedNew(buffer) {
    return _Sector.decodeExtended(new _Sector(), buffer);
  }
  static decode(sector, buffer, dataSize = _Sector.DATA_SIZE) {
    sector.archiveId = buffer.readUnsignedShort();
    sector.chunk = buffer.readUnsignedShort();
    sector.nextSector = buffer.readMedium();
    sector.indexId = buffer.readUnsignedByte();
    sector.data = buffer.readBytes(dataSize);
    return sector;
  }
  static decodeExtended(sector, buffer, dataSize = _Sector.EXTENDED_DATA_SIZE) {
    sector.archiveId = buffer.readInt();
    sector.chunk = buffer.readUnsignedShort();
    sector.nextSector = buffer.readMedium();
    sector.indexId = buffer.readUnsignedByte();
    sector.data = buffer.readBytes(dataSize);
    return sector;
  }
};

// ../rs-party-dashboard/src/rs/cache/store/MemoryStore.ts
var MemoryStore = class _MemoryStore {
  constructor(dataFile, indexFiles, metaFile) {
    this.dataFile = dataFile;
    this.indexFiles = indexFiles;
    this.metaFile = metaFile;
  }
  static fromFiles(cacheFiles, indicesToLoad = []) {
    const files = cacheFiles.files;
    const indexFiles = [];
    const indicesSet = new Set(indicesToLoad);
    for (const [name, data] of files.entries()) {
      if (name !== CacheFiles.META_FILE_NAME && name.startsWith(CacheFiles.INDEX_FILE_PREFIX)) {
        const indexId = parseInt(name.slice(CacheFiles.INDEX_FILE_PREFIX.length));
        if (indicesSet.size === 0 || indicesSet.has(indexId)) {
          indexFiles[indexId] = data;
        }
      }
    }
    const dataFile = files.get(CacheFiles.DAT2_FILE_NAME) || files.get(CacheFiles.DAT_FILE_NAME);
    if (!dataFile) {
      throw new Error("main_file_cache data file not found");
    }
    const metaFile = files.get(CacheFiles.META_FILE_NAME);
    return new _MemoryStore(dataFile, indexFiles, metaFile);
  }
  getIndexFile(indexId) {
    if (indexId === CacheIndex.META_INDEX_ID) {
      return this.metaFile;
    }
    return this.indexFiles[indexId];
  }
  getSectorIndexId(indexId) {
    if (this.metaFile) {
      return indexId;
    }
    return indexId + 1;
  }
  read(indexId, archiveId) {
    if (indexId < 0) {
      throw new Error("Index id cannot be lower than 0");
    }
    const indexFile = this.getIndexFile(indexId);
    if (!indexFile) {
      throw new Error(`Index ${indexId} not found`);
    }
    const sectorIndexId = this.getSectorIndexId(indexId);
    const clusterPtr = archiveId * SectorCluster.SIZE;
    if (clusterPtr < 0 || clusterPtr + SectorCluster.SIZE > indexFile.byteLength) {
      throw new Error(
        `Invalid ptr: ${clusterPtr}, fileSize: ${indexFile.byteLength}, indexId: ${indexId}, archiveId: ${archiveId}`
      );
    }
    const extended = archiveId > 65535;
    const sectorClusterBuf = new ByteBuffer(
      new Int8Array(indexFile, clusterPtr, SectorCluster.SIZE)
    );
    const sectorCluster = SectorCluster.decode(sectorClusterBuf);
    const data = new Int8Array(sectorCluster.size);
    let chunk = 0;
    let remaining = sectorCluster.size;
    let sectorPtr = sectorCluster.sector * Sector.SIZE;
    const sectorBuffer = new ByteBuffer(0);
    const sector = new Sector();
    while (remaining > 0) {
      const headerSize = extended ? Sector.EXTENDED_HEADER_SIZE : Sector.HEADER_SIZE;
      const dataSize = extended ? Sector.EXTENDED_DATA_SIZE : Sector.DATA_SIZE;
      const actualDataSize = Math.min(dataSize, remaining);
      sectorBuffer._data = new Int8Array(
        this.dataFile,
        sectorPtr,
        headerSize + actualDataSize
      );
      sectorBuffer.offset = 0;
      if (extended) {
        Sector.decodeExtended(sector, sectorBuffer, actualDataSize);
      } else {
        Sector.decode(sector, sectorBuffer, actualDataSize);
      }
      if (remaining > dataSize) {
        data.set(sector.data, sectorCluster.size - remaining);
        if (sector.indexId !== sectorIndexId) {
          throw new Error(
            `Sector index id mismatch. expected: ${sectorIndexId} got: ${sector.indexId}`
          );
        }
        if (sector.archiveId !== archiveId) {
          throw new Error(
            `Sector archive id mismatch. expected: ${archiveId} got: ${sector.archiveId}`
          );
        }
        if (sector.chunk !== chunk) {
          throw new Error("Sector chunk mismatch");
        }
        chunk++;
        sectorPtr = sector.nextSector * Sector.SIZE;
      } else {
        data.set(sector.data.subarray(0, remaining), sectorCluster.size - remaining);
      }
      remaining -= dataSize;
    }
    return data;
  }
};

// ../rs-party-dashboard/src/rs/cache/CacheSystem.ts
var CacheSystem = class _CacheSystem {
  constructor(indices) {
    this.indices = indices;
  }
  static loadIndicesFromStore(cacheType, store) {
    return store.indexFiles.map((indexFile, id) => {
      if (!indexFile) {
        return void 0;
      }
      if (cacheType === "dat") {
        return CacheIndexDat.fromStore(id, store, indexFile);
      } else {
        return CacheIndexDat2.fromStore(id, store);
      }
    });
  }
  static loadLegacy(cacheFiles) {
    const configData = cacheFiles.files.get("config");
    if (!configData) {
      throw new Error("Missing config file");
    }
    const configArchive = Archive.decodeOld(0, new Int8Array(configData), true);
    const configIndex = new LegacyCacheIndex(IndexType.LEGACY.configs, [configArchive]);
    const mediaData = cacheFiles.files.get("media");
    if (!mediaData) {
      throw new Error("Missing media file");
    }
    const mediaArchive = Archive.decodeOld(0, new Int8Array(mediaData), true);
    const mediaIndex = new LegacyCacheIndex(IndexType.LEGACY.media, [mediaArchive]);
    const textureData = cacheFiles.files.get("textures");
    if (!textureData) {
      throw new Error("Missing textures file");
    }
    const textureArchive = Archive.decodeOld(0, new Int8Array(textureData), true);
    const textureIndex = new LegacyCacheIndex(IndexType.LEGACY.textures, [textureArchive]);
    const modelData = cacheFiles.files.get("models");
    if (!modelData) {
      throw new Error("Missing models file");
    }
    const modelArchive = Archive.decodeOld(0, new Int8Array(modelData), true);
    const modelIndex = new LegacyCacheIndex(IndexType.LEGACY.models, [modelArchive]);
    const mapsPrefix = "maps/";
    const mapArchives = [];
    const mapArchiveNameHashes = /* @__PURE__ */ new Map();
    for (const [name, data] of cacheFiles.files) {
      if (!name.startsWith(mapsPrefix)) {
        continue;
      }
      const archiveName = name.substring(mapsPrefix.length);
      const archiveId = mapArchives.length;
      mapArchives.push(Archive.create(archiveId, new Int8Array(data)));
      mapArchiveNameHashes.set(StringUtil.hashOld(archiveName), archiveId);
    }
    const mapIndex = new LegacyCacheIndex(
      IndexType.LEGACY.maps,
      mapArchives,
      mapArchiveNameHashes
    );
    return new _CacheSystem([configIndex, mediaIndex, textureIndex, modelIndex, mapIndex]);
  }
  static fromFiles(cacheType, cacheFiles, indicesToLoad = []) {
    switch (cacheType) {
      case "legacy":
        return _CacheSystem.loadLegacy(cacheFiles);
      case "dat":
      case "dat2":
        const store = MemoryStore.fromFiles(cacheFiles, indicesToLoad);
        const indices = _CacheSystem.loadIndicesFromStore(cacheType, store);
        return new _CacheSystem(indices);
    }
    throw new Error("Not implemented");
  }
  indexExists(indexId) {
    return !!this.indices[indexId];
  }
  getIndex(indexId) {
    const index = this.indices[indexId];
    if (!index) {
      throw new Error("Index not found: " + indexId);
    }
    return index;
  }
};

// ../rs-party-dashboard/src/rs/cache/CacheType.ts
function detectCacheType(cacheInfo) {
  switch (cacheInfo.game) {
    case "classic":
      return "classic";
    case "runescape":
      if (cacheInfo.revision < 234) {
        return "legacy";
      } else if (cacheInfo.revision < 410) {
        return "dat";
      } else {
        return "dat2";
      }
    case "oldschool":
      return "dat2";
    default:
      throw new Error("Unknown game type: " + cacheInfo.game);
  }
}

// ../rs-party-dashboard/src/rs/MathConstants.ts
var TAU = Math.PI * 2;
var RS_TO_RADIANS = TAU / 2048;
var RS_TO_DEGREES = RS_TO_RADIANS * 180 / Math.PI;
var DEGREES_TO_RADIANS = Math.PI / 180;
function initBitMasks() {
  const masks = new Int32Array(32);
  for (let i = 0; i < 32; i++) {
    masks[i] = (2 << i) - 1;
  }
  return masks;
}
var BIT_MASKS = initBitMasks();
var SINE = new Int32Array(2048);
var COSINE = new Int32Array(2048);
var CIRCULAR_ANGLE = 2048;
var ANGULAR_RATIO = 360 / CIRCULAR_ANGLE;
var ANGULAR_RATIO_RADIANS = ANGULAR_RATIO * DEGREES_TO_RADIANS;
for (let i = 0; i < 2048; i++) {
  SINE[i] = 65536 * Math.sin(i * ANGULAR_RATIO_RADIANS) | 0;
  COSINE[i] = 65536 * Math.cos(i * ANGULAR_RATIO_RADIANS) | 0;
}
var SINE_LARGE = new Int32Array(16384);
var COSINE_LARGE = new Int32Array(16384);
var d = 3834951969714103e-19;
for (let i = 0; i < 16384; i++) {
  SINE_LARGE[i] = 16384 * Math.sin(i * d);
  COSINE_LARGE[i] = 16384 * Math.cos(i * d);
}

// ../rs-party-dashboard/src/rs/config/TypeLoader.ts
var DummyTypeLoader = class {
  constructor(cacheInfo, typeConstructor) {
    this.cacheInfo = cacheInfo;
    this.typeConstructor = typeConstructor;
  }
  load(id) {
    return new this.typeConstructor(id, this.cacheInfo);
  }
  getCount() {
    return 0;
  }
  clearCache() {
  }
};
var BaseTypeLoader = class {
  constructor(typeConstructor, cacheInfo) {
    this.typeConstructor = typeConstructor;
    this.cacheInfo = cacheInfo;
    // TODO: maybe don't cache by default
    this.cache = /* @__PURE__ */ new Map();
  }
  load(id) {
    const cached = this.cache.get(id);
    if (cached) {
      return cached;
    }
    const type = new this.typeConstructor(id, this.cacheInfo);
    try {
      const buffer = this.getDataBuffer(id);
      if (buffer) {
        type.decode(buffer);
        type.post();
      }
    } catch (e) {
      console.error("Failed loading type " + id, e);
    }
    this.cache.set(id, type);
    return type;
  }
  clearCache() {
    this.cache.clear();
  }
};
var ArchiveTypeLoader = class extends BaseTypeLoader {
  constructor(typeConstructor, cacheInfo, archive) {
    super(typeConstructor, cacheInfo);
    this.typeConstructor = typeConstructor;
    this.cacheInfo = cacheInfo;
    this.archive = archive;
  }
  getDataBuffer(id) {
    return this.archive.getFile(id)?.getDataAsBuffer();
  }
  getCount() {
    return this.archive.fileCount;
  }
};
var IndexTypeLoader = class extends BaseTypeLoader {
  constructor(typeConstructor, cacheInfo, index, fileIdBits = 8) {
    super(typeConstructor, cacheInfo);
    this.typeConstructor = typeConstructor;
    this.cacheInfo = cacheInfo;
    this.index = index;
    this.fileIdBits = fileIdBits;
    this.archives = /* @__PURE__ */ new Map();
    const filesPerArchive = 1 << fileIdBits;
    this.count = Math.max((index.getArchiveCount() - 1) * filesPerArchive, 0) + index.getFileCount(index.getLastArchiveId());
  }
  getDataBuffer(id) {
    const archiveId = id >> this.fileIdBits;
    const fileId = id & BIT_MASKS[this.fileIdBits - 1];
    let archive = this.archives.get(archiveId);
    if (!archive) {
      archive = this.index.getArchive(archiveId);
      this.archives.set(archiveId, archive);
    }
    return archive.getFile(fileId)?.getDataAsBuffer();
  }
  getCount() {
    return this.count;
  }
  clearCache() {
    super.clearCache();
    this.archives.clear();
  }
};
var DatTypeLoader = class _DatTypeLoader {
  constructor(types) {
    this.types = types;
  }
  static load(typeConstructor, cacheInfo, configArchive, name) {
    const file = configArchive.getFileNamed(name + ".dat");
    if (!file) {
      throw new Error(name + ".dat not found");
    }
    const buffer = file.getDataAsBuffer();
    const count = buffer.readUnsignedShort();
    const types = new Array(count);
    for (let i = 0; i < count; i++) {
      const type = types[i] = new typeConstructor(i, cacheInfo);
      type.decode(buffer);
      type.post();
    }
    return new _DatTypeLoader(types);
  }
  load(id) {
    return this.types[id];
  }
  getCount() {
    return this.types.length;
  }
  clearCache() {
  }
};
var IndexedDatTypeLoader = class _IndexedDatTypeLoader extends BaseTypeLoader {
  constructor(typeConstructor, cacheInfo, count, dataBuffer, dataOffsets) {
    super(typeConstructor, cacheInfo);
    this.count = count;
    this.dataBuffer = dataBuffer;
    this.dataOffsets = dataOffsets;
  }
  static load(typeConstructor, cacheInfo, configArchive, name) {
    const dataFile = configArchive.getFileNamed(name + ".dat");
    const indexFile = configArchive.getFileNamed(name + ".idx");
    if (!dataFile) {
      throw new Error(name + ".dat not found");
    }
    if (!indexFile) {
      throw new Error(name + ".idx not found");
    }
    const indexBuffer = indexFile.getDataAsBuffer();
    const count = indexBuffer.readUnsignedShort();
    const dataOffsets = new Int32Array(count);
    let offset = indexBuffer.offset;
    for (let i = 0; i < count; i++) {
      dataOffsets[i] = offset;
      offset += indexBuffer.readUnsignedShort();
    }
    return new _IndexedDatTypeLoader(
      typeConstructor,
      cacheInfo,
      count,
      dataFile.getDataAsBuffer(),
      dataOffsets
    );
  }
  getDataBuffer(id) {
    if (id < 0 || id >= this.count) {
      return void 0;
    }
    this.dataBuffer.offset = this.dataOffsets[id];
    return this.dataBuffer;
  }
  getCount() {
    return this.count;
  }
  clearCache() {
  }
};

// ../rs-party-dashboard/src/rs/config/Type.ts
var Type = class {
  static readParamsMap(buf, params) {
    const count = buf.readUnsignedByte();
    if (!params) {
      params = /* @__PURE__ */ new Map();
    }
    for (let i = 0; i < count; i++) {
      const isStringValue = buf.readUnsignedByte() === 1;
      const key = buf.readMedium();
      if (isStringValue) {
        params.set(key, buf.readString());
      } else {
        params.set(key, buf.readInt());
      }
    }
    return params;
  }
  constructor(id, cacheInfo) {
    this.id = id;
    this.cacheInfo = cacheInfo;
    this.cacheType = detectCacheType(cacheInfo);
  }
  readString(buffer) {
    const stopValue = this.cacheType !== "dat2" ? 10 : 0;
    return buffer.readString(stopValue);
  }
  decode(buffer) {
    while (true) {
      if (buffer.offset > buffer.length - 1) {
        throw new Error("Buffer overflow");
      }
      const opcode = buffer.readUnsignedByte();
      if (opcode === 0) {
        break;
      }
      this.decodeOpcode(opcode, buffer);
    }
  }
  post() {
  }
};

// ../rs-party-dashboard/src/rs/config/bastype/BasType.ts
var BasType = class extends Type {
  constructor() {
    super(...arguments);
    this.idleSeqId = -1;
    this.walkSeqId = -1;
    this.crawlSeqId = -1;
    this.crawlBackSeqId = -1;
    this.crawlLeftSeqId = -1;
    this.crawlRightSeqId = -1;
    this.runSeqId = -1;
    this.runBackSeqId = -1;
    this.runLeftSeqId = -1;
    this.runRightSeqId = -1;
    this.idleLeftSeqId = -1;
    this.idleRightSeqId = -1;
    this.walkBackSeqId = -1;
    this.walkLeftSeqId = -1;
    this.walkRightSeqId = -1;
    this.op43SeqId = -1;
    this.op44SeqId = -1;
    this.op45SeqId = -1;
    this.op46SeqId = -1;
    this.op47SeqId = -1;
    this.op48SeqId = -1;
    this.op49SeqId = -1;
    this.op50SeqId = -1;
    this.op51SeqId = -1;
  }
  decodeOpcode(opcode, buffer) {
    if (opcode === 1) {
      this.idleSeqId = buffer.readUnsignedShort();
      this.walkSeqId = buffer.readUnsignedShort();
      if (this.idleSeqId === 65535) {
        this.idleSeqId = -1;
      }
      if (this.walkSeqId === 65535) {
        this.walkSeqId = -1;
      }
    } else if (opcode === 2) {
      this.crawlSeqId = buffer.readUnsignedShort();
    } else if (opcode === 3) {
      this.crawlBackSeqId = buffer.readUnsignedShort();
    } else if (opcode === 4) {
      this.crawlLeftSeqId = buffer.readUnsignedShort();
    } else if (opcode === 5) {
      this.crawlRightSeqId = buffer.readUnsignedShort();
    } else if (opcode === 6) {
      this.runSeqId = buffer.readUnsignedShort();
    } else if (opcode === 7) {
      this.runBackSeqId = buffer.readUnsignedShort();
    } else if (opcode === 8) {
      this.runLeftSeqId = buffer.readUnsignedShort();
    } else if (opcode === 9) {
      this.runRightSeqId = buffer.readUnsignedShort();
    } else if (opcode === 26) {
      const anInt1059 = buffer.readUnsignedByte() * 4;
      const anInt1050 = buffer.readUnsignedByte() * 4;
    } else if (opcode === 27) {
      if (!this.modelRotateTranslate) {
        this.modelRotateTranslate = new Array(12);
      }
      const bodyPartId = buffer.readUnsignedByte();
      this.modelRotateTranslate[bodyPartId] = new Array(6);
      for (let type = 0; type < 6; type++) {
        this.modelRotateTranslate[bodyPartId][type] = buffer.readShort();
      }
    } else if (opcode === 29) {
      const yawAcceleration = buffer.readUnsignedByte();
    } else if (opcode === 30) {
      const yawMaxSpeed = buffer.readUnsignedShort();
    } else if (opcode === 31) {
      const rollAcceleration = buffer.readUnsignedByte();
    } else if (opcode === 32) {
      const rollMaxSpeed = buffer.readUnsignedShort();
    } else if (opcode === 33) {
      const rollTargetAngle = buffer.readShort();
    } else if (opcode === 34) {
      const pitchAcceleration = buffer.readUnsignedByte();
    } else if (opcode === 35) {
      const pitchMaxSpeed = buffer.readUnsignedShort();
    } else if (opcode === 36) {
      const pitchTargetAngle = buffer.readShort();
    } else if (opcode === 37) {
      const movementAcceleration = buffer.readUnsignedByte();
    } else if (opcode === 38) {
      this.idleLeftSeqId = buffer.readUnsignedShort();
    } else if (opcode === 39) {
      this.idleRightSeqId = buffer.readUnsignedShort();
    } else if (opcode === 40) {
      this.walkBackSeqId = buffer.readUnsignedShort();
    } else if (opcode === 41) {
      this.walkLeftSeqId = buffer.readUnsignedShort();
    } else if (opcode === 42) {
      this.walkRightSeqId = buffer.readUnsignedShort();
    } else if (opcode === 43) {
      this.op43SeqId = buffer.readUnsignedShort();
    } else if (opcode === 44) {
      this.op44SeqId = buffer.readUnsignedShort();
    } else if (opcode === 45) {
      this.op45SeqId = buffer.readUnsignedShort();
    } else if (opcode === 46) {
      this.op46SeqId = buffer.readUnsignedShort();
    } else if (opcode === 47) {
      this.op47SeqId = buffer.readUnsignedShort();
    } else if (opcode === 48) {
      this.op48SeqId = buffer.readUnsignedShort();
    } else if (opcode === 49) {
      this.op49SeqId = buffer.readUnsignedShort();
    } else if (opcode === 50) {
      this.op50SeqId = buffer.readUnsignedShort();
    } else if (opcode === 51) {
      this.op51SeqId = buffer.readUnsignedShort();
    } else if (opcode === 52) {
      const count = buffer.readUnsignedByte();
      for (let i = 0; i < count; i++) {
        buffer.readUnsignedShort();
        buffer.readUnsignedByte();
      }
    } else if (opcode === 53) {
      const bool = false;
    } else if (opcode === 54) {
      const v0 = buffer.readUnsignedByte() << 6;
      const v1 = buffer.readUnsignedByte() << 6;
    } else if (opcode === 55) {
      const bodyPartId = buffer.readUnsignedByte();
      buffer.readUnsignedShort();
    } else if (opcode === 54) {
      const bodyPartId = buffer.readUnsignedByte();
      for (let i = 0; i < 3; i++) {
        buffer.readShort();
      }
    } else {
      throw new Error("BasType: Unknown opcode: " + opcode);
    }
  }
};

// ../rs-party-dashboard/src/rs/config/bastype/BasTypeLoader.ts
var DummyBasTypeLoader = class extends DummyTypeLoader {
  constructor(cacheInfo) {
    super(cacheInfo, BasType);
  }
};
var ArchiveBasTypeLoader = class extends ArchiveTypeLoader {
  constructor(cacheInfo, archive) {
    super(BasType, cacheInfo, archive);
  }
};

// ../rs-party-dashboard/src/rs/config/defaults/GraphicsDefaults.ts
var GraphicsDefaults = class _GraphicsDefaults extends Type {
  constructor() {
    super(...arguments);
    this.compass = -1;
    this.mapEdge = -1;
    this.mapScenes = -1;
    this.mapFunctions = -1;
    this.headIconsPk = -1;
    this.headIconsPrayer = -1;
    this.headIconsHint = -1;
    this.mapMarkers = -1;
    this.crosses = -1;
    this.mapDots = -1;
    this.scrollBars = -1;
    this.modIcons = -1;
  }
  static load(cacheInfo, fileSystem) {
    if (cacheInfo.game === "oldschool" && fileSystem.indexExists(IndexType.OSRS.graphicDefaults)) {
      const defaultsIndex = fileSystem.getIndex(IndexType.OSRS.graphicDefaults);
      const defaultsFile = defaultsIndex.getFile(3 /* GRAPHICS */, 0);
      if (!defaultsFile) {
        throw new Error("GraphicsDefaults: File not found");
      }
      const defaults = new _GraphicsDefaults(defaultsFile.archiveId, cacheInfo);
      defaults.decode(new ByteBuffer(defaultsFile.data));
      return defaults;
    } else if (cacheInfo.game === "runescape" && fileSystem.indexExists(IndexType.RS2.defaults)) {
      const defaults = new _GraphicsDefaults(-1, cacheInfo);
      return defaults;
    } else {
      const spriteIndex = fileSystem.getIndex(IndexType.DAT2.sprites);
      const defaults = new _GraphicsDefaults(-1, cacheInfo);
      defaults.compass = spriteIndex.getArchiveId("compass");
      defaults.mapEdge = spriteIndex.getArchiveId("mapedge");
      defaults.mapScenes = spriteIndex.getArchiveId("mapscene");
      defaults.mapFunctions = spriteIndex.getArchiveId("mapfunction");
      defaults.headIconsPk = spriteIndex.getArchiveId("headicons_pk");
      defaults.headIconsPrayer = spriteIndex.getArchiveId("headicons_prayer");
      defaults.headIconsHint = spriteIndex.getArchiveId("headicons_hint");
      defaults.mapMarkers = spriteIndex.getArchiveId("mapmarker");
      defaults.crosses = spriteIndex.getArchiveId("cross");
      defaults.mapDots = spriteIndex.getArchiveId("mapdots");
      defaults.scrollBars = spriteIndex.getArchiveId("scrollbar");
      defaults.modIcons = spriteIndex.getArchiveId("mod_icons");
      return defaults;
    }
  }
  decodeOpcode(opcode, buffer) {
    switch (opcode) {
      case 1:
        buffer.readMedium();
        break;
      case 2:
        this.compass = buffer.readBigSmart();
        this.mapEdge = buffer.readBigSmart();
        this.mapScenes = buffer.readBigSmart();
        this.headIconsPk = buffer.readBigSmart();
        this.headIconsPrayer = buffer.readBigSmart();
        this.headIconsHint = buffer.readBigSmart();
        this.mapMarkers = buffer.readBigSmart();
        this.crosses = buffer.readBigSmart();
        this.mapDots = buffer.readBigSmart();
        this.scrollBars = buffer.readBigSmart();
        this.modIcons = buffer.readBigSmart();
        break;
    }
  }
};

// ../rs-party-dashboard/src/rs/config/floortype/OverlayFloorType.ts
var OverlayFloorType = class extends Type {
  constructor(id, cacheInfo) {
    super(id, cacheInfo);
    this.primaryRgb = 0;
    this.textureId = -1;
    this.secondaryTextureId = -1;
    this.hideUnderlay = true;
    this.secondaryRgb = -1;
    this.hue = 0;
    this.saturation = 0;
    this.lightness = 0;
    this.hueBlend = 0;
    this.hueMultiplier = 0;
    this.secondaryHue = 0;
    this.secondarySaturation = 0;
    this.secondaryLightness = 0;
    this.textureSize = 128;
    this.blockShadow = true;
    this.textureBrightness = 8;
    this.blendTexture = false;
    this.underwaterColor = 1190717;
    this.waterOpacity = 16;
    this.isOverlay = cacheInfo.game !== "runescape" || cacheInfo.revision > 377;
  }
  getHueBlend() {
    return this.hueBlend;
  }
  getHueMultiplier() {
    return this.hueMultiplier;
  }
  decodeOpcode(opcode, buffer) {
    if (opcode === 1) {
      this.primaryRgb = buffer.readMedium();
    } else if (opcode === 2) {
      this.textureId = buffer.readUnsignedByte();
    } else if (opcode === 3) {
      if (this.cacheInfo.game === "runescape" && this.cacheInfo.revision <= 377) {
        this.isOverlay = true;
      } else {
        this.textureId = buffer.readUnsignedShort();
        if (this.textureId === 65535) {
          this.textureId = -1;
        }
      }
    } else if (opcode === 5) {
      this.hideUnderlay = false;
    } else if (opcode === 6) {
      this.name = this.readString(buffer);
    } else if (opcode === 7) {
      this.secondaryRgb = buffer.readMedium();
    } else if (opcode === 8) {
    } else if (opcode === 9) {
      this.textureSize = buffer.readUnsignedShort();
    } else if (opcode === 10) {
      this.blockShadow = false;
    } else if (opcode === 11) {
      this.textureBrightness = buffer.readUnsignedByte();
    } else if (opcode === 12) {
      this.blendTexture = true;
    } else if (opcode === 13) {
      this.underwaterColor = buffer.readMedium();
    } else if (opcode === 14) {
      this.waterOpacity = buffer.readUnsignedByte();
    } else if (opcode === 15) {
      this.secondaryTextureId = buffer.readUnsignedShort();
      if (this.secondaryTextureId === 65535) {
        this.secondaryTextureId = -1;
      }
    } else if (opcode === 16) {
      const v = buffer.readUnsignedByte();
    } else {
      throw new Error(
        "OverlayFloorType: Opcode " + opcode + " not implemented. id: " + this.id
      );
    }
  }
  post() {
    if (this.secondaryRgb !== -1) {
      this.setHsl(this.secondaryRgb);
      this.secondaryHue = this.hue;
      this.secondarySaturation = this.saturation;
      this.secondaryLightness = this.lightness;
    }
    this.setHsl(this.primaryRgb);
  }
  setHsl(rgb) {
    const r = (rgb >> 16 & 255) / 256;
    const g = (rgb >> 8 & 255) / 256;
    const b = (rgb & 255) / 256;
    let minRgb = r;
    if (g < r) {
      minRgb = g;
    }
    if (b < minRgb) {
      minRgb = b;
    }
    let maxRgb = r;
    if (g > r) {
      maxRgb = g;
    }
    if (b > maxRgb) {
      maxRgb = b;
    }
    let hue = 0;
    let sat = 0;
    const light = (minRgb + maxRgb) / 2;
    if (minRgb !== maxRgb) {
      if (light < 0.5) {
        sat = (maxRgb - minRgb) / (minRgb + maxRgb);
      }
      if (light >= 0.5) {
        sat = (maxRgb - minRgb) / (2 - maxRgb - minRgb);
      }
      if (maxRgb === r) {
        hue = (g - b) / (maxRgb - minRgb);
      } else if (maxRgb === g) {
        hue = 2 + (b - r) / (maxRgb - minRgb);
      } else if (maxRgb === b) {
        hue = 4 + (r - g) / (maxRgb - minRgb);
      }
    }
    hue /= 6;
    this.hue = hue * 256 | 0;
    this.saturation = sat * 256 | 0;
    this.lightness = light * 256 | 0;
    if (this.saturation < 0) {
      this.saturation = 0;
    } else if (this.saturation > 255) {
      this.saturation = 255;
    }
    if (this.lightness < 0) {
      this.lightness = 0;
    } else if (this.lightness > 255) {
      this.lightness = 255;
    }
    if (light > 0.5) {
      this.hueMultiplier = 512 * (sat * (1 - light)) | 0;
    } else {
      this.hueMultiplier = 512 * (sat * light) | 0;
    }
    if (this.hueMultiplier < 1) {
      this.hueMultiplier = 1;
    }
    this.hueBlend = this.hueMultiplier * hue | 0;
  }
};

// ../rs-party-dashboard/src/rs/config/floortype/UnderlayFloorType.ts
var UnderlayFloorType = class extends Type {
  constructor(id, cacheInfo) {
    super(id, cacheInfo);
    this.rgbColor = 0;
    this.hue = 0;
    this.saturation = 0;
    this.lightness = 0;
    this.hueMultiplier = 0;
    this.isOverlay = false;
    this.textureId = -1;
    this.textureSize = 128;
    this.blockShadow = true;
  }
  getHueBlend() {
    return this.hue;
  }
  getHueMultiplier() {
    return this.hueMultiplier;
  }
  decodeOpcode(opcode, buffer) {
    if (opcode === 1) {
      this.rgbColor = buffer.readMedium();
    } else if (opcode === 2) {
      this.textureId = buffer.readUnsignedShort();
      if (this.textureId === 65535) {
        this.textureId = -1;
      }
    } else if (opcode === 3) {
      this.textureSize = buffer.readUnsignedShort();
    } else if (opcode === 4) {
      this.blockShadow = false;
    } else if (opcode === 5) {
    } else {
      throw new Error(
        "UnderlayFloorType: Opcode " + opcode + " not implemented. id: " + this.id
      );
    }
  }
  post() {
    this.setHsl(this.rgbColor);
  }
  setHsl(rgb) {
    const r = (rgb >> 16 & 255) / 256;
    const g = (rgb >> 8 & 255) / 256;
    const b = (rgb & 255) / 256;
    let minRgb = r;
    if (g < minRgb) {
      minRgb = g;
    }
    if (b < minRgb) {
      minRgb = b;
    }
    let maxRgb = r;
    if (g > maxRgb) {
      maxRgb = g;
    }
    if (b > maxRgb) {
      maxRgb = b;
    }
    let hue = 0;
    let sat = 0;
    const light = (maxRgb + minRgb) / 2;
    if (maxRgb !== minRgb) {
      if (light < 0.5) {
        sat = (maxRgb - minRgb) / (maxRgb + minRgb);
      }
      if (light >= 0.5) {
        sat = (maxRgb - minRgb) / (2 - maxRgb - minRgb);
      }
      if (maxRgb === r) {
        hue = (g - b) / (maxRgb - minRgb);
      } else if (maxRgb === g) {
        hue = 2 + (b - r) / (maxRgb - minRgb);
      } else if (maxRgb === b) {
        hue = 4 + (r - g) / (maxRgb - minRgb);
      }
    }
    hue /= 6;
    this.saturation = sat * 256 | 0;
    this.lightness = light * 256 | 0;
    if (this.saturation < 0) {
      this.saturation = 0;
    } else if (this.saturation > 255) {
      this.saturation = 255;
    }
    if (this.lightness < 0) {
      this.lightness = 0;
    } else if (this.lightness > 255) {
      this.lightness = 255;
    }
    if (light > 0.5) {
      this.hueMultiplier = 512 * (sat * (1 - light)) | 0;
    } else {
      this.hueMultiplier = 512 * (sat * light) | 0;
    }
    if (this.hueMultiplier < 1) {
      this.hueMultiplier = 1;
    }
    this.hue = this.hueMultiplier * hue | 0;
  }
};

// ../rs-party-dashboard/src/rs/config/floortype/FloorTypeLoader.ts
var ArchiveUnderlayFloorTypeLoader = class extends ArchiveTypeLoader {
  constructor(cacheInfo, archive) {
    super(UnderlayFloorType, cacheInfo, archive);
  }
};
var ArchiveOverlayFloorTypeLoader = class extends ArchiveTypeLoader {
  constructor(cacheInfo, archive) {
    super(OverlayFloorType, cacheInfo, archive);
  }
};
var DatFloorTypeLoader = class {
  static load(cacheInfo, configArchive) {
    return DatTypeLoader.load(OverlayFloorType, cacheInfo, configArchive, "flo");
  }
};

// ../rs-party-dashboard/src/util/MathUtil.ts
var clamp = (num, min, max) => Math.min(Math.max(num, min), max);
function isPowerOfTwo(n) {
  return n === (-n & n);
}
function nextPow2(i) {
  i = --i | i >>> 1;
  i |= i >>> 2;
  i |= i >>> 4;
  i |= i >>> 8;
  i |= i >>> 16;
  return i + 1;
}
function toSigned16bit(n) {
  return n << 16 >> 16;
}
function nextIntJagex(random, bound) {
  if (bound <= 0) {
    throw new Error("bound must be positive");
  }
  if (isPowerOfTwo(bound)) {
    return Number(BigInt(bound) * (BigInt(random.nextInt()) & 0xffffffffn) >> 32n);
  }
  const maxValue = -2147483648 - (4294967296 % bound | 0) | 0;
  let rndValue;
  do {
    rndValue = random.nextInt();
  } while (rndValue >= maxValue);
  return boundJagex(rndValue, bound);
}
function boundJagex(value, bound) {
  const i_78_ = value >> 31 & bound - 1;
  return i_78_ + (value + (value >>> 31)) % bound;
}

// ../rs-party-dashboard/src/rs/config/loctype/LocType.ts
var LocType = class _LocType extends Type {
  static {
    this.DEFAULT_DECOR_DISPLACEMENT = 16;
  }
  constructor(id, cacheInfo) {
    super(id, cacheInfo);
    this.lowDetail = false;
    this.name = "null";
    this.sizeX = 1;
    this.sizeY = 1;
    this.clipType = 2;
    this.blocksProjectile = true;
    this.isInteractive = -1;
    this.contouredGround = -1;
    this.mergeNormals = false;
    this.modelClipped = false;
    this.seqId = -1;
    this.decorDisplacement = _LocType.DEFAULT_DECOR_DISPLACEMENT;
    this.ambient = 0;
    this.contrast = 0;
    this.actions = new Array(5);
    this.mapFunctionId = -1;
    this.mapSceneId = -1;
    this.flipMapSceneSprite = false;
    this.isRotated = false;
    this.clipped = true;
    this.modelSizeX = 128;
    this.modelSizeHeight = 128;
    this.modelSizeY = 128;
    this.offsetX = 0;
    this.offsetHeight = 0;
    this.offsetY = 0;
    this.obstructsGround = false;
    this.isHollow = false;
    this.supportItems = -1;
    this.transformVarbit = -1;
    this.transformVarp = -1;
    this.ambientSoundId = -1;
    this.ambientSoundDistance = 0;
    this.ambientSoundChangeTicksMin = 0;
    this.ambientSoundChangeTicksMax = 0;
    this.ambientSoundRetain = 0;
    this.seqRandomStart = true;
    this.contourGroundType = 0;
    this.contourGroundParam = -1;
  }
  skipNewModels(buffer) {
    const count = buffer.readUnsignedByte();
    for (let i = 0; i < count; i++) {
      buffer.readByte();
      const modelCount = buffer.readUnsignedByte();
      if (this.isLargeModelId()) {
        for (let j = 0; j < modelCount; j++) {
          buffer.readBigSmart();
        }
      } else {
        for (let j = 0; j < modelCount; j++) {
          buffer.readUnsignedShort();
        }
      }
    }
  }
  isNewModelsFormat() {
    return this.cacheInfo.game === "runescape" && this.cacheInfo.revision >= 582;
  }
  isLargeModelId() {
    return this.cacheInfo.game === "runescape" && this.cacheInfo.revision >= 670;
  }
  decodeOpcode(opcode, buffer) {
    if (this.isNewModelsFormat() && (opcode === 1 || opcode === 5)) {
      const someBool = false;
      if (opcode === 5 && someBool) {
        this.skipNewModels(buffer);
      }
      const count = buffer.readUnsignedByte();
      this.types = new Array(count);
      this.models = new Array(count);
      for (let i = 0; i < count; i++) {
        this.types[i] = buffer.readByte();
        const modelCount = buffer.readUnsignedByte();
        this.models[i] = new Array(modelCount);
        if (this.isLargeModelId()) {
          for (let j = 0; j < modelCount; j++) {
            this.models[i][j] = buffer.readBigSmart();
          }
        } else {
          for (let j = 0; j < modelCount; j++) {
            this.models[i][j] = buffer.readUnsignedShort();
          }
        }
      }
      if (opcode === 5 && !someBool) {
        this.skipNewModels(buffer);
      }
    } else if (opcode === 1) {
      const count = buffer.readUnsignedByte();
      if (count > 0) {
        if (this.models && !this.lowDetail) {
          buffer.offset += count * 3;
        } else {
          this.models = new Array(count);
          this.types = new Array(count);
          for (let i = 0; i < count; i++) {
            this.models[i] = new Array(1);
            this.models[i][0] = buffer.readUnsignedShort();
            this.types[i] = buffer.readUnsignedByte();
          }
        }
      }
    } else if (opcode === 2) {
      this.name = this.readString(buffer);
    } else if (opcode === 3) {
      this.desc = this.readString(buffer);
    } else if (opcode === 5) {
      const count = buffer.readUnsignedByte();
      if (count > 0) {
        if (this.models && !this.lowDetail) {
          buffer.offset += count * 2;
        } else {
          this.types = void 0;
          this.models = new Array(1);
          this.models[0] = new Array(count);
          for (let i = 0; i < count; i++) {
            this.models[0][i] = buffer.readUnsignedShort();
          }
        }
      }
    } else if (opcode === 14) {
      this.sizeX = buffer.readUnsignedByte();
    } else if (opcode === 15) {
      this.sizeY = buffer.readUnsignedByte();
    } else if (opcode === 17) {
      this.clipType = 0;
      this.blocksProjectile = false;
    } else if (opcode === 18) {
      this.blocksProjectile = false;
    } else if (opcode === 19) {
      this.isInteractive = buffer.readUnsignedByte();
    } else if (opcode === 21) {
      this.contouredGround = 0;
      this.contourGroundType = 1;
    } else if (opcode === 22) {
      this.mergeNormals = true;
    } else if (opcode === 23) {
      this.modelClipped = true;
    } else if (opcode === 24) {
      this.seqId = this.isLargeModelId() ? buffer.readBigSmart() : buffer.readUnsignedShort();
      if (this.seqId === 65535) {
        this.seqId = -1;
      }
    } else if (opcode === 25) {
    } else if (opcode === 27) {
      this.clipType = 1;
    } else if (opcode === 28) {
      this.decorDisplacement = buffer.readUnsignedByte();
    } else if (opcode === 29) {
      this.ambient = buffer.readByte();
    } else if (opcode === 39) {
      this.contrast = buffer.readByte() * 25;
    } else if (opcode >= 30 && opcode < 39) {
      this.actions[opcode - 30] = this.readString(buffer);
      if (this.actions[opcode - 30].toLowerCase() === "hidden") {
        delete this.actions[opcode - 30];
      }
    } else if (opcode === 40) {
      const count = buffer.readUnsignedByte();
      this.recolorFrom = new Array(count);
      this.recolorTo = new Array(count);
      for (let i = 0; i < count; i++) {
        this.recolorFrom[i] = buffer.readUnsignedShort();
        this.recolorTo[i] = buffer.readUnsignedShort();
      }
    } else if (opcode === 41) {
      const count = buffer.readUnsignedByte();
      this.retextureFrom = new Array(count);
      this.retextureTo = new Array(count);
      for (let i = 0; i < count; i++) {
        this.retextureFrom[i] = buffer.readUnsignedShort();
        this.retextureTo[i] = buffer.readUnsignedShort();
      }
    } else if (opcode === 44 || opcode === 45) {
      buffer.readUnsignedShort();
    } else if (opcode === 60) {
      this.mapFunctionId = buffer.readUnsignedShort();
    } else if (opcode === 61) {
      buffer.readUnsignedShort();
    } else if (opcode === 62) {
      this.isRotated = true;
    } else if (opcode === 64) {
      this.clipped = false;
    } else if (opcode === 65) {
      this.modelSizeX = buffer.readUnsignedShort();
    } else if (opcode === 66) {
      this.modelSizeHeight = buffer.readUnsignedShort();
    } else if (opcode === 67) {
      this.modelSizeY = buffer.readUnsignedShort();
    } else if (opcode === 68) {
      this.mapSceneId = buffer.readUnsignedShort();
    } else if (opcode === 69) {
      buffer.readUnsignedByte();
    } else if (opcode === 70) {
      this.offsetX = buffer.readShort();
    } else if (opcode === 71) {
      this.offsetHeight = buffer.readShort();
    } else if (opcode === 72) {
      this.offsetY = buffer.readShort();
    } else if (opcode === 73) {
      this.obstructsGround = true;
    } else if (opcode === 74) {
      this.isHollow = true;
    } else if (opcode === 75) {
      this.supportItems = buffer.readUnsignedByte();
    } else if (opcode === 77 || opcode === 92) {
      this.transformVarbit = buffer.readUnsignedShort();
      if (this.transformVarbit === 65535) {
        this.transformVarbit = -1;
      }
      this.transformVarp = buffer.readUnsignedShort();
      if (this.transformVarp === 65535) {
        this.transformVarp = -1;
      }
      let var3 = -1;
      if (opcode === 92) {
        var3 = this.isLargeModelId() ? buffer.readBigSmart() : buffer.readUnsignedShort();
        if (var3 === 65535) {
          var3 = -1;
        }
      }
      const count = buffer.readUnsignedByte();
      this.transforms = new Array(count + 2);
      for (let i = 0; i <= count; i++) {
        this.transforms[i] = this.isLargeModelId() ? buffer.readBigSmart() : buffer.readUnsignedShort();
        if (this.transforms[i] === 65535) {
          this.transforms[i] = -1;
        }
      }
      this.transforms[count + 1] = var3;
    } else if (opcode === 78) {
      this.ambientSoundId = buffer.readUnsignedShort();
      this.ambientSoundDistance = buffer.readUnsignedByte();
      if (this.cacheInfo.game === "oldschool" && this.cacheInfo.revision >= 220) {
        this.ambientSoundRetain = buffer.readUnsignedByte();
      }
    } else if (opcode === 79) {
      this.ambientSoundChangeTicksMin = buffer.readUnsignedShort();
      this.ambientSoundChangeTicksMax = buffer.readUnsignedShort();
      this.ambientSoundDistance = buffer.readUnsignedByte();
      if (this.cacheInfo.game === "oldschool" && this.cacheInfo.revision >= 220) {
        this.ambientSoundRetain = buffer.readUnsignedByte();
      }
      const count = buffer.readUnsignedByte();
      this.ambientSoundIds = new Array(count);
      for (let i = 0; i < count; i++) {
        this.ambientSoundIds[i] = buffer.readUnsignedShort();
      }
    } else if (opcode === 81) {
      this.contouredGround = buffer.readUnsignedByte() * 256;
      this.contourGroundType = 2;
      this.contourGroundParam = toSigned16bit(this.contouredGround);
    } else if (opcode === 82) {
      if (this.cacheInfo.game === "oldschool") {
        this.mapFunctionId = buffer.readUnsignedShort();
      } else {
      }
    } else if (opcode === 88) {
      const bool = true;
    } else if (opcode === 89) {
      this.seqRandomStart = false;
    } else if (opcode === 90) {
      const bool = true;
    } else if (opcode === 91) {
      const members = true;
    } else if (opcode === 93) {
      this.contourGroundType = 3;
      this.contourGroundParam = buffer.readShort();
    } else if (opcode === 94) {
      this.contourGroundType = 4;
    } else if (opcode === 95) {
      this.contourGroundType = 5;
      if (this.cacheInfo.game === "runescape" && this.cacheInfo.revision >= 614) {
        this.contourGroundParam = buffer.readUnsignedShort();
      }
    } else if (opcode === 96) {
      const aBoolean1878 = true;
    } else if (opcode === 97) {
      const adjustMapSceneRotation = true;
    } else if (opcode === 98) {
      const hasAnimation = true;
    } else if (opcode === 99) {
      const cursor1op = buffer.readUnsignedByte();
      const cursor1 = buffer.readUnsignedShort();
    } else if (opcode === 100) {
      const cursor2op = buffer.readUnsignedByte();
      const cursor2 = buffer.readUnsignedShort();
    } else if (opcode === 101) {
      const mapSceneRotationOff = buffer.readUnsignedByte();
    } else if (opcode === 102) {
      this.mapSceneId = buffer.readUnsignedShort();
    } else if (opcode === 103) {
      const occludeType = 0;
    } else if (opcode === 104) {
      const ambientSoundVolume = buffer.readUnsignedByte();
    } else if (opcode === 105) {
      const flipMapSceneSprite = true;
    } else if (opcode === 106) {
      let totalDelay = 0;
      const count = buffer.readUnsignedByte();
      this.randomSeqIds = new Array(count);
      this.randomSeqDelays = new Array(count);
      for (let i = 0; i < count; i++) {
        this.randomSeqIds[i] = this.isLargeModelId() ? buffer.readBigSmart() : buffer.readUnsignedShort();
        const delay = buffer.readUnsignedByte();
        this.randomSeqDelays[i] = delay;
        totalDelay += delay;
      }
    } else if (opcode === 107) {
      this.mapFunctionId = buffer.readUnsignedShort();
    } else if (opcode >= 150 && opcode < 155) {
      this.actions[opcode - 150] = this.readString(buffer);
      if (this.actions[opcode - 150].toLowerCase() === "hidden") {
        delete this.actions[opcode - 150];
      }
    } else if (opcode === 160) {
      const count = buffer.readUnsignedByte();
      const campaigns = new Array(count);
      for (let i = 0; i < count; i++) {
        campaigns[i] = buffer.readUnsignedShort();
      }
    } else if (opcode === 163) {
      const aByte2193 = buffer.readByte();
      const aByte2130 = buffer.readByte();
      const aByte2148 = buffer.readByte();
      const aByte2140 = buffer.readByte();
    } else if (opcode === 167) {
      const v = buffer.readUnsignedShort();
    } else if (opcode === 168) {
      const b = true;
    } else if (opcode === 169) {
      const b = true;
    } else if (opcode === 170) {
      const v = buffer.readUnsignedSmart();
    } else if (opcode === 171) {
      const v = buffer.readUnsignedSmart();
    } else if (opcode === 173) {
      const v0 = buffer.readUnsignedShort();
      const v1 = buffer.readUnsignedShort();
    } else if (opcode === 177) {
      const b = true;
    } else if (opcode === 178) {
      const v = buffer.readUnsignedByte();
    } else if (opcode === 189) {
      const bloom = true;
    } else if (opcode === 190) {
    } else if (opcode === 191) {
    } else if (opcode === 249) {
      this.params = Type.readParamsMap(buffer, this.params);
    } else {
      throw new Error("LocType: Opcode " + opcode + " not implemented. id: " + this.id);
    }
  }
  post() {
    if (this.isInteractive === -1) {
      this.isInteractive = 0;
      if (this.models && (!this.types || this.types[0] === 10)) {
        this.isInteractive = 1;
      }
      for (let i = 0; i < 5; i++) {
        if (this.actions[i]) {
          this.isInteractive = 1;
        }
      }
    }
    if (this.supportItems === -1) {
      this.supportItems = this.clipType !== 0 ? 1 : 0;
    }
  }
  transform(varManager, loader) {
    if (!this.transforms) {
      return void 0;
    }
    let transformIndex = -1;
    if (this.transformVarbit !== -1) {
      transformIndex = varManager.getVarbit(this.transformVarbit);
    } else if (this.transformVarp !== -1) {
      transformIndex = varManager.getVarp(this.transformVarp);
    }
    let transformId = -1;
    if (transformIndex >= 0 && transformIndex < this.transforms.length - 1 && this.transforms[transformIndex] !== -1) {
      transformId = this.transforms[transformIndex];
    } else {
      transformId = this.transforms[this.transforms.length - 1];
    }
    if (transformId === -1) {
      return void 0;
    }
    const transformed = loader.load(transformId);
    return transformed;
  }
};

// ../rs-party-dashboard/src/rs/config/loctype/LocTypeLoader.ts
var DatLocTypeLoader = class {
  static load(cacheInfo, configArchive) {
    return IndexedDatTypeLoader.load(LocType, cacheInfo, configArchive, "loc");
  }
};
var ArchiveLocTypeLoader = class extends ArchiveTypeLoader {
  constructor(cacheInfo, archive) {
    super(LocType, cacheInfo, archive);
  }
};
var IndexLocTypeLoader = class extends IndexTypeLoader {
  constructor(cacheInfo, index) {
    super(LocType, cacheInfo, index);
  }
};

// ../rs-party-dashboard/src/rs/config/mapscenetype/MapSceneType.ts
var MapSceneType = class extends Type {
  constructor() {
    super(...arguments);
    this.spriteId = -1;
    this.colorRgb = 0;
    this.enlarge = false;
  }
  decodeOpcode(opcode, buffer) {
    if (opcode === 1) {
      this.spriteId = buffer.readUnsignedShort();
    } else if (opcode === 2) {
      this.colorRgb = buffer.readMedium();
    } else if (opcode === 3) {
      this.enlarge = true;
    } else if (opcode === 4) {
      this.spriteId = -1;
    }
  }
};

// ../rs-party-dashboard/src/rs/config/mapscenetype/MapSceneTypeLoader.ts
var MapSceneTypeLoader = class extends ArchiveTypeLoader {
  constructor(cacheInfo, archive) {
    super(MapSceneType, cacheInfo, archive);
  }
};

// ../rs-party-dashboard/src/rs/config/meltype/MapElementType.ts
var MapElementType = class extends Type {
  constructor() {
    super(...arguments);
    this.spriteId = -1;
    this.hoverSpriteId = -1;
    this.textColor = 0;
    this.hoverTextColor = 0;
    this.textSize = 0;
    this.worldMapVisible = true;
    this.minimapVisible = false;
    this.randomizePosition = true;
    this.ops = new Array(5);
  }
  decodeOpcode(opcode, buffer) {
    if (opcode === 1) {
      this.spriteId = buffer.readBigSmart();
    } else if (opcode === 2) {
      this.hoverSpriteId = buffer.readBigSmart();
    } else if (opcode === 3) {
      this.name = buffer.readString();
    } else if (opcode === 4) {
      this.textColor = buffer.readMedium();
    } else if (opcode === 5) {
      this.hoverTextColor = buffer.readMedium();
    } else if (opcode === 6) {
      this.textSize = buffer.readUnsignedByte();
    } else if (opcode === 7) {
      const flags = buffer.readUnsignedByte();
      if ((flags & 1) === 0) {
        this.worldMapVisible = false;
      }
      if ((flags & 2) === 2) {
        this.minimapVisible = true;
      }
    } else if (opcode === 8) {
      this.randomizePosition = buffer.readUnsignedByte() === 1;
    } else if (opcode === 9) {
      let primaryVisibleVarbit = buffer.readUnsignedShort();
      if (primaryVisibleVarbit == 65535) {
        primaryVisibleVarbit = -1;
      }
      let primaryVisibleVarp = buffer.readUnsignedShort();
      if (primaryVisibleVarp == 65535) {
        primaryVisibleVarp = -1;
      }
      const primaryMinValue = buffer.readInt();
      const primaryMaxValue = buffer.readInt();
    } else if (opcode >= 10 && opcode <= 14) {
      this.ops[opcode - 10] = buffer.readString();
    } else if (opcode === 15) {
      if (this.cacheInfo.game === "oldschool" || this.cacheInfo.game === "runescape" && this.cacheInfo.revision >= 629) {
        const count = buffer.readUnsignedByte();
        for (let i = 0; i < count * 2; i++) {
          buffer.readShort();
        }
        buffer.readInt();
        const count2 = buffer.readUnsignedByte();
        for (let i = 0; i < count2; i++) {
          buffer.readInt();
        }
        for (let i = 0; i < count; i++) {
          buffer.readByte();
        }
      } else {
        const count = buffer.readUnsignedByte();
        for (let i = 0; i < count * 2; i++) {
          buffer.readShort();
        }
        buffer.readInt();
        buffer.readInt();
      }
    } else if (opcode === 16) {
      const bool = false;
    } else if (opcode === 17) {
      const opBase = buffer.readString();
    } else if (opcode === 18) {
      buffer.readBigSmart();
    } else if (opcode === 19) {
      const group = buffer.readUnsignedShort();
    } else if (opcode === 20) {
      let secondaryVisibleVarbit = buffer.readUnsignedShort();
      if (secondaryVisibleVarbit == 65535) {
        secondaryVisibleVarbit = -1;
      }
      let secondaryVisibleVarp = buffer.readUnsignedShort();
      if (secondaryVisibleVarp == 65535) {
        secondaryVisibleVarp = -1;
      }
      const secondaryMinValue = buffer.readInt();
      const secondaryMaxValue = buffer.readInt();
    } else if (opcode === 21) {
      buffer.readInt();
    } else if (opcode === 22) {
      buffer.readInt();
    } else if (opcode === 23) {
      buffer.readUnsignedByte();
      buffer.readUnsignedByte();
      buffer.readUnsignedByte();
    } else if (opcode === 24) {
      buffer.readShort();
      buffer.readShort();
    } else if (opcode === 25) {
      buffer.readBigSmart();
    } else if (opcode === 28) {
      buffer.readUnsignedByte();
    } else if (opcode === 29) {
      const hAlign = buffer.readUnsignedByte();
    } else if (opcode === 30) {
      const vAlign = buffer.readUnsignedByte();
    } else if (opcode === 249) {
      const params = Type.readParamsMap(buffer);
    } else {
      throw new Error("MapElementType: Unrecognized opcode: " + opcode);
    }
  }
};

// ../rs-party-dashboard/src/rs/config/meltype/MapElementTypeLoader.ts
var ArchiveMapElementTypeLoader = class extends ArchiveTypeLoader {
  constructor(cacheInfo, archive) {
    super(MapElementType, cacheInfo, archive);
  }
};

// ../rs-party-dashboard/src/rs/config/npctype/NpcType.ts
var NpcType = class extends Type {
  constructor(id, cacheInfo) {
    super(id, cacheInfo);
    this.name = "null";
    this.size = 1;
    this.idleSeqId = -1;
    this.turnLeftSeqId = -1;
    this.turnRightSeqId = -1;
    this.walkSeqId = -1;
    this.walkBackSeqId = -1;
    this.walkLeftSeqId = -1;
    this.walkRightSeqId = -1;
    this.actions = new Array(5);
    this.drawMapDot = true;
    this.combatLevel = -1;
    this.widthScale = 128;
    this.heightScale = 128;
    this.isVisible = false;
    this.ambient = 0;
    this.contrast = 0;
    this.headIconPrayer = -1;
    this.rotationSpeed = 32;
    this.transformVarbit = -1;
    this.transformVarp = -1;
    this.isInteractable = true;
    this.isClickable = true;
    this.isFollower = false;
    this.runSeqId = -1;
    this.runBackSeqId = -1;
    this.runLeftSeqId = -1;
    this.runRightSeqId = -1;
    this.crawlSeqId = -1;
    this.crawlBackSeqId = -1;
    this.crawlLeftSeqId = -1;
    this.crawlRightSeqId = -1;
    this.category = -1;
    this.loginScreenProps = 0;
    this.spawnDirection = 6;
    this.basTypeId = -1;
  }
  isLargeModelId() {
    return this.cacheInfo.game === "runescape" && this.cacheInfo.revision >= 670;
  }
  decodeOpcode(opcode, buffer) {
    if (opcode === 1) {
      const count = buffer.readUnsignedByte();
      this.modelIds = new Array(count);
      if (this.isLargeModelId()) {
        for (let i = 0; i < count; i++) {
          this.modelIds[i] = buffer.readBigSmart();
        }
      } else {
        for (let i = 0; i < count; i++) {
          this.modelIds[i] = buffer.readUnsignedShort();
        }
      }
    } else if (opcode === 2) {
      this.name = this.readString(buffer);
    } else if (opcode === 3) {
      this.readString(buffer);
    } else if (opcode === 12) {
      this.size = buffer.readUnsignedByte();
    } else if (opcode === 13) {
      this.idleSeqId = buffer.readUnsignedShort();
    } else if (opcode === 14) {
      this.walkSeqId = buffer.readUnsignedShort();
    } else if (opcode === 15) {
      this.turnLeftSeqId = buffer.readUnsignedShort();
    } else if (opcode === 16) {
      if (this.cacheInfo.game === "runescape" && this.cacheInfo.revision < 254) {
      } else {
        this.turnRightSeqId = buffer.readUnsignedShort();
      }
    } else if (opcode === 17) {
      this.walkSeqId = buffer.readUnsignedShort();
      this.walkBackSeqId = buffer.readUnsignedShort();
      this.walkLeftSeqId = buffer.readUnsignedShort();
      this.walkRightSeqId = buffer.readUnsignedShort();
    } else if (opcode === 18) {
      this.category = buffer.readUnsignedShort();
    } else if (opcode >= 30 && opcode < 35) {
      this.actions[opcode - 30] = this.readString(buffer);
      if (this.actions[opcode - 30].toLowerCase() === "hidden") {
        delete this.actions[opcode - 30];
      }
    } else if (opcode === 40) {
      const count = buffer.readUnsignedByte();
      this.recolorFrom = new Array(count);
      this.recolorTo = new Array(count);
      for (let i = 0; i < count; i++) {
        this.recolorFrom[i] = buffer.readUnsignedShort();
        this.recolorTo[i] = buffer.readUnsignedShort();
      }
    } else if (opcode === 41) {
      const count = buffer.readUnsignedByte();
      this.retextureFrom = new Array(count);
      this.retextureTo = new Array(count);
      for (let i = 0; i < count; i++) {
        this.retextureFrom[i] = buffer.readUnsignedShort();
        this.retextureTo[i] = buffer.readUnsignedShort();
      }
    } else if (opcode === 44 || opcode === 45) {
      buffer.readUnsignedShort();
    } else if (opcode === 60) {
      const count = buffer.readUnsignedByte();
      this.chatheadModelIds = new Array(count);
      if (this.isLargeModelId()) {
        for (let i = 0; i < count; i++) {
          this.chatheadModelIds[i] = buffer.readBigSmart();
        }
      } else {
        for (let i = 0; i < count; i++) {
          this.chatheadModelIds[i] = buffer.readUnsignedShort();
        }
      }
    } else if (opcode >= 74 && opcode <= 79) {
      buffer.readUnsignedShort();
    } else if (opcode === 93) {
      this.drawMapDot = false;
    } else if (opcode === 95) {
      this.combatLevel = buffer.readUnsignedShort();
    } else if (opcode === 97) {
      this.widthScale = buffer.readUnsignedShort();
    } else if (opcode === 98) {
      this.heightScale = buffer.readUnsignedShort();
    } else if (opcode === 99) {
      this.isVisible = true;
    } else if (opcode === 100) {
      this.ambient = buffer.readByte();
    } else if (opcode === 101) {
      this.contrast = buffer.readByte() * 5;
    } else if (opcode === 102) {
      if (this.cacheInfo.game === "oldschool" && this.cacheInfo.revision < 210 || this.cacheInfo.game === "runescape") {
        this.headIconPrayer = buffer.readUnsignedShort();
      } else {
        const flag = buffer.readUnsignedByte();
        let count = 0;
        for (let n = flag; n !== 0; n >>= 1) {
          count++;
        }
        this.headIconSpriteIds = new Array(count);
        this.headIconSpriteIndices = new Array(count);
        for (let i = 0; i < count; i++) {
          if ((flag & 1) << i === 0) {
            this.headIconSpriteIds[i] = -1;
            this.headIconSpriteIndices[i] = -1;
          } else {
            this.headIconSpriteIds[i] = buffer.readBigSmart();
            this.headIconSpriteIndices[i] = buffer.readUnsignedSmartMin1();
          }
        }
      }
    } else if (opcode === 103) {
      this.rotationSpeed = buffer.readUnsignedShort();
    } else if (opcode === 106 || opcode === 118) {
      this.transformVarbit = buffer.readUnsignedShort();
      if (this.transformVarbit === 65535) {
        this.transformVarbit = -1;
      }
      this.transformVarp = buffer.readUnsignedShort();
      if (this.transformVarp === 65535) {
        this.transformVarp = -1;
      }
      let var3 = -1;
      if (opcode === 118) {
        var3 = buffer.readUnsignedShort();
        if (var3 === 65535) {
          var3 = -1;
        }
      }
      const count = buffer.readUnsignedByte();
      this.transforms = new Array(count + 2);
      for (let i = 0; i <= count; i++) {
        this.transforms[i] = buffer.readUnsignedShort();
        if (this.transforms[i] === 65535) {
          this.transforms[i] = -1;
        }
      }
      this.transforms[count + 1] = var3;
    } else if (opcode === 107) {
      this.isInteractable = false;
    } else if (opcode === 109) {
      this.isClickable = false;
    } else if (opcode === 111) {
      if (this.cacheInfo.game === "oldschool") {
        this.isFollower = true;
      } else {
      }
    } else if (opcode === 112) {
    } else if (opcode === 113) {
      const shadowColor1 = buffer.readUnsignedShort();
      const shadowColor2 = buffer.readUnsignedShort();
    } else if (opcode === 114) {
      if (this.cacheInfo.game === "oldschool") {
        this.runSeqId = buffer.readUnsignedShort();
      } else {
        const shadowColorMod1 = buffer.readByte();
        const shadowColorMod2 = buffer.readByte();
      }
    } else if (opcode === 115) {
      if (this.cacheInfo.game === "oldschool") {
        this.runSeqId = buffer.readUnsignedShort();
        this.runBackSeqId = buffer.readUnsignedShort();
        this.runLeftSeqId = buffer.readUnsignedShort();
        this.runRightSeqId = buffer.readUnsignedShort();
      } else {
        buffer.readUnsignedByte();
        buffer.readUnsignedByte();
      }
    } else if (opcode === 116) {
      this.crawlSeqId = buffer.readUnsignedShort();
    } else if (opcode === 117) {
      this.crawlSeqId = buffer.readUnsignedShort();
      this.crawlBackSeqId = buffer.readUnsignedShort();
      this.crawlLeftSeqId = buffer.readUnsignedShort();
      this.crawlRightSeqId = buffer.readUnsignedShort();
    } else if (opcode === 119) {
      this.loginScreenProps = buffer.readByte();
    } else if (opcode === 121) {
      const modelOffsets = new Array(this.modelIds.length);
      const count = buffer.readUnsignedByte();
      for (let i = 0; i < count; i++) {
        const index = buffer.readUnsignedByte();
        const offsets = modelOffsets[index] = new Array(3);
        offsets[0] = buffer.readByte();
        offsets[1] = buffer.readByte();
        offsets[2] = buffer.readByte();
      }
    } else if (opcode === 122) {
      if (this.cacheInfo.game === "oldschool") {
        this.isFollower = true;
      } else {
        if (this.isLargeModelId()) {
          const hitBarSpriteId = buffer.readBigSmart();
        } else {
          const hitBarSpriteId = buffer.readUnsignedShort();
        }
      }
    } else if (opcode === 123) {
      if (this.cacheInfo.game === "oldschool") {
      } else {
        const iconHeight = buffer.readUnsignedShort();
      }
    } else if (opcode === 125) {
      this.spawnDirection = buffer.readByte();
    } else if (opcode === 127) {
      this.basTypeId = buffer.readUnsignedShort();
    } else if (opcode === 128) {
      buffer.readUnsignedByte();
    } else if (opcode === 134) {
      const idleSound = buffer.readUnsignedShort();
      const crawlSound = buffer.readUnsignedShort();
      const walkSound = buffer.readUnsignedShort();
      const runSound = buffer.readUnsignedShort();
      const soundRadius = buffer.readUnsignedByte();
    } else if (opcode === 135) {
      const cursor1op = buffer.readUnsignedByte();
      const cursor1 = buffer.readUnsignedShort();
    } else if (opcode === 136) {
      const cursor2op = buffer.readUnsignedByte();
      const cursor2 = buffer.readUnsignedShort();
    } else if (opcode === 137) {
      const attackCursor = buffer.readUnsignedShort();
    } else if (opcode === 138) {
      if (this.isLargeModelId()) {
        const icon = buffer.readBigSmart();
      } else {
        const icon = buffer.readUnsignedShort();
      }
    } else if (opcode === 139) {
      if (this.isLargeModelId()) {
        const icon = buffer.readBigSmart();
      } else {
        const icon = buffer.readUnsignedShort();
      }
    } else if (opcode === 140) {
      const ambientSoundVolume = buffer.readUnsignedByte();
    } else if (opcode === 141) {
      const bool = true;
    } else if (opcode === 142) {
      const mapFunctionId = buffer.readUnsignedShort();
    } else if (opcode === 143) {
      const bool = true;
    } else if (opcode === 144) {
      buffer.readUnsignedShort();
    } else if (opcode >= 150 && opcode < 155) {
      this.actions[opcode - 150] = this.readString(buffer);
      const isMember = true;
      if (!isMember || this.actions[opcode - 150].toLowerCase() === "hidden") {
        delete this.actions[opcode - 150];
      }
    } else if (opcode === 155) {
      const b0 = buffer.readByte();
      const b1 = buffer.readByte();
      const b2 = buffer.readByte();
      const b3 = buffer.readByte();
    } else if (opcode === 158) {
      const b = 1;
    } else if (opcode === 159) {
      const b = 0;
    } else if (opcode === 160) {
      const count = buffer.readUnsignedByte();
      for (let i = 0; i < count; i++) {
        const v = buffer.readUnsignedShort();
      }
    } else if (opcode === 161) {
      const bool = true;
    } else if (opcode === 162) {
      const bool = true;
    } else if (opcode === 163) {
      const v = buffer.readUnsignedByte();
    } else if (opcode === 164) {
      const v0 = buffer.readUnsignedShort();
      const v1 = buffer.readUnsignedShort();
    } else if (opcode === 165) {
      const v = buffer.readUnsignedByte();
    } else if (opcode === 168) {
      const v = buffer.readUnsignedByte();
    } else if (opcode >= 170 && opcode < 176) {
      buffer.readUnsignedShort();
    } else if (opcode === 249) {
      this.params = Type.readParamsMap(buffer, this.params);
    } else {
      throw new Error(
        "NpcType: Opcode " + opcode + " not implemented. ID: " + this.id + ". cache: " + this.cacheInfo
      );
    }
  }
  getIdleSeqId(basTypeLoader) {
    if (this.basTypeId !== -1) {
      return basTypeLoader.load(this.basTypeId).idleSeqId;
    }
    return this.idleSeqId;
  }
  getWalkSeqId(basTypeLoader) {
    if (this.basTypeId !== -1) {
      return basTypeLoader.load(this.basTypeId).walkSeqId;
    }
    return this.walkSeqId;
  }
  transform(varManager, loader) {
    if (!this.transforms) {
      return void 0;
    }
    let transformIndex = -1;
    if (this.transformVarbit !== -1) {
      transformIndex = varManager.getVarbit(this.transformVarbit);
    } else if (this.transformVarp !== -1) {
      transformIndex = varManager.getVarp(this.transformVarp);
    }
    let transformId = this.transforms[this.transforms.length - 1];
    if (transformIndex >= 0 && transformIndex < this.transforms.length - 1) {
      transformId = this.transforms[transformIndex];
    }
    if (transformId === -1) {
      return void 0;
    }
    return loader.load(transformId);
  }
};

// ../rs-party-dashboard/src/rs/config/npctype/NpcTypeLoader.ts
var DatNpcTypeLoader = class {
  static load(cacheInfo, configArchive) {
    return IndexedDatTypeLoader.load(NpcType, cacheInfo, configArchive, "npc");
  }
};
var ArchiveNpcTypeLoader = class extends ArchiveTypeLoader {
  constructor(cacheInfo, archive) {
    super(NpcType, cacheInfo, archive);
  }
};
var IndexNpcTypeLoader = class extends IndexTypeLoader {
  constructor(cacheInfo, index) {
    super(NpcType, cacheInfo, index, 7);
  }
};

// ../rs-party-dashboard/src/rs/config/objtype/ObjType.ts
var ObjType = class extends Type {
  constructor(id, cacheInfo) {
    super(id, cacheInfo);
    this.name = "null";
    this.zoom2d = 2e3;
    this.xan2d = 0;
    this.yan2d = 0;
    this.zan2d = 0;
    this.offsetX2d = 0;
    this.offsetY2d = 0;
    this.stackability = 0 /* SOMETIMES */;
    this.price = 1;
    this.op13 = -1;
    this.op14 = -1;
    this.isMembers = false;
    this.groundActions = [null, null, "Take", null, null];
    this.inventoryActions = [null, null, null, null, "Drop"];
    this.shiftClickIndex = -2;
    this.maleModel = -1;
    this.maleModel1 = -1;
    this.maleOffset = 0;
    this.femaleModel = -1;
    this.femaleModel1 = -1;
    this.femaleOffset = 0;
    this.maleModel2 = -1;
    this.femaleModel2 = -1;
    this.maleHeadModel = -1;
    this.maleHeadModel2 = -1;
    this.femaleHeadModel = -1;
    this.femaleHeadModel2 = -1;
    this.op27 = -1;
    this.note = -1;
    this.noteTemplate = -1;
    this.resizeX = 128;
    this.resizeY = 128;
    this.resizeZ = 128;
    this.ambient = 0;
    this.contrast = 0;
    this.team = 0;
    this.isTradable = false;
    this.op75 = 0;
    this.unnotedId = -1;
    this.notedId = -1;
    this.placeholder = -1;
    this.placeholderTemplate = -1;
    this.model = 0;
  }
  isLargeModelId() {
    return this.cacheInfo.game === "runescape" && this.cacheInfo.revision >= 670;
  }
  readModelId(buffer) {
    return this.isLargeModelId() ? buffer.readBigSmart() : buffer.readUnsignedShort();
  }
  decodeOpcode(opcode, buffer) {
    if (opcode === 1) {
      this.model = this.readModelId(buffer);
    } else if (opcode === 2) {
      this.name = this.readString(buffer);
    } else if (opcode === 3) {
      this.readString(buffer);
    } else if (opcode === 4) {
      this.zoom2d = buffer.readUnsignedShort();
    } else if (opcode === 5) {
      this.xan2d = buffer.readUnsignedShort();
    } else if (opcode === 6) {
      this.yan2d = buffer.readUnsignedShort();
    } else if (opcode === 7) {
      this.offsetX2d = buffer.readUnsignedShort();
      if (this.offsetX2d > 32767) {
        this.offsetX2d -= 65536;
      }
    } else if (opcode === 8) {
      this.offsetY2d = buffer.readUnsignedShort();
      if (this.offsetY2d > 32767) {
        this.offsetY2d -= 65536;
      }
    } else if (opcode === 9) {
      this.op9 = this.readString(buffer);
    } else if (opcode === 10) {
      buffer.readUnsignedShort();
    } else if (opcode === 11) {
      this.stackability = 1 /* ALWAYS */;
    } else if (opcode === 12) {
      this.price = buffer.readInt();
    } else if (opcode === 13) {
      this.op13 = buffer.readUnsignedByte();
    } else if (opcode === 14) {
      this.op14 = buffer.readUnsignedByte();
    } else if (opcode === 16) {
      this.isMembers = true;
    } else if (opcode === 23) {
      this.maleModel = this.readModelId(buffer);
      if (this.cacheInfo.revision < 503) {
        this.maleOffset = buffer.readUnsignedByte();
      }
    } else if (opcode === 24) {
      this.maleModel1 = this.readModelId(buffer);
    } else if (opcode === 25) {
      this.femaleModel = this.readModelId(buffer);
      if (this.cacheInfo.revision < 503) {
        this.femaleOffset = buffer.readUnsignedByte();
      }
    } else if (opcode === 26) {
      this.femaleModel1 = this.readModelId(buffer);
    } else if (opcode === 27) {
      this.op27 = buffer.readUnsignedByte();
    } else if (opcode >= 30 && opcode < 35) {
      this.groundActions[opcode - 30] = this.readString(buffer);
      if (this.groundActions[opcode - 30]?.toLowerCase() === "hidden") {
        this.groundActions[opcode - 30] = null;
      }
    } else if (opcode >= 35 && opcode < 40) {
      this.inventoryActions[opcode - 35] = this.readString(buffer);
    } else if (opcode === 40) {
      const count = buffer.readUnsignedByte();
      this.recolorFrom = new Array(count);
      this.recolorTo = new Array(count);
      for (let i = 0; i < count; i++) {
        this.recolorFrom[i] = buffer.readUnsignedShort();
        this.recolorTo[i] = buffer.readUnsignedShort();
      }
    } else if (opcode === 41) {
      const count = buffer.readUnsignedByte();
      this.retextureFrom = new Array(count);
      this.retextureTo = new Array(count);
      for (let i = 0; i < count; i++) {
        this.retextureFrom[i] = buffer.readUnsignedShort();
        this.retextureTo[i] = buffer.readUnsignedShort();
      }
    } else if (opcode === 42) {
      this.shiftClickIndex = buffer.readByte();
    } else if (opcode === 44 || opcode === 45) {
      buffer.readUnsignedShort();
    } else if (opcode === 65) {
      this.isTradable = true;
    } else if (opcode === 75) {
      this.op75 = buffer.readShort();
    } else if (opcode === 78) {
      this.maleModel2 = this.readModelId(buffer);
    } else if (opcode === 79) {
      this.femaleModel2 = this.readModelId(buffer);
    } else if (opcode === 90) {
      this.maleHeadModel = this.readModelId(buffer);
    } else if (opcode === 91) {
      this.femaleHeadModel = this.readModelId(buffer);
    } else if (opcode === 92) {
      this.maleHeadModel2 = this.readModelId(buffer);
    } else if (opcode === 93) {
      this.femaleHeadModel2 = this.readModelId(buffer);
    } else if (opcode === 94) {
      buffer.readUnsignedShort();
    } else if (opcode === 95) {
      this.zan2d = buffer.readUnsignedShort();
    } else if (opcode === 96) {
      const dummy = buffer.readUnsignedByte();
    } else if (opcode === 97) {
      this.note = buffer.readUnsignedShort();
    } else if (opcode === 98) {
      this.noteTemplate = buffer.readUnsignedShort();
    } else if (opcode >= 100 && opcode < 110) {
      if (!this.countObj) {
        this.countObj = new Array(10);
        this.countCo = new Array(10);
      }
      this.countObj[opcode - 100] = buffer.readUnsignedShort();
      this.countCo[opcode - 100] = buffer.readUnsignedShort();
    } else if (opcode === 110) {
      this.resizeX = buffer.readUnsignedShort();
    } else if (opcode === 111) {
      this.resizeY = buffer.readUnsignedShort();
    } else if (opcode === 112) {
      this.resizeZ = buffer.readUnsignedShort();
    } else if (opcode === 113) {
      this.ambient = buffer.readByte();
    } else if (opcode === 114) {
      this.contrast = buffer.readByte() * 5;
    } else if (opcode === 115) {
      this.team = buffer.readUnsignedByte();
    } else if (opcode === 121) {
      const lentId = buffer.readUnsignedShort();
    } else if (opcode === 122) {
      const lentTemplate = buffer.readUnsignedShort();
    } else if (opcode === 125) {
      const manwearxoff = buffer.readByte();
      const manwearyoff = buffer.readByte();
      const manwearzoff = buffer.readByte();
    } else if (opcode === 126) {
      const womanwearxoff = buffer.readByte();
      const womanwearyoff = buffer.readByte();
      const womanwearzoff = buffer.readByte();
    } else if (opcode === 127) {
      const cursor1op = buffer.readUnsignedByte();
      const cursor1 = buffer.readUnsignedShort();
    } else if (opcode === 128) {
      const cursor2op = buffer.readUnsignedByte();
      const cursor2 = buffer.readUnsignedShort();
    } else if (opcode === 129) {
      const cursor1iop = buffer.readUnsignedByte();
      const icursor1 = buffer.readUnsignedShort();
    } else if (opcode === 130) {
      const cursor2iop = buffer.readUnsignedByte();
      const icursor2 = buffer.readUnsignedShort();
    } else if (opcode === 132) {
      const count = buffer.readUnsignedByte();
      for (let i = 0; i < count; i++) {
        buffer.readUnsignedShort();
      }
    } else if (opcode === 139) {
      this.unnotedId = buffer.readUnsignedShort();
    } else if (opcode === 140) {
      this.notedId = buffer.readUnsignedShort();
    } else if (opcode >= 142 && opcode < 147) {
      buffer.readUnsignedShort();
    } else if (opcode === 148) {
      this.placeholder = buffer.readUnsignedShort();
    } else if (opcode === 149) {
      this.placeholderTemplate = buffer.readUnsignedShort();
    } else if (opcode >= 150 && opcode < 155) {
      buffer.readUnsignedShort();
    } else if (opcode === 249) {
      this.params = Type.readParamsMap(buffer, this.params);
    } else {
      throw new Error("ObjType: Opcode " + opcode + " not implemented.");
    }
  }
  genCert(template, original) {
    this.model = template.model;
    this.zoom2d = template.zoom2d;
    this.xan2d = template.xan2d;
    this.yan2d = template.yan2d;
    this.zan2d = template.zan2d;
    this.offsetX2d = template.offsetX2d;
    this.offsetY2d = template.offsetY2d;
    this.recolorFrom = template.recolorFrom;
    this.recolorTo = template.recolorTo;
    this.retextureFrom = template.retextureFrom;
    this.retextureTo = template.retextureTo;
    this.name = original.name;
    this.isMembers = original.isMembers;
    this.price = original.price;
    this.stackability = 1 /* ALWAYS */;
  }
  genBought(template, original) {
    this.model = template.model;
    this.zoom2d = template.zoom2d;
    this.xan2d = template.xan2d;
    this.yan2d = template.yan2d;
    this.zan2d = template.zan2d;
    this.offsetX2d = template.offsetX2d;
    this.offsetY2d = template.offsetY2d;
    this.recolorFrom = original.recolorFrom;
    this.recolorTo = original.recolorTo;
    this.retextureFrom = original.retextureFrom;
    this.retextureTo = original.retextureTo;
    this.name = original.name;
    this.isMembers = original.isMembers;
    this.stackability = original.stackability;
    this.maleModel = original.maleModel;
    this.maleModel1 = original.maleModel1;
    this.maleModel2 = original.maleModel2;
    this.femaleModel = original.femaleModel;
    this.femaleModel1 = original.femaleModel1;
    this.femaleModel2 = original.femaleModel2;
    this.maleHeadModel = original.maleHeadModel;
    this.maleHeadModel2 = original.maleHeadModel2;
    this.femaleHeadModel = original.femaleHeadModel;
    this.femaleHeadModel2 = original.femaleHeadModel2;
    this.team = original.team;
    this.groundActions = original.groundActions;
    this.op75 = original.op75;
    this.inventoryActions = new Array(5);
    if (original.inventoryActions) {
      for (let i = 0; i < 4; i++) {
        this.inventoryActions[i] = original.inventoryActions[i];
      }
    }
    this.inventoryActions[4] = "Discard";
    this.price = 0;
  }
  genPlaceholder(template, original) {
    this.model = template.model;
    this.zoom2d = template.zoom2d;
    this.xan2d = template.xan2d;
    this.yan2d = template.yan2d;
    this.zan2d = template.zan2d;
    this.offsetX2d = template.offsetX2d;
    this.offsetY2d = template.offsetY2d;
    this.recolorFrom = template.recolorFrom;
    this.recolorTo = template.recolorTo;
    this.retextureFrom = template.retextureFrom;
    this.retextureTo = template.retextureTo;
    this.stackability = template.stackability;
    this.name = original.name;
    this.price = 0;
    this.isMembers = false;
    this.isTradable = false;
  }
  getCountObj(loader, count) {
    if (this.countObj && count > 1) {
      let newId = -1;
      for (let i = 0; i < 10; i++) {
        if (count >= this.countCo[i] && this.countCo[i] !== 0) {
          newId = this.countObj[i];
        }
      }
      if (newId !== -1) {
        return loader.load(newId);
      }
    }
    return this;
  }
  getShiftClickIndex() {
    if (this.shiftClickIndex !== -1 && this.inventoryActions) {
      if (this.shiftClickIndex >= 0) {
        return this.inventoryActions[this.shiftClickIndex] ? this.shiftClickIndex : -1;
      } else {
        return this.inventoryActions[4] && this.inventoryActions[4].toLowerCase() === "drop" ? 4 : -1;
      }
    } else {
      return -1;
    }
  }
  hasRecolor() {
    return !!this.recolorTo;
  }
  hasRetexture() {
    return !!this.retextureTo;
  }
};

// ../rs-party-dashboard/src/rs/config/objtype/ObjTypeLoader.ts
var DatObjTypeLoader = class {
  static load(cacheInfo, configArchive) {
    return IndexedDatTypeLoader.load(ObjType, cacheInfo, configArchive, "obj");
  }
};
var ArchiveObjTypeLoader = class extends ArchiveTypeLoader {
  constructor(cacheInfo, archive) {
    super(ObjType, cacheInfo, archive);
  }
};
var IndexObjTypeLoader = class extends IndexTypeLoader {
  constructor(cacheInfo, index) {
    super(ObjType, cacheInfo, index);
  }
};

// ../rs-party-dashboard/src/rs/config/questtype/QuestType.ts
var QuestVar = class {
  constructor(id, inProgressValue, completedValue) {
    this.id = id;
    this.inProgressValue = inProgressValue;
    this.completedValue = completedValue;
  }
};
var QuestSkillReq = class {
  constructor(id, level) {
    this.id = id;
    this.level = level;
  }
};
var QuestType = class extends Type {
  constructor(id, cacheInfo) {
    super(id, cacheInfo);
    this.type = 0;
    this.difficulty = 0;
    this.member = false;
    this.points = 0;
    this.pointsRequirement = 0;
  }
  decodeOpcode(opcode, buffer) {
    if (opcode === 1) {
      this.name = buffer.readVerString();
    } else if (opcode === 2) {
      this.sortName = buffer.readVerString();
    } else if (opcode === 3) {
      const count = buffer.readUnsignedByte();
      this.varps = new Array(count);
      for (let i = 0; i < count; i++) {
        const id = buffer.readUnsignedShort();
        const inProgressValue = buffer.readInt();
        const completedValue = buffer.readInt();
        this.varps[i] = new QuestVar(id, inProgressValue, completedValue);
      }
    } else if (opcode === 4) {
      const count = buffer.readUnsignedByte();
      this.varbits = new Array(count);
      for (let i = 0; i < count; i++) {
        const id = buffer.readUnsignedShort();
        const inProgressValue = buffer.readInt();
        const completedValue = buffer.readInt();
        this.varbits[i] = new QuestVar(id, inProgressValue, completedValue);
      }
    } else if (opcode === 5) {
      buffer.readUnsignedShort();
    } else if (opcode === 6) {
      this.type = buffer.readUnsignedByte();
    } else if (opcode === 7) {
      this.difficulty = buffer.readUnsignedByte();
    } else if (opcode === 8) {
      this.member = true;
    } else if (opcode === 9) {
      this.points = buffer.readUnsignedByte();
    } else if (opcode === 10) {
      const count = buffer.readUnsignedByte();
      for (let i = 0; i < count; i++) {
        buffer.readInt();
      }
    } else if (opcode === 12) {
      buffer.readInt();
    } else if (opcode === 13) {
      const count = buffer.readUnsignedByte();
      this.questRequirements = new Array(count);
      for (let i = 0; i < count; i++) {
        this.questRequirements[i] = buffer.readUnsignedShort();
      }
    } else if (opcode === 14) {
      const count = buffer.readUnsignedByte();
      this.skillRequirements = new Array(count);
      for (let i = 0; i < count; i++) {
        const id = buffer.readUnsignedByte();
        const level = buffer.readUnsignedByte();
        this.skillRequirements[i] = new QuestSkillReq(id, level);
      }
    } else if (opcode === 15) {
      this.pointsRequirement = buffer.readUnsignedShort();
    } else if (opcode === 17) {
      if (this.cacheInfo.game === "runescape" && this.cacheInfo.revision >= 670) {
        const iconId = buffer.readBigSmart();
      } else {
        const iconId = buffer.readUnsignedShort();
      }
    } else if (opcode === 18) {
      const count = buffer.readUnsignedByte();
      for (let i = 0; i < count; i++) {
        buffer.readInt();
        buffer.readInt();
        buffer.readInt();
        buffer.readString();
      }
    } else if (opcode === 19) {
      const count = buffer.readUnsignedByte();
      for (let i = 0; i < count; i++) {
        buffer.readInt();
        buffer.readInt();
        buffer.readInt();
        buffer.readString();
      }
    } else if (opcode === 249) {
      this.paramsMap = Type.readParamsMap(buffer);
    } else {
      throw new Error("QuestType: Opcode " + opcode + " not implemented. id: " + this.id);
    }
  }
  post() {
    if (this.sortName === void 0) {
      this.sortName = this.name;
    }
  }
};

// ../rs-party-dashboard/src/rs/config/questtype/QuestTypeLoader.ts
var ArchiveQuestTypeLoader = class extends ArchiveTypeLoader {
  constructor(cacheInfo, archive) {
    super(QuestType, cacheInfo, archive);
  }
};

// ../rs-party-dashboard/src/rs/config/seqtype/SeqType.ts
var SeqSoundEffect = class {
  constructor(id, loops, location, retain) {
    this.id = id;
    this.loops = loops;
    this.location = location;
    this.retain = retain;
  }
};
function decodeSoundEffect(buffer, isNewSoundEffects, hasUnknown) {
  let id;
  let loops;
  let location;
  let retain = 0;
  if (isNewSoundEffects) {
    id = buffer.readUnsignedShort();
    if (hasUnknown) {
      buffer.readUnsignedByte();
    }
    loops = buffer.readUnsignedByte();
    location = buffer.readUnsignedByte();
    retain = buffer.readUnsignedByte();
  } else {
    const sound = buffer.readUnsignedMedium();
    id = sound >> 8;
    loops = sound >> 4 & 7;
    location = sound & 15;
  }
  return new SeqSoundEffect(id, loops, location, retain);
}
var SeqType = class extends Type {
  constructor(id, cacheInfo) {
    super(id, cacheInfo);
    this.frameStep = -1;
    this.stretches = false;
    this.forcedPriority = 5;
    this.leftHandItem = -1;
    this.rightHandItem = -1;
    this.maxLoops = 99;
    this.looping = false;
    this.precedenceAnimating = -1;
    this.priority = -1;
    this.replyMode = 2;
    this.skeletalId = -1;
    this.skeletalStart = 0;
    this.skeletalEnd = 0;
    this.op14 = false;
  }
  getFrameLength(seqFrameLoader, frame) {
    let frameLength = this.frameLengths[frame];
    if (this.cacheType === "legacy" || this.cacheType === "dat") {
      if (frameLength === 0) {
        const animFrame = seqFrameLoader.load(this.frameIds[frame]);
        if (animFrame) {
          frameLength = this.frameLengths[frame] = animFrame.frameLength;
        }
      }
      if (frameLength === 0) {
        frameLength = 1;
      }
    }
    return frameLength;
  }
  isNewSoundEffects() {
    return this.cacheInfo.game === "oldschool" && this.cacheInfo.revision >= 220;
  }
  decodeFrameSounds(buffer) {
    const count = buffer.readUnsignedByte();
    if (!this.frameSounds) {
      this.frameSounds = /* @__PURE__ */ new Map();
    }
    const isNewSoundEffects = this.isNewSoundEffects();
    for (let i = 0; i < count; i++) {
      const soundEffect = decodeSoundEffect(buffer, isNewSoundEffects, false);
      const effects = this.frameSounds.get(i);
      if (effects) {
        effects.push(soundEffect);
      } else {
        this.frameSounds.set(i, [soundEffect]);
      }
    }
  }
  decodeSparseFrameSounds(buffer, hasUnknown) {
    const count = buffer.readUnsignedShort();
    if (!this.frameSounds) {
      this.frameSounds = /* @__PURE__ */ new Map();
    }
    const isNewSoundEffects = this.isNewSoundEffects();
    for (let i = 0; i < count; i++) {
      const frame = buffer.readUnsignedShort();
      const soundEffect = decodeSoundEffect(buffer, isNewSoundEffects, hasUnknown);
      const effects = this.frameSounds.get(frame);
      if (effects) {
        effects.push(soundEffect);
      } else {
        this.frameSounds.set(frame, [soundEffect]);
      }
    }
  }
  decodeSkeletalId(buffer) {
    this.skeletalId = buffer.readInt();
  }
  decodeSkeletalDuration(buffer) {
    this.skeletalStart = buffer.readUnsignedShort();
    this.skeletalEnd = buffer.readUnsignedShort();
  }
  decodeOpcode(opcode, buffer) {
    if (opcode === 1) {
      let count = 0;
      if (this.cacheInfo.game === "runescape" && this.cacheInfo.revision < 456) {
        count = buffer.readUnsignedByte();
      } else {
        count = buffer.readUnsignedShort();
      }
      this.frameIds = new Array(count);
      this.frameLengths = new Array(count);
      if (this.cacheInfo.game === "runescape" && this.cacheInfo.revision <= 377) {
        for (let i = 0; i < count; i++) {
          this.frameIds[i] = buffer.readUnsignedShort();
          buffer.readUnsignedShort();
          this.frameLengths[i] = buffer.readUnsignedShort();
        }
      } else {
        for (let i = 0; i < count; i++) {
          this.frameLengths[i] = buffer.readUnsignedShort();
        }
        for (let i = 0; i < count; i++) {
          this.frameIds[i] = buffer.readUnsignedShort();
        }
        for (let i = 0; i < count; i++) {
          this.frameIds[i] += buffer.readUnsignedShort() << 16;
        }
      }
    } else if (opcode === 2) {
      this.frameStep = buffer.readUnsignedShort();
    } else if (opcode === 3) {
      const count = buffer.readUnsignedByte();
      this.masks = new Array(count + 1);
      for (let i = 0; i < count; i++) {
        this.masks[i] = buffer.readUnsignedByte();
      }
      this.masks[count] = 9999999;
    } else if (opcode === 4) {
      if (this.cacheInfo.game === "runescape" && this.cacheInfo.revision <= 194) {
        this.stretches = buffer.readUnsignedShort() === 1;
      } else {
        this.stretches = true;
      }
    } else if (opcode === 5) {
      this.forcedPriority = buffer.readUnsignedByte();
    } else if (opcode === 6) {
      this.leftHandItem = buffer.readUnsignedShort();
    } else if (opcode === 7) {
      this.rightHandItem = buffer.readUnsignedShort();
    } else if (opcode === 8) {
      this.maxLoops = buffer.readUnsignedByte();
      this.looping = true;
    } else if (opcode === 9) {
      this.precedenceAnimating = buffer.readUnsignedByte();
    } else if (opcode === 10) {
      this.priority = buffer.readUnsignedByte();
    } else if (opcode === 11) {
      this.replyMode = buffer.readUnsignedByte();
    } else if (opcode === 12) {
      if (this.cacheInfo.game === "runescape" && this.cacheInfo.revision <= 377) {
        buffer.readInt();
      } else {
        const count = buffer.readUnsignedByte();
        this.chatFrameIds = new Array(count);
        for (let i = 0; i < count; i++) {
          this.chatFrameIds[i] = buffer.readUnsignedShort();
        }
        for (let i = 0; i < count; i++) {
          this.chatFrameIds[i] += buffer.readUnsignedShort() << 16;
        }
      }
    } else if (opcode === 13) {
      if (this.cacheInfo.game === "runescape" && this.cacheInfo.revision >= 508) {
        const count = buffer.readUnsignedShort();
        for (let i = 0; i < count; i++) {
          const effectCount = buffer.readUnsignedByte();
          if (effectCount > 0) {
            buffer.readMedium();
            for (let e = 1; e < effectCount; e++) {
              buffer.readUnsignedShort();
            }
          }
        }
      } else if (this.cacheInfo.game === "oldschool" && this.cacheInfo.revision >= 226) {
        this.decodeSkeletalId(buffer);
      } else {
        this.decodeFrameSounds(buffer);
      }
    } else if (opcode === 14) {
      if (this.cacheInfo.game === "oldschool") {
        if (this.cacheInfo.revision >= 226) {
          this.decodeSparseFrameSounds(buffer, true);
        } else {
          this.decodeSkeletalId(buffer);
        }
      } else {
        this.op14 = true;
      }
    } else if (opcode === 15) {
      if (this.cacheInfo.game === "oldschool") {
        if (this.cacheInfo.revision >= 226) {
          this.decodeSkeletalDuration(buffer);
        } else {
          this.decodeSparseFrameSounds(buffer, false);
        }
      } else {
      }
    } else if (opcode === 16) {
      if (this.cacheInfo.game === "oldschool") {
        if (this.cacheInfo.revision < 226) {
          this.decodeSkeletalDuration(buffer);
        } else {
          buffer.readUnsignedByte();
        }
      } else {
      }
    } else if (opcode === 17) {
      if (this.cacheInfo.game === "oldschool") {
        const count = buffer.readUnsignedByte();
        this.skeletalMasks = new Array(256).fill(false);
        for (let i = 0; i < count; i++) {
          this.skeletalMasks[buffer.readUnsignedByte()] = true;
        }
      } else {
        const v = buffer.readUnsignedByte();
      }
    } else if (opcode === 18) {
      if (this.cacheInfo.game === "oldschool" && this.cacheInfo.revision >= 230) {
        const name = buffer.readString();
      } else {
        const b = true;
      }
    } else if (opcode === 19) {
      const index = buffer.readUnsignedByte();
      const value = buffer.readUnsignedByte();
    } else if (opcode === 20) {
      const index = buffer.readUnsignedByte();
      const max = buffer.readUnsignedShort();
      const min = buffer.readUnsignedShort();
    } else {
      throw new Error("SeqType: Opcode " + opcode + " not implemented.");
    }
  }
  isSkeletalSeq() {
    return this.skeletalId >= 0;
  }
  getSkeletalDuration() {
    return this.skeletalEnd - this.skeletalStart;
  }
};

// ../rs-party-dashboard/src/rs/config/seqtype/SeqTypeLoader.ts
var DatSeqTypeLoader = class {
  static load(cacheInfo, configArchive) {
    return DatTypeLoader.load(SeqType, cacheInfo, configArchive, "seq");
  }
};
var ArchiveSeqTypeLoader = class extends ArchiveTypeLoader {
  constructor(cacheInfo, archive) {
    super(SeqType, cacheInfo, archive);
  }
};
var IndexSeqTypeLoader = class extends IndexTypeLoader {
  constructor(cacheInfo, index) {
    super(SeqType, cacheInfo, index, 7);
  }
};

// ../rs-party-dashboard/src/rs/config/spotanimtype/SpotAnimType.ts
var SpotAnimType = class extends Type {
  constructor(id, cacheInfo) {
    super(id, cacheInfo);
    this.sequenceId = -1;
    this.widthScale = 128;
    this.heightScale = 128;
    this.orientation = 0;
    this.ambient = 0;
    this.contrast = 0;
  }
  decodeOpcode(opcode, buffer) {
    if (opcode === 1) {
      this.modelId = buffer.readUnsignedShort();
    } else if (opcode === 2) {
      this.sequenceId = buffer.readUnsignedShort();
    } else if (opcode === 4) {
      this.widthScale = buffer.readUnsignedShort();
    } else if (opcode === 5) {
      this.heightScale = buffer.readUnsignedShort();
    } else if (opcode === 6) {
      this.orientation = buffer.readUnsignedShort();
    } else if (opcode === 7) {
      this.ambient = buffer.readUnsignedByte();
    } else if (opcode === 8) {
      this.contrast = buffer.readUnsignedByte();
    } else if (opcode === 40) {
      const count = buffer.readUnsignedByte();
      this.recolorFrom = new Array(count);
      this.recolorTo = new Array(count);
      for (let i = 0; i < count; i++) {
        this.recolorFrom[i] = buffer.readUnsignedShort();
        this.recolorTo[i] = buffer.readUnsignedShort();
      }
    } else if (opcode === 41) {
      const count = buffer.readUnsignedByte();
      this.retextureFrom = new Array(count);
      this.retextureTo = new Array(count);
      for (let i = 0; i < count; i++) {
        this.retextureFrom[i] = buffer.readUnsignedShort();
        this.retextureTo[i] = buffer.readUnsignedShort();
      }
    }
  }
};

// ../rs-party-dashboard/src/rs/config/spotanimtype/SpotAnimTypeLoader.ts
var ArchiveSpotAnimTypeLoader = class extends ArchiveTypeLoader {
  constructor(cacheInfo, archive) {
    super(SpotAnimType, cacheInfo, archive);
  }
};
var IndexSpotAnimTypeLoader = class extends IndexTypeLoader {
  constructor(cacheInfo, index) {
    super(SpotAnimType, cacheInfo, index, 8);
  }
};

// ../rs-party-dashboard/src/rs/config/vartype/bit/VarBitType.ts
var VarBitType = class extends Type {
  decodeOpcode(opcode, buffer) {
    if (opcode === 1) {
      this.baseVar = buffer.readUnsignedShort();
      this.startBit = buffer.readUnsignedByte();
      this.endBit = buffer.readUnsignedByte();
    } else {
      throw new Error("VarBitType: Opcode " + opcode + " not implemented. id: " + this.id);
    }
  }
};

// ../rs-party-dashboard/src/rs/config/vartype/bit/VarBitTypeLoader.ts
var DummyVarBitTypeLoader = class extends DummyTypeLoader {
  constructor(cacheInfo) {
    super(cacheInfo, VarBitType);
  }
};
var DatVarBitTypeLoader = class {
  static load(cacheInfo, configArchive) {
    return DatTypeLoader.load(VarBitType, cacheInfo, configArchive, "varbit");
  }
};
var ArchiveVarBitTypeLoader = class extends ArchiveTypeLoader {
  constructor(cacheInfo, archive) {
    super(VarBitType, cacheInfo, archive);
  }
};
var IndexVarBitTypeLoader = class extends IndexTypeLoader {
  constructor(cacheInfo, index) {
    super(VarBitType, cacheInfo, index, 10);
  }
};

// ../rs-party-dashboard/src/rs/map/MapFileIndex.ts
function getMapSquareId(mapX, mapY) {
  return (mapX << 8) + mapY;
}
var MapSquare = class {
  constructor(mapId, terrainArchiveId, locArchiveId, members) {
    this.mapId = mapId;
    this.terrainArchiveId = terrainArchiveId;
    this.locArchiveId = locArchiveId;
    this.members = members;
  }
};
var DatMapFileIndex = class _DatMapFileIndex {
  constructor(mapSquares) {
    this.mapSquares = mapSquares;
  }
  static load(versionListArchive) {
    const file = versionListArchive.getFileNamed("map_index");
    if (!file) {
      throw new Error("map_index not found");
    }
    const buffer = file.getDataAsBuffer();
    const mapSquares = /* @__PURE__ */ new Map();
    const count = buffer.remaining / 7 | 0;
    for (let i = 0; i < count; i++) {
      const mapId = buffer.readUnsignedShort();
      const terrainArchiveId = buffer.readUnsignedShort();
      const locArchiveId = buffer.readUnsignedShort();
      const members = buffer.readUnsignedByte() === 1;
      mapSquares.set(mapId, new MapSquare(mapId, terrainArchiveId, locArchiveId, members));
    }
    return new _DatMapFileIndex(mapSquares);
  }
  getTerrainArchiveId(mapX, mapY) {
    return this.mapSquares.get(getMapSquareId(mapX, mapY))?.terrainArchiveId ?? -1;
  }
  getLocArchiveId(mapX, mapY) {
    return this.mapSquares.get(getMapSquareId(mapX, mapY))?.locArchiveId ?? -1;
  }
};
var Dat2MapIndex = class {
  constructor(mapIndex) {
    this.mapIndex = mapIndex;
  }
  getTerrainArchiveId(mapX, mapY) {
    return this.mapIndex.getArchiveId(`m${mapX}_${mapY}`);
  }
  getLocArchiveId(mapX, mapY) {
    return this.mapIndex.getArchiveId(`l${mapX}_${mapY}`);
  }
};

// ../rs-party-dashboard/src/rs/map/MapFileLoader.ts
var MapFileLoader = class {
  constructor(mapIndex, mapFileIndex) {
    this.mapIndex = mapIndex;
    this.mapFileIndex = mapFileIndex;
  }
  getTerrainData(mapX, mapY) {
    const archiveId = this.mapFileIndex.getTerrainArchiveId(mapX, mapY);
    if (archiveId === -1) {
      return void 0;
    }
    try {
      const file = this.mapIndex.getFile(archiveId, 0);
      return file?.data;
    } catch (e) {
      return void 0;
    }
  }
  getLocData(mapX, mapY, xteasMap) {
    const archiveId = this.mapFileIndex.getLocArchiveId(mapX, mapY);
    if (archiveId === -1) {
      return void 0;
    }
    const key = xteasMap.get(archiveId);
    try {
      const file = this.mapIndex.getFile(archiveId, 0, key);
      return file?.data;
    } catch (e) {
      return void 0;
    }
  }
  getNpcSpawnData(mapX, mapY, xteasMap) {
    const locArchiveId = this.mapFileIndex.getLocArchiveId(mapX, mapY);
    const archiveId = this.mapIndex.getArchiveId(`n${mapX}_${mapY}`);
    if (locArchiveId === -1 || archiveId === -1) {
      return void 0;
    }
    const key = xteasMap.get(locArchiveId);
    try {
      const file = this.mapIndex.getFile(archiveId, 0, key);
      return file?.data;
    } catch (e) {
      return void 0;
    }
  }
};
var LegacyMapFileLoader = class extends MapFileLoader {
  decompress(data) {
    const buffer = new ByteBuffer(data);
    const actualSize = buffer.readInt();
    const compressed = buffer.readUnsignedBytes(buffer.remaining);
    const decompressed = Bzip2.decompress(compressed, actualSize);
    return decompressed;
  }
  getTerrainData(mapX, mapY) {
    const data = super.getTerrainData(mapX, mapY);
    if (!data) {
      return void 0;
    }
    try {
      return this.decompress(data);
    } catch (e) {
      console.error("Failed decompressing terrain data", mapX, mapY, data.length, e);
      return void 0;
    }
  }
  getLocData(mapX, mapY, xteasMap) {
    const data = super.getLocData(mapX, mapY, xteasMap);
    if (!data) {
      return void 0;
    }
    try {
      return this.decompress(data);
    } catch (e) {
      console.error("Failed decompressing loc data", mapX, mapY, data.length, data, e);
      return void 0;
    }
  }
};

// ../rs-party-dashboard/src/rs/scene/entity/Entity.ts
var Entity = class {
  constructor() {
    this.height = 1e3;
  }
  canMergeNormals() {
    return false;
  }
  mergeNormals(entity, offsetX, offsetY, offsetZ, hideOccluded) {
  }
  // light(textureLoader: TextureLoader, lightX: number, lightY: number, lightZ: number): Entity {
  //     return this;
  // }
};

// ../rs-party-dashboard/src/rs/model/FaceNormal.ts
var FaceNormal = class {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
};

// ../rs-party-dashboard/src/rs/model/Model.ts
var import_gl_matrix = require("gl-matrix");
var scaleVector = import_gl_matrix.vec3.create();
var Model = class _Model extends Entity {
  constructor() {
    super();
    this.version = 0;
    this.changedLight = false;
    this.contourHeight = 0;
    this.verticesCount = 0;
    this.usedVertexCount = 0;
    this.faceCount = 0;
    this.priority = 0;
    this.texTriangleCount = 0;
    this.isClickable = false;
    this.xMidOffset = -1;
    this.yMidOffset = -1;
    this.zMidOffset = -1;
  }
  static {
    this.animateOriginX = 0;
  }
  static {
    this.animateOriginY = 0;
  }
  static {
    this.animateOriginZ = 0;
  }
  static {
    this.sketetalTransformMatrix = import_gl_matrix.mat4.create();
  }
  static {
    this.skeletalScalingMatrix = import_gl_matrix.mat4.create();
  }
  static {
    this.skeletalBoneMatrix = import_gl_matrix.mat4.create();
  }
  static copy(model) {
    return _Model.merge([model], 1);
  }
  static copyAnimated(model, shallowTransparencies, shallowColors) {
    const copy = Object.assign(Object.create(Object.getPrototypeOf(model)), model);
    copy.verticesX = new Int32Array(model.verticesCount);
    copy.verticesY = new Int32Array(model.verticesCount);
    copy.verticesZ = new Int32Array(model.verticesCount);
    for (let i = 0; i < model.verticesCount; i++) {
      copy.verticesX[i] = model.verticesX[i];
      copy.verticesY[i] = model.verticesY[i];
      copy.verticesZ[i] = model.verticesZ[i];
    }
    if (shallowTransparencies) {
      copy.faceAlphas = model.faceAlphas;
    } else {
      copy.faceAlphas = new Int8Array(model.faceCount);
      if (model.faceAlphas) {
        for (let i = 0; i < model.faceCount; i++) {
          copy.faceAlphas[i] = model.faceAlphas[i];
        }
      } else {
        copy.faceAlphas.fill(0);
      }
    }
    if (!shallowColors) {
      copy.faceColors = new Uint16Array(model.faceCount);
      copy.faceColors1 = new Int32Array(model.faceCount);
      copy.faceColors2 = new Int32Array(model.faceCount);
      copy.faceColors3 = new Int32Array(model.faceCount);
      for (let i = 0; i < model.faceCount; i++) {
        copy.faceColors[i] = model.faceColors[i];
        copy.faceColors1[i] = model.faceColors1[i];
        copy.faceColors2[i] = model.faceColors2[i];
        copy.faceColors3[i] = model.faceColors3[i];
      }
    }
    return copy;
  }
  static merge(models, count) {
    const model = new _Model();
    model.merge(models, count);
    return model;
  }
  static resetAnimateOrigin() {
    _Model.animateOriginX = 0;
    _Model.animateOriginY = 0;
    _Model.animateOriginZ = 0;
  }
  merge(models, count) {
    let hasRenderPriority = false;
    let hasAlpha = false;
    let hasTexture = false;
    let hasTextureCoord = false;
    this.verticesCount = 0;
    this.faceCount = 0;
    this.texTriangleCount = 0;
    this.priority = -1;
    for (let i = 0; i < count; i++) {
      const model = models[i];
      if (model) {
        this.verticesCount += model.verticesCount;
        this.faceCount += model.faceCount;
        this.texTriangleCount += model.texTriangleCount;
        if (model.faceRenderPriorities) {
          hasRenderPriority = true;
        } else {
          if (this.priority === -1) {
            this.priority = model.priority;
          }
          if (this.priority !== model.priority) {
            hasRenderPriority = true;
          }
        }
        hasAlpha ||= !!model.faceAlphas;
        hasTexture ||= !!model.faceTextures;
        hasTextureCoord ||= !!model.textureCoords;
      }
    }
    this.verticesX = new Int32Array(this.verticesCount);
    this.verticesY = new Int32Array(this.verticesCount);
    this.verticesZ = new Int32Array(this.verticesCount);
    this.indices1 = new Int32Array(this.faceCount);
    this.indices2 = new Int32Array(this.faceCount);
    this.indices3 = new Int32Array(this.faceCount);
    this.faceColors1 = new Int32Array(this.faceCount);
    this.faceColors2 = new Int32Array(this.faceCount);
    this.faceColors3 = new Int32Array(this.faceCount);
    this.faceColors = new Uint16Array(this.faceCount);
    if (hasRenderPriority) {
      this.faceRenderPriorities = new Int8Array(this.faceCount);
    }
    if (hasAlpha) {
      this.faceAlphas = new Int8Array(this.faceCount);
    }
    if (hasTexture) {
      this.faceTextures = new Int16Array(this.faceCount);
    }
    if (hasTextureCoord) {
      this.textureCoords = new Int8Array(this.faceCount);
    }
    if (this.texTriangleCount > 0) {
      this.textureMappingP = new Int32Array(this.texTriangleCount);
      this.textureMappingM = new Int32Array(this.texTriangleCount);
      this.textureMappingN = new Int32Array(this.texTriangleCount);
      this.textureScaleX = new Int32Array(this.texTriangleCount);
      this.textureScaleY = new Int32Array(this.texTriangleCount);
      this.textureScaleZ = new Int32Array(this.texTriangleCount);
      this.textureRotation = new Int8Array(this.texTriangleCount);
      this.textureDirection = new Int8Array(this.texTriangleCount);
      this.textureSpeed = new Int32Array(this.texTriangleCount);
      this.textureTransU = new Int32Array(this.texTriangleCount);
      this.textureTransV = new Int32Array(this.texTriangleCount);
    }
    this.verticesCount = 0;
    this.faceCount = 0;
    this.texTriangleCount = 0;
    for (let i = 0; i < count; i++) {
      const model = models[i];
      if (model) {
        for (let f = 0; f < model.faceCount; f++) {
          this.indices1[this.faceCount] = this.verticesCount + model.indices1[f];
          this.indices2[this.faceCount] = this.verticesCount + model.indices2[f];
          this.indices3[this.faceCount] = this.verticesCount + model.indices3[f];
          this.faceColors1[this.faceCount] = model.faceColors1[f];
          this.faceColors2[this.faceCount] = model.faceColors2[f];
          this.faceColors3[this.faceCount] = model.faceColors3[f];
          this.faceColors[this.faceCount] = model.faceColors[f];
          if (hasRenderPriority) {
            if (model.faceRenderPriorities) {
              this.faceRenderPriorities[this.faceCount] = model.faceRenderPriorities[f];
            } else {
              this.faceRenderPriorities[this.faceCount] = model.priority;
            }
          }
          if (hasAlpha && model.faceAlphas) {
            this.faceAlphas[this.faceCount] = model.faceAlphas[f];
          }
          if (hasTexture && this.faceTextures) {
            if (model.faceTextures) {
              this.faceTextures[this.faceCount] = model.faceTextures[f];
            } else {
              this.faceTextures[this.faceCount] = -1;
            }
          }
          if (hasTextureCoord) {
            if (model.textureCoords && model.textureCoords[f] !== -1) {
              this.textureCoords[this.faceCount] = this.texTriangleCount + model.textureCoords[f];
            } else {
              this.textureCoords[this.faceCount] = -1;
            }
          }
          this.faceCount++;
        }
        for (let v = 0; v < model.texTriangleCount; v++) {
          this.textureMappingP[this.texTriangleCount] = this.verticesCount + model.textureMappingP[v];
          this.textureMappingM[this.texTriangleCount] = this.verticesCount + model.textureMappingM[v];
          this.textureMappingN[this.texTriangleCount] = this.verticesCount + model.textureMappingN[v];
          this.texTriangleCount++;
        }
        for (let v = 0; v < model.verticesCount; v++) {
          this.verticesX[this.verticesCount] = model.verticesX[v];
          this.verticesY[this.verticesCount] = model.verticesY[v];
          this.verticesZ[this.verticesCount] = model.verticesZ[v];
          this.verticesCount++;
        }
      }
    }
    this.usedVertexCount = this.verticesCount;
  }
  calculateBoundsCylinder() {
    if (this.boundsType !== 1) {
      this.boundsType = 1;
      this.height = 0;
      this.bottomY = 0;
      this.xzRadius = 0;
      for (let i = 0; i < this.usedVertexCount; i++) {
        const vertX = this.verticesX[i];
        const vertY = this.verticesY[i];
        const vertZ = this.verticesZ[i];
        if (-vertY > this.height) {
          this.height = -vertY;
        }
        if (this.contourVerticesY) {
          const contourY = this.contourVerticesY[i];
          if (-contourY > this.contourHeight) {
            this.contourHeight = -contourY;
          }
        }
        if (vertY > this.bottomY) {
          this.bottomY = vertY;
        }
        const var5 = vertX * vertX + vertZ * vertZ;
        if (var5 > this.xzRadius) {
          this.xzRadius = var5;
        }
      }
      if (!this.contourVerticesY) {
        this.contourHeight = this.height;
      }
      this.xzRadius = Math.sqrt(this.xzRadius) + 0.99 | 0;
      this.radius = Math.sqrt(this.xzRadius * this.xzRadius + this.height * this.height) + 0.99 | 0;
      this.diameter = this.radius + (Math.sqrt(this.xzRadius * this.xzRadius + this.bottomY * this.bottomY) + 0.99) | 0;
    }
  }
  calculateBounds() {
    if (this.boundsType !== 2) {
      this.height = 0;
      this.minHeight = 0;
      this.minX = 999999;
      this.maxX = -999999;
      this.minY = 999999;
      this.maxY = -999999;
      this.minZ = 99999;
      this.maxZ = -99999;
      const verticesY = this.contourVerticesY ?? this.verticesY;
      for (let i = 0; i < this.usedVertexCount; i++) {
        const vertX = this.verticesX[i];
        const vertY = verticesY[i];
        const vertZ = this.verticesZ[i];
        if (vertX < this.minX) {
          this.minX = vertX;
        }
        if (vertX > this.maxX) {
          this.maxX = vertX;
        }
        if (this.minY > vertY) {
          this.minY = vertY;
        }
        if (this.maxY < vertY) {
          this.maxY = vertY;
        }
        if (vertZ < this.minZ) {
          this.minZ = vertZ;
        }
        if (vertZ > this.maxZ) {
          this.maxZ = vertZ;
        }
        if (-vertY > this.height) {
          this.height = -vertY;
        }
        if (vertY > this.minHeight) {
          this.minHeight = vertY;
        }
      }
      this.boundsType = 2;
    }
  }
  invalidateBounds() {
    this.boundsType = 0;
    this.xMidOffset = -1;
  }
  contourGround(type, param, heightMap, heightMapAbove, sceneX, sceneHeight, sceneZ, createNew = true) {
    if (this.usedVertexCount === 0) {
      return this;
    }
    this.calculateBounds();
    let startX = sceneX + this.minX;
    let endX = sceneX + this.maxX;
    let startY = sceneZ + this.minZ;
    let endY = sceneZ + this.maxZ;
    if ((type === 1 || type === 2 || type === 3 || type === 5) && (startX < 0 || endX + 128 >> 7 >= heightMap.length || startY < 0 || endY + 128 >> 7 >= heightMap[0].length)) {
      return this;
    }
    if (type === 4 || type === 5) {
      if (heightMapAbove === void 0) {
        return this;
      }
      if (startX < 0 || endX + 128 >> 7 >= heightMapAbove.length || startY < 0 || endY + 128 >> 7 >= heightMapAbove[0].length) {
        return this;
      }
    } else {
      startX >>= 7;
      endX = endX + 127 >> 7;
      startY >>= 7;
      endY = endY + 127 >> 7;
      if (heightMap[startX][startY] === sceneHeight && heightMap[endX][startY] === sceneHeight && heightMap[startX][endY] === sceneHeight && heightMap[endX][endY] === sceneHeight) {
        return this;
      }
    }
    let model = this;
    if (createNew) {
      model = new _Model();
      model.verticesCount = this.verticesCount;
      model.usedVertexCount = this.usedVertexCount;
      model.faceCount = this.faceCount;
      model.texTriangleCount = this.texTriangleCount;
      model.verticesX = this.verticesX;
      model.verticesZ = this.verticesZ;
      model.indices1 = this.indices1;
      model.indices2 = this.indices2;
      model.indices3 = this.indices3;
      model.faceColors1 = this.faceColors1;
      model.faceColors2 = this.faceColors2;
      model.faceColors3 = this.faceColors3;
      model.faceColors = this.faceColors;
      model.faceRenderPriorities = this.faceRenderPriorities;
      model.faceAlphas = this.faceAlphas;
      model.textureCoords = this.textureCoords;
      model.faceTextures = this.faceTextures;
      model.priority = this.priority;
      model.textureMappingP = this.textureMappingP;
      model.textureMappingM = this.textureMappingM;
      model.textureMappingN = this.textureMappingN;
      model.textureScaleX = this.textureScaleX;
      model.textureScaleY = this.textureScaleY;
      model.textureScaleZ = this.textureScaleZ;
      model.textureRotation = this.textureRotation;
      model.textureDirection = this.textureDirection;
      model.textureSpeed = this.textureSpeed;
      model.textureTransU = this.textureTransU;
      model.textureTransV = this.textureTransV;
      model.uvs = this.uvs;
      model.vertexLabels = this.vertexLabels;
      model.faceLabels = this.faceLabels;
      model.isClickable = this.isClickable;
      model.verticesY = this.verticesY;
    }
    model.contourVerticesY = new Int32Array(model.verticesCount);
    if (type === 1) {
      for (let i = 0; i < model.usedVertexCount; i++) {
        const vx = this.verticesX[i] + sceneX;
        const vz = this.verticesZ[i] + sceneZ;
        const rx = vx & 127;
        const rz = vz & 127;
        const tx = vx >> 7;
        const tz = vz >> 7;
        const h0 = heightMap[tx][tz] * (128 - rx) + heightMap[tx + 1][tz] * rx >> 7;
        const h1 = heightMap[tx][tz + 1] * (128 - rx) + heightMap[tx + 1][tz + 1] * rx >> 7;
        const height = h0 * (128 - rz) + h1 * rz >> 7;
        model.contourVerticesY[i] = this.verticesY[i] + height - sceneHeight;
      }
      for (let i = model.usedVertexCount; i < model.verticesCount; i++) {
        const vx = this.verticesX[i] + sceneX;
        const vz = this.verticesZ[i] + sceneZ;
        const rx = vx & 127;
        const rz = vz & 127;
        const tx = vx >> 7;
        const tz = vz >> 7;
        if (tx >= 0 && tx < heightMap.length - 1 && tz >= 0 && tz < heightMap[0].length - 1) {
          const h0 = heightMap[tx][tz] * (128 - rx) + heightMap[tx + 1][tz] * rx >> 7;
          const h1 = heightMap[tx][tz + 1] * (128 - rx) + heightMap[tx + 1][tz + 1] * rx >> 7;
          const height = h0 * (128 - rz) + h1 * rz >> 7;
          model.contourVerticesY[i] = this.verticesY[i] + height - sceneHeight;
        } else {
          model.contourVerticesY[i] = this.verticesY[i];
        }
      }
    } else if (type === 2) {
      for (let i = 0; i < model.usedVertexCount; i++) {
        const yRatio = (this.verticesY[i] << 16) / this.minY | 0;
        if (yRatio < param) {
          const vx = this.verticesX[i] + sceneX;
          const vz = this.verticesZ[i] + sceneZ;
          const rx = vx & 127;
          const rz = vz & 127;
          const tx = vx >> 7;
          const tz = vz >> 7;
          const h0 = heightMap[tx][tz] * (128 - rx) + heightMap[tx + 1][tz] * rx >> 7;
          const h1 = heightMap[tx][tz + 1] * (128 - rx) + heightMap[tx + 1][tz + 1] * rx >> 7;
          const height = h0 * (128 - rz) + h1 * rz >> 7;
          model.contourVerticesY[i] = this.verticesY[i] + (height - sceneHeight) * (param - yRatio) / param;
        } else {
          model.contourVerticesY[i] = this.verticesY[i];
        }
      }
      for (let i = model.usedVertexCount; i < model.verticesCount; i++) {
        const yRatio = (this.verticesY[i] << 16) / this.minY | 0;
        if (yRatio < param) {
          const vx = this.verticesX[i] + sceneX;
          const vz = this.verticesZ[i] + sceneZ;
          const rx = vx & 127;
          const rz = vz & 127;
          const tx = vx >> 7;
          const tz = vz >> 7;
          if (tx >= 0 && tx < heightMap.length - 1 && tz >= 0 && tz < heightMap[0].length - 1) {
            const h0 = heightMap[tx][tz] * (128 - rx) + heightMap[tx + 1][tz] * rx >> 7;
            const h1 = heightMap[tx][tz + 1] * (128 - rx) + heightMap[tx + 1][tz + 1] * rx >> 7;
            const height = h0 * (128 - rz) + h1 * rz >> 7;
            model.contourVerticesY[i] = this.verticesY[i] + (height - sceneHeight) * (param - yRatio) / param;
          }
        } else {
          model.contourVerticesY[i] = this.verticesY[i];
        }
      }
    } else if (type === 3) {
      for (let i = 0; i < model.usedVertexCount; i++) {
        model.contourVerticesY[i] = this.verticesY[i];
      }
    } else if (type === 4) {
      const deltaY = this.maxY - this.minY;
      for (let i = 0; i < model.usedVertexCount; i++) {
        const vx = this.verticesX[i] + sceneX;
        const vz = this.verticesZ[i] + sceneZ;
        const rx = vx & 127;
        const rz = vz & 127;
        const tx = vx >> 7;
        const tz = vz >> 7;
        const h0 = heightMapAbove[tx][tz] * (128 - rx) + heightMapAbove[tx + 1][tz] * rx >> 7;
        const h1 = heightMapAbove[tx][tz + 1] * (128 - rx) + heightMapAbove[tx + 1][tz + 1] * rx >> 7;
        const height = h0 * (128 - rz) + h1 * rz >> 7;
        model.contourVerticesY[i] = this.verticesY[i] + height - sceneHeight + deltaY;
      }
    } else if (type === 5) {
      const deltaY = this.maxY - this.minY;
      for (let i = 0; i < model.usedVertexCount; i++) {
        const vx = this.verticesX[i] + sceneX;
        const vz = this.verticesZ[i] + sceneZ;
        const rx = vx & 127;
        const rz = vz & 127;
        const tx = vx >> 7;
        const tz = vz >> 7;
        let h0 = heightMap[tx][tz] * (128 - rx) + heightMap[tx + 1][tz] * rx >> 7;
        let h1 = heightMap[tx][tz + 1] * (128 - rx) + heightMap[tx + 1][tz + 1] * rx >> 7;
        const height = h0 * (128 - rz) + h1 * rz >> 7;
        h0 = heightMapAbove[tx][tz] * (128 - rx) + heightMapAbove[tx + 1][tz] * rx >> 7;
        h1 = heightMapAbove[tx][tz + 1] * (128 - rx) + heightMapAbove[tx + 1][tz + 1] * rx >> 7;
        const heightAbove = h0 * (128 - rz) + h1 * rz >> 7;
        const deltaHeight = height - heightAbove;
        model.contourVerticesY[i] = (((this.verticesY[i] << 8) / deltaY | 0) * deltaHeight >> 8) - (sceneHeight - height);
      }
    }
    model.invalidateBounds();
    return model;
  }
  rotate90() {
    for (let i = 0; i < this.verticesCount; i++) {
      const temp = this.verticesX[i];
      this.verticesX[i] = this.verticesZ[i];
      this.verticesZ[i] = -temp;
    }
    this.invalidateBounds();
  }
  rotate180() {
    for (let i = 0; i < this.verticesCount; i++) {
      this.verticesX[i] = -this.verticesX[i];
      this.verticesZ[i] = -this.verticesZ[i];
    }
    this.invalidateBounds();
  }
  rotate270() {
    for (let i = 0; i < this.verticesCount; i++) {
      const temp = this.verticesZ[i];
      this.verticesZ[i] = this.verticesX[i];
      this.verticesX[i] = -temp;
    }
    this.invalidateBounds();
  }
  rotate(angle) {
    const sin = SINE[angle];
    const cos = COSINE[angle];
    for (let i = 0; i < this.verticesCount; i++) {
      const temp = sin * this.verticesZ[i] + cos * this.verticesX[i] >> 16;
      this.verticesZ[i] = cos * this.verticesZ[i] - sin * this.verticesX[i] >> 16;
      this.verticesX[i] = temp;
    }
    this.invalidateBounds();
  }
  translate(x, y, z) {
    for (let i = 0; i < this.verticesCount; i++) {
      this.verticesX[i] += x;
      this.verticesY[i] += y;
      this.verticesZ[i] += z;
    }
    this.invalidateBounds();
  }
  scale(x, y, z) {
    for (let i = 0; i < this.verticesCount; i++) {
      this.verticesX[i] = this.verticesX[i] * x / 128 | 0;
      this.verticesY[i] = this.verticesY[i] * y / 128 | 0;
      this.verticesZ[i] = this.verticesZ[i] * z / 128 | 0;
    }
    this.invalidateBounds();
  }
  getXZRadius() {
    this.calculateBoundsCylinder();
    return this.xzRadius;
  }
  animateOld(frame) {
    if (this.vertexLabels && frame) {
      _Model.resetAnimateOrigin();
      const base = frame.base;
      for (let i = 0; i < frame.transformCount; i++) {
        const group = frame.transformGroups[i];
        this.transform(
          base.types[group],
          base.labels[group],
          frame.transformX[i],
          frame.transformY[i],
          frame.transformZ[i]
        );
      }
      this.postAnimate();
    }
  }
  animate(frame, nextFrame, op14) {
    if (this.vertexLabels) {
      _Model.resetAnimateOrigin();
      const base = frame.base;
      if (base !== nextFrame?.base) {
        nextFrame = void 0;
      }
      this.transformInterpolated(base, frame, nextFrame, void 0, true, op14, 65535);
      this.postAnimate();
    }
  }
  transformInterpolated(base, frame, nextFrame, animateLabels, condition, op14, mask) {
    if (!nextFrame) {
      for (let i = 0; i < frame.transformCount; i++) {
        const group = frame.transformGroups[i];
        const type = base.types[group];
        if (!animateLabels || animateLabels[group] === condition || type === 0 /* ORIGIN */) {
          const resetOriginGroup = frame.resetOriginGroups[i];
          if (resetOriginGroup !== -1) {
            this.transform(
              0 /* ORIGIN */,
              base.labels[resetOriginGroup],
              0,
              0,
              0,
              op14,
              base.masks[resetOriginGroup] & mask
            );
          }
          this.transform(
            base.types[group],
            base.labels[group],
            frame.transformX[i],
            frame.transformY[i],
            frame.transformZ[i],
            op14,
            base.masks[group] & mask
          );
        }
      }
    }
  }
  transform(type, labels, tx, ty, tz, op14 = false, mask = 65535) {
    if (mask !== 65535) {
    } else {
      this.transform0(type, labels, tx, ty, tz, op14);
    }
  }
  transform0(type, labels, tx, ty, tz, op14) {
    switch (type) {
      case 0 /* ORIGIN */:
        _Model.resetAnimateOrigin();
        let groupVertexCount = 0;
        for (const label of labels) {
          if (label < this.vertexLabels.length) {
            for (const v of this.vertexLabels[label]) {
              _Model.animateOriginX += this.verticesX[v];
              _Model.animateOriginY += this.verticesY[v];
              _Model.animateOriginZ += this.verticesZ[v];
              groupVertexCount++;
            }
          }
        }
        if (groupVertexCount > 0) {
          _Model.animateOriginX = tx + (_Model.animateOriginX / groupVertexCount | 0);
          _Model.animateOriginY = ty + (_Model.animateOriginY / groupVertexCount | 0);
          _Model.animateOriginZ = tz + (_Model.animateOriginZ / groupVertexCount | 0);
        } else {
          _Model.animateOriginX = tx;
          _Model.animateOriginY = ty;
          _Model.animateOriginZ = tz;
        }
        break;
      case 1 /* TRANSLATE */:
        for (const label of labels) {
          if (label < this.vertexLabels.length) {
            for (const v of this.vertexLabels[label]) {
              this.verticesX[v] += tx;
              this.verticesY[v] += ty;
              this.verticesZ[v] += tz;
            }
          }
        }
        break;
      case 2 /* ROTATE */:
        for (const label of labels) {
          if (label < this.vertexLabels.length) {
            for (const v of this.vertexLabels[label]) {
              this.verticesX[v] -= _Model.animateOriginX;
              this.verticesY[v] -= _Model.animateOriginY;
              this.verticesZ[v] -= _Model.animateOriginZ;
              const angleX = (tx & 255) * 8;
              const angleY = (ty & 255) * 8;
              const angleZ = (tz & 255) * 8;
              if (angleZ !== 0) {
                const sin = SINE[angleZ];
                const cos = COSINE[angleZ];
                const temp = sin * this.verticesY[v] + cos * this.verticesX[v] >> 16;
                this.verticesY[v] = cos * this.verticesY[v] - sin * this.verticesX[v] >> 16;
                this.verticesX[v] = temp;
              }
              if (angleX !== 0) {
                const sin = SINE[angleX];
                const cos = COSINE[angleX];
                const temp = cos * this.verticesY[v] - sin * this.verticesZ[v] >> 16;
                this.verticesZ[v] = sin * this.verticesY[v] + cos * this.verticesZ[v] >> 16;
                this.verticesY[v] = temp;
              }
              if (angleY !== 0) {
                const sin = SINE[angleY];
                const cos = COSINE[angleY];
                const temp = sin * this.verticesZ[v] + cos * this.verticesX[v] >> 16;
                this.verticesZ[v] = cos * this.verticesZ[v] - sin * this.verticesX[v] >> 16;
                this.verticesX[v] = temp;
              }
              this.verticesX[v] += _Model.animateOriginX;
              this.verticesY[v] += _Model.animateOriginY;
              this.verticesZ[v] += _Model.animateOriginZ;
            }
          }
        }
        break;
      case 3 /* SCALE */:
        for (const label of labels) {
          if (label < this.vertexLabels.length) {
            for (const v of this.vertexLabels[label]) {
              this.verticesX[v] -= _Model.animateOriginX;
              this.verticesY[v] -= _Model.animateOriginY;
              this.verticesZ[v] -= _Model.animateOriginZ;
              this.verticesX[v] = tx * this.verticesX[v] / 128 | 0;
              this.verticesY[v] = ty * this.verticesY[v] / 128 | 0;
              this.verticesZ[v] = tz * this.verticesZ[v] / 128 | 0;
              this.verticesX[v] += _Model.animateOriginX;
              this.verticesY[v] += _Model.animateOriginY;
              this.verticesZ[v] += _Model.animateOriginZ;
            }
          }
        }
        break;
      case 5 /* ALPHA */:
        if (this.faceLabels && this.faceAlphas) {
          for (const label of labels) {
            if (label < this.faceLabels.length) {
              for (const f of this.faceLabels[label]) {
                let newAlpha = (this.faceAlphas[f] & 255) + tx * 8;
                if (newAlpha < 0) {
                  newAlpha = 0;
                } else if (newAlpha > 255) {
                  newAlpha = 255;
                }
                this.faceAlphas[f] = newAlpha;
              }
            }
          }
        }
        break;
      case 7 /* LIGHT */:
        if (!this.faceLabels) {
          return;
        }
        for (const label of labels) {
          if (label >= this.faceLabels.length) {
            continue;
          }
          for (const f of this.faceLabels[label]) {
            const color = this.faceColors[f];
            let hue = color >> 10 & 63;
            let saturation = color >> 7 & 7;
            let lightness = color & 127;
            hue = hue + tx & 63;
            saturation += ty;
            if (saturation < 0) {
              saturation = 0;
            } else if (saturation > 7) {
              saturation = 7;
            }
            lightness += tz;
            if (lightness < 0) {
              lightness = 0;
            } else if (lightness > 127) {
              lightness = 127;
            }
            this.faceColors[f] = (hue << 10) + (saturation << 7) + lightness;
          }
          this.changedLight = true;
        }
        break;
    }
  }
  animateSkeletal(skeletalSeq, frame) {
    const skeletalBase = skeletalSeq.skeletalBase;
    if (skeletalBase) {
      skeletalBase.updateAnimMatrices(skeletalSeq, frame);
      this.transformSkeletal(skeletalBase, skeletalSeq.poseId, frame);
    }
    if (skeletalSeq.hasAlphaTransform) {
      this.transformSkeletalAlpha(skeletalSeq, frame);
    }
    this.invalidateBounds();
  }
  transformSkeletal(skeletalBase, poseId, frame) {
    if (!this.animMayaGroups) {
      return;
    }
    for (let v = 0; v < this.verticesCount; v++) {
      const group = this.animMayaGroups[v];
      if (group && group.length !== 0) {
        const scalings = this.animMayaScales[v];
        _Model.sketetalTransformMatrix.fill(0);
        for (let i = 0; i < group.length; i++) {
          const boneId = group[i];
          const bone = skeletalBase.getBone(boneId);
          if (bone) {
            const scale = scalings[i] / 255;
            import_gl_matrix.vec3.set(scaleVector, scale, scale, scale);
            import_gl_matrix.mat4.fromScaling(_Model.skeletalScalingMatrix, scaleVector);
            import_gl_matrix.mat4.mul(
              _Model.skeletalBoneMatrix,
              _Model.skeletalScalingMatrix,
              bone.getFinalMatrix(poseId)
            );
            import_gl_matrix.mat4.add(
              _Model.sketetalTransformMatrix,
              _Model.sketetalTransformMatrix,
              _Model.skeletalBoneMatrix
            );
          }
        }
        this.transformVertex(v, _Model.sketetalTransformMatrix);
      }
    }
  }
  transformVertex(v, m) {
    const vx = this.verticesX[v];
    const vy = -this.verticesY[v];
    const vz = -this.verticesZ[v];
    const scale = 1;
    this.verticesX[v] = Math.round(m[0] * vx + m[4] * vy + m[8] * vz + m[12] * scale);
    this.verticesY[v] = -Math.round(m[1] * vx + m[5] * vy + m[9] * vz + m[13] * scale);
    this.verticesZ[v] = -Math.round(m[2] * vx + m[6] * vy + m[10] * vz + m[14] * scale);
  }
  transformSkeletalAlpha(skeletalSeq, frame) {
    const base = skeletalSeq.base;
    for (let i = 0; i < base.count; i++) {
      const type = base.types[i];
      if (type === 5 /* ALPHA */ && skeletalSeq.curves && skeletalSeq.curves[i] && skeletalSeq.curves[i][0] && this.faceLabels && this.faceAlphas) {
        const curve = skeletalSeq.curves[i][0];
        const labels = base.labels[i];
        for (const l of labels) {
          if (l < this.faceLabels.length) {
            for (const f of this.faceLabels[l]) {
              let newAlpha = (this.faceAlphas[f] & 255) + curve.getValue(frame) * 255;
              if (newAlpha < 0) {
                newAlpha = 0;
              } else if (newAlpha > 255) {
                newAlpha = 255;
              }
              this.faceAlphas[f] = newAlpha;
            }
          }
        }
      }
    }
  }
  postAnimate() {
    if (this.changedLight) {
      for (let i = 0; i < this.faceCount; i++) {
        const textureId = this.faceTextures ? this.faceTextures[i] : -1;
        if (textureId !== -1) {
          continue;
        }
        const color = this.faceColors[i] & 65535;
        if (this.faceColors3[i] === -1) {
          const i_617_ = this.faceColors1[i] & ~131071;
          this.faceColors1[i] = i_617_ | ModelData.adjustLightness(color, i_617_ >> 17);
        } else if (this.faceColors3[i] !== -2) {
          let c = this.faceColors1[i] & ~131071;
          this.faceColors1[i] = c | ModelData.adjustLightness(color, c >> 17);
          c = this.faceColors2[i] & ~131071;
          this.faceColors2[i] = c | ModelData.adjustLightness(color, c >> 17);
          c = this.faceColors3[i] & ~131071;
          this.faceColors3[i] = c | ModelData.adjustLightness(color, c >> 17);
        }
      }
      this.changedLight = false;
    }
    this.invalidateBounds();
  }
};

// ../rs-party-dashboard/src/rs/model/TextureMapper.ts
var uvTemp = new Float32Array(2);
function computeTextureCoords(textureLoader, model) {
  const faceTextures = model.faceTextures;
  if (!faceTextures) {
    return void 0;
  }
  const verticesX = model.verticesX;
  const verticesY = model.verticesY;
  const verticesZ = model.verticesZ;
  const indices0 = model.indices1;
  const indices1 = model.indices2;
  const indices2 = model.indices3;
  const textureMappingP = model.textureMappingP;
  const textureMappingM = model.textureMappingM;
  const textureMappingN = model.textureMappingN;
  const faceCount = model.faceCount;
  const uvs = new Float32Array(faceCount * 6);
  const textureScales = calculateTextureScales(model);
  for (let i = 0; i < faceCount; i++) {
    let texCoord;
    if (model.textureCoords) {
      texCoord = model.textureCoords[i];
    } else {
      texCoord = -1;
    }
    let textureId = faceTextures[i];
    if (textureId !== -1 && !textureLoader.isSd(textureId)) {
      textureId = -1;
    }
    let u0 = 0;
    let v0 = 0;
    let u1 = 0;
    let v1 = 0;
    let u2 = 0;
    let v2 = 0;
    if (textureId !== -1) {
      let type = 0;
      if (texCoord !== -1) {
        texCoord &= 255;
        type = model.textureRenderTypes[texCoord];
      }
      const index0 = indices0[i];
      const index1 = indices1[i];
      const index2 = indices2[i];
      if (type === 0) {
        let p = index0;
        let m = index1;
        let n = index2;
        if (texCoord !== -1) {
          p = textureMappingP[texCoord];
          m = textureMappingM[texCoord];
          n = textureMappingN[texCoord];
        }
        const vx = verticesX[p];
        const vy = verticesY[p];
        const vz = verticesZ[p];
        const f_882_ = verticesX[m] - vx;
        const f_883_ = verticesY[m] - vy;
        const f_884_ = verticesZ[m] - vz;
        const f_885_ = verticesX[n] - vx;
        const f_886_ = verticesY[n] - vy;
        const f_887_ = verticesZ[n] - vz;
        const f_888_ = verticesX[index0] - vx;
        const f_889_ = verticesY[index0] - vy;
        const f_890_ = verticesZ[index0] - vz;
        const f_891_ = verticesX[index1] - vx;
        const f_892_ = verticesY[index1] - vy;
        const f_893_ = verticesZ[index1] - vz;
        const f_894_ = verticesX[index2] - vx;
        const f_895_ = verticesY[index2] - vy;
        const f_896_ = verticesZ[index2] - vz;
        const f_897_ = f_883_ * f_887_ - f_884_ * f_886_;
        const f_898_ = f_884_ * f_885_ - f_882_ * f_887_;
        const f_899_ = f_882_ * f_886_ - f_883_ * f_885_;
        let f_900_ = f_886_ * f_899_ - f_887_ * f_898_;
        let f_901_ = f_887_ * f_897_ - f_885_ * f_899_;
        let f_902_ = f_885_ * f_898_ - f_886_ * f_897_;
        let f_903_ = 1 / (f_900_ * f_882_ + f_901_ * f_883_ + f_902_ * f_884_);
        u0 = (f_900_ * f_888_ + f_901_ * f_889_ + f_902_ * f_890_) * f_903_;
        u1 = (f_900_ * f_891_ + f_901_ * f_892_ + f_902_ * f_893_) * f_903_;
        u2 = (f_900_ * f_894_ + f_901_ * f_895_ + f_902_ * f_896_) * f_903_;
        f_900_ = f_883_ * f_899_ - f_884_ * f_898_;
        f_901_ = f_884_ * f_897_ - f_882_ * f_899_;
        f_902_ = f_882_ * f_898_ - f_883_ * f_897_;
        f_903_ = 1 / (f_900_ * f_885_ + f_901_ * f_886_ + f_902_ * f_887_);
        v0 = (f_900_ * f_888_ + f_901_ * f_889_ + f_902_ * f_890_) * f_903_;
        v1 = (f_900_ * f_891_ + f_901_ * f_892_ + f_902_ * f_893_) * f_903_;
        v2 = (f_900_ * f_894_ + f_901_ * f_895_ + f_902_ * f_896_) * f_903_;
        if (u1 - u0 > 0.99 && u1 - u0 < 1.1) {
          u1 = 1;
        }
        if (u2 - u1 > 0.99 && u2 - u1 < 1.1) {
          u2 = 1;
        }
        if (u0 - u2 > 0.99 && u0 - u2 < 1.1) {
          u0 = 1;
        }
        if (u0 - u1 > 0.99 && u0 - u1 < 1.1) {
          u0 = 1;
        }
        if (u1 - u2 > 0.99 && u1 - u2 < 1.1) {
          u1 = 1;
        }
        if (u2 - u0 > 0.99 && u2 - u0 < 1.1) {
          u2 = 1;
        }
      } else if (textureScales.centerXs && textureScales.centerYs && textureScales.centerZs && textureScales.fs) {
        const centerX = textureScales.centerXs[texCoord];
        const centerY = textureScales.centerYs[texCoord];
        const centerZ = textureScales.centerZs[texCoord];
        const scales = textureScales.fs[texCoord];
        const direction = model.textureDirection[texCoord];
        const speed = model.textureSpeed[texCoord] / 256;
        if (type === 1) {
          const scaleZ = model.textureScaleZ[texCoord] / 1024;
          method2431(
            model.verticesX[index0],
            model.verticesY[index0],
            model.verticesZ[index0],
            centerX,
            centerY,
            centerZ,
            scales,
            scaleZ,
            direction,
            speed,
            uvTemp
          );
          u0 = uvTemp[0];
          v0 = uvTemp[1];
          method2431(
            model.verticesX[index1],
            model.verticesY[index1],
            model.verticesZ[index1],
            centerX,
            centerY,
            centerZ,
            scales,
            scaleZ,
            direction,
            speed,
            uvTemp
          );
          u1 = uvTemp[0];
          v1 = uvTemp[1];
          method2431(
            model.verticesX[index2],
            model.verticesY[index2],
            model.verticesZ[index2],
            centerX,
            centerY,
            centerZ,
            scales,
            scaleZ,
            direction,
            speed,
            uvTemp
          );
          u2 = uvTemp[0];
          v2 = uvTemp[1];
          const scaleZHalf = scaleZ / 2;
          if ((direction & 1) === 0) {
            if (u1 - u0 > scaleZHalf) {
              u1 -= scaleZ;
            } else if (u0 - u1 > scaleZHalf) {
              u1 += scaleZ;
            }
            if (u2 - u0 > scaleZHalf) {
              u2 -= scaleZ;
            } else if (u0 - u2 > scaleZHalf) {
              u2 += scaleZ;
            }
          } else {
            if (v1 - v0 > scaleZHalf) {
              v1 -= scaleZ;
            } else if (v0 - v1 > scaleZHalf) {
              v1 += scaleZ;
            }
            if (v2 - v0 > scaleZHalf) {
              v2 -= scaleZ;
            } else if (v0 - v2 > scaleZHalf) {
              v2 += scaleZ;
            }
          }
        } else if (type === 2) {
          const uOffset = model.textureTransU[texCoord] / 256;
          const vOffset = model.textureTransV[texCoord] / 256;
          const dx1 = model.verticesX[index1] - model.verticesX[index0];
          const dy1 = model.verticesY[index1] - model.verticesY[index0];
          const dz1 = model.verticesZ[index1] - model.verticesZ[index0];
          const dx2 = model.verticesX[index2] - model.verticesX[index0];
          const dy2 = model.verticesY[index2] - model.verticesY[index0];
          const dz2 = model.verticesZ[index2] - model.verticesZ[index0];
          const vx = dy1 * dz2 - dy2 * dz1;
          const vy = dz1 * dx2 - dz2 * dx1;
          const vz = dx1 * dy2 - dx2 * dy1;
          const scaleX = 64 / model.textureScaleX[texCoord];
          const scaleY = 64 / model.textureScaleY[texCoord];
          const scaleZ = 64 / model.textureScaleZ[texCoord];
          const f_829_ = (vx * scales[0] + vy * scales[1] + vz * scales[2]) / scaleX;
          const f_830_ = (vx * scales[3] + vy * scales[4] + vz * scales[5]) / scaleY;
          const f_831_ = (vx * scales[6] + vy * scales[7] + vz * scales[8]) / scaleZ;
          const scaleType = method2437(f_829_, f_830_, f_831_);
          method2416(
            model.verticesX[index0],
            model.verticesY[index0],
            model.verticesZ[index0],
            centerX,
            centerY,
            centerZ,
            scaleType,
            scales,
            direction,
            speed,
            uOffset,
            vOffset,
            uvTemp
          );
          u0 = uvTemp[0];
          v0 = uvTemp[1];
          method2416(
            model.verticesX[index1],
            model.verticesY[index1],
            model.verticesZ[index1],
            centerX,
            centerY,
            centerZ,
            scaleType,
            scales,
            direction,
            speed,
            uOffset,
            vOffset,
            uvTemp
          );
          u1 = uvTemp[0];
          v1 = uvTemp[1];
          method2416(
            model.verticesX[index2],
            model.verticesY[index2],
            model.verticesZ[index2],
            centerX,
            centerY,
            centerZ,
            scaleType,
            scales,
            direction,
            speed,
            uOffset,
            vOffset,
            uvTemp
          );
          u2 = uvTemp[0];
          v2 = uvTemp[1];
        } else if (type === 3) {
          method2434(
            model.verticesX[index0],
            model.verticesY[index0],
            model.verticesZ[index0],
            centerX,
            centerY,
            centerZ,
            scales,
            direction,
            speed,
            uvTemp
          );
          u0 = uvTemp[0];
          v0 = uvTemp[1];
          method2434(
            model.verticesX[index1],
            model.verticesY[index1],
            model.verticesZ[index1],
            centerX,
            centerY,
            centerZ,
            scales,
            direction,
            speed,
            uvTemp
          );
          u1 = uvTemp[0];
          v1 = uvTemp[1];
          method2434(
            model.verticesX[index2],
            model.verticesY[index2],
            model.verticesZ[index2],
            centerX,
            centerY,
            centerZ,
            scales,
            direction,
            speed,
            uvTemp
          );
          u2 = uvTemp[0];
          v2 = uvTemp[1];
          if ((direction & 1) == 0) {
            if (u1 - u0 > 0.5) {
              u1--;
            } else if (u0 - u1 > 0) {
              u1++;
            }
            if (u2 - u0 > 0.5) {
              u2--;
            } else if (u0 - u2 > 0.5) {
              u2++;
            }
          } else {
            if (v1 - v0 > 0.5) {
              v1--;
            } else if (v0 - v1 > 0.5) {
              v1++;
            }
            if (v2 - v0 > 0.5) {
              v2--;
            } else if (v0 - v2 > 0.5) {
              v2++;
            }
          }
        }
      }
    }
    const uvIndex = i * 6;
    uvs[uvIndex] = u0;
    uvs[uvIndex + 1] = v0;
    uvs[uvIndex + 2] = u1;
    uvs[uvIndex + 3] = v1;
    uvs[uvIndex + 4] = u2;
    uvs[uvIndex + 5] = v2;
  }
  return uvs;
}
function method2431(vx, vy, vz, centerX, centerY, centerZ, scales, scaleZ, direction, speed, out) {
  vx -= centerX;
  vy -= centerY;
  vz -= centerZ;
  const f_651_ = vx * scales[0] + vy * scales[1] + vz * scales[2];
  const f_652_ = vx * scales[3] + vy * scales[4] + vz * scales[5];
  const f_653_ = vx * scales[6] + vy * scales[7] + vz * scales[8];
  let u = Math.atan2(f_651_, f_653_) / 6.2831855 + 0.5;
  if (scaleZ !== 1) {
    u *= scaleZ;
  }
  let v = f_652_ + 0.5 + speed;
  if (direction === 1) {
    const f_656_ = u;
    u = -v;
    v = f_656_;
  } else if (direction === 2) {
    u = -u;
    v = -v;
  } else if (direction === 3) {
    const f_657_ = u;
    u = v;
    v = -f_657_;
  }
  out[0] = u;
  out[1] = v;
}
function method2437(f, f_715_, f_716_) {
  const f_717_ = f < 0 ? -f : f;
  const f_718_ = f_715_ < 0 ? -f_715_ : f_715_;
  const f_719_ = f_716_ < 0 ? -f_716_ : f_716_;
  if (f_718_ > f_717_ && f_718_ > f_719_) {
    if (f_715_ > 0) {
      return 0;
    }
    return 1;
  }
  if (f_719_ > f_717_ && f_719_ > f_718_) {
    if (f_716_ > 0) {
      return 2;
    }
    return 3;
  }
  if (f > 0) {
    return 4;
  }
  return 5;
}
function method2416(vx, vy, vz, centerX, centerY, centerZ, scaleType, scales, direction, speed, uOffset, vOffset, out) {
  vx -= centerX;
  vy -= centerY;
  vz -= centerZ;
  const f_223_ = vx * scales[0] + vy * scales[1] + vz * scales[2];
  const f_224_ = vx * scales[3] + vy * scales[4] + vz * scales[5];
  const f_225_ = vx * scales[6] + vy * scales[7] + vz * scales[8];
  let u;
  let v;
  if (scaleType === 0) {
    u = f_223_ + speed + 0.5;
    v = -f_225_ + vOffset + 0.5;
  } else if (scaleType === 1) {
    u = f_223_ + speed + 0.5;
    v = f_225_ + vOffset + 0.5;
  } else if (scaleType === 2) {
    u = -f_223_ + speed + 0.5;
    v = -f_224_ + uOffset + 0.5;
  } else if (scaleType === 3) {
    u = f_223_ + speed + 0.5;
    v = -f_224_ + uOffset + 0.5;
  } else if (scaleType === 4) {
    u = f_225_ + vOffset + 0.5;
    v = -f_224_ + uOffset + 0.5;
  } else {
    u = -f_225_ + vOffset + 0.5;
    v = -f_224_ + uOffset + 0.5;
  }
  if (direction === 1) {
    const f_228_ = u;
    u = -v;
    v = f_228_;
  } else if (direction === 2) {
    u = -u;
    v = -v;
  } else if (direction === 3) {
    const f_229_ = u;
    u = v;
    v = -f_229_;
  }
  out[0] = u;
  out[1] = v;
}
function method2434(vx, vy, vz, centerX, centerY, centerZ, scales, direction, speed, out) {
  vx -= centerX;
  vy -= centerY;
  vz -= centerZ;
  const f_682_ = vx * scales[0] + vy * scales[1] + vz * scales[2];
  const f_683_ = vx * scales[3] + vy * scales[4] + vz * scales[5];
  const f_684_ = vx * scales[6] + vy * scales[7] + vz * scales[8];
  const f_685_ = Math.sqrt(f_682_ * f_682_ + f_683_ * f_683_ + f_684_ * f_684_);
  let u = Math.atan2(f_682_, f_684_) / 6.2831855 + 0.5;
  let v = Math.asin(f_683_ / f_685_) / 3.1415927 + 0.5 + speed;
  if (direction === 1) {
    const f_688_ = u;
    u = -v;
    v = f_688_;
  } else if (direction === 2) {
    u = -u;
    v = -v;
  } else if (direction === 3) {
    const f_689_ = u;
    u = v;
    v = -f_689_;
  }
  out[0] = u;
  out[1] = v;
}
var TextureScales = class {
  constructor(centerXs, centerYs, centerZs, fs) {
    this.centerXs = centerXs;
    this.centerYs = centerYs;
    this.centerZs = centerZs;
    this.fs = fs;
  }
};
function calculateTextureScales(model) {
  let centerXs;
  let centerYs;
  let centerZs;
  let fs;
  if (model.textureCoords) {
    const textureFaceCount = model.textureFaceCount;
    const minX = new Int32Array(textureFaceCount);
    const maxX = new Int32Array(textureFaceCount);
    const minY = new Int32Array(textureFaceCount);
    const maxY = new Int32Array(textureFaceCount);
    const minZ = new Int32Array(textureFaceCount);
    const maxZ = new Int32Array(textureFaceCount);
    for (let i = 0; i < textureFaceCount; i++) {
      minX[i] = 2147483647;
      maxX[i] = -2147483647;
      minY[i] = 2147483647;
      maxY[i] = -2147483647;
      minZ[i] = 2147483647;
      maxZ[i] = -2147483647;
    }
    fs = new Array(textureFaceCount);
    for (let i = 0; i < model.faceCount; i++) {
      if (model.textureCoords[i] === -1) {
        continue;
      }
      const texCoord = model.textureCoords[i] & 255;
      for (let v = 0; v < 3; v++) {
        let vertexIndex;
        if (v === 0) {
          vertexIndex = model.indices1[i];
        } else if (v === 1) {
          vertexIndex = model.indices2[i];
        } else {
          vertexIndex = model.indices3[i];
        }
        const vx = model.verticesX[vertexIndex];
        const vy = model.verticesY[vertexIndex];
        const vz = model.verticesZ[vertexIndex];
        if (minX[texCoord] > vx) {
          minX[texCoord] = vx;
        }
        if (vx > maxX[texCoord]) {
          maxX[texCoord] = vx;
        }
        if (minY[texCoord] > vy) {
          minY[texCoord] = vy;
        }
        if (maxY[texCoord] < vy) {
          maxY[texCoord] = vy;
        }
        if (minZ[texCoord] > vz) {
          minZ[texCoord] = vz;
        }
        if (maxZ[texCoord] < vz) {
          maxZ[texCoord] = vz;
        }
      }
    }
    centerXs = new Int32Array(textureFaceCount);
    centerYs = new Int32Array(textureFaceCount);
    centerZs = new Int32Array(textureFaceCount);
    for (let i = 0; i < textureFaceCount; i++) {
      const type = model.textureRenderTypes[i];
      if (type > 0) {
        centerXs[i] = (minX[i] + maxX[i]) / 2;
        centerYs[i] = (minY[i] + maxY[i]) / 2;
        centerZs[i] = (minZ[i] + maxZ[i]) / 2;
        let scaleX;
        let scaleY;
        let scaleZ;
        if (type === 1) {
          const scaleX0 = model.textureScaleX[i];
          scaleY = 64 / model.textureScaleY[i];
          if (scaleX0 === 0) {
            scaleZ = 1;
            scaleX = 1;
          } else if (scaleX0 <= 0) {
            scaleZ = 1;
            scaleX = -scaleX0 / 1024;
          } else {
            scaleX = 1;
            scaleZ = scaleX0 / 1024;
          }
        } else if (type === 2) {
          scaleX = 64 / model.textureScaleX[i];
          scaleY = 64 / model.textureScaleY[i];
          scaleZ = 64 / model.textureScaleZ[i];
        } else {
          scaleX = model.textureScaleX[i] / 1024;
          scaleY = model.textureScaleY[i] / 1024;
          scaleZ = model.textureScaleZ[i] / 1024;
        }
        fs[i] = method2424(
          model.textureMappingP[i],
          model.textureMappingM[i],
          model.textureMappingN[i],
          model.textureRotation[i] & 255,
          scaleX,
          scaleY,
          scaleZ
        );
      }
    }
  }
  return new TextureScales(centerXs, centerYs, centerZs, fs);
}
function method2424(p, m, n, rotation, scaleX, scaleY, scaleZ) {
  const fs = new Float32Array(9);
  let f_552_ = 1;
  let f_553_ = 0;
  let f_554_ = m / 32767;
  let f_555_ = -Math.sqrt(1 - f_554_ * f_554_);
  let f_556_ = 1 - f_554_;
  const f_557_ = Math.sqrt(p * p + n * n);
  if (f_557_ !== 0) {
    f_552_ = -n / f_557_;
    f_553_ = p / f_557_;
  }
  fs[0] = f_554_ + f_552_ * f_552_ * f_556_;
  fs[1] = f_553_ * f_555_;
  fs[2] = f_553_ * f_552_ * f_556_;
  fs[3] = -f_553_ * f_555_;
  fs[4] = f_554_;
  fs[5] = f_552_ * f_555_;
  fs[6] = f_552_ * f_553_ * f_556_;
  fs[7] = -f_552_ * f_555_;
  fs[8] = f_554_ + f_553_ * f_553_ * f_556_;
  const fs_558_ = new Float32Array(9);
  f_554_ = Math.cos(rotation * 0.024543693);
  f_555_ = Math.sin(rotation * 0.024543693);
  f_556_ = 1 - f_554_;
  fs_558_[0] = f_554_;
  fs_558_[1] = 0;
  fs_558_[2] = f_555_;
  fs_558_[3] = 0;
  fs_558_[4] = 1;
  fs_558_[5] = 0;
  fs_558_[6] = -f_555_;
  fs_558_[7] = 0;
  fs_558_[8] = f_554_;
  const fs_559_ = new Float32Array(9);
  fs_559_[0] = fs_558_[0] * fs[0] + fs_558_[1] * fs[3] + fs_558_[2] * fs[6];
  fs_559_[1] = fs_558_[0] * fs[1] + fs_558_[1] * fs[4] + fs_558_[2] * fs[7];
  fs_559_[2] = fs_558_[0] * fs[2] + fs_558_[1] * fs[5] + fs_558_[2] * fs[8];
  fs_559_[3] = fs_558_[3] * fs[0] + fs_558_[4] * fs[3] + fs_558_[5] * fs[6];
  fs_559_[4] = fs_558_[3] * fs[1] + fs_558_[4] * fs[4] + fs_558_[5] * fs[7];
  fs_559_[5] = fs_558_[3] * fs[2] + fs_558_[4] * fs[5] + fs_558_[5] * fs[8];
  fs_559_[6] = fs_558_[6] * fs[0] + fs_558_[7] * fs[3] + fs_558_[8] * fs[6];
  fs_559_[7] = fs_558_[6] * fs[1] + fs_558_[7] * fs[4] + fs_558_[8] * fs[7];
  fs_559_[8] = fs_558_[6] * fs[2] + fs_558_[7] * fs[5] + fs_558_[8] * fs[8];
  fs_559_[0] *= scaleX;
  fs_559_[1] *= scaleX;
  fs_559_[2] *= scaleX;
  fs_559_[3] *= scaleY;
  fs_559_[4] *= scaleY;
  fs_559_[5] *= scaleY;
  fs_559_[6] *= scaleZ;
  fs_559_[7] *= scaleZ;
  fs_559_[8] *= scaleZ;
  return fs_559_;
}

// ../rs-party-dashboard/src/rs/model/VertexNormal.ts
var VertexNormal = class _VertexNormal {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.magnitude = 0;
  }
  static copy(other) {
    const normal = new _VertexNormal();
    normal.x = other.x;
    normal.y = other.y;
    normal.z = other.z;
    normal.magnitude = other.magnitude;
    return normal;
  }
};

// ../rs-party-dashboard/src/rs/model/ModelData.ts
var ModelData = class _ModelData extends Entity {
  static {
    this.mergeModelNormalsCount = 0;
  }
  static {
    this.mergedNormalsModel0Cache = new Int32Array(1e4);
  }
  static {
    this.mergedNormalsModel1Cache = new Int32Array(1e4);
  }
  static merge(models, count) {
    const model = new _ModelData();
    model.merge(models, count);
    return model;
  }
  static decode(data) {
    const model = new _ModelData();
    model.decode(data);
    return model;
  }
  static decodeLegacy(loader, meta) {
    const model = new _ModelData();
    model.decodeLegacy(loader, meta);
    return model;
  }
  static copyFrom(model, shallowIndices, shallowVertices, shallowColors, shallowTextures) {
    const copy = new _ModelData();
    copy.copyFrom(model, shallowIndices, shallowVertices, shallowColors, shallowTextures);
    return copy;
  }
  // TODO: replace with the one from ColorUtil
  static adjustLightness(hsl, lightness) {
    lightness = (hsl & 127) * lightness >> 7;
    if (lightness < 2) {
      lightness = 2;
    } else if (lightness > 126) {
      lightness = 126;
    }
    return (hsl & 65408) + lightness;
  }
  static clampLightness(lightness) {
    if (lightness < 2) {
      lightness = 2;
    } else if (lightness > 126) {
      lightness = 126;
    }
    return lightness | 0;
  }
  static mergeNormals(model0, model1, offsetX, offsetY, offsetZ, hideOccludedFaces) {
    model0.calculateBounds();
    model0.calculateVertexNormals();
    model1.calculateBounds();
    model1.calculateVertexNormals();
    if (!model0.normals || !model1.normals) {
      return;
    }
    _ModelData.mergeModelNormalsCount++;
    const verticesY0 = model0.contourVerticesY || model0.verticesY;
    const verticesY1 = model1.contourVerticesY || model1.verticesY;
    let mergedCount = 0;
    for (let v0 = 0; v0 < model0.usedVertexCount; v0++) {
      const normal0 = model0.normals[v0];
      if (normal0.magnitude === 0) {
        continue;
      }
      const y = verticesY0[v0] - offsetY;
      if (y > model1.minHeight) {
        continue;
      }
      const x = model0.verticesX[v0] - offsetX;
      if (x < model1.minX || x > model1.maxX) {
        continue;
      }
      const z = model0.verticesZ[v0] - offsetZ;
      if (z < model1.minZ || z > model1.maxZ) {
        continue;
      }
      for (let v1 = 0; v1 < model1.usedVertexCount; v1++) {
        const normal1 = model1.normals[v1];
        if (x !== model1.verticesX[v1] || z !== model1.verticesZ[v1] || y !== verticesY1[v1] || normal1.magnitude === 0) {
          continue;
        }
        if (!model0.mergedNormals) {
          model0.mergedNormals = new Array(model0.usedVertexCount);
        }
        if (!model1.mergedNormals) {
          model1.mergedNormals = new Array(model1.usedVertexCount);
        }
        let mergedNormal0 = model0.mergedNormals[v0];
        if (!mergedNormal0) {
          mergedNormal0 = model0.mergedNormals[v0] = VertexNormal.copy(normal0);
        }
        let mergedNormal1 = model1.mergedNormals[v1];
        if (!mergedNormal1) {
          mergedNormal1 = model1.mergedNormals[v1] = VertexNormal.copy(normal1);
        }
        mergedNormal0.x += normal1.x;
        mergedNormal0.y += normal1.y;
        mergedNormal0.z += normal1.z;
        mergedNormal0.magnitude += normal1.magnitude;
        mergedNormal1.x += normal0.x;
        mergedNormal1.y += normal0.y;
        mergedNormal1.z += normal0.z;
        mergedNormal1.magnitude += normal0.magnitude;
        mergedCount++;
        _ModelData.mergedNormalsModel0Cache[v0] = _ModelData.mergeModelNormalsCount;
        _ModelData.mergedNormalsModel1Cache[v1] = _ModelData.mergeModelNormalsCount;
      }
    }
    if (mergedCount >= 3 && hideOccludedFaces) {
      for (let i = 0; i < model0.faceCount; i++) {
        if (_ModelData.mergedNormalsModel0Cache[model0.indices1[i]] === _ModelData.mergeModelNormalsCount && _ModelData.mergedNormalsModel0Cache[model0.indices2[i]] === _ModelData.mergeModelNormalsCount && _ModelData.mergedNormalsModel0Cache[model0.indices3[i]] === _ModelData.mergeModelNormalsCount) {
          if (!model0.faceRenderTypes) {
            model0.faceRenderTypes = new Int8Array(model0.faceCount);
          }
          model0.faceRenderTypes[i] = 2;
        }
      }
      for (let i = 0; i < model1.faceCount; i++) {
        if (_ModelData.mergedNormalsModel1Cache[model1.indices1[i]] === _ModelData.mergeModelNormalsCount && _ModelData.mergedNormalsModel1Cache[model1.indices2[i]] === _ModelData.mergeModelNormalsCount && _ModelData.mergedNormalsModel1Cache[model1.indices3[i]] === _ModelData.mergeModelNormalsCount) {
          if (!model1.faceRenderTypes) {
            model1.faceRenderTypes = new Int8Array(model1.faceCount);
          }
          model1.faceRenderTypes[i] = 2;
        }
      }
    }
  }
  constructor() {
    super();
    this.version = -1;
    this.verticesCount = 0;
    this.usedVertexCount = 0;
    this.faceCount = 0;
    this.priority = 0;
    this.isBoundsCalculated = false;
  }
  canMergeNormals() {
    return true;
  }
  mergeNormals(entity, offsetX, offsetY, offsetZ, hideOccluded) {
    if (!(entity instanceof _ModelData)) {
      return;
    }
    _ModelData.mergeNormals(this, entity, offsetX, offsetY, offsetZ, hideOccluded);
  }
  merge(models, count) {
    this.version = 12;
    this.verticesCount = 0;
    this.faceCount = 0;
    this.textureFaceCount = 0;
    this.priority = -1;
    let hasRenderTypes = false;
    let hasRenderPriorities = false;
    let hasAlphas = false;
    let hasFaceSkins = false;
    let hasTextures = false;
    let hasTextureCoords = false;
    let hasMayaGroups = false;
    for (let i = 0; i < count; i++) {
      const model = models[i];
      if (model) {
        this.verticesCount += model.verticesCount;
        this.faceCount += model.faceCount;
        this.textureFaceCount += model.textureFaceCount;
        if (model.faceRenderPriorities) {
          hasRenderPriorities = true;
        } else {
          if (this.priority === -1) {
            this.priority = model.priority;
          }
          if (this.priority !== model.priority) {
            hasRenderPriorities = true;
          }
        }
        hasRenderTypes ||= !!model.faceRenderTypes;
        hasAlphas ||= !!model.faceAlphas;
        hasFaceSkins ||= !!model.faceSkins;
        hasTextures ||= !!model.faceTextures;
        hasTextureCoords ||= !!model.textureCoords;
        hasMayaGroups ||= !!model.animMayaGroups;
      }
    }
    this.verticesX = new Int32Array(this.verticesCount);
    this.verticesY = new Int32Array(this.verticesCount);
    this.verticesZ = new Int32Array(this.verticesCount);
    this.vertexSkins = new Int32Array(this.verticesCount);
    this.indices1 = new Int32Array(this.faceCount);
    this.indices2 = new Int32Array(this.faceCount);
    this.indices3 = new Int32Array(this.faceCount);
    if (hasRenderTypes) {
      this.faceRenderTypes = new Int8Array(this.faceCount);
    }
    if (hasRenderPriorities) {
      this.faceRenderPriorities = new Int8Array(this.faceCount);
    }
    if (hasAlphas) {
      this.faceAlphas = new Int8Array(this.faceCount);
    }
    if (hasFaceSkins) {
      this.faceSkins = new Int32Array(this.faceCount);
    }
    if (hasTextures) {
      this.faceTextures = new Int16Array(this.faceCount);
    }
    if (hasTextureCoords) {
      this.textureCoords = new Int8Array(this.faceCount);
    }
    if (hasMayaGroups) {
      this.animMayaGroups = new Array(this.verticesCount);
      this.animMayaScales = new Array(this.verticesCount);
    }
    this.faceColors = new Uint16Array(this.faceCount);
    if (this.textureFaceCount > 0) {
      this.textureRenderTypes = new Int8Array(this.textureFaceCount);
      this.textureMappingP = new Int16Array(this.textureFaceCount);
      this.textureMappingM = new Int16Array(this.textureFaceCount);
      this.textureMappingN = new Int16Array(this.textureFaceCount);
      this.textureScaleX = new Int32Array(this.textureFaceCount);
      this.textureScaleY = new Int32Array(this.textureFaceCount);
      this.textureScaleZ = new Int32Array(this.textureFaceCount);
      this.textureRotation = new Int8Array(this.textureFaceCount);
      this.textureDirection = new Int8Array(this.textureFaceCount);
      this.textureSpeed = new Int32Array(this.textureFaceCount);
      this.textureTransU = new Int32Array(this.textureFaceCount);
      this.textureTransV = new Int32Array(this.textureFaceCount);
    }
    this.verticesCount = 0;
    this.faceCount = 0;
    this.textureFaceCount = 0;
    for (let i = 0; i < count; i++) {
      const model = models[i];
      if (!model) {
        continue;
      }
      for (let f = 0; f < model.faceCount; f++) {
        if (hasRenderTypes && model.faceRenderTypes && this.faceRenderTypes) {
          this.faceRenderTypes[this.faceCount] = model.faceRenderTypes[f];
        }
        if (hasRenderPriorities) {
          if (model.faceRenderPriorities) {
            this.faceRenderPriorities[this.faceCount] = model.faceRenderPriorities[f];
          } else {
            this.faceRenderPriorities[this.faceCount] = model.priority;
          }
        }
        if (hasAlphas && model.faceAlphas) {
          this.faceAlphas[this.faceCount] = model.faceAlphas[f];
        }
        if (hasFaceSkins && this.faceSkins) {
          if (model.faceSkins) {
            this.faceSkins[this.faceCount] = model.faceSkins[f];
          } else {
            this.faceSkins[this.faceCount] = -1;
          }
        }
        if (hasTextures && this.faceTextures) {
          if (model.faceTextures) {
            this.faceTextures[this.faceCount] = model.faceTextures[f];
          } else {
            this.faceTextures[this.faceCount] = -1;
          }
        }
        if (hasTextureCoords && this.textureCoords) {
          if (model.textureCoords && model.textureCoords[f] !== -1) {
            this.textureCoords[this.faceCount] = this.textureFaceCount + model.textureCoords[f];
          } else {
            this.textureCoords[this.faceCount] = -1;
          }
        }
        this.faceColors[this.faceCount] = model.faceColors[f];
        this.indices1[this.faceCount] = this.copyVertex(model, model.indices1[f]);
        this.indices2[this.faceCount] = this.copyVertex(model, model.indices2[f]);
        this.indices3[this.faceCount] = this.copyVertex(model, model.indices3[f]);
        this.faceCount++;
      }
      for (let f = 0; f < model.textureFaceCount; f++) {
        const type = this.textureRenderTypes[this.textureFaceCount] = model.textureRenderTypes[f];
        if (type === 0) {
          this.textureMappingP[this.textureFaceCount] = this.copyVertex(
            model,
            model.textureMappingP[f]
          );
          this.textureMappingM[this.textureFaceCount] = this.copyVertex(
            model,
            model.textureMappingM[f]
          );
          this.textureMappingN[this.textureFaceCount] = this.copyVertex(
            model,
            model.textureMappingN[f]
          );
        }
        if (type >= 1 && type <= 3) {
          this.textureMappingP[this.textureFaceCount] = model.textureMappingP[f];
          this.textureMappingM[this.textureFaceCount] = model.textureMappingM[f];
          this.textureMappingN[this.textureFaceCount] = model.textureMappingN[f];
          this.textureScaleX[this.textureFaceCount] = model.textureScaleX[f];
          this.textureScaleY[this.textureFaceCount] = model.textureScaleY[f];
          this.textureScaleZ[this.textureFaceCount] = model.textureScaleZ[f];
          this.textureRotation[this.textureFaceCount] = model.textureRotation[f];
          this.textureDirection[this.textureFaceCount] = model.textureDirection[f];
          this.textureSpeed[this.textureFaceCount] = model.textureSpeed[f];
        }
        if (type === 2) {
          this.textureTransU[this.textureFaceCount] = model.textureTransU[f];
          this.textureTransV[this.textureFaceCount] = model.textureTransV[f];
        }
        this.textureFaceCount++;
      }
    }
    this.usedVertexCount = this.verticesCount;
  }
  copyVertex(model, index) {
    let newVertexCount = -1;
    const vertX = model.verticesX[index];
    const vertY = model.verticesY[index];
    const vertZ = model.verticesZ[index];
    for (let i = 0; i < this.verticesCount; i++) {
      if (vertX === this.verticesX[i] && vertY === this.verticesY[i] && vertZ === this.verticesZ[i]) {
        newVertexCount = i;
        break;
      }
    }
    if (newVertexCount === -1) {
      this.verticesX[this.verticesCount] = vertX;
      this.verticesY[this.verticesCount] = vertY;
      this.verticesZ[this.verticesCount] = vertZ;
      if (model.vertexSkins && this.vertexSkins) {
        this.vertexSkins[this.verticesCount] = model.vertexSkins[index];
      } else if (this.vertexSkins) {
        this.vertexSkins[this.verticesCount] = -1;
      }
      if (model.animMayaGroups) {
        this.animMayaGroups[this.verticesCount] = model.animMayaGroups[index];
        this.animMayaScales[this.verticesCount] = model.animMayaScales[index];
      }
      newVertexCount = this.verticesCount++;
    }
    return newVertexCount;
  }
  decode(data) {
    if (data[data.length - 1] === -3 && data[data.length - 2] === -1) {
      this.decodeV3(data);
      this.usedVertexCount = this.verticesCount;
    } else if (data[data.length - 1] === -2 && data[data.length - 2] === -1) {
      this.decodeV2(data);
      this.usedVertexCount = this.verticesCount;
    } else if (data[data.length - 1] === -1 && data[data.length - 2] === -1) {
      this.decodeV1(data);
    } else {
      this.decodeOld(data);
    }
  }
  decodeV3(data) {
    this.version = 3;
    const buf1 = new ByteBuffer(data);
    const buf2 = new ByteBuffer(data);
    const buf3 = new ByteBuffer(data);
    const buf4 = new ByteBuffer(data);
    const buf5 = new ByteBuffer(data);
    const buf6 = new ByteBuffer(data);
    const buf7 = new ByteBuffer(data);
    buf1.offset = data.length - 26;
    const vertexCount = buf1.readUnsignedShort();
    const faceCount = buf1.readUnsignedShort();
    const texTriangleCount = buf1.readUnsignedByte();
    const var12 = buf1.readUnsignedByte();
    const var13 = buf1.readUnsignedByte();
    const var14 = buf1.readUnsignedByte();
    const var15 = buf1.readUnsignedByte();
    const var16 = buf1.readUnsignedByte();
    const var17 = buf1.readUnsignedByte();
    const hasMayaGroups = buf1.readUnsignedByte();
    const var19 = buf1.readUnsignedShort();
    const var20 = buf1.readUnsignedShort();
    const var21 = buf1.readUnsignedShort();
    const var22 = buf1.readUnsignedShort();
    const var23 = buf1.readUnsignedShort();
    const var24 = buf1.readUnsignedShort();
    let simpleTextureFaceCount = 0;
    let complexTextureFaceCount = 0;
    let cubeTextureFaceCount = 0;
    if (texTriangleCount > 0) {
      this.textureRenderTypes = new Int8Array(texTriangleCount);
      buf1.offset = 0;
      for (let i = 0; i < texTriangleCount; i++) {
        const type = this.textureRenderTypes[i] = buf1.readByte();
        if (type === 0) {
          simpleTextureFaceCount++;
        }
        if (type >= 1 && type <= 3) {
          complexTextureFaceCount++;
        }
        if (type === 2) {
          cubeTextureFaceCount++;
        }
      }
    }
    let var28 = texTriangleCount + vertexCount;
    const var30 = var28;
    if (var12 === 1) {
      var28 += faceCount;
    }
    const var31 = var28;
    var28 += faceCount;
    const var32 = var28;
    if (var13 === 255) {
      var28 += faceCount;
    }
    const var33 = var28;
    if (var15 === 1) {
      var28 += faceCount;
    }
    const var34 = var28;
    var28 += var24;
    const var35 = var28;
    if (var14 === 1) {
      var28 += faceCount;
    }
    const var36 = var28;
    var28 += var22;
    const var37 = var28;
    if (var16 === 1) {
      var28 += faceCount * 2;
    }
    const var38 = var28;
    var28 += var23;
    const var39 = var28;
    var28 += faceCount * 2;
    const var40 = var28;
    var28 += var19;
    const var41 = var28;
    var28 += var20;
    const var42 = var28;
    var28 += var21;
    const var43 = var28;
    var28 += simpleTextureFaceCount * 6;
    const var44 = var28;
    var28 += complexTextureFaceCount * 6;
    const var45 = var28;
    var28 += complexTextureFaceCount * 6;
    const var46 = var28;
    var28 += complexTextureFaceCount * 2;
    const var47 = var28;
    var28 += complexTextureFaceCount;
    const var48 = var28;
    var28 += complexTextureFaceCount * 2 + cubeTextureFaceCount * 2;
    this.verticesCount = vertexCount;
    this.faceCount = faceCount;
    this.textureFaceCount = texTriangleCount;
    this.verticesX = new Int32Array(vertexCount);
    this.verticesY = new Int32Array(vertexCount);
    this.verticesZ = new Int32Array(vertexCount);
    this.indices1 = new Int32Array(faceCount);
    this.indices2 = new Int32Array(faceCount);
    this.indices3 = new Int32Array(faceCount);
    if (var17 === 1) {
      this.vertexSkins = new Int32Array(vertexCount);
    }
    if (var12 === 1) {
      this.faceRenderTypes = new Int8Array(faceCount);
    }
    if (var13 === 255) {
      this.faceRenderPriorities = new Int8Array(faceCount);
    } else {
      this.priority = var13;
    }
    if (var14 === 1) {
      this.faceAlphas = new Int8Array(faceCount);
    }
    if (var15 === 1) {
      this.faceSkins = new Int32Array(faceCount);
    }
    if (var16 === 1) {
      this.faceTextures = new Int16Array(faceCount);
    }
    if (var16 === 1 && texTriangleCount > 0) {
      this.textureCoords = new Int8Array(faceCount);
    }
    if (hasMayaGroups === 1) {
      this.animMayaGroups = new Array(vertexCount);
      this.animMayaScales = new Array(vertexCount);
    }
    this.faceColors = new Uint16Array(faceCount);
    if (texTriangleCount > 0) {
      this.textureMappingP = new Int16Array(texTriangleCount);
      this.textureMappingM = new Int16Array(texTriangleCount);
      this.textureMappingN = new Int16Array(texTriangleCount);
      if (complexTextureFaceCount > 0) {
        this.textureScaleX = new Int32Array(complexTextureFaceCount);
        this.textureScaleY = new Int32Array(complexTextureFaceCount);
        this.textureScaleZ = new Int32Array(complexTextureFaceCount);
        this.textureRotation = new Int8Array(complexTextureFaceCount);
        this.textureDirection = new Int8Array(complexTextureFaceCount);
        this.textureSpeed = new Int32Array(complexTextureFaceCount);
      }
      if (cubeTextureFaceCount > 0) {
        this.textureTransU = new Int32Array(cubeTextureFaceCount);
        this.textureTransV = new Int32Array(cubeTextureFaceCount);
      }
    }
    buf1.offset = texTriangleCount;
    buf2.offset = var40;
    buf3.offset = var41;
    buf4.offset = var42;
    buf5.offset = var34;
    let lastVertX = 0;
    let lastVertY = 0;
    let lastVertZ = 0;
    for (let i = 0; i < vertexCount; i++) {
      const flag = buf1.readUnsignedByte();
      let deltaVertX = 0;
      if ((flag & 1) !== 0) {
        deltaVertX = buf2.readSmart2();
      }
      let deltaVertY = 0;
      if ((flag & 2) !== 0) {
        deltaVertY = buf3.readSmart2();
      }
      let deltaVertZ = 0;
      if ((flag & 4) !== 0) {
        deltaVertZ = buf4.readSmart2();
      }
      this.verticesX[i] = lastVertX + deltaVertX;
      this.verticesY[i] = lastVertY + deltaVertY;
      this.verticesZ[i] = lastVertZ + deltaVertZ;
      lastVertX = this.verticesX[i];
      lastVertY = this.verticesY[i];
      lastVertZ = this.verticesZ[i];
      if (var17 === 1 && this.vertexSkins) {
        this.vertexSkins[i] = buf5.readUnsignedByte();
      }
    }
    if (hasMayaGroups === 1) {
      for (let i = 0; i < vertexCount; i++) {
        const var542 = buf5.readUnsignedByte();
        this.animMayaGroups[i] = new Int32Array(var542);
        this.animMayaScales[i] = new Int32Array(var542);
        for (let j = 0; j < var542; j++) {
          this.animMayaGroups[i][j] = buf5.readUnsignedByte();
          this.animMayaScales[i][j] = buf5.readUnsignedByte();
        }
      }
    }
    buf1.offset = var39;
    buf2.offset = var30;
    buf3.offset = var32;
    buf4.offset = var35;
    buf5.offset = var33;
    buf6.offset = var37;
    buf7.offset = var38;
    for (let i = 0; i < faceCount; i++) {
      this.faceColors[i] = buf1.readUnsignedShort();
      if (var12 === 1 && this.faceRenderTypes) {
        this.faceRenderTypes[i] = buf2.readByte();
      }
      if (var13 === 255) {
        this.faceRenderPriorities[i] = buf3.readByte();
      }
      if (var14 === 1) {
        this.faceAlphas[i] = buf4.readByte();
      }
      if (var15 === 1 && this.faceSkins) {
        this.faceSkins[i] = buf5.readUnsignedByte();
      }
      if (var16 === 1 && this.faceTextures) {
        this.faceTextures[i] = buf6.readUnsignedShort() - 1;
      }
      if (this.textureCoords && this.faceTextures && this.faceTextures[i] !== -1) {
        this.textureCoords[i] = buf7.readUnsignedByte() - 1;
      }
    }
    buf1.offset = var36;
    buf2.offset = var31;
    let var53 = 0;
    let var54 = 0;
    let var55 = 0;
    let var56 = 0;
    for (let i = 0; i < faceCount; i++) {
      const type = buf2.readUnsignedByte();
      if (type === 1) {
        var53 = buf1.readSmart2() + var56;
        var54 = buf1.readSmart2() + var53;
        var55 = buf1.readSmart2() + var54;
        var56 = var55;
        this.indices1[i] = var53;
        this.indices2[i] = var54;
        this.indices3[i] = var55;
      }
      if (type === 2) {
        var54 = var55;
        var55 = buf1.readSmart2() + var56;
        var56 = var55;
        this.indices1[i] = var53;
        this.indices2[i] = var54;
        this.indices3[i] = var55;
      }
      if (type === 3) {
        var53 = var55;
        var55 = buf1.readSmart2() + var56;
        var56 = var55;
        this.indices1[i] = var53;
        this.indices2[i] = var54;
        this.indices3[i] = var55;
      }
      if (type === 4) {
        const var59 = var53;
        var53 = var54;
        var54 = var59;
        var55 = buf1.readSmart2() + var56;
        var56 = var55;
        this.indices1[i] = var53;
        this.indices2[i] = var59;
        this.indices3[i] = var55;
      }
    }
    buf1.offset = var43;
    buf2.offset = var44;
    buf3.offset = var45;
    buf4.offset = var46;
    buf5.offset = var47;
    buf6.offset = var48;
    for (let i = 0; i < texTriangleCount; i++) {
      const type = this.textureRenderTypes[i] & 255;
      if (type === 0) {
        this.textureMappingP[i] = buf1.readUnsignedShort();
        this.textureMappingM[i] = buf1.readUnsignedShort();
        this.textureMappingN[i] = buf1.readUnsignedShort();
      }
    }
    buf1.offset = var28;
    const var57 = buf1.readUnsignedByte();
    if (var57 !== 0) {
      buf1.readUnsignedShort();
      buf1.readUnsignedShort();
      buf1.readUnsignedShort();
      buf1.readInt();
    }
  }
  decodeV2(data) {
    this.version = 2;
    let var2 = false;
    let var3 = false;
    const buf1 = new ByteBuffer(data);
    const buf2 = new ByteBuffer(data);
    const buf3 = new ByteBuffer(data);
    const buf4 = new ByteBuffer(data);
    const buf5 = new ByteBuffer(data);
    buf1.offset = data.length - 23;
    const vertexCount = buf1.readUnsignedShort();
    const faceCount = buf1.readUnsignedShort();
    const texTriangleCount = buf1.readUnsignedByte();
    const var12 = buf1.readUnsignedByte();
    const var13 = buf1.readUnsignedByte();
    const var14 = buf1.readUnsignedByte();
    const var15 = buf1.readUnsignedByte();
    const hasVertexSkins = buf1.readUnsignedByte();
    const hasMayaGroups = buf1.readUnsignedByte();
    const var18 = buf1.readUnsignedShort();
    const var19 = buf1.readUnsignedShort();
    const var20 = buf1.readUnsignedShort();
    const var21 = buf1.readUnsignedShort();
    const var22 = buf1.readUnsignedShort();
    let var23 = 0;
    let var47 = var23 + vertexCount;
    const var25 = var47;
    var47 += faceCount;
    const var26 = var47;
    if (var13 === 255) {
      var47 += faceCount;
    }
    const var27 = var47;
    if (var15 === 1) {
      var47 += faceCount;
    }
    const var28 = var47;
    if (var12 === 1) {
      var47 += faceCount;
    }
    const var29 = var47;
    var47 += var22;
    const var30 = var47;
    if (var14 === 1) {
      var47 += faceCount;
    }
    const var31 = var47;
    var47 += var21;
    const var32 = var47;
    var47 += faceCount * 2;
    const var33 = var47;
    var47 += texTriangleCount * 6;
    const var34 = var47;
    var47 += var18;
    const var35 = var47;
    var47 += var19;
    this.verticesCount = vertexCount;
    this.faceCount = faceCount;
    this.textureFaceCount = texTriangleCount;
    this.verticesX = new Int32Array(vertexCount);
    this.verticesY = new Int32Array(vertexCount);
    this.verticesZ = new Int32Array(vertexCount);
    this.indices1 = new Int32Array(faceCount);
    this.indices2 = new Int32Array(faceCount);
    this.indices3 = new Int32Array(faceCount);
    if (texTriangleCount > 0) {
      this.textureRenderTypes = new Int8Array(texTriangleCount);
      this.textureMappingP = new Int16Array(texTriangleCount);
      this.textureMappingM = new Int16Array(texTriangleCount);
      this.textureMappingN = new Int16Array(texTriangleCount);
    }
    if (hasVertexSkins === 1) {
      this.vertexSkins = new Int32Array(vertexCount);
    }
    if (var12 === 1) {
      this.faceRenderTypes = new Int8Array(faceCount);
      this.textureCoords = new Int8Array(faceCount);
      this.faceTextures = new Int16Array(faceCount);
    }
    if (var13 === 255) {
      this.faceRenderPriorities = new Int8Array(faceCount);
    } else {
      this.priority = var13;
    }
    if (var14 === 1) {
      this.faceAlphas = new Int8Array(faceCount);
    }
    if (var15 === 1) {
      this.faceSkins = new Int32Array(faceCount);
    }
    if (hasMayaGroups === 1) {
      this.animMayaGroups = new Array(vertexCount);
      this.animMayaScales = new Array(vertexCount);
    }
    this.faceColors = new Uint16Array(faceCount);
    buf1.offset = var23;
    buf2.offset = var34;
    buf3.offset = var35;
    buf4.offset = var47;
    buf5.offset = var29;
    let lastVertX = 0;
    let lastVertY = 0;
    let lastVertZ = 0;
    for (let i = 0; i < vertexCount; i++) {
      const flag = buf1.readUnsignedByte();
      let deltaVertX = 0;
      if ((flag & 1) !== 0) {
        deltaVertX = buf2.readSmart2();
      }
      let deltaVertY = 0;
      if ((flag & 2) !== 0) {
        deltaVertY = buf3.readSmart2();
      }
      let deltaVertZ = 0;
      if ((flag & 4) !== 0) {
        deltaVertZ = buf4.readSmart2();
      }
      this.verticesX[i] = lastVertX + deltaVertX;
      this.verticesY[i] = lastVertY + deltaVertY;
      this.verticesZ[i] = lastVertZ + deltaVertZ;
      lastVertX = this.verticesX[i];
      lastVertY = this.verticesY[i];
      lastVertZ = this.verticesZ[i];
      if (hasVertexSkins === 1 && this.vertexSkins) {
        this.vertexSkins[i] = buf5.readUnsignedByte();
      }
    }
    if (hasMayaGroups === 1) {
      for (let i = 0; i < vertexCount; i++) {
        const var412 = buf5.readUnsignedByte();
        this.animMayaGroups[i] = new Int32Array(var412);
        this.animMayaScales[i] = new Int32Array(var412);
        for (let j = 0; j < var412; j++) {
          this.animMayaGroups[i][j] = buf5.readUnsignedByte();
          this.animMayaScales[i][j] = buf5.readUnsignedByte();
        }
      }
    }
    buf1.offset = var32;
    buf2.offset = var28;
    buf3.offset = var26;
    buf4.offset = var30;
    buf5.offset = var27;
    for (let i = 0; i < faceCount; i++) {
      this.faceColors[i] = buf1.readUnsignedShort();
      if (var12 === 1 && this.faceRenderTypes && this.textureCoords && this.faceTextures) {
        const var412 = buf2.readUnsignedByte();
        if ((var412 & 1) === 1) {
          this.faceRenderTypes[i] = 1;
          var2 = true;
        } else {
          this.faceRenderTypes[i] = 0;
        }
        if ((var412 & 2) === 2) {
          this.textureCoords[i] = var412 >> 2;
          this.faceTextures[i] = this.faceColors[i];
          this.faceColors[i] = 127;
          if (this.faceTextures[i] !== -1) {
            var3 = true;
          }
        } else {
          this.textureCoords[i] = -1;
          this.faceTextures[i] = -1;
        }
      }
      if (var13 === 255) {
        this.faceRenderPriorities[i] = buf3.readByte();
      }
      if (var14 === 1) {
        this.faceAlphas[i] = buf4.readByte();
      }
      if (var15 === 1 && this.faceSkins) {
        this.faceSkins[i] = buf5.readUnsignedByte();
      }
    }
    buf1.offset = var31;
    buf2.offset = var25;
    let var40 = 0;
    let var41 = 0;
    let var42 = 0;
    let var43 = 0;
    for (let i = 0; i < faceCount; i++) {
      const var45 = buf2.readUnsignedByte();
      if (var45 === 1) {
        var40 = buf1.readSmart2() + var43;
        var41 = buf1.readSmart2() + var40;
        var42 = buf1.readSmart2() + var41;
        var43 = var42;
        this.indices1[i] = var40;
        this.indices2[i] = var41;
        this.indices3[i] = var42;
      }
      if (var45 === 2) {
        var41 = var42;
        var42 = buf1.readSmart2() + var43;
        var43 = var42;
        this.indices1[i] = var40;
        this.indices2[i] = var41;
        this.indices3[i] = var42;
      }
      if (var45 === 3) {
        var40 = var42;
        var42 = buf1.readSmart2() + var43;
        var43 = var42;
        this.indices1[i] = var40;
        this.indices2[i] = var41;
        this.indices3[i] = var42;
      }
      if (var45 === 4) {
        const var46 = var40;
        var40 = var41;
        var41 = var46;
        var42 = buf1.readSmart2() + var43;
        var43 = var42;
        this.indices1[i] = var40;
        this.indices2[i] = var46;
        this.indices3[i] = var42;
      }
    }
    buf1.offset = var33;
    for (let i = 0; i < texTriangleCount; i++) {
      this.textureRenderTypes[i] = 0;
      this.textureMappingP[i] = buf1.readUnsignedShort();
      this.textureMappingM[i] = buf1.readUnsignedShort();
      this.textureMappingN[i] = buf1.readUnsignedShort();
    }
    if (this.textureCoords) {
      let var48 = false;
      for (let i = 0; i < faceCount; i++) {
        const coord = this.textureCoords[i] & 255;
        if (coord !== 255) {
          if (this.indices1[i] === (this.textureMappingP[coord] & 65535) && this.indices2[i] === (this.textureMappingM[coord] & 65535) && this.indices3[i] === (this.textureMappingN[coord] & 65535)) {
            this.textureCoords[i] = -1;
          } else {
            var48 = true;
          }
        }
      }
      if (!var48) {
        this.textureCoords = void 0;
      }
    }
    if (!var3) {
      this.faceTextures = void 0;
    }
    if (!var2) {
      this.faceRenderTypes = void 0;
    }
  }
  scaleDown(n) {
    for (let i = 0; i < this.verticesCount; i++) {
      this.verticesX[i] >>= n;
      this.verticesY[i] >>= n;
      this.verticesZ[i] >>= n;
    }
    if (this.textureFaceCount > 0 && this.textureScaleX) {
      for (let i = 0; i < this.textureFaceCount; i++) {
        this.textureScaleX[i] >>= n;
        this.textureScaleY[i] >>= n;
        if (this.textureRenderTypes[i] !== 1) {
          this.textureScaleZ[i] >>= n;
        }
      }
    }
  }
  decodeV1(data) {
    this.version = 1;
    const buf1 = new ByteBuffer(data);
    const buf2 = new ByteBuffer(data);
    const buf3 = new ByteBuffer(data);
    const buf4 = new ByteBuffer(data);
    const buf5 = new ByteBuffer(data);
    const buf6 = new ByteBuffer(data);
    const buf7 = new ByteBuffer(data);
    buf1.offset = data.length - 23;
    const vertexCount = buf1.readUnsignedShort();
    const faceCount = buf1.readUnsignedShort();
    const texFaceCount = buf1.readUnsignedByte();
    const flags = buf1.readUnsignedByte();
    const hasFaceRenderTypes = (flags & 1) === 1;
    const hasParticles = (flags & 2) === 2;
    const hasBillboards = (flags & 4) === 4;
    const hasVersion = (flags & 8) === 8;
    if (hasVersion) {
      buf1.offset -= 7;
      this.version = buf1.readUnsignedByte();
      buf1.offset += 6;
    }
    const modelPriority = buf1.readUnsignedByte();
    const hasFaceAlpha = buf1.readUnsignedByte();
    const hasFaceSkins = buf1.readUnsignedByte();
    const hasFaceTextures = buf1.readUnsignedByte();
    const hasVertexSkins = buf1.readUnsignedByte();
    const modelVerticesX = buf1.readUnsignedShort();
    const modelVerticesY = buf1.readUnsignedShort();
    const modelVerticesZ = buf1.readUnsignedShort();
    const faceIndices = buf1.readUnsignedShort();
    const textureIndices = buf1.readUnsignedShort();
    let simpleTextureFaceCount = 0;
    let complexTextureFaceCount = 0;
    let cubeTextureFaceCount = 0;
    if (texFaceCount > 0) {
      this.textureRenderTypes = new Int8Array(texFaceCount);
      buf1.offset = 0;
      for (let i = 0; i < texFaceCount; i++) {
        const type = this.textureRenderTypes[i] = buf1.readByte();
        if (type === 0) {
          simpleTextureFaceCount++;
        }
        if (type >= 1 && type <= 3) {
          complexTextureFaceCount++;
        }
        if (type === 2) {
          cubeTextureFaceCount++;
        }
      }
    }
    let offset = texFaceCount + vertexCount;
    const vertexFlagsOffset = offset;
    if (hasFaceRenderTypes) {
      offset += faceCount;
    }
    const faceCompressTypeOffset = offset;
    offset += faceCount;
    const facePrioritiesOffset = offset;
    if (modelPriority === 255) {
      offset += faceCount;
    }
    const faceSkinsOffset = offset;
    if (hasFaceSkins === 1) {
      offset += faceCount;
    }
    const vertexSkinsOffset = offset;
    if (hasVertexSkins === 1) {
      offset += vertexCount;
    }
    const faceAlphasOffset = offset;
    if (hasFaceAlpha === 1) {
      offset += faceCount;
    }
    const faceIndicesOffset = offset;
    offset += faceIndices;
    const faceMaterialsOffset = offset;
    if (hasFaceTextures === 1) {
      offset += faceCount * 2;
    }
    const faceTextureIndicesOffset = offset;
    offset += textureIndices;
    const faceColorsOffset = offset;
    offset += faceCount * 2;
    const xVertexOffset = offset;
    offset += modelVerticesX;
    const yVertexOffset = offset;
    offset += modelVerticesY;
    const zVertexOffset = offset;
    offset += modelVerticesZ;
    const simpleTexturesOffset = offset;
    offset += simpleTextureFaceCount * 6;
    const complexTexturesOffset = offset;
    offset += complexTextureFaceCount * 6;
    let textureBytes = 6;
    if (this.version === 14) {
      textureBytes = 7;
    } else if (this.version >= 15) {
      textureBytes = 9;
    }
    const texturesScalesOffset = offset;
    offset += complexTextureFaceCount * textureBytes;
    const texturesRotationOffset = offset;
    offset += complexTextureFaceCount;
    const texturesDirectionOffset = offset;
    offset += complexTextureFaceCount;
    const texturesTranslationOffset = offset;
    offset += complexTextureFaceCount + cubeTextureFaceCount * 2;
    const particleEffectsOffset = offset;
    this.verticesCount = vertexCount;
    this.faceCount = faceCount;
    this.textureFaceCount = texFaceCount;
    this.verticesX = new Int32Array(vertexCount);
    this.verticesY = new Int32Array(vertexCount);
    this.verticesZ = new Int32Array(vertexCount);
    this.indices1 = new Int32Array(faceCount);
    this.indices2 = new Int32Array(faceCount);
    this.indices3 = new Int32Array(faceCount);
    if (hasVertexSkins === 1) {
      this.vertexSkins = new Int32Array(vertexCount);
    }
    if (hasFaceRenderTypes) {
      this.faceRenderTypes = new Int8Array(faceCount);
    }
    if (modelPriority === 255) {
      this.faceRenderPriorities = new Int8Array(faceCount);
    } else {
      this.priority = modelPriority;
    }
    if (hasFaceAlpha === 1) {
      this.faceAlphas = new Int8Array(faceCount);
    }
    if (hasFaceSkins === 1) {
      this.faceSkins = new Int32Array(faceCount);
    }
    if (hasFaceTextures === 1) {
      this.faceTextures = new Int16Array(faceCount);
    }
    if (hasFaceTextures === 1 && texFaceCount > 0) {
      this.textureCoords = new Int8Array(faceCount);
    }
    this.faceColors = new Uint16Array(faceCount);
    if (texFaceCount > 0) {
      this.textureMappingP = new Int16Array(texFaceCount);
      this.textureMappingM = new Int16Array(texFaceCount);
      this.textureMappingN = new Int16Array(texFaceCount);
      if (complexTextureFaceCount > 0) {
        this.textureScaleX = new Int32Array(complexTextureFaceCount);
        this.textureScaleY = new Int32Array(complexTextureFaceCount);
        this.textureScaleZ = new Int32Array(complexTextureFaceCount);
        this.textureRotation = new Int8Array(complexTextureFaceCount);
        this.textureDirection = new Int8Array(complexTextureFaceCount);
        this.textureSpeed = new Int32Array(complexTextureFaceCount);
      }
      if (cubeTextureFaceCount > 0) {
        this.textureTransU = new Int32Array(cubeTextureFaceCount);
        this.textureTransV = new Int32Array(cubeTextureFaceCount);
      }
    }
    buf1.offset = texFaceCount;
    buf2.offset = xVertexOffset;
    buf3.offset = yVertexOffset;
    buf4.offset = zVertexOffset;
    buf5.offset = vertexSkinsOffset;
    let lastVertX = 0;
    let lastVertY = 0;
    let lastVertZ = 0;
    for (let i = 0; i < vertexCount; i++) {
      const flag = buf1.readUnsignedByte();
      let deltaVertX = 0;
      if ((flag & 1) !== 0) {
        deltaVertX = buf2.readSmart2();
      }
      let deltaVertY = 0;
      if ((flag & 2) !== 0) {
        deltaVertY = buf3.readSmart2();
      }
      let deltaVertZ = 0;
      if ((flag & 4) !== 0) {
        deltaVertZ = buf4.readSmart2();
      }
      this.verticesX[i] = lastVertX + deltaVertX;
      this.verticesY[i] = lastVertY + deltaVertY;
      this.verticesZ[i] = lastVertZ + deltaVertZ;
      lastVertX = this.verticesX[i];
      lastVertY = this.verticesY[i];
      lastVertZ = this.verticesZ[i];
      if (hasVertexSkins === 1 && this.vertexSkins) {
        this.vertexSkins[i] = buf5.readUnsignedByte();
      }
    }
    buf1.offset = faceColorsOffset;
    buf2.offset = vertexFlagsOffset;
    buf3.offset = facePrioritiesOffset;
    buf4.offset = faceAlphasOffset;
    buf5.offset = faceSkinsOffset;
    buf6.offset = faceMaterialsOffset;
    buf7.offset = faceTextureIndicesOffset;
    for (let i = 0; i < faceCount; i++) {
      this.faceColors[i] = buf1.readUnsignedShort();
      if (hasFaceRenderTypes && this.faceRenderTypes) {
        this.faceRenderTypes[i] = buf2.readByte();
      }
      if (modelPriority === 255) {
        this.faceRenderPriorities[i] = buf3.readByte();
      }
      if (hasFaceAlpha === 1) {
        this.faceAlphas[i] = buf4.readByte();
      }
      if (hasFaceSkins === 1 && this.faceSkins) {
        this.faceSkins[i] = buf5.readUnsignedByte();
      }
      if (hasFaceTextures === 1 && this.faceTextures) {
        this.faceTextures[i] = buf6.readUnsignedShort() - 1;
      }
      if (this.textureCoords) {
        if (this.faceTextures && this.faceTextures[i] !== -1) {
          this.textureCoords[i] = buf7.readUnsignedByte() - 1;
        } else {
          this.textureCoords[i] = -1;
        }
      }
    }
    buf1.offset = faceIndicesOffset;
    buf2.offset = faceCompressTypeOffset;
    let index1 = 0;
    let index2 = 0;
    let index3 = 0;
    let var54 = 0;
    this.usedVertexCount = -1;
    for (let i = 0; i < faceCount; i++) {
      const type = buf2.readUnsignedByte();
      if (type === 1) {
        index1 = buf1.readSmart2() + var54;
        index2 = buf1.readSmart2() + index1;
        index3 = buf1.readSmart2() + index2;
        var54 = index3;
        this.indices1[i] = index1;
        this.indices2[i] = index2;
        this.indices3[i] = index3;
        if (index1 > this.usedVertexCount) {
          this.usedVertexCount = index1;
        }
        if (index2 > this.usedVertexCount) {
          this.usedVertexCount = index2;
        }
        if (index3 > this.usedVertexCount) {
          this.usedVertexCount = index3;
        }
      }
      if (type === 2) {
        index2 = index3;
        index3 = buf1.readSmart2() + var54;
        var54 = index3;
        this.indices1[i] = index1;
        this.indices2[i] = index2;
        this.indices3[i] = index3;
        if (index3 > this.usedVertexCount) {
          this.usedVertexCount = index3;
        }
      }
      if (type === 3) {
        index1 = index3;
        index3 = buf1.readSmart2() + var54;
        var54 = index3;
        this.indices1[i] = index1;
        this.indices2[i] = index2;
        this.indices3[i] = index3;
        if (index3 > this.usedVertexCount) {
          this.usedVertexCount = index3;
        }
      }
      if (type === 4) {
        const var57 = index1;
        index1 = index2;
        index2 = var57;
        index3 = buf1.readSmart2() + var54;
        var54 = index3;
        this.indices1[i] = index1;
        this.indices2[i] = var57;
        this.indices3[i] = index3;
        if (index3 > this.usedVertexCount) {
          this.usedVertexCount = index3;
        }
      }
    }
    this.usedVertexCount++;
    buf1.offset = simpleTexturesOffset;
    buf2.offset = complexTexturesOffset;
    buf3.offset = texturesScalesOffset;
    buf4.offset = texturesRotationOffset;
    buf5.offset = texturesDirectionOffset;
    buf6.offset = texturesTranslationOffset;
    this.decodeTextureMapping(buf1, buf2, buf3, buf4, buf5, buf6);
    buf1.offset = offset;
    if (this.version >= 13) {
      this.scaleDown(2);
    }
  }
  decodeTextureMapping(simpleBuffer, complexBuffer, scaleBuffer, rotationBuffer, directionBuffer, translationBuffer) {
    for (let i = 0; i < this.textureFaceCount; i++) {
      const type = this.textureRenderTypes[i] & 255;
      if (type === 0) {
        this.textureMappingP[i] = simpleBuffer.readUnsignedShort();
        this.textureMappingM[i] = simpleBuffer.readUnsignedShort();
        this.textureMappingN[i] = simpleBuffer.readUnsignedShort();
      }
      if (type === 1) {
        this.textureMappingP[i] = complexBuffer.readUnsignedShort();
        this.textureMappingM[i] = complexBuffer.readUnsignedShort();
        this.textureMappingN[i] = complexBuffer.readUnsignedShort();
        if (this.version < 15) {
          this.textureScaleX[i] = scaleBuffer.readUnsignedShort();
          if (this.version >= 14) {
            this.textureScaleY[i] = scaleBuffer.readMedium();
          } else {
            this.textureScaleY[i] = scaleBuffer.readUnsignedShort();
          }
          this.textureScaleZ[i] = scaleBuffer.readUnsignedShort();
        } else {
          this.textureScaleX[i] = scaleBuffer.readMedium();
          this.textureScaleY[i] = scaleBuffer.readMedium();
          this.textureScaleZ[i] = scaleBuffer.readMedium();
        }
        this.textureRotation[i] = rotationBuffer.readByte();
        this.textureDirection[i] = directionBuffer.readByte();
        this.textureSpeed[i] = translationBuffer.readByte();
      }
      if (type === 2) {
        this.textureMappingP[i] = complexBuffer.readUnsignedShort();
        this.textureMappingM[i] = complexBuffer.readUnsignedShort();
        this.textureMappingN[i] = complexBuffer.readUnsignedShort();
        if (this.version < 15) {
          this.textureScaleX[i] = scaleBuffer.readUnsignedShort();
          if (this.version >= 14) {
            this.textureScaleY[i] = scaleBuffer.readMedium();
          } else {
            this.textureScaleY[i] = scaleBuffer.readUnsignedShort();
          }
          this.textureScaleZ[i] = scaleBuffer.readUnsignedShort();
        } else {
          this.textureScaleX[i] = scaleBuffer.readMedium();
          this.textureScaleY[i] = scaleBuffer.readMedium();
          this.textureScaleZ[i] = scaleBuffer.readMedium();
        }
        this.textureRotation[i] = rotationBuffer.readByte();
        this.textureDirection[i] = directionBuffer.readByte();
        this.textureSpeed[i] = translationBuffer.readByte();
        this.textureTransU[i] = translationBuffer.readByte();
        this.textureTransV[i] = translationBuffer.readByte();
      }
      if (type === 3) {
        this.textureMappingP[i] = complexBuffer.readUnsignedShort();
        this.textureMappingM[i] = complexBuffer.readUnsignedShort();
        this.textureMappingN[i] = complexBuffer.readUnsignedShort();
        if (this.version < 15) {
          this.textureScaleX[i] = scaleBuffer.readUnsignedShort();
          if (this.version >= 14) {
            this.textureScaleY[i] = scaleBuffer.readMedium();
          } else {
            this.textureScaleY[i] = scaleBuffer.readUnsignedShort();
          }
          this.textureScaleZ[i] = scaleBuffer.readUnsignedShort();
        } else {
          this.textureScaleX[i] = scaleBuffer.readMedium();
          this.textureScaleY[i] = scaleBuffer.readMedium();
          this.textureScaleZ[i] = scaleBuffer.readMedium();
        }
        this.textureRotation[i] = rotationBuffer.readByte();
        this.textureDirection[i] = directionBuffer.readByte();
        this.textureSpeed[i] = translationBuffer.readByte();
      }
    }
  }
  decodeOld(data) {
    this.version = 0;
    let hasRenderType = false;
    let isTextured = false;
    const buf1 = new ByteBuffer(data);
    const buf2 = new ByteBuffer(data);
    const buf3 = new ByteBuffer(data);
    const buf4 = new ByteBuffer(data);
    const buf5 = new ByteBuffer(data);
    buf1.offset = data.length - 18;
    const vertexCount = buf1.readUnsignedShort();
    const faceCount = buf1.readUnsignedShort();
    const texTriangleCount = buf1.readUnsignedByte();
    const usesTextures = buf1.readUnsignedByte();
    const var13 = buf1.readUnsignedByte();
    const var14 = buf1.readUnsignedByte();
    const var15 = buf1.readUnsignedByte();
    const var16 = buf1.readUnsignedByte();
    const var17 = buf1.readUnsignedShort();
    const var18 = buf1.readUnsignedShort();
    const var19 = buf1.readUnsignedShort();
    const var20 = buf1.readUnsignedShort();
    let var21 = 0;
    let var45 = var21 + vertexCount;
    let var23 = var45;
    var45 += faceCount;
    const var24 = var45;
    if (var13 === 255) {
      var45 += faceCount;
    }
    const var25 = var45;
    if (var15 === 1) {
      var45 += faceCount;
    }
    const var26 = var45;
    if (usesTextures === 1) {
      var45 += faceCount;
    }
    const var27 = var45;
    if (var16 === 1) {
      var45 += vertexCount;
    }
    const var28 = var45;
    if (var14 === 1) {
      var45 += faceCount;
    }
    const var29 = var45;
    var45 += var20;
    const var30 = var45;
    var45 += faceCount * 2;
    const var31 = var45;
    var45 += texTriangleCount * 6;
    const var32 = var45;
    var45 += var17;
    const var33 = var45;
    var45 += var18;
    this.verticesCount = vertexCount;
    this.faceCount = faceCount;
    this.textureFaceCount = texTriangleCount;
    this.verticesX = new Int32Array(vertexCount);
    this.verticesY = new Int32Array(vertexCount);
    this.verticesZ = new Int32Array(vertexCount);
    this.indices1 = new Int32Array(faceCount);
    this.indices2 = new Int32Array(faceCount);
    this.indices3 = new Int32Array(faceCount);
    if (texTriangleCount > 0) {
      this.textureRenderTypes = new Int8Array(texTriangleCount);
      this.textureMappingP = new Int16Array(texTriangleCount);
      this.textureMappingM = new Int16Array(texTriangleCount);
      this.textureMappingN = new Int16Array(texTriangleCount);
    }
    if (var16 === 1) {
      this.vertexSkins = new Int32Array(vertexCount);
    }
    if (usesTextures === 1) {
      this.faceRenderTypes = new Int8Array(faceCount);
      this.textureCoords = new Int8Array(faceCount);
      this.faceTextures = new Int16Array(faceCount);
    }
    if (var13 === 255) {
      this.faceRenderPriorities = new Int8Array(faceCount);
    } else {
      this.priority = var13;
    }
    if (var14 === 1) {
      this.faceAlphas = new Int8Array(faceCount);
    }
    if (var15 === 1) {
      this.faceSkins = new Int32Array(faceCount);
    }
    this.faceColors = new Uint16Array(faceCount);
    buf1.offset = var21;
    buf2.offset = var32;
    buf3.offset = var33;
    buf4.offset = var45;
    buf5.offset = var27;
    let lastVertX = 0;
    let lastVertY = 0;
    let lastVertZ = 0;
    for (let i = 0; i < vertexCount; i++) {
      const flag = buf1.readUnsignedByte();
      let deltaVertX = 0;
      if ((flag & 1) !== 0) {
        deltaVertX = buf2.readSmart2();
      }
      let deltaVertY = 0;
      if ((flag & 2) !== 0) {
        deltaVertY = buf3.readSmart2();
      }
      let deltaVertZ = 0;
      if ((flag & 4) !== 0) {
        deltaVertZ = buf4.readSmart2();
      }
      this.verticesX[i] = lastVertX + deltaVertX;
      this.verticesY[i] = lastVertY + deltaVertY;
      this.verticesZ[i] = lastVertZ + deltaVertZ;
      lastVertX = this.verticesX[i];
      lastVertY = this.verticesY[i];
      lastVertZ = this.verticesZ[i];
      if (var16 === 1 && this.vertexSkins) {
        this.vertexSkins[i] = buf5.readUnsignedByte();
      }
    }
    buf1.offset = var30;
    buf2.offset = var26;
    buf3.offset = var24;
    buf4.offset = var28;
    buf5.offset = var25;
    for (let i = 0; i < faceCount; i++) {
      this.faceColors[i] = buf1.readUnsignedShort();
      if (usesTextures === 1 && this.faceRenderTypes && this.textureCoords && this.faceTextures) {
        const flag = buf2.readUnsignedByte();
        if ((flag & 1) === 1) {
          this.faceRenderTypes[i] = 1;
          hasRenderType = true;
        } else {
          this.faceRenderTypes[i] = 0;
        }
        if ((flag & 2) === 2) {
          this.textureCoords[i] = flag >> 2;
          this.faceTextures[i] = this.faceColors[i];
          this.faceColors[i] = 127;
          if (this.faceTextures[i] !== -1) {
            isTextured = true;
          }
        } else {
          this.textureCoords[i] = -1;
          this.faceTextures[i] = -1;
        }
      }
      if (var13 === 255) {
        this.faceRenderPriorities[i] = buf3.readByte();
      }
      if (var14 === 1) {
        this.faceAlphas[i] = buf4.readByte();
      }
      if (var15 === 1 && this.faceSkins) {
        this.faceSkins[i] = buf5.readUnsignedByte();
      }
    }
    buf1.offset = var29;
    buf2.offset = var23;
    let index1 = 0;
    let index2 = 0;
    let index3 = 0;
    let lastIndex = 0;
    this.usedVertexCount = -1;
    for (let i = 0; i < faceCount; i++) {
      const type = buf2.readUnsignedByte();
      if (type === 1) {
        index1 = buf1.readSmart2() + lastIndex;
        index2 = buf1.readSmart2() + index1;
        index3 = buf1.readSmart2() + index2;
        lastIndex = index3;
        this.indices1[i] = index1;
        this.indices2[i] = index2;
        this.indices3[i] = index3;
        if (index1 > this.usedVertexCount) {
          this.usedVertexCount = index1;
        }
        if (index2 > this.usedVertexCount) {
          this.usedVertexCount = index2;
        }
        if (index3 > this.usedVertexCount) {
          this.usedVertexCount = index3;
        }
      }
      if (type === 2) {
        index2 = index3;
        index3 = buf1.readSmart2() + lastIndex;
        lastIndex = index3;
        this.indices1[i] = index1;
        this.indices2[i] = index2;
        this.indices3[i] = index3;
        if (index3 > this.usedVertexCount) {
          this.usedVertexCount = index3;
        }
      }
      if (type === 3) {
        index1 = index3;
        index3 = buf1.readSmart2() + lastIndex;
        lastIndex = index3;
        this.indices1[i] = index1;
        this.indices2[i] = index2;
        this.indices3[i] = index3;
        if (index3 > this.usedVertexCount) {
          this.usedVertexCount = index3;
        }
      }
      if (type === 4) {
        const var44 = index1;
        index1 = index2;
        index2 = var44;
        index3 = buf1.readSmart2() + lastIndex;
        lastIndex = index3;
        this.indices1[i] = index1;
        this.indices2[i] = var44;
        this.indices3[i] = index3;
        if (index3 > this.usedVertexCount) {
          this.usedVertexCount = index3;
        }
      }
    }
    this.usedVertexCount++;
    buf1.offset = var31;
    for (let i = 0; i < texTriangleCount; i++) {
      this.textureRenderTypes[i] = 0;
      this.textureMappingP[i] = buf1.readUnsignedShort();
      this.textureMappingM[i] = buf1.readUnsignedShort();
      this.textureMappingN[i] = buf1.readUnsignedShort();
    }
    if (this.textureCoords) {
      let hasValidTexFace = false;
      for (let i = 0; i < faceCount; i++) {
        const index = this.textureCoords[i] & 255;
        if (index !== 255) {
          if (this.indices1[i] === (this.textureMappingP[index] & 65535) && this.indices2[i] === (this.textureMappingM[index] & 65535) && this.indices3[i] === (this.textureMappingN[index] & 65535)) {
            this.textureCoords[i] = -1;
          } else {
            hasValidTexFace = true;
          }
        }
      }
      if (!hasValidTexFace) {
        this.textureCoords = void 0;
      }
    }
    if (!isTextured) {
      this.faceTextures = void 0;
    }
    if (!hasRenderType) {
      this.faceRenderTypes = void 0;
    }
  }
  decodeLegacy(loader, meta) {
    let hasRenderType = false;
    let isTextured = false;
    this.verticesCount = meta.vertexCount;
    this.faceCount = meta.triangleCount;
    this.textureFaceCount = meta.texturedTriangleCount;
    this.verticesX = new Int32Array(this.verticesCount);
    this.verticesY = new Int32Array(this.verticesCount);
    this.verticesZ = new Int32Array(this.verticesCount);
    this.indices1 = new Int32Array(this.faceCount);
    this.indices2 = new Int32Array(this.faceCount);
    this.indices3 = new Int32Array(this.faceCount);
    if (this.textureFaceCount > 0) {
      this.textureRenderTypes = new Int8Array(this.textureFaceCount);
      this.textureMappingP = new Int16Array(this.textureFaceCount);
      this.textureMappingM = new Int16Array(this.textureFaceCount);
      this.textureMappingN = new Int16Array(this.textureFaceCount);
    }
    if (meta.vertexLabelsOffset >= 0) {
      this.vertexSkins = new Int32Array(this.verticesCount);
    }
    if (meta.faceInfosOffset >= 0) {
      this.faceRenderTypes = new Int8Array(this.faceCount);
      this.textureCoords = new Int8Array(this.faceCount);
      this.faceTextures = new Int16Array(this.faceCount);
    }
    if (meta.facePrioritiesOffset >= 0) {
      this.faceRenderPriorities = new Int8Array(this.faceCount);
    } else {
      this.priority = -meta.facePrioritiesOffset - 1;
    }
    if (meta.faceAlphasOffset >= 0) {
      this.faceAlphas = new Int8Array(this.faceCount);
    }
    if (meta.faceLabelsOffset >= 0) {
      this.faceSkins = new Int32Array(this.faceCount);
    }
    this.faceColors = new Uint16Array(this.faceCount);
    loader.point1.offset = meta.vertexFlagsOffset;
    loader.point2.offset = meta.vertexXOffset;
    loader.point3.offset = meta.vertexYOffset;
    loader.point4.offset = meta.vertexZOffset;
    loader.point5.offset = meta.vertexLabelsOffset;
    let lastVertX = 0;
    let lastVertY = 0;
    let lastVertZ = 0;
    for (let i = 0; i < this.verticesCount; i++) {
      const flag = loader.point1.readUnsignedByte();
      let deltaVertX = 0;
      if ((flag & 1) !== 0) {
        deltaVertX = loader.point2.readSmart2();
      }
      let deltaVertY = 0;
      if ((flag & 2) !== 0) {
        deltaVertY = loader.point3.readSmart2();
      }
      let deltaVertZ = 0;
      if ((flag & 4) !== 0) {
        deltaVertZ = loader.point4.readSmart2();
      }
      this.verticesX[i] = lastVertX + deltaVertX;
      this.verticesY[i] = lastVertY + deltaVertY;
      this.verticesZ[i] = lastVertZ + deltaVertZ;
      lastVertX = this.verticesX[i];
      lastVertY = this.verticesY[i];
      lastVertZ = this.verticesZ[i];
      if (this.vertexSkins) {
        this.vertexSkins[i] = loader.point5.readUnsignedByte();
      }
    }
    loader.face1.offset = meta.faceColorsOffset;
    loader.face2.offset = meta.faceInfosOffset;
    loader.face3.offset = meta.facePrioritiesOffset;
    loader.face4.offset = meta.faceAlphasOffset;
    loader.face5.offset = meta.faceLabelsOffset;
    for (let i = 0; i < this.faceCount; i++) {
      this.faceColors[i] = loader.face1.readUnsignedShort();
      if (this.faceRenderTypes && this.textureCoords && this.faceTextures) {
        const flag = loader.face2.readUnsignedByte();
        if ((flag & 1) === 1) {
          this.faceRenderTypes[i] = 1;
          hasRenderType = true;
        } else {
          this.faceRenderTypes[i] = 0;
        }
        if ((flag & 2) === 2) {
          this.textureCoords[i] = flag >> 2;
          this.faceTextures[i] = this.faceColors[i];
          this.faceColors[i] = 127;
          if (this.faceTextures[i] !== -1) {
            isTextured = true;
          }
        } else {
          this.textureCoords[i] = -1;
          this.faceTextures[i] = -1;
        }
      }
      if (this.faceRenderPriorities) {
        this.faceRenderPriorities[i] = loader.face3.readByte();
      }
      if (this.faceAlphas) {
        this.faceAlphas[i] = loader.face4.readByte();
      }
      if (this.faceSkins) {
        this.faceSkins[i] = loader.face5.readUnsignedByte();
      }
    }
    loader.vertex1.offset = meta.faceVerticesOffset;
    loader.vertex2.offset = meta.faceOrientationsOffset;
    let index1 = 0;
    let index2 = 0;
    let index3 = 0;
    let lastIndex = 0;
    this.usedVertexCount = -1;
    for (let i = 0; i < this.faceCount; i++) {
      const type = loader.vertex2.readUnsignedByte();
      if (type === 1) {
        index1 = loader.vertex1.readSmart2() + lastIndex;
        index2 = loader.vertex1.readSmart2() + index1;
        index3 = loader.vertex1.readSmart2() + index2;
        lastIndex = index3;
        this.indices1[i] = index1;
        this.indices2[i] = index2;
        this.indices3[i] = index3;
        if (index1 > this.usedVertexCount) {
          this.usedVertexCount = index1;
        }
        if (index2 > this.usedVertexCount) {
          this.usedVertexCount = index2;
        }
        if (index3 > this.usedVertexCount) {
          this.usedVertexCount = index3;
        }
      }
      if (type === 2) {
        index2 = index3;
        index3 = loader.vertex1.readSmart2() + lastIndex;
        lastIndex = index3;
        this.indices1[i] = index1;
        this.indices2[i] = index2;
        this.indices3[i] = index3;
        if (index3 > this.usedVertexCount) {
          this.usedVertexCount = index3;
        }
      }
      if (type === 3) {
        index1 = index3;
        index3 = loader.vertex1.readSmart2() + lastIndex;
        lastIndex = index3;
        this.indices1[i] = index1;
        this.indices2[i] = index2;
        this.indices3[i] = index3;
        if (index3 > this.usedVertexCount) {
          this.usedVertexCount = index3;
        }
      }
      if (type === 4) {
        const temp = index1;
        index1 = index2;
        index2 = temp;
        index3 = loader.vertex1.readSmart2() + lastIndex;
        lastIndex = index3;
        this.indices1[i] = index1;
        this.indices2[i] = temp;
        this.indices3[i] = index3;
        if (index3 > this.usedVertexCount) {
          this.usedVertexCount = index3;
        }
      }
    }
    this.usedVertexCount++;
    loader.axis.offset = meta.faceTextureAxisOffset * 6;
    for (let i = 0; i < this.textureFaceCount; i++) {
      this.textureRenderTypes[i] = 0;
      this.textureMappingP[i] = loader.axis.readUnsignedShort();
      this.textureMappingM[i] = loader.axis.readUnsignedShort();
      this.textureMappingN[i] = loader.axis.readUnsignedShort();
    }
    if (this.textureCoords) {
      let hasValidTexFace = false;
      for (let i = 0; i < this.faceCount; i++) {
        const index = this.textureCoords[i] & 255;
        if (index !== 255) {
          if (this.indices1[i] === (this.textureMappingP[index] & 65535) && this.indices2[i] === (this.textureMappingM[index] & 65535) && this.indices3[i] === (this.textureMappingN[index] & 65535)) {
            this.textureCoords[i] = -1;
          } else {
            hasValidTexFace = true;
          }
        }
      }
      if (!hasValidTexFace) {
        this.textureCoords = void 0;
      }
    }
    if (!isTextured) {
      this.faceTextures = void 0;
    }
    if (!hasRenderType) {
      this.faceRenderTypes = void 0;
    }
  }
  copyFrom(model, shallowIndices, shallowVertices, shallowColors, shallowTextures) {
    this.verticesCount = model.verticesCount;
    this.usedVertexCount = model.usedVertexCount;
    this.faceCount = model.faceCount;
    this.textureFaceCount = model.textureFaceCount;
    if (shallowIndices) {
      this.indices1 = model.indices1;
      this.indices2 = model.indices2;
      this.indices3 = model.indices3;
    } else {
      this.indices1 = new Int32Array(this.faceCount);
      this.indices2 = new Int32Array(this.faceCount);
      this.indices3 = new Int32Array(this.faceCount);
      for (let i = 0; i < this.faceCount; i++) {
        this.indices1[i] = model.indices1[i];
        this.indices2[i] = model.indices2[i];
        this.indices3[i] = model.indices3[i];
      }
    }
    if (shallowVertices) {
      this.verticesX = model.verticesX;
      this.verticesY = model.verticesY;
      this.verticesZ = model.verticesZ;
    } else {
      this.verticesX = new Int32Array(this.verticesCount);
      this.verticesY = new Int32Array(this.verticesCount);
      this.verticesZ = new Int32Array(this.verticesCount);
      for (let i = 0; i < this.verticesCount; i++) {
        this.verticesX[i] = model.verticesX[i];
        this.verticesY[i] = model.verticesY[i];
        this.verticesZ[i] = model.verticesZ[i];
      }
    }
    if (shallowColors) {
      this.faceColors = model.faceColors;
    } else {
      this.faceColors = new Uint16Array(this.faceCount);
      for (let i = 0; i < this.faceCount; i++) {
        this.faceColors[i] = model.faceColors[i];
      }
    }
    if (!shallowTextures && model.faceTextures) {
      this.faceTextures = new Int16Array(this.faceCount);
      for (let i = 0; i < this.faceCount; i++) {
        this.faceTextures[i] = model.faceTextures[i];
      }
    } else {
      this.faceTextures = model.faceTextures;
    }
    this.faceAlphas = model.faceAlphas;
    this.faceRenderTypes = model.faceRenderTypes;
    this.faceRenderPriorities = model.faceRenderPriorities;
    this.textureCoords = model.textureCoords;
    this.priority = model.priority;
    this.textureRenderTypes = model.textureRenderTypes;
    this.textureMappingP = model.textureMappingP;
    this.textureMappingM = model.textureMappingM;
    this.textureMappingN = model.textureMappingN;
    this.textureScaleX = model.textureScaleX;
    this.textureScaleY = model.textureScaleY;
    this.textureScaleZ = model.textureScaleZ;
    this.textureRotation = model.textureRotation;
    this.textureDirection = model.textureDirection;
    this.textureSpeed = model.textureSpeed;
    this.textureTransU = model.textureTransU;
    this.textureTransV = model.textureTransV;
    this.vertexSkins = model.vertexSkins;
    this.faceSkins = model.faceSkins;
    this.vertexLabels = model.vertexLabels;
    this.faceLabels = model.faceLabels;
    this.normals = model.normals;
    this.faceNormals = model.faceNormals;
    this.mergedNormals = model.mergedNormals;
    this.animMayaGroups = model.animMayaGroups;
    this.animMayaScales = model.animMayaScales;
    this.ambient = model.ambient;
    this.contrast = model.contrast;
  }
  copy() {
    const model = new _ModelData();
    if (this.faceRenderTypes) {
      model.faceRenderTypes = new Int8Array(this.faceCount);
      for (let i = 0; i < this.faceCount; i++) {
        model.faceRenderTypes[i] = this.faceRenderTypes[i];
      }
    }
    model.verticesCount = this.verticesCount;
    model.usedVertexCount = this.usedVertexCount;
    model.faceCount = this.faceCount;
    model.textureFaceCount = this.textureFaceCount;
    model.verticesX = this.verticesX;
    model.verticesY = this.verticesY;
    model.verticesZ = this.verticesZ;
    model.indices1 = this.indices1;
    model.indices2 = this.indices2;
    model.indices3 = this.indices3;
    model.faceRenderPriorities = this.faceRenderPriorities;
    model.faceAlphas = this.faceAlphas;
    model.textureCoords = this.textureCoords;
    model.faceColors = this.faceColors;
    model.faceTextures = this.faceTextures;
    model.priority = this.priority;
    model.textureRenderTypes = this.textureRenderTypes;
    model.textureMappingP = this.textureMappingP;
    model.textureMappingM = this.textureMappingM;
    model.textureMappingN = this.textureMappingN;
    model.textureScaleX = this.textureScaleX;
    model.textureScaleY = this.textureScaleY;
    model.textureScaleZ = this.textureScaleZ;
    model.textureRotation = this.textureRotation;
    model.textureDirection = this.textureDirection;
    model.textureSpeed = this.textureSpeed;
    model.textureTransU = this.textureTransU;
    model.textureTransV = this.textureTransV;
    model.vertexSkins = this.vertexSkins;
    model.faceSkins = this.faceSkins;
    model.vertexLabels = this.vertexLabels;
    model.faceLabels = this.faceLabels;
    model.normals = this.normals;
    model.faceNormals = this.faceNormals;
    model.ambient = this.ambient;
    model.contrast = this.contrast;
    return model;
  }
  contourGround(type, param, heightMap, heightMapAbove, sceneX, sceneHeight, sceneZ) {
    if (this.usedVertexCount === 0) {
      return this;
    }
    this.calculateBounds();
    let startX = sceneX + this.minX;
    let endX = sceneX + this.maxX;
    let startY = sceneZ + this.minZ;
    let endY = sceneZ + this.maxZ;
    if ((type === 1 || type === 2 || type === 3 || type === 5) && (startX < 0 || endX + 128 >> 7 >= heightMap.length || startY < 0 || endY + 128 >> 7 >= heightMap[0].length)) {
      return this;
    }
    if (type === 4 || type === 5) {
      if (heightMapAbove === void 0) {
        return this;
      }
      if (startX < 0 || endX + 128 >> 7 >= heightMapAbove.length || startY < 0 || endY + 128 >> 7 >= heightMapAbove[0].length) {
        return this;
      }
    } else {
      startX >>= 7;
      endX = endX + 127 >> 7;
      startY >>= 7;
      endY = endY + 127 >> 7;
      if (heightMap[startX][startY] === sceneHeight && heightMap[endX][startY] === sceneHeight && heightMap[startX][endY] === sceneHeight && heightMap[endX][endY] === sceneHeight) {
        return this;
      }
    }
    const model = new _ModelData();
    model.verticesCount = this.verticesCount;
    model.usedVertexCount = this.usedVertexCount;
    model.faceCount = this.faceCount;
    model.textureFaceCount = this.textureFaceCount;
    model.verticesX = this.verticesX;
    model.verticesZ = this.verticesZ;
    model.indices1 = this.indices1;
    model.indices2 = this.indices2;
    model.indices3 = this.indices3;
    model.faceRenderTypes = this.faceRenderTypes;
    model.faceRenderPriorities = this.faceRenderPriorities;
    model.faceAlphas = this.faceAlphas;
    model.textureCoords = this.textureCoords;
    model.faceColors = this.faceColors;
    model.faceTextures = this.faceTextures;
    model.priority = this.priority;
    model.textureRenderTypes = this.textureRenderTypes;
    model.textureMappingP = this.textureMappingP;
    model.textureMappingM = this.textureMappingM;
    model.textureMappingN = this.textureMappingN;
    model.textureScaleX = this.textureScaleX;
    model.textureScaleY = this.textureScaleY;
    model.textureScaleZ = this.textureScaleZ;
    model.textureRotation = this.textureRotation;
    model.textureDirection = this.textureDirection;
    model.textureSpeed = this.textureSpeed;
    model.textureTransU = this.textureTransU;
    model.textureTransV = this.textureTransV;
    model.vertexSkins = this.vertexSkins;
    model.faceSkins = this.faceSkins;
    model.vertexLabels = this.vertexLabels;
    model.faceLabels = this.faceLabels;
    model.ambient = this.ambient;
    model.contrast = this.contrast;
    model.verticesY = this.verticesY;
    model.contourVerticesY = new Int32Array(model.verticesCount);
    if (type === 1) {
      for (let i = 0; i < model.usedVertexCount; i++) {
        const vx = this.verticesX[i] + sceneX;
        const vz = this.verticesZ[i] + sceneZ;
        const rx = vx & 127;
        const rz = vz & 127;
        const tx = vx >> 7;
        const tz = vz >> 7;
        const h0 = heightMap[tx][tz] * (128 - rx) + heightMap[tx + 1][tz] * rx >> 7;
        const h1 = heightMap[tx][tz + 1] * (128 - rx) + heightMap[tx + 1][tz + 1] * rx >> 7;
        const height = h0 * (128 - rz) + h1 * rz >> 7;
        model.contourVerticesY[i] = this.verticesY[i] + height - sceneHeight;
      }
      for (let i = model.usedVertexCount; i < model.verticesCount; i++) {
        const vx = this.verticesX[i] + sceneX;
        const vz = this.verticesZ[i] + sceneZ;
        const rx = vx & 127;
        const rz = vz & 127;
        const tx = vx >> 7;
        const tz = vz >> 7;
        if (tx >= 0 && tx < heightMap.length - 1 && tz >= 0 && tz < heightMap[0].length - 1) {
          const h0 = heightMap[tx][tz] * (128 - rx) + heightMap[tx + 1][tz] * rx >> 7;
          const h1 = heightMap[tx][tz + 1] * (128 - rx) + heightMap[tx + 1][tz + 1] * rx >> 7;
          const height = h0 * (128 - rz) + h1 * rz >> 7;
          model.contourVerticesY[i] = this.verticesY[i] + height - sceneHeight;
        }
      }
    } else if (type === 2) {
      for (let i = 0; i < model.usedVertexCount; i++) {
        const yRatio = (this.verticesY[i] << 16) / -this.height | 0;
        if (yRatio < param) {
          const vx = this.verticesX[i] + sceneX;
          const vz = this.verticesZ[i] + sceneZ;
          const rx = vx & 127;
          const rz = vz & 127;
          const tx = vx >> 7;
          const tz = vz >> 7;
          const h0 = heightMap[tx][tz] * (128 - rx) + heightMap[tx + 1][tz] * rx >> 7;
          const h1 = heightMap[tx][tz + 1] * (128 - rx) + heightMap[tx + 1][tz + 1] * rx >> 7;
          const height = h0 * (128 - rz) + h1 * rz >> 7;
          model.contourVerticesY[i] = this.verticesY[i] + (height - sceneHeight) * (param - yRatio) / param;
        } else {
          model.contourVerticesY[i] = this.verticesY[i];
        }
      }
      for (let i = model.usedVertexCount; i < model.verticesCount; i++) {
        const yRatio = (this.verticesY[i] << 16) / -this.height | 0;
        if (yRatio < param) {
          const vx = this.verticesX[i] + sceneX;
          const vz = this.verticesZ[i] + sceneZ;
          const rx = vx & 127;
          const rz = vz & 127;
          const tx = vx >> 7;
          const tz = vz >> 7;
          if (tx >= 0 && tx < heightMap.length - 1 && tz >= 0 && tz < heightMap[0].length - 1) {
            const h0 = heightMap[tx][tz] * (128 - rx) + heightMap[tx + 1][tz] * rx >> 7;
            const h1 = heightMap[tx][tz + 1] * (128 - rx) + heightMap[tx + 1][tz + 1] * rx >> 7;
            const height = h0 * (128 - rz) + h1 * rz >> 7;
            model.contourVerticesY[i] = this.verticesY[i] + (height - sceneHeight) * (param - yRatio) / param;
          }
        } else {
          model.contourVerticesY[i] = this.verticesY[i];
        }
      }
    } else if (type === 3) {
      for (let i = 0; i < model.usedVertexCount; i++) {
        model.contourVerticesY[i] = this.verticesY[i];
      }
    } else if (type === 4) {
      const deltaY = this.maxY - this.minY;
      for (let i = 0; i < model.usedVertexCount; i++) {
        const vx = this.verticesX[i] + sceneX;
        const vz = this.verticesZ[i] + sceneZ;
        const rx = vx & 127;
        const rz = vz & 127;
        const tx = vx >> 7;
        const tz = vz >> 7;
        const h0 = heightMapAbove[tx][tz] * (128 - rx) + heightMapAbove[tx + 1][tz] * rx >> 7;
        const h1 = heightMapAbove[tx][tz + 1] * (128 - rx) + heightMapAbove[tx + 1][tz + 1] * rx >> 7;
        const height = h0 * (128 - rz) + h1 * rz >> 7;
        model.contourVerticesY[i] = this.verticesY[i] + height - sceneHeight + deltaY;
      }
    } else if (type === 5) {
      const deltaY = this.maxY - this.minY;
      for (let i = 0; i < model.usedVertexCount; i++) {
        const vx = this.verticesX[i] + sceneX;
        const vz = this.verticesZ[i] + sceneZ;
        const rx = vx & 127;
        const rz = vz & 127;
        const tx = vx >> 7;
        const tz = vz >> 7;
        let h0 = heightMap[tx][tz] * (128 - rx) + heightMap[tx + 1][tz] * rx >> 7;
        let h1 = heightMap[tx][tz + 1] * (128 - rx) + heightMap[tx + 1][tz + 1] * rx >> 7;
        const height = h0 * (128 - rz) + h1 * rz >> 7;
        h0 = heightMapAbove[tx][tz] * (128 - rx) + heightMapAbove[tx + 1][tz] * rx >> 7;
        h1 = heightMapAbove[tx][tz + 1] * (128 - rx) + heightMapAbove[tx + 1][tz + 1] * rx >> 7;
        const heightAbove = h0 * (128 - rz) + h1 * rz >> 7;
        const deltaHeight = height - heightAbove;
        model.contourVerticesY[i] = (((this.verticesY[i] << 8) / deltaY | 0) * deltaHeight >> 8) - (sceneHeight - height);
      }
    }
    model.invalidate();
    return model;
  }
  computeAnimationTables() {
    let skin;
    if (this.vertexSkins) {
      const labelCounts = new Array(256).fill(0);
      let highestSkin = 0;
      const vertexCount = this.usedVertexCount;
      for (let i = 0; i < vertexCount; i++) {
        skin = this.vertexSkins[i];
        if (skin >= 0) {
          labelCounts[skin]++;
          if (skin > highestSkin) {
            highestSkin = skin;
          }
        }
      }
      this.vertexLabels = new Array(highestSkin + 1);
      for (let i = 0; i <= highestSkin; i++) {
        this.vertexLabels[i] = new Int32Array(labelCounts[i]);
        labelCounts[i] = 0;
      }
      for (let label = 0; label < vertexCount; label++) {
        const skin2 = this.vertexSkins[label];
        if (skin2 >= 0) {
          this.vertexLabels[skin2][labelCounts[skin2]++] = label;
        }
      }
      this.vertexSkins = void 0;
    }
    if (this.faceSkins) {
      const labelCounts = new Array(256).fill(0);
      let highestSkin = 0;
      for (let i = 0; i < this.faceCount; i++) {
        skin = this.faceSkins[i];
        if (skin >= 0) {
          labelCounts[skin]++;
          if (skin > highestSkin) {
            highestSkin = skin;
          }
        }
      }
      this.faceLabels = new Array(highestSkin + 1);
      for (let i = 0; i <= highestSkin; i++) {
        this.faceLabels[i] = new Int32Array(labelCounts[i]);
        labelCounts[i] = 0;
      }
      for (let label = 0; label < this.faceCount; label++) {
        const skin2 = this.faceSkins[label];
        if (skin2 >= 0) {
          this.faceLabels[skin2][labelCounts[skin2]++] = label;
        }
      }
      this.faceSkins = void 0;
    }
  }
  rotate90() {
    for (let i = 0; i < this.verticesCount; i++) {
      const temp = this.verticesX[i];
      this.verticesX[i] = this.verticesZ[i];
      this.verticesZ[i] = -temp;
    }
    this.invalidate();
  }
  rotate180() {
    for (let i = 0; i < this.verticesCount; i++) {
      this.verticesX[i] = -this.verticesX[i];
      this.verticesZ[i] = -this.verticesZ[i];
    }
    this.invalidate();
  }
  rotate270() {
    for (let i = 0; i < this.verticesCount; i++) {
      const temp = this.verticesZ[i];
      this.verticesZ[i] = this.verticesX[i];
      this.verticesX[i] = -temp;
    }
    this.invalidate();
  }
  rotate(angle) {
    const sin = SINE[angle];
    const cos = COSINE[angle];
    for (let i = 0; i < this.verticesCount; i++) {
      const temp = sin * this.verticesZ[i] + cos * this.verticesX[i] >> 16;
      this.verticesZ[i] = cos * this.verticesZ[i] - sin * this.verticesX[i] >> 16;
      this.verticesX[i] = temp;
    }
    this.invalidate();
  }
  translate(x, y, z) {
    for (let i = 0; i < this.verticesCount; i++) {
      this.verticesX[i] += x;
      this.verticesY[i] += y;
      this.verticesZ[i] += z;
    }
    this.invalidate();
  }
  recolor(from, to) {
    for (let i = 0; i < this.faceCount; i++) {
      if (this.faceColors[i] === from) {
        this.faceColors[i] = to;
      }
    }
  }
  retexture(from, to) {
    if (this.faceTextures) {
      for (let i = 0; i < this.faceCount; i++) {
        if (this.faceTextures[i] === from) {
          this.faceTextures[i] = to;
        }
      }
    }
  }
  mirror() {
    for (let i = 0; i < this.verticesCount; i++) {
      this.verticesZ[i] = -this.verticesZ[i];
    }
    for (let i = 0; i < this.faceCount; i++) {
      const temp = this.indices1[i];
      this.indices1[i] = this.indices3[i];
      this.indices3[i] = temp;
    }
    this.invalidate();
  }
  resize(resizeX, resizeY, resizeZ) {
    for (let i = 0; i < this.verticesCount; i++) {
      this.verticesX[i] = this.verticesX[i] * resizeX / 128 | 0;
      this.verticesY[i] = this.verticesY[i] * resizeY / 128 | 0;
      this.verticesZ[i] = this.verticesZ[i] * resizeZ / 128 | 0;
    }
    this.invalidate();
  }
  calculateVertexNormals() {
    if (!this.normals) {
      this.normals = new Array(this.usedVertexCount);
      for (let i = 0; i < this.usedVertexCount; i++) {
        this.normals[i] = new VertexNormal();
      }
      const verticesY = this.contourVerticesY || this.verticesY;
      for (let i = 0; i < this.faceCount; i++) {
        const var2 = this.indices1[i];
        const var3 = this.indices2[i];
        const var4 = this.indices3[i];
        const var5 = this.verticesX[var3] - this.verticesX[var2];
        const var6 = verticesY[var3] - verticesY[var2];
        const var7 = this.verticesZ[var3] - this.verticesZ[var2];
        const var8 = this.verticesX[var4] - this.verticesX[var2];
        const var9 = verticesY[var4] - verticesY[var2];
        const var10 = this.verticesZ[var4] - this.verticesZ[var2];
        let var11 = var6 * var10 - var9 * var7;
        let var12 = var7 * var8 - var10 * var5;
        let var13 = var5 * var9 - var8 * var6;
        while (var11 > 8192 || var12 > 8192 || var13 > 8192 || var11 < -8192 || var12 < -8192 || var13 < -8192) {
          var11 >>= 1;
          var12 >>= 1;
          var13 >>= 1;
        }
        let var14 = Math.sqrt(var11 * var11 + var12 * var12 + var13 * var13) | 0;
        if (var14 <= 0) {
          var14 = 1;
        }
        var11 = var11 * 256 / var14 | 0;
        var12 = var12 * 256 / var14 | 0;
        var13 = var13 * 256 / var14 | 0;
        let type;
        if (!this.faceRenderTypes) {
          type = 0;
        } else {
          type = this.faceRenderTypes[i];
        }
        if (type === 0) {
          let normal = this.normals[var2];
          normal.x += var11;
          normal.y += var12;
          normal.z += var13;
          normal.magnitude++;
          normal = this.normals[var3];
          normal.x += var11;
          normal.y += var12;
          normal.z += var13;
          normal.magnitude++;
          normal = this.normals[var4];
          normal.x += var11;
          normal.y += var12;
          normal.z += var13;
          normal.magnitude++;
        } else if (type === 1) {
          if (!this.faceNormals) {
            this.faceNormals = new Array(this.faceCount);
          }
          this.faceNormals[i] = new FaceNormal(var11, var12, var13);
        }
      }
    }
  }
  invalidate() {
    this.normals = void 0;
    this.mergedNormals = void 0;
    this.faceNormals = void 0;
    this.isBoundsCalculated = false;
  }
  calculateBounds() {
    if (!this.isBoundsCalculated) {
      this.height = 0;
      this.minHeight = 0;
      this.minX = 999999;
      this.maxX = -999999;
      this.minY = 999999;
      this.maxY = -999999;
      this.minZ = 99999;
      this.maxZ = -99999;
      const verticesY = this.contourVerticesY ?? this.verticesY;
      for (let i = 0; i < this.usedVertexCount; i++) {
        const vertX = this.verticesX[i];
        const vertY = verticesY[i];
        const vertZ = this.verticesZ[i];
        if (vertX < this.minX) {
          this.minX = vertX;
        }
        if (vertX > this.maxX) {
          this.maxX = vertX;
        }
        if (this.minY > vertY) {
          this.minY = vertY;
        }
        if (this.maxY < vertY) {
          this.maxY = vertY;
        }
        if (vertZ < this.minZ) {
          this.minZ = vertZ;
        }
        if (vertZ > this.maxZ) {
          this.maxZ = vertZ;
        }
        if (-vertY > this.height) {
          this.height = -vertY;
        }
        if (vertY > this.minHeight) {
          this.minHeight = vertY;
        }
      }
      this.isBoundsCalculated = true;
    }
  }
  light(textureLoader, ambient, contrast, lightX, lightY, lightZ) {
    this.calculateVertexNormals();
    if (!this.normals) {
      throw new Error("Failed to calculate normals. This should not be possible.");
    }
    const magnitude = Math.sqrt(lightZ * lightZ + lightX * lightX + lightY * lightY) | 0;
    const lightIntensity = magnitude * contrast >> 8;
    const model = new Model();
    model.faceColors1 = new Int32Array(this.faceCount);
    model.faceColors2 = new Int32Array(this.faceCount);
    model.faceColors3 = new Int32Array(this.faceCount);
    model.faceColors = this.faceColors;
    model.uvs = computeTextureCoords(textureLoader, this);
    if (this.faceTextures) {
      model.faceTextures = new Int16Array(this.faceCount);
      for (let i = 0; i < this.faceCount; i++) {
        const textureId = this.faceTextures[i];
        if (textureId !== -1 && textureLoader.isSd(textureId)) {
          model.faceTextures[i] = this.faceTextures[i];
        } else {
          model.faceTextures[i] = -1;
        }
      }
    } else {
      model.faceTextures = void 0;
    }
    if (this.textureFaceCount > 0 && this.textureCoords) {
      const textureCoords = new Int32Array(this.textureFaceCount);
      for (let i = 0; i < this.faceCount; i++) {
        if (this.textureCoords[i] !== -1) {
          textureCoords[this.textureCoords[i] & 255]++;
        }
      }
      model.texTriangleCount = 0;
      for (let i = 0; i < this.textureFaceCount; i++) {
        if (textureCoords[i] > 0 && this.textureRenderTypes[i] === 0) {
          model.texTriangleCount++;
        }
      }
      model.textureMappingP = new Int32Array(model.texTriangleCount);
      model.textureMappingM = new Int32Array(model.texTriangleCount);
      model.textureMappingN = new Int32Array(model.texTriangleCount);
      let mapIndex = 0;
      for (let i = 0; i < this.textureFaceCount; i++) {
        if (textureCoords[i] > 0 && this.textureRenderTypes[i] === 0) {
          model.textureMappingP[mapIndex] = this.textureMappingP[i] & 65535;
          model.textureMappingM[mapIndex] = this.textureMappingM[i] & 65535;
          model.textureMappingN[mapIndex] = this.textureMappingN[i] & 65535;
          textureCoords[i] = mapIndex++;
        } else {
          textureCoords[i] = -1;
        }
      }
      model.textureCoords = new Int8Array(this.faceCount);
      for (let i = 0; i < this.faceCount; i++) {
        if (this.textureCoords[i] !== -1) {
          model.textureCoords[i] = textureCoords[this.textureCoords[i] & 255];
        } else {
          model.textureCoords[i] = -1;
        }
      }
    }
    for (let i = 0; i < this.faceCount; i++) {
      let type;
      if (!this.faceRenderTypes) {
        type = 0;
      } else {
        type = this.faceRenderTypes[i];
      }
      let alpha;
      if (this.faceAlphas) {
        alpha = this.faceAlphas[i];
      } else {
        alpha = 0;
      }
      let texture;
      if (model.faceTextures) {
        texture = model.faceTextures[i];
      } else {
        texture = -1;
      }
      if (alpha === -2) {
        type = 3;
      }
      if (alpha === -1) {
        type = 2;
      }
      if (texture === -1) {
        if (type === 0) {
          const color = this.faceColors[i] & 65535;
          let normal;
          if (this.mergedNormals && this.mergedNormals[this.indices1[i]]) {
            normal = this.mergedNormals[this.indices1[i]];
          } else {
            normal = this.normals[this.indices1[i]];
          }
          let var14 = ambient + (lightY * normal.y + lightZ * normal.z + lightX * normal.x) / (lightIntensity * normal.magnitude) << 17;
          model.faceColors1[i] = var14 | _ModelData.adjustLightness(color, var14 >> 17);
          if (this.mergedNormals && this.mergedNormals[this.indices2[i]]) {
            normal = this.mergedNormals[this.indices2[i]];
          } else {
            normal = this.normals[this.indices2[i]];
          }
          var14 = ambient + (lightY * normal.y + lightZ * normal.z + lightX * normal.x) / (lightIntensity * normal.magnitude) << 17;
          model.faceColors2[i] = var14 | _ModelData.adjustLightness(color, var14 >> 17);
          if (this.mergedNormals && this.mergedNormals[this.indices3[i]]) {
            normal = this.mergedNormals[this.indices3[i]];
          } else {
            normal = this.normals[this.indices3[i]];
          }
          var14 = ambient + (lightY * normal.y + lightZ * normal.z + lightX * normal.x) / (lightIntensity * normal.magnitude) << 17;
          model.faceColors3[i] = var14 | _ModelData.adjustLightness(color, var14 >> 17);
        } else if (type === 1 && this.faceNormals) {
          const normal = this.faceNormals[i];
          const var14 = ambient + (lightY * normal.y + lightZ * normal.z + lightX * normal.x) / ((lightIntensity >> 1) + lightIntensity) << 17;
          model.faceColors1[i] = var14 | _ModelData.adjustLightness(this.faceColors[i] & 65535, var14 >> 17);
          model.faceColors3[i] = -1;
        } else if (type === 3) {
          model.faceColors1[i] = 128;
          model.faceColors3[i] = -1;
        } else {
          model.faceColors3[i] = -2;
        }
      } else if (type === 0) {
        let normal;
        if (this.mergedNormals && this.mergedNormals[this.indices1[i]]) {
          normal = this.mergedNormals[this.indices1[i]];
        } else {
          normal = this.normals[this.indices1[i]];
        }
        let var14 = ambient + (lightY * normal.y + lightZ * normal.z + lightX * normal.x) / (lightIntensity * normal.magnitude);
        model.faceColors1[i] = _ModelData.clampLightness(var14);
        if (this.mergedNormals && this.mergedNormals[this.indices2[i]]) {
          normal = this.mergedNormals[this.indices2[i]];
        } else {
          normal = this.normals[this.indices2[i]];
        }
        var14 = ambient + (lightY * normal.y + lightZ * normal.z + lightX * normal.x) / (lightIntensity * normal.magnitude);
        model.faceColors2[i] = _ModelData.clampLightness(var14);
        if (this.mergedNormals && this.mergedNormals[this.indices3[i]]) {
          normal = this.mergedNormals[this.indices3[i]];
        } else {
          normal = this.normals[this.indices3[i]];
        }
        var14 = ambient + (lightY * normal.y + lightZ * normal.z + lightX * normal.x) / (lightIntensity * normal.magnitude);
        model.faceColors3[i] = _ModelData.clampLightness(var14);
      } else if (type === 1 && this.faceNormals) {
        const normal = this.faceNormals[i];
        const var14 = ambient + (lightY * normal.y + lightZ * normal.z + lightX * normal.x) / ((lightIntensity >> 1) + lightIntensity);
        model.faceColors1[i] = _ModelData.clampLightness(var14);
        model.faceColors3[i] = -1;
      } else {
        model.faceColors3[i] = -2;
      }
    }
    this.computeAnimationTables();
    model.verticesCount = this.verticesCount;
    model.usedVertexCount = this.usedVertexCount;
    model.verticesX = this.verticesX;
    model.verticesY = this.verticesY;
    model.verticesZ = this.verticesZ;
    model.contourVerticesY = this.contourVerticesY;
    model.faceCount = this.faceCount;
    model.indices1 = this.indices1;
    model.indices2 = this.indices2;
    model.indices3 = this.indices3;
    model.faceRenderPriorities = this.faceRenderPriorities;
    model.faceAlphas = this.faceAlphas;
    model.priority = this.priority;
    model.vertexLabels = this.vertexLabels;
    model.faceLabels = this.faceLabels;
    model.textureScaleX = this.textureScaleX;
    model.textureScaleY = this.textureScaleY;
    model.textureScaleZ = this.textureScaleZ;
    model.textureRotation = this.textureRotation;
    model.textureDirection = this.textureDirection;
    model.textureSpeed = this.textureSpeed;
    model.textureTransU = this.textureTransU;
    model.textureTransV = this.textureTransV;
    model.animMayaGroups = this.animMayaGroups;
    model.animMayaScales = this.animMayaScales;
    return model;
  }
};

// ../rs-party-dashboard/src/rs/model/ModelLoader.ts
var IndexModelLoader = class {
  constructor(modelIndex) {
    this.modelIndex = modelIndex;
  }
  getModel(id) {
    try {
      const file = this.modelIndex.getFile(id, 0);
      return file && ModelData.decode(file.data);
    } catch (e) {
      console.error("Failed loading model file", id, e);
      return void 0;
    }
  }
};
var LegacyModelMetadata = class {
  constructor() {
    this.vertexCount = 0;
    this.triangleCount = 0;
    this.texturedTriangleCount = 0;
    this.vertexFlagsOffset = 0;
    this.vertexXOffset = 0;
    this.vertexYOffset = 0;
    this.vertexZOffset = 0;
    this.faceVerticesOffset = 0;
    this.faceOrientationsOffset = 0;
    this.faceColorsOffset = 0;
    this.faceInfosOffset = 0;
    this.facePrioritiesOffset = 0;
    this.faceAlphasOffset = 0;
    this.faceLabelsOffset = 0;
    this.vertexLabelsOffset = 0;
    this.faceTextureAxisOffset = 0;
  }
};
var LegacyModelLoader = class _LegacyModelLoader {
  static load(modelArchive) {
    return new _LegacyModelLoader(modelArchive);
  }
  constructor(modelArchive) {
    this.head = modelArchive.getFileNamed("ob_head.dat").getDataAsBuffer();
    this.face1 = modelArchive.getFileNamed("ob_face1.dat").getDataAsBuffer();
    this.face2 = modelArchive.getFileNamed("ob_face2.dat").getDataAsBuffer();
    this.face3 = modelArchive.getFileNamed("ob_face3.dat").getDataAsBuffer();
    this.face4 = modelArchive.getFileNamed("ob_face4.dat").getDataAsBuffer();
    this.face5 = modelArchive.getFileNamed("ob_face5.dat").getDataAsBuffer();
    this.point1 = modelArchive.getFileNamed("ob_point1.dat").getDataAsBuffer();
    this.point2 = modelArchive.getFileNamed("ob_point2.dat").getDataAsBuffer();
    this.point3 = modelArchive.getFileNamed("ob_point3.dat").getDataAsBuffer();
    this.point4 = modelArchive.getFileNamed("ob_point4.dat").getDataAsBuffer();
    this.point5 = modelArchive.getFileNamed("ob_point5.dat").getDataAsBuffer();
    this.vertex1 = modelArchive.getFileNamed("ob_vertex1.dat").getDataAsBuffer();
    this.vertex2 = modelArchive.getFileNamed("ob_vertex2.dat").getDataAsBuffer();
    this.axis = modelArchive.getFileNamed("ob_axis.dat").getDataAsBuffer();
    const count = this.count = this.head.readUnsignedShort();
    this.metadatas = new Array(count + 100);
    let vertexTextureDataOffset = 0;
    let labelDataOffset = 0;
    let triangleColorDataOffset = 0;
    let triangleInfoDataOffset = 0;
    let trianglePriorityDataOffset = 0;
    let triangleAlphaDataOffset = 0;
    let triangleSkinDataOffset = 0;
    for (let i = 0; i < count; i++) {
      const index = this.head.readUnsignedShort();
      const meta = this.metadatas[index] = new LegacyModelMetadata();
      meta.vertexCount = this.head.readUnsignedShort();
      meta.triangleCount = this.head.readUnsignedShort();
      meta.texturedTriangleCount = this.head.readUnsignedByte();
      meta.vertexFlagsOffset = this.point1.offset;
      meta.vertexXOffset = this.point2.offset;
      meta.vertexYOffset = this.point3.offset;
      meta.vertexZOffset = this.point4.offset;
      meta.faceVerticesOffset = this.vertex1.offset;
      meta.faceOrientationsOffset = this.vertex2.offset;
      const hasInfo = this.head.readUnsignedByte();
      const hasPriorities = this.head.readUnsignedByte();
      const hasAlpha = this.head.readUnsignedByte();
      const hasSkins = this.head.readUnsignedByte();
      const hasLabels = this.head.readUnsignedByte();
      for (let v = 0; v < meta.vertexCount; v++) {
        const flags = this.point1.readUnsignedByte();
        if ((flags & 1) !== 0) {
          this.point2.readSmart2();
        }
        if ((flags & 2) !== 0) {
          this.point3.readSmart2();
        }
        if ((flags & 4) !== 0) {
          this.point4.readSmart2();
        }
      }
      for (let t = 0; t < meta.triangleCount; t++) {
        const type = this.vertex2.readUnsignedByte();
        if (type === 1) {
          this.vertex1.readSmart2();
          this.vertex1.readSmart2();
        }
        this.vertex1.readSmart2();
      }
      meta.faceColorsOffset = triangleColorDataOffset;
      triangleColorDataOffset += meta.triangleCount * 2;
      if (hasInfo === 1) {
        meta.faceInfosOffset = triangleInfoDataOffset;
        triangleInfoDataOffset += meta.triangleCount;
      } else {
        meta.faceInfosOffset = -1;
      }
      if (hasPriorities === 255) {
        meta.facePrioritiesOffset = trianglePriorityDataOffset;
        trianglePriorityDataOffset += meta.triangleCount;
      } else {
        meta.facePrioritiesOffset = -hasPriorities - 1;
      }
      if (hasAlpha === 1) {
        meta.faceAlphasOffset = triangleAlphaDataOffset;
        triangleAlphaDataOffset += meta.triangleCount;
      } else {
        meta.faceAlphasOffset = -1;
      }
      if (hasSkins === 1) {
        meta.faceLabelsOffset = triangleSkinDataOffset;
        triangleSkinDataOffset += meta.triangleCount;
      } else {
        meta.faceLabelsOffset = -1;
      }
      if (hasLabels === 1) {
        meta.vertexLabelsOffset = labelDataOffset;
        labelDataOffset += meta.vertexCount;
      } else {
        meta.vertexLabelsOffset = -1;
      }
      meta.faceTextureAxisOffset = vertexTextureDataOffset;
      vertexTextureDataOffset += meta.texturedTriangleCount;
    }
  }
  getModel(id) {
    const meta = this.metadatas[id];
    if (!meta) {
      return void 0;
    }
    return ModelData.decodeLegacy(this, meta);
  }
};

// ../rs-party-dashboard/src/rs/model/skeletal/SkeletalBone.ts
var import_gl_matrix3 = require("gl-matrix");

// ../rs-party-dashboard/src/rs/model/skeletal/MatrixPool.ts
var import_gl_matrix2 = require("gl-matrix");
var MatrixPool = class _MatrixPool {
  static {
    this.IDENTITY = import_gl_matrix2.mat4.create();
  }
  static init(size) {
    _MatrixPool.matrixIndex = 0;
    _MatrixPool.matrixLimit = size;
    _MatrixPool.matrixPool = new Array(size);
  }
  static get() {
    if (_MatrixPool.matrixIndex === 0) {
      return import_gl_matrix2.mat4.create();
    } else {
      import_gl_matrix2.mat4.identity(_MatrixPool.matrixPool[--_MatrixPool.matrixIndex]);
      return _MatrixPool.matrixPool[_MatrixPool.matrixIndex];
    }
  }
  static release(m) {
    if (_MatrixPool.matrixIndex < _MatrixPool.matrixLimit - 1) {
      _MatrixPool.matrixPool[_MatrixPool.matrixIndex++] = m;
    }
  }
};
MatrixPool.init(100);

// ../rs-party-dashboard/src/rs/model/skeletal/SkeletalBone.ts
var SkeletalBone = class _SkeletalBone {
  constructor(poseCount, buffer, matrixCompact) {
    this.animMatrix = import_gl_matrix3.mat4.create();
    this.updateAnimModelMatrix = false;
    this.updateFinalMatrix = false;
    this.animModelMatrix = import_gl_matrix3.mat4.create();
    this.finalMatrix = import_gl_matrix3.mat4.create();
    this.parentId = buffer.readShort();
    this.localMatrices = new Array(poseCount);
    this.modelMatrices = new Array(poseCount);
    this.invertedModelMatrices = new Array(poseCount);
    const unused = new Array(poseCount);
    for (let i = 0; i < poseCount; i++) {
      this.localMatrices[i] = _SkeletalBone.readMat4(buffer, matrixCompact);
      unused[i] = new Array(3);
      unused[i][0] = buffer.readFloat();
      unused[i][1] = buffer.readFloat();
      unused[i][2] = buffer.readFloat();
    }
    this.extractTransformations();
  }
  static readMat4(buffer, compact) {
    if (compact) {
      throw new Error("Not implemented");
    } else {
      const m = new Float32Array(16);
      for (let i = 0; i < 16; i++) {
        m[i] = buffer.readFloat();
      }
      return m;
    }
  }
  static getRotation(out, m) {
    out[0] = -Math.asin(m[6]);
    out[1] = 0;
    out[2] = 0;
    const cosRotationX = Math.cos(out[0]);
    if (Math.abs(cosRotationX) > 5e-3) {
      out[1] = Math.atan2(m[2], m[10]);
      out[2] = Math.atan2(m[4], m[5]);
    } else {
      const sinRotationY = m[1];
      const cosRotationY = m[0];
      if (m[6] < 0) {
        out[1] = Math.atan2(sinRotationY, cosRotationY);
      } else {
        out[1] = -Math.atan2(sinRotationY, cosRotationY);
      }
      out[2] = 0;
    }
    return out;
  }
  extractTransformations() {
    const poseCount = this.localMatrices.length;
    this.rotations = new Array(poseCount);
    this.translations = new Array(poseCount);
    this.scalings = new Array(poseCount);
    const invertedLocalMatrix = MatrixPool.get();
    for (let i = 0; i < poseCount; i++) {
      const localMatrix = this.getLocalMatrix(i);
      import_gl_matrix3.mat4.invert(invertedLocalMatrix, localMatrix);
      this.rotations[i] = import_gl_matrix3.vec3.create();
      this.translations[i] = import_gl_matrix3.vec3.create();
      this.scalings[i] = import_gl_matrix3.vec3.create();
      _SkeletalBone.getRotation(this.rotations[i], invertedLocalMatrix);
      import_gl_matrix3.mat4.getTranslation(this.translations[i], localMatrix);
      import_gl_matrix3.mat4.getScaling(this.scalings[i], localMatrix);
    }
    MatrixPool.release(invertedLocalMatrix);
  }
  getLocalMatrix(poseId) {
    return this.localMatrices[poseId];
  }
  getModelMatrix(poseId) {
    if (this.modelMatrices[poseId] === void 0) {
      const modelMatrix = import_gl_matrix3.mat4.create();
      if (this.parent) {
        import_gl_matrix3.mat4.mul(
          modelMatrix,
          this.parent.getModelMatrix(poseId),
          this.getLocalMatrix(poseId)
        );
      } else {
        import_gl_matrix3.mat4.copy(modelMatrix, this.getLocalMatrix(poseId));
      }
      this.modelMatrices[poseId] = modelMatrix;
    }
    return this.modelMatrices[poseId];
  }
  getInvertedModelMatrix(poseId) {
    if (this.invertedModelMatrices[poseId] === void 0) {
      this.invertedModelMatrices[poseId] = import_gl_matrix3.mat4.invert(
        import_gl_matrix3.mat4.create(),
        this.getModelMatrix(poseId)
      );
    }
    return this.invertedModelMatrices[poseId];
  }
  setAnimMatrix(animMatrix) {
    import_gl_matrix3.mat4.copy(this.animMatrix, animMatrix);
    this.updateAnimModelMatrix = true;
    this.updateFinalMatrix = true;
  }
  getAnimMatrix() {
    return this.animMatrix;
  }
  getAnimModelMatrix() {
    if (this.updateAnimModelMatrix) {
      this.updateAnimModelMatrix = false;
      if (this.parent) {
        import_gl_matrix3.mat4.mul(
          this.animModelMatrix,
          this.parent.getAnimModelMatrix(),
          this.getAnimMatrix()
        );
      } else {
        import_gl_matrix3.mat4.copy(this.animModelMatrix, this.getAnimMatrix());
      }
    }
    return this.animModelMatrix;
  }
  getFinalMatrix(poseId) {
    if (this.updateFinalMatrix) {
      this.updateFinalMatrix = false;
      import_gl_matrix3.mat4.mul(
        this.finalMatrix,
        this.getAnimModelMatrix(),
        this.getInvertedModelMatrix(poseId)
      );
    }
    return this.finalMatrix;
  }
  getRotation(poseId) {
    return this.rotations[poseId];
  }
  getTranslation(poseId) {
    return this.translations[poseId];
  }
  getScaling(poseId) {
    return this.scalings[poseId];
  }
};

// ../rs-party-dashboard/src/rs/model/skeletal/SkeletalBase.ts
var SkeletalBase = class {
  constructor(buffer, count) {
    this.bones = new Array(count);
    this.poseCount = buffer.readUnsignedByte();
    for (let i = 0; i < this.bones.length; i++) {
      this.bones[i] = new SkeletalBone(this.poseCount, buffer, false);
    }
    this.linkBones();
  }
  linkBones() {
    for (let i = 0; i < this.bones.length; i++) {
      const bone = this.bones[i];
      if (bone.parentId >= 0) {
        bone.parent = this.bones[bone.parentId];
      }
    }
  }
  updateAnimMatrices(skeletalSeq, frame, masks = void 0, mask = false) {
    const poseId = skeletalSeq.poseId;
    let boneIndex = 0;
    for (const bone of this.bones) {
      if (masks === void 0 || masks[boneIndex] === mask) {
        skeletalSeq.updateAnimMatrix(frame, bone, boneIndex, poseId);
      }
      boneIndex++;
    }
  }
  getBoneCount() {
    return this.bones.length;
  }
  getBone(id) {
    if (id >= this.getBoneCount()) {
      return void 0;
    }
    return this.bones[id];
  }
};

// ../rs-party-dashboard/src/rs/model/seq/SeqBase.ts
var SeqBase = class {
  constructor(id, count, types, transformActor, masks, labels, skeletalBase) {
    this.id = id;
    this.count = count;
    this.types = types;
    this.transformActor = transformActor;
    this.masks = masks;
    this.labels = labels;
    this.skeletalBase = skeletalBase;
  }
};
var LegacySeqBase = class {
  static load(modelArchive) {
    const head = modelArchive.getFileNamed("base_head.dat").getDataAsBuffer();
    const type = modelArchive.getFileNamed("base_type.dat").getDataAsBuffer();
    const label = modelArchive.getFileNamed("base_label.dat").getDataAsBuffer();
    const baseCount = head.readUnsignedShort();
    const lastBaseId = head.readUnsignedShort();
    const bases = new Array(lastBaseId + 1);
    for (let i = 0; i < baseCount; i++) {
      const id = head.readUnsignedShort();
      const count = head.readUnsignedByte();
      const types = new Array(count);
      const transformActor = new Array(count).fill(true);
      const masks = new Uint16Array(count).fill(-1);
      const labels = new Array(count);
      for (let j = 0; j < count; j++) {
        types[j] = type.readUnsignedByte();
        const subCount = label.readUnsignedByte();
        labels[j] = new Array(subCount);
        for (let l = 0; l < subCount; l++) {
          labels[j][l] = label.readUnsignedByte();
        }
      }
      bases[id] = new SeqBase(id, count, types, transformActor, masks, labels);
    }
    return bases;
  }
};
var DatSeqBase = class {
  static load(buf) {
    const count = buf.readUnsignedByte();
    const types = new Array(count);
    const transformActor = new Array(count).fill(true);
    const masks = new Uint16Array(count).fill(-1);
    const labels = new Array(count);
    for (let i = 0; i < count; i++) {
      types[i] = buf.readUnsignedByte();
    }
    for (let i = 0; i < count; i++) {
      const subCount = buf.readUnsignedByte();
      labels[i] = new Array(subCount);
      for (let l = 0; l < subCount; l++) {
        labels[i][l] = buf.readUnsignedByte();
      }
    }
    return new SeqBase(-1, count, types, transformActor, masks, labels);
  }
};
var Dat2SeqBase = class {
  static load(cacheInfo, id, data) {
    const buf = new ByteBuffer(data);
    const count = buf.readUnsignedByte();
    const types = new Array(count);
    const transformActor = new Array(count).fill(false);
    const masks = new Uint16Array(count);
    const labels = new Array(count);
    for (let i = 0; i < count; i++) {
      types[i] = buf.readUnsignedByte();
      if (types[i] === 6 /* TYPE_6 */) {
        types[i] = 2 /* ROTATE */;
      }
    }
    if (cacheInfo.game === "runescape" && cacheInfo.revision >= 481) {
      for (let i = 0; i < count; i++) {
        transformActor[i] = buf.readUnsignedByte() === 1;
      }
    } else {
      transformActor.fill(true);
    }
    if (cacheInfo.game === "runescape" && cacheInfo.revision >= 530) {
      for (let i = 0; i < count; i++) {
        masks[i] = buf.readUnsignedShort();
      }
    } else {
      masks.fill(-1);
    }
    for (let i = 0; i < count; i++) {
      labels[i] = new Array(buf.readUnsignedByte());
    }
    for (let i = 0; i < count; i++) {
      for (let l = 0; l < labels[i].length; l++) {
        labels[i][l] = buf.readUnsignedByte();
      }
    }
    let skeletalBase;
    if (buf.remaining > 0) {
      const boneCount = buf.readUnsignedShort();
      if (boneCount > 0) {
        skeletalBase = new SkeletalBase(buf, boneCount);
      }
    }
    return new SeqBase(id, count, types, transformActor, masks, labels, skeletalBase);
  }
};

// ../rs-party-dashboard/src/rs/model/seq/SeqBaseLoader.ts
var IndexSeqBaseLoader = class {
  constructor(cacheInfo, index) {
    this.cacheInfo = cacheInfo;
    this.index = index;
    this.bases = /* @__PURE__ */ new Map();
  }
  load(id) {
    const cached = this.bases.get(id);
    if (cached) {
      return cached;
    }
    const file = this.index.getFile(id, 0);
    if (!file) {
      return void 0;
    }
    const base = Dat2SeqBase.load(this.cacheInfo, id, file.data);
    this.bases.set(id, base);
    return base;
  }
  clearCache() {
    this.bases.clear();
  }
};

// ../rs-party-dashboard/src/rs/model/seq/SeqFrame.ts
var SeqFrame = class {
  constructor(frameLength, base, transformCount, transformGroups, transformX, transformY, transformZ, resetOriginGroups, hasAlphaTransform, hasColorTransform = false) {
    this.frameLength = frameLength;
    this.base = base;
    this.transformCount = transformCount;
    this.transformGroups = transformGroups;
    this.transformX = transformX;
    this.transformY = transformY;
    this.transformZ = transformZ;
    this.resetOriginGroups = resetOriginGroups;
    this.hasAlphaTransform = hasAlphaTransform;
    this.hasColorTransform = hasColorTransform;
  }
  static {
    this.transformGroupCache = new Int32Array(500);
  }
  static {
    this.transformXCache = new Int32Array(500);
  }
  static {
    this.transformYCache = new Int32Array(500);
  }
  static {
    this.transformZCache = new Int32Array(500);
  }
  static {
    this.resetOriginGroupsCache = new Int32Array(500);
  }
};
var LegacySeqFrame = class {
  static load(modelArchive) {
    const bases = LegacySeqBase.load(modelArchive);
    const head = modelArchive.getFileNamed("frame_head.dat").getDataAsBuffer();
    const tran1 = modelArchive.getFileNamed("frame_tran1.dat").getDataAsBuffer();
    const tran2 = modelArchive.getFileNamed("frame_tran2.dat").getDataAsBuffer();
    const del = modelArchive.getFileNamed("frame_del.dat").getDataAsBuffer();
    const frameCount = head.readUnsignedShort();
    const lastFrameId = head.readUnsignedShort();
    const frames = new Array(lastFrameId + 1);
    for (let f = 0; f < frameCount; f++) {
      const frameId = head.readUnsignedShort();
      const frameLength = del.readUnsignedByte();
      const baseId = head.readUnsignedShort();
      const base = bases[baseId];
      const count = head.readUnsignedByte();
      let transformCount = 0;
      let resetOriginGroup = -1;
      let lastResetOriginGroup = -1;
      let hasAlphaTransform = false;
      for (let i = 0; i < count; i++) {
        const type = base.types[i];
        if (type === 0 /* ORIGIN */) {
          resetOriginGroup = i;
        }
        const flag = tran1.readUnsignedByte();
        if (flag === 0) {
          continue;
        }
        if (type === 0 /* ORIGIN */) {
          lastResetOriginGroup = i;
        }
        SeqFrame.transformGroupCache[transformCount] = i;
        let defaultValue = 0;
        if (type === 3 /* SCALE */) {
          defaultValue = 128;
        }
        if ((flag & 1) !== 0) {
          SeqFrame.transformXCache[transformCount] = tran2.readSmart2();
        } else {
          SeqFrame.transformXCache[transformCount] = defaultValue;
        }
        if ((flag & 2) !== 0) {
          SeqFrame.transformYCache[transformCount] = tran2.readSmart2();
        } else {
          SeqFrame.transformYCache[transformCount] = defaultValue;
        }
        if ((flag & 4) !== 0) {
          SeqFrame.transformZCache[transformCount] = tran2.readSmart2();
        } else {
          SeqFrame.transformZCache[transformCount] = defaultValue;
        }
        SeqFrame.resetOriginGroupsCache[transformCount] = -1;
        if (type === 1 /* TRANSLATE */ || type === 2 /* ROTATE */ || type === 3 /* SCALE */) {
          if (resetOriginGroup > lastResetOriginGroup) {
            SeqFrame.resetOriginGroupsCache[transformCount] = resetOriginGroup;
            lastResetOriginGroup = resetOriginGroup;
          }
        } else if (type === 5 /* ALPHA */) {
          hasAlphaTransform = true;
        }
        transformCount++;
      }
      const transformGroups = new Array(transformCount);
      const transformX = new Array(transformCount);
      const transformY = new Array(transformCount);
      const transformZ = new Array(transformCount);
      const resetOriginGroups = new Array(transformCount);
      for (let i = 0; i < transformCount; i++) {
        transformGroups[i] = SeqFrame.transformGroupCache[i];
        transformX[i] = SeqFrame.transformXCache[i];
        transformY[i] = SeqFrame.transformYCache[i];
        transformZ[i] = SeqFrame.transformZCache[i];
        resetOriginGroups[i] = SeqFrame.resetOriginGroupsCache[i];
      }
      frames[frameId] = new SeqFrame(
        frameLength,
        base,
        transformCount,
        transformGroups,
        transformX,
        transformY,
        transformZ,
        resetOriginGroups,
        hasAlphaTransform
      );
    }
    return frames;
  }
};
var DatSeqFrame = class {
  static load(frames, data) {
    const footerBuffer = new ByteBuffer(data);
    footerBuffer.offset = data.length - 8;
    const frameMapOffset = footerBuffer.readUnsignedShort();
    const flagOffset = footerBuffer.readUnsignedShort();
    const transformOffset = footerBuffer.readUnsignedShort();
    const frameLengthOffset = footerBuffer.readUnsignedShort();
    let totalOffset = 0;
    const frameMapBuffer = new ByteBuffer(data);
    frameMapBuffer.offset = totalOffset;
    totalOffset += frameMapOffset + 2;
    const flagBuffer = new ByteBuffer(data);
    flagBuffer.offset = totalOffset;
    totalOffset += flagOffset;
    const transformBuffer = new ByteBuffer(data);
    transformBuffer.offset = totalOffset;
    totalOffset += transformOffset;
    const frameLengthBuffer = new ByteBuffer(data);
    frameLengthBuffer.offset = totalOffset;
    totalOffset += frameLengthOffset;
    const baseBuffer = new ByteBuffer(data);
    baseBuffer.offset = totalOffset;
    const base = DatSeqBase.load(baseBuffer);
    const frameCount = frameMapBuffer.readUnsignedShort();
    for (let f = 0; f < frameCount; f++) {
      const frameId = frameMapBuffer.readUnsignedShort();
      const frameLength = frameLengthBuffer.readUnsignedByte();
      const count = frameMapBuffer.readUnsignedByte();
      let transformCount = 0;
      let resetOriginGroup = -1;
      let lastResetOriginGroup = -1;
      let hasAlphaTransform = false;
      for (let i = 0; i < count; i++) {
        const type = base.types[i];
        if (type === 0 /* ORIGIN */) {
          resetOriginGroup = i;
        }
        const flag = flagBuffer.readUnsignedByte();
        if (flag === 0) {
          continue;
        }
        if (type === 0 /* ORIGIN */) {
          lastResetOriginGroup = i;
        }
        SeqFrame.transformGroupCache[transformCount] = i;
        let defaultValue = 0;
        if (type === 3 /* SCALE */) {
          defaultValue = 128;
        }
        if ((flag & 1) !== 0) {
          SeqFrame.transformXCache[transformCount] = transformBuffer.readSmart2();
        } else {
          SeqFrame.transformXCache[transformCount] = defaultValue;
        }
        if ((flag & 2) !== 0) {
          SeqFrame.transformYCache[transformCount] = transformBuffer.readSmart2();
        } else {
          SeqFrame.transformYCache[transformCount] = defaultValue;
        }
        if ((flag & 4) !== 0) {
          SeqFrame.transformZCache[transformCount] = transformBuffer.readSmart2();
        } else {
          SeqFrame.transformZCache[transformCount] = defaultValue;
        }
        SeqFrame.resetOriginGroupsCache[transformCount] = -1;
        if (type === 1 /* TRANSLATE */ || type === 2 /* ROTATE */ || type === 3 /* SCALE */) {
          if (resetOriginGroup > lastResetOriginGroup) {
            SeqFrame.resetOriginGroupsCache[transformCount] = resetOriginGroup;
            lastResetOriginGroup = resetOriginGroup;
          }
        } else if (type === 5 /* ALPHA */) {
          hasAlphaTransform = true;
        }
        transformCount++;
      }
      const transformGroups = new Array(transformCount);
      const transformX = new Array(transformCount);
      const transformY = new Array(transformCount);
      const transformZ = new Array(transformCount);
      const resetOriginGroups = new Array(transformCount);
      for (let i = 0; i < transformCount; i++) {
        transformGroups[i] = SeqFrame.transformGroupCache[i];
        transformX[i] = SeqFrame.transformXCache[i];
        transformY[i] = SeqFrame.transformYCache[i];
        transformZ[i] = SeqFrame.transformZCache[i];
        resetOriginGroups[i] = SeqFrame.resetOriginGroupsCache[i];
      }
      frames.set(
        frameId,
        new SeqFrame(
          frameLength,
          base,
          transformCount,
          transformGroups,
          transformX,
          transformY,
          transformZ,
          resetOriginGroups,
          hasAlphaTransform
        )
      );
    }
  }
};
var Dat2SeqFrame = class {
  static load(cacheInfo, baseLoader, data) {
    const buf = new ByteBuffer(data);
    const dataBuf = new ByteBuffer(data);
    if (cacheInfo.game === "runescape" && cacheInfo.revision >= 610) {
      buf.readUnsignedByte();
    }
    const baseId = buf.readUnsignedShort();
    const base = baseLoader.load(baseId);
    if (!base) {
      throw new Error("Invalid frame base id: " + baseId);
    }
    const count = buf.readUnsignedByte();
    dataBuf.offset = buf.offset + count;
    let transformCount = 0;
    let resetOriginGroup = -1;
    let lastResetOriginGroup = -1;
    let hasAlphaTransform = false;
    let hasColorTransform = false;
    for (let i = 0; i < count; i++) {
      const type = base.types[i];
      if (type === 0 /* ORIGIN */) {
        resetOriginGroup = i;
      }
      const flag = buf.readUnsignedByte();
      if (flag === 0) {
        continue;
      }
      if (type === 0 /* ORIGIN */) {
        lastResetOriginGroup = i;
      }
      SeqFrame.transformGroupCache[transformCount] = i;
      let defaultValue = 0;
      if (type === 3 /* SCALE */ || type === 10 /* TYPE_10 */) {
        defaultValue = 128;
      }
      if ((flag & 1) !== 0) {
        SeqFrame.transformXCache[transformCount] = dataBuf.readSmart2();
      } else {
        SeqFrame.transformXCache[transformCount] = defaultValue;
      }
      if ((flag & 2) !== 0) {
        SeqFrame.transformYCache[transformCount] = dataBuf.readSmart2();
      } else {
        SeqFrame.transformYCache[transformCount] = defaultValue;
      }
      if ((flag & 4) !== 0) {
        SeqFrame.transformZCache[transformCount] = dataBuf.readSmart2();
      } else {
        SeqFrame.transformZCache[transformCount] = defaultValue;
      }
      if (cacheInfo.game === "runescape" && cacheInfo.revision >= 610) {
        if (type === 0 /* ORIGIN */ || type === 1 /* TRANSLATE */) {
          SeqFrame.transformXCache[transformCount] >>= 2;
          SeqFrame.transformYCache[transformCount] >>= 2;
          SeqFrame.transformZCache[transformCount] >>= 2;
        } else if (type === 2 /* ROTATE */) {
          SeqFrame.transformXCache[transformCount] >>= 4;
          SeqFrame.transformYCache[transformCount] >>= 4;
          SeqFrame.transformZCache[transformCount] >>= 4;
        } else if (type === 3 /* SCALE */) {
        }
      }
      SeqFrame.resetOriginGroupsCache[transformCount] = -1;
      if (type === 1 /* TRANSLATE */ || type === 2 /* ROTATE */ || type === 3 /* SCALE */) {
        if (resetOriginGroup > lastResetOriginGroup) {
          SeqFrame.resetOriginGroupsCache[transformCount] = resetOriginGroup;
          lastResetOriginGroup = resetOriginGroup;
        }
      } else if (type === 5 /* ALPHA */) {
        hasAlphaTransform = true;
      } else if (type === 7 /* LIGHT */) {
        hasColorTransform = true;
      }
      transformCount++;
    }
    if (count !== 0 && dataBuf.offset !== data.length) {
      throw new Error(
        "SeqFrame: Mismatched buffer offset: " + data.length + ", " + dataBuf.offset + ", " + count + ", " + baseId
      );
    }
    const transformGroups = new Array(transformCount);
    const transformX = new Array(transformCount);
    const transformY = new Array(transformCount);
    const transformZ = new Array(transformCount);
    const resetOriginGroups = new Array(transformCount);
    for (let i = 0; i < transformCount; i++) {
      transformGroups[i] = SeqFrame.transformGroupCache[i];
      transformX[i] = SeqFrame.transformXCache[i];
      transformY[i] = SeqFrame.transformYCache[i];
      transformZ[i] = SeqFrame.transformZCache[i];
      resetOriginGroups[i] = SeqFrame.resetOriginGroupsCache[i];
    }
    return new SeqFrame(
      0,
      base,
      transformCount,
      transformGroups,
      transformX,
      transformY,
      transformZ,
      resetOriginGroups,
      hasAlphaTransform,
      hasColorTransform
    );
  }
};

// ../rs-party-dashboard/src/rs/model/seq/SeqFrameMap.ts
var SeqFrameMap = class {
  constructor(frames) {
    this.frames = frames;
  }
  hasAlphaTransform(frame) {
    return this.frames[frame].hasAlphaTransform;
  }
};

// ../rs-party-dashboard/src/rs/model/seq/SeqFrameLoader.ts
var LegacySeqFrameLoader = class _LegacySeqFrameLoader {
  constructor(frames) {
    this.frames = frames;
  }
  static load(modelArchive) {
    return new _LegacySeqFrameLoader(LegacySeqFrame.load(modelArchive));
  }
  load(id) {
    return this.frames[id];
  }
  clearCache() {
  }
};
var DatSeqFrameLoader = class _DatSeqFrameLoader {
  constructor(frames) {
    this.frames = frames;
  }
  static load(frameMapIndex) {
    const frames = /* @__PURE__ */ new Map();
    for (let i = 0; i < frameMapIndex.getArchiveCount(); i++) {
      try {
        const file = frameMapIndex.getFile(i, 0);
        if (!file) {
          continue;
        }
        DatSeqFrame.load(frames, file.data);
      } catch (e) {
        console.error("Failed loading frame map " + i, e);
      }
    }
    return new _DatSeqFrameLoader(frames);
  }
  load(id) {
    return this.frames.get(id);
  }
  clearCache() {
  }
};
var Dat2SeqFrameLoader = class {
  constructor(cacheInfo, animIndex, baseLoader) {
    this.cacheInfo = cacheInfo;
    this.animIndex = animIndex;
    this.baseLoader = baseLoader;
    this.frameMaps = /* @__PURE__ */ new Map();
  }
  // changed 610
  load(id) {
    const frameMapId = id >> 16;
    const frameId = id & 65535;
    let frameMap = this.frameMaps.get(frameMapId);
    if (!frameMap) {
      const archive = this.animIndex.getArchive(frameMapId);
      const frames = new Array(archive.lastFileId);
      for (const file of archive.files) {
        frames[file.id] = Dat2SeqFrame.load(this.cacheInfo, this.baseLoader, file.data);
      }
      frameMap = new SeqFrameMap(frames);
      this.frameMaps.set(frameMapId, frameMap);
    }
    return frameMap.frames[frameId];
  }
  clearCache() {
    this.frameMaps.clear();
    this.baseLoader.clearCache();
  }
};

// ../rs-party-dashboard/src/rs/model/skeletal/SkeletalSeq.ts
var import_gl_matrix6 = require("gl-matrix");

// ../rs-party-dashboard/src/rs/model/skeletal/CurveInterp.ts
var import_gl_matrix4 = require("gl-matrix");

// ../rs-party-dashboard/src/rs/model/skeletal/CurveInterpType.ts
function getInterpTypeForId(id) {
  if (id < 0 || id > 4 /* TYPE_4 */) {
    return 0 /* TYPE_0 */;
  }
  return id;
}

// ../rs-party-dashboard/src/rs/model/skeletal/CurveInterp.ts
var ULP = 11920929e-14;
var ULP2 = 2 * ULP;
function interpolateCurve(curve, t) {
  if (!curve || !curve.points || curve.points.length === 0) {
    return 0;
  }
  if (t < curve.startTick) {
    if (curve.startInterpType === 0 /* TYPE_0 */) {
      return curve.points[0].y;
    } else {
      return extrapolateCurve(curve, t, true);
    }
  } else if (t > curve.endTick) {
    if (curve.endInterpType === 0 /* TYPE_0 */) {
      return curve.points[curve.points.length - 1].y;
    } else {
      return extrapolateCurve(curve, t, false);
    }
  } else if (curve.noInterp) {
    return curve.points[0].y;
  }
  const point = curve.getCurvePoint(t);
  if (!point) {
    return 0;
  }
  let bool0 = false;
  let bool1 = false;
  if (point.field4 === 0 && point.field5 === 0) {
    bool0 = true;
  } else if (point.field4 === FloatUtil.MAX_VALUE && point.field5 === FloatUtil.MAX_VALUE) {
    bool1 = true;
  } else if (!point.next) {
    bool0 = true;
  } else if (curve.pointIndexUpdated) {
    const var5 = point.x;
    const var9 = point.y;
    const var6 = point.field4 * 0.33333334 + var5;
    const var10 = point.field5 * 0.33333334 + var9;
    const var8 = point.next.x;
    const var12 = point.next.y;
    const var7 = var8 - point.next.field2 * 0.33333334;
    const var11 = var12 - point.next.field3 * 0.33333334;
    if (curve.bool) {
      let var15 = var10;
      let var16 = var11;
      const var17 = var8 - var5;
      if (var17 !== 0) {
        const var18 = var6 - var5;
        const var19 = var7 - var5;
        const var29 = import_gl_matrix4.vec2.fromValues(var18 / var17, var19 / var17);
        curve.interpBool = var29[0] === 0.33333334 && var29[1] === 0.6666667;
        const var21 = var29[0];
        const var22 = var29[1];
        if (var29[0] < 0) {
          var29[0] = 0;
        }
        if (var29[1] > 1) {
          var29[1] = 1;
        }
        if (var29[0] > 1 || var29[1] < -1) {
          method3282(var29);
        }
        if (var29[0] !== var21) {
          if (0 !== var21) {
            var15 = (var10 - var9) * var29[0] / var21 + var9;
          }
        }
        if (var22 !== var29[1]) {
          if (1 !== var22) {
            var16 = var12 - (1 - var29[1]) * (var12 - var11) / (1 - var22);
          }
        }
        curve.interpV0 = var5;
        curve.interpV1 = var8;
        const var23 = var29[0];
        const var24 = var29[1];
        let var25 = var23 - 0;
        let var26 = var24 - var23;
        let var27 = 1 - var24;
        let var28 = var26 - var25;
        curve.interpV5 = var27 - var26 - var28;
        curve.interpV4 = var28 + var28 + var28;
        curve.interpV3 = var25 + var25 + var25;
        curve.interpV2 = 0;
        var25 = var15 - var9;
        var26 = var16 - var15;
        var27 = var12 - var16;
        var28 = var26 - var25;
        curve.interpV9 = var27 - var26 - var28;
        curve.interpV8 = var28 + var28 + var28;
        curve.interpV7 = var25 + var25 + var25;
        curve.interpV6 = var9;
      }
    } else {
      curve.interpV0 = var5;
      const var13 = var8 - var5;
      const var14 = var12 - var9;
      let var15 = var6 - var5;
      let var16 = 0;
      let var17 = 0;
      if (var15 !== 0) {
        var16 = (var10 - var9) / var15;
      }
      var15 = var8 - var7;
      if (var15 !== 0) {
        var17 = (var12 - var11) / var15;
      }
      const var18 = 1 / (var13 * var13);
      const var19 = var16 * var13;
      const var20 = var17 * var13;
      curve.interpV2 = var18 * (var19 + var20 - var14 - var14) / var13;
      curve.interpV3 = var18 * (var14 + var14 + var14 - var19 - var19 - var20);
      curve.interpV4 = var16;
      curve.interpV5 = var9;
    }
    curve.pointIndexUpdated = false;
  }
  if (bool0) {
    return point.y;
  } else if (bool1) {
    if (point.x !== t && point.next) {
      return point.next.y;
    } else {
      return point.y;
    }
  } else if (curve.bool) {
    return method8290(curve, t);
  } else {
    const var6 = t - curve.interpV0;
    const var5 = curve.interpV5 + var6 * ((var6 * curve.interpV2 + curve.interpV3) * var6 + curve.interpV4);
    return var5;
  }
}
function extrapolateCurve(curve, t, isStart) {
  if (!curve || !curve.points || curve.points.length === 0) {
    return 0;
  }
  const var4 = curve.points[0].x;
  const var5 = curve.points[curve.points.length - 1].x;
  const var6 = var5 - var4;
  if (var6 === 0) {
    return curve.points[0].y;
  }
  let var7;
  if (t > var5) {
    var7 = (t - var5) / var6;
  } else {
    var7 = (t - var4) / var6;
  }
  let var8 = var7 | 0;
  let var10 = Math.abs(var7 - var8);
  let var11 = var10 * var6;
  var8 = Math.abs(1 + var8);
  const var12 = var8 / 2;
  const var14 = var12 | 0;
  var10 = var12 - var14;
  if (isStart) {
    if (curve.startInterpType === 4 /* TYPE_4 */) {
      if (var10 !== 0) {
        var11 += var4;
      } else {
        var11 = var5 - var11;
      }
    } else if (curve.startInterpType === 2 /* TYPE_2 */ || curve.startInterpType === 3 /* TYPE_3 */) {
      var11 = var5 - var11;
    } else if (curve.startInterpType === 1 /* TYPE_1 */) {
      var11 = var4 - t;
      const var16 = curve.points[0].field2;
      const var17 = curve.points[0].field3;
      let output2 = curve.points[0].y;
      if (var16 !== 0) {
        output2 -= var11 * var17 / var16;
      }
      return output2;
    }
  } else {
    if (curve.endInterpType === 4 /* TYPE_4 */) {
      if (var10 !== 0) {
        var11 = var5 - var11;
      } else {
        var11 += var4;
      }
    } else if (curve.endInterpType === 2 /* TYPE_2 */ || curve.endInterpType === 3 /* TYPE_3 */) {
      var11 += var4;
    } else if (curve.endInterpType === 1 /* TYPE_1 */) {
      var11 = t - var5;
      const var16 = curve.points[curve.getPointCount() - 1].field4;
      const var17 = curve.points[curve.getPointCount() - 1].field5;
      let output2 = curve.points[curve.getPointCount() - 1].y;
      if (var16 !== 0) {
        output2 += var17 * var11 / var16;
      }
      return output2;
    }
  }
  let output = interpolateCurve(curve, var11);
  if (isStart && curve.startInterpType === 3 /* TYPE_3 */) {
    const var18 = curve.points[curve.points.length - 1].y - curve.points[0].y;
    output = output - var18 * var8;
  } else if (!isStart && curve.endInterpType === 3 /* TYPE_3 */) {
    const var18 = curve.points[curve.points.length - 1].y - curve.points[0].y;
    output = output + var18 * var8;
  }
  return output;
}
function method3282(v) {
  v[1] = 1 - v[1];
  if (v[0] < 0) {
    v[0] = 0;
  }
  if (v[1] < 0) {
    v[1] = 0;
  }
  if (v[0] > 1 || v[1] > 1) {
    const var1 = 1 + v[0] * (v[0] - 2 + v[1]) + (v[1] - 2) * v[1];
    if (var1 + ULP > 0) {
      if (ULP + v[0] < 1.3333334) {
        const var2 = v[0] - 2;
        const var3 = v[0] - 1;
        const var4 = Math.sqrt(var2 * var2 - 4 * var3 * var3);
        const var5 = 0.5 * (var4 + -var2);
        if (v[1] + ULP > var5) {
          v[1] = var5 - ULP;
        } else {
          const var6 = (-var2 - var4) * 0.5;
          if (v[1] < var6 + ULP) {
            v[1] = var6 + ULP;
          }
        }
      } else {
        v[0] = 1.3333334 - ULP;
        v[1] = 0.33333334 - ULP;
      }
    }
  }
  v[1] = 1 - v[1];
}
var method5023Input = new Float32Array(4);
var method5023Output = new Float32Array(5);
function method8290(curve, t) {
  if (!curve) {
    return 0;
  }
  let v0;
  if (curve.interpV0 === t) {
    v0 = 0;
  } else if (t === curve.interpV1) {
    v0 = 1;
  } else {
    v0 = (t - curve.interpV0) / (curve.interpV1 - curve.interpV0);
  }
  let v1;
  if (curve.interpBool) {
    v1 = v0;
  } else {
    method5023Input[3] = curve.interpV5;
    method5023Input[2] = curve.interpV4;
    method5023Input[1] = curve.interpV3;
    method5023Input[0] = curve.interpV2 - v0;
    method5023Output[0] = 0;
    method5023Output[1] = 0;
    method5023Output[2] = 0;
    method5023Output[3] = 0;
    method5023Output[4] = 0;
    const var4 = method5023(method5023Input, 3, 0, true, 1, true, method5023Output);
    if (var4 === 1) {
      v1 = method5023Output[0];
    } else {
      v1 = 0;
    }
  }
  return v1 * (curve.interpV7 + v1 * (v1 * curve.interpV9 + curve.interpV8)) + curve.interpV6;
}
function method6869(values, lastIndex, var2) {
  let output = values[lastIndex];
  for (let i = lastIndex - 1; i >= 0; i--) {
    output = output * var2 + values[i];
  }
  return output;
}
function method5023(var0, var1, var2, var3, var4, var5, var6) {
  let var7 = 0;
  for (let i = 0; i < var1 + 1; i++) {
    var7 += Math.abs(var0[i]);
  }
  const var44 = (Math.abs(var2) + Math.abs(var4)) * (var1 + 1) * ULP;
  if (var7 <= var44) {
    return -1;
  }
  const var9 = new Float32Array(var1 + 1);
  for (let i = 0; i < var1 + 1; i++) {
    var9[i] = 1 / var7 * var0[i];
  }
  while (Math.abs(var9[var1]) < var44) {
    var1--;
  }
  let status = 0;
  if (var1 === 0) {
    return status;
  } else if (var1 === 1) {
    var6[0] = -var9[0] / var9[1];
    const var42 = var3 ? var2 < var6[0] + var44 : var2 < var6[0] - var44;
    const var43 = var5 ? var4 > var6[0] - var44 : var4 > var6[0] + var44;
    status = var42 && var43 ? 1 : 0;
    if (status > 0) {
      if (var3 && var6[0] < var2) {
        var6[0] = var2;
      } else if (var5 && var6[0] > var4) {
        var6[0] = var4;
      }
    }
    return status;
  } else {
    const field4756 = var9;
    const field4757 = var1;
    const var12 = new Float32Array(var1 + 1);
    for (let var13 = 1; var13 <= var1; var13++) {
      var12[var13 - 1] = var13 * var9[var13];
    }
    const var41 = new Float32Array(var1 + 1);
    const recursiveStatus = method5023(var12, var1 - 1, var2, false, var4, false, var41);
    if (recursiveStatus === -1) {
      return 0;
    }
    let var15 = false;
    let var17 = 0;
    let var18 = 0;
    let var19 = 0;
    for (let s = 0; s <= recursiveStatus; s++) {
      if (status > var1) {
        return status;
      }
      let var16;
      if (s === 0) {
        var16 = var2;
        var18 = method6869(var9, var1, var2);
        if (Math.abs(var18) <= var44 && var3) {
          var6[status++] = var2;
        }
      } else {
        var16 = var19;
        var18 = var17;
      }
      if (recursiveStatus === s) {
        var19 = var4;
        var15 = false;
      } else {
        var19 = var41[s];
      }
      var17 = method6869(var9, var1, var19);
      if (var15) {
        var15 = false;
      } else if (Math.abs(var17) < var44) {
        if (recursiveStatus !== s || var5) {
          var6[status++] = var19;
          var15 = true;
        }
      } else if (var18 < 0 && var17 > 0 || var18 > 0 && var17 < 0) {
        let var22 = status++;
        let var24 = var16;
        let var25 = var19;
        let var26 = method6869(field4756, field4757, var16);
        let var23;
        if (Math.abs(var26) < ULP) {
          var23 = var16;
        } else {
          let var27 = method6869(field4756, field4757, var19);
          if (Math.abs(var27) < ULP) {
            var23 = var19;
          } else {
            let var28 = 0;
            let var29 = 0;
            let var30 = 0;
            let var35 = 0;
            let var36 = true;
            let var37 = false;
            do {
              var37 = false;
              if (var36) {
                var28 = var24;
                var35 = var26;
                var29 = var25 - var24;
                var30 = var29;
                var36 = false;
              }
              if (Math.abs(var35) < Math.abs(var27)) {
                var24 = var25;
                var25 = var28;
                var28 = var24;
                var26 = var27;
                var27 = var35;
                var35 = var26;
              }
              const var38 = ULP2 * Math.abs(var25) + 0;
              const var39 = 0.5 * (var28 - var25);
              const var40 = Math.abs(var39) > var38 && var27 !== 0;
              if (var40) {
                if (Math.abs(var30) < var38 || Math.abs(var26) <= Math.abs(var27)) {
                  var29 = var39;
                  var30 = var39;
                } else {
                  let var34 = var27 / var26;
                  let var31;
                  let var32;
                  if (var24 === var28) {
                    var31 = var39 * 2 * var34;
                    var32 = 1 - var34;
                  } else {
                    var32 = var26 / var35;
                    const var33 = var27 / var35;
                    var31 = var34 * (var39 * 2 * var32 * (var32 - var33) - (var33 - 1) * (var25 - var24));
                    var32 = (var33 - 1) * (var32 - 1) * (var34 - 1);
                  }
                  if (var31 > 0) {
                    var32 = -var32;
                  } else {
                    var31 = -var31;
                  }
                  var34 = var30;
                  var30 = var29;
                  if (2 * var31 < 3 * var39 * var32 - Math.abs(var32 * var38) && var31 < Math.abs(var32 * var34 * 0.5)) {
                    var29 = var31 / var32;
                  } else {
                    var29 = var39;
                    var30 = var39;
                  }
                }
                var24 = var25;
                var26 = var27;
                if (Math.abs(var29) > var38) {
                  var25 += var29;
                } else if (var39 > 0) {
                  var25 += var38;
                } else {
                  var25 -= var38;
                }
                var27 = method6869(field4756, field4757, var25);
                if (var27 * (var35 / Math.abs(var35)) > 0) {
                  var36 = true;
                  var37 = true;
                } else {
                  var37 = true;
                }
              }
            } while (var37);
            var23 = var25;
          }
        }
        var6[var22] = var23;
        if (status > 1 && var6[status - 2] >= var6[status - 1] - var44) {
          var6[status - 2] = 0.5 * (var6[status - 2] + var6[status - 1]);
          status--;
        }
      }
    }
    return status;
  }
}

// ../rs-party-dashboard/src/rs/model/skeletal/Curve.ts
var Curve = class {
  constructor(id) {
    this.id = id;
    this.noInterp = false;
    this.pointIndex = 0;
    this.pointIndexUpdated = true;
    this.interpBool = false;
    this.interpV0 = 0;
    this.interpV1 = 0;
    this.interpV2 = 0;
    this.interpV3 = 0;
    this.interpV4 = 0;
    this.interpV5 = 0;
    this.interpV6 = 0;
    this.interpV7 = 0;
    this.interpV8 = 0;
    this.interpV9 = 0;
  }
  decode(buffer, version) {
    const count = buffer.readUnsignedShort();
    this.type = buffer.readUnsignedByte();
    this.startInterpType = getInterpTypeForId(buffer.readUnsignedByte());
    this.endInterpType = getInterpTypeForId(buffer.readUnsignedByte());
    this.bool = buffer.readUnsignedByte() !== 0;
    this.points = new Array(count);
    let lastPoint;
    for (let i = 0; i < count; i++) {
      const point = new CurvePoint();
      point.decode(buffer, version);
      this.points[i] = point;
      if (lastPoint) {
        lastPoint.next = point;
      }
      lastPoint = point;
    }
  }
  load() {
    if (!this.points) {
      return;
    }
    this.startTick = this.points[0].x;
    this.endTick = this.points[this.points.length - 1].x;
    this.values = new Float32Array(this.getTickDuration() + 1);
    for (let t = this.startTick; t <= this.endTick; t++) {
      this.values[t - this.startTick] = interpolateCurve(this, t);
    }
    this.points = void 0;
    this.minValue = interpolateCurve(this, this.startTick - 1);
    this.maxValue = interpolateCurve(this, this.endTick + 1);
  }
  getValue(t) {
    if (t < this.startTick) {
      return this.minValue;
    } else if (t > this.endTick) {
      return this.maxValue;
    } else {
      return this.values[t - this.startTick];
    }
  }
  getPointIndex(t) {
    if (!this.points) {
      return this.pointIndex;
    }
    if (this.pointIndex < 0 || this.points[this.pointIndex].x > t || this.points[this.pointIndex].next && this.points[this.pointIndex].next.x <= t) {
      if (t >= this.startTick && t <= this.endTick) {
        const pointCount = this.points.length;
        let newPointIndex = this.pointIndex;
        if (pointCount > 0) {
          let startPointIndex = 0;
          let endPointIndex = pointCount - 1;
          do {
            const pointIndex = startPointIndex + endPointIndex >> 1;
            if (t < this.points[pointIndex].x) {
              if (t > this.points[pointIndex - 1].x) {
                newPointIndex = pointIndex - 1;
                break;
              }
              endPointIndex = pointIndex - 1;
            } else {
              if (t <= this.points[pointIndex].x) {
                newPointIndex = pointIndex;
                break;
              }
              if (t < this.points[pointIndex + 1].x) {
                newPointIndex = pointIndex;
                break;
              }
              startPointIndex = pointIndex + 1;
            }
          } while (startPointIndex <= endPointIndex);
        }
        if (this.pointIndex !== newPointIndex) {
          this.pointIndex = newPointIndex;
          this.pointIndexUpdated = true;
        }
        return this.pointIndex;
      } else {
        return -1;
      }
    } else {
      return this.pointIndex;
    }
  }
  getCurvePoint(t) {
    if (!this.points) {
      return void 0;
    }
    const index = this.getPointIndex(t);
    if (index < 0 || index >= this.points.length) {
      return void 0;
    }
    return this.points[index];
  }
  getPointCount() {
    if (this.points) {
      return this.points.length;
    }
    return 0;
  }
  getTickDuration() {
    return this.endTick - this.startTick;
  }
};
var CurvePoint = class {
  decode(buffer, version) {
    this.x = buffer.readShort();
    this.y = buffer.readFloat();
    this.field2 = buffer.readFloat();
    this.field3 = buffer.readFloat();
    this.field4 = buffer.readFloat();
    this.field5 = buffer.readFloat();
  }
};

// ../rs-party-dashboard/src/rs/model/skeletal/CurveType.ts
function getCurveTypeForId(id) {
  if (id < 0 || id > 16 /* TYPE_16 */) {
    return 0 /* TYPE_0 */;
  }
  return id;
}
var CURVE_INDICES = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 0, 1, 2, 3, 4, 5, 0];
function getCurveIndex(type) {
  return CURVE_INDICES[type];
}

// ../rs-party-dashboard/src/rs/model/skeletal/QuatPool.ts
var import_gl_matrix5 = require("gl-matrix");
var QuatPool = class _QuatPool {
  static init(size) {
    _QuatPool.quatIndex = 0;
    _QuatPool.quatLimit = size;
    _QuatPool.quatPool = new Array(size);
  }
  static get() {
    if (_QuatPool.quatIndex === 0) {
      return import_gl_matrix5.quat.create();
    } else {
      import_gl_matrix5.quat.identity(_QuatPool.quatPool[--_QuatPool.quatIndex]);
      return _QuatPool.quatPool[_QuatPool.quatIndex];
    }
  }
  static release(q) {
    if (_QuatPool.quatIndex < _QuatPool.quatLimit - 1) {
      _QuatPool.quatPool[_QuatPool.quatIndex++] = q;
    }
  }
};
QuatPool.init(100);

// ../rs-party-dashboard/src/rs/model/skeletal/SkeletalTransformType.ts
function getTransformTypeForId(id) {
  if (id < 0 || id > 5 /* TYPE_5 */) {
    return 0 /* TYPE_0 */;
  }
  return id;
}
var CURVE_COUNTS = [0, 9, 3, 6, 1, 3];
function getCurveCount(type) {
  return CURVE_COUNTS[type];
}

// ../rs-party-dashboard/src/rs/model/skeletal/SkeletalSeq.ts
var rotateAxis = import_gl_matrix6.vec3.create();
var scaleVector2 = import_gl_matrix6.vec3.create();
var SkeletalSeq = class _SkeletalSeq {
  constructor(id, version, base, skeletalBase, buffer) {
    this.id = id;
    this.version = version;
    this.base = base;
    this.skeletalBase = skeletalBase;
    this.hasAlphaTransform = false;
    buffer.readUnsignedShort();
    buffer.readUnsignedShort();
    this.poseId = buffer.readUnsignedByte();
    this.curveCount = buffer.readUnsignedShort();
    this.boneCurves = new Array(skeletalBase.bones.length);
    this.curves = new Array(base.count);
    for (let i = 0; i < this.curveCount; i++) {
      const transformType = getTransformTypeForId(buffer.readUnsignedByte());
      const boneIndex = buffer.readSmart2();
      const curveType = getCurveTypeForId(buffer.readUnsignedByte());
      const curve = new Curve(i);
      curve.decode(buffer, version);
      let curves;
      if (transformType === 1 /* BONE */) {
        curves = this.boneCurves;
      } else {
        curves = this.curves;
      }
      if (curves[boneIndex] === void 0) {
        curves[boneIndex] = new Array(getCurveCount(transformType));
      }
      curve.load();
      curves[boneIndex][getCurveIndex(curveType)] = curve;
      if (transformType === 4 /* ALPHA */) {
        this.hasAlphaTransform = true;
      }
    }
  }
  static load(baseLoader, id, data) {
    const buffer = new ByteBuffer(data);
    const version = buffer.readUnsignedByte();
    const baseId = buffer.readUnsignedShort();
    const base = baseLoader.load(baseId);
    if (!base) {
      throw new Error("Invalid skeletal base id: " + baseId);
    }
    const skeletalBase = base.skeletalBase;
    if (!skeletalBase) {
      throw new Error("Missing skeletal base: " + baseId);
    }
    return new _SkeletalSeq(id, version, base, skeletalBase, buffer);
  }
  updateAnimMatrix(frame, bone, boneIndex, poseId) {
    const matrix = MatrixPool.get();
    this.applyRotation(matrix, boneIndex, bone, frame);
    this.applyScaling(matrix, boneIndex, bone, frame);
    this.applyTranslation(matrix, boneIndex, bone, frame);
    bone.setAnimMatrix(matrix);
    MatrixPool.release(matrix);
  }
  applyRotation(matrix, boneIndex, bone, frame) {
    const rotation = bone.getRotation(this.poseId);
    let rotateX = rotation[0];
    let rotateY = rotation[1];
    let rotateZ = rotation[2];
    if (this.boneCurves[boneIndex]) {
      const curveX = this.boneCurves[boneIndex][0];
      const curveY = this.boneCurves[boneIndex][1];
      const curveZ = this.boneCurves[boneIndex][2];
      if (curveX) {
        rotateX = curveX.getValue(frame);
      }
      if (curveY) {
        rotateY = curveY.getValue(frame);
      }
      if (curveZ) {
        rotateZ = curveZ.getValue(frame);
      }
    }
    const quatX = QuatPool.get();
    import_gl_matrix6.vec3.set(rotateAxis, 1, 0, 0);
    import_gl_matrix6.quat.setAxisAngle(quatX, rotateAxis, rotateX);
    const quatY = QuatPool.get();
    import_gl_matrix6.vec3.set(rotateAxis, 0, 1, 0);
    import_gl_matrix6.quat.setAxisAngle(quatY, rotateAxis, rotateY);
    const quatZ = QuatPool.get();
    import_gl_matrix6.vec3.set(rotateAxis, 0, 0, 1);
    import_gl_matrix6.quat.setAxisAngle(quatZ, rotateAxis, rotateZ);
    const quaternion = QuatPool.get();
    import_gl_matrix6.quat.mul(quaternion, quatZ, quaternion);
    import_gl_matrix6.quat.mul(quaternion, quatX, quaternion);
    import_gl_matrix6.quat.mul(quaternion, quatY, quaternion);
    const rotateMatrix = MatrixPool.get();
    import_gl_matrix6.mat4.fromQuat(rotateMatrix, quaternion);
    import_gl_matrix6.mat4.mul(matrix, rotateMatrix, matrix);
    QuatPool.release(quatX);
    QuatPool.release(quatY);
    QuatPool.release(quatZ);
    QuatPool.release(quaternion);
    MatrixPool.release(rotateMatrix);
  }
  applyScaling(matrix, boneIndex, bone, frame) {
    const scaling = bone.getScaling(this.poseId);
    let scaleX = scaling[0];
    let scaleY = scaling[1];
    let scaleZ = scaling[2];
    if (this.boneCurves[boneIndex]) {
      const curveX = this.boneCurves[boneIndex][6];
      const curveY = this.boneCurves[boneIndex][7];
      const curveZ = this.boneCurves[boneIndex][8];
      if (curveX) {
        scaleX = curveX.getValue(frame);
      }
      if (curveY) {
        scaleY = curveY.getValue(frame);
      }
      if (curveZ) {
        scaleZ = curveZ.getValue(frame);
      }
    }
    const scaleMatrix = MatrixPool.get();
    import_gl_matrix6.vec3.set(scaleVector2, scaleX, scaleY, scaleZ);
    import_gl_matrix6.mat4.fromScaling(scaleMatrix, scaleVector2);
    import_gl_matrix6.mat4.mul(matrix, scaleMatrix, matrix);
    MatrixPool.release(scaleMatrix);
  }
  applyTranslation(matrix, boneIndex, bone, frame) {
    const translation = bone.getTranslation(this.poseId);
    let transX = translation[0];
    let transY = translation[1];
    let transZ = translation[2];
    if (this.boneCurves[boneIndex]) {
      const curveX = this.boneCurves[boneIndex][3];
      const curveY = this.boneCurves[boneIndex][4];
      const curveZ = this.boneCurves[boneIndex][5];
      if (curveX) {
        transX = curveX.getValue(frame);
      }
      if (curveY) {
        transY = curveY.getValue(frame);
      }
      if (curveZ) {
        transZ = curveZ.getValue(frame);
      }
    }
    matrix[12] = transX;
    matrix[13] = transY;
    matrix[14] = transZ;
  }
};

// ../rs-party-dashboard/src/rs/model/skeletal/SkeletalSeqLoader.ts
var IndexSkeletalSeqLoader = class {
  constructor(animIndex, baseLoader) {
    this.animIndex = animIndex;
    this.baseLoader = baseLoader;
    this.seqs = /* @__PURE__ */ new Map();
    this.archiveCache = /* @__PURE__ */ new Map();
  }
  load(id) {
    const cached = this.seqs.get(id);
    if (cached) {
      return cached;
    }
    const archiveId = id >> 16;
    const fileId = id & 65535;
    let archive = this.archiveCache.get(archiveId);
    if (!archive) {
      archive = this.animIndex.getArchive(archiveId);
      this.archiveCache.set(archiveId, archive);
    }
    const file = archive.getFile(fileId);
    if (!file) {
      return void 0;
    }
    const skeletalSeq = SkeletalSeq.load(this.baseLoader, id, file.data);
    this.seqs.set(id, skeletalSeq);
    return skeletalSeq;
  }
  clearCache() {
    this.seqs.clear();
    this.archiveCache.clear();
  }
};

// ../rs-party-dashboard/src/rs/graphics/Rasterizer2D.ts
var Rasterizer2D = class _Rasterizer2D {
  static setRaster(pixels, width, height) {
    _Rasterizer2D.pixels = pixels;
    _Rasterizer2D.width = width;
    _Rasterizer2D.height = height;
    _Rasterizer2D.setClip(0, 0, width, height);
  }
  static setClip(x, y, width, height) {
    if (x < 0) {
      x = 0;
    }
    if (y < 0) {
      y = 0;
    }
    if (width > _Rasterizer2D.width) {
      width = _Rasterizer2D.width;
    }
    if (height > _Rasterizer2D.height) {
      height = _Rasterizer2D.height;
    }
    _Rasterizer2D.xClipStart = x;
    _Rasterizer2D.yClipStart = y;
    _Rasterizer2D.xClipEnd = width;
    _Rasterizer2D.yClipEnd = height;
  }
  static fillRectangle(x, y, width, height, rgb) {
    if (x < _Rasterizer2D.xClipStart) {
      width -= _Rasterizer2D.xClipStart - x;
      x = _Rasterizer2D.xClipStart;
    }
    if (y < _Rasterizer2D.yClipStart) {
      height -= _Rasterizer2D.yClipStart - y;
      y = _Rasterizer2D.yClipStart;
    }
    if (x + width > _Rasterizer2D.xClipEnd) {
      width = _Rasterizer2D.xClipEnd - x;
    }
    if (height + y > _Rasterizer2D.yClipEnd) {
      height = _Rasterizer2D.yClipEnd - y;
    }
    const widthOffset = _Rasterizer2D.width - width;
    let offset = x + _Rasterizer2D.width * y;
    for (let h = -height; h < 0; h++) {
      for (let w = -width; w < 0; w++) {
        _Rasterizer2D.pixels[offset++] = rgb;
      }
      offset += widthOffset;
    }
  }
};

// ../rs-party-dashboard/src/rs/sprite/IndexedSprite.ts
var IndexedSprite = class _IndexedSprite {
  static raster(pixels, spritePixels, palette, startX, startY, width, height, endX, endY) {
    let var9 = -(width >> 2);
    width = -(width & 3);
    for (let var10 = -height; var10 < 0; var10++) {
      for (let var11 = var9; var11 < 0; var11++) {
        let p = spritePixels[startX++];
        if (p !== 0) {
          pixels[startY++] = palette[p & 255];
        } else {
          startY++;
        }
        p = spritePixels[startX++];
        if (p !== 0) {
          pixels[startY++] = palette[p & 255];
        } else {
          startY++;
        }
        p = spritePixels[startX++];
        if (p !== 0) {
          pixels[startY++] = palette[p & 255];
        } else {
          startY++;
        }
        p = spritePixels[startX++];
        if (p !== 0) {
          pixels[startY++] = palette[p & 255];
        } else {
          startY++;
        }
      }
      for (let var11 = width; var11 < 0; var11++) {
        let var12 = spritePixels[startX++];
        if (var12 !== 0) {
          pixels[startY++] = palette[var12 & 255];
        } else {
          startY++;
        }
      }
      startY += endX;
      startX += endY;
    }
  }
  normalize() {
    if (this.subWidth !== this.width || this.subHeight !== this.height) {
      const pixels = new Uint8Array(this.width * this.height);
      let index = 0;
      for (let y = 0; y < this.subHeight; y++) {
        for (let x = 0; x < this.subWidth; x++) {
          pixels[x + (y + this.yOffset) * this.width + this.xOffset] = this.pixels[index++];
        }
      }
      this.pixels = pixels;
      this.subWidth = this.width;
      this.subHeight = this.height;
      this.xOffset = 0;
      this.yOffset = 0;
    }
  }
  shiftColors(rOffset, gOffset, bOffset) {
    for (let i = 0; i < this.palette.length; i++) {
      let r = this.palette[i] >> 16 & 255;
      r += rOffset;
      if (r < 0) {
        r = 0;
      } else if (r > 255) {
        r = 255;
      }
      let g = this.palette[i] >> 8 & 255;
      g += gOffset;
      if (g < 0) {
        g = 0;
      } else if (g > 255) {
        g = 255;
      }
      let b = this.palette[i] & 255;
      b += bOffset;
      if (b < 0) {
        b = 0;
      } else if (b > 255) {
        b = 255;
      }
      this.palette[i] = b + (g << 8) + (r << 16);
    }
  }
  getPixelsRgb() {
    const dstWidth = this.width;
    const dst = new Int32Array(this.width * this.height);
    for (let y = 0; y < this.height; y++) {
      let srcIndex = y * this.width;
      let dstIndex = this.xOffset + (y + this.yOffset) * dstWidth;
      for (let x = 0; x < this.width; x++) {
        const rgb = this.palette[this.pixels[srcIndex++] & 255];
        if (rgb !== 0) {
          dst[dstIndex++] = ~16777215 | rgb;
        } else {
          dst[dstIndex++] = 0;
        }
      }
    }
    return dst;
  }
  getCanvas() {
    const canvas = new OffscreenCanvas(this.width, this.height);
    const ctx = canvas.getContext("2d");
    const imageData = ctx.createImageData(this.width, this.height);
    for (let i = 0; i < this.pixels.length; i++) {
      const rgb = this.palette[this.pixels[i] & 255];
      if (rgb !== 0) {
        imageData.data[i * 4] = rgb >> 16 & 255;
        imageData.data[i * 4 + 1] = rgb >> 8 & 255;
        imageData.data[i * 4 + 2] = rgb & 255;
        imageData.data[i * 4 + 3] = 255;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  drawAt(x, y) {
    x += this.xOffset;
    y += this.yOffset;
    let startY = x + y * Rasterizer2D.width;
    let startX = 0;
    let height = this.subHeight;
    let width = this.subWidth;
    let endX = Rasterizer2D.width - width;
    let endY = 0;
    if (y < Rasterizer2D.yClipStart) {
      const var9 = Rasterizer2D.yClipStart - y;
      height -= var9;
      y = Rasterizer2D.yClipStart;
      startX += var9 * width;
      startY += var9 * Rasterizer2D.width;
    }
    if (height + y > Rasterizer2D.yClipEnd) {
      height -= height + y - Rasterizer2D.yClipEnd;
    }
    if (x < Rasterizer2D.xClipStart) {
      const var9 = Rasterizer2D.xClipStart - x;
      width -= var9;
      x = Rasterizer2D.xClipStart;
      startX += var9;
      startY += var9;
      endY += var9;
      endX += var9;
    }
    if (width + x > Rasterizer2D.xClipEnd) {
      const var9 = width + x - Rasterizer2D.xClipEnd;
      width -= var9;
      endY += var9;
      endX += var9;
    }
    if (width > 0 && height > 0) {
      _IndexedSprite.raster(
        Rasterizer2D.pixels,
        this.pixels,
        this.palette,
        startX,
        startY,
        width,
        height,
        endX,
        endY
      );
    }
  }
};

// ../rs-party-dashboard/src/rs/sprite/SpriteLoader.ts
var SpriteLoader = class _SpriteLoader {
  static {
    this.spriteCount = 0;
  }
  static {
    this.width = 0;
  }
  static {
    this.height = 0;
  }
  static load(data) {
    const buffer = new ByteBuffer(data);
    buffer.offset = data.length - 2;
    _SpriteLoader.spriteCount = buffer.readUnsignedShort();
    _SpriteLoader.xOffsets = new Int32Array(_SpriteLoader.spriteCount);
    _SpriteLoader.yOffsets = new Int32Array(_SpriteLoader.spriteCount);
    _SpriteLoader.widths = new Int32Array(_SpriteLoader.spriteCount);
    _SpriteLoader.heights = new Int32Array(_SpriteLoader.spriteCount);
    _SpriteLoader.pixels = new Array(_SpriteLoader.spriteCount);
    buffer.offset = data.length - 7 - _SpriteLoader.spriteCount * 8;
    _SpriteLoader.width = buffer.readUnsignedShort();
    _SpriteLoader.height = buffer.readUnsignedShort();
    const paletteSize = (buffer.readUnsignedByte() & 255) + 1;
    for (let i = 0; i < _SpriteLoader.spriteCount; i++) {
      _SpriteLoader.xOffsets[i] = buffer.readUnsignedShort();
    }
    for (let i = 0; i < _SpriteLoader.spriteCount; i++) {
      _SpriteLoader.yOffsets[i] = buffer.readUnsignedShort();
    }
    for (let i = 0; i < _SpriteLoader.spriteCount; i++) {
      _SpriteLoader.widths[i] = buffer.readUnsignedShort();
    }
    for (let i = 0; i < _SpriteLoader.spriteCount; i++) {
      _SpriteLoader.heights[i] = buffer.readUnsignedShort();
    }
    buffer.offset = data.length - 7 - _SpriteLoader.spriteCount * 8 - (paletteSize - 1) * 3;
    _SpriteLoader.palette = new Int32Array(paletteSize);
    for (let i = 1; i < paletteSize; i++) {
      _SpriteLoader.palette[i] = buffer.readMedium();
      if (_SpriteLoader.palette[i] === 0) {
        _SpriteLoader.palette[i] = 1;
      }
    }
    buffer.offset = 0;
    for (let i = 0; i < _SpriteLoader.spriteCount; i++) {
      const width = _SpriteLoader.widths[i];
      const height = _SpriteLoader.heights[i];
      const pixelCount = width * height;
      const pixels = _SpriteLoader.pixels[i] = new Uint8Array(pixelCount);
      const readPixelsDimension = buffer.readUnsignedByte();
      if (readPixelsDimension === 0) {
        for (let pi = 0; pi < pixelCount; pi++) {
          pixels[pi] = buffer.readByte();
        }
      } else if (readPixelsDimension === 1) {
        for (let x = 0; x < width; x++) {
          for (let y = 0; y < height; y++) {
            pixels[x + y * width] = buffer.readByte();
          }
        }
      }
    }
  }
  static reset() {
    _SpriteLoader.xOffsets = void 0;
    _SpriteLoader.yOffsets = void 0;
    _SpriteLoader.widths = void 0;
    _SpriteLoader.heights = void 0;
    _SpriteLoader.palette = void 0;
    _SpriteLoader.pixels = void 0;
  }
  static loadFromIndex(spriteIndex, id) {
    const file = spriteIndex.getFile(id, 0);
    if (file) {
      _SpriteLoader.load(file.data);
      return true;
    }
    return false;
  }
  static loadIndexedSpriteDat(archive, name, offset) {
    return this.loadIndexedSpriteDatId(archive, archive.getFileId(name + ".dat"), offset);
  }
  static loadIndexedSpriteDatId(archive, id, offset) {
    const dataFile = archive.getFile(id);
    const indexFile = archive.getFileNamed("index.dat");
    if (!dataFile) {
      throw new Error(id + " sprite not found");
    }
    if (!indexFile) {
      throw new Error("index.dat not found");
    }
    const dataBuffer = new ByteBuffer(dataFile.data);
    const indexBuffer = new ByteBuffer(indexFile.data);
    indexBuffer.offset = dataBuffer.readUnsignedShort();
    const sprite = new IndexedSprite();
    sprite.width = indexBuffer.readUnsignedShort();
    sprite.height = indexBuffer.readUnsignedShort();
    let paletteSize = indexBuffer.readUnsignedByte();
    sprite.palette = new Int32Array(paletteSize);
    for (let i = 0; i < paletteSize - 1; i++) {
      sprite.palette[i + 1] = indexBuffer.readMedium();
    }
    for (let i = 0; i < offset; i++) {
      indexBuffer.offset += 2;
      dataBuffer.offset += indexBuffer.readUnsignedShort() * indexBuffer.readUnsignedShort();
      indexBuffer.offset++;
    }
    sprite.xOffset = indexBuffer.readUnsignedByte();
    sprite.yOffset = indexBuffer.readUnsignedByte();
    sprite.subWidth = indexBuffer.readUnsignedShort();
    sprite.subHeight = indexBuffer.readUnsignedShort();
    const pixelCount = sprite.subWidth * sprite.subHeight;
    sprite.pixels = new Uint8Array(pixelCount);
    const type = indexBuffer.readUnsignedByte();
    if (type === 0) {
      for (let i = 0; i < pixelCount; i++) {
        sprite.pixels[i] = dataBuffer.readByte();
      }
    } else if (type === 1) {
      for (let x = 0; x < sprite.subWidth; x++) {
        for (let y = 0; y < sprite.subHeight; y++) {
          sprite.pixels[x + y * sprite.subWidth] = dataBuffer.readByte();
        }
      }
    }
    return sprite;
  }
  static loadIntoIndexedSprite(spriteIndex, id) {
    if (_SpriteLoader.loadFromIndex(spriteIndex, id) && _SpriteLoader.xOffsets && _SpriteLoader.yOffsets && _SpriteLoader.widths && _SpriteLoader.heights && _SpriteLoader.palette && _SpriteLoader.pixels) {
      const sprite = new IndexedSprite();
      sprite.width = _SpriteLoader.width;
      sprite.height = _SpriteLoader.height;
      sprite.xOffset = _SpriteLoader.xOffsets[0];
      sprite.yOffset = _SpriteLoader.yOffsets[0];
      sprite.subWidth = _SpriteLoader.widths[0];
      sprite.subHeight = _SpriteLoader.heights[0];
      sprite.palette = _SpriteLoader.palette;
      sprite.pixels = _SpriteLoader.pixels[0];
      _SpriteLoader.reset();
      return sprite;
    }
    return void 0;
  }
  static loadIntoIndexedSprites(spriteIndex, id) {
    if (_SpriteLoader.loadFromIndex(spriteIndex, id) && _SpriteLoader.xOffsets && _SpriteLoader.yOffsets && _SpriteLoader.widths && _SpriteLoader.heights && _SpriteLoader.palette && _SpriteLoader.pixels) {
      const sprites = new Array(_SpriteLoader.spriteCount);
      for (let i = 0; i < _SpriteLoader.spriteCount; i++) {
        const sprite = sprites[i] = new IndexedSprite();
        sprite.width = _SpriteLoader.width;
        sprite.height = _SpriteLoader.height;
        sprite.xOffset = _SpriteLoader.xOffsets[i];
        sprite.yOffset = _SpriteLoader.yOffsets[i];
        sprite.subWidth = _SpriteLoader.widths[i];
        sprite.subHeight = _SpriteLoader.heights[i];
        sprite.palette = _SpriteLoader.palette;
        sprite.pixels = _SpriteLoader.pixels[i];
      }
      _SpriteLoader.reset();
      return sprites;
    }
    return void 0;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/cache/ColourImageCache.ts
var import_denque = __toESM(require("denque"));
var ColourImageCacheSlot = class {
  constructor(imageId, slotId) {
    this.imageId = imageId;
    this.slotId = slotId;
  }
};
var ColourImageCache = class _ColourImageCache {
  static {
    this.SLOT_USED = new ColourImageCacheSlot(0, 0);
  }
  constructor(slotCount, maxId, imageSize) {
    this.slotCount = slotCount;
    this.maxId = maxId;
    this.usageTracker = new import_denque.default();
    this.images = new Array(slotCount);
    for (let i = 0; i < slotCount; i++) {
      this.images[i] = new Array(3);
      for (let p = 0; p < 3; p++) {
        this.images[i][p] = new Int32Array(imageSize);
      }
    }
    this.slots = new Array(slotCount);
    this.usedSlots = 0;
    this.lastRequest = -1;
    this.dirty = false;
  }
  get(req) {
    if (this.slotCount === this.maxId) {
      this.dirty = this.slots[req] === void 0;
      this.slots[req] = _ColourImageCache.SLOT_USED;
      return this.images[req];
    } else if (this.slotCount === 1) {
      this.dirty = req !== this.lastRequest;
      this.lastRequest = req;
      return this.images[0];
    } else {
      let slot = this.slots[req];
      if (slot === void 0) {
        this.dirty = true;
        if (this.slotCount > this.usedSlots) {
          slot = new ColourImageCacheSlot(req, this.usedSlots);
          this.usedSlots++;
        } else {
          const oldSlot = this.usageTracker.pop();
          if (oldSlot) {
            slot = new ColourImageCacheSlot(req, oldSlot.slotId);
            delete this.slots[oldSlot.imageId];
          }
        }
        this.slots[req] = slot;
      } else {
        this.dirty = false;
      }
      for (let i = 0; i < this.usageTracker.length; i++) {
        if (this.usageTracker.peekAt(i) === slot) {
          this.usageTracker.removeOne(i);
          break;
        }
      }
      this.usageTracker.unshift(slot);
      return this.images[slot.slotId];
    }
  }
  getAll() {
    if (this.maxId !== this.slotCount) {
      throw new Error("Can only retrieve a full image cache");
    }
    for (let slot = 0; slot < this.slotCount; slot++) {
      this.slots[slot] = _ColourImageCache.SLOT_USED;
    }
    return this.images;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/cache/MonochromeImageCache.ts
var import_denque2 = __toESM(require("denque"));
var MonochromeImageCacheSlot = class {
  constructor(imageId, slotId) {
    this.imageId = imageId;
    this.slotId = slotId;
  }
};
var MonochromeImageCache = class _MonochromeImageCache {
  static {
    this.SLOT_USED = new MonochromeImageCacheSlot(0, 0);
  }
  constructor(slotCount, maxId, imageSize) {
    this.slotCount = slotCount;
    this.maxId = maxId;
    this.usageTracker = new import_denque2.default();
    this.images = new Array(slotCount);
    for (let i = 0; i < slotCount; i++) {
      this.images[i] = new Int32Array(imageSize);
    }
    this.slots = new Array(slotCount);
    this.usedSlots = 0;
    this.lastRequest = -1;
    this.dirty = false;
  }
  get(req) {
    if (this.slotCount === this.maxId) {
      this.dirty = this.slots[req] === void 0;
      this.slots[req] = _MonochromeImageCache.SLOT_USED;
      return this.images[req];
    } else if (this.slotCount === 1) {
      this.dirty = req !== this.lastRequest;
      this.lastRequest = req;
      return this.images[0];
    } else {
      let slot = this.slots[req];
      if (slot === void 0) {
        this.dirty = true;
        if (this.slotCount > this.usedSlots) {
          slot = new MonochromeImageCacheSlot(req, this.usedSlots);
          this.usedSlots++;
        } else {
          const oldSlot = this.usageTracker.pop();
          if (oldSlot) {
            slot = new MonochromeImageCacheSlot(req, oldSlot.slotId);
            delete this.slots[oldSlot.imageId];
          }
        }
        this.slots[req] = slot;
      } else {
        this.dirty = false;
      }
      for (let i = 0; i < this.usageTracker.length; i++) {
        if (this.usageTracker.peekAt(i) === slot) {
          this.usageTracker.removeOne(i);
          break;
        }
      }
      this.usageTracker.unshift(slot);
      return this.images[slot.slotId];
    }
  }
  getAll() {
    if (this.maxId !== this.slotCount) {
      throw new Error("Can only retrieve a full image cache");
    }
    for (let slot = 0; slot < this.slotCount; slot++) {
      this.slots[slot] = _MonochromeImageCache.SLOT_USED;
    }
    return this.images;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/TextureOperation.ts
var TextureOperation = class {
  constructor(inputCount, isMonochrome) {
    this.id = -1;
    this.cacheSize = 0;
    this.isMonochrome = isMonochrome;
    this.inputs = new Array(inputCount);
  }
  decode(field, buffer) {
  }
  init() {
  }
  initCaches(textureGenerator, width, height) {
    const slotCount = this.cacheSize === 255 ? height : this.cacheSize;
    if (this.isMonochrome) {
      this.monochromeImageCache = new MonochromeImageCache(slotCount, height, width);
    } else {
      this.colourImageCache = new ColourImageCache(slotCount, height, width);
    }
  }
  clearCaches() {
    this.monochromeImageCache = void 0;
    this.colourImageCache = void 0;
  }
  getSpriteId() {
    return -1;
  }
  getTextureId() {
    return -1;
  }
  getMonochromeOutput(textureGenerator, line) {
    throw new Error("This operation does not have a monochrome output");
  }
  getColourOutput(textureGenerator, line) {
    throw new Error("This operation does not have a colour output");
  }
  getMonochromeInput(textureGenerator, n, line) {
    if (this.inputs[n].isMonochrome) {
      return this.inputs[n].getMonochromeOutput(textureGenerator, line);
    }
    return this.inputs[n].getColourOutput(textureGenerator, line)[0];
  }
  getColourInput(textureGenerator, n, line) {
    if (this.inputs[n].isMonochrome) {
      const monochromeOuputs = this.inputs[n].getMonochromeOutput(textureGenerator, line);
      const colourOutputs = new Array(3).fill(monochromeOuputs);
      return colourOutputs;
    }
    return this.inputs[n].getColourOutput(textureGenerator, line);
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/ArithmeticOperation.ts
var ArithmeticOperation = class extends TextureOperation {
  constructor() {
    super(2, false);
    this.operation = 6;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.operation = buffer.readUnsignedByte();
    } else if (field === 1) {
      this.isMonochrome = buffer.readUnsignedByte() === 1;
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const inputA = this.getMonochromeInput(textureGenerator, 0, line);
      const inputB = this.getMonochromeInput(textureGenerator, 1, line);
      switch (this.operation) {
        case 1:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            output[pixel] = inputA[pixel] + inputB[pixel];
          }
          break;
        case 2:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            output[pixel] = inputA[pixel] - inputB[pixel];
          }
          break;
        case 3:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            output[pixel] = inputB[pixel] * inputA[pixel] / 4096;
          }
          break;
        case 4:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            const b = inputB[pixel];
            output[pixel] = b === 0 ? 4096 : inputA[pixel] * 4096 / b;
          }
          break;
        case 5:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            output[pixel] = 4096 - (4096 - inputA[pixel]) * (4096 - inputB[pixel]) / 4096;
          }
          break;
        case 6:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            const b = inputB[pixel];
            output[pixel] = b < 2048 ? b * inputA[pixel] / 2048 : 4096 - ((4096 - inputA[pixel]) * (4096 - b) / 2048 | 0);
          }
          break;
        case 7:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            const a = inputA[pixel];
            output[pixel] = a === 4096 ? 4096 : inputB[pixel] * 4096 / (4096 - a);
          }
          break;
        case 8:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            const a = inputA[pixel];
            output[pixel] = a === 0 ? 0 : 4096 - (4096 - inputB[pixel]) * 4096 / a;
          }
          break;
        case 9:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            const b = inputB[pixel];
            const a = inputA[pixel];
            output[pixel] = Math.min(a, b);
          }
          break;
        case 10:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            const a = inputA[pixel];
            const b = inputB[pixel];
            output[pixel] = Math.max(a, b);
          }
          break;
        case 11:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            const a = inputA[pixel];
            const b = inputB[pixel];
            output[pixel] = b < a ? a - b : b - a;
          }
          break;
        case 12:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            const a = inputB[pixel];
            const b = inputA[pixel];
            output[pixel] = a + b - a * b / 2048;
          }
          break;
      }
    }
    return output;
  }
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache is not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty) {
      const inputA = this.getColourInput(textureGenerator, 0, line);
      const inputB = this.getColourInput(textureGenerator, 1, line);
      const outputR = output[0];
      const outputG = output[1];
      const outputB = output[2];
      const inputAR = inputA[0];
      const inputAG = inputA[1];
      const inputAB = inputA[2];
      const inputBR = inputB[0];
      const inputBG = inputB[1];
      const inputBB = inputB[2];
      switch (this.operation) {
        case 1:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            outputR[pixel] = inputAR[pixel] + inputBR[pixel];
            outputG[pixel] = inputAG[pixel] + inputBG[pixel];
            outputB[pixel] = inputAB[pixel] + inputBB[pixel];
          }
          break;
        case 2:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            outputR[pixel] = inputAR[pixel] - inputBR[pixel];
            outputG[pixel] = inputAG[pixel] - inputBG[pixel];
            outputB[pixel] = inputAB[pixel] - inputBB[pixel];
          }
          break;
        case 3:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            outputR[pixel] = inputBR[pixel] * inputAR[pixel] / 4096;
            outputG[pixel] = inputBG[pixel] * inputAG[pixel] / 4096;
            outputB[pixel] = inputBB[pixel] * inputAB[pixel] / 4096;
          }
          break;
        case 4:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            const bR = inputBR[pixel];
            const bG = inputBG[pixel];
            const bB = inputBB[pixel];
            outputR[pixel] = bR === 0 ? 4096 : inputAR[pixel] * 4096 / bR;
            outputG[pixel] = bG === 0 ? 4096 : inputAG[pixel] * 4096 / bG;
            outputB[pixel] = bB === 0 ? 4096 : inputAB[pixel] * 4096 / bB;
          }
          break;
        case 5:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            outputR[pixel] = 4096 - (4096 - inputAR[pixel]) * (4096 - inputBR[pixel]) / 4096;
            outputG[pixel] = 4096 - (4096 - inputAG[pixel]) * (4096 - inputBG[pixel]) / 4096;
            outputB[pixel] = 4096 - (4096 - inputAB[pixel]) * (4096 - inputBB[pixel]) / 4096;
          }
          break;
        case 6:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            const bR = inputBR[pixel];
            const bG = inputBG[pixel];
            const bB = inputBB[pixel];
            outputR[pixel] = bR < 2048 ? bR * inputAR[pixel] / 2048 : 4096 - ((4096 - inputAR[pixel]) * (4096 - bR) / 2048 | 0);
            outputG[pixel] = bG < 2048 ? bG * inputAG[pixel] / 2048 : 4096 - ((4096 - inputAG[pixel]) * (4096 - bG) / 2048 | 0);
            outputB[pixel] = bB < 2048 ? bB * inputAB[pixel] / 2048 : 4096 - ((4096 - inputAB[pixel]) * (4096 - bB) / 2048 | 0);
          }
          break;
        case 7:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            const aR = inputAR[pixel];
            const aG = inputAG[pixel];
            const aB = inputAB[pixel];
            outputR[pixel] = aR === 4096 ? 4096 : inputBR[pixel] * 4096 / (4096 - aR);
            outputG[pixel] = aG === 4096 ? 4096 : inputBG[pixel] * 4096 / (4096 - aG);
            outputB[pixel] = aB === 4096 ? 4096 : inputBB[pixel] * 4096 / (4096 - aB);
          }
          break;
        case 8:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            const aR = inputAR[pixel];
            const aG = inputAG[pixel];
            const aB = inputAB[pixel];
            outputR[pixel] = aR === 0 ? 0 : 4096 - (4096 - inputBR[pixel]) * 4096 / aR;
            outputG[pixel] = aG === 0 ? 0 : 4096 - (4096 - inputBG[pixel]) * 4096 / aG;
            outputB[pixel] = aB === 0 ? 0 : 4096 - (4096 - inputBB[pixel]) * 4096 / aB;
          }
          break;
        case 9:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            const aR = inputAR[pixel];
            const aG = inputAG[pixel];
            const aB = inputAB[pixel];
            const bR = inputBR[pixel];
            const bG = inputBG[pixel];
            const bB = inputBB[pixel];
            outputR[pixel] = Math.min(aR, bR);
            outputG[pixel] = Math.min(aG, bG);
            outputB[pixel] = Math.min(aB, bB);
          }
          break;
        case 10:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            const aR = inputAR[pixel];
            const aG = inputAG[pixel];
            const aB = inputAB[pixel];
            const bR = inputBR[pixel];
            const bG = inputBG[pixel];
            const bB = inputBB[pixel];
            outputR[pixel] = Math.max(aR, bR);
            outputG[pixel] = Math.max(aG, bG);
            outputB[pixel] = Math.max(aB, bB);
          }
          break;
        case 11:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            const aR = inputAR[pixel];
            const aG = inputAG[pixel];
            const aB = inputAB[pixel];
            const bR = inputBR[pixel];
            const bG = inputBG[pixel];
            const bB = inputBB[pixel];
            outputR[pixel] = bR < aR ? aR - bR : bR - aR;
            outputG[pixel] = bG < aG ? aG - bG : bG - aG;
            outputB[pixel] = bB < aB ? aB - bB : bB - aB;
          }
          break;
        case 12:
          for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
            const aR = inputBR[pixel];
            const aG = inputBG[pixel];
            const aB = inputBB[pixel];
            const bR = inputAR[pixel];
            const bG = inputAG[pixel];
            const bB = inputAB[pixel];
            outputR[pixel] = aR + bR - aR * bR / 2048;
            outputG[pixel] = aG + bG - aG * bG / 2048;
            outputB[pixel] = aB + bB - aB * bB / 2048;
          }
          break;
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/BinaryOperation.ts
var BinaryOperation = class extends TextureOperation {
  constructor() {
    super(1, true);
    this.minValue = 0;
    this.maxValue = 4096;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.minValue = buffer.readUnsignedShort();
    } else if (field === 1) {
      this.maxValue = buffer.readUnsignedShort();
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const input = this.getMonochromeInput(textureGenerator, 0, line);
      for (let x = 0; x < textureGenerator.width; x++) {
        const value = input[x];
        output[x] = value >= this.minValue && value <= this.maxValue ? 4096 : 0;
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/BlurOperation.ts
var BlurOperation = class extends TextureOperation {
  constructor() {
    super(1, false);
    this.hExtent = 1;
    this.vExtent = 1;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.hExtent = buffer.readUnsignedByte();
    } else if (field === 1) {
      this.vExtent = buffer.readUnsignedByte();
    } else if (field === 2) {
      this.isMonochrome = buffer.readUnsignedByte() === 1;
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const nPasses = 1 + (this.vExtent + this.vExtent);
      const invPasses = 65536 / nPasses | 0;
      const nPixels = 1 + this.hExtent + this.hExtent;
      const invPixels = 65536 / nPixels | 0;
      const passes = new Array(nPasses);
      for (let pass = -this.vExtent + line; pass <= line + this.vExtent; pass++) {
        const input = this.getMonochromeInput(
          textureGenerator,
          0,
          pass & textureGenerator.heightMask
        );
        const passOut = new Int32Array(textureGenerator.width);
        let sum = 0;
        for (let pixel = -this.hExtent; pixel <= this.hExtent; pixel++) {
          sum += input[pixel & textureGenerator.widthMask];
        }
        let ptr = 0;
        while (ptr < textureGenerator.width) {
          passOut[ptr] = sum * invPixels / 65536 | 0;
          sum -= input[ptr - this.hExtent & textureGenerator.widthMask];
          ptr++;
          sum += input[ptr + this.hExtent & textureGenerator.widthMask];
        }
        passes[this.vExtent - line + pass] = passOut;
      }
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        let sum = 0;
        for (let pass = 0; pass < nPasses; pass++) {
          sum += passes[pass][pixel];
        }
        output[pixel] = sum * invPasses / 65536 | 0;
      }
    }
    return output;
  }
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache is not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty) {
      const nPasses = 1 + (this.vExtent + this.vExtent);
      const invPasses = 65536 / nPasses | 0;
      const nPixels = 1 + this.hExtent + this.hExtent;
      const invPixels = 65536 / nPixels | 0;
      const passes = new Array(nPasses);
      for (let pass = -this.vExtent + line; pass <= line + this.vExtent; pass++) {
        const input = this.getColourInput(
          textureGenerator,
          0,
          pass & textureGenerator.heightMask
        );
        const passOut = new Array(3);
        for (let i = 0; i < 3; i++) {
          passOut[i] = new Int32Array(textureGenerator.width);
        }
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        for (let pixel = -this.hExtent; pixel <= this.hExtent; pixel++) {
          sumR += input[0][pixel & textureGenerator.widthMask];
          sumG += input[1][pixel & textureGenerator.widthMask];
          sumB += input[2][pixel & textureGenerator.widthMask];
        }
        let ptr = 0;
        while (ptr < textureGenerator.width) {
          passOut[0][ptr] = sumR * invPixels / 65536 | 0;
          passOut[1][ptr] = sumG * invPixels / 65536 | 0;
          passOut[2][ptr] = sumB * invPixels / 65536 | 0;
          sumR -= input[0][ptr - this.hExtent & textureGenerator.widthMask];
          sumG -= input[1][ptr - this.hExtent & textureGenerator.widthMask];
          sumB -= input[2][ptr - this.hExtent & textureGenerator.widthMask];
          ptr++;
          sumR += input[0][ptr + this.hExtent & textureGenerator.widthMask];
          sumG += input[1][ptr + this.hExtent & textureGenerator.widthMask];
          sumB += input[2][ptr + this.hExtent & textureGenerator.widthMask];
        }
        passes[this.vExtent + pass - line] = passOut;
      }
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        for (let pass = 0; pass < nPasses; pass++) {
          sumR += passes[pass][0][pixel];
          sumG += passes[pass][1][pixel];
          sumB += passes[pass][2][pixel];
        }
        output[0][pixel] = sumR * invPasses / 65536 | 0;
        output[1][pixel] = sumG * invPasses / 65536 | 0;
        output[2][pixel] = sumB * invPasses / 65536 | 0;
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/BricksOperation.ts
var import_java_random = __toESM(require("java-random"));
var BricksOperation = class extends TextureOperation {
  constructor() {
    super(0, true);
    this.field0 = 4;
    this.seed = 8;
    this.field2 = 409;
    this.field3 = 204;
    this.field4 = 1024;
    this.field5 = 0;
    this.field6 = 81;
    this.field7 = 1024;
    this.halfField6 = 0;
    this.ratio0 = 0;
    this.ratio1 = 0;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.field0 = buffer.readUnsignedByte();
    } else if (field === 1) {
      this.seed = buffer.readUnsignedByte();
    } else if (field === 2) {
      this.field2 = buffer.readUnsignedShort();
    } else if (field === 3) {
      this.field3 = buffer.readUnsignedShort();
    } else if (field === 4) {
      this.field4 = buffer.readUnsignedShort();
    } else if (field === 5) {
      this.field5 = buffer.readUnsignedShort();
    } else if (field === 6) {
      this.field6 = buffer.readUnsignedShort();
    } else if (field === 7) {
      this.field7 = buffer.readUnsignedShort();
    }
  }
  init() {
    this.table0 = new Array(this.seed);
    this.table1 = new Array(this.seed);
    for (let i = 0; i < this.seed; i++) {
      this.table0[i] = new Int32Array(this.field0);
      this.table1[i] = new Int32Array(this.field0 + 1);
    }
    this.table2 = new Int32Array(this.seed + 1);
    const random = new import_java_random.default(this.seed);
    this.halfField6 = this.field6 / 2 | 0;
    this.ratio0 = 4096 / this.field0 | 0;
    const halfR0 = this.ratio0 / 2 | 0;
    this.ratio1 = 4096 / this.seed | 0;
    const halfR1 = this.ratio1 / 2 | 0;
    this.table2[0] = 0;
    for (let x = 0; x < this.seed; x++) {
      if (x > 0) {
        let value = this.ratio1;
        const randomValue = (nextIntJagex(random, 4096) - 2048) * this.field3 >> 12;
        value += randomValue * halfR1 >> 12;
        this.table2[x] = value + this.table2[x - 1];
      }
      this.table1[x][0] = 0;
      for (let y = 0; y < this.field0; y++) {
        if (y > 0) {
          let value = this.ratio0;
          const randomValue = (nextIntJagex(random, 4096) - 2048) * this.field2 >> 12;
          value += randomValue * halfR0 >> 12;
          this.table1[x][y] = this.table1[x][y - 1] + value;
        }
        this.table0[x][y] = this.field7 > 0 ? 4096 - nextIntJagex(random, this.field7) : 4096;
      }
      this.table1[x][this.field0] = 4096;
    }
    this.table2[this.seed] = 4096;
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      let index0 = 0;
      let value0 = this.field5 + textureGenerator.verticalGradient[line];
      for (; value0 < 0; value0 += 4096) ;
      for (; value0 > 4096; value0 -= 4096) ;
      for (; index0 < this.seed; index0++) {
        if (value0 < this.table2[index0]) {
          break;
        }
      }
      const tv0 = this.table2[index0 - 1];
      const tv1 = this.table2[index0];
      if (value0 > this.halfField6 + tv0 && value0 < tv1 - this.halfField6) {
        for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
          const f4 = index0 % 2 !== 0 ? -this.field4 : this.field4;
          let index1 = 0;
          let value1 = (this.ratio0 * f4 >> 12) + textureGenerator.horizontalGradient[pixel];
          for (; value1 < 0; value1 += 4096) ;
          for (; value1 > 4096; value1 -= 4096) ;
          for (; index1 < this.field0; index1++) {
            if (value1 < this.table1[index0 - 1][index1]) {
              break;
            }
          }
          const tv2 = this.table1[index0 - 1][index1 - 1];
          const tv3 = this.table1[index0 - 1][index1];
          if (tv2 + this.halfField6 < value1 && value1 < tv3 - this.halfField6) {
            output[pixel] = this.table0[index0 - 1][index1 - 1];
          } else {
            output[pixel] = 0;
          }
        }
      } else {
        output.fill(0, 0, textureGenerator.width);
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/BrightnessOperation.ts
var BrightnessOperation = class extends TextureOperation {
  constructor() {
    super(1, false);
    this.maxValue = 409;
    this.redFactor = 4096;
    this.greenFactor = 4096;
    this.blueFactor = 4096;
    this.colorDelta = new Int32Array(3);
  }
  decode(field, buffer) {
    if (field === 0) {
      this.maxValue = buffer.readUnsignedShort();
    } else if (field === 1) {
      this.blueFactor = buffer.readUnsignedShort();
    } else if (field === 2) {
      this.greenFactor = buffer.readUnsignedShort();
    } else if (field === 3) {
      this.redFactor = buffer.readUnsignedShort();
    } else if (field === 4) {
      const rgb = buffer.readMedium();
      this.colorDelta[0] = (rgb & 16711680) << 4;
      this.colorDelta[1] = rgb >> 4 & 4080;
      this.colorDelta[2] = rgb >> 12 & 0;
    }
  }
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache is not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty) {
      const input = this.getColourInput(textureGenerator, 0, line);
      const inputR = input[0];
      const inputG = input[1];
      const inputB = input[2];
      const outputR = output[0];
      const outputG = output[1];
      const outputB = output[2];
      for (let x = 0; x < textureGenerator.width; x++) {
        const r = inputR[x];
        let absR = r - this.colorDelta[0];
        if (absR < 0) {
          absR = -absR;
        }
        if (absR <= this.maxValue) {
          const g = inputG[x];
          let absG = g - this.colorDelta[1];
          if (absG < 0) {
            absG = -absG;
          }
          if (absG <= this.maxValue) {
            const b = inputB[x];
            let absB = b - this.colorDelta[2];
            if (absB < 0) {
              absB = -absB;
            }
            if (absB <= this.maxValue) {
              outputR[x] = r * this.redFactor >> 12;
              outputG[x] = g * this.greenFactor >> 12;
              outputB[x] = b * this.blueFactor >> 12;
            } else {
              outputR[x] = r;
              outputG[x] = g;
              outputB[x] = b;
            }
          } else {
            outputR[x] = r;
            outputG[x] = g;
            outputB[x] = inputB[x];
          }
        } else {
          outputR[x] = r;
          outputG[x] = inputG[x];
          outputB[x] = inputB[x];
        }
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/ClampOperation.ts
var ClampOperation = class extends TextureOperation {
  constructor() {
    super(1, false);
    this.min = 0;
    this.max = 4096;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.min = buffer.readUnsignedShort();
    } else if (field === 1) {
      this.max = buffer.readUnsignedShort();
    } else if (field === 2) {
      this.isMonochrome = buffer.readUnsignedByte() === 1;
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const input = this.getMonochromeInput(textureGenerator, 0, line);
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        const value = input[pixel];
        output[pixel] = clamp(value, this.min, this.max);
      }
    }
    return output;
  }
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache is not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty) {
      const input = this.getColourInput(textureGenerator, 0, line);
      const inputR = input[0];
      const inputG = input[1];
      const inputB = input[2];
      const outputR = output[0];
      const outputG = output[1];
      const outputB = output[2];
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        const valueR = inputR[pixel];
        const valueG = inputG[pixel];
        const valueB = inputB[pixel];
        outputR[pixel] = clamp(valueR, this.min, this.max);
        outputG[pixel] = clamp(valueG, this.min, this.max);
        outputB[pixel] = clamp(valueB, this.min, this.max);
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/ColorEdgeDetectorOperation.ts
var ColorEdgeDetectorOperation = class extends TextureOperation {
  constructor() {
    super(1, false);
    this.multiplier = 4096;
    this.field1 = true;
  }
  decode(field, buffer) {
    if (field === 1) {
      this.multiplier = buffer.readUnsignedShort();
    } else if (field === 2) {
      this.field1 = buffer.readUnsignedByte() === 1;
    }
  }
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache is not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty) {
      const prevInput = this.getMonochromeInput(
        textureGenerator,
        0,
        line - 1 & textureGenerator.heightMask
      );
      const input = this.getMonochromeInput(textureGenerator, 0, line);
      const nextInput = this.getMonochromeInput(
        textureGenerator,
        0,
        line + 1 & textureGenerator.heightMask
      );
      const inputR = input[0];
      const inputG = input[1];
      const inputB = input[2];
      const outputR = output[0];
      const outputG = output[1];
      const outputB = output[2];
      for (let x = 0; x < textureGenerator.width; x++) {
        const dy = this.multiplier * (nextInput[x] - prevInput[x]);
        const dx = this.multiplier * (input[x + 1 & textureGenerator.widthMask] - input[x - 1 & textureGenerator.widthMask]);
        const dy0 = dy >> 12;
        const dx0 = dx >> 12;
        const dySquared = dy0 * dy0 >> 12;
        const dxSquared = dx0 * dx0 >> 12;
        const local137 = Math.sqrt((dySquared + dxSquared + 4096) / 4096) * 4096 | 0;
        let red;
        let green;
        let blue;
        if (local137 == 0) {
          red = 0;
          green = 0;
          blue = 0;
        } else {
          red = dx / local137 | 0;
          green = dy / local137 | 0;
          blue = 16777216 / local137 | 0;
        }
        if (this.field1) {
          red = (red >> 1) + 2048;
          green = (green >> 1) + 2048;
          blue = (blue >> 1) + 2048;
        }
        outputR[x] = red;
        outputG[x] = green;
        outputB[x] = blue;
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/ColourStripOperation.ts
var ColourStripOperation = class extends TextureOperation {
  constructor() {
    super(1, false);
    this.colourR = 4096;
    this.colourG = 4096;
    this.colourB = 4096;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.colourR = buffer.readUnsignedShort();
    } else if (field === 1) {
      this.colourG = buffer.readUnsignedShort();
    } else if (field === 2) {
      this.colourB = buffer.readUnsignedShort();
    }
  }
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache is not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty) {
      const input = this.getColourInput(textureGenerator, 0, line);
      const inputR = input[0];
      const inputG = input[1];
      const inputB = input[2];
      const outputR = output[0];
      const outputG = output[1];
      const outputB = output[2];
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        const valueR = inputR[pixel];
        const valueG = inputG[pixel];
        const valueB = inputB[pixel];
        if (valueR !== valueB || valueB !== valueG) {
          outputR[pixel] = this.colourR;
          outputG[pixel] = this.colourG;
          outputB[pixel] = this.colourB;
        } else {
          outputR[pixel] = this.colourR * valueR >> 12;
          outputG[pixel] = this.colourG * valueG >> 12;
          outputB[pixel] = this.colourB * valueB >> 12;
        }
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/ConstantColourOperation.ts
var ConstantColourOperation = class extends TextureOperation {
  constructor(rgb = 0) {
    super(0, false);
    this.constantR = 0;
    this.constantG = 0;
    this.constantB = 0;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.setConstant(buffer.readMedium());
    }
  }
  setConstant(rgb) {
    this.constantR = (rgb >> 16 & 255) * 16;
    this.constantG = (rgb >> 8 & 255) * 16;
    this.constantB = (rgb & 255) * 16;
  }
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache is not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty) {
      const outputR = output[0];
      const outputG = output[1];
      const outputB = output[2];
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        outputR[pixel] = this.constantR;
        outputG[pixel] = this.constantG;
        outputB[pixel] = this.constantB;
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/ConstantMonochromeOperation.ts
var ConstantMonochromeOperation = class extends TextureOperation {
  constructor(constant = 4096) {
    super(0, true);
    this.constant = constant;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.constant = (buffer.readUnsignedByte() << 12) / 255 | 0;
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      output.fill(this.constant, 0, textureGenerator.width);
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/TextureGenerator.ts
var import_java_random2 = __toESM(require("java-random"));
var TextureGenerator = class _TextureGenerator {
  constructor(spriteIndex, textureLoader) {
    this.width = 0;
    this.height = 0;
    this.widthTimes32 = 0;
    this.widthMask = 0;
    this.heightMask = 0;
    this.brightnessTable = new Int32Array(256);
    this.brightness = -1;
    this.isTransparent = false;
    this.debug = false;
    this.spriteIndex = spriteIndex;
    this.textureLoader = textureLoader;
  }
  static {
    this.permutationCache = /* @__PURE__ */ new Map();
  }
  static initTrig() {
    _TextureGenerator.SINE = new Int32Array(256);
    _TextureGenerator.COSINE = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      const d2 = i / 255 * 6.283185307179586;
      _TextureGenerator.SINE[i] = Math.sin(d2) * 4096;
      _TextureGenerator.COSINE[i] = Math.cos(d2) * 4096;
    }
  }
  static initInverseSquareRoot() {
    _TextureGenerator.INVERSE_SQUARE_ROOT = new Int8Array(32896);
    let i = 0;
    for (let x = 0; x < 256; x++) {
      for (let y = 0; y <= x; y++) {
        _TextureGenerator.INVERSE_SQUARE_ROOT[i++] = 255 / Math.sqrt(Math.fround((x * x + y * y + 65535) / 65535)) | 0;
      }
    }
  }
  static init() {
    _TextureGenerator.initTrig();
    _TextureGenerator.initInverseSquareRoot();
  }
  init(width, height) {
    this.isTransparent = false;
    if (this.width !== width) {
      this.horizontalGradient = new Int32Array(width);
      for (let i = 0; i < width; i++) {
        this.horizontalGradient[i] = (i << 12) / width;
      }
      this.widthMask = width - 1;
      this.width = width;
      this.widthTimes32 = width * 32;
    }
    if (this.height !== height) {
      if (height !== this.width) {
        this.verticalGradient = new Int32Array(height);
        for (let i = 0; i < height; i++) {
          this.verticalGradient[i] = (i << 12) / height;
        }
      } else {
        this.verticalGradient = this.horizontalGradient;
      }
      this.heightMask = height - 1;
      this.height = height;
    }
  }
  initBrightness(brightness) {
    if (this.brightness !== brightness) {
      for (let i = 0; i < this.brightnessTable.length; i++) {
        const v = Math.pow(i / 255, brightness) * 255 | 0;
        this.brightnessTable[i] = Math.min(v, 255);
      }
      this.brightness = brightness;
    }
  }
  static initPermutations(seed) {
    const cached = _TextureGenerator.permutationCache.get(seed);
    if (cached) {
      return cached;
    }
    const permutations = new Int8Array(512);
    const random = new import_java_random2.default(seed);
    for (let i = 0; i < 255; i++) {
      permutations[i] = i;
    }
    for (let i = 0; i < 255; i++) {
      const index0 = 255 - i;
      const index1 = nextIntJagex(random, index0);
      const perm1 = permutations[index1];
      permutations[index1] = permutations[index0];
      permutations[index0] = permutations[511 - i] = perm1;
    }
    _TextureGenerator.permutationCache.set(seed, permutations);
    return permutations;
  }
  loadSprite(spriteId) {
    const sprite = SpriteLoader.loadIntoIndexedSprite(this.spriteIndex, spriteId);
    if (!sprite) {
      throw new Error("Sprite not found: " + spriteId);
    }
    return sprite;
  }
};
TextureGenerator.init();

// ../rs-party-dashboard/src/rs/texture/procedural/operation/CurveOperation.ts
var CurveOperation = class extends TextureOperation {
  constructor() {
    super(1, true);
    this.interpMode = 0;
    this.table = new Int16Array(257);
  }
  decode(field, buffer) {
    if (field === 0) {
      this.interpMode = buffer.readUnsignedByte();
      const markerCount = buffer.readUnsignedByte();
      this.markers = new Array(markerCount);
      for (let i = 0; i < markerCount; i++) {
        const marker = this.markers[i] = new Array(2);
        marker[0] = buffer.readUnsignedShort();
        marker[1] = buffer.readUnsignedShort();
      }
    }
  }
  calcExtremes() {
    const start0 = this.markers[0];
    const start1 = this.markers[1];
    const end0 = this.markers[this.markers.length - 2];
    const end1 = this.markers[this.markers.length - 1];
    this.startMarker = [start0[0] + start0[0] - start1[0], start0[1] - start1[1] + start0[1]];
    this.endMarker = [end0[0] - end1[0] + end0[0], end0[1] - end1[1] + end0[1]];
  }
  getMarker(index) {
    if (index < 0) {
      return this.startMarker;
    }
    if (index >= this.markers.length) {
      return this.endMarker;
    }
    return this.markers[index];
  }
  init() {
    if (!this.markers) {
      this.markers = [
        [0, 0],
        [4096, 4096]
      ];
    }
    if (this.markers.length < 2) {
      throw new Error("Curve operation requires at least two markers");
    }
    if (this.interpMode === 2) {
      this.calcExtremes();
    }
    this.fillTable();
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const input = this.getMonochromeInput(textureGenerator, 0, line);
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        let value = input[pixel] / 16 | 0;
        if (value < 0) {
          value = 0;
        }
        if (value > 256) {
          value = 256;
        }
        output[pixel] = this.table[value];
      }
    }
    return output;
  }
  fillTable() {
    switch (this.interpMode) {
      case 2:
        for (let index = 0; index < 257; index++) {
          const indexTimes16 = index * 16;
          let markIndex;
          for (markIndex = 1; markIndex < this.markers.length - 1; markIndex++) {
            if (this.markers[markIndex][0] > indexTimes16) {
              break;
            }
          }
          const markP = this.markers[markIndex - 1];
          const markN = this.markers[markIndex];
          const i_17_ = this.getMarker(markIndex - 2)[1];
          const i_18_ = markP[1];
          const i_19_ = markN[1];
          const i_20_ = this.getMarker(markIndex + 1)[1];
          const interpIn = (indexTimes16 - markP[0]) * 4096 / (markN[0] - markP[0]) | 0;
          const xSq = interpIn * interpIn / 4096 | 0;
          const i_23_ = i_18_ - i_17_ + (i_20_ - i_19_);
          const i_24_ = i_17_ - i_18_ - i_23_;
          const i_25_ = i_19_ - i_17_;
          const i_26_ = i_18_;
          const i_27_ = xSq * (interpIn * i_23_ >> 12) >> 12;
          const i_28_ = xSq * i_24_ / 4096 | 0;
          const i_29_ = interpIn * i_25_ / 4096 | 0;
          let out = i_29_ + i_27_ + i_28_ + i_26_;
          if (out <= -32768) {
            out = -32767;
          }
          if (out >= 32768) {
            out = 32767;
          }
          this.table[index] = out;
        }
        break;
      case 1:
        for (let index = 0; index < 257; index++) {
          const indexTimes16 = index * 16;
          let markIndex;
          for (markIndex = 1; markIndex < this.markers.length - 1; markIndex++) {
            if (this.markers[markIndex][0] > indexTimes16) {
              break;
            }
          }
          const markP = this.markers[markIndex - 1];
          const markN = this.markers[markIndex];
          const interpIn = (indexTimes16 - markP[0]) * 4096 / (markN[0] - markP[0]) | 0;
          const nMul = (4096 - TextureGenerator.COSINE[(interpIn & 8187) / 32 | 0]) / 2 | 0;
          const pMul = 4096 - nMul;
          let out = (pMul * markP[1] + markN[1] * nMul) / 4096 | 0;
          if (out <= -32768) {
            out = -32767;
          }
          if (out >= 32768) {
            out = 32767;
          }
          this.table[index] = out;
        }
        break;
      case 0:
        for (let index = 0; index < 257; index++) {
          const indexTimes16 = index * 16;
          let markIndex;
          for (markIndex = 1; markIndex < this.markers.length - 1; markIndex++) {
            if (this.markers[markIndex][0] > indexTimes16) {
              break;
            }
          }
          const markP = this.markers[markIndex - 1];
          const markN = this.markers[markIndex];
          const nMul = (indexTimes16 - markP[0]) * 4096 / (markN[0] - markP[0]) | 0;
          const pMul = 4096 - nMul;
          let out = (pMul * markP[1] + markN[1] * nMul) / 4096 | 0;
          if (out <= -32768) {
            out = -32767;
          }
          if (out >= 32768) {
            out = 32767;
          }
          this.table[index] = out;
        }
        break;
    }
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/DiagonalGradientOperation.ts
var DiagonalGradientOperation = class extends TextureOperation {
  constructor() {
    super(0, true);
    this.interpolationMode = 0;
    this.steepness = 1;
    this.mixMode = 0;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.mixMode = buffer.readUnsignedByte();
    } else if (field === 1) {
      this.interpolationMode = buffer.readUnsignedByte();
    } else if (field === 3) {
      this.steepness = buffer.readUnsignedByte();
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const inParam = textureGenerator.verticalGradient[line];
      const nParam = inParam - 2048 >> 1;
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        const inValue = textureGenerator.horizontalGradient[pixel];
        const nValue = inValue - 2048 >> 1;
        let pytN;
        if (this.mixMode === 0) {
          pytN = (inValue - inParam) * this.steepness;
        } else {
          const sqNSum = nParam * nParam + nValue * nValue >> 12;
          pytN = 4096 * Math.sqrt(sqNSum / 4096) | 0;
          pytN = this.steepness * pytN * 3.141592653589793 | 0;
        }
        pytN -= pytN & ~4095;
        if (this.interpolationMode === 0) {
          pytN = TextureGenerator.SINE[pytN >> 4 & 255] + 4096 >> 1;
        } else if (this.interpolationMode === 2) {
          pytN -= 2048;
          if (pytN < 0) {
            pytN = -pytN;
          }
          pytN = 2048 - pytN << 1;
        }
        output[pixel] = pytN;
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/EmbossOperation.ts
var EmbossOperation = class extends TextureOperation {
  constructor() {
    super(1, true);
    this.field0 = 4096;
    this.field1 = 3216;
    this.field2 = 3216;
    this.table = new Int32Array(3);
  }
  decode(field, buffer) {
    if (field === 0) {
      this.field0 = buffer.readUnsignedShort();
    } else if (field === 1) {
      this.field1 = buffer.readUnsignedShort();
    } else if (field === 2) {
      this.field2 = buffer.readUnsignedShort();
    }
  }
  init() {
    const d2 = Math.cos(Math.fround(this.field2 / 4096));
    this.table[0] = 4096 * (d2 * Math.sin(Math.fround(this.field1 / 4096)));
    this.table[1] = 4096 * (d2 * Math.cos(Math.fround(this.field1 / 4096)));
    this.table[2] = 4096 * Math.sin(Math.fround(this.field2 / 4096));
    const t0 = this.table[0] * this.table[0] >> 12;
    const t1 = this.table[1] * this.table[1] >> 12;
    const t2 = this.table[2] * this.table[2] >> 12;
    const scale = Math.sqrt(t0 + t1 + t2 >> 12) * 4096 | 0;
    if (scale !== 0) {
      this.table[0] = (this.table[0] << 12) / scale;
      this.table[1] = (this.table[1] << 12) / scale;
      this.table[2] = (this.table[2] << 12) / scale;
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const widthMult = this.field0 * textureGenerator.widthTimes32 >> 12;
      const prevLine = this.getMonochromeInput(
        textureGenerator,
        0,
        line - 1 & textureGenerator.heightMask
      );
      const currLine = this.getMonochromeInput(textureGenerator, 0, line);
      const nextLine = this.getMonochromeInput(
        textureGenerator,
        0,
        line + 1 & textureGenerator.heightMask
      );
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        const prevPixel = currLine[pixel - 1 & textureGenerator.widthMask];
        const nextPixel = currLine[pixel + 1 & textureGenerator.widthMask];
        const i_10_ = widthMult * (nextLine[pixel] - prevLine[pixel]) >> 12;
        const i_11_ = widthMult * (prevPixel - nextPixel) >> 12;
        let i_12_ = i_11_ >> 4;
        let i_13_ = i_10_ >> 4;
        if (i_12_ < 0) {
          i_12_ = -i_12_;
        }
        if (i_12_ > 255) {
          i_12_ = 255;
        }
        if (i_13_ < 0) {
          i_13_ = -i_13_;
        }
        if (i_13_ > 255) {
          i_13_ = 255;
        }
        const i_14_ = TextureGenerator.INVERSE_SQUARE_ROOT[i_12_ + ((i_13_ + 1) * i_13_ >> 1)] & 255;
        let v0 = i_14_ * i_11_ >> 8;
        let v1 = i_14_ * i_10_ >> 8;
        let v2 = i_14_ * 4096 >> 8;
        v0 = this.table[0] * v0 >> 12;
        v1 = this.table[1] * v1 >> 12;
        v2 = this.table[2] * v2 >> 12;
        output[pixel] = v0 + v1 + v2;
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/GradientOperation.ts
var GradientOperation = class extends TextureOperation {
  constructor() {
    super(1, false);
    this.preset = 0;
    this.table = new Int32Array(257);
  }
  decode(field, buffer) {
    if (field === 0) {
      const preset = buffer.readUnsignedByte();
      if (preset === 0) {
        const count = buffer.readUnsignedByte();
        this.gradient = new Array(count);
        for (let i = 0; i < count; i++) {
          this.gradient[i] = new Int32Array(4);
          this.gradient[i][0] = buffer.readUnsignedShort();
          this.gradient[i][1] = buffer.readUnsignedByte() << 4;
          this.gradient[i][2] = buffer.readUnsignedByte() << 4;
          this.gradient[i][3] = buffer.readUnsignedByte() << 4;
        }
      } else {
        this.setGradientPreset(preset);
      }
    }
  }
  init() {
    if (!this.gradient) {
      this.setGradientPreset(1);
    }
    this.fillTable();
  }
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache is not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty) {
      const input = this.getMonochromeInput(textureGenerator, 0, line);
      const outputR = output[0];
      const outputG = output[1];
      const outputB = output[2];
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        let value = input[pixel] >> 4;
        if (value < 0) {
          value = 0;
        }
        if (value > 256) {
          value = 256;
        }
        value = this.table[value];
        outputR[pixel] = (value & 16711680) >> 12;
        outputG[pixel] = (value & 65280) >> 4;
        outputB[pixel] = (value & 255) << 4;
      }
    }
    return output;
  }
  fillTable() {
    if (!this.gradient) {
      return;
    }
    const gradientCount = this.gradient.length;
    if (gradientCount <= 0) {
      return;
    }
    for (let i = 0; i < this.table.length; i++) {
      let gIdx = 0;
      const inT16 = i << 4;
      for (const grad of this.gradient) {
        if (grad[0] > inT16) {
          break;
        }
        gIdx++;
      }
      let r;
      let g;
      let b;
      if (gIdx < gradientCount) {
        const gradN = this.gradient[gIdx];
        if (gIdx > 0) {
          const gradP = this.gradient[gIdx - 1];
          const nMod = (inT16 - gradP[0] << 12) / (gradN[0] - gradP[0]) | 0;
          const pMod = 4096 - nMod;
          r = gradP[1] * pMod + gradN[1] * nMod >> 12;
          g = gradP[2] * pMod + gradN[2] * nMod >> 12;
          b = gradN[3] * nMod + gradP[3] * pMod >> 12;
        } else {
          r = gradN[1];
          g = gradN[2];
          b = gradN[3];
        }
      } else {
        const grad = this.gradient[gradientCount - 1];
        r = grad[1];
        g = grad[2];
        b = grad[3];
      }
      r >>= 4;
      g >>= 4;
      b >>= 4;
      if (r < 0) {
        r = 0;
      } else if (r > 255) {
        r = 255;
      }
      if (g < 0) {
        g = 0;
      } else if (g > 255) {
        g = 255;
      }
      if (b < 0) {
        b = 0;
      } else if (b > 255) {
        b = 255;
      }
      this.table[i] = r << 16 | g << 8 | b;
    }
  }
  setGradientPreset(preset) {
    this.preset = preset;
    switch (preset) {
      case 1:
        this.gradient = new Array(2);
        for (let i = 0; i < this.gradient.length; i++) {
          this.gradient[i] = new Int32Array(4);
        }
        this.gradient[0][0] = 0;
        this.gradient[0][1] = 0;
        this.gradient[0][2] = 0;
        this.gradient[0][3] = 0;
        this.gradient[1][0] = 4096;
        this.gradient[1][1] = 4096;
        this.gradient[1][2] = 4096;
        this.gradient[1][3] = 4096;
        break;
      case 2:
        this.gradient = new Array(8);
        for (let i = 0; i < this.gradient.length; i++) {
          this.gradient[i] = new Int32Array(4);
        }
        this.gradient[0][0] = 0;
        this.gradient[0][1] = 2650;
        this.gradient[0][2] = 2602;
        this.gradient[0][3] = 2361;
        this.gradient[1][0] = 2867;
        this.gradient[1][1] = 2313;
        this.gradient[1][2] = 1799;
        this.gradient[1][3] = 1558;
        this.gradient[2][0] = 3072;
        this.gradient[2][1] = 2618;
        this.gradient[2][2] = 1734;
        this.gradient[2][3] = 1413;
        this.gradient[3][0] = 3276;
        this.gradient[3][1] = 2296;
        this.gradient[3][2] = 1220;
        this.gradient[3][3] = 947;
        this.gradient[4][0] = 3481;
        this.gradient[4][1] = 2072;
        this.gradient[4][2] = 963;
        this.gradient[4][3] = 722;
        this.gradient[5][0] = 3686;
        this.gradient[5][1] = 2730;
        this.gradient[5][2] = 2152;
        this.gradient[5][3] = 1766;
        this.gradient[6][0] = 3891;
        this.gradient[6][1] = 2232;
        this.gradient[6][2] = 1060;
        this.gradient[6][3] = 915;
        this.gradient[7][0] = 4096;
        this.gradient[7][1] = 1686;
        this.gradient[7][2] = 1413;
        this.gradient[7][3] = 1140;
        break;
      case 3:
        this.gradient = new Array(7);
        for (let i = 0; i < this.gradient.length; i++) {
          this.gradient[i] = new Int32Array(4);
        }
        this.gradient[0][1] = 0;
        this.gradient[0][2] = 0;
        this.gradient[0][0] = 0;
        this.gradient[0][3] = 4096;
        this.gradient[1][1] = 0;
        this.gradient[1][0] = 663;
        this.gradient[1][3] = 4096;
        this.gradient[1][2] = 4096;
        this.gradient[2][2] = 4096;
        this.gradient[2][1] = 0;
        this.gradient[2][0] = 1363;
        this.gradient[2][3] = 0;
        this.gradient[3][3] = 0;
        this.gradient[3][2] = 4096;
        this.gradient[3][1] = 4096;
        this.gradient[3][0] = 2048;
        this.gradient[4][3] = 0;
        this.gradient[4][0] = 2727;
        this.gradient[4][2] = 0;
        this.gradient[4][1] = 4096;
        this.gradient[5][1] = 4096;
        this.gradient[5][0] = 3411;
        this.gradient[5][2] = 0;
        this.gradient[5][3] = 4096;
        this.gradient[6][3] = 4096;
        this.gradient[6][2] = 0;
        this.gradient[6][1] = 0;
        this.gradient[6][0] = 4096;
        break;
      case 4:
        this.gradient = new Array(6);
        for (let i = 0; i < this.gradient.length; i++) {
          this.gradient[i] = new Int32Array(4);
        }
        this.gradient[0][3] = 0;
        this.gradient[0][1] = 0;
        this.gradient[0][0] = 0;
        this.gradient[0][2] = 0;
        this.gradient[1][0] = 1843;
        this.gradient[1][3] = 1493;
        this.gradient[1][2] = 0;
        this.gradient[1][1] = 0;
        this.gradient[2][3] = 2939;
        this.gradient[2][0] = 2457;
        this.gradient[2][1] = 0;
        this.gradient[2][2] = 0;
        this.gradient[3][3] = 3565;
        this.gradient[3][0] = 2781;
        this.gradient[3][1] = 0;
        this.gradient[3][2] = 1124;
        this.gradient[4][3] = 4031;
        this.gradient[4][1] = 546;
        this.gradient[4][0] = 3481;
        this.gradient[4][2] = 3084;
        this.gradient[5][0] = 4096;
        this.gradient[5][2] = 4096;
        this.gradient[5][1] = 4096;
        this.gradient[5][3] = 4096;
        break;
      case 5:
        this.gradient = new Array(16);
        for (let i = 0; i < this.gradient.length; i++) {
          this.gradient[i] = new Int32Array(4);
        }
        this.gradient[0][2] = 192;
        this.gradient[0][0] = 0;
        this.gradient[0][1] = 80;
        this.gradient[0][3] = 321;
        this.gradient[1][1] = 321;
        this.gradient[1][0] = 155;
        this.gradient[1][3] = 562;
        this.gradient[1][2] = 449;
        this.gradient[2][1] = 578;
        this.gradient[2][0] = 389;
        this.gradient[2][3] = 803;
        this.gradient[2][2] = 690;
        this.gradient[3][2] = 995;
        this.gradient[3][0] = 671;
        this.gradient[3][3] = 1140;
        this.gradient[3][1] = 947;
        this.gradient[4][2] = 1397;
        this.gradient[4][1] = 1285;
        this.gradient[4][0] = 897;
        this.gradient[4][3] = 1509;
        this.gradient[5][2] = 1429;
        this.gradient[5][0] = 1175;
        this.gradient[5][3] = 1413;
        this.gradient[5][1] = 1525;
        this.gradient[6][3] = 1333;
        this.gradient[6][0] = 1368;
        this.gradient[6][1] = 1734;
        this.gradient[6][2] = 1461;
        this.gradient[7][0] = 1507;
        this.gradient[7][1] = 1413;
        this.gradient[7][3] = 1702;
        this.gradient[7][2] = 1525;
        this.gradient[8][1] = 1108;
        this.gradient[8][2] = 1590;
        this.gradient[8][3] = 2056;
        this.gradient[8][0] = 1736;
        this.gradient[9][1] = 1766;
        this.gradient[9][0] = 2088;
        this.gradient[9][3] = 2666;
        this.gradient[9][2] = 2056;
        this.gradient[10][2] = 2586;
        this.gradient[10][0] = 2355;
        this.gradient[10][1] = 2409;
        this.gradient[10][3] = 3276;
        this.gradient[11][1] = 3116;
        this.gradient[11][3] = 3228;
        this.gradient[11][2] = 3148;
        this.gradient[11][0] = 2691;
        this.gradient[12][2] = 3710;
        this.gradient[12][1] = 3806;
        this.gradient[12][3] = 3196;
        this.gradient[12][0] = 3031;
        this.gradient[13][1] = 3437;
        this.gradient[13][2] = 3421;
        this.gradient[13][3] = 3019;
        this.gradient[13][0] = 3522;
        this.gradient[14][1] = 3116;
        this.gradient[14][0] = 3727;
        this.gradient[14][2] = 3148;
        this.gradient[14][3] = 3228;
        this.gradient[15][1] = 2377;
        this.gradient[15][2] = 2505;
        this.gradient[15][3] = 2746;
        this.gradient[15][0] = 4096;
        break;
      case 6:
        this.gradient = new Array(4);
        for (let i = 0; i < this.gradient.length; i++) {
          this.gradient[i] = new Int32Array(4);
        }
        this.gradient[0][3] = 0;
        this.gradient[0][2] = 4096;
        this.gradient[0][0] = 2048;
        this.gradient[0][1] = 0;
        this.gradient[1][2] = 4096;
        this.gradient[1][1] = 4096;
        this.gradient[1][3] = 0;
        this.gradient[1][0] = 2867;
        this.gradient[2][1] = 4096;
        this.gradient[2][2] = 4096;
        this.gradient[2][3] = 0;
        this.gradient[2][0] = 3276;
        this.gradient[3][2] = 0;
        this.gradient[3][0] = 4096;
        this.gradient[3][3] = 0;
        this.gradient[3][1] = 4096;
        break;
      default:
        throw new Error(`Invalid gradient preset: ${preset}`);
    }
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/GrayScaleOperation.ts
var GrayScaleOperation = class extends TextureOperation {
  constructor() {
    super(1, true);
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const input = this.getColourInput(textureGenerator, 0, line);
      const inputR = input[0];
      const inputG = input[1];
      const inputB = input[2];
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        output[pixel] = (inputR[pixel] + inputG[pixel] + inputB[pixel]) / 3;
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/HerringboneOperation.ts
var HerringboneOperation = class extends TextureOperation {
  constructor() {
    super(0, true);
    this.scaleX = 1;
    this.scaleY = 1;
    this.ratio = 204;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.scaleX = buffer.readUnsignedByte();
    } else if (field === 1) {
      this.scaleY = buffer.readUnsignedByte();
    } else if (field === 2) {
      this.ratio = buffer.readUnsignedShort();
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      for (let x = 0; x < textureGenerator.width; x++) {
        const vGrad = textureGenerator.horizontalGradient[x];
        const hGrad = textureGenerator.verticalGradient[line];
        let local40 = this.scaleX * vGrad >> 12;
        const local51 = this.scaleY * hGrad >> 12;
        const local61 = this.scaleX * (vGrad % (4096 / this.scaleX | 0));
        const local71 = this.scaleY * (hGrad % (4096 / this.scaleY | 0));
        if (local71 < this.ratio) {
          for (local40 -= local51; local40 < 0; local40 += 4) {
          }
          while (local40 > 3) {
            local40 -= 4;
          }
          if (local40 != 1) {
            output[x] = 0;
            continue;
          }
          if (local61 < this.ratio) {
            output[x] = 0;
            continue;
          }
        }
        if (local61 < this.ratio) {
          let local131;
          for (local131 = local40 - local51; local131 < 0; local131 += 4) {
          }
          while (local131 > 3) {
            local131 -= 4;
          }
          if (local131 > 0) {
            output[x] = 0;
            continue;
          }
        }
        output[x] = 4096;
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/HorizontalGradientOperation.ts
var HorizontalGradientOperation = class extends TextureOperation {
  constructor() {
    super(0, true);
  }
  getMonochromeOutput(textureGenerator, line) {
    return textureGenerator.horizontalGradient;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/HslOperation.ts
var HslOperation = class extends TextureOperation {
  constructor() {
    super(1, false);
    this.deltaHue = 0;
    this.deltaSaturation = 0;
    this.deltaLight = 0;
    this.hue = 0;
    this.saturation = 0;
    this.lightness = 0;
    this.r = 0;
    this.g = 0;
    this.b = 0;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.deltaHue = buffer.readSignedShort();
    } else if (field === 1) {
      this.deltaSaturation = (buffer.readByte() << 12) / 100 | 0;
    } else if (field === 2) {
      this.deltaLight = (buffer.readByte() << 12) / 100 | 0;
    }
  }
  setHsl(r, g, b) {
    const maxValue = Math.max(r, g, b);
    const minValue = Math.min(r, g, b);
    const delta = maxValue - minValue;
    this.lightness = (maxValue + minValue) / 2 | 0;
    if (delta > 0) {
      const invR = (maxValue - r << 12) / delta;
      const invG = (maxValue - g << 12) / delta;
      const invB = (maxValue - b << 12) / delta;
      if (r === maxValue) {
        this.hue = g === minValue ? invB + 20480 : 4096 - invG;
      } else if (g === maxValue) {
        this.hue = b === minValue ? invR + 4096 : 12288 - invB;
      } else {
        this.hue = minValue === r ? invG + 12288 : 20480 - invR;
      }
      this.hue = this.hue / 6 | 0;
    } else {
      this.hue = 0;
    }
    if (this.lightness > 0 && this.lightness < 4096) {
      this.saturation = (delta << 12) / (this.lightness > 2048 ? 8192 - this.lightness * 2 : this.lightness * 2);
    } else {
      this.saturation = 0;
    }
  }
  setRgb(hue, saturation, light) {
    const i = light > 2048 ? saturation + light - (saturation * light >> 12) : light * (4096 + saturation) >> 12;
    if (i > 0) {
      const j = light - i + light;
      const k = (i - j << 12) / i;
      hue *= 6;
      const l = hue >> 12;
      let j1 = i;
      let i1 = hue - (l << 12);
      j1 = j1 * k >> 12;
      j1 = i1 * j1 >> 12;
      const k1 = j + j1;
      const l1 = i - j1;
      if (l === 0) {
        this.r = i;
        this.g = k1;
        this.b = j;
      } else if (l === 1) {
        this.r = l1;
        this.g = i;
        this.b = j;
      } else if (l === 2) {
        this.r = j;
        this.g = i;
        this.b = k1;
      } else if (l === 3) {
        this.r = j;
        this.g = l1;
        this.b = i;
      } else if (l === 4) {
        this.r = k1;
        this.g = j;
        this.b = i;
      } else if (l === 5) {
        this.r = i;
        this.g = j;
        this.b = l1;
      }
    } else {
      this.r = this.g = this.b = light;
    }
  }
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache is not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty) {
      const input = this.getColourInput(textureGenerator, 0, line);
      const inputR = input[0];
      const inputG = input[1];
      const inputB = input[2];
      const outputR = output[0];
      const outputG = output[1];
      const outputB = output[2];
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        this.setHsl(inputR[pixel], inputG[pixel], inputB[pixel]);
        this.hue += this.deltaHue;
        this.saturation += this.deltaSaturation;
        this.lightness += this.deltaLight;
        for (; this.hue < 0; this.hue += 4096) {
        }
        for (; this.hue > 4096; this.hue -= 4096) {
        }
        if (this.saturation < 0) {
          this.saturation = 0;
        }
        if (this.saturation > 4096) {
          this.saturation = 4096;
        }
        if (this.lightness < 0) {
          this.lightness = 0;
        }
        if (this.lightness > 4096) {
          this.lightness = 4096;
        }
        this.setRgb(this.hue, this.saturation, this.lightness);
        outputR[pixel] = this.r;
        outputG[pixel] = this.g;
        outputB[pixel] = this.b;
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/InvertOperation.ts
var InvertOperation = class extends TextureOperation {
  constructor() {
    super(1, false);
  }
  decode(field, buffer) {
    if (field === 0) {
      this.isMonochrome = buffer.readUnsignedByte() === 1;
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const input = this.getMonochromeInput(textureGenerator, 0, line);
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        output[pixel] = 4096 - input[pixel];
      }
    }
    return output;
  }
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache is not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty) {
      const input = this.getColourInput(textureGenerator, 0, line);
      const inputR = input[0];
      const inputG = input[1];
      const inputB = input[2];
      const outputR = output[0];
      const outputG = output[1];
      const outputB = output[2];
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        outputR[pixel] = 4096 - inputR[pixel];
        outputG[pixel] = 4096 - inputG[pixel];
        outputB[pixel] = 4096 - inputB[pixel];
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/IrregularBricksOperation.ts
var import_java_random3 = __toESM(require("java-random"));

// ../rs-party-dashboard/src/rs/util/ArrayUtils.ts
var ArrayUtils = class {
  static fill(array, start, length, value) {
    array.fill(value, start, start + length);
  }
  static fillRange(array, start, end, value) {
    array.fill(value, start, end);
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/IrregularBricksOperation.ts
var IrregularBricksOperation = class extends TextureOperation {
  constructor() {
    super(0, true);
    this.seed = 0;
    this.field1 = 1024;
    this.field2 = 2048;
    this.field3 = 409;
    this.field4 = 819;
    this.field5 = 1024;
    this.field6 = 0;
    this.field7 = 1024;
    this.field8 = 1024;
    this.anInt79 = 0;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.seed = buffer.readUnsignedByte();
    } else if (field === 1) {
      this.field1 = buffer.readUnsignedShort();
    } else if (field === 2) {
      this.field2 = buffer.readUnsignedShort();
    } else if (field === 3) {
      this.field3 = buffer.readUnsignedShort();
    } else if (field === 4) {
      this.field4 = buffer.readUnsignedShort();
    } else if (field === 5) {
      this.field5 = buffer.readUnsignedShort();
    } else if (field === 6) {
      this.field6 = buffer.readUnsignedByte();
    } else if (field === 7) {
      this.field7 = buffer.readUnsignedShort();
    } else if (field === 8) {
      this.field8 = buffer.readUnsignedShort();
    }
  }
  method69(textureGenerator, arg0, arg1, arg2, arg3, random, pixels) {
    const local20 = this.field8 > 0 ? 4096 - nextIntJagex(random, this.field8) : 4096;
    const local28 = this.anInt79 * this.field7 >> 12;
    const local44 = this.anInt79 - (local28 > 0 ? nextIntJagex(random, local28) : 0);
    if (textureGenerator.width <= arg2) {
      arg2 -= textureGenerator.width;
    }
    if (local44 > 0) {
      if (arg0 <= 0 || arg1 <= 0) {
        return;
      }
      const local67 = arg1 / 2 | 0;
      const local71 = arg0 / 2 | 0;
      const local82 = local67 >= local44 ? local44 : local67;
      const local93 = local44 > local71 ? local71 : local44;
      const local97 = arg2 + local82;
      const local104 = arg1 - local82 * 2;
      for (let local106 = 0; local106 < arg0; local106++) {
        const local116 = pixels[local106 + arg3];
        if (local93 <= local106) {
          const local260 = arg0 - local106 - 1;
          if (local93 <= local260) {
            for (let local403 = 0; local403 < local82; local403++) {
              local116[textureGenerator.widthMask & arg2 + local403] = local116[textureGenerator.widthMask & arg1 + arg2 - local403 - 1] = local20 * local403 / local82 | 0;
            }
            if (local97 + local104 <= textureGenerator.width) {
              ArrayUtils.fill(local116, local97, local104, local20);
            } else {
              const local461 = textureGenerator.width - local97;
              ArrayUtils.fill(local116, local97, local461, local20);
              ArrayUtils.fill(local116, 0, local104 - local461, local20);
            }
          } else {
            const local274 = local260 * local20 / local93 | 0;
            if (this.field6 === 0) {
              for (let local327 = 0; local327 < local82; local327++) {
                const local336 = local327 * local20 / local82 | 0;
                local116[textureGenerator.widthMask & arg2 + local327] = local116[arg1 + arg2 - local327 - 1 & textureGenerator.widthMask] = local274 * local336 >> 12;
              }
            } else {
              for (let local280 = 0; local280 < local82; local280++) {
                const local289 = local20 * local280 / local82 | 0;
                local116[textureGenerator.widthMask & local280 + arg2] = local116[textureGenerator.widthMask & arg2 + arg1 - local280 - 1] = local274 > local289 ? local289 : local274;
              }
            }
            if (textureGenerator.width < local104 + local97) {
              const local379 = textureGenerator.width - local97;
              ArrayUtils.fill(local116, local97, local379, local274);
              ArrayUtils.fill(local116, 0, local104 - local379, local274);
            } else {
              ArrayUtils.fill(local116, local97, local104, local274);
            }
          }
        } else {
          const local130 = local106 * local20 / local93 | 0;
          if (this.field6 === 0) {
            for (let local184 = 0; local184 < local82; local184++) {
              const local193 = local20 * local184 / local82 | 0;
              local116[textureGenerator.widthMask & local184 + arg2] = local116[arg2 + arg1 - local184 - 1 & textureGenerator.widthMask] = local193 * local130 >> 12;
            }
          } else {
            for (let local138 = 0; local138 < local82; local138++) {
              const local151 = local20 * local138 / local82 | 0;
              local116[local138 + arg2 & textureGenerator.widthMask] = local116[arg1 + arg2 - local138 - 1 & textureGenerator.widthMask] = local130 <= local151 ? local130 : local151;
            }
          }
          if (local97 + local104 > textureGenerator.width) {
            const local231 = textureGenerator.width - local97;
            ArrayUtils.fill(local116, local97, local231, local130);
            ArrayUtils.fill(local116, 0, local104 - local231, local130);
          } else {
            ArrayUtils.fill(local116, local97, local104, local130);
          }
        }
      }
    } else if (textureGenerator.width >= arg1 + arg2) {
      for (let i = 0; i < arg0; i++) {
        ArrayUtils.fill(pixels[i + arg3], arg2, arg1, local20);
      }
    } else {
      const local507 = textureGenerator.width - arg2;
      for (let i = 0; i < arg0; i++) {
        const local518 = pixels[i + arg3];
        ArrayUtils.fill(local518, arg2, local507, local20);
        ArrayUtils.fill(local518, 0, arg1 - local507, local20);
      }
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (!this.monochromeImageCache.dirty) {
      return output;
    }
    let local23 = 0;
    const pixels = this.monochromeImageCache.getAll();
    let local30 = 0;
    let local32 = 0;
    let local34 = 0;
    let local36 = 0;
    let local38 = true;
    let local40 = 0;
    let local42 = true;
    const local49 = this.field1 * textureGenerator.width >> 12;
    let local51 = 0;
    const local58 = this.field3 * textureGenerator.height >> 12;
    const local65 = textureGenerator.width * this.field2 >> 12;
    const local72 = this.field4 * textureGenerator.height >> 12;
    if (local72 <= 1) {
      return pixels[line];
    }
    this.anInt79 = textureGenerator.width / 8 * this.field5 >> 12;
    const local99 = textureGenerator.width / local49 + 1 | 0;
    const random = new import_java_random3.default(this.seed);
    let local110 = new Array(local99);
    let local114 = new Array(local99);
    for (let i = 0; i < local99; i++) {
      local110[i] = new Int32Array(3);
      local114[i] = new Int32Array(3);
    }
    while (true) {
      while (true) {
        let local125 = local49 + nextIntJagex(random, local65 - local49);
        let local135 = nextIntJagex(random, local72 - local58) + local58;
        let local139 = local32 + local125;
        if (local139 > textureGenerator.width) {
          local125 = textureGenerator.width - local32;
          local139 = textureGenerator.width;
        }
        let local153;
        if (local38) {
          local153 = 0;
        } else {
          let local157 = local36;
          const local161 = local114[local36];
          local153 = local161[2];
          let local167 = 0;
          let local171 = local23 + local139;
          if (local171 < 0) {
            local171 += textureGenerator.width;
          }
          if (textureGenerator.width < local171) {
            local171 -= textureGenerator.width;
          }
          while (true) {
            const local196 = local114[local157];
            if (local196[0] <= local171 && local171 <= local196[1]) {
              if (local157 !== local36) {
                let local238 = local32 + local23;
                if (local238 < 0) {
                  local238 += textureGenerator.width;
                }
                if (local238 > textureGenerator.width) {
                  local238 -= textureGenerator.width;
                }
                for (let local258 = 1; local258 <= local167; local258++) {
                  const local269 = local114[(local258 + local36) % local40];
                  local153 = Math.max(local153, local269[2]);
                }
                for (let local280 = 0; local280 <= local167; local280++) {
                  const local295 = local114[(local280 + local36) % local40];
                  const local299 = local295[2];
                  if (local299 !== local153) {
                    const local306 = local295[1];
                    const local310 = local295[0];
                    let local320;
                    let local322;
                    if (local238 < local171) {
                      local320 = Math.max(local238, local310);
                      local322 = Math.min(local171, local306);
                    } else if (local310 == 0) {
                      local322 = Math.min(local171, local306);
                      local320 = 0;
                    } else {
                      local320 = Math.max(local238, local310);
                      local322 = textureGenerator.width;
                    }
                    this.method69(
                      textureGenerator,
                      local153 - local299,
                      local322 - local320,
                      local34 + local320,
                      local299,
                      random,
                      pixels
                    );
                  }
                }
              }
              local36 = local157;
              break;
            }
            local157++;
            if (local157 >= local40) {
              local157 = 0;
            }
            local167++;
          }
        }
        if (textureGenerator.height < local135 + local153) {
          local135 = textureGenerator.height - local153;
        } else {
          local42 = false;
        }
        if (local139 === textureGenerator.width) {
          this.method69(
            textureGenerator,
            local135,
            local125,
            local32 + local30,
            local153,
            random,
            pixels
          );
          if (local42) {
            return output;
          }
          local38 = false;
          const local440 = local51 + 1;
          const local442 = local110[local51];
          local42 = true;
          local442[1] = local139;
          local34 = local30;
          local40 = local440;
          local442[0] = local32;
          local442[2] = local135 + local153;
          local30 = nextIntJagex(random, textureGenerator.width);
          const local469 = local114;
          local36 = 0;
          local23 = local30 - local34;
          local114 = local110;
          let local480 = local23;
          local110 = local469;
          if (local23 < 0) {
            local480 = local23 + textureGenerator.width;
          }
          local51 = 0;
          if (textureGenerator.width < local480) {
            local480 -= textureGenerator.width;
          }
          while (true) {
            const local506 = local114[local36];
            if (local480 >= local506[0] && local506[1] >= local480) {
              local32 = 0;
              break;
            }
            local36++;
            if (local40 <= local36) {
              local36 = 0;
            }
          }
        } else {
          const local388 = local110[local51++];
          local388[1] = local139;
          local388[2] = local135 + local153;
          local388[0] = local32;
          this.method69(
            textureGenerator,
            local135,
            local125,
            local30 + local32,
            local153,
            random,
            pixels
          );
          local32 = local139;
        }
      }
    }
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/KaleidoscopeOperation.ts
var KaleidoscopeOperation = class _KaleidoscopeOperation extends TextureOperation {
  static {
    this.x0 = 0;
  }
  static {
    this.y0 = 0;
  }
  constructor() {
    super(1, false);
  }
  decode(field, buffer) {
    if (field === 0) {
      this.isMonochrome = buffer.readUnsignedByte() === 1;
    }
  }
  calcPos(textureGenerator, x, y) {
    const hGrad = textureGenerator.horizontalGradient[y];
    const vGrad = textureGenerator.verticalGradient[x];
    const angle = Math.fround(Math.atan2(hGrad - 2048, vGrad - 2048));
    if (angle >= -3.141592653589793 && angle <= -2.356194490192345) {
      _KaleidoscopeOperation.x0 = x;
      _KaleidoscopeOperation.y0 = y;
    } else if (angle <= -1.5707963267948966 && angle >= -2.356194490192345) {
      _KaleidoscopeOperation.y0 = x;
      _KaleidoscopeOperation.x0 = y;
    } else if (angle <= -0.7853981633974483 && angle >= -1.5707963267948966) {
      _KaleidoscopeOperation.x0 = textureGenerator.width - y;
      _KaleidoscopeOperation.y0 = x;
    } else if (angle <= 0 && angle >= -0.7853981633974483) {
      _KaleidoscopeOperation.y0 = textureGenerator.height - y;
      _KaleidoscopeOperation.x0 = x;
    } else if (angle >= 0 && angle <= 0.7853981633974483) {
      _KaleidoscopeOperation.x0 = textureGenerator.width - x;
      _KaleidoscopeOperation.y0 = textureGenerator.height - y;
    } else if (angle >= 0.7853981633974483 && angle <= 1.5707963267948966) {
      _KaleidoscopeOperation.x0 = textureGenerator.width - y;
      _KaleidoscopeOperation.y0 = textureGenerator.height - x;
    } else if (angle >= 1.5707963267948966 && angle <= 2.356194490192345) {
      _KaleidoscopeOperation.x0 = y;
      _KaleidoscopeOperation.y0 = textureGenerator.height - x;
    } else if (angle >= 2.356194490192345 && angle <= 3.141592653589793) {
      _KaleidoscopeOperation.y0 = y;
      _KaleidoscopeOperation.x0 = textureGenerator.width - x;
    }
    _KaleidoscopeOperation.x0 &= textureGenerator.widthMask;
    _KaleidoscopeOperation.y0 &= textureGenerator.heightMask;
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        this.calcPos(textureGenerator, pixel, line);
        const input = this.getMonochromeInput(
          textureGenerator,
          0,
          _KaleidoscopeOperation.y0
        );
        output[pixel] = input[_KaleidoscopeOperation.x0];
      }
    }
    return output;
  }
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache is not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty) {
      const outputR = output[0];
      const outputG = output[1];
      const outputB = output[2];
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        this.calcPos(textureGenerator, pixel, line);
        const input = this.getColourInput(textureGenerator, 0, _KaleidoscopeOperation.y0);
        outputR[pixel] = input[0][_KaleidoscopeOperation.x0];
        outputG[pixel] = input[1][_KaleidoscopeOperation.x0];
        outputB[pixel] = input[2][_KaleidoscopeOperation.x0];
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/LineNoiseOperation.ts
var import_java_random4 = __toESM(require("java-random"));
var LineNoiseOperation = class extends TextureOperation {
  constructor() {
    super(0, true);
    this.seed = 0;
    this.count = 2e3;
    this.length = 16;
    this.minAngle = 0;
    this.maxAngle = 4096;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.seed = buffer.readUnsignedByte();
    } else if (field === 1) {
      this.count = buffer.readUnsignedShort();
    } else if (field === 2) {
      this.length = buffer.readUnsignedByte();
    } else if (field === 3) {
      this.minAngle = buffer.readUnsignedShort();
    } else if (field === 4) {
      this.maxAngle = buffer.readUnsignedShort();
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const midAngle = this.maxAngle >> 1;
      const pixels = this.monochromeImageCache.getAll();
      const random = new import_java_random4.default(this.seed);
      for (let i = 0; i < this.count; i++) {
        let angle = this.maxAngle > 0 ? this.minAngle - midAngle + nextIntJagex(random, this.maxAngle) : this.minAngle;
        angle = angle >> 4 & 255;
        let x0 = nextIntJagex(random, textureGenerator.width);
        let y0 = nextIntJagex(random, textureGenerator.height);
        let x1 = (TextureGenerator.COSINE[angle] * this.length >> 12) + x0;
        let y1 = (TextureGenerator.SINE[angle] * this.length >> 12) + y0;
        let deltaX = x1 - x0;
        let deltaY = y1 - y0;
        if (deltaX !== 0 || deltaY !== 0) {
          if (deltaX < 0) {
            deltaX = -deltaX;
          }
          if (deltaY < 0) {
            deltaY = -deltaY;
          }
          const flag = deltaX < deltaY;
          if (flag) {
            const tempX0 = x0;
            const tempX1 = x1;
            x0 = y0;
            y0 = tempX0;
            x1 = y1;
            y1 = tempX1;
          }
          if (x0 > x1) {
            const tempX0 = x0;
            const tempY0 = y0;
            x0 = x1;
            y0 = y1;
            x1 = tempX0;
            y1 = tempY0;
          }
          const deltaX0 = x1 - x0;
          let deltaY0 = y1 - y0;
          let l2 = y0;
          if (deltaY0 < 0) {
            deltaY0 = -deltaY0;
          }
          let i4 = -deltaX0 / 2 | 0;
          const j4 = 2048 / deltaX0 | 0;
          const k4 = 1024 - (nextIntJagex(random, 4096) >> 2);
          const byte0 = y1 <= y0 ? -1 : 1;
          for (let x = x0; x < x1; x++) {
            i4 += deltaY0;
            const value = j4 * (x - x0) + (1024 + k4);
            const line2 = l2 & textureGenerator.heightMask;
            if (i4 > 0) {
              l2 = byte0 + l2;
              i4 = i4 - deltaX0;
            }
            const pixel = x & textureGenerator.widthMask;
            if (!flag) {
              pixels[pixel][line2] = value;
            } else {
              pixels[line2][pixel] = value;
            }
          }
        }
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/MandelbrotOperation.ts
var MandelbrotOperation = class extends TextureOperation {
  constructor() {
    super(0, true);
    this.field0 = 1365;
    this.field1 = 20;
    this.field2 = 0;
    this.field3 = 0;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.field0 = buffer.readUnsignedShort();
    } else if (field === 1) {
      this.field1 = buffer.readUnsignedShort();
    } else if (field === 2) {
      this.field2 = buffer.readUnsignedShort();
    } else if (field === 3) {
      this.field3 = buffer.readUnsignedShort();
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      for (let x = 0; x < textureGenerator.width; x++) {
        const local42 = this.field2 + (textureGenerator.horizontalGradient[x] << 12) / this.field0 | 0;
        const local54 = this.field3 + (textureGenerator.verticalGradient[line] << 12) / this.field0 | 0;
        let local58 = local54;
        let local60 = local42;
        let local64 = 0;
        let local70 = local42 * local42 >> 12;
        let local76 = local54 * local54 >> 12;
        while (local70 + local76 < 16384 && local64 < this.field1) {
          local64++;
          local58 = local54 + (local58 * local60 >> 12) * 2;
          local60 = local42 + local70 - local76;
          local76 = local58 * local58 >> 12;
          local70 = local60 * local60 >> 12;
        }
        output[x] = local64 >= this.field1 - 1 ? 0 : (local64 << 12) / this.field1 | 0;
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/MirrorOperation.ts
var MirrorOperation = class extends TextureOperation {
  constructor() {
    super(1, false);
    this.invertHorizontal = true;
    this.invertVertical = true;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.invertHorizontal = buffer.readUnsignedByte() === 1;
    } else if (field === 1) {
      this.invertVertical = buffer.readUnsignedByte() === 1;
    } else if (field === 2) {
      this.isMonochrome = buffer.readUnsignedByte() === 1;
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const input = this.getMonochromeInput(
        textureGenerator,
        0,
        this.invertVertical ? textureGenerator.heightMask - line : line
      );
      if (this.invertHorizontal) {
        for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
          output[pixel] = input[textureGenerator.widthMask - pixel];
        }
      } else {
        output.set(input);
      }
    }
    return output;
  }
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache is not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty) {
      const input = this.getColourInput(
        textureGenerator,
        0,
        this.invertVertical ? textureGenerator.heightMask - line : line
      );
      const inputR = input[0];
      const inputG = input[1];
      const inputB = input[2];
      const outputR = output[0];
      const outputG = output[1];
      const outputB = output[2];
      if (this.invertHorizontal) {
        for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
          outputR[pixel] = inputR[textureGenerator.widthMask - pixel];
          outputG[pixel] = inputG[textureGenerator.widthMask - pixel];
          outputB[pixel] = inputB[textureGenerator.widthMask - pixel];
        }
      } else {
        for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
          outputR[pixel] = inputR[pixel];
          outputG[pixel] = inputG[pixel];
          outputB[pixel] = inputB[pixel];
        }
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/MixerOperation.ts
var MixerOperation = class extends TextureOperation {
  constructor() {
    super(3, false);
  }
  decode(field, buffer) {
    if (field === 0) {
      this.isMonochrome = buffer.readUnsignedByte() === 1;
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const inputA = this.getMonochromeInput(textureGenerator, 0, line);
      const inputB = this.getMonochromeInput(textureGenerator, 1, line);
      const inputC = this.getMonochromeInput(textureGenerator, 2, line);
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        const aWeight = inputC[pixel];
        if (aWeight === 4096) {
          output[pixel] = inputA[pixel];
        } else if (aWeight === 0) {
          output[pixel] = inputB[pixel];
        } else {
          output[pixel] = (4096 - aWeight) * inputB[pixel] + aWeight * inputA[pixel] >> 12;
        }
      }
    }
    return output;
  }
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache is not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty) {
      const inputC = this.getMonochromeInput(textureGenerator, 2, line);
      const inputA = this.getColourInput(textureGenerator, 0, line);
      const inputB = this.getColourInput(textureGenerator, 1, line);
      const outputR = output[0];
      const outputG = output[1];
      const outputB = output[2];
      const inputAR = inputA[0];
      const inputAG = inputA[1];
      const inputAB = inputA[2];
      const inputBR = inputB[0];
      const inputBG = inputB[1];
      const inputBB = inputB[2];
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        const aWeight = inputC[pixel];
        if (aWeight === 4096) {
          outputR[pixel] = inputAR[pixel];
          outputG[pixel] = inputAG[pixel];
          outputB[pixel] = inputAB[pixel];
        } else if (aWeight === 0) {
          outputR[pixel] = inputBR[pixel];
          outputG[pixel] = inputBG[pixel];
          outputB[pixel] = inputBB[pixel];
        } else {
          const bWeight = 4096 - aWeight;
          outputR[pixel] = aWeight * inputAR[pixel] + bWeight * inputBR[pixel] >> 12;
          outputG[pixel] = aWeight * inputAG[pixel] + bWeight * inputBG[pixel] >> 12;
          outputB[pixel] = aWeight * inputAB[pixel] + bWeight * inputBB[pixel] >> 12;
        }
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/MonochromeEdgeDetectorOperation.ts
var MonochromeEdgeDetectorOperation = class extends TextureOperation {
  constructor() {
    super(1, true);
    this.multiplier = 4096;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.multiplier = buffer.readUnsignedShort();
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const prevInput = this.getMonochromeInput(
        textureGenerator,
        0,
        line - 1 & textureGenerator.heightMask
      );
      const input = this.getMonochromeInput(textureGenerator, 0, line);
      const nextInput = this.getMonochromeInput(
        textureGenerator,
        0,
        line + 1 & textureGenerator.heightMask
      );
      for (let x = 0; x < textureGenerator.width; x++) {
        const dy = this.multiplier * (nextInput[x] - prevInput[x]);
        const dx = this.multiplier * (input[x + 1 & textureGenerator.widthMask] - input[x - 1 & textureGenerator.widthMask]);
        const dx0 = dx >> 12;
        const dy0 = dy >> 12;
        const dySquared = dy0 * dy0 >> 12;
        const dxSquared = dx0 * dx0 >> 12;
        const local117 = Math.sqrt((dySquared + dxSquared + 4096) / 4096) * 4096 | 0;
        const local128 = local117 == 0 ? 0 : 16777216 / local117 | 0;
        output[x] = 4096 - local128;
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/Operation37.ts
var Operation37 = class extends TextureOperation {
  constructor() {
    super(0, true);
    this.field0 = 2048;
    this.field1 = 0;
    this.field2 = 0;
    this.field3 = 2048;
    this.field4 = 12288;
    this.field5 = 4096;
    this.field6 = 8192;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.field0 = buffer.readUnsignedShort();
    } else if (field === 1) {
      this.field1 = buffer.readUnsignedShort();
    } else if (field === 2) {
      this.field2 = buffer.readUnsignedShort();
    } else if (field === 3) {
      this.field3 = buffer.readUnsignedShort();
    } else if (field === 4) {
      this.field4 = buffer.readUnsignedShort();
    } else if (field === 5) {
      this.field5 = buffer.readUnsignedShort();
    } else if (field === 6) {
      this.field6 = buffer.readUnsignedShort();
    }
  }
  method3687(x, y) {
    const local9 = (y - x) * this.field4 >> 12;
    let local24 = TextureGenerator.COSINE[local9 * 255 >> 12 & 255];
    local24 = (local24 << 12) / this.field4 | 0;
    local24 = (local24 << 12) / this.field6 | 0;
    local24 = this.field5 * local24 >> 12;
    return local24 > x + y && -local24 < x + y;
  }
  method3690(x, y) {
    const local13 = (y + x) * this.field4 >> 12;
    let local23 = TextureGenerator.COSINE[local13 * 255 >> 12 & 255];
    local23 = (local23 << 12) / this.field4 | 0;
    local23 = (local23 << 12) / this.field6 | 0;
    local23 = local23 * this.field5 >> 12;
    return local23 > y - x && y - x > -local23;
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const local22 = textureGenerator.verticalGradient[line] - 2048;
      for (let x = 0; x < textureGenerator.width; x++) {
        const local33 = textureGenerator.horizontalGradient[x] - 2048;
        let local38 = local33 + this.field0;
        local38 = local38 >= -2048 ? local38 : local38 + 4096;
        let local53 = local22 + this.field1;
        local38 = local38 <= 2048 ? local38 : local38 - 4096;
        local53 = local53 >= -2048 ? local53 : local53 + 4096;
        local53 = local53 <= 2048 ? local53 : local53 - 4096;
        let local87 = local33 + this.field2;
        let local92 = local22 + this.field3;
        local87 = local87 >= -2048 ? local87 : local87 + 4096;
        local87 = local87 <= 2048 ? local87 : local87 - 4096;
        local92 = local92 >= -2048 ? local92 : local92 + 4096;
        local92 = local92 <= 2048 ? local92 : local92 - 4096;
        output[x] = this.method3687(local38, local53) || this.method3690(local87, local92) ? 4096 : 0;
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/PerlinNoiseOperation.ts
var PerlinNoiseOperation = class _PerlinNoiseOperation extends TextureOperation {
  constructor() {
    super(0, true);
    this.field0 = true;
    this.field1 = 4;
    this.field2 = 1638;
    this.seed = 0;
    this.field5 = 4;
    this.field6 = 4;
    this.permutations = new Int8Array(512);
  }
  static {
    this.invertTable = [
      [1, 1],
      [-1, 1],
      [1, -1],
      [-1, -1]
    ];
  }
  static {
    this.noise = new Int32Array(4096);
  }
  static initNoise() {
    for (let i = 0; i < 4096; i++) {
      _PerlinNoiseOperation.noise[i] = _PerlinNoiseOperation.calcNoise(i);
    }
  }
  static addInvert(x, y, invert) {
    return x * invert[0] + y * invert[1];
  }
  static method1047(n) {
    const i = (n * n >> 12) * n >> 12;
    const j = 6 * n - 61440;
    const k = 40960 + (j * n >> 12);
    return k * i >> 12;
  }
  static calcNoise(n) {
    const i_9_ = (n * n >> 12) * n >> 12;
    const i_10_ = n * 6 - 61440;
    const i_11_ = 40960 + (n * i_10_ >> 12);
    return i_9_ * i_11_ >> 12;
  }
  static lerp(start, end, amount) {
    return start * (4096 - amount) + end * amount >> 12;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.field0 = buffer.readUnsignedByte() === 1;
    } else if (field === 1) {
      this.field1 = buffer.readUnsignedByte();
    } else if (field === 2) {
      this.field2 = buffer.readSignedShort();
      if (this.field2 < 0) {
        this.noiseInput0 = new Int16Array(this.field1);
        for (let i = 0; i < this.field1; i++) {
          this.noiseInput0[i] = buffer.readSignedShort();
        }
      }
    } else if (field === 3) {
      this.field5 = this.field6 = buffer.readUnsignedByte();
    } else if (field === 4) {
      this.seed = buffer.readUnsignedByte();
    } else if (field === 5) {
      this.field5 = buffer.readUnsignedByte();
    } else if (field === 6) {
      this.field6 = buffer.readUnsignedByte();
    }
  }
  init() {
    this.initTable();
    this.initNoiseInput();
    for (let i = this.field1 - 1; i >= 1; i--) {
      const v = this.noiseInput0[i];
      if (v > 8 || v < -8) {
        break;
      }
      this.field1--;
    }
  }
  initTable() {
    this.permutations = TextureGenerator.initPermutations(this.seed);
  }
  initNoiseInput() {
    if (this.field2 <= 0) {
      if (this.noiseInput0 && this.noiseInput0.length === this.field1) {
        this.noiseInput1 = new Int16Array(this.field1);
        for (let i = 0; i < this.field1; i++) {
          this.noiseInput1[i] = Math.pow(2, i);
        }
      }
    } else {
      this.noiseInput0 = new Int16Array(this.field1);
      this.noiseInput1 = new Int16Array(this.field1);
      for (let i = 0; i < this.field1; i++) {
        this.noiseInput0[i] = Math.pow(Math.fround(this.field2 / 4096), i) * 4096;
        this.noiseInput1[i] = Math.pow(2, i);
      }
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      this.noise0(textureGenerator, line, output);
    }
    return output;
  }
  noise0(textureGenerator, line, output) {
    const vGrad = this.field6 * textureGenerator.verticalGradient[line];
    if (this.field1 === 1) {
      const nin0 = this.noiseInput0[0];
      const nin1 = this.noiseInput1[0] << 12;
      const n1f5 = nin1 * this.field5 >> 12;
      const n1f6 = nin1 * this.field6 >> 12;
      let noiseIndex = nin1 * vGrad >> 12;
      const permIndex0 = noiseIndex >> 12;
      let permIndex1 = permIndex0 + 1;
      if (n1f6 <= permIndex1) {
        permIndex1 = 0;
      }
      noiseIndex &= 4095;
      const noise2 = _PerlinNoiseOperation.noise[noiseIndex];
      const perm0 = this.permutations[permIndex0 & 255] & 255;
      const perm1 = this.permutations[permIndex1 & 255] & 255;
      if (this.field0) {
        for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
          const hGrad = this.field5 * textureGenerator.horizontalGradient[pixel];
          let v = this.noise1(
            nin1 * hGrad >> 12,
            n1f5,
            perm0,
            perm1,
            noiseIndex,
            noise2
          );
          v = nin0 * v >> 12;
          output[pixel] = (v >> 1) + 2048;
        }
      } else {
        for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
          const hGrad = this.field5 * textureGenerator.horizontalGradient[pixel];
          const v = this.noise1(
            nin1 * hGrad >> 12,
            n1f5,
            perm0,
            perm1,
            noiseIndex,
            noise2
          );
          output[pixel] = v * nin0 >> 12;
        }
      }
    } else {
      let i_45_ = this.noiseInput0[0];
      if (i_45_ > 8 || i_45_ < -8) {
        const i_46_ = this.noiseInput1[0] << 12;
        let i_47_ = i_46_ * vGrad >> 12;
        const i_48_ = i_46_ * this.field5 >> 12;
        const i_49_ = i_46_ * this.field6 >> 12;
        const i_50_ = i_47_ >> 12;
        let i_51_ = i_50_ + 1;
        i_47_ &= 4095;
        if (i_49_ <= i_51_) {
          i_51_ = 0;
        }
        const i_52_ = this.permutations[i_50_ & 255] & 255;
        const i_53_ = _PerlinNoiseOperation.noise[i_47_];
        const i_54_ = this.permutations[i_51_ & 255] & 255;
        for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
          const i_56_ = this.field5 * textureGenerator.horizontalGradient[pixel];
          const i_57_ = this.noise1(
            i_56_ * i_46_ >> 12,
            i_48_,
            i_52_,
            i_54_,
            i_47_,
            i_53_
          );
          output[pixel] = i_45_ * i_57_ >> 12;
        }
      }
      for (let i_58_ = 1; i_58_ < this.field1; i_58_++) {
        i_45_ = this.noiseInput0[i_58_];
        if (i_45_ > 8 || i_45_ < -8) {
          const i_59_ = this.noiseInput1[i_58_] << 12;
          const i_60_ = this.field6 * i_59_ >> 12;
          const i_61_ = this.field5 * i_59_ >> 12;
          let i_62_ = vGrad * i_59_ >> 12;
          const i_63_ = i_62_ >> 12;
          let i_64_ = i_63_ + 1;
          i_62_ &= 4095;
          if (i_60_ <= i_64_) {
            i_64_ = 0;
          }
          const i_65_ = this.permutations[i_64_ & 255] & 255;
          const i_66_ = this.permutations[i_63_ & 255] & 255;
          const i_67_ = _PerlinNoiseOperation.noise[i_62_];
          if (this.field0 && this.field1 - 1 === i_58_) {
            for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
              const i_69_ = textureGenerator.horizontalGradient[pixel] * this.field5;
              let i_70_ = this.noise1(
                i_59_ * i_69_ >> 12,
                i_61_,
                i_66_,
                i_65_,
                i_62_,
                i_67_
              );
              i_70_ = output[pixel] + (i_70_ * i_45_ >> 12);
              output[pixel] = 2048 + (i_70_ >> 1);
            }
          } else {
            for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
              const i_72_ = textureGenerator.horizontalGradient[pixel] * this.field5;
              const i_73_ = this.noise1(
                i_59_ * i_72_ >> 12,
                i_61_,
                i_66_,
                i_65_,
                i_62_,
                i_67_
              );
              output[pixel] += i_45_ * i_73_ >> 12;
            }
          }
        }
      }
    }
  }
  noise1(hGrad, vGrad, perm0, perm1, noiseIndex, noise2) {
    let i_8_ = hGrad >> 12;
    let i_9_ = i_8_ + 1;
    hGrad &= 4095;
    if (i_9_ >= vGrad) {
      i_9_ = 0;
    }
    i_8_ &= 255;
    let i_10_ = noiseIndex - 4096;
    let i_11_ = hGrad - 4096;
    i_9_ &= 255;
    let i_12_ = this.permutations[perm0 + i_8_] & 3;
    let i_13_ = _PerlinNoiseOperation.noise[hGrad];
    let i_14_;
    if (i_12_ > 1) {
      i_14_ = i_12_ == 2 ? -noiseIndex + hGrad : -noiseIndex + -hGrad;
    } else {
      i_14_ = i_12_ == 0 ? noiseIndex + hGrad : -hGrad + noiseIndex;
    }
    i_12_ = this.permutations[perm0 + i_9_] & 3;
    let i_15_;
    if (i_12_ <= 1) {
      i_15_ = i_12_ == 0 ? noiseIndex + i_11_ : noiseIndex - i_11_;
    } else {
      i_15_ = i_12_ == 2 ? i_11_ - noiseIndex : -i_11_ + -noiseIndex;
    }
    i_12_ = this.permutations[perm1 + i_8_] & 3;
    const i_16_ = (i_13_ * (i_15_ - i_14_) >> 12) + i_14_;
    if (i_12_ <= 1) {
      i_14_ = i_12_ != 0 ? i_10_ - hGrad : hGrad + i_10_;
    } else {
      i_14_ = i_12_ != 2 ? -i_10_ + -hGrad : hGrad - i_10_;
    }
    i_12_ = this.permutations[i_9_ + perm1] & 3;
    if (i_12_ <= 1) {
      i_15_ = i_12_ == 0 ? i_11_ + i_10_ : i_10_ - i_11_;
    } else {
      i_15_ = i_12_ == 2 ? -i_10_ + i_11_ : -i_10_ + -i_11_;
    }
    const i_17_ = i_14_ + (i_13_ * (i_15_ - i_14_) >> 12);
    return i_16_ + (noise2 * (i_17_ - i_16_) >> 12);
  }
  noise(x, y, verticalGradient, horizontalGradient) {
    let k = x & 4294963200;
    x -= k;
    let l = y & 4294963200;
    y -= l;
    const j1 = verticalGradient & 4294963200;
    const i1 = horizontalGradient & 4294963200;
    l >>= 12;
    let j = l + 1;
    l &= 255;
    k >>= 12;
    let i = k + 1;
    if (i1 >> 12 <= i) {
      i = 0;
    }
    k &= 255;
    i &= 255;
    if (j >= j1 >> 12) {
      j = 0;
    }
    const i2 = this.permutations[this.permutations[l] + i] % 4;
    const k1 = this.permutations[this.permutations[l] + k] % 4;
    j &= 255;
    const j2 = this.permutations[this.permutations[j] + i] % 4;
    const l1 = this.permutations[this.permutations[j] + k] % 4;
    const k2 = _PerlinNoiseOperation.addInvert(x, y, _PerlinNoiseOperation.invertTable[k1]);
    const l2 = _PerlinNoiseOperation.addInvert(
      x - 4096,
      y,
      _PerlinNoiseOperation.invertTable[i2]
    );
    const i3 = _PerlinNoiseOperation.addInvert(
      x,
      y - 4096,
      _PerlinNoiseOperation.invertTable[l1]
    );
    const j3 = _PerlinNoiseOperation.addInvert(
      x - 4096,
      y - 4096,
      _PerlinNoiseOperation.invertTable[j2]
    );
    const k3 = _PerlinNoiseOperation.method1047(x);
    const l3 = _PerlinNoiseOperation.method1047(y);
    const i4 = _PerlinNoiseOperation.lerp(k2, l2, k3);
    const j4 = _PerlinNoiseOperation.lerp(i3, j3, k3);
    return _PerlinNoiseOperation.lerp(i4, j4, l3);
  }
};
PerlinNoiseOperation.initNoise();

// ../rs-party-dashboard/src/rs/texture/procedural/operation/PseudoRandomNoiseOperation.ts
var PseudoRandomNoiseOperation = class _PseudoRandomNoiseOperation extends TextureOperation {
  static noise(x, y) {
    let n = x + y * 57;
    n ^= n << 1;
    return 4096 - ((1376312589 + (789221 + 15731 * (n * n)) * n & 2147483647) / 262144 | 0);
  }
  constructor() {
    super(0, true);
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const vertGradient = textureGenerator.verticalGradient[line];
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        const horzGradient = textureGenerator.horizontalGradient[pixel];
        output[pixel] = _PseudoRandomNoiseOperation.noise(horzGradient, vertGradient) % 4096;
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/RangeOperation.ts
var RangeOperation = class extends TextureOperation {
  constructor() {
    super(1, false);
    this.field0 = 1024;
    this.field1 = 3072;
    this.field2 = this.field1 - this.field0;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.field0 = buffer.readUnsignedShort();
    } else if (field === 1) {
      this.field1 = buffer.readUnsignedShort();
    } else if (field === 2) {
      this.isMonochrome = buffer.readUnsignedByte() === 1;
    }
  }
  init() {
    this.field2 = this.field1 - this.field0;
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const input = this.getMonochromeInput(textureGenerator, 0, line);
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        output[pixel] = (this.field2 * input[pixel] >> 12) + this.field0;
      }
    }
    return output;
  }
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache is not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty) {
      const input = this.getColourInput(textureGenerator, 0, line);
      const inputR = input[0];
      const inputG = input[1];
      const inputB = input[2];
      const outputR = output[0];
      const outputG = output[1];
      const outputB = output[2];
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        outputR[pixel] = (this.field2 * inputR[pixel] >> 12) + this.field0;
        outputG[pixel] = (this.field2 * inputG[pixel] >> 12) + this.field0;
        outputB[pixel] = (this.field2 * inputB[pixel] >> 12) + this.field0;
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/RasterizerOperation.ts
var RasterizerOperation = class extends TextureOperation {
  constructor() {
    super(0, true);
  }
  decode(field, buffer) {
    if (field === 0) {
      const count = buffer.readUnsignedByte();
      this.ops = new Array(count);
      for (let i = 0; i < count; i++) {
        const type = buffer.readUnsignedByte();
        if (type === 0) {
          this.ops[i] = RasterizerOperationLine.create(buffer);
        } else if (type === 1) {
          this.ops[i] = RasterizerOperationBezierCurve.create(buffer);
        } else if (type === 2) {
          this.ops[i] = RasterizerOperationRectangle.create(buffer);
        } else if (type === 3) {
          this.ops[i] = RasterizerOperationEllipse.create(buffer);
        }
      }
    } else if (field === 1) {
      this.isMonochrome = buffer.readUnsignedByte() === 1;
    }
  }
  render(textureGenerator, pixels) {
    const width = textureGenerator.width;
    const height = textureGenerator.height;
    Rasterizer.setPixels(pixels);
    Rasterizer.setDimensionMasks(textureGenerator.widthMask, textureGenerator.heightMask);
    if (this.ops === void 0) {
      return;
    }
    for (const op of this.ops) {
      const fillColor = op.fillColor;
      const outlineColor = op.outlineColor;
      if (fillColor >= 0) {
        if (outlineColor >= 0) {
          op.render(width, height);
        } else {
          op.renderFill(width, height);
        }
      } else if (outlineColor >= 0) {
        op.renderOutline(width, height);
      }
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      this.render(textureGenerator, this.monochromeImageCache.getAll());
    }
    return output;
  }
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache is not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty) {
      const width = textureGenerator.width;
      const height = textureGenerator.height;
      const pixels = new Array(height);
      for (let i = 0; i < height; i++) {
        pixels[i] = new Int32Array(width);
      }
      const outputAll = this.colourImageCache.getAll();
      this.render(textureGenerator, pixels);
      for (let y = 0; y < textureGenerator.height; y++) {
        const output2 = outputAll[y];
        const outputR = output2[0];
        const outputG = output2[1];
        const outputB = output2[2];
        const input = pixels[y];
        for (let x = 0; x < textureGenerator.width; x++) {
          const rgb = input[x];
          outputR[x] = rgb >> 12 & 4080;
          outputG[x] = rgb >> 4 & 4080;
          outputB[x] = (rgb & 255) << 4;
        }
      }
    }
    return output;
  }
};
var Rasterizer = class _Rasterizer {
  static {
    this.widthMask = 0;
  }
  static {
    this.heightMask = 0;
  }
  static {
    this.startX = 0;
  }
  static {
    this.startY = 0;
  }
  static setPixels(pixels) {
    this.pixels = pixels;
  }
  static setDimensionMasks(widthMask, heightMask) {
    this.widthMask = widthMask;
    this.heightMask = heightMask;
    this.startX = 0;
    this.startY = 0;
  }
  static initCircleOutline(size) {
    if (this.circleOutline === void 0 || this.circleOutline.length < size) {
      this.circleOutline = new Int32Array(size);
    }
  }
  static rasterLine(x0, x1, y0, y1, color) {
    const deltaX = x1 - x0;
    const deltaY = y1 - y0;
    if (deltaX === 0) {
      if (deltaY !== 0) {
        _Rasterizer.rasterVerticalLine(x0, y0, y1, color);
      }
    } else if (deltaY === 0) {
      _Rasterizer.rasterHorizontalLine(x0, x1, y0, color);
    } else {
      const local55 = (deltaY << 12) / deltaX | 0;
      const local64 = y0 - (x0 * local55 >> 12);
      let startX;
      let startY;
      if (x0 < _Rasterizer.startX) {
        startY = local64 + (_Rasterizer.startX * local55 >> 12);
        startX = _Rasterizer.startX;
      } else if (_Rasterizer.widthMask >= x0) {
        startX = x0;
        startY = y0;
      } else {
        startX = _Rasterizer.widthMask;
        startY = (_Rasterizer.widthMask * local55 >> 12) + local64;
      }
      let endX;
      let endY;
      if (x1 < _Rasterizer.startX) {
        endX = _Rasterizer.startX;
        endY = local64 + (_Rasterizer.startX * local55 >> 12);
      } else if (x1 <= _Rasterizer.widthMask) {
        endX = x1;
        endY = y1;
      } else {
        endX = _Rasterizer.widthMask;
        endY = (local55 * _Rasterizer.widthMask >> 12) + local64;
      }
      if (_Rasterizer.startY > endY) {
        endX = (_Rasterizer.startY - local64 << 12) / local55;
        endY = _Rasterizer.startY;
      } else if (_Rasterizer.heightMask < endY) {
        endX = (_Rasterizer.heightMask - local64 << 12) / local55;
        endY = _Rasterizer.heightMask;
      }
      if (_Rasterizer.startY > startY) {
        startX = (_Rasterizer.startY - local64 << 12) / local55;
        startY = _Rasterizer.startY;
      } else if (startY > _Rasterizer.heightMask) {
        startY = _Rasterizer.heightMask;
        startX = (_Rasterizer.heightMask - local64 << 12) / local55;
      }
      _Rasterizer.rasterLine0(startX, endX, startY, endY, color);
    }
  }
  static rasterLine0(x0, x1, y0, y1, color) {
    let deltaX = x1 - x0;
    let deltaY = y1 - y0;
    if (deltaX === 0) {
      if (deltaY !== 0) {
        _Rasterizer.rasterVerticalLine0(x0, y0, y1, color);
      }
    } else if (deltaY === 0) {
      _Rasterizer.rasterHorizontalLine0(x0, x1, y0, color);
    } else {
      if (deltaX < 0) {
        deltaX = -deltaX;
      }
      if (deltaY < 0) {
        deltaY = -deltaY;
      }
      const local70 = deltaY > deltaX;
      if (local70) {
        const temp0 = x0;
        x0 = y0;
        y0 = temp0;
        const temp1 = x1;
        x1 = y1;
        y1 = temp1;
      }
      if (x1 < x0) {
        const temp0 = x0;
        x0 = x1;
        const temp1 = y0;
        y0 = y1;
        y1 = temp1;
        x1 = temp0;
      }
      let y = y0;
      const local110 = x1 - x0;
      let local115 = y1 - y0;
      const local126 = y1 > y0 ? 1 : -1;
      if (local115 < 0) {
        local115 = -local115;
      }
      let local137 = -(local110 >> 1);
      if (local70) {
        for (let local141 = x0; local141 <= x1; local141++) {
          local137 += local115;
          _Rasterizer.pixels[local141][y] = color;
          if (local137 > 0) {
            y += local126;
            local137 -= local110;
          }
        }
      } else {
        for (let x = x0; x <= x1; x++) {
          local137 += local115;
          _Rasterizer.pixels[y][x] = color;
          if (local137 > 0) {
            y += local126;
            local137 -= local110;
          }
        }
      }
    }
  }
  static rasterVerticalLine(x0, y0, y1, color) {
    if (_Rasterizer.startX <= x0 && _Rasterizer.widthMask >= x0) {
      y0 = clamp(y0, _Rasterizer.startY, _Rasterizer.heightMask);
      y1 = clamp(y1, _Rasterizer.startY, _Rasterizer.heightMask);
      _Rasterizer.rasterVerticalLine0(x0, y0, y1, color);
    }
  }
  static rasterVerticalLine0(x0, y0, y1, color) {
    if (y1 >= y0) {
      for (let y = y0; y < y1; y++) {
        _Rasterizer.pixels[y][x0] = color;
      }
    } else {
      for (let y = y1; y < y0; y++) {
        _Rasterizer.pixels[y][x0] = color;
      }
    }
  }
  static rasterHorizontalLine(x0, x1, y0, color) {
    if (_Rasterizer.startY <= y0 && y0 <= _Rasterizer.heightMask) {
      x0 = clamp(x0, _Rasterizer.startX, _Rasterizer.widthMask);
      x1 = clamp(x1, _Rasterizer.startX, _Rasterizer.widthMask);
      _Rasterizer.rasterHorizontalLine0(x0, x1, y0, color);
    }
  }
  static rasterHorizontalLine0(x0, x1, y0, color) {
    if (x1 >= x0) {
      ArrayUtils.fillRange(_Rasterizer.pixels[y0], x0, x1, color);
    } else {
      ArrayUtils.fillRange(_Rasterizer.pixels[y0], x1, x0, color);
    }
  }
  static rasterBezierCurve(x0, y0, x1, y1, x2, y2, x3, y3, outlineColor) {
    if (_Rasterizer.startX <= x0 && x0 <= _Rasterizer.widthMask && _Rasterizer.startX <= x1 && _Rasterizer.widthMask >= x1 && _Rasterizer.startX <= x2 && _Rasterizer.widthMask >= x2 && _Rasterizer.startX <= x3 && x3 <= _Rasterizer.widthMask && y0 >= _Rasterizer.startY && y0 <= _Rasterizer.heightMask && y1 >= _Rasterizer.startY && _Rasterizer.heightMask >= y1 && y2 >= _Rasterizer.startY && _Rasterizer.heightMask >= y2 && _Rasterizer.startY <= y3 && _Rasterizer.heightMask >= y3) {
      _Rasterizer.rasterBezierCurve0(x0, y0, x1, y1, x2, y2, x3, y3, outlineColor);
    } else {
      _Rasterizer.rasterBezierCurveClamped(x0, y0, x1, y1, x2, y2, x3, y3, outlineColor);
    }
  }
  static rasterBezierCurve0(x0, y0, x1, y1, x2, y2, x3, y3, outlineColor) {
    if (x0 === x1 && y0 === y1 && x2 === x3 && y2 === y3) {
      _Rasterizer.rasterLine0(x0, x3, y0, y3, outlineColor);
      return;
    }
    let local36 = x0;
    let local38 = y0;
    const local42 = x0 * 3;
    const local46 = y0 * 3;
    const local50 = x1 * 3;
    const local54 = x2 * 3;
    const local58 = y1 * 3;
    const local62 = y2 * 3;
    const local72 = local50 + x3 - x0 - local54;
    const local81 = local58 + y3 - local62 - y0;
    const local92 = local54 + local42 - local50 - local50;
    const local103 = local62 + local46 - local58 - local58;
    const local108 = local58 - local46;
    const local113 = local50 - local42;
    for (let local115 = 128; local115 <= 4096; local115 += 128) {
      const local126 = local115 * local115 >> 12;
      const local132 = local115 * local126 >> 12;
      const local136 = local132 * local72;
      const local140 = local126 * local92;
      const local144 = local113 * local115;
      const local148 = local103 * local126;
      const local158 = (local144 + local140 + local136 >> 12) + x0;
      const local162 = local81 * local132;
      const local166 = local108 * local115;
      const local176 = (local166 + local162 + local148 >> 12) + y0;
      _Rasterizer.rasterLine0(local36, local158, local38, local176, outlineColor);
      local36 = local158;
      local38 = local176;
    }
  }
  static rasterBezierCurveClamped(x0, y0, x1, y1, x2, y2, x3, y3, outlineColor) {
    if (x1 === x0 && y1 === y0 && x2 === x3 && y2 === y3) {
      _Rasterizer.rasterLine(x0, x3, y0, y3, outlineColor);
      return;
    }
    let local32 = x0;
    let local34 = y0;
    const local38 = x0 * 3;
    const local42 = y1 * 3;
    const local46 = x1 * 3;
    const local50 = x2 * 3;
    const local61 = x3 + local46 - x0 - local50;
    const local65 = y0 * 3;
    const local75 = local38 + local50 - local46 - local46;
    const local79 = y2 * 3;
    const local90 = local79 + local65 - local42 - local42;
    const local100 = local42 + y3 - y0 - local79;
    const local104 = local46 - local38;
    const local108 = local42 - local65;
    for (let local110 = 128; local110 <= 4096; local110 += 128) {
      const local119 = local110 * local110 >> 12;
      const local123 = local119 * local75;
      const local129 = local110 * local119 >> 12;
      const local133 = local129 * local61;
      const local137 = local108 * local110;
      const local141 = local90 * local119;
      const local145 = local100 * local129;
      const local149 = local104 * local110;
      const local159 = (local149 + local123 + local133 >> 12) + x0;
      const local170 = (local137 + local145 + local141 >> 12) + y0;
      _Rasterizer.rasterLine(local32, local159, local34, local170, outlineColor);
      local34 = local170;
      local32 = local159;
    }
  }
  static rasterRectangle(x0, x1, y0, y1, fillColor, outlineColor, outlineWidth) {
    if (x0 >= _Rasterizer.startX && x1 <= _Rasterizer.widthMask && _Rasterizer.startY <= y0 && y1 <= _Rasterizer.heightMask) {
      _Rasterizer.rasterRectangle0(x0, x1, y0, y1, fillColor, outlineColor, outlineWidth);
    } else {
      _Rasterizer.rasterRectangleClamped(
        x0,
        x1,
        y0,
        y1,
        fillColor,
        outlineColor,
        outlineWidth
      );
    }
  }
  static rasterRectangle0(x0, x1, y0, y1, fillColor, outlineColor, outlineWidth) {
    const local6 = y0 + outlineWidth;
    const local14 = y1 - outlineWidth;
    const local18 = x0 + outlineWidth;
    const local23 = x1 - outlineWidth;
    for (let local25 = y0; local25 < local6; local25++) {
      ArrayUtils.fillRange(_Rasterizer.pixels[local25], x0, x1, outlineColor);
    }
    for (let local55 = y1; local55 > local14; local55--) {
      ArrayUtils.fillRange(_Rasterizer.pixels[local55], x0, x1, outlineColor);
    }
    for (let local75 = local6; local75 <= local14; local75++) {
      const local86 = _Rasterizer.pixels[local75];
      ArrayUtils.fillRange(local86, x0, local18, outlineColor);
      ArrayUtils.fillRange(local86, local18, local23, fillColor);
      ArrayUtils.fillRange(local86, local23, x1, outlineColor);
    }
  }
  static rasterRectangleClamped(x0, x1, y0, y1, fillColor, outlineColor, outlineWidth) {
    const local11 = clamp(y0, _Rasterizer.startY, _Rasterizer.heightMask);
    const local22 = clamp(y1, _Rasterizer.startY, _Rasterizer.heightMask);
    const local28 = clamp(x0, _Rasterizer.startX, _Rasterizer.widthMask);
    const local34 = clamp(x1, _Rasterizer.startX, _Rasterizer.widthMask);
    const local43 = clamp(y0 + outlineWidth, _Rasterizer.startY, _Rasterizer.heightMask);
    const local52 = clamp(y1 - outlineWidth, _Rasterizer.startY, _Rasterizer.heightMask);
    for (let local54 = local11; local54 < local43; local54++) {
      ArrayUtils.fillRange(_Rasterizer.pixels[local54], local28, local34, outlineColor);
    }
    for (let local74 = local22; local74 > local52; local74--) {
      ArrayUtils.fillRange(_Rasterizer.pixels[local74], local28, local34, outlineColor);
    }
    const local97 = clamp(x0 + outlineWidth, _Rasterizer.startX, _Rasterizer.widthMask);
    const local106 = clamp(x1 - outlineWidth, _Rasterizer.startX, _Rasterizer.widthMask);
    for (let local108 = local43; local108 <= local52; local108++) {
      const local119 = _Rasterizer.pixels[local108];
      ArrayUtils.fillRange(local119, local28, local97, outlineColor);
      ArrayUtils.fillRange(local119, local97, local106, fillColor);
      ArrayUtils.fillRange(local119, local106, local34, outlineColor);
    }
  }
  static rasterRectangleFill(x0, x1, y0, y1, fillColor) {
    if (_Rasterizer.startX <= x0 && x1 <= _Rasterizer.widthMask && _Rasterizer.startY <= y0 && y1 <= _Rasterizer.heightMask) {
      _Rasterizer.rasterRectangleFill0(x0, x1, y0, y1, fillColor);
    } else {
      _Rasterizer.rasterRectangleFillClamped(x0, x1, y0, y1, fillColor);
    }
  }
  static rasterRectangleFill0(x0, x1, y0, y1, fillColor) {
    for (let local6 = y0; local6 <= y1; local6++) {
      ArrayUtils.fillRange(_Rasterizer.pixels[local6], x0, x1, fillColor);
    }
  }
  static rasterRectangleFillClamped(x0, x1, y0, y1, fillColor) {
    const local11 = clamp(y0, _Rasterizer.startY, _Rasterizer.heightMask);
    const local17 = clamp(y1, _Rasterizer.startY, _Rasterizer.heightMask);
    const local23 = clamp(x0, _Rasterizer.startX, _Rasterizer.widthMask);
    const local29 = clamp(x1, _Rasterizer.startX, _Rasterizer.widthMask);
    for (let local31 = local11; local31 <= local17; local31++) {
      ArrayUtils.fillRange(_Rasterizer.pixels[local31], local23, local29, fillColor);
    }
  }
  static rasterRectangleOutline(x0, x1, y0, y1, outlineColor, outlineWidth) {
    if (x0 >= _Rasterizer.startX && _Rasterizer.widthMask >= x1 && y0 >= _Rasterizer.startY && _Rasterizer.heightMask >= y1) {
      if (outlineWidth === 1) {
        _Rasterizer.rasterRectangleOutlineWidth1(x0, x1, y0, y1, outlineColor);
      } else {
        _Rasterizer.rasterRectangleOutline0(x0, x1, y0, y1, outlineColor, outlineWidth);
      }
    } else if (outlineWidth === 1) {
      _Rasterizer.rasterRectangleOutlineWidth1Clamped(x0, x1, y0, y1, outlineColor);
    } else {
      _Rasterizer.rasterRectangleOutlineClamped(x0, x1, y0, y1, outlineColor, outlineWidth);
    }
  }
  static rasterRectangleOutlineWidth1(x0, x1, y0, y1, outlineColor) {
    ArrayUtils.fillRange(_Rasterizer.pixels[y0++], x0, x1, outlineColor);
    ArrayUtils.fillRange(_Rasterizer.pixels[y1--], x0, x1, outlineColor);
    for (let local31 = y0; local31 <= y1; local31++) {
      const local42 = _Rasterizer.pixels[local31];
      local42[x0] = local42[x1] = outlineColor;
    }
  }
  static rasterRectangleOutline0(x0, x1, y0, y1, outlineColor, outlineWidth) {
    const local10 = outlineWidth + y0;
    const local18 = y1 - outlineWidth;
    const local22 = outlineWidth + x0;
    for (let local24 = y0; local24 < local10; local24++) {
      ArrayUtils.fillRange(_Rasterizer.pixels[local24], x0, x1, outlineColor);
    }
    for (let local44 = y1; local44 > local18; local44--) {
      ArrayUtils.fillRange(_Rasterizer.pixels[local44], x0, x1, outlineColor);
    }
    const local66 = x1 - outlineWidth;
    for (let local68 = local10; local68 <= local18; local68++) {
      const local79 = _Rasterizer.pixels[local68];
      ArrayUtils.fillRange(local79, x0, local22, outlineColor);
      ArrayUtils.fillRange(local79, local66, x1, outlineColor);
    }
  }
  static rasterRectangleOutlineWidth1Clamped(x0, x1, y0, y1, outlineColor) {
    if (_Rasterizer.heightMask < y0 || _Rasterizer.startY > y1) {
      return;
    }
    let local23;
    if (_Rasterizer.startX > x0) {
      x0 = _Rasterizer.startX;
      local23 = false;
    } else if (x0 > _Rasterizer.widthMask) {
      x0 = _Rasterizer.widthMask;
      local23 = false;
    } else {
      local23 = true;
    }
    let local51;
    if (x1 < _Rasterizer.startX) {
      x1 = _Rasterizer.startX;
      local51 = false;
    } else if (_Rasterizer.widthMask < x1) {
      x1 = _Rasterizer.widthMask;
      local51 = false;
    } else {
      local51 = true;
    }
    let local71;
    if (_Rasterizer.startY <= y0) {
      local71 = y0 + 1;
      ArrayUtils.fillRange(_Rasterizer.pixels[y0], x0, x1, outlineColor);
    } else {
      local71 = _Rasterizer.startY;
    }
    let local89;
    if (_Rasterizer.heightMask < y1) {
      local89 = _Rasterizer.heightMask;
    } else {
      local89 = y1 - 1;
      ArrayUtils.fillRange(_Rasterizer.pixels[y1], x0, x1, outlineColor);
    }
    if (local23 && local51) {
      for (let local106 = local71; local106 <= local89; local106++) {
        const local113 = _Rasterizer.pixels[local106];
        local113[x0] = local113[x1] = outlineColor;
      }
    } else if (local23) {
      for (let local149 = local71; local149 <= local89; local149++) {
        _Rasterizer.pixels[local149][x0] = outlineColor;
      }
    } else if (local51) {
      for (let local133 = local71; local133 <= local89; local133++) {
        _Rasterizer.pixels[local133][x1] = outlineColor;
      }
    }
  }
  static rasterRectangleOutlineClamped(x0, x1, y0, y1, outlineColor, outlineWidth) {
    const local17 = clamp(y0, _Rasterizer.startY, _Rasterizer.heightMask);
    const local23 = clamp(y1, _Rasterizer.startY, _Rasterizer.heightMask);
    const local29 = clamp(x0, _Rasterizer.startX, _Rasterizer.widthMask);
    const local35 = clamp(x1, _Rasterizer.startX, _Rasterizer.widthMask);
    const local43 = clamp(outlineWidth + y0, _Rasterizer.startY, _Rasterizer.heightMask);
    const local52 = clamp(y1 - outlineWidth, _Rasterizer.startY, _Rasterizer.heightMask);
    for (let local54 = local17; local54 < local43; local54++) {
      ArrayUtils.fillRange(_Rasterizer.pixels[local54], local29, local35, outlineColor);
    }
    for (let local70 = local23; local70 > local52; local70--) {
      ArrayUtils.fillRange(_Rasterizer.pixels[local70], local29, local35, outlineColor);
    }
    const local97 = clamp(x0 + outlineWidth, _Rasterizer.startX, _Rasterizer.widthMask);
    const local106 = clamp(x1 - outlineWidth, _Rasterizer.startX, _Rasterizer.widthMask);
    for (let local108 = local43; local108 <= local52; local108++) {
      const local119 = _Rasterizer.pixels[local108];
      ArrayUtils.fillRange(local119, local29, local97, outlineColor);
      ArrayUtils.fillRange(local119, local106, local35, outlineColor);
    }
  }
  static rasterEllipse(x, y, sizeX, sizeY, fillColor, outlineColor, outlineWidth) {
    if (sizeX === sizeY) {
      _Rasterizer.rasterCircle(x, y, sizeX, fillColor, outlineColor, outlineWidth);
    } else if (x - sizeX >= _Rasterizer.startX && _Rasterizer.widthMask >= sizeX + x && y - sizeY >= _Rasterizer.startY && sizeY + y <= _Rasterizer.heightMask) {
      _Rasterizer.rasterEllipse0(x, y, sizeX, sizeY, fillColor, outlineColor, outlineWidth);
    } else {
      _Rasterizer.rasterEllipseClamped(
        x,
        y,
        sizeX,
        sizeY,
        fillColor,
        outlineColor,
        outlineWidth
      );
    }
  }
  static rasterEllipse0(x, y, sizeX, sizeY, fillColor, outlineColor, outlineWidth) {
    let local7 = 0;
    let local9 = sizeY;
    const local14 = sizeX - outlineWidth;
    let local16 = 0;
    const local21 = sizeY - outlineWidth;
    const local25 = sizeX * sizeX;
    const local29 = sizeY * sizeY;
    const local33 = local14 * local14;
    const local37 = local21 * local21;
    const local41 = local29 << 1;
    const local45 = local37 << 1;
    const local49 = local25 << 1;
    const local53 = local33 << 1;
    const local57 = sizeY << 1;
    const local61 = local21 << 1;
    let local71 = local25 * (1 - local57) + local41;
    let local80 = local29 - local49 * (local57 - 1);
    let local89 = local45 + (1 - local61) * local33;
    let local98 = local37 - local53 * (local61 - 1);
    const local102 = local25 << 2;
    const local106 = local29 << 2;
    const local110 = local37 << 2;
    const local114 = local33 << 2;
    let local118 = local41 * 3;
    let local124 = local49 * (local57 - 3);
    let local128 = local45 * 3;
    let local130 = local106;
    let local136 = (local61 - 3) * local53;
    let local138 = local110;
    let local144 = (sizeY - 1) * local102;
    let local150 = local114 * (local21 - 1);
    const local154 = _Rasterizer.pixels[y];
    ArrayUtils.fillRange(local154, x - sizeX, x - local14, outlineColor);
    ArrayUtils.fillRange(local154, x - local14, local14 + x, fillColor);
    ArrayUtils.fillRange(local154, local14 + x, x + sizeX, outlineColor);
    while (local9 > 0) {
      if (local71 < 0) {
        while (local71 < 0) {
          local71 += local118;
          local118 += local106;
          local7++;
          local80 += local130;
          local130 += local106;
        }
      }
      if (local80 < 0) {
        local71 += local118;
        local80 += local130;
        local118 += local106;
        local7++;
        local130 += local106;
      }
      local71 += -local144;
      const local251 = x - local7;
      const local258 = local21 >= local9;
      const local263 = x + local7;
      local144 -= local102;
      local9--;
      local80 += -local124;
      const local277 = local9 + y;
      local124 -= local102;
      if (local258) {
        if (local89 < 0) {
          while (local89 < 0) {
            local16++;
            local98 += local138;
            local89 += local128;
            local138 += local110;
            local128 += local110;
          }
        }
        if (local98 < 0) {
          local89 += local128;
          local128 += local110;
          local16++;
          local98 += local138;
          local138 += local110;
        }
        local98 += -local136;
        local89 += -local150;
        local150 -= local114;
        local136 -= local114;
      }
      const local352 = y - local9;
      if (local258) {
        const local358 = x - local16;
        ArrayUtils.fillRange(_Rasterizer.pixels[local352], local251, local358, outlineColor);
        const local371 = x + local16;
        ArrayUtils.fillRange(_Rasterizer.pixels[local352], local358, local371, fillColor);
        ArrayUtils.fillRange(_Rasterizer.pixels[local352], local371, local263, outlineColor);
        ArrayUtils.fillRange(_Rasterizer.pixels[local277], local251, local358, outlineColor);
        ArrayUtils.fillRange(_Rasterizer.pixels[local277], local358, local371, fillColor);
        ArrayUtils.fillRange(_Rasterizer.pixels[local277], local371, local263, outlineColor);
      } else {
        ArrayUtils.fillRange(_Rasterizer.pixels[local352], local251, local263, outlineColor);
        ArrayUtils.fillRange(_Rasterizer.pixels[local277], local251, local263, outlineColor);
      }
    }
  }
  static rasterEllipseClamped(x, y, sizeX, sizeY, fillColor, outlineColor, outlineWidth) {
    let local3 = 0;
    const local7 = sizeY - outlineWidth;
    let local9 = sizeY;
    let local11 = 0;
    const local16 = sizeX - outlineWidth;
    const local20 = sizeX * sizeX;
    const local28 = sizeY * sizeY;
    const local32 = local16 * local16;
    const local36 = local28 << 1;
    const local40 = local7 * local7;
    const local44 = local20 << 1;
    const local48 = local40 << 1;
    const local52 = local32 << 1;
    const local56 = sizeY << 1;
    const local60 = local7 << 1;
    let local69 = local36 + (1 - local56) * local20;
    let local78 = local28 - (local56 - 1) * local44;
    let local87 = local32 * (1 - local60) + local48;
    const local91 = local20 << 2;
    let local104 = local40 - local52 * (local60 - 1);
    const local108 = local28 << 2;
    const local112 = local32 << 2;
    const local116 = local40 << 2;
    let local120 = local36 * 3;
    let local124 = local48 * 3;
    let local130 = local44 * (local56 - 3);
    let local132 = local108;
    let local138 = (local60 - 3) * local52;
    let local144 = local91 * (sizeY - 1);
    let local146 = local116;
    let local152 = (local7 - 1) * local112;
    if (y >= _Rasterizer.startY && _Rasterizer.heightMask >= y) {
      const local166 = _Rasterizer.pixels[y];
      const local177 = clamp(x - sizeX, _Rasterizer.startX, _Rasterizer.widthMask);
      const local185 = clamp(x + sizeX, _Rasterizer.startX, _Rasterizer.widthMask);
      const local193 = clamp(x - local16, _Rasterizer.startX, _Rasterizer.widthMask);
      const local203 = clamp(x + local16, _Rasterizer.startX, _Rasterizer.widthMask);
      ArrayUtils.fillRange(local166, local177, local193, outlineColor);
      ArrayUtils.fillRange(local166, local193, local203, fillColor);
      ArrayUtils.fillRange(local166, local203, local185, outlineColor);
    }
    while (local9 > 0) {
      if (local69 < 0) {
        while (local69 < 0) {
          local69 += local120;
          local3++;
          local120 += local108;
          local78 += local132;
          local132 += local108;
        }
      }
      if (local78 < 0) {
        local3++;
        local69 += local120;
        local120 += local108;
        local78 += local132;
        local132 += local108;
      }
      const local281 = local7 >= local9;
      local78 += -local130;
      local9--;
      if (local281) {
        if (local87 < 0) {
          while (local87 < 0) {
            local87 += local124;
            local104 += local146;
            local124 += local116;
            local146 += local116;
            local11++;
          }
        }
        if (local104 < 0) {
          local87 += local124;
          local124 += local116;
          local104 += local146;
          local146 += local116;
          local11++;
        }
        local104 += -local138;
        local138 -= local112;
        local87 += -local152;
        local152 -= local112;
      }
      local69 += -local144;
      const local363 = local9 + y;
      const local367 = y - local9;
      local144 -= local91;
      local130 -= local91;
      if (local363 >= _Rasterizer.startY && _Rasterizer.heightMask >= local367) {
        const local389 = clamp(local3 + x, _Rasterizer.startX, _Rasterizer.widthMask);
        const local398 = clamp(x - local3, _Rasterizer.startX, _Rasterizer.widthMask);
        if (local281) {
          const local409 = clamp(x + local11, _Rasterizer.startX, _Rasterizer.widthMask);
          const local418 = clamp(x - local11, _Rasterizer.startX, _Rasterizer.widthMask);
          if (_Rasterizer.startY <= local367) {
            const local426 = _Rasterizer.pixels[local367];
            ArrayUtils.fillRange(local426, local398, local418, outlineColor);
            ArrayUtils.fillRange(local426, local418, local409, fillColor);
            ArrayUtils.fillRange(local426, local409, local389, outlineColor);
          }
          if (_Rasterizer.heightMask >= local363) {
            const local456 = _Rasterizer.pixels[local363];
            ArrayUtils.fillRange(local456, local398, local418, outlineColor);
            ArrayUtils.fillRange(local456, local418, local409, fillColor);
            ArrayUtils.fillRange(local456, local409, local389, outlineColor);
          }
        } else {
          if (local367 >= _Rasterizer.startY) {
            ArrayUtils.fillRange(
              _Rasterizer.pixels[local367],
              local398,
              local389,
              outlineColor
            );
          }
          if (_Rasterizer.heightMask >= local363) {
            ArrayUtils.fillRange(
              _Rasterizer.pixels[local363],
              local398,
              local389,
              outlineColor
            );
          }
        }
      }
    }
  }
  static rasterCircle(x, y, size, fillColor, outlineColor, outlineWidth) {
    if (_Rasterizer.startX <= x - size && size + x <= _Rasterizer.widthMask && y - size >= _Rasterizer.startY && _Rasterizer.heightMask >= size + y) {
      _Rasterizer.rasterCircle0(x, y, size, fillColor, outlineColor, outlineWidth);
    } else {
      _Rasterizer.rasterCircleClamped(x, y, size, fillColor, outlineColor, outlineWidth);
    }
  }
  static rasterCircle0(x, y, size, fillColor, outlineColor, outlineWidth) {
    _Rasterizer.initCircleOutline(size);
    let local10 = 0;
    let local13 = -size;
    let local17 = size - outlineWidth;
    let local19 = size;
    let local21 = -1;
    let local23 = -1;
    const local27 = _Rasterizer.pixels[y];
    if (local17 < 0) {
      local17 = 0;
    }
    let local34 = local17;
    const local39 = x - local17;
    ArrayUtils.fillRange(local27, x - size, local39, outlineColor);
    const local57 = local17 + x;
    let local60 = -local17;
    ArrayUtils.fillRange(local27, local39, local57, fillColor);
    ArrayUtils.fillRange(local27, local57, x + size, outlineColor);
    while (local19 > local10) {
      local23 += 2;
      local13 += local23;
      local21 += 2;
      local60 += local21;
      if (local60 >= 0 && local34 >= 1) {
        _Rasterizer.circleOutline[local34] = local10;
        local34--;
        local60 -= local34 << 1;
      }
      local10++;
      if (local13 >= 0) {
        local19--;
        if (local19 >= local17) {
          const local126 = _Rasterizer.pixels[y + local19];
          const local131 = x + local10;
          const local138 = _Rasterizer.pixels[y - local19];
          const local143 = x - local10;
          ArrayUtils.fillRange(local126, local143, local131, outlineColor);
          ArrayUtils.fillRange(local138, local143, local131, outlineColor);
        } else {
          const local163 = _Rasterizer.pixels[local19 + y];
          const local167 = _Rasterizer.circleOutline[local19];
          const local174 = _Rasterizer.pixels[y - local19];
          const local178 = local10 + x;
          const local182 = x - local167;
          const local186 = local167 + x;
          const local191 = x - local10;
          ArrayUtils.fillRange(local163, local191, local182, outlineColor);
          ArrayUtils.fillRange(local163, local182, local186, fillColor);
          ArrayUtils.fillRange(local163, local186, local178, outlineColor);
          ArrayUtils.fillRange(local174, local191, local182, outlineColor);
          ArrayUtils.fillRange(local174, local182, local186, fillColor);
          ArrayUtils.fillRange(local174, local186, local178, outlineColor);
        }
        local13 -= local19 << 1;
      }
      const local240 = _Rasterizer.pixels[y + local10];
      const local247 = _Rasterizer.pixels[y - local10];
      const local251 = local19 + x;
      const local256 = x - local19;
      if (local17 <= local10) {
        ArrayUtils.fillRange(local240, local256, local251, outlineColor);
        ArrayUtils.fillRange(local247, local256, local251, outlineColor);
      } else {
        const local286 = local10 > local34 ? _Rasterizer.circleOutline[local10] : local34;
        const local290 = local286 + x;
        const local294 = x - local286;
        ArrayUtils.fillRange(local240, local256, local294, outlineColor);
        ArrayUtils.fillRange(local240, local294, local290, fillColor);
        ArrayUtils.fillRange(local240, local290, local251, outlineColor);
        ArrayUtils.fillRange(local247, local256, local294, outlineColor);
        ArrayUtils.fillRange(local247, local294, local290, fillColor);
        ArrayUtils.fillRange(local247, local290, local251, outlineColor);
      }
    }
  }
  static rasterCircleClamped(x, y, size, fillColor, outlineColor, outlineWidth) {
    _Rasterizer.initCircleOutline(size);
    let local9 = size - outlineWidth;
    let local15 = size;
    let local17 = 0;
    let local20 = -size;
    if (local9 < 0) {
      local9 = 0;
    }
    let local29 = local9;
    if (_Rasterizer.startY <= y && y <= _Rasterizer.heightMask) {
      const local40 = _Rasterizer.pixels[y];
      const local48 = clamp(x - size, _Rasterizer.startX, _Rasterizer.widthMask);
      const local56 = clamp(size + x, _Rasterizer.startX, _Rasterizer.widthMask);
      const local67 = clamp(x - local9, _Rasterizer.startX, _Rasterizer.widthMask);
      const local77 = clamp(x + local9, _Rasterizer.startX, _Rasterizer.widthMask);
      ArrayUtils.fillRange(local40, local48, local67, outlineColor);
      ArrayUtils.fillRange(local40, local67, local77, fillColor);
      ArrayUtils.fillRange(local40, local77, local56, outlineColor);
    }
    let local98 = -local9;
    let local100 = -1;
    let local102 = -1;
    while (local17 < local15) {
      local100 += 2;
      local98 += local100;
      local102 += 2;
      if (local98 >= 0 && local29 >= 1) {
        local29--;
        local98 -= local29 << 1;
        _Rasterizer.circleOutline[local29] = local17;
      }
      local17++;
      local20 += local102;
      if (local20 >= 0) {
        local15--;
        local20 -= local15 << 1;
        const local154 = y - local15;
        const local159 = y + local15;
        if (_Rasterizer.startY <= local159 && local154 <= _Rasterizer.heightMask) {
          if (local15 >= local9) {
            const local186 = clamp(
              x + local17,
              _Rasterizer.startX,
              _Rasterizer.widthMask
            );
            const local194 = clamp(
              x - local17,
              _Rasterizer.startX,
              _Rasterizer.widthMask
            );
            if (_Rasterizer.heightMask >= local159) {
              ArrayUtils.fillRange(
                _Rasterizer.pixels[local159],
                local194,
                local186,
                outlineColor
              );
            }
            if (local154 >= _Rasterizer.startY) {
              ArrayUtils.fillRange(
                _Rasterizer.pixels[local154],
                local194,
                local186,
                outlineColor
              );
            }
          } else {
            const local226 = _Rasterizer.circleOutline[local15];
            const local237 = clamp(
              x + local17,
              _Rasterizer.startX,
              _Rasterizer.widthMask
            );
            const local245 = clamp(
              x - local17,
              _Rasterizer.startX,
              _Rasterizer.widthMask
            );
            const local254 = clamp(
              x + local226,
              _Rasterizer.startX,
              _Rasterizer.widthMask
            );
            const local262 = clamp(
              x - local226,
              _Rasterizer.startX,
              _Rasterizer.widthMask
            );
            if (_Rasterizer.heightMask >= local159) {
              const local274 = _Rasterizer.pixels[local159];
              ArrayUtils.fillRange(local274, local245, local262, outlineColor);
              ArrayUtils.fillRange(local274, local262, local254, fillColor);
              ArrayUtils.fillRange(local274, local254, local237, outlineColor);
            }
            if (_Rasterizer.startY <= local154) {
              const local300 = _Rasterizer.pixels[local154];
              ArrayUtils.fillRange(local300, local245, local262, outlineColor);
              ArrayUtils.fillRange(local300, local262, local254, fillColor);
              ArrayUtils.fillRange(local300, local254, local237, outlineColor);
            }
          }
        }
      }
      const local322 = y + local17;
      const local327 = y - local17;
      if (_Rasterizer.startY <= local322 && _Rasterizer.heightMask >= local327) {
        const local337 = local15 + x;
        const local342 = x - local15;
        if (local337 >= _Rasterizer.startX && _Rasterizer.widthMask >= local342) {
          const local359 = clamp(local337, _Rasterizer.startX, _Rasterizer.widthMask);
          const local365 = clamp(local342, _Rasterizer.startX, _Rasterizer.widthMask);
          if (local17 >= local9) {
            if (_Rasterizer.heightMask >= local322) {
              ArrayUtils.fillRange(
                _Rasterizer.pixels[local322],
                local365,
                local359,
                outlineColor
              );
            }
            if (_Rasterizer.startY <= local327) {
              ArrayUtils.fillRange(
                _Rasterizer.pixels[local327],
                local365,
                local359,
                outlineColor
              );
            }
          } else {
            const local415 = local29 >= local17 ? local29 : _Rasterizer.circleOutline[local17];
            const local424 = clamp(
              x + local415,
              _Rasterizer.startX,
              _Rasterizer.widthMask
            );
            const local432 = clamp(
              x - local415,
              _Rasterizer.startX,
              _Rasterizer.widthMask
            );
            if (_Rasterizer.heightMask >= local322) {
              const local440 = _Rasterizer.pixels[local322];
              ArrayUtils.fillRange(local440, local365, local432, outlineColor);
              ArrayUtils.fillRange(local440, local432, local424, fillColor);
              ArrayUtils.fillRange(local440, local424, local359, outlineColor);
            }
            if (_Rasterizer.startY <= local327) {
              const local469 = _Rasterizer.pixels[local327];
              ArrayUtils.fillRange(local469, local365, local432, outlineColor);
              ArrayUtils.fillRange(local469, local432, local424, fillColor);
              ArrayUtils.fillRange(local469, local424, local359, outlineColor);
            }
          }
        }
      }
    }
  }
  static rasterEllipseFill(x, y, sizeX, sizeY, fillColor) {
    if (sizeX === sizeY) {
      _Rasterizer.rasterCircleFill(x, y, sizeX, fillColor);
    } else if (_Rasterizer.startX <= x - sizeX && _Rasterizer.widthMask >= x + sizeX && y - sizeY >= _Rasterizer.startY && _Rasterizer.heightMask >= y + sizeY) {
      _Rasterizer.rasterEllipseFill0(x, y, sizeX, sizeY, fillColor);
    } else {
      _Rasterizer.rasterEllipseFillClamped(x, y, sizeX, sizeY, fillColor);
    }
  }
  static rasterEllipseFill0(x, y, sizeX, sizeY, fillColor) {
    ArrayUtils.fillRange(_Rasterizer.pixels[y], x - sizeX, sizeX + x, fillColor);
    let local20 = 0;
    let local22 = sizeY;
    const local26 = sizeX * sizeX;
    const local34 = sizeY * sizeY;
    const local38 = local26 << 1;
    const local42 = sizeY << 1;
    const local46 = local34 << 1;
    let local54 = local34 - local38 * (local42 - 1);
    let local63 = local46 + (1 - local42) * local26;
    const local67 = local26 << 2;
    let local75 = local46 * 3;
    let local83 = local38 * ((sizeY << 1) - 3);
    const local87 = local34 << 2;
    let local93 = local87;
    let local99 = (sizeY - 1) * local67;
    while (local22 > 0) {
      if (local63 < 0) {
        while (local63 < 0) {
          local20++;
          local63 += local75;
          local54 += local93;
          local93 += local87;
          local75 += local87;
        }
      }
      local22--;
      if (local54 < 0) {
        local54 += local93;
        local63 += local75;
        local75 += local87;
        local93 += local87;
        local20++;
      }
      const local150 = y - local22;
      local63 += -local99;
      const local159 = x + local20;
      local99 -= local67;
      const local167 = local22 + y;
      local54 += -local83;
      local83 -= local67;
      const local181 = x - local20;
      ArrayUtils.fillRange(_Rasterizer.pixels[local150], local181, local159, fillColor);
      ArrayUtils.fillRange(_Rasterizer.pixels[local167], local181, local159, fillColor);
    }
  }
  static rasterEllipseFillClamped(x, y, sizeX, sizeY, fillColor) {
    let local7 = sizeY;
    let local9 = 0;
    const local21 = sizeY * sizeY;
    const local25 = sizeX * sizeX;
    const local29 = local25 << 1;
    const local33 = local21 << 1;
    const local37 = sizeY << 1;
    let local46 = local21 - (local37 - 1) * local29;
    let local56 = (1 - local37) * local25 + local33;
    const local60 = local25 << 2;
    const local64 = local21 << 2;
    let local72 = local33 * 3;
    let local78 = local64;
    let local86 = ((sizeY << 1) - 3) * local29;
    if (y >= _Rasterizer.startY && _Rasterizer.heightMask >= y) {
      const local109 = clamp(x + sizeX, _Rasterizer.startX, _Rasterizer.widthMask);
      const local117 = clamp(x - sizeX, _Rasterizer.startX, _Rasterizer.widthMask);
      ArrayUtils.fillRange(_Rasterizer.pixels[y], local117, local109, fillColor);
    }
    let local131 = local60 * (sizeY - 1);
    while (local7 > 0) {
      if (local56 < 0) {
        while (local56 < 0) {
          local56 += local72;
          local46 += local78;
          local78 += local64;
          local72 += local64;
          local9++;
        }
      }
      local7--;
      if (local46 < 0) {
        local46 += local78;
        local78 += local64;
        local56 += local72;
        local9++;
        local72 += local64;
      }
      local56 += -local131;
      const local198 = y - local7;
      local46 += -local86;
      local131 -= local60;
      const local211 = local7 + y;
      local86 -= local60;
      if (local211 >= _Rasterizer.startY && _Rasterizer.heightMask >= local198) {
        const local229 = clamp(local9 + x, _Rasterizer.startX, _Rasterizer.widthMask);
        const local237 = clamp(x - local9, _Rasterizer.startX, _Rasterizer.widthMask);
        if (_Rasterizer.startY <= local198) {
          ArrayUtils.fillRange(
            _Rasterizer.pixels[local198],
            local237,
            local229,
            fillColor
          );
        }
        if (local211 <= _Rasterizer.heightMask) {
          ArrayUtils.fillRange(
            _Rasterizer.pixels[local211],
            local237,
            local229,
            fillColor
          );
        }
      }
    }
  }
  static rasterCircleFill(x, y, size, fillColor) {
    if (x - size >= _Rasterizer.startX && _Rasterizer.widthMask >= x + size && y - size >= _Rasterizer.startY && y + size <= _Rasterizer.heightMask) {
      _Rasterizer.rasterCircleFill0(x, y, size, fillColor);
    } else {
      _Rasterizer.rasterCircleFillClamped(x, y, size, fillColor);
    }
  }
  static rasterCircleFill0(x, y, size, fillColor) {
    ArrayUtils.fillRange(_Rasterizer.pixels[y], x - size, size + x, fillColor);
    let local20 = 0;
    let local33 = size;
    let local36 = -size;
    let local38 = -1;
    while (local33 > local20) {
      local38 += 2;
      local20++;
      local36 += local38;
      if (local36 >= 0) {
        local33--;
        local36 -= local33 << 1;
        const local69 = _Rasterizer.pixels[y - local33];
        const local76 = _Rasterizer.pixels[y + local33];
        const local80 = x - local20;
        const local84 = x + local20;
        ArrayUtils.fillRange(local76, local80, local84, fillColor);
        ArrayUtils.fillRange(local69, local80, local84, fillColor);
      }
      const local101 = x + local33;
      const local106 = x - local33;
      const local112 = _Rasterizer.pixels[y + local20];
      const local118 = _Rasterizer.pixels[y - local20];
      ArrayUtils.fillRange(local112, local106, local101, fillColor);
      ArrayUtils.fillRange(local118, local106, local101, fillColor);
    }
  }
  static rasterCircleFillClamped(x, y, size, fillColor) {
    let local3 = 0;
    let local14 = size;
    let local16 = -1;
    let local19 = -size;
    let local27 = clamp(size + x, _Rasterizer.startX, _Rasterizer.widthMask);
    let local35 = clamp(x - size, _Rasterizer.startX, _Rasterizer.widthMask);
    ArrayUtils.fillRange(_Rasterizer.pixels[y], local35, local27, fillColor);
    while (local14 > local3) {
      local16 += 2;
      local19 += local16;
      if (local19 > 0) {
        local14--;
        local19 -= local14 << 1;
        const local72 = y - local14;
        const local76 = local14 + y;
        if (local76 >= _Rasterizer.startY && local72 <= _Rasterizer.heightMask) {
          let local98 = clamp(x + local3, _Rasterizer.startX, _Rasterizer.widthMask);
          let local106 = clamp(x - local3, _Rasterizer.startX, _Rasterizer.widthMask);
          if (_Rasterizer.heightMask >= local76) {
            ArrayUtils.fillRange(
              _Rasterizer.pixels[local76],
              local106,
              local98,
              fillColor
            );
          }
          if (_Rasterizer.startY <= local72) {
            ArrayUtils.fillRange(
              _Rasterizer.pixels[local72],
              local106,
              local98,
              fillColor
            );
          }
        }
      }
      local3++;
      const local138 = y - local3;
      const local142 = y + local3;
      if (_Rasterizer.startY <= local142 && local138 <= _Rasterizer.heightMask) {
        const local166 = clamp(x + local14, _Rasterizer.startX, _Rasterizer.widthMask);
        const local174 = clamp(x - local14, _Rasterizer.startX, _Rasterizer.widthMask);
        if (local142 <= _Rasterizer.heightMask) {
          ArrayUtils.fillRange(
            _Rasterizer.pixels[local142],
            local174,
            local166,
            fillColor
          );
        }
        if (_Rasterizer.startY <= local138) {
          ArrayUtils.fillRange(
            _Rasterizer.pixels[local138],
            local174,
            local166,
            fillColor
          );
        }
      }
    }
  }
};
var RasterizerOperationShape = class {
  constructor(fillColor, outlineColor, outlineWidth) {
    this.fillColor = fillColor;
    this.outlineColor = outlineColor;
    this.outlineWidth = outlineWidth;
  }
};
var RasterizerOperationLine = class _RasterizerOperationLine extends RasterizerOperationShape {
  constructor(x0, y0, x1, y1, color, outlineWidth) {
    super(-1, color, outlineWidth);
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
  }
  static create(buffer) {
    const x0 = buffer.readShort();
    const y0 = buffer.readShort();
    const x1 = buffer.readShort();
    const y1 = buffer.readShort();
    const color = buffer.readMedium();
    const outlineWidth = buffer.readUnsignedByte();
    return new _RasterizerOperationLine(x0, y0, x1, y1, color, outlineWidth);
  }
  render(width, height) {
  }
  renderFill(width, height) {
  }
  renderOutline(width, height) {
    const x0 = this.x0 * width >> 12;
    const x1 = this.x1 * width >> 12;
    const y0 = this.y0 * height >> 12;
    const y1 = this.y1 * height >> 12;
    Rasterizer.rasterLine(x0, x1, y0, y1, this.outlineColor);
  }
};
var RasterizerOperationBezierCurve = class _RasterizerOperationBezierCurve extends RasterizerOperationShape {
  constructor(x0, y0, x1, y1, x2, y2, x3, y3, color, outlineWidth) {
    super(-1, color, outlineWidth);
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.x3 = x3;
    this.y3 = y3;
  }
  static create(buffer) {
    const x0 = buffer.readShort();
    const y0 = buffer.readShort();
    const x1 = buffer.readShort();
    const y1 = buffer.readShort();
    const x2 = buffer.readShort();
    const y2 = buffer.readShort();
    const x3 = buffer.readShort();
    const y3 = buffer.readShort();
    const color = buffer.readMedium();
    const outlineWidth = buffer.readUnsignedByte();
    return new _RasterizerOperationBezierCurve(
      x0,
      y0,
      x1,
      y1,
      x2,
      y2,
      x3,
      y3,
      color,
      outlineWidth
    );
  }
  render(width, height) {
  }
  renderFill(width, height) {
  }
  renderOutline(width, height) {
    const x0 = width * this.x0 >> 12;
    const y0 = height * this.y0 >> 12;
    const x1 = width * this.x1 >> 12;
    const y1 = height * this.y1 >> 12;
    const x2 = width * this.x2 >> 12;
    const y2 = height * this.y2 >> 12;
    const x3 = width * this.x3 >> 12;
    const y3 = height * this.y3 >> 12;
    Rasterizer.rasterBezierCurve(x0, y0, x1, y1, x2, y2, x3, y3, this.outlineColor);
  }
};
var RasterizerOperationRectangle = class _RasterizerOperationRectangle extends RasterizerOperationShape {
  constructor(x0, y0, x1, y1, fillColor, outlineColor, outlineWidth) {
    super(fillColor, outlineColor, outlineWidth);
    this.x0 = x0;
    this.y0 = y0;
    this.x1 = x1;
    this.y1 = y1;
  }
  static create(buffer) {
    const x0 = buffer.readShort();
    const y0 = buffer.readShort();
    const x1 = buffer.readShort();
    const y1 = buffer.readShort();
    const fillColor = buffer.readMedium();
    const outlineColor = buffer.readMedium();
    const outlineWidth = buffer.readUnsignedByte();
    return new _RasterizerOperationRectangle(
      x0,
      y0,
      x1,
      y1,
      fillColor,
      outlineColor,
      outlineWidth
    );
  }
  render(width, height) {
    const x0 = this.x0 * width >> 12;
    const x1 = this.x1 * width >> 12;
    const y0 = this.y0 * height >> 12;
    const y1 = this.y1 * height >> 12;
    Rasterizer.rasterRectangle(
      x0,
      x1,
      y0,
      y1,
      this.fillColor,
      this.outlineColor,
      this.outlineWidth
    );
  }
  renderFill(width, height) {
    const x0 = this.x0 * width >> 12;
    const x1 = this.x1 * width >> 12;
    const y0 = this.y0 * height >> 12;
    const y1 = this.y1 * height >> 12;
    Rasterizer.rasterRectangleFill(x0, x1, y0, y1, this.fillColor);
  }
  renderOutline(width, height) {
    const x0 = this.x0 * width >> 12;
    const x1 = this.x1 * width >> 12;
    const y0 = this.y0 * height >> 12;
    const y1 = this.y1 * height >> 12;
    Rasterizer.rasterRectangleOutline(x0, x1, y0, y1, this.outlineColor, this.outlineWidth);
  }
};
var RasterizerOperationEllipse = class _RasterizerOperationEllipse extends RasterizerOperationShape {
  constructor(x, y, sizeX, sizeY, fillColor, outlineColor, outlineWidth) {
    super(fillColor, outlineColor, outlineWidth);
    this.x = x;
    this.y = y;
    this.sizeX = sizeX;
    this.sizeY = sizeY;
  }
  static create(buffer) {
    const x = buffer.readShort();
    const y = buffer.readShort();
    const sizeX = buffer.readShort();
    const sizeY = buffer.readShort();
    const fillColor = buffer.readMedium();
    const outlineColor = buffer.readMedium();
    const outlineWidth = buffer.readUnsignedByte();
    return new _RasterizerOperationEllipse(
      x,
      y,
      sizeX,
      sizeY,
      fillColor,
      outlineColor,
      outlineWidth
    );
  }
  render(width, height) {
    const x = this.x * width >> 12;
    const y = this.y * height >> 12;
    const sizeX = this.sizeX * width >> 12;
    const sizeY = this.sizeY * height >> 12;
    Rasterizer.rasterEllipse(
      x,
      y,
      sizeX,
      sizeY,
      this.fillColor,
      this.outlineColor,
      this.outlineWidth
    );
  }
  renderFill(width, height) {
    const x = this.x * width >> 12;
    const y = this.y * height >> 12;
    const sizeX = this.sizeX * width >> 12;
    const sizeY = this.sizeY * height >> 12;
    Rasterizer.rasterEllipseFill(x, y, sizeX, sizeY, this.fillColor);
  }
  renderOutline(width, height) {
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/SpriteSourceOperation.ts
var SpriteSourceOperation = class extends TextureOperation {
  constructor() {
    super(0, false);
    this.spriteId = -1;
    this.width = 0;
    this.height = 0;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.spriteId = buffer.readUnsignedShort();
    }
  }
  getSpriteId() {
    return this.spriteId;
  }
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty && this.loadSprite(textureGenerator) && this.pixels) {
      const outputR = output[0];
      const outputG = output[1];
      const outputB = output[2];
      let offset = this.width * (textureGenerator.height === this.height ? line : line * this.height / textureGenerator.height | 0);
      if (textureGenerator.width === this.width) {
        for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
          const value = this.pixels[offset++];
          outputB[pixel] = value << 4 & 4080;
          outputG[pixel] = value >> 4 & 4080;
          outputR[pixel] = (value & 16711680) >> 12;
        }
      } else {
        for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
          const i_9_ = this.width * pixel / textureGenerator.width | 0;
          const value = this.pixels[offset + i_9_];
          outputB[pixel] = value << 4 & 4080;
          outputG[pixel] = (value & 65280) >> 4;
          outputR[pixel] = value >> 12 & 4080;
        }
      }
    }
    return output;
  }
  loadSprite(textureGenerator) {
    if (this.pixels) {
      return true;
    }
    if (this.spriteId >= 0) {
      const sprite = textureGenerator.loadSprite(this.spriteId);
      sprite.normalize();
      this.pixels = sprite.getPixelsRgb();
      this.width = sprite.width;
      this.height = sprite.height;
      return true;
    }
    return false;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/SquareWaveformOperation.ts
var SquareWaveformOperation = class extends TextureOperation {
  constructor() {
    super(0, true);
    this.field0 = 10;
    this.field1 = 2048;
    this.field2 = 0;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.field0 = buffer.readUnsignedByte();
    } else if (field === 1) {
      this.field1 = buffer.readUnsignedShort();
    } else if (field === 2) {
      this.field2 = buffer.readUnsignedByte();
    }
  }
  init() {
    this.table0 = new Int32Array(this.field0 + 1);
    this.table1 = new Int32Array(this.field0 + 1);
    let i = 0;
    let j = 4096 / this.field0 | 0;
    let k = j * this.field1 >> 12;
    for (let l = 0; l < this.field0; l++) {
      this.table1[l] = i;
      this.table0[l] = i + k;
      i += j;
    }
    this.table1[this.field0] = 4096;
    this.table0[this.field0] = this.table0[0] + 4096;
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const verticalGradient = textureGenerator.verticalGradient[line];
      if (this.field2 === 0) {
        let value = 0;
        for (let i = 0; i < this.field0; i++) {
          if (verticalGradient >= this.table1[i] && verticalGradient < this.table1[i + 1]) {
            if (verticalGradient < this.table0[i]) {
              value = 4096;
            }
            break;
          }
        }
        output.fill(value, 0, textureGenerator.width);
      } else {
        for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
          let index = 0;
          let value = 0;
          const horizontalGradient = textureGenerator.horizontalGradient[pixel];
          switch (this.field2) {
            case 3:
              index = (horizontalGradient - verticalGradient >> 1) + 2048;
              break;
            case 2:
              index = (horizontalGradient - (4096 - verticalGradient) >> 1) + 2048;
              break;
            case 1:
              index = horizontalGradient;
              break;
          }
          for (let i = 0; i < this.field0; i++) {
            if (index >= this.table1[i] && index < this.table1[i + 1]) {
              if (index < this.table0[i]) {
                value = 4096;
              }
              break;
            }
          }
          output[pixel] = value;
        }
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/TextureSourceOperation.ts
var TextureSourceOperation = class extends TextureOperation {
  constructor() {
    super(0, false);
    this.textureId = -1;
    this.width = 0;
    this.height = 0;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.textureId = buffer.readUnsignedShort();
    }
  }
  initCaches(textureGenerator, width, height) {
    super.initCaches(textureGenerator, width, height);
    if (this.textureId >= 0) {
      const width2 = textureGenerator.textureLoader.isSmall(this.textureId) ? 64 : 128;
      this.pixels = textureGenerator.textureLoader.getPixelsRgb(
        this.textureId,
        width2,
        false,
        1
      );
      this.width = width2;
      this.height = width2;
    }
  }
  clearCaches() {
    super.clearCaches();
    this.pixels = void 0;
  }
  getTextureId() {
    return this.textureId;
  }
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache is not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty) {
      let start = (textureGenerator.height === this.height ? line : this.height * line / textureGenerator.height | 0) * this.width;
      const outputR = output[0];
      const outputG = output[1];
      const outputB = output[2];
      if (textureGenerator.width === this.width) {
        for (let x = 0; x < textureGenerator.width; x++) {
          const value = this.pixels[start++];
          outputB[x] = (value & 255) << 4;
          outputG[x] = (value & 65280) >> 4;
          outputR[x] = (value & 16711680) >> 12;
        }
      } else {
        for (let x = 0; x < textureGenerator.width; x++) {
          const idx = this.width * x / textureGenerator.width | 0;
          const value = this.pixels[idx + start];
          outputB[x] = (value & 255) << 4;
          outputG[x] = (value & 65280) >> 4;
          outputR[x] = (value & 16711680) >> 12;
        }
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/TilingOperation.ts
var TilingOperation = class extends TextureOperation {
  constructor() {
    super(1, false);
    this.tileCountH = 4;
    this.tileCountV = 4;
  }
  decode(field, buffer) {
    switch (field) {
      case 0:
        this.tileCountH = buffer.readUnsignedByte();
        break;
      case 1:
        this.tileCountV = buffer.readUnsignedByte();
        break;
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const tileW = textureGenerator.width / this.tileCountH | 0;
      const tileH = textureGenerator.height / this.tileCountV | 0;
      let input;
      if (tileH <= 0) {
        input = this.getMonochromeInput(textureGenerator, 0, 0);
      } else {
        const tY = line % tileH;
        input = this.getMonochromeInput(
          textureGenerator,
          0,
          textureGenerator.height * tY / tileH | 0
        );
      }
      for (let x = 0; x < textureGenerator.width; x++) {
        if (tileW <= 0) {
          output[x] = input[0];
        } else {
          const tX = x % tileW;
          output[x] = input[tX * textureGenerator.width / tileW | 0];
        }
      }
    }
    return output;
  }
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache is not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty) {
      const tileW = textureGenerator.width / this.tileCountH | 0;
      const tileH = textureGenerator.height / this.tileCountV | 0;
      let input;
      if (tileH <= 0) {
        input = this.getColourInput(textureGenerator, 0, 0);
      } else {
        const tY = line % tileH;
        input = this.getColourInput(
          textureGenerator,
          0,
          textureGenerator.height * tY / tileH | 0
        );
      }
      const inputR = input[0];
      const inputG = input[1];
      const inputB = input[2];
      const outputR = output[0];
      const outputG = output[1];
      const outputB = output[2];
      for (let x = 0; x < textureGenerator.width; x++) {
        let inputX = 0;
        if (tileW > 0) {
          const tX = x % tileW;
          inputX = tX * textureGenerator.width / tileW | 0;
        }
        outputR[x] = inputR[inputX];
        outputG[x] = inputG[inputX];
        outputB[x] = inputB[inputX];
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/TilingSpriteOperation.ts
var TilingSpriteOperation = class extends SpriteSourceOperation {
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache is not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty && super.loadSprite(textureGenerator) && this.pixels) {
      const outputR = output[0];
      const outputG = output[1];
      const outputB = output[2];
      const startY = this.height * (line % this.height);
      for (let x = 0; x < textureGenerator.width; x++) {
        const rgb = this.pixels[startY + x % this.width];
        outputR[x] = rgb >> 12 & 4080;
        outputG[x] = rgb >> 4 & 4080;
        outputB[x] = (rgb & 255) << 4;
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/TrigWarpOperation.ts
var TrigWarpOperation = class extends TextureOperation {
  constructor() {
    super(3, false);
    this.hypotenuseMultiplier = 32768;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.hypotenuseMultiplier = buffer.readUnsignedShort() << 4;
    } else if (field === 1) {
      this.isMonochrome = buffer.readUnsignedByte() === 1;
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const inputA = this.getMonochromeInput(textureGenerator, 1, line);
      const inputB = this.getMonochromeInput(textureGenerator, 2, line);
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        const angle = inputA[pixel] >> 4 & 255;
        const hyp = inputB[pixel] * this.hypotenuseMultiplier >> 12;
        const cosine = TextureGenerator.COSINE[angle] * hyp >> 12;
        const sine = TextureGenerator.SINE[angle] * hyp >> 12;
        const nX = pixel + (cosine >> 12) & textureGenerator.widthMask;
        const nY = line + (sine >> 12) & textureGenerator.heightMask;
        const input = this.getMonochromeInput(textureGenerator, 0, nY);
        output[pixel] = input[nX];
      }
    }
    return output;
  }
  getColourOutput(textureGenerator, line) {
    if (!this.colourImageCache) {
      throw new Error("Colour image cache is not initialized");
    }
    const output = this.colourImageCache.get(line);
    if (this.colourImageCache.dirty) {
      const inputA = this.getMonochromeInput(textureGenerator, 1, line);
      const inputB = this.getMonochromeInput(textureGenerator, 2, line);
      const outputR = output[0];
      const outputG = output[1];
      const outputB = output[2];
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        const angle = inputA[pixel] * 255 >> 12 & 255;
        const hyp = inputB[pixel] * this.hypotenuseMultiplier >> 12;
        const cosine = TextureGenerator.COSINE[angle] * hyp >> 12;
        const sine = TextureGenerator.SINE[angle] * hyp >> 12;
        const nX = pixel + (cosine >> 12) & textureGenerator.widthMask;
        const nY = line + (sine >> 12) & textureGenerator.heightMask;
        const input = this.getColourInput(textureGenerator, 0, nY);
        outputR[pixel] = input[0][nX];
        outputG[pixel] = input[1][nX];
        outputB[pixel] = input[2][nX];
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/VerticalGradientOperation.ts
var VerticalGradientOperation = class extends TextureOperation {
  constructor() {
    super(0, true);
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      output.fill(textureGenerator.verticalGradient[line], 0, textureGenerator.width);
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/VoronoiNoiseOperation.ts
var import_java_random5 = __toESM(require("java-random"));
var VoronoiNoiseOperation = class _VoronoiNoiseOperation extends TextureOperation {
  constructor() {
    super(0, true);
    this.rngSeed = 0;
    this.field2 = 2048;
    this.field3 = 2;
    this.field4 = 1;
    this.field5 = 5;
    this.field6 = 5;
    this.permutations = new Int8Array(512);
    this.randomNs = new Int16Array(512);
  }
  static {
    this.temp0 = 0;
  }
  static {
    this.temp1 = 0;
  }
  static {
    this.temp2 = 0;
  }
  static {
    this.temp3 = 0;
  }
  decode(field, buffer) {
    switch (field) {
      case 0:
        this.field5 = this.field6 = buffer.readUnsignedByte();
        break;
      case 1:
        this.rngSeed = buffer.readUnsignedByte();
        break;
      case 2:
        this.field2 = buffer.readUnsignedShort();
        break;
      case 3:
        this.field3 = buffer.readUnsignedByte();
        break;
      case 4:
        this.field4 = buffer.readUnsignedByte();
        break;
      case 5:
        this.field5 = buffer.readUnsignedByte();
        break;
      case 6:
        this.field6 = buffer.readUnsignedByte();
        break;
    }
  }
  init() {
    this.permutations = TextureGenerator.initPermutations(this.rngSeed);
    this.initRandomNumbers();
  }
  initRandomNumbers() {
    const random = new import_java_random5.default(this.rngSeed);
    this.randomNs = new Int16Array(512);
    if (this.field2 > 0) {
      for (let i = 0; i < 512; i++) {
        this.randomNs[i] = nextIntJagex(random, this.field2);
      }
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const i_1_ = 2048 + this.field6 * textureGenerator.verticalGradient[line];
      const i_2_ = i_1_ >> 12;
      const i_3_ = i_2_ + 1;
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        _VoronoiNoiseOperation.temp0 = 2147483647;
        _VoronoiNoiseOperation.temp1 = 2147483647;
        _VoronoiNoiseOperation.temp2 = 2147483647;
        _VoronoiNoiseOperation.temp3 = 2147483647;
        const i_5_ = this.field5 * textureGenerator.horizontalGradient[pixel] + 2048;
        const i_6_ = i_5_ >> 12;
        const i_7_ = i_6_ + 1;
        for (let i_8_ = i_2_ - 1; i_8_ <= i_3_; i_8_++) {
          const i_9_ = this.permutations[(i_8_ >= this.field6 ? i_8_ - this.field6 : i_8_) & 255] & 255;
          for (let i_10_ = i_6_ - 1; i_10_ <= i_7_; i_10_++) {
            let i_11_ = (this.permutations[(i_10_ >= this.field5 ? i_10_ - this.field5 : i_10_) + i_9_ & 255] & 255) * 2;
            let i_12_ = i_5_ - (this.randomNs[i_11_++] + (i_10_ << 12));
            let i_13_ = i_1_ - (this.randomNs[i_11_] + (i_8_ << 12));
            let i_14_;
            switch (this.field4) {
              case 1:
                i_14_ = i_12_ * i_12_ + i_13_ * i_13_ >> 12;
                break;
              case 2:
                i_14_ = (i_13_ < 0 ? -i_13_ : i_13_) + (i_12_ < 0 ? -i_12_ : i_12_);
                break;
              case 3:
                i_12_ = i_12_ < 0 ? -i_12_ : i_12_;
                i_13_ = i_13_ < 0 ? -i_13_ : i_13_;
                i_14_ = Math.max(i_12_, i_13_);
                break;
              case 4:
                i_12_ = Math.sqrt(Math.fround(i_12_ < 0 ? -i_12_ : i_12_) / 4096) * 4096 | 0;
                i_13_ = Math.sqrt(Math.fround(i_13_ < 0 ? -i_13_ : i_13_) / 4096) * 4096 | 0;
                i_14_ = i_13_ + i_12_;
                i_14_ = i_14_ * i_14_ >> 12;
                break;
              case 5:
                i_12_ *= i_12_;
                i_13_ *= i_13_;
                i_14_ = Math.sqrt(
                  Math.sqrt(Math.fround((i_12_ + i_13_) / 16777216))
                ) * 4096 | 0;
                break;
              default:
                i_14_ = Math.sqrt(
                  Math.fround((i_13_ * i_13_ + i_12_ * i_12_) / 16777216)
                ) * 4096 | 0;
                break;
            }
            if (i_14_ < _VoronoiNoiseOperation.temp3) {
              _VoronoiNoiseOperation.temp0 = _VoronoiNoiseOperation.temp1;
              _VoronoiNoiseOperation.temp1 = _VoronoiNoiseOperation.temp2;
              _VoronoiNoiseOperation.temp2 = _VoronoiNoiseOperation.temp3;
              _VoronoiNoiseOperation.temp3 = i_14_;
            } else if (i_14_ < _VoronoiNoiseOperation.temp2) {
              _VoronoiNoiseOperation.temp0 = _VoronoiNoiseOperation.temp1;
              _VoronoiNoiseOperation.temp1 = _VoronoiNoiseOperation.temp2;
              _VoronoiNoiseOperation.temp2 = i_14_;
            } else if (i_14_ < _VoronoiNoiseOperation.temp1) {
              _VoronoiNoiseOperation.temp0 = _VoronoiNoiseOperation.temp1;
              _VoronoiNoiseOperation.temp1 = i_14_;
            } else if (i_14_ < _VoronoiNoiseOperation.temp0) {
              _VoronoiNoiseOperation.temp0 = i_14_;
            }
          }
        }
        switch (this.field3) {
          case 0:
            output[pixel] = _VoronoiNoiseOperation.temp3;
            break;
          case 1:
            output[pixel] = _VoronoiNoiseOperation.temp2;
            break;
          case 2:
            output[pixel] = _VoronoiNoiseOperation.temp2 - _VoronoiNoiseOperation.temp3;
            break;
          case 3:
            output[pixel] = _VoronoiNoiseOperation.temp1;
            break;
          case 4:
            output[pixel] = _VoronoiNoiseOperation.temp0;
            break;
        }
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/WeaveOperation.ts
var WeaveOperation = class extends TextureOperation {
  constructor() {
    super(0, true);
    this.thickness = 585;
  }
  decode(field, buffer) {
    if (field === 0) {
      this.thickness = buffer.readUnsignedShort();
    }
  }
  getMonochromeOutput(textureGenerator, line) {
    if (!this.monochromeImageCache) {
      throw new Error("Monochrome image cache is not initialized");
    }
    const output = this.monochromeImageCache.get(line);
    if (this.monochromeImageCache.dirty) {
      const gradV = textureGenerator.verticalGradient[line];
      for (let pixel = 0; pixel < textureGenerator.width; pixel++) {
        const gradH = textureGenerator.horizontalGradient[pixel];
        if (gradH > this.thickness && 4096 - this.thickness > gradH && gradV > 2048 - this.thickness && gradV < this.thickness + 2048) {
          let v = 2048 - gradH;
          v = v < 0 ? -v : v;
          v <<= 12;
          v /= 2048 - this.thickness;
          output[pixel] = 4096 - v;
        } else if (2048 - this.thickness < gradH && 2048 + this.thickness > gradH) {
          let v = gradV - 2048;
          v = v < 0 ? -v : v;
          v -= this.thickness;
          v <<= 12;
          output[pixel] = v / (2048 - this.thickness);
        } else if (this.thickness > gradV || gradV > 4096 - this.thickness) {
          let v = gradH - 2048;
          v = v < 0 ? -v : v;
          v -= this.thickness;
          v <<= 12;
          output[pixel] = v / (2048 - this.thickness);
        } else if (gradH < this.thickness || 4096 - this.thickness < gradH) {
          let v = 2048 - gradV;
          v = v < 0 ? -v : v;
          v <<= 12;
          v /= 2048 - this.thickness;
          output[pixel] = 4096 - v;
        } else {
          output[pixel] = 0;
        }
      }
    }
    return output;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/operation/TextureOperationFactory.ts
var TextureOperationFactory = class _TextureOperationFactory {
  static instantiate(id) {
    switch (id) {
      case 0:
        return new ConstantMonochromeOperation();
      case 1:
        return new ConstantColourOperation();
      case 2:
        return new HorizontalGradientOperation();
      case 3:
        return new VerticalGradientOperation();
      case 4:
        return new BricksOperation();
      case 5:
        return new BlurOperation();
      case 6:
        return new ClampOperation();
      case 7:
        return new ArithmeticOperation();
      case 8:
        return new CurveOperation();
      case 9:
        return new MirrorOperation();
      case 10:
        return new GradientOperation();
      case 11:
        return new ColourStripOperation();
      case 12:
        return new DiagonalGradientOperation();
      case 13:
        return new PseudoRandomNoiseOperation();
      case 14:
        return new WeaveOperation();
      case 15:
        return new VoronoiNoiseOperation();
      case 16:
        return new HerringboneOperation();
      case 17:
        return new HslOperation();
      case 18:
        return new TilingSpriteOperation();
      case 19:
        return new TrigWarpOperation();
      case 20:
        return new TilingOperation();
      case 21:
        return new MixerOperation();
      case 22:
        return new InvertOperation();
      case 23:
        return new KaleidoscopeOperation();
      case 24:
        return new GrayScaleOperation();
      case 25:
        return new BrightnessOperation();
      case 26:
        return new BinaryOperation();
      case 27:
        return new SquareWaveformOperation();
      case 28:
        return new IrregularBricksOperation();
      case 29:
        return new RasterizerOperation();
      case 30:
        return new RangeOperation();
      case 31:
        return new MandelbrotOperation();
      case 32:
        return new EmbossOperation();
      case 33:
        return new ColorEdgeDetectorOperation();
      case 34:
        return new PerlinNoiseOperation();
      case 35:
        return new MonochromeEdgeDetectorOperation();
      case 36:
        return new TextureSourceOperation();
      case 37:
        return new Operation37();
      case 38:
        return new LineNoiseOperation();
      case 39:
        return new SpriteSourceOperation();
      default:
        throw new Error("Unknown texture operation: " + id);
    }
  }
  static create(buffer) {
    const id = buffer.readUnsignedByte();
    const type = buffer.readUnsignedByte();
    const operation = _TextureOperationFactory.instantiate(type);
    operation.id = id;
    operation.cacheSize = buffer.readUnsignedByte();
    const fieldCount = buffer.readUnsignedByte();
    for (let i = 0; i < fieldCount; i++) {
      const field = buffer.readUnsignedByte();
      operation.decode(field, buffer);
    }
    operation.init();
    return operation;
  }
};

// ../rs-party-dashboard/src/rs/texture/procedural/ProceduralTexture.ts
var ProceduralTexture = class {
  constructor(buffer, hasModOperation) {
    const operationCount = buffer.readUnsignedByte();
    let spriteDepCount = 0;
    let textureDepCount = 0;
    const inputConnections = new Array(operationCount);
    this.operations = new Array(operationCount);
    for (let op = 0; op < operationCount; op++) {
      const operation = TextureOperationFactory.create(buffer);
      if (operation.getSpriteId() >= 0) {
        spriteDepCount++;
      }
      if (operation.getTextureId() >= 0) {
        textureDepCount++;
      }
      const inputCount = operation.inputs.length;
      inputConnections[op] = new Array(inputCount);
      for (let i = 0; i < inputCount; i++) {
        inputConnections[op][i] = buffer.readUnsignedByte();
      }
      this.operations[op] = operation;
    }
    this.spriteDependencies = new Array(spriteDepCount);
    this.textureDependencies = new Array(textureDepCount);
    let spriteDepIndex = 0;
    let textureDepIndex = 0;
    for (let op = 0; op < operationCount; op++) {
      const operation = this.operations[op];
      const inputCount = operation.inputs.length;
      for (let i = 0; i < inputCount; i++) {
        operation.inputs[i] = this.operations[inputConnections[op][i]];
      }
      const spriteId = operation.getSpriteId();
      const textureId = operation.getTextureId();
      if (spriteId >= 0) {
        this.spriteDependencies[spriteDepIndex++] = spriteId;
      }
      if (textureId >= 0) {
        this.textureDependencies[textureDepIndex++] = textureId;
      }
      delete inputConnections[op];
    }
    this.colourOperation = this.operations[buffer.readUnsignedByte()];
    this.alphaOperation = this.operations[buffer.readUnsignedByte()];
    if (hasModOperation) {
      this.monochromeOperation = this.operations[buffer.readUnsignedByte()];
    }
  }
  getPixelsRgb(textureGenerator, width, height, flipH, flipV, brightness) {
    if (textureGenerator.debug) {
      console.log("getPixelsRgb", this);
    }
    for (const operation of this.operations) {
      operation.initCaches(textureGenerator, width, height);
    }
    textureGenerator.initBrightness(brightness);
    textureGenerator.init(width, height);
    const pixels = new Int32Array(width * height);
    let srcInc;
    let srcEnd;
    let srcStart;
    if (flipH) {
      srcInc = -1;
      srcEnd = -1;
      srcStart = width - 1;
    } else {
      srcStart = 0;
      srcEnd = width;
      srcInc = 1;
    }
    let dstIdx = 0;
    for (let line = 0; line < height; line++) {
      if (flipV) {
        dstIdx = line;
      }
      let pixelsR;
      let pixelsG;
      let pixelsB;
      if (this.colourOperation.isMonochrome) {
        const output = this.colourOperation.getMonochromeOutput(textureGenerator, line);
        pixelsR = output;
        pixelsG = output;
        pixelsB = output;
      } else {
        const output = this.colourOperation.getColourOutput(textureGenerator, line);
        pixelsR = output[0];
        pixelsG = output[1];
        pixelsB = output[2];
      }
      for (let srcIdx = srcStart; srcIdx !== srcEnd; srcIdx += srcInc) {
        let r = pixelsR[srcIdx] >> 4;
        if (r > 255) {
          r = 255;
        }
        if (r < 0) {
          r = 0;
        }
        let g = pixelsG[srcIdx] >> 4;
        if (g > 255) {
          g = 255;
        }
        if (g < 0) {
          g = 0;
        }
        let b = pixelsB[srcIdx] >> 4;
        if (b > 255) {
          b = 255;
        }
        if (b < 0) {
          b = 0;
        }
        r = textureGenerator.brightnessTable[r];
        g = textureGenerator.brightnessTable[g];
        b = textureGenerator.brightnessTable[b];
        let rgb = r << 16 | g << 8 | b;
        if (rgb !== 0) {
          rgb |= 4278190080;
        } else {
          textureGenerator.isTransparent = true;
        }
        pixels[dstIdx++] = rgb;
        if (flipV) {
          dstIdx += width - 1;
        }
      }
    }
    for (const operation of this.operations) {
      operation.clearCaches();
    }
    return pixels;
  }
  getPixelsArgb(textureGenerator, width, height, flipH, flipV, brightness) {
    for (const operation of this.operations) {
      operation.initCaches(textureGenerator, width, height);
    }
    textureGenerator.initBrightness(brightness);
    textureGenerator.init(width, height);
    const pixels = new Int32Array(width * height);
    let srcInc;
    let srcEnd;
    let srcStart;
    if (flipH) {
      srcInc = -1;
      srcEnd = -1;
      srcStart = width - 1;
    } else {
      srcStart = 0;
      srcEnd = width;
      srcInc = 1;
    }
    let dstIdx = 0;
    for (let line = 0; line < height; line++) {
      if (flipV) {
        dstIdx = line;
      }
      let pixelsR;
      let pixelsG;
      let pixelsB;
      let pixelsA;
      if (this.colourOperation.isMonochrome) {
        const output = this.colourOperation.getMonochromeOutput(textureGenerator, line);
        pixelsR = output;
        pixelsG = output;
        pixelsB = output;
      } else {
        const output = this.colourOperation.getColourOutput(textureGenerator, line);
        pixelsR = output[0];
        pixelsG = output[1];
        pixelsB = output[2];
      }
      if (this.alphaOperation) {
        if (this.alphaOperation.isMonochrome) {
          pixelsA = this.alphaOperation.getMonochromeOutput(textureGenerator, line);
        } else {
          pixelsA = this.alphaOperation.getColourOutput(textureGenerator, line)[0];
        }
      }
      for (let srcIdx = srcStart; srcIdx !== srcEnd; srcIdx += srcInc) {
        let r = pixelsR[srcIdx] >> 4;
        if (r > 255) {
          r = 255;
        }
        if (r < 0) {
          r = 0;
        }
        let g = pixelsG[srcIdx] >> 4;
        if (g > 255) {
          g = 255;
        }
        if (g < 0) {
          g = 0;
        }
        let b = pixelsB[srcIdx] >> 4;
        if (b > 255) {
          b = 255;
        }
        if (b < 0) {
          b = 0;
        }
        r = textureGenerator.brightnessTable[r];
        g = textureGenerator.brightnessTable[g];
        b = textureGenerator.brightnessTable[b];
        let a = 0;
        if (r !== 0 || g !== 0 || b !== 0) {
          if (pixelsA) {
            a = clamp(pixelsA[srcIdx] >> 4, 0, 255);
          } else {
            a = 255;
          }
        }
        if (a !== 255) {
          textureGenerator.isTransparent = true;
        }
        const argb = a << 24 | r << 16 | g << 8 | b;
        pixels[dstIdx++] = argb;
        if (flipV) {
          dstIdx += width - 1;
        }
      }
    }
    if (textureGenerator.debug) {
      console.log("getPixelsArgb", this);
    }
    for (const operation of this.operations) {
      operation.clearCaches();
    }
    return pixels;
  }
};

// ../rs-party-dashboard/src/rs/texture/OldProceduralTextureLoader.ts
var OldProceduralTextureLoader = class _OldProceduralTextureLoader {
  constructor(spriteIndex, textureIds, definitions) {
    this.spriteIndex = spriteIndex;
    this.textureIds = textureIds;
    this.definitions = definitions;
    this.idIndexMap = /* @__PURE__ */ new Map();
    this.transparentTextureMap = /* @__PURE__ */ new Map();
    this.textureGenerator = new TextureGenerator(spriteIndex, this);
    for (let i = 0; i < textureIds.length; i++) {
      this.idIndexMap.set(textureIds[i], i);
    }
  }
  static load(textureIndex, spriteIndex) {
    const definitions = /* @__PURE__ */ new Map();
    const texturesArchive = textureIndex.getArchive(0);
    const textureIds = Array.from(texturesArchive.fileIds);
    for (let i = 0; i < textureIds.length; i++) {
      const id = textureIds[i];
      const file = texturesArchive.getFile(id);
      if (file) {
        const buffer = file.getDataAsBuffer();
        const def = new ProceduralTextureDefinition(id, buffer);
        definitions.set(id, def);
      }
    }
    return new _OldProceduralTextureLoader(spriteIndex, textureIds, definitions);
  }
  getTextureIds() {
    return this.textureIds;
  }
  getTextureIndex(id) {
    return this.idIndexMap.get(id) ?? -1;
  }
  isSmall(id) {
    return this.definitions.get(id)?.size === 64;
  }
  isSd(id) {
    return this.definitions.get(id)?.valid ?? false;
  }
  isTransparent(id) {
    if (!this.transparentTextureMap.has(id)) {
      if (!this.definitions.has(id)) {
        return false;
      }
      this.getPixelsRgb(id, 128, false, 1);
    }
    return this.transparentTextureMap.get(id) ?? false;
  }
  getAverageHsl(id) {
    return this.definitions.get(id)?.averageHsl ?? 0;
  }
  getAnimationUv(id) {
    const def = this.definitions.get(id);
    if (!def) {
      return [0, 0];
    }
    let u = 0;
    let v = 0;
    if (def.animDirU !== 0) {
      u = def.animDirU === 1 ? 1 : -1;
    }
    if (def.animDirV !== 0) {
      v = def.animDirV === 1 ? 1 : -1;
    }
    const speed = def.animSpeed;
    return [u * speed, v * speed];
  }
  getMaterial(id) {
    const def = this.definitions.get(id);
    if (!def) {
      return {
        animU: 0,
        animV: 0,
        alphaCutOff: 0
      };
    }
    let u = 0;
    let v = 0;
    if (def.animDirU !== 0) {
      u = def.animDirU === 1 ? 1 : -1;
    }
    if (def.animDirV !== 0) {
      v = def.animDirV === 1 ? 1 : -1;
    }
    const speed = def.animSpeed;
    let alphaCutOff = 0.5;
    if (u !== 0 || v !== 0) {
      alphaCutOff = 0.1;
    }
    return {
      animU: u * speed,
      animV: v * speed,
      alphaCutOff
    };
  }
  getPixelsRgb(id, size, flipH, brightness) {
    const def = this.definitions.get(id);
    if (!def) {
      throw new Error("Texture definition not found: " + id);
    }
    this.textureGenerator.debug = id === 10;
    const pixels = def.proceduralTexture.getPixelsRgb(
      this.textureGenerator,
      size,
      size,
      flipH,
      false,
      brightness
    );
    this.transparentTextureMap.set(id, this.textureGenerator.isTransparent);
    return pixels;
  }
  getPixelsArgb(id, size, flipH, brightness) {
    const def = this.definitions.get(id);
    if (!def) {
      throw new Error("Texture definition not found: " + id);
    }
    this.textureGenerator.debug = id === 10;
    const pixels = def.proceduralTexture.getPixelsArgb(
      this.textureGenerator,
      size,
      size,
      flipH,
      false,
      brightness
    );
    this.transparentTextureMap.set(id, this.textureGenerator.isTransparent);
    return pixels;
  }
};
var ProceduralTextureDefinition = class {
  constructor(id, buffer) {
    this.id = id;
    this.proceduralTexture = new ProceduralTexture(buffer, false);
    const flag = buffer.readUnsignedByte();
    this.flag1 = (flag & 1) !== 0;
    this.valid = (flag & 2) !== 0;
    this.size = buffer.readUnsignedByte();
    this.averageHsl = buffer.readUnsignedShort();
    this.unused = buffer.readUnsignedByte();
    if (this.unused === 255) {
      this.unused = 256;
    }
    const i_23_ = buffer.readUnsignedByte();
    const i_24_ = buffer.readUnsignedByte();
    this.animDirU = i_23_ >> 6 & 3;
    this.animDirV = i_24_ >> 6 & 3;
    this.animSpeed = (i_24_ & 63) - 6;
    buffer.readUnsignedByte();
    buffer.readUnsignedByte();
  }
};

// ../rs-party-dashboard/src/rs/texture/ProceduralTextureLoader.ts
var ProceduralTextureLoader = class _ProceduralTextureLoader {
  constructor(isRunetek5, hasModOperation, textureIndex, spriteIndex, textureIds, materials) {
    this.isRunetek5 = isRunetek5;
    this.hasModOperation = hasModOperation;
    this.textureIndex = textureIndex;
    this.spriteIndex = spriteIndex;
    this.textureIds = textureIds;
    this.materials = materials;
    this.textures = /* @__PURE__ */ new Map();
    this.transparentTextureMap = /* @__PURE__ */ new Map();
    this.textureGenerator = new TextureGenerator(spriteIndex, this);
  }
  static load(revision, materialsIndex, textureIndex, spriteIndex) {
    const hasModOperation = revision >= 537;
    const hasCombineModeAndShaderParam2 = revision >= 582;
    const hasAlphaBlending = revision >= 629;
    const materialsFile = materialsIndex.getFile(0, 0);
    if (!materialsFile) {
      throw new Error("Materials file not found");
    }
    const buffer = materialsFile.getDataAsBuffer();
    const count = buffer.readUnsignedShort();
    const materials = new Array(count);
    for (let i = 0; i < count; i++) {
      const exists = buffer.readUnsignedByte() === 1;
      if (exists) {
        materials[i] = new ProcTextureMaterial(i);
      }
    }
    for (let i = 0; i < count; i++) {
      const material = materials[i];
      if (material) {
        material.valid = buffer.readUnsignedByte() === 1;
      }
    }
    if (!hasAlphaBlending) {
      for (let i = 0; i < count; i++) {
        const material = materials[i];
        if (material) {
          material.alpha = buffer.readUnsignedByte() === 1;
        }
      }
    }
    for (let i = 0; i < count; i++) {
      const material = materials[i];
      if (material) {
        material.small = buffer.readUnsignedByte() === 1;
      }
    }
    for (let i = 0; i < count; i++) {
      const material = materials[i];
      if (material) {
        material.disabled = buffer.readUnsignedByte() === 1;
      }
    }
    for (let i = 0; i < count; i++) {
      const material = materials[i];
      if (material) {
        material.brightness = buffer.readByte();
      }
    }
    for (let i = 0; i < count; i++) {
      const material = materials[i];
      if (material) {
        material.blanch = buffer.readByte();
      }
    }
    for (let i = 0; i < count; i++) {
      const material = materials[i];
      if (material) {
        material.shaderId = buffer.readByte();
      }
    }
    for (let i = 0; i < count; i++) {
      const material = materials[i];
      if (material) {
        material.shaderParam = buffer.readByte();
      }
    }
    for (let i = 0; i < count; i++) {
      const material = materials[i];
      if (material) {
        material.averageHsl = buffer.readUnsignedShort();
      }
    }
    if (buffer.remaining > 0) {
      for (let i = 0; i < count; i++) {
        const material = materials[i];
        if (material) {
          material.animU = buffer.readByte();
        }
      }
      for (let i = 0; i < count; i++) {
        const material = materials[i];
        if (material) {
          material.animV = buffer.readByte();
        }
      }
      for (let i = 0; i < count; i++) {
        const material = materials[i];
        if (material) {
          buffer.readByte();
        }
      }
      for (let i = 0; i < count; i++) {
        const material = materials[i];
        if (material) {
          material.flipV = buffer.readUnsignedByte() === 1;
        }
      }
      for (let i = 0; i < count; i++) {
        const material = materials[i];
        if (material) {
          material.mipmap = buffer.readByte();
        }
      }
      for (let i = 0; i < count; i++) {
        const material = materials[i];
        if (material) {
          material.repeatS = buffer.readUnsignedByte() === 1;
        }
      }
      for (let i = 0; i < count; i++) {
        const material = materials[i];
        if (material) {
          material.repeatT = buffer.readUnsignedByte() === 1;
        }
      }
      for (let i = 0; i < count; i++) {
        const material = materials[i];
        if (material) {
          material.floatTexture = buffer.readUnsignedByte() === 1;
        }
      }
      if (hasCombineModeAndShaderParam2) {
        for (let i = 0; i < count; i++) {
          const material = materials[i];
          if (material) {
            material.combineMode = buffer.readUnsignedByte();
          }
        }
        for (let i = 0; i < count; i++) {
          const material = materials[i];
          if (material) {
            material.shaderParam2 = buffer.readInt();
          }
        }
      }
      if (hasAlphaBlending) {
        for (let i = 0; i < count; i++) {
          const material = materials[i];
          if (material) {
            material.alphaMode = buffer.readUnsignedByte();
          }
        }
      }
    }
    const textureIds = Array.from(textureIndex.getArchiveIds());
    return new _ProceduralTextureLoader(
      revision >= 555,
      hasModOperation,
      textureIndex,
      spriteIndex,
      textureIds,
      materials
    );
  }
  getTexture(id) {
    const cached = this.textures.get(id);
    if (cached) {
      return cached;
    }
    const textureFile = this.textureIndex.getFileSmart(id);
    if (!textureFile) {
      return void 0;
    }
    const buffer = textureFile.getDataAsBuffer();
    const texture = new ProceduralTextureDefinition2(id, buffer, this.hasModOperation);
    this.textures.set(id, texture);
    return texture;
  }
  getTextureIds() {
    return this.textureIds;
  }
  getTextureIndex(id) {
    return id;
  }
  isSd(id) {
    return this.materials[id]?.valid ?? false;
  }
  isSmall(id) {
    return this.materials[id]?.small ?? false;
  }
  isTransparent(id) {
    if (!this.transparentTextureMap.has(id)) {
      try {
        if (!this.getTexture(id)) {
          return false;
        }
        this.getPixelsArgb(id, 128, false, 1);
      } catch (e) {
        console.error("Error loading texture", e);
        this.transparentTextureMap.set(id, false);
      }
    }
    return this.transparentTextureMap.get(id) ?? false;
  }
  getAverageHsl(id) {
    return this.materials[id]?.averageHsl ?? 0;
  }
  getAnimationUv(id) {
    const texture = this.getTexture(id);
    if (!texture) {
      return [0, 0];
    }
    return [texture.animU, texture.animV];
  }
  getMaterial(id) {
    const texture = this.getTexture(id);
    const material = this.materials[id];
    if (!material) {
      return {
        animU: 0,
        animV: 0,
        alphaCutOff: 0.1
      };
    }
    let animU = material.animU;
    let animV = material.animV;
    if (!this.isRunetek5) {
      const textureDef = this.getTexture(id);
      if (textureDef) {
        animU = textureDef.animU;
        animV = textureDef.animV;
      }
    }
    let alphaCutOff = 0.9;
    if (animU !== 0 || animV !== 0 || material.alphaMode === 2) {
      alphaCutOff = 0.01;
    }
    return {
      animU,
      animV,
      alphaCutOff
    };
  }
  getPixelsRgb(id, size, flipH, brightness) {
    const texture = this.getTexture(id);
    if (!texture) {
      throw new Error("Texture not found: " + id);
    }
    const pixels = texture.proceduralTexture.getPixelsRgb(
      this.textureGenerator,
      size,
      size,
      flipH,
      texture.flipV,
      brightness
    );
    this.transparentTextureMap.set(id, this.textureGenerator.isTransparent);
    return pixels;
  }
  getPixelsArgb(id, size, flipH, brightness) {
    const texture = this.getTexture(id);
    if (!texture) {
      throw new Error("Texture not found: " + id);
    }
    const pixels = texture.proceduralTexture.getPixelsArgb(
      this.textureGenerator,
      size,
      size,
      flipH,
      texture.flipV,
      brightness
    );
    this.transparentTextureMap.set(id, this.textureGenerator.isTransparent);
    return pixels;
  }
};
var ProcTextureMaterial = class {
  constructor(id) {
    this.id = id;
    this.valid = false;
    this.alpha = false;
    this.small = false;
    this.disabled = false;
    this.brightness = 0;
    this.blanch = 0;
    this.shaderId = 0;
    this.shaderParam = 0;
    this.averageHsl = 0;
    this.animU = 0;
    this.animV = 0;
    this.flipV = false;
    this.mipmap = 0;
    this.repeatS = false;
    this.repeatT = false;
    this.floatTexture = false;
    this.combineMode = 0;
    this.shaderParam2 = 0;
    this.alphaMode = 0;
  }
};
var ProceduralTextureDefinition2 = class {
  constructor(id, buffer, hasModOperation) {
    this.bool1 = false;
    this.flipV = false;
    this.repeatS = false;
    this.repeatT = false;
    this.animU = 0;
    this.animV = 0;
    this.id = id;
    this.proceduralTexture = new ProceduralTexture(buffer, hasModOperation);
    this.bool1 = buffer.readUnsignedByte() === 1;
    this.flipV = buffer.readUnsignedByte() === 1;
    this.repeatS = buffer.readUnsignedByte() === 1;
    this.repeatT = buffer.readUnsignedByte() === 1;
    const combineMode = buffer.readUnsignedByte() & 3;
    this.animU = buffer.readByte();
    this.animV = buffer.readByte();
    if (combineMode === 1) {
      this.combineMode = 2 /* ADD */;
    } else if (combineMode === 2) {
      this.combineMode = 3 /* SUBTRACT */;
    } else if (combineMode === 3) {
      this.combineMode = 4 /* ADD_SIGNED */;
    } else {
      this.combineMode = 0 /* MODULATE */;
    }
  }
};

// ../rs-party-dashboard/src/rs/util/ColorUtil.ts
function buildPalette(brightness, var2, var3) {
  const palette = new Int32Array(65535);
  let paletteIndex = var2 * 128;
  for (let var5 = var2; var5 < var3; var5++) {
    let var6 = (var5 >> 3) / 64 + 78125e-7;
    let var8 = (var5 & 7) / 8 + 0.0625;
    for (let var10 = 0; var10 < 128; var10++) {
      const var11 = var10 / 128;
      let var13 = var11;
      let var15 = var11;
      let var17 = var11;
      if (var8 !== 0) {
        let var19;
        if (var11 < 0.5) {
          var19 = var11 * (1 + var8);
        } else {
          var19 = var11 + var8 - var11 * var8;
        }
        const var21 = 2 * var11 - var19;
        let var23 = var6 + 0.3333333333333333;
        if (var23 > 1) {
          var23--;
        }
        let var27 = var6 - 0.3333333333333333;
        if (var27 < 0) {
          var27++;
        }
        if (6 * var23 < 1) {
          var13 = var21 + (var19 - var21) * 6 * var23;
        } else if (2 * var23 < 1) {
          var13 = var19;
        } else if (3 * var23 < 2) {
          var13 = var21 + (var19 - var21) * (0.6666666666666666 - var23) * 6;
        } else {
          var13 = var21;
        }
        if (6 * var6 < 1) {
          var15 = var21 + (var19 - var21) * 6 * var6;
        } else if (2 * var6 < 1) {
          var15 = var19;
        } else if (3 * var6 < 2) {
          var15 = var21 + (var19 - var21) * (0.6666666666666666 - var6) * 6;
        } else {
          var15 = var21;
        }
        if (6 * var27 < 1) {
          var17 = var21 + (var19 - var21) * 6 * var27;
        } else if (2 * var27 < 1) {
          var17 = var19;
        } else if (3 * var27 < 2) {
          var17 = var21 + (var19 - var21) * (0.6666666666666666 - var27) * 6;
        } else {
          var17 = var21;
        }
      }
      const r = var13 * 256 | 0;
      const g = var15 * 256 | 0;
      const b = var17 * 256 | 0;
      const rgb = (r << 16) + (g << 8) + b;
      let newRgb = brightenRgb(rgb, brightness);
      if (newRgb === 0) {
        newRgb = 1;
      }
      palette[paletteIndex++] = brightenRgb(rgb, brightness);
    }
  }
  return palette;
}
var HSL_RGB_MAP = buildPalette(0.8, 0, 512);
var INVALID_HSL_COLOR = 12345678;
function brightenRgb(rgb, brightness) {
  let r = (rgb >> 16) / 256;
  let g = (rgb >> 8 & 255) / 256;
  let b = (rgb & 255) / 256;
  r = Math.pow(r, brightness);
  g = Math.pow(g, brightness);
  b = Math.pow(b, brightness);
  const newR = r * 256 | 0;
  const newG = g * 256 | 0;
  const newB = b * 256 | 0;
  return newR << 16 | newG << 8 | newB;
}
function packHsl(hue, saturation, lightness) {
  if (lightness > 179) {
    saturation = saturation / 2 | 0;
  }
  if (lightness > 192) {
    saturation = saturation / 2 | 0;
  }
  if (lightness > 217) {
    saturation = saturation / 2 | 0;
  }
  if (lightness > 243) {
    saturation = saturation / 2 | 0;
  }
  return (saturation / 32 << 7) + (hue / 4 << 10) + (lightness / 2 | 0);
}
function mixHsl(hslA, hslB) {
  if (hslA === INVALID_HSL_COLOR || hslB === INVALID_HSL_COLOR) {
    return INVALID_HSL_COLOR;
  }
  if (hslA === -1) {
    return hslB;
  } else if (hslB === -1) {
    return hslA;
  } else {
    let hue = hslA >> 10 & 63;
    let saturation = hslA >> 7 & 7;
    let lightness = hslA & 127;
    let hueB = hslB >> 10 & 63;
    let saturationB = hslB >> 7 & 7;
    let lightnessB = hslB & 127;
    hue += hueB;
    saturation += saturationB;
    lightness += lightnessB;
    hue >>= 1;
    saturation >>= 1;
    lightness >>= 1;
    return (hue << 10) + (saturation << 7) + lightness;
  }
}
function rgbToHsl(rgb) {
  const r = (rgb >> 16 & 255) / 256;
  const g = (rgb >> 8 & 255) / 256;
  const b = (rgb & 255) / 256;
  let minRgb = r;
  if (g < r) {
    minRgb = g;
  }
  if (b < minRgb) {
    minRgb = b;
  }
  let maxRgb = r;
  if (g > r) {
    maxRgb = g;
  }
  if (b > maxRgb) {
    maxRgb = b;
  }
  let hueTemp = 0;
  let sat = 0;
  const light = (minRgb + maxRgb) / 2;
  if (minRgb !== maxRgb) {
    if (light < 0.5) {
      sat = (maxRgb - minRgb) / (minRgb + maxRgb);
    }
    if (light >= 0.5) {
      sat = (maxRgb - minRgb) / (2 - maxRgb - minRgb);
    }
    if (maxRgb === r) {
      hueTemp = (g - b) / (maxRgb - minRgb);
    } else if (maxRgb === g) {
      hueTemp = 2 + (b - r) / (maxRgb - minRgb);
    } else if (maxRgb === b) {
      hueTemp = 4 + (r - g) / (maxRgb - minRgb);
    }
  }
  hueTemp /= 6;
  const hue = hueTemp * 256 | 0;
  let saturation = sat * 256 | 0;
  let lightness = light * 256 | 0;
  if (saturation < 0) {
    saturation = 0;
  } else if (saturation > 255) {
    saturation = 255;
  }
  if (lightness < 0) {
    lightness = 0;
  } else if (lightness > 255) {
    lightness = 255;
  }
  return packHsl(hue, saturation, lightness);
}
function adjustUnderlayLight(hsl, light) {
  if (hsl === -1) {
    return INVALID_HSL_COLOR;
  } else {
    light = (hsl & 127) * light >> 7;
    if (light < 2) {
      light = 2;
    } else if (light > 126) {
      light = 126;
    }
    return (hsl & 65408) + light;
  }
}
function adjustOverlayLight(hsl, light) {
  if (hsl === -2) {
    return INVALID_HSL_COLOR;
  } else if (hsl === -1) {
    if (light < 2) {
      light = 2;
    } else if (light > 126) {
      light = 126;
    }
    return light;
  } else {
    light = (hsl & 127) * light >> 7;
    if (light < 2) {
      light = 2;
    } else if (light > 126) {
      light = 126;
    }
    return (hsl & 65408) + light;
  }
}

// ../rs-party-dashboard/src/rs/texture/SpriteTextureLoader.ts
var SpriteTextureLoader = class _SpriteTextureLoader {
  constructor(spriteIndex, textureIds, definitions) {
    this.spriteIndex = spriteIndex;
    this.textureIds = textureIds;
    this.definitions = definitions;
    this.idIndexMap = /* @__PURE__ */ new Map();
    for (let i = 0; i < textureIds.length; i++) {
      this.idIndexMap.set(textureIds[i], i);
    }
  }
  static {
    this.ANIM_DIRECTION_UV = [
      [0, 0],
      [0, -1],
      [-1, 0],
      [0, 1],
      [1, 0]
    ];
  }
  static load(textureIndex, spriteIndex, isSimplified) {
    const definitions = /* @__PURE__ */ new Map();
    const textureArchive = textureIndex.getArchive(0);
    const textureIds = Array.from(textureArchive.fileIds);
    for (let i = 0; i < textureIds.length; i++) {
      const textureId = textureIds[i];
      const file = textureArchive.getFile(textureId);
      if (file) {
        const buffer = file.getDataAsBuffer();
        const definition = isSimplified ? TextureDefinition.decodeSimplified(textureId, buffer) : TextureDefinition.decode(textureId, buffer);
        definitions.set(textureId, definition);
      }
    }
    return new _SpriteTextureLoader(spriteIndex, textureIds, definitions);
  }
  getTextureIds() {
    return this.textureIds;
  }
  getTextureIndex(id) {
    return this.idIndexMap.get(id) ?? -1;
  }
  isSd(id) {
    return true;
  }
  isSmall(id) {
    return this.loadTextureSprite(id).subWidth === 64;
  }
  getAverageHsl(id) {
    return this.definitions.get(id)?.averageHsl ?? 0;
  }
  getAnimationUv(id) {
    const def = this.definitions.get(id);
    if (!def) {
      return [0, 0];
    }
    const direction = def.animationDirection;
    const speed = def.animationSpeed;
    const uv = _SpriteTextureLoader.ANIM_DIRECTION_UV[direction];
    return [uv[0] * speed, uv[1] * speed];
  }
  isTransparent(id) {
    const def = this.definitions.get(id);
    if (!def) {
      return false;
    }
    return !def.opaque;
  }
  getMaterial(id) {
    const def = this.definitions.get(id);
    if (!def) {
      return {
        animU: 0,
        animV: 0,
        alphaCutOff: 0.1
      };
    }
    const direction = def.animationDirection;
    const speed = def.animationSpeed;
    const uv = _SpriteTextureLoader.ANIM_DIRECTION_UV[direction];
    const animU = uv[0] * speed;
    const animV = uv[1] * speed;
    let alphaCutOff = 0.5;
    if (animU !== 0 || animV !== 0) {
      alphaCutOff = 0.1;
    }
    return {
      animU,
      animV,
      alphaCutOff
    };
  }
  loadTextureSprite(id) {
    const def = this.definitions.get(id);
    if (!def) {
      throw new Error("Texture definition not found: " + id);
    }
    for (let i = 0; i < def.spriteIds.length; i++) {
      const sprite = SpriteLoader.loadIntoIndexedSprite(this.spriteIndex, def.spriteIds[i]);
      if (!sprite) {
        throw new Error("Texture references invalid sprite");
      }
      sprite.normalize();
      return sprite;
    }
    throw new Error("Texture has no sprites");
  }
  getPixelsRgb(id, size, flipH, brightness) {
    const def = this.definitions.get(id);
    if (!def) {
      throw new Error("Texture definition not found: " + id);
    }
    const pixelCount = size * size;
    const pixels = new Int32Array(pixelCount);
    for (let i = 0; i < def.spriteIds.length; i++) {
      const sprite = SpriteLoader.loadIntoIndexedSprite(this.spriteIndex, def.spriteIds[i]);
      if (!sprite) {
        throw new Error("Texture references invalid sprite");
      }
      sprite.normalize();
      const palettePixels = sprite.pixels;
      const palette = sprite.palette;
      const transform = def.transforms[i];
      if ((transform & -16777216) === 50331648) {
        const r_b = transform & 16711935;
        const green = transform >> 8 & 255;
        for (let pi = 0; pi < palette.length; pi++) {
          const color = palette[pi];
          const rg = color >> 8;
          const gb = color & 65535;
          if (rg === gb) {
            const blue = color & 255;
            palette[pi] = r_b * blue >> 8 & 16711935 | green * blue & 65280;
          }
        }
      }
      for (let pi = 0; pi < palette.length; pi++) {
        let alpha = 255;
        if (palette[pi] === 0) {
          alpha = 0;
        }
        palette[pi] = alpha << 24 | brightenRgb(palette[pi], brightness);
      }
      let index = 0;
      if (i > 0 && def.spriteTypes) {
        index = def.spriteTypes[i - 1];
      }
      if (index === 0) {
        if (size === sprite.subWidth) {
          for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex++) {
            const paletteIndex = palettePixels[pixelIndex];
            pixels[pixelIndex] = palette[paletteIndex];
          }
        } else if (sprite.subWidth === 64 && size === 128) {
          let pixelIndex = 0;
          for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
              const paletteIndex = palettePixels[(x >> 1 << 6) + (y >> 1)];
              pixels[pixelIndex++] = palette[paletteIndex];
            }
          }
        } else {
          if (sprite.subWidth !== 128 || size !== 64) {
            throw new Error("Texture sprite has unexpected size");
          }
          let pixelIndex = 0;
          for (let x = 0; x < size; x++) {
            for (let y = 0; y < size; y++) {
              const paletteIndex = palettePixels[(y << 1) + (x << 1 << 7)];
              pixels[pixelIndex++] = palette[paletteIndex];
            }
          }
        }
      }
    }
    return pixels;
  }
  getPixelsArgb(id, size, flipH, brightness) {
    return this.getPixelsRgb(id, size, flipH, brightness);
  }
};
var TextureDefinition = class _TextureDefinition {
  constructor(id, averageHsl, opaque, spriteCount, spriteIds, transforms, animationDirection, animationSpeed, spriteTypes, unused) {
    this.id = id;
    this.averageHsl = averageHsl;
    this.opaque = opaque;
    this.spriteCount = spriteCount;
    this.spriteIds = spriteIds;
    this.transforms = transforms;
    this.animationDirection = animationDirection;
    this.animationSpeed = animationSpeed;
    this.spriteTypes = spriteTypes;
    this.unused = unused;
  }
  static decode(id, buffer) {
    const averageHsl = buffer.readUnsignedShort();
    const opaque = buffer.readUnsignedByte() === 1;
    const spriteCount = buffer.readUnsignedByte();
    if (spriteCount < 1 || spriteCount > 4) {
      throw new Error("Invalid sprite count for texture: " + spriteCount);
    }
    const spriteIds = new Array(spriteCount);
    for (let i = 0; i < spriteCount; i++) {
      spriteIds[i] = buffer.readUnsignedShort();
    }
    let spriteTypes;
    if (spriteCount > 1) {
      spriteTypes = new Array(spriteCount - 1);
      for (let i = 0; i < spriteCount - 1; i++) {
        spriteTypes[i] = buffer.readUnsignedByte();
      }
    }
    let unused;
    if (spriteCount > 1) {
      unused = new Array(spriteCount - 1);
      for (let i = 0; i < spriteCount - 1; i++) {
        unused[i] = buffer.readUnsignedByte();
      }
    }
    const transforms = new Array(spriteCount);
    for (let i = 0; i < spriteCount; i++) {
      transforms[i] = buffer.readInt();
    }
    const animationDirection = buffer.readUnsignedByte();
    const animationSpeed = buffer.readUnsignedByte();
    return new _TextureDefinition(
      id,
      averageHsl,
      opaque,
      spriteCount,
      spriteIds,
      transforms,
      animationDirection,
      animationSpeed,
      spriteTypes,
      unused
    );
  }
  static decodeSimplified(id, buffer) {
    const spriteId = buffer.readUnsignedShort();
    const averageHsl = buffer.readUnsignedShort();
    const opaque = buffer.readUnsignedByte() === 1;
    const animationDirection = buffer.readUnsignedByte();
    const animationSpeed = buffer.readUnsignedByte();
    return new _TextureDefinition(
      id,
      averageHsl,
      opaque,
      1,
      [spriteId],
      [0],
      animationDirection,
      animationSpeed
    );
  }
};

// ../rs-party-dashboard/src/rs/cache/ConfigType.ts
var ConfigType = class {
  static {
    this.DAT = {
      title: 1,
      configs: 2,
      interfaces: 3,
      media: 4,
      versionList: 5,
      textures: 6
    };
  }
  static {
    this.DAT2 = {
      underlays: 1,
      identkits: 3,
      overlays: 4,
      inv: 5,
      locs: 6,
      enums: 8,
      npcs: 9,
      objs: 10,
      params: 11,
      seqs: 12,
      spotAnims: 13,
      varbits: 14,
      varps: 16,
      varClient: 19,
      varClientString: 15,
      varPlayer: 16
    };
  }
  static {
    this.OSRS = {
      hitSplat: 32,
      healthBar: 33,
      struct: 34,
      mapFunctions: 35,
      dbRow: 38,
      dbTable: 39
    };
  }
  static {
    this.RS2 = {
      bas: 32,
      mapScenes: 34,
      quests: 35,
      mapFunctions: 36
    };
  }
};

// ../rs-party-dashboard/src/rs/cache/loader/Dat2CacheLoaderFactory.ts
var Dat2CacheLoaderFactory = class {
  constructor(cacheInfo, cacheType, cacheSystem) {
    this.cacheInfo = cacheInfo;
    this.cacheType = cacheType;
    this.cacheSystem = cacheSystem;
  }
  isIndexConfigs() {
    return this.cacheInfo.game === "runescape" && this.cacheInfo.revision >= 488;
  }
  getUnderlayTypeLoader() {
    const configIndex = this.cacheSystem.getIndex(IndexType.DAT2.configs);
    const underlaysArchive = configIndex.getArchive(ConfigType.DAT2.underlays);
    return new ArchiveUnderlayFloorTypeLoader(this.cacheInfo, underlaysArchive);
  }
  getOverlayTypeLoader() {
    const configIndex = this.cacheSystem.getIndex(IndexType.DAT2.configs);
    const overlaysArchive = configIndex.getArchive(ConfigType.DAT2.overlays);
    return new ArchiveOverlayFloorTypeLoader(this.cacheInfo, overlaysArchive);
  }
  getVarBitTypeLoader() {
    if (this.isIndexConfigs()) {
      const varbitsIndex = this.cacheSystem.getIndex(IndexType.RS2.varbits);
      return new IndexVarBitTypeLoader(this.cacheInfo, varbitsIndex);
    } else {
      const configIndex = this.cacheSystem.getIndex(IndexType.DAT2.configs);
      const varbitsArchive = configIndex.getArchive(ConfigType.DAT2.varbits);
      return new ArchiveVarBitTypeLoader(this.cacheInfo, varbitsArchive);
    }
  }
  getLocTypeLoader() {
    if (this.isIndexConfigs()) {
      const locsIndex = this.cacheSystem.getIndex(IndexType.RS2.locs);
      return new IndexLocTypeLoader(this.cacheInfo, locsIndex);
    } else {
      const configIndex = this.cacheSystem.getIndex(IndexType.DAT2.configs);
      const locsArchive = configIndex.getArchive(ConfigType.DAT2.locs);
      return new ArchiveLocTypeLoader(this.cacheInfo, locsArchive);
    }
  }
  getNpcTypeLoader() {
    if (this.isIndexConfigs()) {
      const npcIndex = this.cacheSystem.getIndex(IndexType.RS2.npcs);
      return new IndexNpcTypeLoader(this.cacheInfo, npcIndex);
    } else {
      const configIndex = this.cacheSystem.getIndex(IndexType.DAT2.configs);
      const npcsArchive = configIndex.getArchive(ConfigType.DAT2.npcs);
      return new ArchiveNpcTypeLoader(this.cacheInfo, npcsArchive);
    }
  }
  getObjTypeLoader() {
    if (this.isIndexConfigs()) {
      const objIndex = this.cacheSystem.getIndex(IndexType.RS2.objs);
      return new IndexObjTypeLoader(this.cacheInfo, objIndex);
    } else {
      const configIndex = this.cacheSystem.getIndex(IndexType.DAT2.configs);
      const objsArchive = configIndex.getArchive(ConfigType.DAT2.objs);
      return new ArchiveObjTypeLoader(this.cacheInfo, objsArchive);
    }
  }
  getSpotAnimTypeLoader() {
    if (this.isIndexConfigs()) {
      const spotAnimIndex = this.cacheSystem.getIndex(IndexType.RS2.spotAnims);
      return new IndexSpotAnimTypeLoader(this.cacheInfo, spotAnimIndex);
    }
    const configIndex = this.cacheSystem.getIndex(IndexType.DAT2.configs);
    const spotAnimArchive = configIndex.getArchive(ConfigType.DAT2.spotAnims);
    return new ArchiveSpotAnimTypeLoader(this.cacheInfo, spotAnimArchive);
  }
  getSeqTypeLoader() {
    if (this.isIndexConfigs()) {
      const seqIndex = this.cacheSystem.getIndex(IndexType.RS2.seqs);
      return new IndexSeqTypeLoader(this.cacheInfo, seqIndex);
    } else {
      const configIndex = this.cacheSystem.getIndex(IndexType.DAT2.configs);
      const seqsArchive = configIndex.getArchive(ConfigType.DAT2.seqs);
      return new ArchiveSeqTypeLoader(this.cacheInfo, seqsArchive);
    }
  }
  getBasTypeLoader() {
    if (this.cacheInfo.game === "runescape" && this.cacheInfo.revision >= 530) {
      const configIndex = this.cacheSystem.getIndex(IndexType.DAT2.configs);
      try {
        const basArchive = configIndex.getArchive(ConfigType.RS2.bas);
        return new ArchiveBasTypeLoader(this.cacheInfo, basArchive);
      } catch (e) {
        console.error("Failed to load bastype archive", e);
      }
    }
    return new DummyBasTypeLoader(this.cacheInfo);
  }
  getQuestTypeLoader() {
    const configIndex = this.cacheSystem.getIndex(IndexType.DAT2.configs);
    if (this.cacheInfo.game === "runescape" && configIndex.archiveExists(ConfigType.RS2.quests)) {
      try {
        const questArchive = configIndex.getArchive(ConfigType.RS2.quests);
        return new ArchiveQuestTypeLoader(this.cacheInfo, questArchive);
      } catch (e) {
        console.error("Failed to load questtype archive", e);
      }
    }
    return void 0;
  }
  getTextureLoader() {
    const textureIndex = this.cacheSystem.getIndex(IndexType.DAT2.textures);
    const spriteIndex = this.cacheSystem.getIndex(IndexType.DAT2.sprites);
    if (this.cacheInfo.game === "oldschool" || this.cacheInfo.game === "runescape" && this.cacheInfo.revision < 474) {
      const isSimplified = this.cacheInfo.game === "oldschool" && this.cacheInfo.revision >= 233;
      return SpriteTextureLoader.load(textureIndex, spriteIndex, isSimplified);
    } else if (this.cacheSystem.indexExists(IndexType.RS2.materials)) {
      const materialIndex = this.cacheSystem.getIndex(IndexType.RS2.materials);
      return ProceduralTextureLoader.load(
        this.cacheInfo.revision,
        materialIndex,
        textureIndex,
        spriteIndex
      );
    } else {
      return OldProceduralTextureLoader.load(textureIndex, spriteIndex);
    }
  }
  getModelLoader() {
    const modelIndex = this.cacheSystem.getIndex(IndexType.DAT2.models);
    return new IndexModelLoader(modelIndex);
  }
  getSeqBaseLoader() {
    const index = this.cacheSystem.getIndex(IndexType.DAT2.skeletons);
    return new IndexSeqBaseLoader(this.cacheInfo, index);
  }
  getSeqFrameLoader() {
    const index = this.cacheSystem.getIndex(IndexType.DAT2.animations);
    return new Dat2SeqFrameLoader(this.cacheInfo, index, this.getSeqBaseLoader());
  }
  getSkeletalSeqLoader() {
    if (this.cacheInfo.game === "oldschool" && this.cacheInfo.revision >= 229) {
      const index2 = this.cacheSystem.getIndex(IndexType.OSRS.animKeyFrames);
      return new IndexSkeletalSeqLoader(index2, this.getSeqBaseLoader());
    }
    const index = this.cacheSystem.getIndex(IndexType.DAT2.animations);
    return new IndexSkeletalSeqLoader(index, this.getSeqBaseLoader());
  }
  getMapFileLoader() {
    const mapIndex = this.cacheSystem.getIndex(IndexType.DAT2.maps);
    const mapFileIndex = new Dat2MapIndex(mapIndex);
    return new MapFileLoader(mapIndex, mapFileIndex);
  }
  getMapScenes() {
    const configIndex = this.cacheSystem.getIndex(IndexType.DAT2.configs);
    const spriteIndex = this.cacheSystem.getIndex(IndexType.DAT2.sprites);
    if (this.cacheInfo.game === "runescape" && configIndex.archiveExists(ConfigType.RS2.mapScenes)) {
      const mapScenesArchive = configIndex.getArchive(ConfigType.RS2.mapScenes);
      const mapSceneTypeLoader = new MapSceneTypeLoader(this.cacheInfo, mapScenesArchive);
      const mapSceneSprites = new Array(mapScenesArchive.lastFileId);
      for (const id of mapScenesArchive.fileIds) {
        const mapScene = mapSceneTypeLoader.load(id);
        if (mapScene.spriteId === -1) {
          continue;
        }
        const sprite = SpriteLoader.loadIntoIndexedSprite(spriteIndex, mapScene.spriteId);
        if (sprite) {
          mapSceneSprites[id] = sprite;
        }
      }
      return mapSceneSprites;
    } else {
      const graphicDefaults = GraphicsDefaults.load(this.cacheInfo, this.cacheSystem);
      if (graphicDefaults.mapScenes === -1) {
        return [];
      }
      const mapScenes = SpriteLoader.loadIntoIndexedSprites(
        spriteIndex,
        graphicDefaults.mapScenes
      );
      if (!mapScenes) {
        throw new Error("Failed to load map scenes");
      }
      return mapScenes;
    }
  }
  loadMapElementSprites(spriteIndex, mapElementTypeLoader) {
    const mapElementSprites = new Array(mapElementTypeLoader.getCount());
    for (let i = 0; i < mapElementSprites.length; i++) {
      const mapElement = mapElementTypeLoader.load(i);
      if (mapElement.spriteId === -1) {
        continue;
      }
      const sprite = SpriteLoader.loadIntoIndexedSprite(spriteIndex, mapElement.spriteId);
      if (sprite) {
        mapElementSprites[i] = sprite;
      }
    }
    return mapElementSprites;
  }
  getMapFunctions() {
    const configIndex = this.cacheSystem.getIndex(IndexType.DAT2.configs);
    const spriteIndex = this.cacheSystem.getIndex(IndexType.DAT2.sprites);
    if (this.cacheInfo.game === "oldschool" && configIndex.archiveExists(ConfigType.OSRS.mapFunctions)) {
      const mapElementArchive = configIndex.getArchive(ConfigType.OSRS.mapFunctions);
      const mapElementTypeLoader = new ArchiveMapElementTypeLoader(
        this.cacheInfo,
        mapElementArchive
      );
      return this.loadMapElementSprites(spriteIndex, mapElementTypeLoader);
    } else if (this.cacheInfo.game === "runescape" && configIndex.archiveExists(ConfigType.RS2.mapFunctions)) {
      const mapElementArchive = configIndex.getArchive(ConfigType.RS2.mapFunctions);
      const mapElementTypeLoader = new ArchiveMapElementTypeLoader(
        this.cacheInfo,
        mapElementArchive
      );
      return this.loadMapElementSprites(spriteIndex, mapElementTypeLoader);
    } else {
      const graphicDefaults = GraphicsDefaults.load(this.cacheInfo, this.cacheSystem);
      if (graphicDefaults.mapFunctions === -1) {
        return [];
      }
      const mapFunctions = SpriteLoader.loadIntoIndexedSprites(
        spriteIndex,
        graphicDefaults.mapFunctions
      );
      if (!mapFunctions) {
        throw new Error("Failed to load map functions");
      }
      return mapFunctions;
    }
  }
};

// ../rs-party-dashboard/src/rs/texture/DatTextureLoader.ts
var DatTextureLoader = class {
  constructor(textureArchive, animatedTextureIds) {
    this.textureArchive = textureArchive;
    this.transparentTextureMap = /* @__PURE__ */ new Map();
    this.animatedTextureIds = new Set(animatedTextureIds);
    this.textureIds = new Array(this.getTextureCount());
    for (let i = 0; i < this.textureIds.length; i++) {
      this.textureIds[i] = i;
    }
    this.textureSprites = new Array(this.getLastTextureId());
    this.idAverageHslMap = /* @__PURE__ */ new Map();
  }
  static {
    this.WATER_DROPLETS_TEXTURE_ID = 17;
  }
  getTextureIds() {
    return this.textureIds;
  }
  getTextureIndex(id) {
    return id;
  }
  getTextureCount() {
    return this.textureArchive.fileCount - 1;
  }
  getLastTextureId() {
    return this.getTextureCount() - 1;
  }
  isSd(id) {
    return true;
  }
  isSmall(id) {
    return this.loadTextureSprite(id).subWidth === 64;
  }
  isTransparent(id) {
    this.loadTextureSprite(id);
    return this.transparentTextureMap.get(id) ?? false;
  }
  getAverageHsl(id) {
    let averageHsl = this.idAverageHslMap.get(id);
    if (averageHsl !== void 0) {
      return averageHsl;
    }
    const sprite = this.loadTextureSprite(id);
    let red = 0;
    let green = 0;
    let blue = 0;
    const colourCount = sprite.palette.length;
    for (let i = 0; i < colourCount; i++) {
      red += sprite.palette[i] >> 16 & 255;
      green += sprite.palette[i] >> 8 & 255;
      blue += sprite.palette[i] & 255;
    }
    const averageRgb = (red / colourCount << 16) + (green / colourCount << 8) + (blue / colourCount | 0);
    averageHsl = rgbToHsl(averageRgb);
    this.idAverageHslMap.set(id, averageHsl);
    return averageHsl;
  }
  getAnimationUv(id) {
    if (this.animatedTextureIds.has(id)) {
      return [0, -1];
    }
    return [0, 0];
  }
  getMaterial(id) {
    let animV = 0;
    let alphaCutOff = 0.5;
    if (this.animatedTextureIds.has(id)) {
      animV = -1;
      alphaCutOff = 0.1;
    }
    return {
      animU: 0,
      animV,
      alphaCutOff
    };
  }
  getPixelsRgb(id, size, flipH, brightness) {
    const sprite = this.loadTextureSprite(id);
    const palettePixels = sprite.pixels;
    const palette = sprite.palette;
    for (let pi = 0; pi < palette.length; pi++) {
      let alpha = 255;
      if (palette[pi] === 0) {
        alpha = 0;
      }
      palette[pi] = alpha << 24 | brightenRgb(palette[pi], brightness);
    }
    const pixelCount = size * size;
    const pixels = new Int32Array(pixelCount);
    if (size === sprite.subWidth) {
      for (let pixelIndex = 0; pixelIndex < pixelCount; pixelIndex++) {
        const paletteIndex = palettePixels[pixelIndex];
        pixels[pixelIndex] = palette[paletteIndex];
      }
    } else if (sprite.subWidth === 64 && size === 128) {
      let pixelIndex = 0;
      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          const paletteIndex = palettePixels[(x >> 1 << 6) + (y >> 1)];
          pixels[pixelIndex++] = palette[paletteIndex];
        }
      }
    } else {
      if (sprite.subWidth !== 128 || size !== 64) {
        throw new Error("Texture sprite has unexpected size");
      }
      let pixelIndex = 0;
      for (let x = 0; x < size; x++) {
        for (let y = 0; y < size; y++) {
          const paletteIndex = palettePixels[(y << 1) + (x << 1 << 7)];
          pixels[pixelIndex++] = palette[paletteIndex];
        }
      }
    }
    return pixels;
  }
  getPixelsArgb(id, size, flipH, brightness) {
    return this.getPixelsRgb(id, size, flipH, brightness);
  }
  loadTextureSprite(id) {
    let sprite = this.textureSprites[id];
    if (!sprite) {
      sprite = this.textureSprites[id] = SpriteLoader.loadIndexedSpriteDat(
        this.textureArchive,
        id.toString(),
        0
      );
      sprite.normalize();
      const palette = sprite.palette;
      const alphaPaletteIndices = /* @__PURE__ */ new Set();
      for (let pi = 0; pi < palette.length; pi++) {
        if (palette[pi] === 0) {
          alphaPaletteIndices.add(pi);
        }
      }
      const isTransparent = sprite.pixels.findIndex((pi) => alphaPaletteIndices.has(pi)) !== -1;
      this.transparentTextureMap.set(id, isTransparent);
    }
    return sprite;
  }
};

// ../rs-party-dashboard/src/rs/cache/loader/DatCacheLoaderFactory.ts
function loadMapSprites(mediaArchive, name) {
  const sprites = new Array();
  for (let i = 0; i < 100; i++) {
    try {
      sprites[i] = SpriteLoader.loadIndexedSpriteDat(mediaArchive, name, i);
    } catch (e) {
      break;
    }
  }
  return sprites;
}
function loadMapScenes(mediaArchive) {
  return loadMapSprites(mediaArchive, "mapscene");
}
function loadMapFunctions(mediaArchive) {
  return loadMapSprites(mediaArchive, "mapfunction");
}
var DatCacheLoaderFactory = class {
  constructor(cacheInfo, cacheType, cacheSystem) {
    this.cacheInfo = cacheInfo;
    this.cacheType = cacheType;
    this.cacheSystem = cacheSystem;
    this.configIndex = cacheSystem.getIndex(IndexType.DAT.configs);
    this.configArchive = this.configIndex.getArchive(ConfigType.DAT.configs);
    this.mediaArchive = this.configIndex.getArchive(ConfigType.DAT.media);
  }
  getFloTypeLoader() {
    if (!this.floTypeLoader) {
      this.floTypeLoader = DatFloorTypeLoader.load(this.cacheInfo, this.configArchive);
    }
    return this.floTypeLoader;
  }
  getUnderlayTypeLoader() {
    return this.getFloTypeLoader();
  }
  getOverlayTypeLoader() {
    return this.getFloTypeLoader();
  }
  getVarBitTypeLoader() {
    if (this.cacheInfo.revision < 254) {
      return new DummyVarBitTypeLoader(this.cacheInfo);
    }
    return DatVarBitTypeLoader.load(this.cacheInfo, this.configArchive);
  }
  getLocTypeLoader() {
    return DatLocTypeLoader.load(this.cacheInfo, this.configArchive);
  }
  getNpcTypeLoader() {
    return DatNpcTypeLoader.load(this.cacheInfo, this.configArchive);
  }
  getObjTypeLoader() {
    return DatObjTypeLoader.load(this.cacheInfo, this.configArchive);
  }
  getSpotAnimTypeLoader() {
    return new DummyTypeLoader(this.cacheInfo, SpotAnimType);
  }
  getSeqTypeLoader() {
    return DatSeqTypeLoader.load(this.cacheInfo, this.configArchive);
  }
  getBasTypeLoader() {
    return new DummyBasTypeLoader(this.cacheInfo);
  }
  getQuestTypeLoader() {
    return void 0;
  }
  getTextureLoader() {
    const textureArchive = this.configIndex.getArchive(ConfigType.DAT.textures);
    const animatedTextureIds = [DatTextureLoader.WATER_DROPLETS_TEXTURE_ID, 24];
    if (this.cacheInfo.revision > 289) {
      animatedTextureIds.push(34, 40);
    }
    return new DatTextureLoader(textureArchive, animatedTextureIds);
  }
  getModelLoader() {
    const modelIndex = this.cacheSystem.getIndex(IndexType.DAT.models);
    return new IndexModelLoader(modelIndex);
  }
  getSeqFrameLoader() {
    const seqFrameIndex = this.cacheSystem.getIndex(IndexType.DAT.animations);
    return DatSeqFrameLoader.load(seqFrameIndex);
  }
  getSkeletalSeqLoader() {
    return void 0;
  }
  getMapFileLoader() {
    const mapIndex = this.cacheSystem.getIndex(IndexType.DAT.maps);
    const versionListArchive = this.configIndex.getArchive(ConfigType.DAT.versionList);
    const mapFileIndex = DatMapFileIndex.load(versionListArchive);
    return new MapFileLoader(mapIndex, mapFileIndex);
  }
  getMapScenes() {
    return loadMapScenes(this.mediaArchive);
  }
  getMapFunctions() {
    return loadMapFunctions(this.mediaArchive);
  }
};

// ../rs-party-dashboard/src/rs/cache/loader/LegacyCacheLoaderFactory.ts
var LegacyCacheLoaderFactory = class {
  constructor(cacheInfo, cacheSystem) {
    this.cacheInfo = cacheInfo;
    this.cacheSystem = cacheSystem;
    this.configIndex = cacheSystem.getIndex(IndexType.LEGACY.configs);
    this.configArchive = this.configIndex.getArchive(0);
    this.mediaIndex = cacheSystem.getIndex(IndexType.LEGACY.media);
    this.mediaArchive = this.mediaIndex.getArchive(0);
    this.textureIndex = cacheSystem.getIndex(IndexType.LEGACY.textures);
    this.textureArchive = this.textureIndex.getArchive(0);
    this.modelIndex = cacheSystem.getIndex(IndexType.LEGACY.models);
    this.modelArchive = this.modelIndex.getArchive(0);
    this.mapIndex = cacheSystem.getIndex(IndexType.LEGACY.maps);
  }
  getFloTypeLoader() {
    if (!this.floTypeLoader) {
      this.floTypeLoader = DatFloorTypeLoader.load(this.cacheInfo, this.configArchive);
    }
    return this.floTypeLoader;
  }
  getUnderlayTypeLoader() {
    return this.getFloTypeLoader();
  }
  getOverlayTypeLoader() {
    return this.getFloTypeLoader();
  }
  getVarBitTypeLoader() {
    return new DummyVarBitTypeLoader(this.cacheInfo);
  }
  getLocTypeLoader() {
    return DatLocTypeLoader.load(this.cacheInfo, this.configArchive);
  }
  getNpcTypeLoader() {
    return DatNpcTypeLoader.load(this.cacheInfo, this.configArchive);
  }
  getObjTypeLoader() {
    return DatObjTypeLoader.load(this.cacheInfo, this.configArchive);
  }
  getSpotAnimTypeLoader() {
    return new DummyTypeLoader(this.cacheInfo, SpotAnimType);
  }
  getSeqTypeLoader() {
    return DatSeqTypeLoader.load(this.cacheInfo, this.configArchive);
  }
  getBasTypeLoader() {
    return new DummyBasTypeLoader(this.cacheInfo);
  }
  getQuestTypeLoader() {
    return void 0;
  }
  getTextureLoader() {
    const animatedTextureIds = [DatTextureLoader.WATER_DROPLETS_TEXTURE_ID, 24];
    return new DatTextureLoader(this.textureArchive, animatedTextureIds);
  }
  getModelLoader() {
    return LegacyModelLoader.load(this.modelArchive);
  }
  getSeqFrameLoader() {
    return LegacySeqFrameLoader.load(this.modelArchive);
  }
  getSkeletalSeqLoader() {
    return void 0;
  }
  getMapFileLoader() {
    return new LegacyMapFileLoader(this.mapIndex, new Dat2MapIndex(this.mapIndex));
  }
  getMapScenes() {
    return loadMapScenes(this.mediaArchive);
  }
  getMapFunctions() {
    return loadMapFunctions(this.mediaArchive);
  }
};

// ../rs-party-dashboard/src/rs/cache/loader/CacheLoaderFactory.ts
function getCacheLoaderFactory(cacheInfo, cacheSystem) {
  const cacheType = detectCacheType(cacheInfo);
  switch (cacheType) {
    case "legacy":
      return new LegacyCacheLoaderFactory(cacheInfo, cacheSystem);
    case "dat":
      return new DatCacheLoaderFactory(cacheInfo, cacheType, cacheSystem);
    case "dat2":
      return new Dat2CacheLoaderFactory(cacheInfo, cacheType, cacheSystem);
  }
  throw new Error("Not implemented");
}

// ../rs-party-dashboard/src/rs/config/loctype/LocModelLoader.ts
var LocModelLoader = class _LocModelLoader {
  constructor(locTypeLoader, modelLoader, textureLoader, seqTypeLoader, seqFrameLoader, skeletalSeqLoader) {
    this.locTypeLoader = locTypeLoader;
    this.modelLoader = modelLoader;
    this.textureLoader = textureLoader;
    this.seqTypeLoader = seqTypeLoader;
    this.seqFrameLoader = seqFrameLoader;
    this.skeletalSeqLoader = skeletalSeqLoader;
    this.modelDataCache = /* @__PURE__ */ new Map();
    this.entityCache = /* @__PURE__ */ new Map();
    this.modelCache = /* @__PURE__ */ new Map();
  }
  static {
    this.mergeLocModelsCache = new Array(4);
  }
  getModelData(id, mirrored) {
    let key = id;
    if (mirrored) {
      key += 65536;
    }
    let model = this.modelDataCache.get(key);
    if (!model) {
      model = this.modelLoader.getModel(id);
      if (model) {
        if (mirrored) {
          model.mirror();
        }
        this.modelDataCache.set(key, model);
      }
    }
    return model;
  }
  getLocModelData(locType, type, rotation) {
    let model;
    const isMirrored = locType.isRotated || type === 2 /* WALL_CORNER */ && rotation > 3;
    if (!locType.types) {
      if (type !== 10 /* NORMAL */) {
        return void 0;
      }
      if (!locType.models || locType.models.length === 0) {
        return void 0;
      }
      const modelCount = locType.models[0].length;
      for (let i = 0; i < modelCount; i++) {
        const modelId = locType.models[0][i];
        model = this.getModelData(modelId, isMirrored);
        if (!model) {
          return void 0;
        }
        if (modelCount > 1) {
          _LocModelLoader.mergeLocModelsCache[i] = model;
        }
      }
      if (modelCount > 1) {
        model = ModelData.merge(_LocModelLoader.mergeLocModelsCache, modelCount);
      }
    } else {
      let index = -1;
      for (let i = 0; i < locType.types.length; i++) {
        if (locType.types[i] === type) {
          index = i;
          break;
        }
      }
      if (index === -1) {
        return void 0;
      }
      const modelIds = locType.models[index];
      const modelCount = modelIds.length;
      for (let i = 0; i < modelCount; i++) {
        const modelId = modelIds[i];
        model = this.getModelData(modelId, isMirrored);
        if (!model) {
          return void 0;
        }
        if (modelCount > 1) {
          _LocModelLoader.mergeLocModelsCache[i] = model;
        }
      }
      if (modelCount > 1) {
        model = ModelData.merge(_LocModelLoader.mergeLocModelsCache, modelCount);
      }
    }
    if (!model) {
      return void 0;
    }
    const hasResize = locType.modelSizeX !== 128 || locType.modelSizeHeight !== 128 || locType.modelSizeY !== 128;
    const hasOffset = locType.offsetX !== 0 || locType.offsetHeight !== 0 || locType.offsetY !== 0;
    const copy = ModelData.copyFrom(
      model,
      true,
      rotation === 0 && !hasResize && !hasOffset,
      !locType.recolorFrom,
      false
    );
    if (type === 4 /* WALL_DECORATION_INSIDE */ && rotation > 3) {
      copy.rotate(256);
      copy.translate(45, 0, -45);
    }
    rotation &= 3;
    if (rotation === 1) {
      copy.rotate90();
    } else if (rotation === 2) {
      copy.rotate180();
    } else if (rotation === 3) {
      copy.rotate270();
    }
    if (locType.recolorFrom) {
      const retexture = locType.cacheInfo.game === "runescape" && locType.cacheInfo.revision <= 464;
      for (let i = 0; i < locType.recolorFrom.length; i++) {
        copy.recolor(locType.recolorFrom[i], locType.recolorTo[i]);
        if (retexture) {
          copy.retexture(locType.recolorFrom[i], locType.recolorTo[i]);
        }
      }
    }
    if (locType.retextureFrom) {
      for (let i = 0; i < locType.retextureFrom.length; i++) {
        copy.retexture(locType.retextureFrom[i], locType.retextureTo[i]);
      }
    }
    if (hasResize) {
      copy.resize(locType.modelSizeX, locType.modelSizeHeight, locType.modelSizeY);
    }
    if (hasOffset) {
      copy.translate(locType.offsetX, locType.offsetHeight, locType.offsetY);
    }
    return copy;
  }
  getModel(locType, type, rotation, contourGroundInfo) {
    let key;
    if (locType.types) {
      key = rotation + (type << 3) + (locType.id << 10);
    } else {
      key = rotation + (locType.id << 10);
    }
    let model = this.entityCache.get(key);
    if (!model) {
      const modelData = this.getLocModelData(locType, type, rotation);
      if (!modelData) {
        return void 0;
      }
      const isDiagonal = type === 10 /* NORMAL */ && rotation > 3;
      if (isDiagonal) {
        modelData.rotate(256);
      }
      if (!locType.mergeNormals) {
        model = modelData.light(
          this.textureLoader,
          locType.ambient + 64,
          locType.contrast + 768,
          -50,
          -10,
          -50
        );
      } else {
        let ambient = 64;
        let constrast = 768;
        const ignoreLocLighting = locType.cacheInfo.game === "runescape" && locType.cacheInfo.revision <= 445;
        if (!ignoreLocLighting) {
          ambient += locType.ambient;
          constrast += locType.contrast;
        }
        modelData.ambient = ambient;
        modelData.contrast = constrast;
        modelData.calculateVertexNormals();
        model = modelData;
      }
      this.entityCache.set(key, model);
    }
    if (locType.mergeNormals) {
      model = model.copy();
    }
    if (locType.contourGroundType !== 0 && contourGroundInfo) {
      model = model.contourGround(
        contourGroundInfo.type,
        contourGroundInfo.param,
        contourGroundInfo.heightMap,
        contourGroundInfo.heightMapAbove,
        contourGroundInfo.entityX,
        contourGroundInfo.entityY,
        contourGroundInfo.entityZ
      );
    }
    return model;
  }
  getModelAnimated(locType, type, rotation, seqId, frame, contourGroundInfo) {
    let key;
    if (locType.types) {
      key = rotation + (type << 3) + (locType.id << 10);
    } else {
      key = rotation + (locType.id << 10);
    }
    let model = this.modelCache.get(key);
    if (!model) {
      const modelData = this.getLocModelData(locType, type, rotation);
      if (!modelData) {
        return void 0;
      }
      model = modelData.light(
        this.textureLoader,
        locType.ambient + 64,
        locType.contrast + 768,
        -50,
        -10,
        -50
      );
      this.modelCache.set(key, model);
    }
    if (seqId !== -1 && frame !== -1) {
      const seqType = this.seqTypeLoader.load(seqId);
      model = this.transformModel(model, seqType, frame, rotation);
    }
    const isDiagonal = type === 10 /* NORMAL */ && rotation > 3;
    if (isDiagonal) {
      model.rotate(256);
    }
    if (locType.contourGroundType !== 0 && contourGroundInfo) {
      model = model.contourGround(
        contourGroundInfo.type,
        contourGroundInfo.param,
        contourGroundInfo.heightMap,
        contourGroundInfo.heightMapAbove,
        contourGroundInfo.entityX,
        contourGroundInfo.entityY,
        contourGroundInfo.entityZ
      );
    }
    return model;
  }
  transformModel(model, seqType, frame, rotation) {
    if (seqType.isSkeletalSeq()) {
      const skeletalSeq = this.skeletalSeqLoader?.load(seqType.skeletalId);
      if (!skeletalSeq) {
        return Model.copyAnimated(model, true, true);
      }
      model = Model.copyAnimated(model, !skeletalSeq.hasAlphaTransform, true);
      rotation &= 3;
      if (rotation === 1) {
        model.rotate270();
      } else if (rotation === 2) {
        model.rotate180();
      } else if (rotation === 3) {
        model.rotate90();
      }
      model.animateSkeletal(skeletalSeq, frame);
      if (rotation === 1) {
        model.rotate90();
      } else if (rotation === 2) {
        model.rotate180();
      } else if (rotation === 3) {
        model.rotate270();
      }
      return model;
    } else {
      if (!seqType.frameIds || seqType.frameIds.length === 0) {
        return model;
      }
      const seqFrame = this.seqFrameLoader.load(seqType.frameIds[frame]);
      if (seqFrame) {
        model = Model.copyAnimated(
          model,
          !seqFrame.hasAlphaTransform,
          !seqFrame.hasColorTransform
        );
        rotation &= 3;
        if (rotation === 1) {
          model.rotate270();
        } else if (rotation === 2) {
          model.rotate180();
        } else if (rotation === 3) {
          model.rotate90();
        }
        model.animate(seqFrame, void 0, seqType.op14);
        if (rotation === 1) {
          model.rotate90();
        } else if (rotation === 2) {
          model.rotate180();
        } else if (rotation === 3) {
          model.rotate270();
        }
      }
      return model;
    }
  }
  clearCache() {
    this.modelDataCache.clear();
    this.entityCache.clear();
    this.modelCache.clear();
  }
};

// ../rs-party-dashboard/src/rs/graphics/Rasterizer3D.ts
var Rasterizer3D = class _Rasterizer3D {
  static {
    this.lowMem = false;
  }
  static {
    this.rasterClipEnable = false;
  }
  static {
    this.rasterGouraudLowRes = true;
  }
  static {
    this.rasterAlpha = 0;
  }
  static {
    this.rasterClipY = new Int32Array(1024);
  }
  static {
    this.endX = 0;
  }
  static {
    this.endY = 0;
  }
  static {
    this.centerX = 0;
  }
  static {
    this.centerY = 0;
  }
  static {
    this.viewportLeft = 0;
  }
  static {
    this.viewportRight = 0;
  }
  static {
    this.viewportTop = 0;
  }
  static {
    this.viewportBottom = 0;
  }
  static setClip() {
    _Rasterizer3D.setRasterClip(
      Rasterizer2D.xClipStart,
      Rasterizer2D.yClipStart,
      Rasterizer2D.xClipEnd,
      Rasterizer2D.yClipEnd
    );
  }
  static setRasterClip(xClipStart, yClipStart, xClipEnd, yClipEnd) {
    _Rasterizer3D.endX = xClipEnd - xClipStart;
    _Rasterizer3D.endY = yClipEnd - yClipStart;
    _Rasterizer3D.calculateViewport();
    if (_Rasterizer3D.endY > _Rasterizer3D.rasterClipY.length) {
      _Rasterizer3D.rasterClipY = new Int32Array(nextPow2(_Rasterizer3D.endY));
    }
    let v = xClipStart + Rasterizer2D.width * yClipStart;
    for (let i = 0; i < _Rasterizer3D.endY; i++) {
      _Rasterizer3D.rasterClipY[i] = v;
      v += Rasterizer2D.width;
    }
  }
  static calculateViewport() {
    _Rasterizer3D.centerX = _Rasterizer3D.endX / 2 | 0;
    _Rasterizer3D.centerY = _Rasterizer3D.endY / 2 | 0;
    _Rasterizer3D.viewportLeft = -_Rasterizer3D.centerX;
    _Rasterizer3D.viewportRight = _Rasterizer3D.endX - _Rasterizer3D.centerX;
    _Rasterizer3D.viewportTop = -_Rasterizer3D.centerY;
    _Rasterizer3D.viewportBottom = _Rasterizer3D.endY - _Rasterizer3D.centerY;
  }
  static setViewport(x, y) {
    const offset = _Rasterizer3D.rasterClipY[0];
    const i_136_ = offset / Rasterizer2D.width | 0;
    const i_137_ = offset - i_136_ * Rasterizer2D.width;
    _Rasterizer3D.centerX = x - i_137_;
    _Rasterizer3D.centerY = y - i_136_;
    _Rasterizer3D.viewportLeft = -_Rasterizer3D.centerX;
    _Rasterizer3D.viewportRight = _Rasterizer3D.endX - _Rasterizer3D.centerX;
    _Rasterizer3D.viewportTop = -_Rasterizer3D.centerY;
    _Rasterizer3D.viewportBottom = _Rasterizer3D.endY - _Rasterizer3D.centerY;
  }
  static rasterGouraud(y0, y1, y2, x0, x1, x2, hsl0, hsl1, hsl2) {
    let var9 = x1 - x0;
    let var10 = y1 - y0;
    let var11 = x2 - x0;
    let var12 = y2 - y0;
    let var13 = hsl1 - hsl0;
    let var14 = hsl2 - hsl0;
    let var15;
    if (y2 !== y1) {
      var15 = (x2 - x1 << 14) / (y2 - y1) | 0;
    } else {
      var15 = 0;
    }
    let var16;
    if (y0 !== y1) {
      var16 = (var9 << 14) / var10 | 0;
    } else {
      var16 = 0;
    }
    let var17;
    if (y0 !== y2) {
      var17 = (var11 << 14) / var12 | 0;
    } else {
      var17 = 0;
    }
    const var18 = var9 * var12 - var11 * var10;
    if (var18 !== 0) {
      const var19 = (var13 * var12 - var14 * var10 << 8) / var18 | 0;
      const var20 = (var14 * var9 - var13 * var11 << 8) / var18 | 0;
      if (y0 <= y1 && y0 <= y2) {
        if (y0 < _Rasterizer3D.endY) {
          if (y1 > _Rasterizer3D.endY) {
            y1 = _Rasterizer3D.endY;
          }
          if (y2 > _Rasterizer3D.endY) {
            y2 = _Rasterizer3D.endY;
          }
          hsl0 = var19 + ((hsl0 << 8) - x0 * var19);
          if (y1 < y2) {
            x2 = x0 <<= 14;
            if (y0 < 0) {
              x2 -= y0 * var17;
              x0 -= y0 * var16;
              hsl0 -= y0 * var20;
              y0 = 0;
            }
            x1 <<= 14;
            if (y1 < 0) {
              x1 -= var15 * y1;
              y1 = 0;
            }
            if (y0 !== y1 && var17 < var16 || y0 === y1 && var17 > var15) {
              y2 -= y1;
              y1 -= y0;
              y0 = _Rasterizer3D.rasterClipY[y0];
              while (true) {
                --y1;
                if (y1 < 0) {
                  while (true) {
                    --y2;
                    if (y2 < 0) {
                      return;
                    }
                    _Rasterizer3D.rasterGouraudLine(
                      Rasterizer2D.pixels,
                      y0,
                      x2 >> 14,
                      x1 >> 14,
                      hsl0,
                      var19
                    );
                    x2 += var17;
                    x1 += var15;
                    hsl0 += var20;
                    y0 += Rasterizer2D.width;
                  }
                }
                _Rasterizer3D.rasterGouraudLine(
                  Rasterizer2D.pixels,
                  y0,
                  x2 >> 14,
                  x0 >> 14,
                  hsl0,
                  var19
                );
                x2 += var17;
                x0 += var16;
                hsl0 += var20;
                y0 += Rasterizer2D.width;
              }
            } else {
              y2 -= y1;
              y1 -= y0;
              y0 = _Rasterizer3D.rasterClipY[y0];
              while (true) {
                --y1;
                if (y1 < 0) {
                  while (true) {
                    --y2;
                    if (y2 < 0) {
                      return;
                    }
                    _Rasterizer3D.rasterGouraudLine(
                      Rasterizer2D.pixels,
                      y0,
                      x1 >> 14,
                      x2 >> 14,
                      hsl0,
                      var19
                    );
                    x2 += var17;
                    x1 += var15;
                    hsl0 += var20;
                    y0 += Rasterizer2D.width;
                  }
                }
                _Rasterizer3D.rasterGouraudLine(
                  Rasterizer2D.pixels,
                  y0,
                  x0 >> 14,
                  x2 >> 14,
                  hsl0,
                  var19
                );
                x2 += var17;
                x0 += var16;
                hsl0 += var20;
                y0 += Rasterizer2D.width;
              }
            }
          } else {
            x1 = x0 <<= 14;
            if (y0 < 0) {
              x1 -= y0 * var17;
              x0 -= y0 * var16;
              hsl0 -= y0 * var20;
              y0 = 0;
            }
            x2 <<= 14;
            if (y2 < 0) {
              x2 -= var15 * y2;
              y2 = 0;
            }
            if (y0 !== y2 && var17 < var16 || y0 === y2 && var15 > var16) {
              y1 -= y2;
              y2 -= y0;
              y0 = _Rasterizer3D.rasterClipY[y0];
              while (true) {
                --y2;
                if (y2 < 0) {
                  while (true) {
                    --y1;
                    if (y1 < 0) {
                      return;
                    }
                    _Rasterizer3D.rasterGouraudLine(
                      Rasterizer2D.pixels,
                      y0,
                      x2 >> 14,
                      x0 >> 14,
                      hsl0,
                      var19
                    );
                    x2 += var15;
                    x0 += var16;
                    hsl0 += var20;
                    y0 += Rasterizer2D.width;
                  }
                }
                _Rasterizer3D.rasterGouraudLine(
                  Rasterizer2D.pixels,
                  y0,
                  x1 >> 14,
                  x0 >> 14,
                  hsl0,
                  var19
                );
                x1 += var17;
                x0 += var16;
                hsl0 += var20;
                y0 += Rasterizer2D.width;
              }
            } else {
              y1 -= y2;
              y2 -= y0;
              y0 = _Rasterizer3D.rasterClipY[y0];
              while (true) {
                --y2;
                if (y2 < 0) {
                  while (true) {
                    --y1;
                    if (y1 < 0) {
                      return;
                    }
                    _Rasterizer3D.rasterGouraudLine(
                      Rasterizer2D.pixels,
                      y0,
                      x0 >> 14,
                      x2 >> 14,
                      hsl0,
                      var19
                    );
                    x2 += var15;
                    x0 += var16;
                    hsl0 += var20;
                    y0 += Rasterizer2D.width;
                  }
                }
                _Rasterizer3D.rasterGouraudLine(
                  Rasterizer2D.pixels,
                  y0,
                  x0 >> 14,
                  x1 >> 14,
                  hsl0,
                  var19
                );
                x1 += var17;
                x0 += var16;
                hsl0 += var20;
                y0 += Rasterizer2D.width;
              }
            }
          }
        }
      } else if (y1 <= y2) {
        if (y1 < _Rasterizer3D.endY) {
          if (y2 > _Rasterizer3D.endY) {
            y2 = _Rasterizer3D.endY;
          }
          if (y0 > _Rasterizer3D.endY) {
            y0 = _Rasterizer3D.endY;
          }
          hsl1 = var19 + ((hsl1 << 8) - var19 * x1);
          if (y2 < y0) {
            x0 = x1 <<= 14;
            if (y1 < 0) {
              x0 -= var16 * y1;
              x1 -= var15 * y1;
              hsl1 -= var20 * y1;
              y1 = 0;
            }
            x2 <<= 14;
            if (y2 < 0) {
              x2 -= var17 * y2;
              y2 = 0;
            }
            if (y2 !== y1 && var16 < var15 || y2 === y1 && var16 > var17) {
              y0 -= y2;
              y2 -= y1;
              y1 = _Rasterizer3D.rasterClipY[y1];
              while (true) {
                --y2;
                if (y2 < 0) {
                  while (true) {
                    --y0;
                    if (y0 < 0) {
                      return;
                    }
                    _Rasterizer3D.rasterGouraudLine(
                      Rasterizer2D.pixels,
                      y1,
                      x0 >> 14,
                      x2 >> 14,
                      hsl1,
                      var19
                    );
                    x0 += var16;
                    x2 += var17;
                    hsl1 += var20;
                    y1 += Rasterizer2D.width;
                  }
                }
                _Rasterizer3D.rasterGouraudLine(
                  Rasterizer2D.pixels,
                  y1,
                  x0 >> 14,
                  x1 >> 14,
                  hsl1,
                  var19
                );
                x0 += var16;
                x1 += var15;
                hsl1 += var20;
                y1 += Rasterizer2D.width;
              }
            } else {
              y0 -= y2;
              y2 -= y1;
              y1 = _Rasterizer3D.rasterClipY[y1];
              while (true) {
                --y2;
                if (y2 < 0) {
                  while (true) {
                    --y0;
                    if (y0 < 0) {
                      return;
                    }
                    _Rasterizer3D.rasterGouraudLine(
                      Rasterizer2D.pixels,
                      y1,
                      x2 >> 14,
                      x0 >> 14,
                      hsl1,
                      var19
                    );
                    x0 += var16;
                    x2 += var17;
                    hsl1 += var20;
                    y1 += Rasterizer2D.width;
                  }
                }
                _Rasterizer3D.rasterGouraudLine(
                  Rasterizer2D.pixels,
                  y1,
                  x1 >> 14,
                  x0 >> 14,
                  hsl1,
                  var19
                );
                x0 += var16;
                x1 += var15;
                hsl1 += var20;
                y1 += Rasterizer2D.width;
              }
            }
          } else {
            x2 = x1 <<= 14;
            if (y1 < 0) {
              x2 -= var16 * y1;
              x1 -= var15 * y1;
              hsl1 -= var20 * y1;
              y1 = 0;
            }
            x0 <<= 14;
            if (y0 < 0) {
              x0 -= y0 * var17;
              y0 = 0;
            }
            if (var16 < var15) {
              y2 -= y0;
              y0 -= y1;
              y1 = _Rasterizer3D.rasterClipY[y1];
              while (true) {
                --y0;
                if (y0 < 0) {
                  while (true) {
                    --y2;
                    if (y2 < 0) {
                      return;
                    }
                    _Rasterizer3D.rasterGouraudLine(
                      Rasterizer2D.pixels,
                      y1,
                      x0 >> 14,
                      x1 >> 14,
                      hsl1,
                      var19
                    );
                    x0 += var17;
                    x1 += var15;
                    hsl1 += var20;
                    y1 += Rasterizer2D.width;
                  }
                }
                _Rasterizer3D.rasterGouraudLine(
                  Rasterizer2D.pixels,
                  y1,
                  x2 >> 14,
                  x1 >> 14,
                  hsl1,
                  var19
                );
                x2 += var16;
                x1 += var15;
                hsl1 += var20;
                y1 += Rasterizer2D.width;
              }
            } else {
              y2 -= y0;
              y0 -= y1;
              y1 = _Rasterizer3D.rasterClipY[y1];
              while (true) {
                --y0;
                if (y0 < 0) {
                  while (true) {
                    --y2;
                    if (y2 < 0) {
                      return;
                    }
                    _Rasterizer3D.rasterGouraudLine(
                      Rasterizer2D.pixels,
                      y1,
                      x1 >> 14,
                      x0 >> 14,
                      hsl1,
                      var19
                    );
                    x0 += var17;
                    x1 += var15;
                    hsl1 += var20;
                    y1 += Rasterizer2D.width;
                  }
                }
                _Rasterizer3D.rasterGouraudLine(
                  Rasterizer2D.pixels,
                  y1,
                  x1 >> 14,
                  x2 >> 14,
                  hsl1,
                  var19
                );
                x2 += var16;
                x1 += var15;
                hsl1 += var20;
                y1 += Rasterizer2D.width;
              }
            }
          }
        }
      } else if (y2 < _Rasterizer3D.endY) {
        if (y0 > _Rasterizer3D.endY) {
          y0 = _Rasterizer3D.endY;
        }
        if (y1 > _Rasterizer3D.endY) {
          y1 = _Rasterizer3D.endY;
        }
        hsl2 = var19 + ((hsl2 << 8) - x2 * var19);
        if (y0 < y1) {
          x1 = x2 <<= 14;
          if (y2 < 0) {
            x1 -= var15 * y2;
            x2 -= var17 * y2;
            hsl2 -= var20 * y2;
            y2 = 0;
          }
          x0 <<= 14;
          if (y0 < 0) {
            x0 -= y0 * var16;
            y0 = 0;
          }
          if (var15 < var17) {
            y1 -= y0;
            y0 -= y2;
            y2 = _Rasterizer3D.rasterClipY[y2];
            while (true) {
              --y0;
              if (y0 < 0) {
                while (true) {
                  --y1;
                  if (y1 < 0) {
                    return;
                  }
                  _Rasterizer3D.rasterGouraudLine(
                    Rasterizer2D.pixels,
                    y2,
                    x1 >> 14,
                    x0 >> 14,
                    hsl2,
                    var19
                  );
                  x1 += var15;
                  x0 += var16;
                  hsl2 += var20;
                  y2 += Rasterizer2D.width;
                }
              }
              _Rasterizer3D.rasterGouraudLine(
                Rasterizer2D.pixels,
                y2,
                x1 >> 14,
                x2 >> 14,
                hsl2,
                var19
              );
              x1 += var15;
              x2 += var17;
              hsl2 += var20;
              y2 += Rasterizer2D.width;
            }
          } else {
            y1 -= y0;
            y0 -= y2;
            y2 = _Rasterizer3D.rasterClipY[y2];
            while (true) {
              --y0;
              if (y0 < 0) {
                while (true) {
                  --y1;
                  if (y1 < 0) {
                    return;
                  }
                  _Rasterizer3D.rasterGouraudLine(
                    Rasterizer2D.pixels,
                    y2,
                    x0 >> 14,
                    x1 >> 14,
                    hsl2,
                    var19
                  );
                  x1 += var15;
                  x0 += var16;
                  hsl2 += var20;
                  y2 += Rasterizer2D.width;
                }
              }
              _Rasterizer3D.rasterGouraudLine(
                Rasterizer2D.pixels,
                y2,
                x2 >> 14,
                x1 >> 14,
                hsl2,
                var19
              );
              x1 += var15;
              x2 += var17;
              hsl2 += var20;
              y2 += Rasterizer2D.width;
            }
          }
        } else {
          x0 = x2 <<= 14;
          if (y2 < 0) {
            x0 -= var15 * y2;
            x2 -= var17 * y2;
            hsl2 -= var20 * y2;
            y2 = 0;
          }
          x1 <<= 14;
          if (y1 < 0) {
            x1 -= var16 * y1;
            y1 = 0;
          }
          if (var15 < var17) {
            y0 -= y1;
            y1 -= y2;
            y2 = _Rasterizer3D.rasterClipY[y2];
            while (true) {
              --y1;
              if (y1 < 0) {
                while (true) {
                  --y0;
                  if (y0 < 0) {
                    return;
                  }
                  _Rasterizer3D.rasterGouraudLine(
                    Rasterizer2D.pixels,
                    y2,
                    x1 >> 14,
                    x2 >> 14,
                    hsl2,
                    var19
                  );
                  x1 += var16;
                  x2 += var17;
                  hsl2 += var20;
                  y2 += Rasterizer2D.width;
                }
              }
              _Rasterizer3D.rasterGouraudLine(
                Rasterizer2D.pixels,
                y2,
                x0 >> 14,
                x2 >> 14,
                hsl2,
                var19
              );
              x0 += var15;
              x2 += var17;
              hsl2 += var20;
              y2 += Rasterizer2D.width;
            }
          } else {
            y0 -= y1;
            y1 -= y2;
            y2 = _Rasterizer3D.rasterClipY[y2];
            while (true) {
              --y1;
              if (y1 < 0) {
                while (true) {
                  --y0;
                  if (y0 < 0) {
                    return;
                  }
                  _Rasterizer3D.rasterGouraudLine(
                    Rasterizer2D.pixels,
                    y2,
                    x2 >> 14,
                    x1 >> 14,
                    hsl2,
                    var19
                  );
                  x1 += var16;
                  x2 += var17;
                  hsl2 += var20;
                  y2 += Rasterizer2D.width;
                }
              }
              _Rasterizer3D.rasterGouraudLine(
                Rasterizer2D.pixels,
                y2,
                x2 >> 14,
                x0 >> 14,
                hsl2,
                var19
              );
              x0 += var15;
              x2 += var17;
              hsl2 += var20;
              y2 += Rasterizer2D.width;
            }
          }
        }
      }
    }
  }
  static rasterGouraudLine(pixels, offset, startX, endX, hslIndex, grad) {
    if (_Rasterizer3D.rasterClipEnable) {
      if (endX > this.endX) {
        endX = this.endX;
      }
      if (startX < 0) {
        startX = 0;
      }
    }
    if (startX >= endX) {
      return;
    }
    offset += startX;
    hslIndex += startX * grad;
    if (_Rasterizer3D.rasterGouraudLowRes) {
      throw new Error("Not implemented");
    } else {
      let loops = endX - startX;
      if (_Rasterizer3D.rasterAlpha === 0) {
        do {
          pixels[offset++] = HSL_RGB_MAP[hslIndex >> 8];
          hslIndex += grad;
          loops--;
        } while (loops > 0);
      } else {
        const srcAlpha = _Rasterizer3D.rasterAlpha;
        const dstAlpha = 256 - _Rasterizer3D.rasterAlpha;
        do {
          let color = HSL_RGB_MAP[hslIndex >> 8];
          hslIndex += grad;
          color = (dstAlpha * (color & 65280) >> 8 & 65280) + (dstAlpha * (color & 16711935) >> 8 & 16711935);
          const src = pixels[offset];
          pixels[offset++] = ((src & 16711935) * srcAlpha >> 8 & 16711935) + (srcAlpha * (src & 65280) >> 8 & 65280) + color;
          loops--;
        } while (loops > 0);
      }
    }
  }
};

// ../rs-party-dashboard/src/rs/scene/entity/EntityTag.ts
function calculateEntityTag(tileX, tileY, entityType, notInteractive, id) {
  let tag = BigInt(tileX & 127) | BigInt(tileY & 127) << 7n | BigInt(entityType & 3) << 14n | BigInt(id) << 17n;
  if (notInteractive) {
    tag |= 0x10000n;
  }
  return tag;
}
function isEntityInteractive(tag) {
  let interactive = tag !== 0n;
  if (interactive) {
    interactive = (Number(tag >> 16n) & 1) === 0;
  }
  return interactive;
}
function getIdFromTag(tag) {
  return Number(tag >> 17n);
}
function getEntityTypeFromTag(tag) {
  return Number(tag >> 14n) & 3;
}

// ../rs-party-dashboard/src/rs/sprite/SpritePixels.ts
var SpritePixels = class _SpritePixels {
  static fromPixels(pixels, width, height) {
    const sprite = new _SpritePixels();
    sprite.pixels = pixels;
    sprite.subWidth = sprite.width = width;
    sprite.subHeight = sprite.height = height;
    sprite.yOffset = 0;
    sprite.xOffset = 0;
    return sprite;
  }
  static fromDimensions(width, height) {
    return this.fromPixels(new Int32Array(width * height), width, height);
  }
  mirrorHorizontally() {
    const mirrored = _SpritePixels.fromDimensions(this.subWidth, this.subHeight);
    mirrored.width = this.width;
    mirrored.height = this.height;
    mirrored.xOffset = this.width - this.subWidth - this.xOffset;
    mirrored.yOffset = this.yOffset;
    for (let y = 0; y < this.subHeight; y++) {
      for (let x = 0; x < this.subWidth; x++) {
        mirrored.pixels[x + y * this.subWidth] = this.pixels[y * this.subWidth + this.subWidth - 1 - x];
      }
    }
    return mirrored;
  }
  copyNormalized() {
    const normalized = _SpritePixels.fromDimensions(this.width, this.height);
    for (let y = 0; y < this.subHeight; y++) {
      for (let x = 0; x < this.subWidth; x++) {
        normalized.pixels[x + (y + this.yOffset) * this.width + this.xOffset] = this.pixels[x + y * this.subWidth];
      }
    }
    return normalized;
  }
  normalize() {
    if (this.subWidth !== this.width || this.subHeight !== this.height) {
      const pixels = new Int32Array(this.width * this.height);
      for (let y = 0; y < this.subHeight; y++) {
        for (let x = 0; x < this.subWidth; x++) {
          pixels[x + (y + this.yOffset) * this.width + this.xOffset] = this.pixels[x + y * this.subWidth];
        }
      }
      this.pixels = pixels;
      this.subWidth = this.width;
      this.subHeight = this.height;
      this.xOffset = 0;
      this.yOffset = 0;
    }
  }
  pad(padding) {
    if (this.subWidth !== this.width || this.subHeight !== this.height) {
      let var2 = padding;
      if (padding > this.xOffset) {
        var2 = this.xOffset;
      }
      let var3 = padding;
      if (padding + this.xOffset + this.subWidth > this.width) {
        var3 = this.width - this.xOffset - this.subWidth;
      }
      let var4 = padding;
      if (padding > this.yOffset) {
        var4 = this.yOffset;
      }
      let var5 = padding;
      if (padding + this.yOffset + this.subHeight > this.height) {
        var5 = this.height - this.yOffset - this.subHeight;
      }
      const width = var2 + var3 + this.subWidth;
      const height = var4 + var5 + this.subHeight;
      const pixels = new Int32Array(width * height);
      for (let y = 0; y < this.subHeight; y++) {
        for (let x = 0; x < this.subWidth; x++) {
          pixels[width * (y + var4) + x + var2] = this.pixels[x + y * this.subWidth];
        }
      }
      this.pixels = pixels;
      this.subWidth = width;
      this.subHeight = height;
      this.xOffset -= var2;
      this.yOffset -= var4;
    }
  }
  flipHorizontally() {
    const pixels = new Int32Array(this.subWidth * this.subHeight);
    let index = 0;
    for (let y = 0; y < this.subHeight; y++) {
      for (let x = this.subWidth - 1; x >= 0; x--) {
        pixels[index++] = this.pixels[x + y * this.subWidth];
      }
    }
    this.pixels = pixels;
    this.xOffset = this.width - this.subWidth - this.xOffset;
  }
  flipVertically() {
    const pixels = new Int32Array(this.subWidth * this.subHeight);
    let index = 0;
    for (let y = this.subHeight - 1; y >= 0; y--) {
      for (let x = 0; x < this.subWidth; x++) {
        pixels[index++] = this.pixels[x + y * this.subWidth];
      }
    }
    this.pixels = pixels;
    this.yOffset = this.height - this.subHeight - this.yOffset;
  }
  outline(rgb) {
    const pixels = new Int32Array(this.subWidth * this.subHeight);
    let index = 0;
    for (let y = 0; y < this.subHeight; y++) {
      for (let x = 0; x < this.subWidth; x++) {
        let newRgb = this.pixels[index];
        if (newRgb === 0) {
          if (x > 0 && this.pixels[index - 1] !== 0) {
            newRgb = rgb;
          } else if (y > 0 && this.pixels[index - this.subWidth] !== 0) {
            newRgb = rgb;
          } else if (x < this.subWidth - 1 && this.pixels[index + 1] !== 0) {
            newRgb = rgb;
          } else if (y < this.subHeight - 1 && this.pixels[index + this.subWidth] !== 0) {
            newRgb = rgb;
          }
        }
        pixels[index++] = newRgb;
      }
    }
    this.pixels = pixels;
  }
  shadow(rgb) {
    for (let y = this.subHeight - 1; y > 0; y--) {
      const yOffset = y * this.subWidth;
      for (let x = this.subWidth - 1; x > 0; x--) {
        if (this.pixels[x + yOffset] === 0 && this.pixels[x + yOffset - 1 - this.subWidth] !== 0) {
          this.pixels[x + yOffset] = rgb;
        }
      }
    }
  }
  setRaster() {
    Rasterizer2D.setRaster(this.pixels, this.subWidth, this.subHeight);
  }
};

// ../rs-party-dashboard/src/rs/map/MapImageRenderer.ts
var tileShape2D = [
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1],
  [1, 1, 0, 0, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 0, 1],
  [0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 0],
  [1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 1],
  [1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1],
  [0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 1, 1, 1]
];
var tileRotation2D = [
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
  [12, 8, 4, 0, 13, 9, 5, 1, 14, 10, 6, 2, 15, 11, 7, 3],
  [15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
  [3, 7, 11, 15, 2, 6, 10, 14, 1, 5, 9, 13, 0, 4, 8, 12]
];
var MapImageRenderer = class _MapImageRenderer {
  constructor(textureLoader, locTypeLoader, mapScenes, mapFunctions) {
    this.textureLoader = textureLoader;
    this.locTypeLoader = locTypeLoader;
    this.mapScenes = mapScenes;
    this.mapFunctions = mapFunctions;
  }
  static {
    this.tmpScreenX = new Int32Array(6);
  }
  static {
    this.tmpScreenY = new Int32Array(6);
  }
  renderMinimap(scene, level) {
    const width = scene.sizeX * 4;
    const height = scene.sizeY * 4;
    const spritePixels = SpritePixels.fromDimensions(width, height);
    const pixels = spritePixels.pixels;
    for (let tileY = 0; tileY < scene.sizeY; tileY++) {
      let offset = (scene.sizeY - 1 - tileY) * width * 4;
      for (let tileX = 0; tileX < scene.sizeX; tileX++) {
        let realLevel = level;
        if ((scene.tileRenderFlags[1][tileX][tileY] & 2) === 2) {
          realLevel++;
        }
        if ((scene.tileRenderFlags[level][tileX][tileY] & 24) === 0) {
          this.drawTile(scene, pixels, offset, width, realLevel, tileX, tileY);
        }
        if (level < 3 && realLevel < 3 && (scene.tileRenderFlags[level + 1][tileX][tileY] & 8) !== 0) {
          this.drawTile(scene, pixels, offset, width, realLevel + 1, tileX, tileY);
        }
        offset += 4;
      }
    }
    const wallRgb = 15658734;
    const wallInteractiveRgb = 15597568;
    spritePixels.setRaster();
    for (let tileX = 0; tileX < scene.sizeX; tileX++) {
      for (let tileY = 0; tileY < scene.sizeY; tileY++) {
        let realLevel = level;
        if ((scene.tileRenderFlags[1][tileX][tileY] & 2) === 2) {
          realLevel++;
        }
        if ((scene.tileRenderFlags[level][tileX][tileY] & 24) === 0) {
          this.drawLoc(
            scene,
            pixels,
            width,
            realLevel,
            tileX,
            tileY,
            wallRgb,
            wallInteractiveRgb
          );
        }
        if (level < 3 && realLevel < 3 && (scene.tileRenderFlags[level + 1][tileX][tileY] & 8) !== 0) {
          this.drawLoc(
            scene,
            pixels,
            width,
            realLevel + 1,
            tileX,
            tileY,
            wallRgb,
            wallInteractiveRgb
          );
        }
      }
    }
    return spritePixels.pixels;
  }
  renderMinimapHd(scene, playerLevel, drawMapFunctions) {
    const width = scene.sizeX * 4;
    const height = scene.sizeY * 4;
    const spritePixels = SpritePixels.fromDimensions(width, height);
    const pixels = spritePixels.pixels;
    spritePixels.setRaster();
    Rasterizer3D.setClip();
    Rasterizer3D.rasterGouraudLowRes = false;
    const wallRgb = 15658734;
    const wallInteractiveRgb = 15597568;
    for (let level = playerLevel; level <= 3; level++) {
      for (let tileY = 0; tileY < scene.sizeY; tileY++) {
        for (let tileX = 0; tileX < scene.sizeX; tileX++) {
          if (!scene.isPlayerLevel(level, tileX, tileY, playerLevel)) {
            continue;
          }
          this.drawTileHd(scene, level, tileX, tileY);
        }
      }
      for (let tileY = 0; tileY < scene.sizeY; tileY++) {
        for (let tileX = 0; tileX < scene.sizeX; tileX++) {
          if (!scene.isPlayerLevel(level, tileX, tileY, playerLevel)) {
            continue;
          }
          this.drawLoc(
            scene,
            pixels,
            width,
            level,
            tileX,
            tileY,
            wallRgb,
            wallInteractiveRgb
          );
        }
      }
    }
    if (drawMapFunctions) {
      for (let tileY = 0; tileY < scene.sizeY; tileY++) {
        for (let tileX = 0; tileX < scene.sizeX; tileX++) {
          const floorDecorationTag = scene.getFloorDecorationTag(
            playerLevel,
            tileX,
            tileY
          );
          if (floorDecorationTag !== 0n) {
            const locId = getIdFromTag(floorDecorationTag);
            const locType = this.locTypeLoader.load(locId);
            if (locType.mapFunctionId !== -1) {
              const mapFunction = this.mapFunctions[locType.mapFunctionId];
              if (mapFunction) {
                const x = (locType.sizeX * 4 - mapFunction.subWidth) / 2 | 0;
                const y = (locType.sizeY * 4 - mapFunction.subHeight) / 2 | 0;
                mapFunction.drawAt(
                  tileX * 4 + x,
                  y + (scene.sizeY - tileY - locType.sizeY) * 4
                );
              }
            }
          }
        }
      }
    }
    return spritePixels.pixels;
  }
  drawTile(scene, pixels, offset, width, level, tileX, tileY) {
    const tile = scene.tiles[level][tileX][tileY];
    if (!tile || !tile.tileModel) {
      return;
    }
    const model = tile.tileModel;
    const underlayRgb = model.underlayRgb;
    const overlayRgb = model.overlayRgb;
    const shape2d = tileShape2D[model.shape];
    const rot2d = tileRotation2D[model.rotation];
    let index = 0;
    if (underlayRgb !== 0) {
      for (let i = 0; i < 4; i++) {
        const rgb0 = shape2d[rot2d[index++]] === 0 ? underlayRgb : overlayRgb;
        const rgb1 = shape2d[rot2d[index++]] === 0 ? underlayRgb : overlayRgb;
        const rgb2 = shape2d[rot2d[index++]] === 0 ? underlayRgb : overlayRgb;
        const rgb3 = shape2d[rot2d[index++]] === 0 ? underlayRgb : overlayRgb;
        pixels[offset] = rgb0;
        pixels[offset + 1] = rgb1;
        pixels[offset + 2] = rgb2;
        pixels[offset + 3] = rgb3;
        offset += width;
      }
    } else {
      for (let i = 0; i < 4; i++) {
        if (shape2d[rot2d[index++]] !== 0) {
          pixels[offset] = overlayRgb;
        }
        if (shape2d[rot2d[index++]] !== 0) {
          pixels[offset + 1] = overlayRgb;
        }
        if (shape2d[rot2d[index++]] !== 0) {
          pixels[offset + 2] = overlayRgb;
        }
        if (shape2d[rot2d[index++]] !== 0) {
          pixels[offset + 3] = overlayRgb;
        }
        offset += width;
      }
    }
  }
  drawTileHd(scene, level, tileX, tileY) {
    const tile = scene.tiles[level][tileX][tileY];
    if (!tile || !tile.tileModel) {
      return;
    }
    const model = tile.tileModel;
    const vertexX = model.vertexX;
    const vertexZ = model.vertexZ;
    const facesA = model.facesA;
    const facesB = model.facesB;
    const facesC = model.facesC;
    const colorsA = model.minimapFaceColorsA;
    const colorsB = model.minimapFaceColorsB;
    const colorsC = model.minimapFaceColorsC;
    const LOCAL_COORD_BITS = 7;
    const LOCAL_TILE_SIZE = 1 << LOCAL_COORD_BITS;
    const localX = tileX << LOCAL_COORD_BITS;
    const localY = tileY << LOCAL_COORD_BITS;
    const px0 = tileX * 4;
    const py0 = (scene.sizeY - tileY - 1) * 4;
    const px1 = px0 + 4;
    const py1 = py0 + 4;
    const w = px1 - px0;
    const h = py1 - py0;
    for (let vert = 0; vert < vertexX.length; vert++) {
      _MapImageRenderer.tmpScreenX[vert] = px0 + ((vertexX[vert] - localX) * w >> LOCAL_COORD_BITS);
      _MapImageRenderer.tmpScreenY[vert] = py0 + ((LOCAL_TILE_SIZE - (vertexZ[vert] - localY)) * h >> LOCAL_COORD_BITS);
    }
    for (let f = 0; f < facesA.length; f++) {
      const a = facesA[f];
      const b = facesB[f];
      const c = facesC[f];
      const colorA = colorsA[f];
      const colorB = colorsB[f];
      const colorC = colorsC[f];
      if (colorA !== INVALID_HSL_COLOR) {
        Rasterizer3D.rasterGouraud(
          _MapImageRenderer.tmpScreenY[a],
          _MapImageRenderer.tmpScreenY[b],
          _MapImageRenderer.tmpScreenY[c],
          _MapImageRenderer.tmpScreenX[a],
          _MapImageRenderer.tmpScreenX[b],
          _MapImageRenderer.tmpScreenX[c],
          colorA,
          colorB,
          colorC
        );
      }
    }
  }
  drawLoc(scene, pixels, width, level, tileX, tileY, wallRgb, wallInteractiveRgb) {
    const wallTag = scene.getWallTag(level, tileX, tileY);
    if (wallTag !== 0n) {
      const locFlags = scene.getLocFlags(level, tileX, tileY, wallTag);
      const rotation = locFlags >> 6 & 3;
      const type = locFlags & 31;
      const locId = getIdFromTag(wallTag);
      const locType = this.locTypeLoader.load(locId);
      if (locType.mapSceneId !== -1) {
        const mapScene = this.mapScenes[locType.mapSceneId];
        if (mapScene) {
          const x = (locType.sizeX * 4 - mapScene.subWidth) / 2 | 0;
          const y = (locType.sizeY * 4 - mapScene.subHeight) / 2 | 0;
          mapScene.drawAt(tileX * 4 + x, y + (scene.sizeY - tileY - locType.sizeY) * 4);
        }
      } else {
        let rgb = wallRgb;
        if (isEntityInteractive(wallTag)) {
          rgb = wallInteractiveRgb;
        }
        const offset = tileX * 4 + (scene.sizeY - 1 - tileY) * width * 4;
        if (type === 0 /* WALL */ || type === 2 /* WALL_CORNER */) {
          if (rotation === 0) {
            pixels[offset] = rgb;
            pixels[offset + width] = rgb;
            pixels[offset + width * 2] = rgb;
            pixels[offset + width * 3] = rgb;
          } else if (rotation === 1) {
            pixels[offset] = rgb;
            pixels[offset + 1] = rgb;
            pixels[offset + 2] = rgb;
            pixels[offset + 3] = rgb;
          } else if (rotation === 2) {
            pixels[offset + 3] = rgb;
            pixels[offset + width + 3] = rgb;
            pixels[offset + width * 2 + 3] = rgb;
            pixels[offset + width * 3 + 3] = rgb;
          } else if (rotation === 3) {
            pixels[offset + width * 3] = rgb;
            pixels[offset + width * 3 + 1] = rgb;
            pixels[offset + width * 3 + 2] = rgb;
            pixels[offset + width * 3 + 3] = rgb;
          }
        }
        if (type === 3 /* WALL_RECT_CORNER */) {
          if (rotation === 0) {
            pixels[offset] = rgb;
          } else if (rotation === 1) {
            pixels[offset + 3] = rgb;
          } else if (rotation === 2) {
            pixels[offset + width * 3 + 3] = rgb;
          } else if (rotation === 3) {
            pixels[offset + width * 3] = rgb;
          }
        }
        if (type === 2 /* WALL_CORNER */) {
          if (rotation === 3) {
            pixels[offset] = rgb;
            pixels[offset + width] = rgb;
            pixels[offset + width * 2] = rgb;
            pixels[offset + width * 3] = rgb;
          } else if (rotation === 0) {
            pixels[offset] = rgb;
            pixels[offset + 1] = rgb;
            pixels[offset + 2] = rgb;
            pixels[offset + 3] = rgb;
          } else if (rotation === 1) {
            pixels[offset + 3] = rgb;
            pixels[offset + width + 3] = rgb;
            pixels[offset + width * 2 + 3] = rgb;
            pixels[offset + width * 3 + 3] = rgb;
          } else if (rotation === 2) {
            pixels[offset + width * 3] = rgb;
            pixels[offset + width * 3 + 1] = rgb;
            pixels[offset + width * 3 + 2] = rgb;
            pixels[offset + width * 3 + 3] = rgb;
          }
        }
      }
    }
    const locTag = scene.getLocTag(level, tileX, tileY);
    if (locTag !== 0n) {
      const locFlags = scene.getLocFlags(level, tileX, tileY, locTag);
      const rotation = locFlags >> 6 & 3;
      const type = locFlags & 31;
      const locId = getIdFromTag(locTag);
      const locType = this.locTypeLoader.load(locId);
      if (locType.mapSceneId !== -1) {
        const mapScene = this.mapScenes[locType.mapSceneId];
        if (mapScene) {
          const x = (locType.sizeX * 4 - mapScene.subWidth) / 2 | 0;
          const y = (locType.sizeY * 4 - mapScene.subHeight) / 2 | 0;
          mapScene.drawAt(tileX * 4 + x, (scene.sizeY - tileY - locType.sizeY) * 4 + y);
        }
      } else if (type === 9 /* WALL_DIAGONAL */) {
        let rgb = wallRgb;
        if (isEntityInteractive(locTag)) {
          rgb = wallInteractiveRgb;
        }
        const offset = tileX * 4 + (scene.sizeY - 1 - tileY) * width * 4;
        if (rotation !== 0 && rotation !== 2) {
          pixels[offset] = rgb;
          pixels[offset + width + 1] = rgb;
          pixels[offset + width * 2 + 2] = rgb;
          pixels[offset + width * 3 + 3] = rgb;
        } else {
          pixels[offset + width * 3] = rgb;
          pixels[offset + width * 2 + 1] = rgb;
          pixels[offset + width + 2] = rgb;
          pixels[offset + 3] = rgb;
        }
      }
    }
    const floorDecorationTag = scene.getFloorDecorationTag(level, tileX, tileY);
    if (floorDecorationTag !== 0n) {
      const locId = getIdFromTag(floorDecorationTag);
      const locType = this.locTypeLoader.load(locId);
      if (locType.mapSceneId !== -1) {
        const mapScene = this.mapScenes[locType.mapSceneId];
        if (mapScene) {
          const x = (locType.sizeX * 4 - mapScene.subWidth) / 2 | 0;
          const y = (locType.sizeY * 4 - mapScene.subHeight) / 2 | 0;
          mapScene.drawAt(tileX * 4 + x, y + (scene.sizeY - tileY - locType.sizeY) * 4);
        }
      }
    }
  }
};

// ../rs-party-dashboard/src/rs/util/HeightCalc.ts
function interpolate(i, i_4_, i_5_, freq) {
  const i_8_ = 65536 - COSINE[i_5_ * 1024 / freq] >> 1;
  return (i_8_ * i_4_ >> 16) + ((65536 - i_8_) * i >> 16);
}
function noise(x, y) {
  let n = y * 57 + x;
  n = n << 13 ^ n;
  const n2 = Math.imul(n, Math.imul(Math.imul(n, n), 15731) + 789221) + 1376312589 & 2147483647;
  return n2 >> 19 & 255;
}
function smoothedNoise1(x, y) {
  const corners = noise(x - 1, y - 1) + noise(x + 1, y - 1) + noise(x - 1, y + 1) + noise(x + 1, y + 1);
  const sides = noise(x - 1, y) + noise(x + 1, y) + noise(x, y - 1) + noise(x, y + 1);
  const center = noise(x, y);
  return (center / 4 | 0) + (sides / 8 | 0) + (corners / 16 | 0);
}
function interpolateNoise(x, y, freq) {
  const intX = x / freq | 0;
  const fracX = x & freq - 1;
  const intY = y / freq | 0;
  const fracY = y & freq - 1;
  const v1 = smoothedNoise1(intX, intY);
  const v2 = smoothedNoise1(intX + 1, intY);
  const v3 = smoothedNoise1(intX, intY + 1);
  const v4 = smoothedNoise1(intX + 1, intY + 1);
  const i1 = interpolate(v1, v2, fracX, freq);
  const i2 = interpolate(v3, v4, fracX, freq);
  return interpolate(i1, i2, fracY, freq);
}
function generateHeight(x, y) {
  let n = interpolateNoise(x + 45365, y + 91923, 4) - 128 + (interpolateNoise(x + 10294, y + 37821, 2) - 128 >> 1) + (interpolateNoise(x, y, 1) - 128 >> 2);
  n = (0.3 * n | 0) + 35;
  if (n < 10) {
    n = 10;
  } else if (n > 60) {
    n = 60;
  }
  return n;
}

// ../rs-party-dashboard/src/rs/scene/CollisionMap.ts
var CollisionMap = class _CollisionMap {
  static fromData(data) {
    return new _CollisionMap(data.sizeX, data.sizeY, data.flags);
  }
  constructor(sizeX, sizeY, flags) {
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.offsetX = 0;
    this.offsetY = 0;
    if (flags) {
      this.flags = flags;
    } else {
      this.flags = new Int32Array(this.sizeX * this.sizeY);
      this.reset();
    }
  }
  reset() {
    for (let x = 0; x < this.sizeX; x++) {
      for (let y = 0; y < this.sizeY; y++) {
        if (x !== 0 && y !== 0 && x < this.sizeX - 5 && y < this.sizeY - 5) {
        } else {
        }
      }
    }
  }
  isWithinBounds(x, y) {
    return x >= 0 && x < this.sizeX && y >= 0 && y < this.sizeY;
  }
  getFlag(x, y) {
    return this.flags[x + y * this.sizeX];
  }
  hasFlag(x, y, flag) {
    return (this.getFlag(x, y) & flag) !== 0;
  }
  setFlag(x, y, flag) {
    this.flags[x + y * this.sizeX] = flag;
  }
  flag(x, y, flag) {
    this.flags[x + y * this.sizeX] |= flag;
  }
  unflag(x, y, flag) {
    this.flags[x + y * this.sizeX] &= ~flag;
  }
  setBlockedByFloor(x, y) {
    this.flag(x, y, 2097152);
  }
  setBlockedByFloorDec(x, y) {
    this.flag(x, y, 262144);
  }
  addLoc(x, y, sizeX, sizeY, blockProjectile) {
    let flag = 256;
    if (blockProjectile) {
      flag += 131072;
    }
    for (let fx = x; fx < sizeX + x; fx++) {
      if (fx >= 0 && fx < this.sizeX) {
        for (let fy = y; fy < y + sizeY; fy++) {
          if (fy >= 0 && fy < this.sizeY) {
            this.flag(fx, fy, flag);
          }
        }
      }
    }
  }
  addWall(x, y, type, rotation, blockProjectile) {
    if (type === 0 /* WALL */) {
      if (rotation === 0) {
        this.flag(x, y, 128);
        this.flag(x - 1, y, 8);
      }
      if (rotation === 1) {
        this.flag(x, y, 2);
        this.flag(x, y + 1, 32);
      }
      if (rotation === 2) {
        this.flag(x, y, 8);
        this.flag(x + 1, y, 128);
      }
      if (rotation === 3) {
        this.flag(x, y, 32);
        this.flag(x, y - 1, 2);
      }
    }
    if (type === 1 /* WALL_TRI_CORNER */ || type === 3 /* WALL_RECT_CORNER */) {
      if (rotation === 0) {
        this.flag(x, y, 1);
        this.flag(x - 1, y + 1, 16);
      }
      if (rotation === 1) {
        this.flag(x, y, 4);
        this.flag(x + 1, y + 1, 64);
      }
      if (rotation === 2) {
        this.flag(x, y, 16);
        this.flag(x + 1, y - 1, 1);
      }
      if (rotation === 3) {
        this.flag(x, y, 64);
        this.flag(x - 1, y - 1, 4);
      }
    }
    if (type === 2 /* WALL_CORNER */) {
      if (rotation === 0) {
        this.flag(x, y, 130);
        this.flag(x - 1, y, 8);
        this.flag(x, y + 1, 32);
      }
      if (rotation === 1) {
        this.flag(x, y, 10);
        this.flag(x, y + 1, 32);
        this.flag(x + 1, y, 128);
      }
      if (rotation === 2) {
        this.flag(x, y, 40);
        this.flag(x + 1, y, 128);
        this.flag(x, y - 1, 2);
      }
      if (rotation === 3) {
        this.flag(x, y, 160);
        this.flag(x, y - 1, 2);
        this.flag(x - 1, y, 8);
      }
    }
    if (blockProjectile) {
      if (type === 0 /* WALL */) {
        if (rotation === 0) {
          this.flag(x, y, 65536);
          this.flag(x - 1, y, 4096);
        }
        if (rotation === 1) {
          this.flag(x, y, 1024);
          this.flag(x, y + 1, 16384);
        }
        if (rotation === 2) {
          this.flag(x, y, 4096);
          this.flag(x + 1, y, 65536);
        }
        if (rotation === 3) {
          this.flag(x, y, 16384);
          this.flag(x, y - 1, 1024);
        }
      }
      if (type === 1 /* WALL_TRI_CORNER */ || type === 3 /* WALL_RECT_CORNER */) {
        if (rotation === 0) {
          this.flag(x, y, 512);
          this.flag(x - 1, y + 1, 8192);
        }
        if (rotation === 1) {
          this.flag(x, y, 2048);
          this.flag(x + 1, y + 1, 32768);
        }
        if (rotation === 2) {
          this.flag(x, y, 8192);
          this.flag(x + 1, y - 1, 512);
        }
        if (rotation === 3) {
          this.flag(x, y, 32768);
          this.flag(x - 1, y - 1, 2048);
        }
      }
      if (type === 2 /* WALL_CORNER */) {
        if (rotation === 0) {
          this.flag(x, y, 66560);
          this.flag(x - 1, y, 4096);
          this.flag(x, y + 1, 16384);
        }
        if (rotation === 1) {
          this.flag(x, y, 5120);
          this.flag(x, y + 1, 16384);
          this.flag(x + 1, y, 65536);
        }
        if (rotation === 2) {
          this.flag(x, y, 20480);
          this.flag(x + 1, y, 65536);
          this.flag(x, y - 1, 1024);
        }
        if (rotation === 3) {
          this.flag(x, y, 81920);
          this.flag(x, y - 1, 1024);
          this.flag(x - 1, y, 4096);
        }
      }
    }
  }
};

// ../rs-party-dashboard/src/rs/scene/FloorDecoration.ts
var FloorDecoration = class {
  constructor(entity, x, y, height, tag, flags) {
    this.entity = entity;
    this.x = x;
    this.y = y;
    this.height = height;
    this.tag = tag;
    this.flags = flags;
  }
};

// ../rs-party-dashboard/src/rs/scene/Loc.ts
var Loc = class {
  constructor(tag, flags, level, x, y, height, entity, rotation, startX, startY, endX, endY) {
    this.tag = tag;
    this.flags = flags;
    this.level = level;
    this.x = x;
    this.y = y;
    this.height = height;
    this.entity = entity;
    this.rotation = rotation;
    this.startX = startX;
    this.startY = startY;
    this.endX = endX;
    this.endY = endY;
  }
};

// ../rs-party-dashboard/src/rs/scene/SceneTile.ts
var SceneTile = class {
  constructor(level, x, y) {
    this.level = this.initLevel = level;
    this.x = x;
    this.y = y;
    this.minLevel = 0;
    this.locs = [];
  }
};

// ../rs-party-dashboard/src/rs/scene/Wall.ts
var Wall = class {
  constructor(tag, flags, x, y, height, entity0, entity1) {
    this.tag = tag;
    this.flags = flags;
    this.x = x;
    this.y = y;
    this.height = height;
    this.entity0 = entity0;
    this.entity1 = entity1;
  }
};

// ../rs-party-dashboard/src/rs/scene/WallDecoration.ts
var WallDecoration = class {
  constructor(tag, flags, x, y, height, entity0, entity1, offsetX, offsetY) {
    this.tag = tag;
    this.flags = flags;
    this.x = x;
    this.y = y;
    this.height = height;
    this.entity0 = entity0;
    this.entity1 = entity1;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }
};

// ../rs-party-dashboard/src/rs/scene/Scene.ts
var Scene = class {
  constructor(levels, sizeX, sizeY) {
    this.levels = levels;
    this.sizeX = sizeX;
    this.sizeY = sizeY;
    this.tiles = new Array(levels);
    this.collisionMaps = new Array(levels);
    this.tileHeights = new Array(levels);
    this.tileRenderFlags = new Array(levels);
    this.tileUnderlays = new Array(levels);
    this.tileOverlays = new Array(levels);
    this.tileShapes = new Array(levels);
    this.tileRotations = new Array(levels);
    this.tileLightOcclusions = new Array(levels);
    for (let l = 0; l < levels; l++) {
      this.tiles[l] = new Array(this.sizeX);
      this.collisionMaps[l] = new CollisionMap(this.sizeX, this.sizeY);
      this.tileHeights[l] = new Array(this.sizeX + 1);
      this.tileRenderFlags[l] = new Array(this.sizeX);
      this.tileUnderlays[l] = new Array(this.sizeX);
      this.tileOverlays[l] = new Array(this.sizeX);
      this.tileShapes[l] = new Array(this.sizeX);
      this.tileRotations[l] = new Array(this.sizeX);
      this.tileLightOcclusions[l] = new Array(this.sizeX + 1);
      for (let x = 0; x < this.sizeX; x++) {
        this.tiles[l][x] = new Array(this.sizeY);
        this.tileRenderFlags[l][x] = new Uint8Array(this.sizeY);
        this.tileUnderlays[l][x] = new Uint16Array(this.sizeY);
        this.tileOverlays[l][x] = new Int16Array(this.sizeY);
        this.tileShapes[l][x] = new Uint8Array(this.sizeY);
        this.tileRotations[l][x] = new Uint8Array(this.sizeY);
      }
      for (let x = 0; x < this.sizeX + 1; x++) {
        this.tileHeights[l][x] = new Int32Array(this.sizeY + 1);
        this.tileLightOcclusions[l][x] = new Uint8Array(this.sizeY + 1);
      }
    }
  }
  static {
    this.MAX_LEVELS = 4;
  }
  static {
    this.MAP_SQUARE_SIZE = 64;
  }
  static {
    this.UNITS_LEVEL_HEIGHT = 240;
  }
  static {
    this.UNITS_TILE_HEIGHT_BASIS = 8;
  }
  isWithinBounds(level, tileX, tileY) {
    return level >= 0 && level < this.levels && tileX >= 0 && tileX < this.sizeX && tileY >= 0 && tileY < this.sizeY;
  }
  ensureTileExists(startLevel, endLevel, tileX, tileY) {
    for (let i = startLevel; i <= endLevel; i++) {
      if (!this.tiles[i][tileX][tileY]) {
        this.tiles[i][tileX][tileY] = new SceneTile(i, tileX, tileY);
      }
    }
  }
  newFloorDecoration(level, tileX, tileY, height, entity, tag, flags) {
    if (entity) {
      const x = tileX * 128 + 64;
      const y = tileY * 128 + 64;
      const floorDecoration = new FloorDecoration(entity, x, y, height, tag, flags);
      this.ensureTileExists(level, level, tileX, tileY);
      this.tiles[level][tileX][tileY].floorDecoration = floorDecoration;
    }
  }
  newLoc(level, tileX, tileY, height, sizeX, sizeY, entity, rotation, tag, flags) {
    if (entity) {
      const centerX = tileX * 128 + 64 * sizeX;
      const centerY = tileY * 128 + 64 * sizeY;
      return this.newLoc0(
        level,
        tileX,
        tileY,
        sizeX,
        sizeY,
        centerX,
        centerY,
        height,
        entity,
        rotation,
        tag,
        flags
      );
    }
    return true;
  }
  newLoc0(level, tileX, tileY, sizeX, sizeY, centerX, centerY, height, entity, rotation, tag, flags) {
    const startX = tileX;
    const startY = tileY;
    const endX = tileX + sizeX - 1;
    const endY = tileY + sizeY - 1;
    for (let sx = startX; sx <= endX; sx++) {
      for (let sy = startY; sy <= endY; sy++) {
        if (sx < 0 || sy < 0 || sx >= this.sizeX || sy >= this.sizeY) {
          return false;
        }
        const tile = this.tiles[level][sx][sy];
        if (tile && tile.locs.length >= 5) {
          return false;
        }
      }
    }
    const loc = new Loc(
      tag,
      flags,
      level,
      centerX,
      centerY,
      height,
      entity,
      rotation,
      startX,
      startY,
      endX,
      endY
    );
    for (let sx = startX; sx <= endX; sx++) {
      for (let sy = startY; sy <= endY; sy++) {
        this.ensureTileExists(0, level, sx, sy);
        this.tiles[level][sx][sy].locs.push(loc);
      }
    }
    return true;
  }
  newWall(level, tileX, tileY, centerHeight, entity0, entity1, tag, flags) {
    if (!entity0 && !entity1) {
      return;
    }
    const x = tileX * 128 + 64;
    const y = tileY * 128 + 64;
    const wall = new Wall(tag, flags, x, y, centerHeight, entity0, entity1);
    this.ensureTileExists(0, level, tileX, tileY);
    this.tiles[level][tileX][tileY].wall = wall;
  }
  newWallDecoration(level, tileX, tileY, centerHeight, entity0, entity1, offsetX, offsetY, tag, flags) {
    if (entity0) {
      const x = tileX * 128 + 64;
      const y = tileY * 128 + 64;
      const wallDecoration = new WallDecoration(
        tag,
        flags,
        x,
        y,
        centerHeight,
        entity0,
        entity1,
        offsetX,
        offsetY
      );
      this.ensureTileExists(0, level, tileX, tileY);
      this.tiles[level][tileX][tileY].wallDecoration = wallDecoration;
    }
  }
  updateWallDecorationDisplacement(level, tileX, tileY, displacement) {
    const tile = this.tiles[level][tileX][tileY];
    if (tile && tile.wallDecoration) {
      const decor = tile.wallDecoration;
      decor.offsetX = displacement * decor.offsetX / 16 | 0;
      decor.offsetY = displacement * decor.offsetY / 16 | 0;
    }
  }
  getWallTag(level, tileX, tileY) {
    const tile = this.tiles[level][tileX][tileY];
    return (tile && tile.wall && tile.wall.tag) ?? 0n;
  }
  getLocTag(level, tileX, tileY) {
    const tile = this.tiles[level][tileX][tileY];
    if (!tile) {
      return 0n;
    }
    for (const loc of tile.locs) {
      const entityType = getEntityTypeFromTag(loc.tag);
      if (entityType === 2 /* LOC */ && tileX === loc.startX && tileY === loc.startY) {
        return loc.tag;
      }
    }
    return 0n;
  }
  getFloorDecorationTag(level, tileX, tileY) {
    const tile = this.tiles[level][tileX][tileY];
    return tile && tile.floorDecoration && tile.floorDecoration.tag || 0n;
  }
  getLocFlags(level, tileX, tileY, tag) {
    const tile = this.tiles[level][tileX][tileY];
    if (!tile) {
      return -1;
    }
    if (tile.wall && tile.wall.tag === tag) {
      return tile.wall.flags & 255;
    } else if (tile.wallDecoration && tile.wallDecoration.tag === tag) {
      return tile.wallDecoration.flags & 255;
    } else if (tile.floorDecoration && tile.floorDecoration.tag === tag) {
      return tile.floorDecoration.flags & 255;
    } else {
      for (const loc of tile.locs) {
        if (loc.tag === tag) {
          return loc.flags & 255;
        }
      }
      return -1;
    }
  }
  calculateTileLights(level, ignoreTileLightOcclusion = false) {
    const lights = new Array(this.sizeX);
    for (let i = 0; i < this.sizeX; i++) {
      lights[i] = new Int32Array(this.sizeY);
    }
    const LIGHT_DIR_X = -50;
    const LIGHT_DIR_Y = -10;
    const LIGHT_DIR_Z = -50;
    const LIGHT_INTENSITY_BASE = 96;
    const LIGHT_INTENSITY_FACTOR = 768;
    const HEIGHT_SCALE = 65536;
    const lightMagnitude = Math.sqrt(
      LIGHT_DIR_X * LIGHT_DIR_X + LIGHT_DIR_Y * LIGHT_DIR_Y + LIGHT_DIR_Z * LIGHT_DIR_Z
    ) | 0;
    const lightIntensity = lightMagnitude * LIGHT_INTENSITY_FACTOR >> 8;
    for (let x = 1; x < this.sizeX - 1; x++) {
      for (let y = 1; y < this.sizeY - 1; y++) {
        const heightDeltaX = this.tileHeights[level][x + 1][y] - this.tileHeights[level][x - 1][y];
        const heightDeltaY = this.tileHeights[level][x][y + 1] - this.tileHeights[level][x][y - 1];
        const tileNormalLength = Math.sqrt(
          heightDeltaY * heightDeltaY + heightDeltaX * heightDeltaX + HEIGHT_SCALE
        ) | 0;
        const normalizedTileNormalX = (heightDeltaX << 8) / tileNormalLength | 0;
        const normalizedTileNormalY = HEIGHT_SCALE / tileNormalLength | 0;
        const normalizedTileNormalZ = (heightDeltaY << 8) / tileNormalLength | 0;
        const dot = normalizedTileNormalX * LIGHT_DIR_X + normalizedTileNormalY * LIGHT_DIR_Y + normalizedTileNormalZ * LIGHT_DIR_Z;
        const sunLight = dot / lightIntensity + LIGHT_INTENSITY_BASE | 0;
        const lightOcclusion = ignoreTileLightOcclusion ? 0 : (this.tileLightOcclusions[level][x - 1][y] >> 2) + (this.tileLightOcclusions[level][x][y - 1] >> 2) + (this.tileLightOcclusions[level][x + 1][y] >> 3) + (this.tileLightOcclusions[level][x][y + 1] >> 3) + (this.tileLightOcclusions[level][x][y] >> 1);
        lights[x][y] = sunLight - lightOcclusion;
      }
    }
    return lights;
  }
  newTileModel(level, tileX, tileY, tileModel) {
    this.ensureTileExists(level, level, tileX, tileY);
    this.tiles[level][tileX][tileY].tileModel = tileModel;
  }
  getTileMinLevel(level, tileX, tileY) {
    if ((this.tileRenderFlags[level][tileX][tileY] & 8) !== 0) {
      return 0;
    } else if (level > 0 && (this.tileRenderFlags[level][tileX][tileY] & 2) !== 0) {
      return level - 1;
    } else {
      return level;
    }
  }
  setTileMinLevel(level, tileX, tileY, minLevel) {
    const tile = this.tiles[level][tileX][tileY];
    if (tile) {
      tile.minLevel = minLevel;
    }
  }
  isInside(level, tileX, tileY) {
    return (this.tileRenderFlags[level][tileX][tileY] & 4) !== 0;
  }
  setTileMinLevels() {
    for (let level = 0; level < this.levels; level++) {
      for (let x = 0; x < this.sizeX; x++) {
        for (let y = 0; y < this.sizeY; y++) {
          this.setTileMinLevel(level, x, y, this.getTileMinLevel(level, x, y));
        }
      }
    }
  }
  isPlayerLevel(level, tileX, tileY, playerLevel) {
    if ((this.tileRenderFlags[0][tileX][tileY] & 2) !== 0) {
      return true;
    }
    if ((this.tileRenderFlags[level][tileX][tileY] & 16) !== 0) {
      return false;
    }
    return playerLevel === this.getTileMinLevel(level, tileX, tileY);
  }
  getHeightInterpolated(level, x, z) {
    const heights = this.tileHeights[level];
    const tileSizeShift = 7;
    const tileSize = 1 << tileSizeShift;
    const tileX = x >> tileSizeShift;
    const tileY = z >> tileSizeShift;
    if (tileX < 0 || tileY < 0 || tileX > this.sizeX - 1 || tileY > this.sizeY - 1) {
      return 0;
    }
    const rx = x & tileSize - 1;
    const rz = z & tileSize - 1;
    const i_10_ = (tileSize - rx) * heights[tileX][tileY] + heights[1 + tileX][tileY] * rx >> tileSizeShift;
    const i_11_ = heights[tileX][1 + tileY] * (-rx + tileSize) + heights[tileX + 1][1 + tileY] * rx >> tileSizeShift;
    return rz * i_11_ + (-rz + tileSize) * i_10_ >> tileSizeShift;
  }
  getCenterHeight(level, tileX, tileY) {
    return this.tileHeights[level][tileX][tileY] + this.tileHeights[level][tileX][tileY + 1] + this.tileHeights[level][tileX + 1][tileY] + this.tileHeights[level][tileX + 1][tileY + 1] >> 2;
  }
  getDeltaHeight(level0, tileX0, tileY0, level1, tileX1, tileY1) {
    return this.getCenterHeight(level0, tileX0, tileY0) - this.getCenterHeight(level1, tileX1, tileY1);
  }
  mergeLargeLocNormals(model, startLevel, tileX, tileY, sizeX, sizeY) {
    let hideOccluded = true;
    let startX = tileX;
    const endX = tileX + sizeX;
    const startY = tileY - 1;
    const endY = tileY + sizeY;
    for (let level = startLevel; level <= startLevel + 1; level++) {
      if (level === this.levels) {
        continue;
      }
      for (let localX = startX; localX <= endX; localX++) {
        if (localX >= 0 && localX < this.sizeX) {
          for (let localY = startY; localY <= endY; localY++) {
            if (localY >= 0 && localY < this.sizeY && (!hideOccluded || localX >= endX || localY >= endY || localY < tileY && tileX !== localX)) {
              const tile = this.tiles[level][localX][localY];
              if (tile) {
                const deltaHeight = this.getDeltaHeight(
                  level,
                  localX,
                  localY,
                  startLevel,
                  tileX,
                  tileY
                );
                const wall = tile.wall;
                if (wall) {
                  if (wall.entity0 instanceof ModelData) {
                    ModelData.mergeNormals(
                      model,
                      wall.entity0,
                      (1 - sizeX) * 64 + (localX - tileX) * 128,
                      deltaHeight,
                      (localY - tileY) * 128 + (1 - sizeY) * 64,
                      hideOccluded
                    );
                  }
                  if (wall.entity1 instanceof ModelData) {
                    ModelData.mergeNormals(
                      model,
                      wall.entity1,
                      (1 - sizeX) * 64 + (localX - tileX) * 128,
                      deltaHeight,
                      (localY - tileY) * 128 + (1 - sizeY) * 64,
                      hideOccluded
                    );
                  }
                }
                for (const loc of tile.locs) {
                  if (loc.entity instanceof ModelData) {
                    const var21 = loc.endX - loc.startX + 1;
                    const var22 = loc.endY - loc.startY + 1;
                    ModelData.mergeNormals(
                      model,
                      loc.entity,
                      (var21 - sizeX) * 64 + (loc.startX - tileX) * 128,
                      deltaHeight,
                      (loc.startY - tileY) * 128 + (var22 - sizeY) * 64,
                      hideOccluded
                    );
                  }
                }
              }
            }
          }
        }
      }
      startX--;
      hideOccluded = false;
    }
  }
  mergeFloorNormals(model, level, tileX, tileY) {
    const endX = tileX + 1;
    const startY = tileY - 1;
    const endY = tileY + 1;
    for (let x = tileX; x <= endX; x++) {
      if (x >= 0 && x < this.sizeX) {
        for (let y = startY; y <= endY; y++) {
          if (y >= 0 && y < this.sizeY && (x >= endX || y >= endY)) {
            const tile = this.tiles[level][x][y];
            if (tile && tile.floorDecoration && tile.floorDecoration.entity instanceof ModelData) {
              const deltaHeight = this.getDeltaHeight(
                level,
                x,
                y,
                level,
                tileX,
                tileY
              );
              ModelData.mergeNormals(
                model,
                tile.floorDecoration.entity,
                (x - tileX) * 128,
                deltaHeight,
                (y - tileY) * 128,
                true
              );
            }
          }
        }
      }
    }
  }
  light(textureLoader, lightX, lightY, lightZ) {
    for (let level = 0; level < this.levels; level++) {
      for (let tileX = 0; tileX < this.sizeX; tileX++) {
        for (let tileY = 0; tileY < this.sizeY; tileY++) {
          const tile = this.tiles[level][tileX][tileY];
          if (!tile) {
            continue;
          }
          const wall = tile.wall;
          if (wall && wall.entity0 instanceof ModelData) {
            const model0 = wall.entity0;
            this.mergeLargeLocNormals(model0, level, tileX, tileY, 1, 1);
            if (wall.entity1 instanceof ModelData) {
              const model1 = wall.entity1;
              this.mergeLargeLocNormals(model1, level, tileX, tileY, 1, 1);
              ModelData.mergeNormals(model0, model1, 0, 0, 0, false);
              wall.entity1 = model1.light(
                textureLoader,
                model1.ambient,
                model1.contrast,
                lightX,
                lightY,
                lightZ
              );
            }
            wall.entity0 = model0.light(
              textureLoader,
              model0.ambient,
              model0.contrast,
              lightX,
              lightY,
              lightZ
            );
          }
          for (const loc of tile.locs) {
            if (loc.entity instanceof ModelData) {
              this.mergeLargeLocNormals(
                loc.entity,
                level,
                tileX,
                tileY,
                loc.endX - loc.startX + 1,
                loc.endY - loc.startY + 1
              );
              loc.entity = loc.entity.light(
                textureLoader,
                loc.entity.ambient,
                loc.entity.contrast,
                lightX,
                lightY,
                lightZ
              );
            }
          }
          const floorDecoration = tile.floorDecoration;
          if (floorDecoration && floorDecoration.entity instanceof ModelData) {
            this.mergeFloorNormals(floorDecoration.entity, level, tileX, tileY);
            floorDecoration.entity = floorDecoration.entity.light(
              textureLoader,
              floorDecoration.entity.ambient,
              floorDecoration.entity.contrast,
              lightX,
              lightY,
              lightZ
            );
          }
        }
      }
    }
  }
  setLinkBelow(tileX, tileY) {
    const tile = this.tiles[0][tileX][tileY];
    for (let i = 0; i < this.levels - 1; i++) {
      const t = this.tiles[i][tileX][tileY] = this.tiles[i + 1][tileX][tileY];
      if (t) {
        t.level--;
        for (const loc of t.locs) {
          const entityType = getEntityTypeFromTag(loc.tag);
          if (entityType === 2 /* LOC */ && loc.startX === tileX && loc.startY === tileY) {
            loc.level--;
          }
        }
      }
    }
    if (!this.tiles[0][tileX][tileY]) {
      this.tiles[0][tileX][tileY] = new SceneTile(0, tileX, tileY);
    }
    this.tiles[0][tileX][tileY].linkedBelowTile = tile;
    delete this.tiles[3][tileX][tileY];
  }
};

// ../rs-party-dashboard/src/rs/scene/SceneTileModel.ts
var TILE_SIZE = 128;
var HALF_TILE_SIZE = TILE_SIZE / 2;
var QUARTER_TILE_SIZE = TILE_SIZE / 4;
var THREE_QTR_TILE_SIZE = TILE_SIZE * 3 / 4;
var tileShapeVertexIndices = [
  [1, 3, 5, 7],
  [1, 3, 5, 7],
  [1, 3, 5, 7],
  [1, 3, 5, 7, 6],
  [1, 3, 5, 7, 6],
  [1, 3, 5, 7, 6],
  [1, 3, 5, 7, 6],
  [1, 3, 5, 7, 2, 6],
  [1, 3, 5, 7, 2, 8],
  [1, 3, 5, 7, 2, 8],
  [1, 3, 5, 7, 11, 12],
  [1, 3, 5, 7, 11, 12],
  [1, 3, 5, 7, 13, 14]
];
var tileShapeFaces = [
  [0, 1, 2, 3, 0, 0, 1, 3],
  [1, 1, 2, 3, 1, 0, 1, 3],
  [0, 1, 2, 3, 1, 0, 1, 3],
  [0, 0, 1, 2, 0, 0, 2, 4, 1, 0, 4, 3],
  [0, 0, 1, 4, 0, 0, 4, 3, 1, 1, 2, 4],
  [0, 0, 4, 3, 1, 0, 1, 2, 1, 0, 2, 4],
  [0, 1, 2, 4, 1, 0, 1, 4, 1, 0, 4, 3],
  [0, 4, 1, 2, 0, 4, 2, 5, 1, 0, 4, 5, 1, 0, 5, 3],
  [0, 4, 1, 2, 0, 4, 2, 3, 0, 4, 3, 5, 1, 0, 4, 5],
  [0, 0, 4, 5, 1, 4, 1, 2, 1, 4, 2, 3, 1, 4, 3, 5],
  [0, 0, 1, 5, 0, 1, 4, 5, 0, 1, 2, 4, 1, 0, 5, 3, 1, 5, 4, 3, 1, 4, 2, 3],
  [1, 0, 1, 5, 1, 1, 4, 5, 1, 1, 2, 4, 0, 0, 5, 3, 0, 5, 4, 3, 0, 4, 2, 3],
  [1, 0, 5, 4, 1, 0, 1, 5, 0, 0, 4, 3, 0, 4, 5, 3, 0, 5, 2, 3, 0, 1, 2, 5]
];
var SceneTileModel = class {
  constructor(shape, rotation, textureId, x, y, heightSw, heightSe, heightNe, heightNw, lightSw, lightSe, lightNe, lightNw, blendUnderlayHslSw, blendUnderlayHslSe, blendUnderlayHslNe, blendUnderlayHslNw, overlayHsl, overlayMinimapHsl, underlayRgb, overlayRgb) {
    this.shape = shape;
    this.rotation = rotation;
    this.textureId = textureId;
    this.lightSw = lightSw;
    this.lightSe = lightSe;
    this.lightNe = lightNe;
    this.lightNw = lightNw;
    this.blendUnderlayHslSw = blendUnderlayHslSw;
    this.blendUnderlayHslSe = blendUnderlayHslSe;
    this.blendUnderlayHslNe = blendUnderlayHslNe;
    this.blendUnderlayHslNw = blendUnderlayHslNw;
    this.overlayHsl = overlayHsl;
    this.overlayMinimapHsl = overlayMinimapHsl;
    this.underlayRgb = underlayRgb;
    this.overlayRgb = overlayRgb;
    this.faces = [];
    this.shape = shape;
    this.rotation = rotation;
    const underlayHslSw = this.underlayHslSw = adjustUnderlayLight(
      blendUnderlayHslSw,
      lightSw
    );
    const underlayHslSe = this.underlayHslSe = adjustUnderlayLight(
      blendUnderlayHslSe,
      lightSe
    );
    const underlayHslNe = this.underlayHslNe = adjustUnderlayLight(
      blendUnderlayHslNe,
      lightNe
    );
    const underlayHslNw = this.underlayHslNw = adjustUnderlayLight(
      blendUnderlayHslNw,
      lightNw
    );
    const underlayMinimapHslSw = adjustUnderlayLight(blendUnderlayHslSw, lightSw);
    const underlayMinimapHslSe = adjustUnderlayLight(blendUnderlayHslSw, lightSe);
    const underlayMinimapHslNe = adjustUnderlayLight(blendUnderlayHslSw, lightNe);
    const underlayMinimapHslNw = adjustUnderlayLight(blendUnderlayHslSw, lightNw);
    const overlayHslSw = this.overlayHslSw = adjustOverlayLight(overlayHsl, lightSw);
    const overlayHslSe = this.overlayHslSe = adjustOverlayLight(overlayHsl, lightSe);
    const overlayHslNe = this.overlayHslNe = adjustOverlayLight(overlayHsl, lightNe);
    const overlayHslNw = this.overlayHslNw = adjustOverlayLight(overlayHsl, lightNw);
    const overlayMinimapHslSw = this.overlayMinimapHslSw = adjustOverlayLight(
      overlayMinimapHsl,
      lightSw
    );
    const overlayMinimapHslSe = this.overlayMinimapHslSe = adjustOverlayLight(
      overlayMinimapHsl,
      lightSe
    );
    const overlayMinimapHslNe = this.overlayMinimapHslNe = adjustOverlayLight(
      overlayMinimapHsl,
      lightNe
    );
    const overlayMinimapHslNw = this.overlayMinimapHslNw = adjustOverlayLight(
      overlayMinimapHsl,
      lightNw
    );
    this.underlayRgb = underlayRgb;
    this.overlayRgb = overlayRgb;
    const vertexIndices = tileShapeVertexIndices[shape];
    const vertexCount = vertexIndices.length;
    this.vertexX = new Int32Array(vertexCount);
    this.vertexY = new Int32Array(vertexCount);
    this.vertexZ = new Int32Array(vertexCount);
    const underlayHsls = new Array(vertexCount);
    const underlayMinimapHsls = new Array(vertexCount);
    const overlayHsls = new Array(vertexCount);
    const overlayMinimapHsls = new Array(vertexCount);
    const tileX = x * TILE_SIZE;
    const tileY = y * TILE_SIZE;
    for (let i = 0; i < vertexCount; i++) {
      let vertexIndex = vertexIndices[i];
      if ((vertexIndex & 1) === 0 && vertexIndex <= 8) {
        vertexIndex = (vertexIndex - rotation - rotation - 1 & 7) + 1;
      }
      if (vertexIndex > 8 && vertexIndex <= 12) {
        vertexIndex = (vertexIndex - 9 - rotation & 3) + 9;
      }
      if (vertexIndex > 12 && vertexIndex <= 16) {
        vertexIndex = (vertexIndex - 13 - rotation & 3) + 13;
      }
      let vertX = 0;
      let vertZ = 0;
      let vertY = 0;
      let vertUnderlayHsl = 0;
      let vertUnderlayMinimapHsl = 0;
      let vertOverlayHsl = 0;
      let vertOverlayMinimapHsl = 0;
      if (vertexIndex === 1) {
        vertX = tileX;
        vertZ = tileY;
        vertY = heightSw;
        vertUnderlayHsl = underlayHslSw;
        vertUnderlayMinimapHsl = underlayMinimapHslSw;
        vertOverlayHsl = overlayHslSw;
        vertOverlayMinimapHsl = overlayMinimapHslSw;
      } else if (vertexIndex === 2) {
        vertX = tileX + HALF_TILE_SIZE;
        vertZ = tileY;
        vertY = heightSe + heightSw >> 1;
        vertUnderlayHsl = mixHsl(underlayHslSe, underlayHslSw);
        vertUnderlayMinimapHsl = underlayMinimapHslSe + underlayMinimapHslSw >> 1;
        vertOverlayHsl = overlayHslSe + overlayHslSw >> 1;
        vertOverlayMinimapHsl = overlayMinimapHslSe + overlayMinimapHslSw >> 1;
      } else if (vertexIndex === 3) {
        vertX = tileX + TILE_SIZE;
        vertZ = tileY;
        vertY = heightSe;
        vertUnderlayHsl = underlayHslSe;
        vertUnderlayMinimapHsl = underlayMinimapHslSe;
        vertOverlayHsl = overlayHslSe;
        vertOverlayMinimapHsl = overlayMinimapHslSe;
      } else if (vertexIndex === 4) {
        vertX = tileX + TILE_SIZE;
        vertZ = tileY + HALF_TILE_SIZE;
        vertY = heightNe + heightSe >> 1;
        vertUnderlayHsl = mixHsl(underlayHslSe, underlayHslNe);
        vertUnderlayMinimapHsl = underlayMinimapHslSe + underlayMinimapHslNe >> 1;
        vertOverlayHsl = overlayHslSe + overlayHslNe >> 1;
        vertOverlayMinimapHsl = overlayMinimapHslSe + overlayMinimapHslNe >> 1;
      } else if (vertexIndex === 5) {
        vertX = tileX + TILE_SIZE;
        vertZ = tileY + TILE_SIZE;
        vertY = heightNe;
        vertUnderlayHsl = underlayHslNe;
        vertUnderlayMinimapHsl = underlayMinimapHslNe;
        vertOverlayHsl = overlayHslNe;
        vertOverlayMinimapHsl = overlayMinimapHslNe;
      } else if (vertexIndex === 6) {
        vertX = tileX + HALF_TILE_SIZE;
        vertZ = tileY + TILE_SIZE;
        vertY = heightNe + heightNw >> 1;
        vertUnderlayHsl = mixHsl(underlayHslNw, underlayHslNe);
        vertUnderlayMinimapHsl = underlayMinimapHslNw + underlayMinimapHslNe >> 1;
        vertOverlayHsl = overlayHslNw + overlayHslNe >> 1;
        vertOverlayMinimapHsl = overlayMinimapHslNw + overlayMinimapHslNe >> 1;
      } else if (vertexIndex === 7) {
        vertX = tileX;
        vertZ = tileY + TILE_SIZE;
        vertY = heightNw;
        vertUnderlayHsl = underlayHslNw;
        vertUnderlayMinimapHsl = underlayMinimapHslNw;
        vertOverlayHsl = overlayHslNw;
        vertOverlayMinimapHsl = overlayMinimapHslNw;
      } else if (vertexIndex === 8) {
        vertX = tileX;
        vertZ = tileY + HALF_TILE_SIZE;
        vertY = heightNw + heightSw >> 1;
        vertUnderlayHsl = mixHsl(underlayHslNw, underlayHslSw);
        vertUnderlayMinimapHsl = underlayMinimapHslNw + underlayMinimapHslSw >> 1;
        vertOverlayHsl = overlayHslNw + overlayHslSw >> 1;
        vertOverlayMinimapHsl = overlayMinimapHslNw + overlayMinimapHslSw >> 1;
      } else if (vertexIndex === 9) {
        vertX = tileX + HALF_TILE_SIZE;
        vertZ = tileY + QUARTER_TILE_SIZE;
        vertY = heightSe + heightSw >> 1;
        vertUnderlayHsl = mixHsl(underlayHslSe, underlayHslSw);
        vertUnderlayMinimapHsl = underlayMinimapHslSe + underlayMinimapHslSw >> 1;
        vertOverlayHsl = overlayHslSe + overlayHslSw >> 1;
        vertOverlayMinimapHsl = overlayMinimapHslSe + overlayMinimapHslSw >> 1;
      } else if (vertexIndex === 10) {
        vertX = tileX + THREE_QTR_TILE_SIZE;
        vertZ = tileY + HALF_TILE_SIZE;
        vertY = heightNe + heightSe >> 1;
        vertUnderlayHsl = mixHsl(underlayHslSe, underlayHslNe);
        vertUnderlayMinimapHsl = underlayMinimapHslSe + underlayMinimapHslNe >> 1;
        vertOverlayHsl = overlayHslSe + overlayHslNe >> 1;
        vertOverlayMinimapHsl = overlayMinimapHslSe + overlayMinimapHslNe >> 1;
      } else if (vertexIndex === 11) {
        vertX = tileX + HALF_TILE_SIZE;
        vertZ = tileY + THREE_QTR_TILE_SIZE;
        vertY = heightNe + heightNw >> 1;
        vertUnderlayHsl = mixHsl(underlayHslNw, underlayHslNe);
        vertUnderlayMinimapHsl = underlayMinimapHslNw + underlayMinimapHslNe >> 1;
        vertOverlayHsl = overlayHslNw + overlayHslNe >> 1;
        vertOverlayMinimapHsl = overlayMinimapHslNw + overlayMinimapHslNe >> 1;
      } else if (vertexIndex === 12) {
        vertX = tileX + QUARTER_TILE_SIZE;
        vertZ = tileY + HALF_TILE_SIZE;
        vertY = heightNw + heightSw >> 1;
        vertUnderlayHsl = mixHsl(underlayHslNw, underlayHslSw);
        vertUnderlayMinimapHsl = underlayMinimapHslNw + underlayMinimapHslSw >> 1;
        vertOverlayHsl = overlayHslNw + overlayHslSw >> 1;
        vertOverlayMinimapHsl = overlayMinimapHslNw + overlayMinimapHslSw >> 1;
      } else if (vertexIndex === 13) {
        vertX = tileX + QUARTER_TILE_SIZE;
        vertZ = tileY + QUARTER_TILE_SIZE;
        vertY = heightSw;
        vertUnderlayHsl = underlayHslSw;
        vertUnderlayMinimapHsl = underlayMinimapHslSw;
        vertOverlayHsl = overlayHslSw;
        vertOverlayMinimapHsl = overlayMinimapHslSw;
      } else if (vertexIndex === 14) {
        vertX = tileX + THREE_QTR_TILE_SIZE;
        vertZ = tileY + QUARTER_TILE_SIZE;
        vertY = heightSe;
        vertUnderlayHsl = underlayHslSe;
        vertUnderlayMinimapHsl = underlayMinimapHslSe;
        vertOverlayHsl = overlayHslSe;
        vertOverlayMinimapHsl = overlayMinimapHslSe;
      } else if (vertexIndex === 15) {
        vertX = tileX + THREE_QTR_TILE_SIZE;
        vertZ = tileY + THREE_QTR_TILE_SIZE;
        vertY = heightNe;
        vertUnderlayHsl = underlayHslNe;
        vertUnderlayMinimapHsl = underlayMinimapHslNe;
        vertOverlayHsl = overlayHslNe;
        vertOverlayMinimapHsl = overlayMinimapHslNe;
      } else {
        vertX = tileX + QUARTER_TILE_SIZE;
        vertZ = tileY + THREE_QTR_TILE_SIZE;
        vertY = heightNw;
        vertUnderlayHsl = underlayHslNw;
        vertUnderlayMinimapHsl = underlayMinimapHslNw;
        vertOverlayHsl = overlayHslNw;
        vertOverlayMinimapHsl = overlayMinimapHslNw;
      }
      this.vertexX[i] = vertX;
      this.vertexY[i] = vertY;
      this.vertexZ[i] = vertZ;
      underlayHsls[i] = vertUnderlayHsl;
      underlayMinimapHsls[i] = vertUnderlayMinimapHsl;
      overlayHsls[i] = vertOverlayHsl;
      overlayMinimapHsls[i] = vertOverlayMinimapHsl;
    }
    const tileFaces = tileShapeFaces[shape];
    const faceCount = tileFaces.length / 4;
    this.normalFaceCount = faceCount;
    this.facesA = new Int32Array(faceCount);
    this.facesB = new Int32Array(faceCount);
    this.facesC = new Int32Array(faceCount);
    this.faceColorsA = new Int32Array(faceCount);
    this.faceColorsB = new Int32Array(faceCount);
    this.faceColorsC = new Int32Array(faceCount);
    this.minimapFaceColorsA = new Int32Array(faceCount);
    this.minimapFaceColorsB = new Int32Array(faceCount);
    this.minimapFaceColorsC = new Int32Array(faceCount);
    if (textureId !== -1) {
      this.faceTextures = new Int32Array(faceCount);
    }
    let tileFaceIndex = 0;
    for (let i = 0; i < faceCount; i++) {
      const isOverlay = tileFaces[tileFaceIndex++] === 1;
      let a = tileFaces[tileFaceIndex++];
      let b = tileFaces[tileFaceIndex++];
      let c = tileFaces[tileFaceIndex++];
      if (a < 4) {
        a = a - rotation & 3;
      }
      if (b < 4) {
        b = b - rotation & 3;
      }
      if (c < 4) {
        c = c - rotation & 3;
      }
      this.facesA[i] = a;
      this.facesB[i] = b;
      this.facesC[i] = c;
      let faceTextureId = -1;
      let hslA = 0;
      let hslB = 0;
      let hslC = 0;
      let minimapHslA = 0;
      let minimapHslB = 0;
      let minimapHslC = 0;
      if (isOverlay) {
        hslA = overlayHsls[a];
        hslB = overlayHsls[b];
        hslC = overlayHsls[c];
        minimapHslA = overlayMinimapHsls[a];
        minimapHslB = overlayMinimapHsls[b];
        minimapHslC = overlayMinimapHsls[c];
        faceTextureId = textureId;
        if (this.faceTextures) {
          this.faceTextures[i] = textureId;
        }
      } else {
        hslA = underlayHsls[a];
        hslB = underlayHsls[b];
        hslC = underlayHsls[c];
        minimapHslA = underlayMinimapHsls[a];
        minimapHslB = underlayMinimapHsls[b];
        minimapHslC = underlayMinimapHsls[c];
        if (this.faceTextures) {
          this.faceTextures[i] = -1;
        }
      }
      this.faceColorsA[i] = hslA;
      this.faceColorsB[i] = hslB;
      this.faceColorsC[i] = hslC;
      this.minimapFaceColorsA[i] = minimapHslA;
      this.minimapFaceColorsB[i] = minimapHslB;
      this.minimapFaceColorsC[i] = minimapHslC;
      if (hslA === INVALID_HSL_COLOR && faceTextureId === -1) {
        continue;
      }
      const u0 = (this.vertexX[a] - tileX) / TILE_SIZE;
      const v0 = (this.vertexZ[a] - tileY) / TILE_SIZE;
      const u1 = (this.vertexX[b] - tileX) / TILE_SIZE;
      const v1 = (this.vertexZ[b] - tileY) / TILE_SIZE;
      const u2 = (this.vertexX[c] - tileX) / TILE_SIZE;
      const v2 = (this.vertexZ[c] - tileY) / TILE_SIZE;
      this.faces.push({
        vertices: [
          {
            x: this.vertexX[a],
            y: this.vertexY[a],
            z: this.vertexZ[a],
            hsl: hslA,
            u: u0,
            v: v0,
            textureId: faceTextureId
          },
          {
            x: this.vertexX[b],
            y: this.vertexY[b],
            z: this.vertexZ[b],
            hsl: hslB,
            u: u1,
            v: v1,
            textureId: faceTextureId
          },
          {
            x: this.vertexX[c],
            y: this.vertexY[c],
            z: this.vertexZ[c],
            hsl: hslC,
            u: u2,
            v: v2,
            textureId: faceTextureId
          }
        ]
      });
    }
  }
};

// ../rs-party-dashboard/src/rs/scene/entity/LocEntity.ts
var LocEntity = class extends Entity {
  constructor(id, type, rotation, level, tileX, tileY, seqId, seqRandomStart) {
    super();
    this.id = id;
    this.type = type;
    this.rotation = rotation;
    this.level = level;
    this.tileX = tileX;
    this.tileY = tileY;
    this.seqId = seqId;
    this.seqRandomStart = seqRandomStart;
  }
};

// ../rs-party-dashboard/src/rs/scene/SceneBuilder.ts
function readTerrainValue(buffer, newFormat, signed = false) {
  if (newFormat) {
    return signed ? buffer.readShort() : buffer.readUnsignedShort();
  } else {
    return signed ? buffer.readByte() : buffer.readUnsignedByte();
  }
}
var SceneBuilder = class _SceneBuilder {
  constructor(cacheInfo, mapFileLoader, underlayTypeLoader, overlayTypeLoader, locTypeLoader, locModelLoader, xteasMap) {
    this.cacheInfo = cacheInfo;
    this.mapFileLoader = mapFileLoader;
    this.underlayTypeLoader = underlayTypeLoader;
    this.overlayTypeLoader = overlayTypeLoader;
    this.locTypeLoader = locTypeLoader;
    this.locModelLoader = locModelLoader;
    this.xteasMap = xteasMap;
    this.newTerrainFormat = this.cacheInfo.game === "oldschool" && this.cacheInfo.revision >= 209;
    this.centerLocHeightWithSize = this.cacheInfo.game === "oldschool" || this.cacheInfo.revision >= 465;
  }
  static {
    this.BLEND_RADIUS = 5;
  }
  static {
    this.displacementX = [1, 0, -1, 0];
  }
  static {
    this.displacementY = [0, -1, 0, 1];
  }
  static {
    this.diagonalDisplacementX = [1, -1, -1, 1];
  }
  static {
    this.diagonalDisplacementY = [-1, -1, 1, 1];
  }
  static {
    this.WATER_OVERLAY_ID = 5;
  }
  static fillEmptyTerrain(info) {
    return info.game === "runescape" && info.revision <= 225;
  }
  getTerrainData(mapX, mapY) {
    return this.mapFileLoader.getTerrainData(mapX, mapY);
  }
  getLocData(mapX, mapY) {
    return this.mapFileLoader.getLocData(mapX, mapY, this.xteasMap);
  }
  getNpcSpawnData(mapX, mapY) {
    return this.mapFileLoader.getNpcSpawnData(mapX, mapY, this.xteasMap);
  }
  buildScene(baseX, baseY, sizeX, sizeY, smoothUnderlays = false, locLoadType = 0 /* MODELS */) {
    const scene = new Scene(Scene.MAX_LEVELS, sizeX, sizeY);
    const mapStartX = Math.floor(baseX / Scene.MAP_SQUARE_SIZE);
    const mapStartY = Math.floor(baseY / Scene.MAP_SQUARE_SIZE);
    const mapEndX = Math.ceil((baseX + sizeX) / Scene.MAP_SQUARE_SIZE);
    const mapEndY = Math.ceil((baseY + sizeY) / Scene.MAP_SQUARE_SIZE);
    const emptyTerrainIds = /* @__PURE__ */ new Set();
    for (let mx = mapStartX; mx < mapEndX; mx++) {
      for (let my = mapStartY; my < mapEndY; my++) {
        const terrainData = this.getTerrainData(mx, my);
        if (terrainData) {
          const offsetX = mx * Scene.MAP_SQUARE_SIZE - baseX;
          const offsetY = my * Scene.MAP_SQUARE_SIZE - baseY;
          this.decodeTerrain(scene, terrainData, offsetX, offsetY, baseX, baseY);
        } else {
          emptyTerrainIds.add(getMapSquareId(mx, my));
        }
      }
    }
    for (let mx = mapStartX; mx < mapEndX; mx++) {
      for (let my = mapStartY; my < mapEndY; my++) {
        if (!emptyTerrainIds.has(getMapSquareId(mx, my))) {
          continue;
        }
        const endX = (mx + 1) * Scene.MAP_SQUARE_SIZE;
        const endY = (my + 1) * Scene.MAP_SQUARE_SIZE;
        const offsetX = mx * Scene.MAP_SQUARE_SIZE - baseX;
        const offsetY = my * Scene.MAP_SQUARE_SIZE - baseY;
        const tileX = Math.max(offsetX, 0);
        const tileY = Math.max(offsetY, 0);
        const emptySizeX = endX - baseX - tileX;
        const emptySizeY = endY - baseY - tileY;
        for (let level = 0; level < scene.levels; level++) {
          this.loadEmptyTerrain(scene, level, tileX, tileY, emptySizeX, emptySizeY);
        }
      }
    }
    for (let mx = mapStartX; mx < mapEndX; mx++) {
      for (let my = mapStartY; my < mapEndY; my++) {
        const locData = this.getLocData(mx, my);
        if (!locData) {
          continue;
        }
        const offsetX = mx * Scene.MAP_SQUARE_SIZE - baseX;
        const offsetY = my * Scene.MAP_SQUARE_SIZE - baseY;
        this.decodeLocs(scene, locData, offsetX, offsetY, locLoadType);
      }
    }
    this.addTileModels(scene, smoothUnderlays);
    scene.setTileMinLevels();
    if (locLoadType === 0 /* MODELS */) {
      scene.light(this.locModelLoader.textureLoader, -50, -10, -50);
    }
    return scene;
  }
  loadEmptyTerrain(scene, level, tileX, tileY, sizeX, sizeY) {
    const fillEmptyTerrain = _SceneBuilder.fillEmptyTerrain(this.cacheInfo);
    for (let ty = tileY; ty < tileY + sizeY; ty++) {
      for (let tx = tileX; tx < tileX + sizeX; tx++) {
        if (tx >= 0 && tx < scene.sizeX && ty >= 0 && ty < scene.sizeY) {
          if (level === 0) {
            scene.tileHeights[level][tx][ty] = 0;
            if (fillEmptyTerrain) {
              scene.tileOverlays[level][tx][ty] = _SceneBuilder.WATER_OVERLAY_ID + 1;
            }
          } else {
            scene.tileHeights[level][tx][ty] = scene.tileHeights[level - 1][tx][ty] - Scene.UNITS_LEVEL_HEIGHT;
          }
        }
      }
    }
    if (tileX > 0 && scene.sizeX > tileX) {
      for (let ty = tileY + 1; ty < tileY + sizeY; ty++) {
        if (ty >= 0 && ty < scene.sizeY) {
          scene.tileHeights[level][tileX][ty] = scene.tileHeights[level][tileX - 1][ty];
        }
      }
    }
    if (tileY > 0 && scene.sizeY > tileY) {
      for (let tx = tileX + 1; tx < tileX + sizeX; tx++) {
        if (tx >= 0 && tx < scene.sizeX) {
          scene.tileHeights[level][tx][tileY] = scene.tileHeights[level][tx][tileY - 1];
        }
      }
    }
    if (tileX >= 0 && tileY >= 0 && tileX < scene.sizeX && tileY < scene.sizeY) {
      if (level !== 0) {
        if (tileX > 0 && scene.tileHeights[level][tileX - 1][tileY] !== scene.tileHeights[level - 1][tileX - 1][tileY]) {
          scene.tileHeights[level][tileX][tileY] = scene.tileHeights[level][tileX - 1][tileY];
        } else if (tileY <= 0 || scene.tileHeights[level][tileX][tileY - 1] === scene.tileHeights[level - 1][tileX][tileY - 1]) {
          if (tileX > 0 && tileY > 0 && scene.tileHeights[level][tileX - 1][tileY - 1] !== scene.tileHeights[level - 1][tileX - 1][tileY - 1]) {
            scene.tileHeights[level][tileX][tileY] = scene.tileHeights[level][tileX - 1][tileY - 1];
          }
        } else {
          scene.tileHeights[level][tileX][tileY] = scene.tileHeights[level][tileX][tileY - 1];
        }
      } else if (tileX > 0 && scene.tileHeights[level][tileX - 1][tileY] !== 0) {
        scene.tileHeights[level][tileX][tileY] = scene.tileHeights[level][tileX - 1][tileY];
      } else if (tileY > 0 && scene.tileHeights[level][tileX][tileY - 1] !== 0) {
        scene.tileHeights[level][tileX][tileY] = scene.tileHeights[level][tileX][tileY - 1];
      } else if (tileX > 0 && tileY > 0 && scene.tileHeights[level][tileX - 1][tileY - 1] !== 0) {
        scene.tileHeights[level][tileX][tileY] = scene.tileHeights[level][tileX - 1][tileY - 1];
      }
    }
  }
  decodeTerrain(scene, data, offsetX, offsetY, baseX, baseY) {
    const buffer = new ByteBuffer(data);
    for (let level = 0; level < Scene.MAX_LEVELS; level++) {
      for (let x = 0; x < Scene.MAP_SQUARE_SIZE; x++) {
        for (let y = 0; y < Scene.MAP_SQUARE_SIZE; y++) {
          this.decodeTerrainTile(
            scene,
            buffer,
            level,
            x + offsetX,
            y + offsetY,
            baseX,
            baseY,
            0
          );
        }
      }
    }
    for (let level = 0; level < Scene.MAX_LEVELS; level++) {
      for (let x = 0; x < Scene.MAP_SQUARE_SIZE; x++) {
        for (let y = 0; y < Scene.MAP_SQUARE_SIZE; y++) {
          const sceneX = x + offsetX;
          const sceneY = y + offsetY;
          if (!scene.isWithinBounds(level, sceneX, sceneY)) {
            continue;
          }
          if ((scene.tileRenderFlags[level][x][y] & 1) === 1) {
            let realLevel = level;
            if ((scene.tileRenderFlags[1][x][y] & 2) === 2) {
              realLevel = level - 1;
            }
            if (realLevel >= 0) {
              scene.collisionMaps[realLevel].setBlockedByFloor(x, y);
            }
          }
        }
      }
    }
  }
  decodeTerrainTile(scene, buffer, level, x, y, baseX, baseY, rotOffset) {
    if (scene.isWithinBounds(level, x, y)) {
      scene.tileRenderFlags[level][x][y] = 0;
      while (true) {
        const v = readTerrainValue(buffer, this.newTerrainFormat);
        if (v === 0) {
          if (level === 0) {
            const worldX = baseX + x + 932731;
            const worldY = baseY + y + 556238;
            scene.tileHeights[level][x][y] = -generateHeight(worldX, worldY) * Scene.UNITS_TILE_HEIGHT_BASIS;
          } else {
            scene.tileHeights[level][x][y] = scene.tileHeights[level - 1][x][y] - Scene.UNITS_LEVEL_HEIGHT;
          }
          break;
        }
        if (v === 1) {
          let height = buffer.readUnsignedByte();
          if (height === 1) {
            height = 0;
          }
          if (level === 0) {
            scene.tileHeights[0][x][y] = -height * Scene.UNITS_TILE_HEIGHT_BASIS;
          } else {
            scene.tileHeights[level][x][y] = scene.tileHeights[level - 1][x][y] - height * Scene.UNITS_TILE_HEIGHT_BASIS;
          }
          break;
        }
        if (v <= 49) {
          scene.tileOverlays[level][x][y] = readTerrainValue(
            buffer,
            this.newTerrainFormat
          );
          scene.tileShapes[level][x][y] = (v - 2) / 4;
          scene.tileRotations[level][x][y] = v - 2 + rotOffset & 3;
        } else if (v <= 81) {
          scene.tileRenderFlags[level][x][y] = v - 49;
        } else {
          scene.tileUnderlays[level][x][y] = v - 81;
        }
      }
    } else {
      while (true) {
        const v = readTerrainValue(buffer, this.newTerrainFormat);
        if (v === 0) {
          break;
        }
        if (v === 1) {
          buffer.readUnsignedByte();
          break;
        }
        if (v <= 49) {
          readTerrainValue(buffer, this.newTerrainFormat);
        }
      }
    }
  }
  decodeLocs(scene, data, offsetX, offsetY, locLoadType) {
    const buffer = new ByteBuffer(data);
    let id = -1;
    let idDelta;
    while ((idDelta = buffer.readSmart3()) !== 0) {
      id += idDelta;
      let pos = 0;
      let posDelta;
      while ((posDelta = buffer.readUnsignedSmart()) !== 0) {
        pos += posDelta - 1;
        const localX = pos >> 6 & 63;
        const localY = pos & 63;
        const level = pos >> 12;
        const attributes = buffer.readUnsignedByte();
        const type = attributes >> 2;
        const rotation = attributes & 3;
        const sceneX = localX + offsetX;
        const sceneY = localY + offsetY;
        if (sceneX > 0 && sceneY > 0 && sceneX < scene.sizeX - 1 && sceneY < scene.sizeY - 1) {
          let transformedLevel = level;
          if ((scene.tileRenderFlags[1][sceneX][sceneY] & 2) === 2) {
            transformedLevel = level - 1;
          }
          let collisionMap = void 0;
          if (transformedLevel >= 0) {
            collisionMap = scene.collisionMaps[transformedLevel];
          }
          this.addLoc(
            scene,
            level,
            sceneX,
            sceneY,
            id,
            type,
            rotation,
            collisionMap,
            locLoadType
          );
        }
      }
    }
  }
  addLoc(scene, level, tileX, tileY, id, type, rotation, collisionMap, locLoadType) {
    const locType = this.locTypeLoader.load(id);
    let sizeX = locType.sizeX;
    let sizeY = locType.sizeY;
    if (rotation === 1 || rotation === 3) {
      sizeX = locType.sizeY;
      sizeY = locType.sizeX;
    }
    let startX;
    let endX;
    if (tileX + sizeX <= scene.sizeX) {
      startX = (sizeX >> 1) + tileX;
      endX = (sizeX + 1 >> 1) + tileX;
    } else {
      startX = tileX;
      endX = tileX + 1;
    }
    let startY;
    let endY;
    if (tileY + sizeY <= scene.sizeY) {
      startY = (sizeY >> 1) + tileY;
      endY = tileY + (sizeY + 1 >> 1);
    } else {
      startY = tileY;
      endY = tileY + 1;
    }
    if (!this.centerLocHeightWithSize) {
      startX = tileX;
      endX = tileX + 1;
      startY = tileY;
      endY = tileY + 1;
    }
    const heightMap = scene.tileHeights[level];
    let heightMapAbove;
    if (level < scene.levels - 1) {
      heightMapAbove = scene.tileHeights[level + 1];
    }
    const centerHeight = heightMap[endX][endY] + heightMap[startX][endY] + heightMap[startX][startY] + heightMap[endX][startY] >> 2;
    const entityX = (tileX << 7) + (sizeX << 6);
    const entityY = (tileY << 7) + (sizeY << 6);
    const tag = calculateEntityTag(
      tileX,
      tileY,
      2 /* LOC */,
      locType.isInteractive === 0,
      id
    );
    let flags = rotation << 6 | type;
    if (locType.supportItems === 1) {
      flags += 256;
    }
    const contourGroundInfo = {
      type: locType.contourGroundType,
      param: locType.contourGroundParam,
      heightMap,
      heightMapAbove,
      entityX,
      entityY: centerHeight,
      entityZ: entityY
    };
    let seqId = locType.seqId;
    if (seqId === -1 && locType.randomSeqIds && locType.randomSeqIds.length > 0) {
      seqId = locType.randomSeqIds[0];
    }
    const isEntity = seqId !== -1 || locType.transforms !== void 0 || locLoadType === 1 /* NO_MODELS */;
    if (type === 22 /* FLOOR_DECORATION */) {
      let entity;
      if (isEntity) {
        entity = new LocEntity(
          id,
          type,
          rotation,
          level,
          tileX,
          tileY,
          seqId,
          locType.seqRandomStart
        );
      } else {
        entity = this.locModelLoader.getModel(locType, type, rotation, contourGroundInfo);
      }
      scene.newFloorDecoration(level, tileX, tileY, centerHeight, entity, tag, flags);
      if (locType.clipType === 1 && collisionMap) {
        collisionMap.setBlockedByFloorDec(tileX, tileY);
      }
    } else if (type === 10 /* NORMAL */ || type === 11 /* NORMAL_DIAGIONAL */) {
      const locRotation = type === 10 /* NORMAL */ ? rotation : rotation + 4;
      let entity;
      if (isEntity) {
        entity = new LocEntity(
          id,
          10 /* NORMAL */,
          locRotation,
          level,
          tileX,
          tileY,
          seqId,
          locType.seqRandomStart
        );
      } else {
        entity = this.locModelLoader.getModel(
          locType,
          10 /* NORMAL */,
          locRotation,
          contourGroundInfo
        );
      }
      if (entity) {
        const added = scene.newLoc(
          level,
          tileX,
          tileY,
          centerHeight,
          sizeX,
          sizeY,
          entity,
          0,
          tag,
          flags
        );
        if (added && locType.clipped) {
          let lightOcclusion = 15;
          if (entity instanceof Model) {
            lightOcclusion = entity.getXZRadius() / 4 | 0;
            if (lightOcclusion > 30) {
              lightOcclusion = 30;
            }
          }
          for (let sx = tileX; sx <= tileX + sizeX; sx++) {
            for (let sy = tileY; sy <= tileY + sizeY; sy++) {
              const currentOcclusion = scene.tileLightOcclusions[level][sx][sy];
              if (lightOcclusion > currentOcclusion) {
                scene.tileLightOcclusions[level][sx][sy] = lightOcclusion;
              }
            }
          }
        }
      }
      if (locType.clipType !== 0 && collisionMap) {
        collisionMap.addLoc(tileX, tileY, sizeX, sizeY, locType.blocksProjectile);
      }
    } else if (type >= 12 /* ROOF_SLOPED */) {
      let entity;
      if (isEntity) {
        entity = new LocEntity(
          id,
          type,
          rotation,
          level,
          tileX,
          tileY,
          seqId,
          locType.seqRandomStart
        );
      } else {
        entity = this.locModelLoader.getModel(locType, type, rotation, contourGroundInfo);
      }
      scene.newLoc(level, tileX, tileY, centerHeight, 1, 1, entity, 0, tag, flags);
    } else if (type === 0 /* WALL */) {
      let entity;
      if (isEntity) {
        entity = new LocEntity(
          id,
          type,
          rotation,
          level,
          tileX,
          tileY,
          seqId,
          locType.seqRandomStart
        );
      } else {
        entity = this.locModelLoader.getModel(locType, type, rotation, contourGroundInfo);
      }
      scene.newWall(level, tileX, tileY, centerHeight, entity, void 0, tag, flags);
      if (locType.clipType !== 0 && collisionMap) {
        collisionMap.addWall(tileX, tileY, type, rotation, locType.blocksProjectile);
      }
      if (locType.decorDisplacement !== LocType.DEFAULT_DECOR_DISPLACEMENT) {
        scene.updateWallDecorationDisplacement(
          level,
          tileX,
          tileY,
          locType.decorDisplacement
        );
      }
      if (rotation === 0) {
        if (locType.clipped) {
          scene.tileLightOcclusions[level][tileX][tileY] = 50;
          scene.tileLightOcclusions[level][tileX][tileY + 1] = 50;
        }
      } else if (rotation === 1) {
        if (locType.clipped) {
          scene.tileLightOcclusions[level][tileX][tileY + 1] = 50;
          scene.tileLightOcclusions[level][tileX + 1][tileY + 1] = 50;
        }
      } else if (rotation === 2) {
        if (locType.clipped) {
          scene.tileLightOcclusions[level][tileX + 1][tileY] = 50;
          scene.tileLightOcclusions[level][tileX + 1][tileY + 1] = 50;
        }
      } else if (rotation === 3) {
        if (locType.clipped) {
          scene.tileLightOcclusions[level][tileX][tileY] = 50;
          scene.tileLightOcclusions[level][tileX + 1][tileY] = 50;
        }
      }
    } else if (type === 1 /* WALL_TRI_CORNER */) {
      let entity;
      if (isEntity) {
        entity = new LocEntity(
          id,
          type,
          rotation,
          level,
          tileX,
          tileY,
          seqId,
          locType.seqRandomStart
        );
      } else {
        entity = this.locModelLoader.getModel(locType, type, rotation, contourGroundInfo);
      }
      scene.newWall(level, tileX, tileY, centerHeight, entity, void 0, tag, flags);
      if (locType.clipType !== 0 && collisionMap) {
        collisionMap.addWall(tileX, tileY, type, rotation, locType.blocksProjectile);
      }
      if (locType.clipped) {
        if (rotation === 0) {
          scene.tileLightOcclusions[level][tileX][tileY + 1] = 50;
        } else if (rotation === 1) {
          scene.tileLightOcclusions[level][tileX + 1][tileY + 1] = 50;
        } else if (rotation === 2) {
          scene.tileLightOcclusions[level][tileX + 1][tileY] = 50;
        } else if (rotation === 3) {
          scene.tileLightOcclusions[level][tileX][tileY] = 50;
        }
      }
    } else if (type === 2 /* WALL_CORNER */) {
      let entity0;
      let entity1;
      if (isEntity) {
        entity0 = new LocEntity(
          id,
          type,
          rotation + 4,
          level,
          tileX,
          tileY,
          seqId,
          locType.seqRandomStart
        );
        entity1 = new LocEntity(
          id,
          type,
          rotation + 1 & 3,
          level,
          tileX,
          tileY,
          seqId,
          locType.seqRandomStart
        );
      } else {
        entity0 = this.locModelLoader.getModel(
          locType,
          type,
          rotation + 4,
          contourGroundInfo
        );
        entity1 = this.locModelLoader.getModel(
          locType,
          type,
          rotation + 1 & 3,
          contourGroundInfo
        );
      }
      scene.newWall(level, tileX, tileY, centerHeight, entity0, entity1, tag, flags);
      if (locType.clipType !== 0 && collisionMap) {
        collisionMap.addWall(tileX, tileY, type, rotation, locType.blocksProjectile);
      }
      if (locType.decorDisplacement !== LocType.DEFAULT_DECOR_DISPLACEMENT) {
        scene.updateWallDecorationDisplacement(
          level,
          tileX,
          tileY,
          locType.decorDisplacement
        );
      }
    } else if (type === 3 /* WALL_RECT_CORNER */) {
      let entity;
      if (isEntity) {
        entity = new LocEntity(
          id,
          type,
          rotation,
          level,
          tileX,
          tileY,
          seqId,
          locType.seqRandomStart
        );
      } else {
        entity = this.locModelLoader.getModel(locType, type, rotation, contourGroundInfo);
      }
      scene.newWall(level, tileX, tileY, centerHeight, entity, void 0, tag, flags);
      if (locType.clipType !== 0 && collisionMap) {
        collisionMap.addWall(tileX, tileY, type, rotation, locType.blocksProjectile);
      }
      if (locType.clipped) {
        if (rotation === 0) {
          scene.tileLightOcclusions[level][tileX][tileY + 1] = 50;
        } else if (rotation === 1) {
          scene.tileLightOcclusions[level][tileX + 1][tileY + 1] = 50;
        } else if (rotation === 2) {
          scene.tileLightOcclusions[level][tileX + 1][tileY] = 50;
        } else if (rotation === 3) {
          scene.tileLightOcclusions[level][tileX][tileY] = 50;
        }
      }
    } else if (type === 9 /* WALL_DIAGONAL */) {
      let entity;
      if (isEntity) {
        entity = new LocEntity(
          id,
          type,
          rotation,
          level,
          tileX,
          tileY,
          seqId,
          locType.seqRandomStart
        );
      } else {
        entity = this.locModelLoader.getModel(locType, type, rotation, contourGroundInfo);
      }
      scene.newLoc(level, tileX, tileY, centerHeight, 1, 1, entity, 0, tag, flags);
      if (locType.clipType !== 0 && collisionMap) {
        collisionMap.addLoc(tileX, tileY, sizeX, sizeY, locType.blocksProjectile);
      }
      if (locType.decorDisplacement !== LocType.DEFAULT_DECOR_DISPLACEMENT) {
        scene.updateWallDecorationDisplacement(
          level,
          tileX,
          tileY,
          locType.decorDisplacement
        );
      }
    } else if (type === 4 /* WALL_DECORATION_INSIDE */) {
      let entity;
      if (isEntity) {
        entity = new LocEntity(
          id,
          4 /* WALL_DECORATION_INSIDE */,
          rotation,
          level,
          tileX,
          tileY,
          seqId,
          locType.seqRandomStart
        );
      } else {
        entity = this.locModelLoader.getModel(
          locType,
          4 /* WALL_DECORATION_INSIDE */,
          rotation,
          contourGroundInfo
        );
      }
      scene.newWallDecoration(
        level,
        tileX,
        tileY,
        centerHeight,
        entity,
        void 0,
        0,
        0,
        tag,
        flags
      );
      if (locType.decorDisplacement !== LocType.DEFAULT_DECOR_DISPLACEMENT) {
        scene.updateWallDecorationDisplacement(
          level,
          tileX,
          tileY,
          locType.decorDisplacement
        );
      }
    } else if (type === 5 /* WALL_DECORATION_OUTSIDE */) {
      let displacement = LocType.DEFAULT_DECOR_DISPLACEMENT;
      const wallTag = scene.getWallTag(level, tileX, tileY);
      if (wallTag !== 0n) {
        displacement = this.locTypeLoader.load(getIdFromTag(wallTag)).decorDisplacement;
      }
      let entity;
      if (isEntity) {
        entity = new LocEntity(
          id,
          4 /* WALL_DECORATION_INSIDE */,
          rotation,
          level,
          tileX,
          tileY,
          seqId,
          locType.seqRandomStart
        );
      } else {
        entity = this.locModelLoader.getModel(
          locType,
          4 /* WALL_DECORATION_INSIDE */,
          rotation,
          contourGroundInfo
        );
      }
      const displacementX = displacement * _SceneBuilder.displacementX[rotation];
      const displacementY = displacement * _SceneBuilder.displacementY[rotation];
      scene.newWallDecoration(
        level,
        tileX,
        tileY,
        centerHeight,
        entity,
        void 0,
        displacementX,
        displacementY,
        tag,
        flags
      );
    } else if (type === 6 /* WALL_DECORATION_DIAGONAL_OUTSIDE */) {
      let displacement = LocType.DEFAULT_DECOR_DISPLACEMENT / 2;
      const wallTag = scene.getWallTag(level, tileX, tileY);
      if (wallTag !== 0n) {
        displacement = this.locTypeLoader.load(getIdFromTag(wallTag)).decorDisplacement / 2 | 0;
      }
      let entity;
      if (isEntity) {
        entity = new LocEntity(
          id,
          4 /* WALL_DECORATION_INSIDE */,
          rotation + 4,
          level,
          tileX,
          tileY,
          seqId,
          locType.seqRandomStart
        );
      } else {
        entity = this.locModelLoader.getModel(
          locType,
          4 /* WALL_DECORATION_INSIDE */,
          rotation + 4,
          contourGroundInfo
        );
      }
      const displacementX = displacement * _SceneBuilder.diagonalDisplacementX[rotation];
      const displacementY = displacement * _SceneBuilder.diagonalDisplacementY[rotation];
      scene.newWallDecoration(
        level,
        tileX,
        tileY,
        centerHeight,
        entity,
        void 0,
        displacementX,
        displacementY,
        tag,
        flags
      );
    } else if (type === 7 /* WALL_DECORATION_DIAGONAL_INSIDE */) {
      const insideRotation = rotation + 2 & 3;
      let entity;
      if (isEntity) {
        entity = new LocEntity(
          id,
          4 /* WALL_DECORATION_INSIDE */,
          insideRotation + 4,
          level,
          tileX,
          tileY,
          seqId,
          locType.seqRandomStart
        );
      } else {
        entity = this.locModelLoader.getModel(
          locType,
          4 /* WALL_DECORATION_INSIDE */,
          insideRotation + 4,
          contourGroundInfo
        );
      }
      scene.newWallDecoration(
        level,
        tileX,
        tileY,
        centerHeight,
        entity,
        void 0,
        0,
        0,
        tag,
        flags
      );
    } else if (type === 8 /* WALL_DECORATION_DIAGONAL_DOUBLE */) {
      let displacement = LocType.DEFAULT_DECOR_DISPLACEMENT / 2;
      const wallTag = scene.getWallTag(level, tileX, tileY);
      if (wallTag !== 0n) {
        displacement = this.locTypeLoader.load(getIdFromTag(wallTag)).decorDisplacement / 2 | 0;
      }
      const insideRotation = rotation + 2 & 3;
      let entity0;
      let entity1;
      if (isEntity) {
        entity0 = new LocEntity(
          id,
          4 /* WALL_DECORATION_INSIDE */,
          rotation + 4,
          level,
          tileX,
          tileY,
          seqId,
          locType.seqRandomStart
        );
        entity1 = new LocEntity(
          id,
          4 /* WALL_DECORATION_INSIDE */,
          insideRotation + 4,
          level,
          tileX,
          tileY,
          seqId,
          locType.seqRandomStart
        );
      } else {
        entity0 = this.locModelLoader.getModel(
          locType,
          4 /* WALL_DECORATION_INSIDE */,
          rotation + 4,
          contourGroundInfo
        );
        entity1 = this.locModelLoader.getModel(
          locType,
          4 /* WALL_DECORATION_INSIDE */,
          insideRotation + 4,
          contourGroundInfo
        );
      }
      const displacementX = displacement * _SceneBuilder.diagonalDisplacementX[rotation];
      const displacementY = displacement * _SceneBuilder.diagonalDisplacementY[rotation];
      scene.newWallDecoration(
        level,
        tileX,
        tileY,
        centerHeight,
        entity0,
        entity1,
        displacementX,
        displacementY,
        tag,
        flags
      );
    }
  }
  blendUnderlays(scene, level) {
    const colors = new Array(scene.sizeX);
    for (let i = 0; i < scene.sizeX; i++) {
      colors[i] = new Int32Array(scene.sizeY).fill(-1);
    }
    const maxSize = Math.max(scene.sizeX, scene.sizeY);
    const hues = new Int32Array(maxSize);
    const sats = new Int32Array(hues.length);
    const light = new Int32Array(hues.length);
    const mul = new Int32Array(hues.length);
    const num = new Int32Array(hues.length);
    const blendStartX = -_SceneBuilder.BLEND_RADIUS;
    const blendStartY = -_SceneBuilder.BLEND_RADIUS;
    const blendEndX = scene.sizeX + _SceneBuilder.BLEND_RADIUS;
    const blendEndY = scene.sizeY + _SceneBuilder.BLEND_RADIUS;
    for (let xi = blendStartX; xi < blendEndX; xi++) {
      for (let yi = 0; yi < scene.sizeY; yi++) {
        const xEast = xi + _SceneBuilder.BLEND_RADIUS;
        if (xEast >= 0 && xEast < scene.sizeX) {
          const underlayId = scene.tileUnderlays[level][xEast][yi];
          if (underlayId > 0) {
            const underlay = this.underlayTypeLoader.load(underlayId - 1);
            hues[yi] += underlay.getHueBlend();
            sats[yi] += underlay.saturation;
            light[yi] += underlay.lightness;
            mul[yi] += underlay.getHueMultiplier();
            num[yi]++;
          }
        }
        const xWest = xi - _SceneBuilder.BLEND_RADIUS;
        if (xWest >= 0 && xWest < scene.sizeX) {
          const underlayId = scene.tileUnderlays[level][xWest][yi];
          if (underlayId > 0) {
            const underlay = this.underlayTypeLoader.load(underlayId - 1);
            hues[yi] -= underlay.getHueBlend();
            sats[yi] -= underlay.saturation;
            light[yi] -= underlay.lightness;
            mul[yi] -= underlay.getHueMultiplier();
            num[yi]--;
          }
        }
      }
      if (xi < 0 || xi >= scene.sizeX) {
        continue;
      }
      let runningHues = 0;
      let runningSat = 0;
      let runningLight = 0;
      let runningMultiplier = 0;
      let runningNumber = 0;
      for (let yi = blendStartY; yi < blendEndY; yi++) {
        const yNorth = yi + _SceneBuilder.BLEND_RADIUS;
        if (yNorth >= 0 && yNorth < scene.sizeY) {
          runningHues += hues[yNorth];
          runningSat += sats[yNorth];
          runningLight += light[yNorth];
          runningMultiplier += mul[yNorth];
          runningNumber += num[yNorth];
        }
        const ySouth = yi - _SceneBuilder.BLEND_RADIUS;
        if (ySouth >= 0 && ySouth < scene.sizeY) {
          runningHues -= hues[ySouth];
          runningSat -= sats[ySouth];
          runningLight -= light[ySouth];
          runningMultiplier -= mul[ySouth];
          runningNumber -= num[ySouth];
        }
        if (yi < 0 || yi >= scene.sizeX) {
          continue;
        }
        const underlayId = scene.tileUnderlays[level][xi][yi];
        if (underlayId > 0) {
          const avgHue = runningHues * 256 / runningMultiplier | 0;
          const avgSat = runningSat / runningNumber | 0;
          const avgLight = runningLight / runningNumber | 0;
          colors[xi][yi] = packHsl(avgHue, avgSat, avgLight);
        }
      }
    }
    return colors;
  }
  addTileModels(scene, smoothUnderlays) {
    const heights = scene.tileHeights;
    const underlayIds = scene.tileUnderlays;
    const overlayIds = scene.tileOverlays;
    const tileShapes = scene.tileShapes;
    const tileRotations = scene.tileRotations;
    for (let level = 0; level < scene.levels; level++) {
      const blendedColors = this.blendUnderlays(scene, level);
      const lights = scene.calculateTileLights(level);
      for (let x = 1; x < scene.sizeX - 1; x++) {
        for (let y = 1; y < scene.sizeY - 1; y++) {
          const underlayId = underlayIds[level][x][y] - 1;
          const overlayId = overlayIds[level][x][y] - 1;
          if (underlayId === -1 && overlayId === -1) {
            continue;
          }
          const heightSw = heights[level][x][y];
          const heightSe = heights[level][x + 1][y];
          const heightNe = heights[level][x + 1][y + 1];
          const heightNw = heights[level][x][y + 1];
          const lightSw = lights[x][y];
          const lightSe = lights[x + 1][y];
          const lightNe = lights[x + 1][y + 1];
          const lightNw = lights[x][y + 1];
          let underlayHslSw = -1;
          let underlayHslSe = -1;
          let underlayHslNe = -1;
          let underlayHslNw = -1;
          if (underlayId !== -1) {
            underlayHslSw = blendedColors[x][y];
            underlayHslSe = blendedColors[x + 1][y];
            underlayHslNe = blendedColors[x + 1][y + 1];
            underlayHslNw = blendedColors[x][y + 1];
            if (underlayHslSe === -1 || !smoothUnderlays) {
              underlayHslSe = underlayHslSw;
            }
            if (underlayHslNe === -1 || !smoothUnderlays) {
              underlayHslNe = underlayHslSw;
            }
            if (underlayHslNw === -1 || !smoothUnderlays) {
              underlayHslNw = underlayHslSw;
            }
          }
          let underlayRgb = 0;
          if (underlayHslSw !== -1) {
            underlayRgb = HSL_RGB_MAP[adjustUnderlayLight(underlayHslSw, 96)];
          }
          let tileModel;
          if (overlayId === -1) {
            tileModel = new SceneTileModel(
              0,
              0,
              -1,
              x,
              y,
              heightSw,
              heightSe,
              heightNe,
              heightNw,
              lightSw,
              lightSe,
              lightNe,
              lightNw,
              underlayHslSw,
              underlayHslSe,
              underlayHslNe,
              underlayHslNw,
              0,
              0,
              underlayRgb,
              0
            );
          } else {
            const shape = tileShapes[level][x][y] + 1;
            const rotation = tileRotations[level][x][y];
            const overlay = this.overlayTypeLoader.load(overlayId);
            let overlayHsl;
            let overlayMinimapHsl;
            if (overlay.textureId !== -1 && this.locModelLoader.textureLoader.isSd(overlay.textureId)) {
              overlayMinimapHsl = this.locModelLoader.textureLoader.getAverageHsl(
                overlay.textureId
              );
              overlayHsl = -1;
            } else if (overlay.primaryRgb === 16711935) {
              overlayHsl = overlayMinimapHsl = -2;
            } else {
              overlayHsl = overlayMinimapHsl = packHsl(
                overlay.hue,
                overlay.saturation,
                overlay.lightness
              );
            }
            if (overlay.secondaryRgb !== -1) {
              overlayMinimapHsl = packHsl(
                overlay.secondaryHue,
                overlay.secondarySaturation,
                overlay.secondaryLightness
              );
            }
            let overlayRgb = 0;
            if (overlayMinimapHsl !== -2) {
              overlayRgb = HSL_RGB_MAP[adjustOverlayLight(overlayMinimapHsl, 96)];
            }
            tileModel = new SceneTileModel(
              shape,
              rotation,
              overlay.textureId,
              x,
              y,
              heightSw,
              heightSe,
              heightNe,
              heightNw,
              lightSw,
              lightSe,
              lightNe,
              lightNw,
              underlayHslSw,
              underlayHslSe,
              underlayHslNe,
              underlayHslNw,
              overlayHsl,
              overlayMinimapHsl,
              underlayRgb,
              overlayRgb
            );
          }
          scene.newTileModel(level, x, y, tileModel);
        }
      }
    }
  }
  decodeNpcSpawns(scene, borderSize, mapX, mapY) {
    const data = this.getNpcSpawnData(mapX, mapY);
    if (!data) {
      return void 0;
    }
    const spawns = [];
    const buffer = new ByteBuffer(data);
    const baseX = mapX * 64;
    const baseY = mapY * 64;
    while (buffer.remaining > 0) {
      const positionPacked = buffer.readUnsignedShort();
      let level = positionPacked >> 14;
      const x = positionPacked >> 7 & 63;
      const y = positionPacked & 63;
      const id = buffer.readUnsignedShort();
      if (level > 0 && (scene.tileRenderFlags[1][x + borderSize][y + borderSize] & 2) === 2) {
        level--;
      }
      spawns.push({
        id,
        x: baseX + x,
        y: baseY + y,
        level
      });
    }
    return spawns;
  }
};

// ../rs-party-dashboard/src/util/Hasher.ts
var import_js_xxhash = require("js-xxhash");
var import_xxhash_wasm = __toESM(require("xxhash-wasm"));
var Hasher = class _Hasher {
  static async init() {
    _Hasher.hashApi = await (0, import_xxhash_wasm.default)();
    return _Hasher.hashApi;
  }
  static hash32Int(n) {
    const buf = new Int32Array([n]);
    return this.hash32(new Uint8Array(buf.buffer));
  }
  static hash32(data) {
    if (_Hasher.hashApi) {
      return _Hasher.hashApi.h32Raw(data);
    }
    return _Hasher.hash32js(data);
  }
  static hash32js(data) {
    return (0, import_js_xxhash.xxHash32)(data);
  }
  static hash64(data) {
    if (_Hasher.hashApi) {
      return _Hasher.hashApi.h64Raw(data);
    }
    return _Hasher.hash64js(data);
  }
  static hash64js(data) {
    const v0 = (0, import_js_xxhash.xxHash32)(data, Math.random() * 16777215);
    const v1 = (0, import_js_xxhash.xxHash32)(data, Math.random() * 16777215);
    return BigInt(v0) << 32n | BigInt(v1);
  }
  static bufToBigInt(data) {
    let bits = 8n;
    let ret = 0n;
    for (const i of data.values()) {
      const bi = BigInt(i);
      ret = (ret << bits) + bi;
    }
    return ret;
  }
};

// src/renderer-entry.ts
async function createRenderer(cacheDirectory) {
  const infos = JSON.parse(await (0, import_promises.readFile)(import_node_path.default.join(cacheDirectory, "caches.json"), "utf8"));
  const info = infos.filter((i) => i.game === "oldschool" && i.environment === "live").sort((a, b) => b.revision - a.revision || Date.parse(b.timestamp) - Date.parse(a.timestamp))[0];
  if (!info || !/^[a-zA-Z0-9_-]+$/.test(info.name)) throw new Error("Invalid OSRS cache manifest");
  const dir = import_node_path.default.join(cacheDirectory, info.name);
  const files = /* @__PURE__ */ new Map();
  for (const name of await (0, import_promises.readdir)(dir)) if (name.startsWith("main_file_cache.")) {
    const b = await (0, import_promises.readFile)(import_node_path.default.join(dir, name));
    files.set(name, b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  }
  const keys = JSON.parse(await (0, import_promises.readFile)(import_node_path.default.join(dir, "keys.json"), "utf8"));
  const xteas = new Map(Object.entries(keys).map(([id, key]) => [Number(id), key]));
  await Promise.all([Bzip2.initWasm(), Hasher.init()]);
  const factory = getCacheLoaderFactory(info, CacheSystem.fromFiles(detectCacheType(info), new CacheFiles(files)));
  const locs = factory.getLocTypeLoader();
  const textures = factory.getTextureLoader();
  const modelLoader = new LocModelLoader(locs, factory.getModelLoader(), textures, factory.getSeqTypeLoader(), factory.getSeqFrameLoader(), factory.getSkeletalSeqLoader());
  const builder = new SceneBuilder(info, factory.getMapFileLoader(), factory.getUnderlayTypeLoader(), factory.getOverlayTypeLoader(), locs, modelLoader, xteas);
  const renderer = new MapImageRenderer(textures, locs, factory.getMapScenes(), factory.getMapFunctions());
  return {
    info,
    render(x, y, plane) {
      if (![x, y, plane].every(Number.isInteger) || x < 0 || y < 0 || x > 255 || y > 255 || plane < 0 || plane > 3) throw new Error("Invalid map square");
      if (!builder.getTerrainData(x, y)) return void 0;
      const scene = builder.buildScene(x * 64 - 6, y * 64 - 6, 76, 76, false, 1 /* NO_MODELS */);
      const pixels = renderer.renderMinimapHd(scene, plane, true);
      const rgba = new Uint8Array(pixels.length * 4);
      for (let i = 0; i < pixels.length; i++) {
        rgba[i * 4] = pixels[i] >>> 16 & 255;
        rgba[i * 4 + 1] = pixels[i] >>> 8 & 255;
        rgba[i * 4 + 2] = pixels[i] & 255;
        rgba[i * 4 + 3] = 255;
      }
      return rgba;
    }
  };
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  createRenderer
});

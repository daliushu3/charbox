
import { CharacterDataV2 } from '../types';

// CRC32 Table for PNG chunk validation
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c;
}

function calculateCrc(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * 压缩图片以减少存储占用 (1200px 宽度限制)
 */
export async function compressImage(blob: Blob, maxWidth = 1200): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(blob);
      
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob((result) => {
        resolve(result || blob);
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(blob);
    };
    img.src = url;
  });
}

/**
 * 辅助函数：解压 zlib 数据 (iTXt 压缩块使用)
 */
async function decompressZlib(data: Uint8Array): Promise<Uint8Array> {
  try {
    const ds = new DecompressionStream('deflate');
    const writer = ds.writable.getWriter();
    writer.write(data);
    writer.close();
    const output = [];
    const reader = ds.readable.getReader();
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      output.push(value);
    }
    const totalLength = output.reduce((acc, val) => acc + val.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const val of output) {
      result.set(val, offset);
      offset += val.length;
    }
    return result;
  } catch (e) {
    console.error("Decompression failed", e);
    return data;
  }
}

/**
 * 核心解析函数：支持从 PNG 块或 JSON 文件提取角色数据
 */
export async function extractCharacterData(file: File): Promise<{ data: CharacterDataV2; imageBlob: Blob }> {
  if (file.type === 'application/json' || file.name.endsWith('.json')) {
    const text = await file.text();
    const raw = JSON.parse(text);
    const placeholder = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0, 1, 13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130]);
    return { data: normalizeCharacterData(raw), imageBlob: new Blob([placeholder], { type: 'image/png' }) };
  }

  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);

  if (view.getUint32(0) !== 0x89504E47) throw new Error('Not a PNG file');

  let offset = 8;
  let base64Data = '';

  while (offset < uint8Array.length) {
    const length = view.getUint32(offset);
    const type = String.fromCharCode(...uint8Array.slice(offset + 4, offset + 8));

    if (type === 'tEXt' || type === 'iTXt') {
      const chunkData = uint8Array.slice(offset + 8, offset + 8 + length);
      const nullIndex = chunkData.indexOf(0);
      const keyword = new TextDecoder().decode(chunkData.slice(0, nullIndex));
      
      if (keyword.toLowerCase() === 'chara') {
        if (type === 'tEXt') {
          base64Data = new TextDecoder().decode(chunkData.slice(nullIndex + 1));
        } else {
          const isCompressed = chunkData[nullIndex + 1] === 1;
          let textStart = nullIndex + 3;
          while (textStart < chunkData.length && chunkData[textStart] !== 0) textStart++; 
          textStart++;
          while (textStart < chunkData.length && chunkData[textStart] !== 0) textStart++; 
          textStart++;
          
          const rawTextData = chunkData.slice(textStart);
          if (isCompressed) {
            const decompressed = await decompressZlib(rawTextData);
            base64Data = new TextDecoder().decode(decompressed);
          } else {
            base64Data = new TextDecoder().decode(rawTextData);
          }
        }
        break;
      }
    }
    offset += length + 12;
  }

  if (!base64Data) throw new Error('No SillyTavern character metadata found in PNG');

  try {
    const jsonStr = new TextDecoder().decode(Uint8Array.from(atob(base64Data.trim()), c => c.charCodeAt(0)));
    const raw = JSON.parse(jsonStr);
    const compressedBlob = await compressImage(new Blob([uint8Array], { type: 'image/png' }));
    return { 
      data: normalizeCharacterData(raw), 
      imageBlob: compressedBlob
    };
  } catch (e) {
    throw new Error('Failed to parse character JSON metadata');
  }
}

function normalizeCharacterData(raw: any): CharacterDataV2 {
  const data = raw.data || raw;

  const getField = (keys: string[], fallback = '') => {
    for (const k of keys) {
      if (data[k] !== undefined && data[k] !== null) return String(data[k]);
      if (raw[k] !== undefined && raw[k] !== null) return String(raw[k]);
    }
    return fallback;
  };

  const getArray = (keys: string[]) => {
    for (const k of keys) {
      if (Array.isArray(data[k])) return data[k];
      if (Array.isArray(raw[k])) return raw[k];
    }
    return [];
  };

  const getBook = () => {
    const book = data.character_book || raw.character_book || 
                 data.world_book || raw.world_book || 
                 (data.extensions?.world_book) || (raw.extensions?.world_book);
    
    if (book && typeof book === 'object') {
      return {
        entries: Array.isArray(book.entries) ? book.entries : [],
        name: book.name || data.world || raw.world || 'World Book'
      };
    }
    return { entries: [], name: data.world || raw.world || 'World Book' };
  };

  return {
    name: getField(['name'], 'Unknown Entity'),
    description: getField(['description']),
    personality: getField(['personality']),
    scenario: getField(['scenario']),
    first_mes: getField(['first_mes']),
    mes_example: getField(['mes_example']),
    creator_notes: getField(['creator_notes', 'creatorcomment', 'creator_comment']),
    system_prompt: getField(['system_prompt']),
    post_history_instructions: getField(['post_history_instructions']),
    alternate_greetings: getArray(['alternate_greetings']),
    character_book: getBook(),
    tags: getArray(['tags']),
    creator: getField(['creator']),
    character_version: getField(['character_version'], '1'),
    extensions: {
      ...(raw.extensions || {}),
      ...(data.extensions || {})
    }
  };
}

/**
 * 构建符合 SillyTavern V2 规范的 PNG 文件
 * 必须包含 root level 的基础字段和嵌套的 data 对象
 */
export async function createCharacterPNG(imageBlob: Blob, data: CharacterDataV2): Promise<Blob> {
  const arrayBuffer = await imageBlob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  
  // Wrap data in SillyTavern V2 compatible structure
  const stWrapper = {
    name: data.name,
    description: data.description,
    personality: data.personality,
    scenario: data.scenario,
    first_mes: data.first_mes,
    mes_example: data.mes_example,
    creator_notes: data.creator_notes,
    spec: "chara_card_v2",
    spec_version: "2.0",
    data: data
  };

  const jsonString = JSON.stringify(stWrapper);
  const base64Data = btoa(unescape(encodeURIComponent(jsonString)));
  
  const encoder = new TextEncoder();
  const keyword = "chara";
  const chunkType = "tEXt";
  
  const keywordBytes = encoder.encode(keyword);
  const contentBytes = encoder.encode(base64Data);
  const chunkData = new Uint8Array(keywordBytes.length + 1 + contentBytes.length);
  chunkData.set(keywordBytes, 0);
  chunkData[keywordBytes.length] = 0; 
  chunkData.set(contentBytes, keywordBytes.length + 1);
  
  const chunkTypeBytes = encoder.encode(chunkType);
  const typeAndData = new Uint8Array(chunkTypeBytes.length + chunkData.length);
  typeAndData.set(chunkTypeBytes, 0);
  typeAndData.set(chunkData, chunkTypeBytes.length);
  
  const crc = calculateCrc(typeAndData);
  
  const lengthBytes = new Uint8Array(4);
  new DataView(lengthBytes.buffer).setUint32(0, chunkData.length);
  
  const crcBytes = new Uint8Array(4);
  new DataView(crcBytes.buffer).setUint32(0, crc);
  
  const ihdrOffset = 8;
  const ihdrDataLength = new DataView(uint8Array.buffer).getUint32(ihdrOffset);
  const insertOffset = ihdrOffset + 4 + 4 + ihdrDataLength + 4; 
  
  const result = new Uint8Array(uint8Array.length + 4 + 4 + chunkData.length + 4);
  result.set(uint8Array.slice(0, insertOffset), 0);
  result.set(lengthBytes, insertOffset);
  result.set(chunkTypeBytes, insertOffset + 4);
  result.set(chunkData, insertOffset + 8);
  result.set(crcBytes, insertOffset + 8 + chunkData.length);
  result.set(uint8Array.slice(insertOffset), insertOffset + 8 + chunkData.length + 4);
  
  return new Blob([result], { type: 'image/png' });
}

import { PartialEmoji } from '../common';
import path from 'node:path';
import { readdir, lstat } from 'node:fs/promises';

/**
 * Get the paths of files in a folder
 * @param folderPath The folder to get files from
 * @param recursive Whether to get files recursively
 * @returns The paths of the inside the folder
 */
export async function getFiles(folderPath: string, recursive = false): Promise<string[]> {
  const fileList = await readdir(folderPath);
  const files: string[] = [];
  for (const file of fileList) {
    const filePath = path.join(folderPath, file);
    const stat = await lstat(filePath);
    if (stat.isDirectory() && recursive) files.push(...(await getFiles(filePath)));
    else if (stat.isFile()) files.push(filePath);
  }
  return files;
}

/**
 * Calculates the timestamp in milliseconds associated with a Discord ID/snowflake
 * @param id The ID of a structure
 */
export function getCreatedAt(id: string): number {
  return getDiscordEpoch(id) + 1420070400000;
}

/**
 * Gets the number of milliseconds since epoch represented by an ID/snowflake
 * @param id The ID of a structure
 */
export function getDiscordEpoch(id: string): number {
  return Math.floor(Math.floor(Number(BigInt(id) / 4194304n)));
}

/**
 * Converts an emoji to a formatted markdown string
 * @param emoji The emoji to convert to a markdown format
 * @returns The formatted markdown string
 */
export function toMarkdown(emoji: Omit<PartialEmoji, 'animated'> & { animated?: boolean }): string {
  return `<${emoji.animated ? 'a' : ''}:${emoji.name}:${emoji.id}>`;
}

/**
 * Converts data to a data URI
 * @param data The data to convert
 * @param mimeType The MIME type of the data
 * @returns The data URI string
 */
export function toDataUri(data: Buffer | ArrayBuffer, mimeType: string): string {
  // @ts-ignore tsup is being annoying about this
  const base64 = ('Buffer' in globalThis && data instanceof Buffer ? data : Buffer.from(data)).toString('base64');
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Converts a file extension to a MIME type
 * @param extension The file extension to convert
 * @returns The corresponding MIME type or null if unsupported
 */
export function extensionToMimeType(extension: string): string | null {
  switch ((extension.startsWith('.') ? extension.slice(1) : extension).toLowerCase()) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    default:
      return null;
  }
}

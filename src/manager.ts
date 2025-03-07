import { extname, parse } from 'node:path';
import { Emoji, PartialEmoji, RawRequest } from './common';
import { RequestHandler, RESTOptions } from './rest/requestHandler';
import { getFiles, extensionToMimeType, toDataUri, toMarkdown } from './util';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import EventEmitter from 'eventemitter3';
import { TypedEventEmitter } from './util/typedEmitter';

/** The options for the {@link EmojiManager}. */
export interface EmojiManagerOptions {
  /** TThe bot/client token of the Discord application. */
  token: string;
  /**
   * The application ID for use in the manager.
   * If not defined, the manager will fetch the application ID before other requests are made.
   */
  applicationId?: string;
  /** The options passed to the request handler. */
  rest?: RESTOptions;
}

/**
 * The events typings for the {@link EmojiManager}.
 * @private
 */
interface EmojiManagerEvents {
  rawREST: (request: RawRequest) => void;
  warn: (warning: string) => void;
  debug: (message: string) => void;
  error: (err: Error) => void;
}

/** The options for {@link EmojiManager#loadFromFolder} */
export interface LoadFromFolderOptions {
  /** Whether to recursively get files in the folder */
  recursive?: boolean;
}

/**
 * A manager for managing an emoji collection.
 */
export class EmojiManager<
  Key extends string = string
> extends (EventEmitter as any as new () => TypedEventEmitter<EmojiManagerEvents>) {
  /** The application ID of the manager. */
  applicationId?: string;
  /** The request handler for the manager. */
  readonly requestHandler: RequestHandler;
  /** Eemojis matched by their key. */
  readonly emojis = new Map<Key, Emoji>();
  /** The internal list of local emojis matched by their key. */
  #localEmojiMap = new Map<Key, string>();

  /** @param opts The options for the manager */
  constructor(opts: EmojiManagerOptions) {
    super();
    const token =
      opts.token && !opts.token.startsWith('Bot ') && !opts.token.startsWith('Bearer ')
        ? 'Bot ' + opts.token
        : opts.token;

    this.requestHandler = new RequestHandler(this, {
      ...(opts.rest ?? {}),
      token
    });
  }

  /**
   * Fetches the application ID from the token if it does not yet exist.
   */
  async #fetchApplicationId(): Promise<string> {
    if (this.applicationId) return this.applicationId;
    const application = await this.requestHandler.request<{ id: string }>('GET', '/applications/@me', { auth: true });
    this.applicationId = application.id;
    return this.applicationId;
  }

  /**
   * Get an emoji object
   * @param key The emoji key to get
   * @returns The emoji object
   */
  get(key: Key): Emoji | null {
    return this.emojis.get(key) ?? null;
  }

  /**
   * Get a partial emoji object for use in buttons/selects.
   * @param key The emoji key to get
   * @returns The partial emoji object
   */
  getPartial(key: Key): PartialEmoji | null {
    const emoji = this.emojis.get(key);
    if (!emoji) return null;
    return {
      id: emoji.id,
      name: emoji.name,
      animated: emoji.animated
    };
  }

  /**
   * Get an emoji as a formatted markdown element
   * @param key The emoji key to get
   * @returns The formatted markdown representation of the emoji
   */
  getMarkdown(key: Key): string | null {
    const emoji = this.get(key);
    if (!emoji) return null;
    return toMarkdown(emoji);
  }

  /**
   * Load emojis into the manager. The values can either be a data image uri (starting with `data:`), URLs (starting with `http(s):`), or file paths.
   * @param emojis The emojis to load into the manager
   */
  load(emojis: Record<string, string>) {
    for (const key in emojis) this.#localEmojiMap.set(key as Key, emojis[key as Key]);
  }

  /**
   * Load image files from a folder.
   * @param folderPath The folder to load emojis from
   * @param options Options for the function
   */
  async loadFromFolder(folderPath: string, options?: LoadFromFolderOptions) {
    const files = await getFiles(folderPath, options?.recursive ?? false);
    for (const file of files) {
      const key = parse(file).name;
      this.#localEmojiMap.set(key as Key, file);
    }
  }

  /**
   * Syncs the local emojis to the application.
   */
  async sync() {
    const applicationId = await this.#fetchApplicationId();
    const EMOJIS_ENDPOINT = `/applications/${applicationId}/emojis`;
    const emojis = await this.requestHandler.request<{ items: Emoji[] }>('GET', EMOJIS_ENDPOINT, { auth: true });
    for (const emoji of emojis.items) this.emojis.set(emoji.name as Key, emoji);
    for (const [key, imagePath] of this.#localEmojiMap) {
      if (this.emojis.has(key)) continue;

      let image: string;
      // Data image URI
      if (imagePath.startsWith('data:')) image = imagePath;
      // File URL
      else if (imagePath.startsWith('file:')) {
        const filePath = fileURLToPath(imagePath);
        const data = await readFile(filePath);
        const mime = extensionToMimeType(extname(filePath));
        if (!mime) throw new Error(`[${key}] Unknown file type for file: ${filePath}`);
        image = toDataUri(data, mime);
      }
      // Fetchable URL
      else if (imagePath.startsWith('https://') || imagePath.startsWith('http://')) {
        const response = await fetch(imagePath);
        if (!response.ok) throw new Error(`[${key}] URL returned ${response.status}: ${imagePath}`);
        const mime = response.headers.get('content-type') || extensionToMimeType(extname(imagePath));
        if (!mime)
          throw new Error(
            `[${key}] URL response does not have a Content-Type and URL does not have a known extension: ${imagePath}`
          );
        image = toDataUri(await response.arrayBuffer(), mime);
      }
      // File path
      else {
        const data = await readFile(imagePath);
        const mime = extensionToMimeType(extname(imagePath));
        if (!mime) throw new Error(`[${key}] Unknown file type for file: ${imagePath}`);
        image = toDataUri(data, mime);
      }

      this.emit('debug', `Uploading emoji ${key} from path "${imagePath}"...`);
      const emoji = await this.requestHandler.request<Emoji>('POST', EMOJIS_ENDPOINT, {
        auth: true,
        body: { name: key, image }
      });
      this.emojis.set(emoji.name as Key, emoji);
    }
  }
}

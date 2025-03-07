import { SequentialBucket } from './sequentialBucket';
import { Request } from './request';
import { API_BASE_URL } from '../common';
import type { EmojiManager } from '../manager';

/** The options for a {@link RequestHandler}. */
export interface RESTOptions {
  /** The dispatcher to use for undici. */
  dispatcher?: import('undici-types').Dispatcher;
  /** The base URL to use for API requests. */
  baseURL?: string;
  /** A number of milliseconds to offset the ratelimit timing calculations by. */
  ratelimiterOffset?: number;
  /** A number of milliseconds before requests are considered timed out. */
  requestTimeout?: number;
  /** The amount of times it will retry to send the request. */
  retryLimit?: number;
}

export interface HashData {
  value: string;
  lastAccess: number;
}

/** The options for a {@link Request}. */
export interface RequestOptions {
  /** Whether to add the "Authorization" header. */
  auth?: boolean;
  /** The data to be set for the request body. */
  body?: Record<string, any>;
  /** The headers to attach to the request. */
  headers?: Record<string, string>;
  /** The files to attach to the request body. */
  files?: FileContent[];
  /** An object of query keys and their values. */
  query?: Record<string, any>;
  /** The reason to display in the audit log. */
  reason?: string;
}

/** The contents of a file. */
export interface FileContent {
  file: any;
  name: string;
}

/**
 * Represents a class to handle requests.
 */
export class RequestHandler {
  /** The manager that instansiated this handler. */
  manager?: EmojiManager;

  /** A map with SequentialBuckets. */
  buckets: Map<string, SequentialBucket> = new Map<string, SequentialBucket>();

  /** Whether we are currently globally limited. */
  globalBlock = false;

  /** The timestamp of the next reset. */
  globalReset = 0;

  /** A promise that will resolve as soon we are no longer limited. */
  globalTimeout?: Promise<void>;

  /** A map with bucket hash data. */
  hashes: Map<string, HashData> = new Map<string, HashData>();

  /** Options for the RequestHandler. */
  options: RESTOptions;

  /** The authentication token. */
  #token?: string;

  /**
   * Represents a class to handle requests.
   * @arg options Options for the RequestHandler.
   */
  constructor(manager?: EmojiManager, options: RESTOptions & { token?: string } = {}) {
    this.manager = manager;
    this.options = {
      baseURL: options.baseURL ?? API_BASE_URL,
      ratelimiterOffset: options.ratelimiterOffset ?? 0,
      requestTimeout: options.requestTimeout ?? 15000,
      retryLimit: options.retryLimit ?? 3
    };

    if (options.token) this.#token = options.token;
  }

  /**
   * Whether we are currently globally limited.
   * @readonly
   */
  get limited(): boolean {
    return this.globalBlock && Date.now() < this.globalReset;
  }

  /**
   * Makes a request to the API.
   * @arg method An uppercase HTTP method.
   * @arg path The endpoint to make the request to.
   * @arg options Data regarding the request.
   * @returns Resolves with the returned JSON data.
   */
  async request<T = unknown>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const request = new Request(this, method, path, options);
    if (options.auth) {
      if (!this.#token) throw new Error('Missing required token');
      request.headers['Authorization'] = this.#token;
    }

    const hash = this.hashes.get(request.id)?.value ?? request.id;

    const bucket = this.#getBucket(hash, request.majorParameter);
    return bucket.add<T>(request);
  }

  /**
   * Get or create a SequentialBucket for the request.
   * @arg {String} hash The hash of bucket.
   * @arg {String} majorParameter The major parameter of the bucket.
   * @returns {SequentialBucket}
   */
  #getBucket(hash: string, majorParameter: string) {
    const bucket = this.buckets.get(`${hash}:${majorParameter}`);
    if (bucket) return bucket;

    const newBucket = new SequentialBucket(this, hash, majorParameter);
    this.buckets.set(newBucket.id, newBucket);

    return newBucket;
  }
}

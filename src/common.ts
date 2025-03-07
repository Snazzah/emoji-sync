import type { Request } from './rest/request';
import type { FileContent } from './rest/requestHandler';

export const VERSION = '0.1.1';
export const API_VERSION = 10;
export const API_BASE_URL = 'https://discord.com/api/v' + API_VERSION;
export const CDN_URL = 'https://cdn.discordapp.com';

/** @see https://discord.com/developers/docs/resources/user#avatar-decoration-data-object */
export interface AvatarDecorationData {
  /** The avatar decoration hash */
  asset: string;
  /** The id of the avatar decoration's SKU */
  sku_id: string;
}

/** @see https://discord.com/developers/docs/resources/user#user-object */
export interface User {
  /** The user's id */
  id: string;
  /** The user's username, not unique across the platform */
  username: string;
  /** The user's avatar hash */
  avatar: string | null;
  /** The user's Discord-tag */
  discriminator: string;
  /** The public flags on a user's account. */
  public_flags: number;
  /** The flags on a user's account. */
  flags: number;
  /** Whether the user belongs to an OAuth2 application */
  bot?: boolean;
  /** The user's banner hash */
  banner?: string | null;
  /** The user's banner color encoded as an integer representation of hexadecimal color code */
  accent_color?: number | null;
  /** The user's display name, if it is set. For bots, this is the application name */
  global_name: string | null;
  /** The data for the user's avatar decoration */
  avatar_decoration_data?: AvatarDecorationData | null;
}

/**
 * A partial emoji object, usable with buttons and selects.
 * @see https://discord.com/developers/docs/resources/emoji#emoji-object-emoji-structure
 */
export interface PartialEmoji {
  /** Emoji id */
  id: string;
  /** Emoji name */
  name: string;
  /** Whether this emoji is animated */
  animated: boolean;
}

/**
 * @see https://discord.com/developers/docs/resources/emoji#emoji-object-emoji-structure
 */
export interface Emoji extends PartialEmoji {
  user: User;
  roles: string[];
  require_colons: boolean;
  managed: boolean;
  available: boolean;
}

/**
 * A request object for tracking requests coming from the {@link EmojiManager}.
 */
export interface RawRequest {
  auth: boolean;
  body: Record<string, any> | undefined;
  files: FileContent[] | undefined;
  latency: number;
  url: URL;
  method: string;
  response: Response;
  request: Request;
}

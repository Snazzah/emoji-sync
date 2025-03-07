# @snazzah/emoji-sync

A utility package to sync emojis with your Discord application

[![NPM version](https://img.shields.io/npm/v/@snazzah/emoji-sync?maxAge=3600)](https://www.npmjs.com/package/@snazzah/emoji-sync) [![NPM downloads](https://img.shields.io/npm/dt/@snazzah/emoji-sync?maxAge=3600)](https://www.npmjs.com/package/@snazzah/emoji-sync) [![JSR](https://jsr.io/badges/@snazzah/emoji-sync)](https://jsr.io/@snazzah/emoji-sync) [![discord chat](https://img.shields.io/discord/311027228177727508?logo=discord&logoColor=white)](https://snaz.in/discord)

## Installation

```sh
pnpm i @snazzah/emoji-sync
```

### Usage

```ts
import { EmojiManager } from '@snazzah/emoji-sync';

const manager = new EmojiManager({ token: '...' });

// Load emojis from a folder to sync with later
await manager.loadFromFolder('./emojis', { recursive: true });

// ...or manually specify emojis as an object of keys
manager.load({
  // file path (detects type from extension)
  success: './emojis/success.png',
  // data image uri
  failure: 'data:image/png;base64,...',
  // http(s) urls (detect from Content-Type or extension)
  snazzah: 'https://cdn.snaz.in/avy/current.min.png'
});

// ...and sync it!
await manager.sync();

// Now that emojis are populated in the manager, you can start using them:

// Get a partial emoji for use in buttons and selects
manager.getPartial('success'); // { id: '123...', name: 'success', animated: false }
// Get the entire emoji object
manager.get('success'); // { id: '123...', ... }
// Get the formatted markdown of an emoji
manager.getMarkdown('success'); // "<:success:123>"
```

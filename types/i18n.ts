// This file is auto-generated. Do not edit manually.
// Run 'npm run generate:i18n-types' to regenerate.

import type messages from '../messages/en.json';

export type TranslationKeys = keyof typeof messages;

export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & string]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & string];

export type Messages = typeof messages;
export type MessageKeys = NestedKeyOf<Messages>;
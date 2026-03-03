export const ENTITY_ID_PATTERN = /^[A-Za-z0-9_-]{1,80}$/;

export function isEntityId(value: string): boolean {
  return ENTITY_ID_PATTERN.test(value);
}

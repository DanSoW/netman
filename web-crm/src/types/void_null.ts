export type VOID_NULL = undefined | null;

export function isVoidNull(value) {
  return value === null || value === undefined;
}

// A path addresses a value inside the Board tree (object keys and array indices).
export type Path = (string | number)[];

// Immutable deep update: returns a new Board with the value at `path` replaced.
export function updateByPath<T>(obj: T, path: Path, value: unknown): T {
  if (path.length === 0) return value as T;
  const [head, ...rest] = path;
  if (Array.isArray(obj)) {
    const copy = obj.slice();
    copy[head as number] = updateByPath(copy[head as number], rest, value);
    return copy as unknown as T;
  }
  const copy = { ...(obj as Record<string, unknown>) };
  copy[head as string] = updateByPath(copy[head as string], rest, value);
  return copy as T;
}

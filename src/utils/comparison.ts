import { ComparedFile, ComparisonIdentity } from "../models/comparison";

export function parsePathFilters(value?: string): string[] {
  return (value ?? "")
    .split(",")
    .map(normalizePath)
    .filter((path): path is string => path.length > 0);
}

export function normalizePath(value: string): string {
  const trimmed = value.trim().replace(/\\/g, "/");
  if (!trimmed) {
    return "";
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.length > 1
    ? withLeadingSlash.replace(/\/+$/, "")
    : withLeadingSlash;
}

export function isPathRelevant(path: string, filters: string[]): boolean {
  if (filters.length === 0) {
    return true;
  }

  const normalizedPath = normalizePath(path);
  const pathSegments = normalizedPath.split("/").filter(Boolean);
  return filters.some((filter) => {
    if (filter === "/") {
      return true;
    }
    const filterSegments = filter.split("/").filter(Boolean);
    return pathSegments.some((_segment, start) =>
      filterSegments.every(
        (filterSegment, offset) =>
          pathSegments[start + offset] === filterSegment
      )
    );
  });
}

export function isPathWithinScope(path: string, scope: string): boolean {
  const normalizedPath = normalizePath(path).toLocaleLowerCase();
  const normalizedScope = normalizePath(scope).toLocaleLowerCase();
  return (
    normalizedScope === "/" ||
    normalizedPath === normalizedScope ||
    normalizedPath.startsWith(`${normalizedScope}/`)
  );
}

export function uniqueFiles(files: ComparedFile[]): ComparedFile[] {
  const byPath = new Map<string, ComparedFile>();
  for (const file of files) {
    const existing = byPath.get(file.path);
    if (!existing) {
      byPath.set(file.path, file);
    } else if (!existing.changeType.includes(file.changeType)) {
      byPath.set(file.path, {
        path: file.path,
        changeType: `${existing.changeType}, ${file.changeType}`,
      });
    }

  }
  return [...byPath.values()].sort((left, right) =>
    left.path.localeCompare(right.path)
  );
}

export function summarizeFileHotspots(
  files: ComparedFile[],
  limit = 5
): Array<{ path: string; count: number }> {
  const counts = new Map<string, number>();
  for (const file of files) {
    const segments = normalizePath(file.path).split("/").filter(Boolean);
    const hotspot = `/${segments
      .slice(0, Math.min(2, segments.length))
      .join("/")}`;
    counts.set(hotspot, (counts.get(hotspot) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort(
      (left, right) =>
        right.count - left.count || left.path.localeCompare(right.path)
    )
    .slice(0, Math.max(0, limit));
}

export function uniqueIdentities(
  identities: ComparisonIdentity[]
): ComparisonIdentity[] {
  const unique = new Map<string, ComparisonIdentity>();
  for (const identity of identities) {
    const key = (
      identity.email ??
      identity.id ??
      identity.displayName
    ).toLocaleLowerCase();
    if (!unique.has(key)) {
      unique.set(key, identity);
    }
  }
  return [...unique.values()].sort((left, right) =>
    left.displayName.localeCompare(right.displayName)
  );
}

export async function mapWithConcurrency<T, R>(
  values: T[],
  concurrency: number,
  mapper: (value: T, index: number) => Promise<R>
): Promise<R[]> {
  if (concurrency < 1) {
    throw new Error("Concurrency must be at least 1.");
  }

  const results = new Array<R>(values.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (nextIndex < values.length) {
      const currentIndex = nextIndex++;
      const value = values[currentIndex];
      if (value !== undefined) {
        results[currentIndex] = await mapper(value, currentIndex);
      }
    }
  }

  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, Math.max(values.length, 1)) },
      worker
    )
  );
  return results;
}

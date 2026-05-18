const symbolPatterns = [
  /^\s*export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/,
  /^\s*(?:async\s+)?function\s+([A-Za-z0-9_$]+)/,
  /^\s*export\s+class\s+([A-Za-z0-9_$]+)/,
  /^\s*class\s+([A-Za-z0-9_$]+)/,
  /^\s*(?:export\s+)?const\s+([A-Za-z0-9_$]+)\s*=/,
  /^\s*([A-Za-z0-9_$-]+):\s*$/
];

export function findNearbyContext(source: string, line: number, fileType: string): string | null {
  const lines = source.split(/\r?\n/);
  for (let index = line - 1; index >= 0; index -= 1) {
    const candidate = lines[index] ?? "";
    if (fileType === "markdown") {
      const heading = /^(#{1,6})\s+(.+)$/.exec(candidate);
      if (heading) {
        return heading[2].trim();
      }
    }

    for (const pattern of symbolPatterns) {
      const match = pattern.exec(candidate);
      if (match) {
        return match[1];
      }
    }
  }

  return null;
}

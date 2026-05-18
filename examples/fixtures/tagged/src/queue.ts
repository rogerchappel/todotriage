export function enqueue(value: string): string {
  // TODO(owner:ops): batch duplicate items when queue pressure is high
  return value.trim();
}

export function flush(): void {
  // HACK(p2): temporary release workaround until worker shutdown is deterministic
}

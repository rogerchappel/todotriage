export function authorize(userId: string): boolean {
  // FIXME(p1): release blocker for auth migration before production rollout #42
  return userId.length > 0;
}

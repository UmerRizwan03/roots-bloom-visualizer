import { FamilyMember } from '../types/family';

export const getDescendants = (
  rootMemberId: string,
  allMembers: FamilyMember[],
  currentGeneration: number = 1
): FamilyMember[] => {
  const rootMember = allMembers.find(m => m.id === rootMemberId);
  if (!rootMember) {
    return [];
  }

  const descendants: FamilyMember[] = [];
  const stack: { memberId: string; generation: number }[] = [{ memberId: rootMemberId, generation: currentGeneration }];
  const visitedIds = new Set<string>();

  while (stack.length > 0) {
    const { memberId, generation } = stack.pop()!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

    // Skip if already processed; this handles cases where a node might be reachable through multiple parent paths
    // (e.g. complex non-tree structures, though less common in basic family trees)
    // or if a child is pushed onto the stack multiple times before it's processed.
    if (visitedIds.has(memberId)) {
      continue;
    }
    visitedIds.add(memberId);

    // Find the member details. This is needed because stack only stores id and generation.
    // This could be optimized if `allMembers` is a Map for faster lookups.
    const member = allMembers.find(m => m.id === memberId);
    if (member) {
      descendants.push({ ...member, generation });

      const children = allMembers.filter(m => m.parents?.includes(memberId));
      for (const child of children) {
        // Add to stack only if not visited.
        // If it's already visited and processed, we don't need to explore from it again.
        // If it's on the stack but not yet processed, this check is not strictly needed here,
        // as the `visitedIds.has(memberId)` check at the start of the loop handles it.
        // However, it's a good practice to avoid pushing redundant items to the stack.
        if (!visitedIds.has(child.id)) {
          stack.push({ memberId: child.id, generation: generation + 1 });
        }
      }
    }
  }
  return descendants;
};

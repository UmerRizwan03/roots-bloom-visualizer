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
  // Add the root member with adjusted generation
  descendants.push({ ...rootMember, generation: currentGeneration });

  const findChildrenRecursive = (parentId: string, gen: number) => {
    const children = allMembers.filter(m => m.parents?.includes(parentId));
    for (const child of children) {
      // Check if already added to prevent infinite loops in case of cyclic data (though not expected in family trees)
      if (!descendants.find(d => d.id === child.id)) {
        descendants.push({ ...child, generation: gen });
        findChildrenRecursive(child.id, gen + 1);
      }
    }
  };

  findChildrenRecursive(rootMemberId, currentGeneration + 1);
  return descendants;
};

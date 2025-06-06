import { FamilyMember } from '../types/family';

/**
 * Retrieves all descendants of a given root member from a list of all family members.
 * The generation number for each descendant is calculated relative to the root member.
 *
 * @param {string} rootMemberId - The ID of the member whose descendants are to be found.
 * @param {FamilyMember[]} allMembers - An array containing all family members.
 * @param {number} [currentGeneration=1] - The generation number of the `rootMemberId`. Descendants will have increasing generation numbers.
 * @returns {FamilyMember[]} An array of `FamilyMember` objects representing the descendants, including the root member with the specified `currentGeneration`.
 *                           Returns an empty array if the `rootMemberId` is not found.
 */
export const getDescendants = (
  rootMemberId: string,
  allMembers: FamilyMember[],
  currentGeneration: number = 1
): FamilyMember[] => {
  const rootMember = allMembers.find(m => m.id === rootMemberId);
  if (!rootMember) {
    console.warn(`getDescendants: Root member with ID ${rootMemberId} not found.`);
    return [];
  }

  const descendants: FamilyMember[] = [];
  // Add the root member itself to the descendants list, with its generation potentially adjusted by the caller.
  descendants.push({ ...rootMember, generation: currentGeneration });

  // Recursive function to find children and their descendants.
  const findChildrenRecursive = (parentId: string, gen: number) => {
    const children = allMembers.filter(m => m.parents?.includes(parentId));
    for (const child of children) {
      // Check if the child has already been added. This is a safeguard against potential circular dependencies,
      // though true family trees shouldn't have them. It also ensures each member is processed once.
      if (!descendants.find(d => d.id === child.id)) {
        // Add the child with the calculated generation number.
        descendants.push({ ...child, generation: gen });
        // Recursively find children of the current child.
        findChildrenRecursive(child.id, gen + 1);
      }
    }
  };

  // Start the recursive search for children of the root member.
  // Children of the root will be `currentGeneration + 1`.
  findChildrenRecursive(rootMemberId, currentGeneration + 1);

  return descendants;
};

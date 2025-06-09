import { getDescendants, getAncestors } from './treeUtils'; // Added getAncestors
import { FamilyMember } from '../types/family';

// Mock family data for tests
// The getDescendants and getAncestors functions rely on the `parents` field.
const mockMembers: FamilyMember[] = [
  // Gen 1
  { id: '1', name: 'Great Grandparent', generation: 1, gender: 'male' },
  // Gen 2 (children of '1')
  { id: '2', name: 'Grandparent1', generation: 2, parents: ['1'], gender: 'female' },
  { id: '3', name: 'Grandparent2', generation: 2, parents: ['1'], gender: 'male' },
  // Gen 3 (children of '2')
  { id: '4', name: 'Parent1', generation: 3, parents: ['2'], gender: 'male' },
  // Gen 3 (children of '3')
  { id: '5', name: 'Parent2', generation: 3, parents: ['3'], gender: 'female' },
  { id: '6', name: 'Parent3', generation: 3, parents: ['3'], gender: 'male' },
  // Gen 4 (children of '4')
  { id: '7', name: 'Child1', generation: 4, parents: ['4'], gender: 'female' },
  // Gen 4 (children of '5')
  { id: '8', name: 'Child2', generation: 4, parents: ['5'], gender: 'male' },
  // An unrelated member
  { id: '9', name: 'Unrelated', generation: 1, gender: 'female' },
  // A member with no children for testing that specific case
  { id: '10', name: 'Childless', generation: 2, parents: ['1'], gender: 'male' },
];

describe('getDescendants', () => {
  it('should return the member and all descendants with adjusted generations', () => {
    const result = getDescendants('2', mockMembers, 1); // Grandparent1 as new root (gen 1)
    
    // Expected: Grandparent1 (gen 1), Parent1 (gen 2), Child1 (gen 3)
    expect(result).toHaveLength(3);

    const grandparent1 = result.find(m => m.id === '2');
    const parent1 = result.find(m => m.id === '4');
    const child1 = result.find(m => m.id === '7');

    expect(grandparent1).toBeDefined();
    expect(parent1).toBeDefined();
    expect(child1).toBeDefined();

    expect(grandparent1?.generation).toBe(1);
    expect(parent1?.generation).toBe(2);
    expect(child1?.generation).toBe(3);
  });

  it('should return an empty array if root member not found', () => {
    const result = getDescendants('nonexistent', mockMembers, 1);
    expect(result).toEqual([]);
  });

  it('should return only the member itself if it has no children, with adjusted generation', () => {
    const result = getDescendants('10', mockMembers, 5); // Childless as new root (gen 5)
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('10');
    expect(result[0].generation).toBe(5);
    expect(result[0].name).toBe('Childless');
  });

  it('should handle a complex structure with varying depths and multiple children', () => {
    const result = getDescendants('1', mockMembers, 1); // Great Grandparent as root (gen 1)
    // Expected: 1, 2, 3, 4, 5, 6, 7, 8, 10 (total 9 members in this branch)
    expect(result).toHaveLength(9);

    // Check generations
    expect(result.find(m => m.id === '1')?.generation).toBe(1); // Great Grandparent
    expect(result.find(m => m.id === '2')?.generation).toBe(2); // Grandparent1
    expect(result.find(m => m.id === '3')?.generation).toBe(2); // Grandparent2
    expect(result.find(m => m.id === '10')?.generation).toBe(2); // Childless (child of '1')
    
    expect(result.find(m => m.id === '4')?.generation).toBe(3); // Parent1 (child of '2')
    expect(result.find(m => m.id === '5')?.generation).toBe(3); // Parent2 (child of '3')
    expect(result.find(m => m.id === '6')?.generation).toBe(3); // Parent3 (child of '3')

    expect(result.find(m => m.id === '7')?.generation).toBe(4); // Child1 (child of '4')
    expect(result.find(m => m.id === '8')?.generation).toBe(4); // Child2 (child of '5')
    
    // Ensure 'Unrelated' (id '9') is not included
    expect(result.find(m => m.id === '9')).toBeUndefined();
  });

  it('should not modify the original members array', () => {
    const originalMembersCopy = JSON.parse(JSON.stringify(mockMembers)); // Deep copy
    getDescendants('1', mockMembers, 1);
    expect(mockMembers).toEqual(originalMembersCopy); // Check if original array is unchanged
  });

  it('should correctly apply a different starting currentGeneration to the root of the descendants list', () => {
    const result = getDescendants('3', mockMembers, 10); // Grandparent2 as new root (gen 10)
    
    // Expected: Grandparent2 (gen 10), Parent2 (gen 11), Parent3 (gen 11), Child2 (gen 12)
    expect(result).toHaveLength(4);

    const grandparent2 = result.find(m => m.id === '3');
    const parent2 = result.find(m => m.id === '5');
    const parent3 = result.find(m => m.id === '6');
    const child2 = result.find(m => m.id === '8');

    expect(grandparent2?.generation).toBe(10);
    expect(parent2?.generation).toBe(11);
    expect(parent3?.generation).toBe(11);
    expect(child2?.generation).toBe(12);
  });

  it('should handle a member with children who themselves have no children', () => {
    // Parent1 (id '4') has child Child1 (id '7'), Child1 has no children.
    const result = getDescendants('4', mockMembers, 1);
    expect(result).toHaveLength(2); // Parent1, Child1
    expect(result.find(m => m.id === '4')?.generation).toBe(1);
    expect(result.find(m => m.id === '7')?.generation).toBe(2);
  });
});

describe('getAncestors', () => {
  it('should return the member and all direct ancestors with adjusted generations', () => {
    // Child1 (id '7') -> Parent1 (id '4') -> Grandparent1 (id '2') -> Great Grandparent (id '1')
    const result = getAncestors('7', mockMembers, 1); // Child1 as starting point (gen 1)

    // Expected: Child1 (gen 1), Parent1 (gen 2), Grandparent1 (gen 3), Great Grandparent (gen 4)
    expect(result).toHaveLength(4);

    const child1 = result.find(m => m.id === '7');
    const parent1 = result.find(m => m.id === '4');
    const grandparent1 = result.find(m => m.id === '2');
    const greatGrandparent = result.find(m => m.id === '1');

    expect(child1).toBeDefined();
    expect(parent1).toBeDefined();
    expect(grandparent1).toBeDefined();
    expect(greatGrandparent).toBeDefined();

    expect(child1?.generation).toBe(1);
    expect(parent1?.generation).toBe(2);
    expect(grandparent1?.generation).toBe(3);
    expect(greatGrandparent?.generation).toBe(4);
  });

  it('should return an empty array if member not found', () => {
    const result = getAncestors('nonexistent', mockMembers, 1);
    expect(result).toEqual([]);
  });

  it('should return only the member itself if it has no parents, with adjusted generation', () => {
    const result = getAncestors('1', mockMembers, 5); // Great Grandparent (no parents) as starting (gen 5)
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
    expect(result[0].generation).toBe(5);
  });

  it('should return only the member itself if it has no parents in the provided list, with adjusted generation', () => {
    const memberWithMissingParent: FamilyMember[] = [
      { id: 'A', name: 'A', generation: 1, parents: ['X'], gender: 'male' }, // Parent X doesn't exist
    ];
    const result = getAncestors('A', memberWithMissingParent, 1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('A');
    expect(result[0].generation).toBe(1);
  });

  it('should handle multiple parents if data model supported it (though current model has one parents array)', () => {
    // This test assumes getAncestors would trace all parent lines if a member could have multiple distinct parent sets.
    // Current FamilyMember.parents is string[], implying one set of parents.
    // If parents: ['p1', 'p2'] means p1 and p2 are a couple, getAncestors handles this.
    // If a person could have parents: ['pA1', 'pA2'] AND also parents: ['pB1', 'pB2'] (e.g. adoption),
    // the current getAncestors would follow both paths if data was structured to allow it.
    // For this test, let's test a member whose parents are both in the list.
    // Parent2 (id '5') has parent Grandparent2 (id '3'). Grandparent2 has parent Great Grandparent (id '1').
    const resultForParent2 = getAncestors('5', mockMembers, 1); // Parent2 (gen 1)
    // Expected: Parent2 (gen 1), Grandparent2 (gen 2), Great Grandparent (gen 3)
    expect(resultForParent2).toHaveLength(3);
    expect(resultForParent2.find(m => m.id === '5')?.generation).toBe(1);
    expect(resultForParent2.find(m => m.id === '3')?.generation).toBe(2);
    expect(resultForParent2.find(m => m.id === '1')?.generation).toBe(3);
  });


  it('should not modify the original members array', () => {
    const originalMembersCopy = JSON.parse(JSON.stringify(mockMembers)); // Deep copy
    getAncestors('7', mockMembers, 1);
    expect(mockMembers).toEqual(originalMembersCopy);
  });

  it('should correctly apply a different starting currentGeneration', () => {
    const result = getAncestors('4', mockMembers, 10); // Parent1 (gen 10)
    // Expected: Parent1 (gen 10), Grandparent1 (gen 11), Great Grandparent (gen 12)
    expect(result).toHaveLength(3);
    expect(result.find(m => m.id === '4')?.generation).toBe(10);
    expect(result.find(m => m.id === '2')?.generation).toBe(11);
    expect(result.find(m => m.id === '1')?.generation).toBe(12);
  });

  // Test for a member who is in the list but has no defined parents array
  const mockMembersWithNullParents: FamilyMember[] = [
    { id: '1', name: 'Root', generation: 1, gender: 'male' },
    { id: '2', name: 'ChildWithNullParents', generation: 2, parents: null as any, gender: 'female' },
    { id: '3', name: 'ChildWithUndefinedParents', generation: 2, parents: undefined as any, gender: 'male' },
    { id: '4', name: 'ChildWithEmptyParents', generation: 2, parents: [], gender: 'female' },
  ];

  it('should handle member with null parents field', () => {
    const result = getAncestors('2', mockMembersWithNullParents, 1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('should handle member with undefined parents field', () => {
    const result = getAncestors('3', mockMembersWithNullParents, 1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('should handle member with empty parents array', () => {
    const result = getAncestors('4', mockMembersWithNullParents, 1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('4');
  });

});

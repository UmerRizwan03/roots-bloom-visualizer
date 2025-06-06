import { describe, it, expect, vi, beforeEach } from 'vitest';
import { layoutFamilyTree, LayoutCallbacks, LayoutConfig }  from './layoutFamilyTree';
import { getDescendants } from './treeUtils'; // Using actual getDescendants
import { FamilyMember } from '../types/family';
import { Node, Edge, Position, MarkerType } from '@xyflow/react';

// Mock Callbacks
const mockCallbacks: LayoutCallbacks = {
  onSelect: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onToggleCollapse: vi.fn(),
};

// Default Config (can be overridden in specific tests)
const defaultConfig: LayoutConfig = {
  generationSpacing: 120,
  memberSpacing: 180, // Increased spacing for clarity in tests
  nodeWidth: 150,    // Standard node width
  siblingSpacing: 50,
};

// Helper to create a basic member
const createMember = (id: string, name: string, generation: number, parents?: string[], spouse?: string, partners?: string[]): FamilyMember => ({
  id,
  name,
  gender: 'unknown', // Default, can be specified if needed for a test
  generation,
  parents: parents || [],
  spouse,
  partners: partners || [],
  // Add other required fields with default values if necessary
  birthDate: undefined,
  deathDate: undefined,
  photo: undefined,
  bio: undefined,
  occupation: undefined,
  contactInfo: undefined,
  address: undefined,
  education: undefined,
  hobbies: undefined,
  socialMedia: undefined,
  bloodType: undefined,
  medicalHistory: undefined,
  birthPlace: undefined,
  mobileNumber: undefined,
  email: undefined,
});


describe('layoutFamilyTree', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Mock window.innerWidth for consistent centering tests
    // vi.spyOn(window, 'innerWidth', 'get').mockReturnValue(1200); // Example width
    // For Vitest, it's better to mock global properties directly if not using JSDOM explicitly for it
    global.innerWidth = 1200;
  });

  describe('Basic Tree Structures', () => {
    it('should layout a single node', () => {
      const members: FamilyMember[] = [createMember('1', 'Root', 1)];
      const { nodes, edges } = layoutFamilyTree(members, '', {}, null, mockCallbacks, defaultConfig, false);

      expect(nodes).toHaveLength(1);
      expect(edges).toHaveLength(0);
      expect(nodes[0].id).toBe('1');
      expect(nodes[0].position.y).toBe(0); // Gen 1 is at y=0
      // X position will be affected by centering logic.
      // For a single node, it should be roughly viewport_center - nodeWidth/2
      const expectedX = (global.innerWidth / 2) - (defaultConfig.nodeWidth / 2);
      expect(nodes[0].position.x).toBeCloseTo(expectedX);
      expect(nodes[0].data.member.name).toBe('Root');
      expect(nodes[0].type).toBe('familyMember');
      expect(nodes[0].sourcePosition).toBe(Position.Bottom);
      expect(nodes[0].targetPosition).toBe(Position.Top);
    });

    it('should layout a simple parent-child structure', () => {
      const members: FamilyMember[] = [
        createMember('1', 'Parent', 1),
        createMember('2', 'Child', 2, ['1']),
      ];
      const { nodes, edges } = layoutFamilyTree(members, '', {}, null, mockCallbacks, defaultConfig, false);

      expect(nodes).toHaveLength(2);
      expect(edges).toHaveLength(1);

      const parentNode = nodes.find(n => n.id === '1');
      const childNode = nodes.find(n => n.id === '2');

      expect(parentNode).toBeDefined();
      expect(childNode).toBeDefined();

      expect(parentNode?.position.y).toBe(0); // Gen 1
      expect(childNode?.position.y).toBe(defaultConfig.generationSpacing); // Gen 2

      // Edge
      expect(edges[0].id).toBe('edge-1-to-2');
      expect(edges[0].source).toBe('1');
      expect(edges[0].target).toBe('2');
      expect(edges[0].type).toBe('smoothstep');
      expect(edges[0].markerEnd?.type).toBe(MarkerType.ArrowClosed);
    });

    it('should layout one parent with multiple children', () => {
      const members: FamilyMember[] = [
        createMember('p1', 'Parent', 1),
        createMember('c1', 'Child 1', 2, ['p1']),
        createMember('c2', 'Child 2', 2, ['p1']),
        createMember('c3', 'Child 3', 2, ['p1']),
      ];
      const { nodes, edges } = layoutFamilyTree(members, '', {}, null, mockCallbacks, defaultConfig, false);

      expect(nodes).toHaveLength(4);
      expect(edges).toHaveLength(3);

      const parentNode = nodes.find(n => n.id === 'p1');
      const child1Node = nodes.find(n => n.id === 'c1');
      const child2Node = nodes.find(n => n.id === 'c2');
      const child3Node = nodes.find(n => n.id === 'c3');

      expect(parentNode?.position.y).toBe(0);
      expect(child1Node?.position.y).toBe(defaultConfig.generationSpacing);
      expect(child2Node?.position.y).toBe(defaultConfig.generationSpacing);
      expect(child3Node?.position.y).toBe(defaultConfig.generationSpacing);

      // Children X positions should be spaced by siblingSpacing + nodeWidth
      // Their absolute X depends on centering and parent's X.
      // We expect c1, c2, c3 to be ordered.
      const childXPositions = [child1Node!.position.x, child2Node!.position.x, child3Node!.position.x].sort((a, b) => a - b);
      expect(childXPositions[1] - childXPositions[0]).toBeCloseTo(defaultConfig.nodeWidth + defaultConfig.siblingSpacing);
      expect(childXPositions[2] - childXPositions[1]).toBeCloseTo(defaultConfig.nodeWidth + defaultConfig.siblingSpacing);

      // All children should have edges from parent
      expect(edges.filter(e => e.source === 'p1')).toHaveLength(3);
    });

    it('should layout multiple generations (A -> B -> C)', () => {
        const members: FamilyMember[] = [
            createMember('A', 'Gen A', 1),
            createMember('B', 'Gen B', 2, ['A']),
            createMember('C', 'Gen C', 3, ['B']),
        ];
        const { nodes, edges } = layoutFamilyTree(members, '', {}, null, mockCallbacks, defaultConfig, false);

        expect(nodes).toHaveLength(3);
        expect(edges).toHaveLength(2);

        const nodeA = nodes.find(n => n.id === 'A');
        const nodeB = nodes.find(n => n.id === 'B');
        const nodeC = nodes.find(n => n.id === 'C');

        expect(nodeA?.position.y).toBe(0);
        expect(nodeB?.position.y).toBe(defaultConfig.generationSpacing);
        expect(nodeC?.position.y).toBe(defaultConfig.generationSpacing * 2);

        expect(edges.find(e => e.source === 'A' && e.target === 'B')).toBeDefined();
        expect(edges.find(e => e.source === 'B' && e.target === 'C')).toBeDefined();
    });
  });

  describe('searchQuery Highlighting', () => {
    it('should highlight nodes matching the searchQuery', () => {
      const members: FamilyMember[] = [
        createMember('1', 'Apple Tree', 1),
        createMember('2', 'Banana Tree', 1),
        createMember('3', 'Apple Pie', 2, ['1']),
      ];
      const { nodes } = layoutFamilyTree(members, 'apple', {}, null, mockCallbacks, defaultConfig, false);

      expect(nodes.find(n => n.id === '1')?.data.isHighlighted).toBe(true);
      expect(nodes.find(n => n.id === '2')?.data.isHighlighted).toBe(false);
      expect(nodes.find(n => n.id === '3')?.data.isHighlighted).toBe(true);
    });
  });

  describe('collapsedStates Behavior', () => {
    const membersForCollapse: FamilyMember[] = [
      createMember('root', 'Root', 1),
      createMember('child1', 'Child 1', 2, ['root']),
      createMember('grandchild1', 'Grandchild 1', 3, ['child1']),
      createMember('child2', 'Child 2', 2, ['root']),
    ];

    it('should hide descendants of a collapsed node', () => {
      const collapsedStates = { 'child1': true };
      const { nodes, edges } = layoutFamilyTree(membersForCollapse, '', collapsedStates, null, mockCallbacks, defaultConfig, false);

      expect(nodes.find(n => n.id === 'root')).toBeDefined();
      expect(nodes.find(n => n.id === 'child1')).toBeDefined();
      expect(nodes.find(n => n.id === 'child1')?.data.isCollapsed).toBe(true);
      expect(nodes.find(n => n.id === 'grandchild1')).toBeUndefined(); // Grandchild hidden
      expect(nodes.find(n => n.id === 'child2')).toBeDefined(); // Other children still visible

      expect(edges.find(e => e.target === 'grandchild1')).toBeUndefined();
      expect(edges.find(e => e.source === 'root' && e.target === 'child1')).toBeDefined();
    });
  });

  describe('focusedMemberId Behavior', () => {
    const membersForFocus: FamilyMember[] = [
        createMember('grandparent', 'Grandparent', 1),
        createMember('parent1', 'Parent 1', 2, ['grandparent']),
        createMember('child1', 'Child 1', 3, ['parent1']),
        createMember('parent2', 'Parent 2', 2, ['grandparent']), // Sibling of parent1
        createMember('uncle', 'Uncle', 1), // Unrelated to grandparent line for this test
    ];

    it('should only display the focused member and its descendants', () => {
        const { nodes, edges } = layoutFamilyTree(membersForFocus, '', {}, 'parent1', mockCallbacks, defaultConfig, false);

        expect(nodes.find(n => n.id === 'parent1')).toBeDefined();
        expect(nodes.find(n => n.id === 'child1')).toBeDefined();

        expect(nodes.find(n => n.id === 'grandparent')).toBeUndefined(); // Ancestor, should be hidden by focus
        expect(nodes.find(n => n.id === 'parent2')).toBeUndefined();   // Sibling of focused, but not descendant
        expect(nodes.find(n => n.id === 'uncle')).toBeUndefined();     // Unrelated

        expect(nodes).toHaveLength(2); // parent1 and child1
        expect(edges.find(e => e.source === 'parent1' && e.target === 'child1')).toBeDefined();
    });

    it('should display only the focused member if it has no descendants', () => {
        const { nodes } = layoutFamilyTree(membersForFocus, '', {}, 'child1', mockCallbacks, defaultConfig, false);
        expect(nodes).toHaveLength(1);
        expect(nodes[0].id).toBe('child1');
    });
  });

  describe('Node and Edge Properties', () => {
    it('should set correct data properties on nodes', () => {
      const member = createMember('1', 'Test Member', 1);
      const members: FamilyMember[] = [member];
      const { nodes } = layoutFamilyTree(members, '', {}, null, mockCallbacks, defaultConfig, true);

      expect(nodes[0].data.member).toEqual(member);
      expect(nodes[0].data.onSelect).toBe(mockCallbacks.onSelect);
      expect(nodes[0].data.onEdit).toBe(mockCallbacks.onEdit);
      expect(nodes[0].data.onDelete).toBe(mockCallbacks.onDelete);
      expect(nodes[0].data.onToggleCollapse).toBe(mockCallbacks.onToggleCollapse);
      expect(nodes[0].data.isHighlighted).toBe(false);
      expect(nodes[0].data.isCollapsed).toBe(false);
      expect(nodes[0].data.hasChildren).toBe(false); // No children in this test case
      expect(nodes[0].data.canEdit).toBe(true);
    });
  });

  describe('canEdit Prop', () => {
    it('should pass canEdit=true to nodes', () => {
      const members: FamilyMember[] = [createMember('1', 'Editable', 1)];
      const { nodes } = layoutFamilyTree(members, '', {}, null, mockCallbacks, defaultConfig, true);
      expect(nodes[0].data.canEdit).toBe(true);
    });

    it('should pass canEdit=false to nodes', () => {
      const members: FamilyMember[] = [createMember('1', 'Not Editable', 1)];
      const { nodes } = layoutFamilyTree(members, '', {}, null, mockCallbacks, defaultConfig, false);
      expect(nodes[0].data.canEdit).toBe(false);
    });
  });

  describe('Empty allMembers Array', () => {
    it('should return empty nodes and edges if allMembers is empty', () => {
      const { nodes, edges } = layoutFamilyTree([], '', {}, null, mockCallbacks, defaultConfig, false);
      expect(nodes).toEqual([]);
      expect(edges).toEqual([]);
    });
  });

  describe('Layout Configuration (config)', () => {
    it('should adjust Y spacing based on generationSpacing', () => {
        const members: FamilyMember[] = [
            createMember('P', 'Parent', 1),
            createMember('C', 'Child', 2, ['P']),
        ];
        const config1 = { ...defaultConfig, generationSpacing: 100 };
        const config2 = { ...defaultConfig, generationSpacing: 200 };

        const { nodes: nodes1 } = layoutFamilyTree(members, '', {}, null, mockCallbacks, config1, false);
        const { nodes: nodes2 } = layoutFamilyTree(members, '', {}, null, mockCallbacks, config2, false);

        expect(nodes1.find(n=>n.id==='C')?.position.y).toBe(100);
        expect(nodes2.find(n=>n.id==='C')?.position.y).toBe(200);
    });

    // Add more config tests for memberSpacing, siblingSpacing if clear effects can be isolated
    // Sibling spacing was tested in 'one parent with multiple children'
  });

  // Centering logic is complex to test precisely without replicating it.
  // The test for a single node provides a basic check.
  // Relative positions tested in 'multiple children' are also a good indicator.
});

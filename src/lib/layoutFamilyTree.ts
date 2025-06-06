import { Node, Edge, Position, MarkerType } from '@xyflow/react';
import { FamilyMember } from '../types/family';
import { getDescendants } from './treeUtils'; // Assuming getDescendants is correctly in treeUtils.ts

export interface LayoutCallbacks {
  onSelect: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (memberId: string) => void;
  onToggleCollapse: (memberId: string) => void;
}

export interface LayoutConfig {
  generationSpacing: number;
  memberSpacing: number;
  nodeWidth: number;
  siblingSpacing: number;
  // minParentPadding: number; // These were commented out as not directly used in the current simplified layout
  // minFamilyBlockSpacing: number; // These were commented out
}

export function layoutFamilyTree(
  allMembers: FamilyMember[],
  searchQuery: string,
  collapsedStates: Record<string, boolean>,
  focusedMemberId: string | null | undefined,
  callbacks: LayoutCallbacks,
  config: LayoutConfig,
  canEdit: boolean, // Add canEdit parameter
  viewportWidth: number // Added viewportWidth
): { nodes: Node[]; edges: Edge[] } {

  // --- Start of logic moved from FamilyTree.tsx's useEffect ---

  // Step 1: Determine initialSet.
  const initialSet: FamilyMember[] = focusedMemberId && allMembers.find(m => m.id === focusedMemberId)
    ? getDescendants(focusedMemberId, allMembers, 1) // getDescendants now iterative
    : allMembers.map(m => ({ ...m, generation: m.generation || 1 })); // Ensure generation if not focused

  const membersMapFromInitialSet = new Map(initialSet.map(m => [m.id, m]));

  // Step 2: Determine finalDisplayedMembers based on collapsedStates and focusedMemberId.
  let finalDisplayedMembers: FamilyMember[];
  const hiddenDueToCollapseIds = new Set<string>();

  if (focusedMemberId) {
    // If focused, start with the focused member and its descendants (initialSet).
    // Then, hide descendants of any member in this set that is collapsed.
    for (const member of initialSet) {
      if (collapsedStates[member.id] && member.id !== focusedMemberId) {
        // Get descendants of this collapsed member *within the initialSet*.
        const descendantsToHide = getDescendants(member.id, initialSet, member.generation || 1);
        // Add all descendants except the collapsed member itself (as it might still be shown if it's the focusedMemberId's child but not focusedMemberId)
        // This is tricky. If 'member' is collapsed, its direct children in initialSet should be hidden, and their descendants.
        // getDescendants(member.id, initialSet) will return 'member' as the first item. We want its children.
        const childrenOfCollapsed = initialSet.filter(m => m.parents?.includes(member.id));
        for (const child of childrenOfCollapsed) {
          if (!hiddenDueToCollapseIds.has(child.id)) { // Avoid redundant processing
            const childDescendants = getDescendants(child.id, initialSet, child.generation || 1);
            childDescendants.forEach(desc => hiddenDueToCollapseIds.add(desc.id));
          }
        }
      }
    }
    finalDisplayedMembers = initialSet.filter(m => !hiddenDueToCollapseIds.has(m.id));

    // Ensure the focused member itself is always visible if it was in initialSet.
    const focusedMember = membersMapFromInitialSet.get(focusedMemberId);
    if (focusedMember && !finalDisplayedMembers.find(m => m.id === focusedMemberId)) {
      // If the focused member got hidden, it means it was a descendant of another collapsed node in the focused set.
      // This scenario implies a complex interaction. The original safeguard just added it.
      // For now, if focusedMemberId is specified, it must be displayed.
      // If it was hidden, it implies its parent (within the focused set) was collapsed.
      // This part of the logic might need to be re-evaluated based on desired UX for such edge cases.
      // Let's assume: if focused, it's visible. If it's also collapsed, its children are hidden by the above loop.
      if (!finalDisplayedMembers.some(fm => fm.id === focusedMemberId) && initialSet.some(isM => isM.id === focusedMemberId)) {
         const focusedMemberData = initialSet.find(m => m.id === focusedMemberId);
         if (focusedMemberData) finalDisplayedMembers.unshift(focusedMemberData); // Add it back if removed
      }
    }

  } else {
    // No specific focus, initialSet is allMembers.
    // A member is hidden if any of its ancestors are collapsed.
    const memberVisibility = new Map<string, boolean>();

    // Sort by generation to ensure parents are processed before children
    const sortedInitialSet = [...initialSet].sort((a, b) => (a.generation || 1) - (b.generation || 1));

    for (const member of sortedInitialSet) {
      let isVisible = true;
      // Check direct parents first
      if (member.parents && member.parents.length > 0) {
        for (const parentId of member.parents) {
          const parentIsVisible = memberVisibility.get(parentId);
          // If a parent is explicitly hidden (false) or if a parent is collapsed, this member is hidden.
          if (parentIsVisible === false || (membersMapFromInitialSet.has(parentId) && collapsedStates[parentId])) {
            isVisible = false;
            break;
          }
        }
      }
      memberVisibility.set(member.id, isVisible);
    }
    finalDisplayedMembers = initialSet.filter(m => memberVisibility.get(m.id) !== false);
  }
  
  const displayedMembers = finalDisplayedMembers;

  // Use config values
  const { generationSpacing, memberSpacing, nodeWidth, siblingSpacing } = config;

  const nodeYPositions = new Map<string, number>();
  const currentLayoutNodes: Node[] = displayedMembers.map(member => {
    const yPos = ((member.generation || 1) - 1) * generationSpacing;
    nodeYPositions.set(member.id, yPos);
    const isHighlighted = searchQuery && member.name.toLowerCase().includes(searchQuery.toLowerCase());
    // Optimization: hasVisibleChildren can be computed more efficiently if needed,
    // but `displayedMembers.some` is likely acceptable if `displayedMembers` isn't excessively large.
    const hasVisibleChildren = displayedMembers.some(child => child.parents?.includes(member.id));
    
    return {
        id: member.id,
        type: 'familyMember',
        position: { x: 0, y: yPos }, 
        data: {
            member,
            onSelect: callbacks.onSelect, 
            onEdit: callbacks.onEdit,
            onDelete: callbacks.onDelete,
            isHighlighted,
            isCollapsed: !!collapsedStates[member.id],
            onToggleCollapse: callbacks.onToggleCollapse,
            hasChildren: hasVisibleChildren,
            canEdit: canEdit
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
    };
  });

  const maxGeneration = Math.max(0, ...displayedMembers.map(m => (m.generation || 1)));
  const nodeXPositionsGlobal = new Map<string, number>();

  // Group nodes by generation for efficient access
  const nodesByGeneration = new Map<number, Node[]>();
  currentLayoutNodes.forEach(node => {
    const gen = node.data.member.generation || 1;
    if (!nodesByGeneration.has(gen)) {
      nodesByGeneration.set(gen, []);
    }
    nodesByGeneration.get(gen)!.push(node);
  });

  for (let g = 1; g <= maxGeneration; g++) {
    const nodesInCurrentGen = nodesByGeneration.get(g) || [];
    if (nodesInCurrentGen.length === 0) continue;

    if (g === 1) {
      // Sort displayedMembers of generation 1 once for stable layout
      const gen1MembersSorted = displayedMembers
        .filter(m => (m.generation || 1) === 1)
        .sort((a, b) => a.id.localeCompare(b.id)); // Or some other stable sort key

      const processedGen1NodeIds = new Set<string>();
      let currentX = 0;

      gen1MembersSorted.forEach(memberData => {
        const node = nodesInCurrentGen.find(n => n.id === memberData.id);
        if (node && !processedGen1NodeIds.has(node.id)) {
          node.position.x = currentX;
          processedGen1NodeIds.add(node.id);
          nodeXPositionsGlobal.set(node.id, currentX);
          currentX += nodeWidth + memberSpacing; // Base spacing for next independent node

          // Handle spouse if present and in this generation
          if (memberData.spouse && memberData.spouse !== memberData.id) {
            const spouseMemberData = displayedMembers.find(m => m.id === memberData.spouse && (m.generation || 1) === 1);
            if (spouseMemberData) {
              const spouseNode = nodesInCurrentGen.find(n => n.id === spouseMemberData.id);
              if (spouseNode && !processedGen1NodeIds.has(spouseNode.id)) {
                // Position spouse right next to the current node
                spouseNode.position.x = node.position.x + memberSpacing; // More direct positioning
                processedGen1NodeIds.add(spouseNode.id);
                nodeXPositionsGlobal.set(spouseNode.id, spouseNode.position.x);
                // Adjust currentX to account for the spouse node if it was separately positioned
                currentX = spouseNode.position.x + nodeWidth + memberSpacing; 
              }
            }
          }
        }
      });
       // Fallback for any gen 1 nodes not caught by sorted iteration (e.g. no spouse links but multiple roots)
       nodesInCurrentGen.forEach(node => {
        if(!processedGen1NodeIds.has(node.id)){
            node.position.x = currentX;
            processedGen1NodeIds.add(node.id);
            nodeXPositionsGlobal.set(node.id, currentX);
            currentX += nodeWidth + memberSpacing;
        }
       });


    } else { // For g > 1
      nodesInCurrentGen.forEach(node => {
        const member = node.data.member as FamilyMember;
        let calculatedX = 0;
        if (member.parents && member.parents.length > 0) {
          const parentXCoords = member.parents
            .map(parentId => nodeXPositionsGlobal.get(parentId))
            .filter(x => x !== undefined) as number[];
          if (parentXCoords.length > 0) {
            calculatedX = parentXCoords.reduce((sum, xVal) => sum + xVal, 0) / parentXCoords.length;
          }
        }
        node.position.x = calculatedX; // Initial position based on parents
        // nodeXPositionsGlobal.set(node.id, calculatedX); // Set early for sorting below? No, after adjustments.
      });
    }

    // Sibling group adjustment (applies to all generations, including G1 after initial placement)
    const childrenByParentKeyInCurrentGen = new Map<string, Node[]>();
    nodesInCurrentGen.forEach(node => {
      const member = node.data.member as FamilyMember;
      // Use a consistent parent key for siblings (e.g., sorted list of parent IDs)
      const parentKey = member.parents && member.parents.length > 0 ? member.parents.sort().join('-') : `no-parents-${node.id}`; // Ensure unique key for root nodes or those without parents in set
      if (!childrenByParentKeyInCurrentGen.has(parentKey)) {
        childrenByParentKeyInCurrentGen.set(parentKey, []);
      }
      childrenByParentKeyInCurrentGen.get(parentKey)!.push(node);
    });

    childrenByParentKeyInCurrentGen.forEach(siblingGroup => {
      if (siblingGroup.length > 1) {
        // Sort by initial X position to maintain relative order before spreading
        siblingGroup.sort((a, b) => a.position.x - b.position.x);
        
        const groupParentX = siblingGroup.reduce((sum, node) => sum + node.position.x, 0) / siblingGroup.length;
        const totalSiblingWidth = (siblingGroup.length * nodeWidth) + ((siblingGroup.length - 1) * siblingSpacing);
        let startX = groupParentX - totalSiblingWidth / 2;

        siblingGroup.forEach((node, index) => {
          node.position.x = startX + (index * (nodeWidth + siblingSpacing)) + nodeWidth / 2; // Center of node
        });
      }
    });
    
    // Update global X positions after all adjustments for the current generation
    nodesInCurrentGen.forEach(node => {
      nodeXPositionsGlobal.set(node.id, node.position.x);
    });
  }
  
  const familyEdges: Edge[] = [];
  const displayedMemberIds = new Set(displayedMembers.map(m => m.id)); 
  displayedMembers.forEach(member => {
      if (member.parents && Array.isArray(member.parents)) {
          member.parents.forEach(parentId => {
              if (parentId && displayedMemberIds.has(parentId) && displayedMemberIds.has(member.id)) { 
                  familyEdges.push({
                      id: `edge-${parentId}-to-${member.id}`,
                      source: parentId,
                      target: member.id,
                      type: 'default',
                      animated: true,
                      markerEnd: { type: MarkerType.ArrowClosed, color: '#60a5fa', width: 18, height: 18 },
                      style: { stroke: '#60a5fa', strokeWidth: 2, strokeLinecap: 'round', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'},
                  });
              }
          });
      }
  });

  let centeredNodes = currentLayoutNodes; 
  if (currentLayoutNodes.length > 0) {
      const allXPositions = currentLayoutNodes.map(n => n.position.x);
      const minX = Math.min(...allXPositions);
      const maxX = Math.max(...currentLayoutNodes.map(n => n.position.x + nodeWidth)); 
      
      const rootNodes = currentLayoutNodes.filter(n => (n.data.member.generation || 1) === 1); 
      let rootGenCenterX = 0;
      if (rootNodes.length > 0) {
          rootGenCenterX = rootNodes.reduce((acc, n) => acc + n.position.x, 0) / rootNodes.length;
      } else if (currentLayoutNodes.length > 0) { 
          rootGenCenterX = currentLayoutNodes.reduce((acc, n) => acc + n.position.x, 0) / currentLayoutNodes.length;
      }

      // const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000; // Replaced by parameter
      const finalGlobalShiftX = (viewportWidth / 2) - (rootGenCenterX + nodeWidth / 2);

      centeredNodes = currentLayoutNodes.map(node => ({
          ...node,
          position: {
              ...node.position,
              x: node.position.x + finalGlobalShiftX,
          },
      }));
  }

  const finalNodesForReactFlow = centeredNodes.map(node => {
      return { 
          ...node,
      };
  });
  
  // --- End of logic moved from FamilyTree.tsx's useEffect ---

  return { nodes: finalNodesForReactFlow, edges: familyEdges };
}

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
  let gen1CenterX = viewportWidth / 2; // Default, will be updated after Gen 1 is laid out

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
      const gen1NodesOnly = nodesInCurrentGen; // Alias for clarity in this block

      // Initial layout of Gen 1 nodes, starting from currentX = 0
      const gen1MembersSorted = displayedMembers
        .filter(m => (m.generation || 1) === 1)
        .sort((a, b) => a.id.localeCompare(b.id));

      const processedGen1NodeIds = new Set<string>();
      let currentX = 0; // Start initial layout from X = 0

      gen1MembersSorted.forEach(memberData => {
        const node = gen1NodesOnly.find(n => n.id === memberData.id);
        if (node && !processedGen1NodeIds.has(node.id)) {
          node.position.x = currentX;
          // nodeXPositionsGlobal.set(node.id, currentX); // Temporarily set, will be updated after shift
          processedGen1NodeIds.add(node.id);
          currentX += nodeWidth + memberSpacing;

          if (memberData.spouse && memberData.spouse !== memberData.id) {
            const spouseMemberData = displayedMembers.find(m => m.id === memberData.spouse && (m.generation || 1) === 1);
            if (spouseMemberData) {
              const spouseNode = gen1NodesOnly.find(n => n.id === spouseMemberData.id);
              if (spouseNode && !processedGen1NodeIds.has(spouseNode.id)) {
                spouseNode.position.x = node.position.x + memberSpacing;
                // nodeXPositionsGlobal.set(spouseNode.id, spouseNode.position.x); // Temp
                processedGen1NodeIds.add(spouseNode.id);
                currentX = spouseNode.position.x + nodeWidth + memberSpacing;
              }
            }
          }
        }
      });

      gen1NodesOnly.forEach(node => {
        if (!processedGen1NodeIds.has(node.id)) {
          node.position.x = currentX;
          // nodeXPositionsGlobal.set(node.id, currentX); // Temp
          processedGen1NodeIds.add(node.id);
          currentX += nodeWidth + memberSpacing;
        }
      });

      // Now, center this entire Gen 1 block
      if (gen1NodesOnly.length > 0) {
        const gen1XPositions = gen1NodesOnly.map(n => n.position.x);
        const minX_gen1 = Math.min(...gen1XPositions);
        const maxNodeX_gen1 = gen1NodesOnly.map(n => n.position.x + nodeWidth); // nodeWidth from config
        const maxX_gen1 = Math.max(...maxNodeX_gen1);
        const gen1Width = maxX_gen1 - minX_gen1;

        const gen1ShiftX = (viewportWidth / 2) - (minX_gen1 + gen1Width / 2);

        gen1NodesOnly.forEach(node => {
          node.position.x += gen1ShiftX;
          nodeXPositionsGlobal.set(node.id, node.position.x); // IMPORTANT: Update global X with final centered position
        });

        // Calculate actual gen1CenterX after centering
        const finalGen1XPositions = gen1NodesOnly.map(n => nodeXPositionsGlobal.get(n.id)!);
        if (finalGen1XPositions.length > 0) {
            const finalMinX_gen1 = Math.min(...finalGen1XPositions);
            // Ensure nodeWidth is from config for this calculation specifically
            const finalMaxNodeX_gen1 = gen1NodesOnly.map(n => nodeXPositionsGlobal.get(n.id)! + config.nodeWidth);
            const finalMaxX_gen1 = Math.max(...finalMaxNodeX_gen1);
            gen1CenterX = finalMinX_gen1 + (finalMaxX_gen1 - finalMinX_gen1) / 2;
        }
      }

    } else { // For g > 1
      const nodesByParentKeyInCurrentGen = new Map<string, Node[]>();
      nodesInCurrentGen.forEach(node => {
        const member = node.data.member as FamilyMember;
        const parentKey = member.parents && member.parents.length > 0
                          ? member.parents.sort().join('-')
                          : `no-parents-${member.id}`;
        if (!nodesByParentKeyInCurrentGen.has(parentKey)) {
          nodesByParentKeyInCurrentGen.set(parentKey, []);
        }
        nodesByParentKeyInCurrentGen.get(parentKey)!.push(node);
      });

      const sortedParentKeys = Array.from(nodesByParentKeyInCurrentGen.keys()).sort();
      const parentGroupDetails: { parentKey: string; siblingGroup: Node[]; groupWidth: number; avgParentX: number }[] = [];
      let totalWidthOfCurrentGeneration = 0;

      for (const parentKey of sortedParentKeys) {
        const siblingGroup = nodesByParentKeyInCurrentGen.get(parentKey)!;
        const groupWidth = (siblingGroup.length * nodeWidth) + ((siblingGroup.length - 1) * siblingSpacing);
        totalWidthOfCurrentGeneration += groupWidth;

        let avgParentX = gen1CenterX; // Default to Gen1 center
        if (siblingGroup.length > 0 && siblingGroup[0].data.member.parents && siblingGroup[0].data.member.parents.length > 0) {
          const parentXCoords = siblingGroup[0].data.member.parents
            .map(parentId => nodeXPositionsGlobal.get(parentId))
            .filter(x => x !== undefined) as number[];
          if (parentXCoords.length > 0) {
            avgParentX = parentXCoords.reduce((sum, xVal) => sum + xVal, 0) / parentXCoords.length;
          }
        }
        parentGroupDetails.push({ parentKey, siblingGroup, groupWidth, avgParentX });
      }
      if (parentGroupDetails.length > 0) {
        totalWidthOfCurrentGeneration += (parentGroupDetails.length - 1) * memberSpacing;
      }

      let collectiveParentCenterX = gen1CenterX;
      if (parentGroupDetails.length > 0) {
        const weightedSum = parentGroupDetails.reduce((sum, detail) => sum + detail.avgParentX * detail.siblingGroup.length, 0);
        const totalNodesInGen = parentGroupDetails.reduce((sum, detail) => sum + detail.siblingGroup.length, 0);
        if (totalNodesInGen > 0) {
          collectiveParentCenterX = weightedSum / totalNodesInGen;
        }
      }

      const startXForCurrentGeneration = collectiveParentCenterX - (totalWidthOfCurrentGeneration / 2);
      let currentXInGenerationBlock = startXForCurrentGeneration;

      parentGroupDetails.forEach(({ siblingGroup, groupWidth }) => {
        let currentSiblingX = currentXInGenerationBlock;
        siblingGroup.forEach(node => {
          node.position.x = currentSiblingX + nodeWidth / 2; // Center of the node
          nodeXPositionsGlobal.set(node.id, node.position.x);
          currentSiblingX += nodeWidth + siblingSpacing;
        });
        currentXInGenerationBlock += groupWidth + memberSpacing;
      });
    }
    // Global X positions are updated within the loops now.
    // The old generic global update loop is removed as nodeXPositionsGlobal is set more precisely.
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
                      type: 'smoothstep',
                      animated: true,
                      markerEnd: { type: MarkerType.ArrowClosed, color: '#60a5fa', width: 20, height: 20 },
                      style: { stroke: '#60a5fa', strokeWidth: 2.5, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'},
                  });
              }
          });
      }
  });

  // The final global centering logic has been removed.
  // currentLayoutNodes now contain the positions determined by hierarchical centering.

  // The existing finalNodesForReactFlow mapping seems to be a simple clone,
  // which is fine. If centeredNodes is not reassigned by a removed block,
  // it will be equal to currentLayoutNodes.
  const finalNodesForReactFlow = currentLayoutNodes.map(node => {
      return { 
          ...node,
      };
  });
  
  // --- End of logic moved from FamilyTree.tsx's useEffect ---

  return { nodes: finalNodesForReactFlow, edges: familyEdges };
}

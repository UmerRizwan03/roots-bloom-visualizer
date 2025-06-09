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
  canEdit: boolean,
  viewportWidth: number,
  hoveredMemberId?: string | null,
  viewMode?: 'FullTree' | 'PersonView' | 'LineageView',
  lineageDirection?: 'Ancestors' | 'Descendants'
): { nodes: Node[]; edges: Edge[] } {

  // --- Start of logic moved from FamilyTree.tsx's useEffect ---

  // Use config values
  const { generationSpacing, memberSpacing, nodeWidth, siblingSpacing } = config;

  const { generationSpacing, memberSpacing, nodeWidth, siblingSpacing } = config;
  const nodeYPositions = new Map<string, number>();
  let displayedMembers: FamilyMember[] = [];
  let nonDimmedMemberIds = new Set<string>(); // Used for FullTree dimming

  // Determine displayedMembers based on viewMode
  if (viewMode === 'PersonView' && focusedMemberId) {
    const focusedMember = allMembers.find(m => m.id === focusedMemberId);
    if (focusedMember) {
      const personViewIds = new Set<string>();
      personViewIds.add(focusedMember.id);
      focusedMember.parents?.forEach(id => personViewIds.add(id));
      if (focusedMember.spouse) personViewIds.add(focusedMember.spouse);
      // Add children
      allMembers.forEach(m => {
        if (m.parents?.includes(focusedMember.id)) personViewIds.add(m.id);
      });
      // Add siblings
      if (focusedMember.parents) {
        allMembers.forEach(m => {
          if (m.id !== focusedMember.id && m.parents?.some(pId => focusedMember.parents!.includes(pId))) {
            personViewIds.add(m.id);
          }
        });
      }
      displayedMembers = allMembers.filter(m => personViewIds.has(m.id));
      // In PersonView, all displayed members are "not dimmed" relative to the scope.
      nonDimmedMemberIds = personViewIds;
    } else {
      // Fallback if focusedMemberId is invalid or not found
      displayedMembers = allMembers.map(m => ({ ...m, generation: m.generation || 1 }));
    }
  } else if (viewMode === 'LineageView' && focusedMemberId) {
    const focusedMember = allMembers.find(m => m.id === focusedMemberId);
    if (focusedMember) {
      let lineageMembers: FamilyMember[] = [];
      if (lineageDirection === 'Descendants') {
        lineageMembers = getDescendants(focusedMember.id, allMembers, 1);
      } else { // Ancestors
        // getAncestors includes the focused member and assigns relative generations
        // For layout, we might need to re-calculate generations from a common root or adjust Y positions.
        // For now, let's use the relative generations from getAncestors.
        // The layout algorithm later uses (generation - 1) * spacing.
        // If ancestor generations are e.g. 1 (focused), 2 (parents), 3 (grandparents),
        // they will be laid out downwards. This might be desired or require adjustment.
        lineageMembers = getAncestors(focusedMember.id, allMembers, 1);
      }
      // Optionally add spouses of lineage members
      // For now, only direct lineage + focused member's spouse if not already included.
      // This part can be enhanced later.
      displayedMembers = lineageMembers;
      nonDimmedMemberIds = new Set(displayedMembers.map(m => m.id));
    } else {
      displayedMembers = allMembers.map(m => ({ ...m, generation: m.generation || 1 }));
    }
  } else { // FullTree or fallback
    // Step 1: Determine initialSet (relevant for FullTree dimming if focused)
    const initialSetForFullTree: FamilyMember[] = focusedMemberId && allMembers.find(m => m.id === focusedMemberId)
      ? getDescendants(focusedMemberId, allMembers, 1)
      : allMembers.map(m => ({ ...m, generation: m.generation || 1 }));
    const membersMapFromInitialSet = new Map(initialSetForFullTree.map(m => [m.id, m]));

    // Expanded focus scope for FullTree dimming
    if (focusedMemberId) {
      const focusedMember = allMembers.find(m => m.id === focusedMemberId);
      if (focusedMember) {
        nonDimmedMemberIds.add(focusedMember.id);
        focusedMember.parents?.forEach(pId => nonDimmedMemberIds.add(pId));
        if (focusedMember.spouse) {
          nonDimmedMemberIds.add(focusedMember.spouse);
          allMembers.forEach(m => { if (m.spouse === focusedMember.id) nonDimmedMemberIds.add(m.id); });
        }
        if (focusedMember.parents) {
          allMembers.forEach(m => {
            if (m.id !== focusedMember.id && m.parents?.some(pId => focusedMember.parents!.includes(pId))) {
              nonDimmedMemberIds.add(m.id);
            }
          });
        }
        const descendants = getDescendants(focusedMember.id, allMembers, focusedMember.generation || 1);
        descendants.forEach(d => nonDimmedMemberIds.add(d.id));
      }
    }

    // Step 2: Filter by collapsedStates (applies mainly to FullTree)
    let membersAfterCollapseFilter: FamilyMember[];
    const hiddenDueToCollapseIds = new Set<string>();
    if (focusedMemberId && viewMode === 'FullTree') { // Collapse logic for focused FullTree
      for (const member of initialSetForFullTree) {
        if (collapsedStates[member.id] && member.id !== focusedMemberId) {
          const childrenOfCollapsed = initialSetForFullTree.filter(m => m.parents?.includes(member.id));
          for (const child of childrenOfCollapsed) {
            if (!hiddenDueToCollapseIds.has(child.id)) {
              getDescendants(child.id, initialSetForFullTree, child.generation || 1)
                .forEach(desc => hiddenDueToCollapseIds.add(desc.id));
            }
          }
        }
      }
      membersAfterCollapseFilter = initialSetForFullTree.filter(m => !hiddenDueToCollapseIds.has(m.id));
      // Ensure focused member is always visible in FullTree if it was in initial set.
      if (!membersAfterCollapseFilter.some(m => m.id === focusedMemberId) && initialSetForFullTree.some(m => m.id === focusedMemberId)) {
        const fmData = initialSetForFullTree.find(m => m.id === focusedMemberId);
        if (fmData) membersAfterCollapseFilter.unshift(fmData);
      }
    } else if (viewMode === 'FullTree') { // Collapse logic for non-focused FullTree
      const memberVisibility = new Map<string, boolean>();
      const sortedAllMembers = [...allMembers.map(m => ({ ...m, generation: m.generation || 1 }))]
                                 .sort((a, b) => (a.generation || 1) - (b.generation || 1));
      for (const member of sortedAllMembers) {
        let isVisible = true;
        if (member.parents && member.parents.length > 0) {
          for (const parentId of member.parents) {
            if (memberVisibility.get(parentId) === false || collapsedStates[parentId]) {
              isVisible = false;
              break;
            }
          }
        }
        memberVisibility.set(member.id, isVisible);
      }
      membersAfterCollapseFilter = allMembers.filter(m => memberVisibility.get(m.id) !== false);
    } else { // PersonView or LineageView - collapse state not primary filter here
      membersAfterCollapseFilter = displayedMembers; // Use already filtered members for these views
    }
    displayedMembers = membersAfterCollapseFilter;
  }


  const currentLayoutNodes: Node[] = displayedMembers.map(member => {
    const yPos = ((member.generation || 1) - 1) * generationSpacing; // Ensure generation is positive
    nodeYPositions.set(member.id, yPos);

    const isHighlighted = searchQuery && member.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isHoverHighlighted = !!hoveredMemberId && member.id === hoveredMemberId;

    let isDimmed = false;
    if (viewMode === 'FullTree' && focusedMemberId) {
      isDimmed = !nonDimmedMemberIds.has(member.id);
    } // In Person/Lineage view, dimming is implicitly handled by selection, or not applied.

    let focusedRelationType: string | null = null;
    if (focusedMemberId && (viewMode === 'FullTree' ? !isDimmed : nonDimmedMemberIds.has(member.id))) {
      const focusedMemberDetails = allMembers.find(m => m.id === focusedMemberId);
      if (focusedMemberDetails) {
        if (member.id === focusedMemberId) {
          focusedRelationType = 'self';
        } else if (focusedMemberDetails.parents?.includes(member.id)) {
          focusedRelationType = 'parent';
        } else if (member.parents?.includes(focusedMemberId)) {
          focusedRelationType = 'child';
        } else if (member.id === focusedMemberDetails.spouse || focusedMemberDetails.id === member.spouse) {
          focusedRelationType = 'spouse';
        } else if (viewMode !== 'LineageView' &&
                   focusedMemberDetails.parents && member.parents?.some(pId => focusedMemberDetails.parents!.includes(pId))) {
           // Sibling logic (ensure it's not parent, child, spouse of focused)
           if (member.id !== focusedMemberId &&
               !focusedMemberDetails.parents?.includes(member.id) &&
               !(member.parents?.includes(focusedMemberId)) &&
               member.id !== focusedMemberDetails.spouse &&
               focusedMemberDetails.id !== member.spouse) {
            focusedRelationType = 'sibling';
           }
        } else if (viewMode !== 'LineageView' && getDescendants(focusedMemberId, allMembers).some(d => d.id === member.id && d.id !== focusedMemberId)) {
          // Check for descendant if not already covered and not in LineageView (which handles it separately)
          // Ensure it's not the focused member itself (already 'self')
          // Ensure it's not a direct child (already 'child')
          // Ensure it's not a parent, spouse, or sibling (already covered by previous conditions)
          // This block will catch grandchildren and further descendants for FullTree/PersonView.
          if (member.id !== focusedMemberId &&
              !(member.parents?.includes(focusedMemberId)) &&
              !focusedMemberDetails.parents?.includes(member.id) &&
              member.id !== focusedMemberDetails.spouse &&
              focusedMemberDetails.id !== member.spouse &&
              !(focusedMemberDetails.parents && member.parents?.some(pId => focusedMemberDetails.parents!.includes(pId)))) {
            focusedRelationType = 'descendant';
          }
        } else if (viewMode === 'LineageView') {
            if (lineageDirection === 'Ancestors' && member.id !== focusedMemberId && getAncestors(focusedMemberId, allMembers).some(a => a.id === member.id)) {
                 const ancestorsOfFocused = getAncestors(focusedMemberId, allMembers);
                 if (ancestorsOfFocused.some(a => a.id === member.id && member.id !== focusedMemberId)) {
                    focusedRelationType = 'ancestor';
                 }
            } else if (lineageDirection === 'Descendants' && member.id !== focusedMemberId && getDescendants(focusedMemberId, allMembers).some(d => d.id === member.id)) {
                 focusedRelationType = 'descendant'; // This is specific to LineageView, but the new block above handles other views.
            }
        }
      }
    }

    // Re-calculate hasVisibleChildren based on the final displayedMembers for the current view
    const hasVisibleChildren = viewMode === 'FullTree' ?
                               displayedMembers.some(child => child.parents?.includes(member.id) && !collapsedStates[member.id])
                               : displayedMembers.some(child => child.parents?.includes(member.id));
                               // For Person/Lineage, collapse might not be explicitly managed by button, or can be added.
                               // For now, +/- button might be less relevant or always show if children exist in the subset.
                               // Simplified: show +/- if children are in the *displayed subset* for Person/Lineage.
                               // For FullTree, respect collapsedStates.

    // If a node is collapsed, its children should not be in displayedMembers for FullTree.
    // For Person/Lineage, this is implicitly handled by the initial filtering.
    // The `hasChildren` prop for the button should reflect if there *are* children in allMembers,
    // not just currently visible ones.
    const hasAnyChildren = allMembers.some(child => child.parents?.includes(member.id));
    
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
            isHoverHighlighted, // Added isHoverHighlighted
            isDimmed,
            focusedRelationType,
            isCollapsed: !!collapsedStates[member.id],
            onToggleCollapse: callbacks.onToggleCollapse,
            hasChildren: hasAnyChildren, // Use the new logic here
            canEdit: canEdit,
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
        const node = nodesInCurrentGen.find(n => n.id === memberData.id);
        if (node && !processedGen1NodeIds.has(node.id)) {
          node.position.x = currentX;
          processedGen1NodeIds.add(node.id);
          nodeXPositionsGlobal.set(node.id, currentX); // Update global X immediately
          currentX += nodeWidth + memberSpacing;

          if (memberData.spouse && memberData.spouse !== memberData.id) {
            const spouseMemberData = displayedMembers.find(m => m.id === memberData.spouse && (m.generation || 1) === 1);
            if (spouseMemberData) {
              const spouseNode = nodesInCurrentGen.find(n => n.id === spouseMemberData.id);
              if (spouseNode && !processedGen1NodeIds.has(spouseNode.id)) {
                spouseNode.position.x = node.position.x + memberSpacing;
                processedGen1NodeIds.add(spouseNode.id);
                nodeXPositionsGlobal.set(spouseNode.id, spouseNode.position.x); // Update global X
                currentX = spouseNode.position.x + nodeWidth + memberSpacing;
              }
            }
          }
        }
      });

      nodesInCurrentGen.forEach(node => {
        if (!processedGen1NodeIds.has(node.id)) {
          node.position.x = currentX; // currentX is a left edge
          processedGen1NodeIds.add(node.id);
          // nodeXPositionsGlobal.set(node.id, currentX + nodeWidth / 2); // Store center
          currentX += nodeWidth + memberSpacing;
        }
      });

      // Explicit Gen 1 Centering
      if (gen1NodesOnly.length > 0) {
        // At this point, node.position.x is the left edge from the sequential layout
        const gen1XLeftEdges = gen1NodesOnly.map(n => n.position.x);
        const minX_gen1_left = Math.min(...gen1XLeftEdges);
        const maxR_gen1_right = gen1NodesOnly.map(n => n.position.x + nodeWidth);
        const maxX_gen1_right = Math.max(...maxR_gen1_right);
        const gen1ActualWidth = maxX_gen1_right - minX_gen1_left;

        const gen1ShiftX = (viewportWidth / 2) - (minX_gen1_left + gen1ActualWidth / 2);

        gen1NodesOnly.forEach(node => {
          node.position.x += gen1ShiftX; // Shift left edge
          nodeXPositionsGlobal.set(node.id, node.position.x + nodeWidth / 2); // Store CENTER for future avgParentX
        });

        const finalGen1XCenters = gen1NodesOnly.map(n => nodeXPositionsGlobal.get(n.id)!);
        if (finalGen1XCenters.length > 0) {
            // gen1CenterX should be the center of the entire block of Gen 1 nodes
            const minActualLeftEdge = Math.min(...gen1NodesOnly.map(n => n.position.x));
            const maxActualRightEdge = Math.max(...gen1NodesOnly.map(n => n.position.x + nodeWidth));
            gen1CenterX = minActualLeftEdge + (maxActualRightEdge - minActualLeftEdge) / 2;
        }
      }

    } else { // For g > 1 (Hierarchical Layout)
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
            .map(parentId => nodeXPositionsGlobal.get(parentId)) // These are centers
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

      const startXForCurrentGenerationBlock = collectiveParentCenterX - (totalWidthOfCurrentGeneration / 2); // Left edge of the generation block
      let currentGroupX = startXForCurrentGenerationBlock;

      parentGroupDetails.forEach(({ siblingGroup, groupWidth, avgParentX }) => {
        // avgParentX is the target center for this specific siblingGroup.
        // However, the group must be placed sequentially starting at currentGroupX.
        // For this version, we place the group sequentially, and then arrange siblings within that slot.
        // A more advanced version might try to align the group's center (avgParentX) IF it doesn't break sequence.

        let relativeXWithinGroup = 0;
        const firstSiblingActualLeftEdge = currentGroupX;

        siblingGroup.forEach((node) => {
          node.position.x = firstSiblingActualLeftEdge + relativeXWithinGroup + (nodeWidth / 2); // Set node's center
          nodeXPositionsGlobal.set(node.id, node.position.x); // Store center
          relativeXWithinGroup += nodeWidth + siblingSpacing;
        });
        currentGroupX += groupWidth + memberSpacing;
      });
    }
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
                      style: {
                        stroke: '#60a5fa',
                        strokeWidth: 2.5,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                        transition: 'stroke 0.3s ease, opacity 0.3s ease-in-out' // Added transition
                      },
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

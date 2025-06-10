import { Node, Edge, Position, MarkerType } from '@xyflow/react';
import { FamilyMember } from '../types/family';
import { getDescendants } from './treeUtils'; // Assuming getDescendants is correctly in treeUtils.ts

export interface LayoutCallbacks {
  onSelect: (member: FamilyMember) => void;
  onEdit: (member: FamilyMember) => void;
  onDelete: (memberId: string) => void;
  onToggleCollapse: (memberId: string) => void;
  onNodeClick: (member: FamilyMember) => void;
  onAddChild?: (member: FamilyMember) => void; // Add this
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
  const nodeYPositions = new Map<string, number>();
  let displayedMembers: FamilyMember[] = [];
  let nonDimmedMemberIds = new Set<string>(); // Used for FullTree dimming

  // Determine displayedMembers based on viewMode
  if (viewMode === 'PersonView' && focusedMemberId) {
    const focusedMember = allMembers.find(m => m.id === focusedMemberId);
    if (focusedMember) {
      const personViewIds = new Set<string>();
      personViewIds.add(focusedMember.id); // Add focused member

      // Add parents
      focusedMember.parents?.forEach(id => personViewIds.add(id));

      // Add spouses/partners (incorporating JSON parsing and legacy spouse field)
      // 1. Direct partners/spouse of the focused member
      if (focusedMember.partners) {
        try {
          const partnerIds = JSON.parse(focusedMember.partners) as string[];
          if (Array.isArray(partnerIds)) {
            partnerIds.forEach(pId => personViewIds.add(pId));
          }
        } catch (e) {
          console.warn(`Failed to parse partners for focusedMember ${focusedMember.id} in PersonView: ${focusedMember.partners}`, e);
        }
      }
      if (focusedMember.spouse) { // Legacy spouse field
        personViewIds.add(focusedMember.spouse);
      }

      // 2. Members who list the focused member as a partner/spouse (reverse lookup)
      allMembers.forEach(member => {
        if (member.id === focusedMember.id) return; // Skip self

        if (member.partners) {
          try {
            const memberPartnerIds = JSON.parse(member.partners) as string[];
            if (Array.isArray(memberPartnerIds) && memberPartnerIds.includes(focusedMember.id)) {
              personViewIds.add(member.id);
            }
           } catch (e) { // Corrected syntax: removed comma, added braces
            console.warn(`Failed to parse partners for member ${member.id} in PersonView reverse lookup: ${member.partners}`, e);
          }
        }
        if (member.spouse === focusedMember.id) { // Legacy spouse field (reverse)
          personViewIds.add(member.id);
        }
      });

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
    // Step 1: In FullTree mode, the collapse filtering should consider all members.
    // The `nonDimmedMemberIds` set will handle the visual focus distinction.
    const membersForCollapseFiltering = allMembers.map(m => ({ ...m, generation: m.generation || 1 }));
    // const membersMapFromInitialSet = new Map(initialSetForFullTree.map(m => [m.id, m])); // Not strictly needed if using allMembers

    // Expanded focus scope for FullTree dimming (this part is for visual styling, not filtering)
    if (focusedMemberId && viewMode === 'FullTree') { // Ensure this applies only in FullTree with focus
      const focusedMember = allMembers.find(m => m.id === focusedMemberId);
      if (focusedMember) {
        nonDimmedMemberIds.add(focusedMember.id);
        // Parents
        focusedMember.parents?.forEach(pId => nonDimmedMemberIds.add(pId));

        // Spouses/Partners
        // 1. Parse focusedMember.partners
        if (focusedMember.partners) {
          try {
            const partnerIds = JSON.parse(focusedMember.partners) as string[];
            if (Array.isArray(partnerIds)) {
              partnerIds.forEach(pId => nonDimmedMemberIds.add(pId));
            }
          } catch (e) {
            console.warn(`Failed to parse partners for focusedMember ${focusedMember.id}: ${focusedMember.partners}`, e);
          }
        }

        // 2. Check other members who might list focusedMember as a partner
        // Also handle legacy spouse field for completeness, though partners is preferred
        allMembers.forEach(member => {
          if (member.id === focusedMember.id) return; // Skip self

          // Check legacy spouse field
          if (member.spouse === focusedMember.id) {
            nonDimmedMemberIds.add(member.id);
          }
          if (focusedMember.spouse === member.id) { // Ensure two-way check for spouse
            nonDimmedMemberIds.add(member.id);
          }

          // Check new partners field
          if (member.partners) {
            try {
              const memberPartnerIds = JSON.parse(member.partners) as string[];
              if (Array.isArray(memberPartnerIds) && memberPartnerIds.includes(focusedMember.id)) {
                nonDimmedMemberIds.add(member.id);
              }
            } catch (e) {
              console.warn(`Failed to parse partners for member ${member.id}: ${member.partners}`, e);
            }
          }
        });

        // Siblings
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

    // Unified collapse logic for FullTree (focused or not focused)
    // This logic determines which nodes are fundamentally hidden due to collapse,
    // not just visually dimmed.
    if (viewMode === 'FullTree') {
      const memberVisibility = new Map<string, boolean>();
      // Iterate based on generation to ensure parent visibility is determined first
      const sortedMembersForCollapse = [...membersForCollapseFiltering].sort((a, b) => (a.generation || 1) - (b.generation || 1));

      for (const member of sortedMembersForCollapse) {
        let isActuallyVisible = true; // Assume visible unless a parent makes it not so
        if (member.parents && member.parents.length > 0) {
          for (const parentId of member.parents) {
            const parentIsVisible = memberVisibility.get(parentId);
            // If any parent is definitively marked as not visible (false), this child is not visible.
            // If a parent is collapsed (and it's not the focused member itself, if applicable), this child is not visible.
            if (parentIsVisible === false ||
                (collapsedStates[parentId] && (!focusedMemberId || parentId !== focusedMemberId))) {
              isActuallyVisible = false;
              break;
            }
          }
        }
        memberVisibility.set(member.id, isActuallyVisible);
      }
      membersAfterCollapseFilter = membersForCollapseFiltering.filter(m => memberVisibility.get(m.id) !== false);

      // Special case: If a focused member itself is marked as collapsed, its direct children should still be hidden.
      // The above loop handles hiding descendants of *other* collapsed nodes.
      // If the focused node itself is collapsed, we need to ensure its children are not in membersAfterCollapseFilter.
      // However, the current logic already implicitly handles this: if focusedMemberId is collapsed, its children's
      // parent (the focusedMemberId) will satisfy `collapsedStates[parentId]`, making them not visible,
      // UNLESS `parentId === focusedMemberId` is true in the condition `collapsedStates[parentId] && (!focusedMemberId || parentId !== focusedMemberId)`.
      // This means if the focused node is collapsed, children are hidden unless it's the focused node. This seems a bit contradictory.
      // Let's refine: If a node is collapsed, its children are hidden, period. The focus only affects dimming.
      // The `memberVisibility.get(parentId) === false` part of the check handles propagation of invisibility.
      // The `collapsedStates[parentId]` part handles direct collapse.

      // The condition `(!focusedMemberId || parentId !== focusedMemberId)` in the loop
      // was intended to prevent the focused member's children from being hidden if the focused member itself was collapsed.
      // This might be counter-intuitive. If a focused member is collapsed, its children should probably also be hidden.
      // Let's simplify the condition inside the loop:
      // if (parentIsVisible === false || collapsedStates[parentId])
      // This means if a parent is collapsed, its children are hidden, regardless of focus.
      // The focused member itself will always be in `displayedMembers` if `focusedMemberId` is set, due to other logic paths,
      // but its children's visibility will correctly depend on its collapsed state.
      // Re-running the visibility check with simpler logic for clarity:
      memberVisibility.clear(); // Reset for the refined logic
      for (const member of sortedMembersForCollapse) {
        let isActuallyVisible = true;
        if (member.parents && member.parents.length > 0) {
          for (const parentId of member.parents) {
            const parentIsVisible = memberVisibility.get(parentId);
            if (parentIsVisible === false || collapsedStates[parentId]) {
              isActuallyVisible = false;
              break;
            }
          }
        }
        memberVisibility.set(member.id, isActuallyVisible);
      }
      membersAfterCollapseFilter = membersForCollapseFiltering.filter(m => memberVisibility.get(m.id) !== false);


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
    // Dimming logic for FullTree mode with a focused member
    if (viewMode === 'FullTree' && focusedMemberId) {
      isDimmed = !nonDimmedMemberIds.has(member.id);
    }
    // For PersonView or LineageView, dimming is not applied here; all displayed nodes are considered "in focus".

    let focusedRelationType: string | null = null;
    // Relation type determination for styling, only if the node isn't dimmed (or not in a view mode that uses dimming)
    if (focusedMemberId && (!isDimmed || viewMode !== 'FullTree')) {
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
    const hasAnyChildren = !!allMembers.some(child => child.parents?.includes(member.id)); // Explicit boolean cast
    
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
            hasChildren: hasAnyChildren,
            canEdit: canEdit,
            onNodeClick: callbacks.onNodeClick,
            onAddChild: callbacks.onAddChild, // Pass it down
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
          nodeXPositionsGlobal.set(node.id, node.position.x); // Store actual X for the primary member of this unit

          let endOfThisUnitX = node.position.x + nodeWidth; // End of the primary member

          if (memberData.spouse && memberData.spouse !== memberData.id) {
            const spouseMemberData = displayedMembers.find(m => m.id === memberData.spouse && (m.generation || 1) === 1);
            if (spouseMemberData) {
              const spouseNode = nodesInCurrentGen.find(n => n.id === spouseMemberData.id);
              if (spouseNode && !processedGen1NodeIds.has(spouseNode.id)) {
                spouseNode.position.x = endOfThisUnitX + siblingSpacing; // Spouse starts after primary member + siblingSpacing
                processedGen1NodeIds.add(spouseNode.id);
                nodeXPositionsGlobal.set(spouseNode.id, spouseNode.position.x); // Store actual X for spouse
                endOfThisUnitX = spouseNode.position.x + nodeWidth; // Update end of unit to be end of spouse
              }
            }
          }
          currentX = endOfThisUnitX + memberSpacing; // Set currentX for the start of the *next* unit
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

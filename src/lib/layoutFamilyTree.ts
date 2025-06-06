import { Node, Edge, Position, MarkerType } from '@xyflow/react';
import { FamilyMember } from '../types/family';
import { getDescendants } from './treeUtils';

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
}

/**
 * Calculates the layout (node positions and edges) for a family tree.
 *
 * @param {FamilyMember[]} allMembers - An array of all family members in the dataset.
 * @param {string} searchQuery - The current search query string to highlight matching members.
 * @param {Record<string, boolean>} collapsedStates - A map of member IDs to their collapsed state (true if collapsed).
 * @param {string | null | undefined} focusedMemberId - The ID of the member currently focused in the tree, or null/undefined if none.
 * @param {LayoutCallbacks} callbacks - An object containing callback functions for node interactions (select, edit, delete, toggle collapse).
 * @param {LayoutConfig} config - An object containing configuration values for layout spacing and node dimensions.
 * @param {boolean} canEdit - A boolean indicating if editing features are enabled for the current user.
 * @returns {{ nodes: Node[]; edges: Edge[] }} An object containing arrays of nodes and edges formatted for React Flow.
 */
export function layoutFamilyTree(
  allMembers: FamilyMember[],
  searchQuery: string,
  collapsedStates: Record<string, boolean>,
  focusedMemberId: string | null | undefined,
  callbacks: LayoutCallbacks,
  config: LayoutConfig,
  canEdit: boolean
): { nodes: Node[]; edges: Edge[] } {

  // --- Initial Member Set Determination ---

  // Step 1: Determine the initial set of members to consider for layout.
  // If a member is focused, `initialSet` includes the focused member and their descendants.
  // Otherwise, it includes all members.
  const initialSet: FamilyMember[] = focusedMemberId && allMembers.find(m => m.id === focusedMemberId)
    ? getDescendants(focusedMemberId, allMembers, 1) // Get descendants if a member is focused
    : allMembers.map(m => ({ ...m })); // Otherwise, use all members

  // Create a map for quick lookup of members within the `initialSet`.
  const membersMapFromInitialSet = new Map(initialSet.map(m => [m.id, m]));

  // Step 2: Filter `initialSet` based on `collapsedStates` to get `finalDisplayedMembers`.
  // This logic traverses up the ancestry of each member in `initialSet`.
  // If any ancestor is collapsed (and is not the focused member itself), the member is hidden.
  let finalDisplayedMembers: FamilyMember[] = [];
  for (const member of initialSet) { 
    let isVisible = true;
    // Start checking from the member's first listed parent.
    let currentAncestorId = member.parents && member.parents.length > 0 ? member.parents[0] : null;
    
    while(currentAncestorId) {
      const ancestor = membersMapFromInitialSet.get(currentAncestorId); 
      if (!ancestor) break; // Stop if ancestor is not in the initial set (shouldn't happen with consistent data)

      // If an ancestor is collapsed, the current member is not visible.
      if (collapsedStates[ancestor.id]) {
        isVisible = false;
        break;
      }
      
      // Stop traversal if the ancestor is the focused member (children of focused member are always shown unless explicitly collapsed).
      if (focusedMemberId && ancestor.id === focusedMemberId) {
        break; 
      }
      // Move to the next ancestor.
      currentAncestorId = ancestor.parents && ancestor.parents.length > 0 ? ancestor.parents[0] : null;
    }
    
    if (isVisible) {
      finalDisplayedMembers.push(member);
    }
  }
  
  // Step 3 (Safeguard): Ensure the focused member is always displayed if `focusedMemberId` is set.
  // This handles cases where the focused member might have been filtered out by a collapsed parent further up the chain.
  if (focusedMemberId) {
      const focusedRootInInitialSet = initialSet.find(m => m.id === focusedMemberId); 
      if (focusedRootInInitialSet && !finalDisplayedMembers.find(m => m.id === focusedMemberId)) {
        // Add the focused member to the beginning of the array if not already present.
        finalDisplayedMembers.unshift(focusedRootInInitialSet); 
      }
  }
  
  // `displayedMembers` will be used for the rest of the layout calculations.
  const displayedMembers = finalDisplayedMembers; 

  // Destructure layout configuration for easier access.
  const { generationSpacing, memberSpacing, nodeWidth, siblingSpacing } = config;

  // --- Node Y-Position Calculation ---
  // Calculate Y position based on generation.
  // let nodeYPositions = new Map<string, number>(); // This variable is unused.
  let currentLayoutNodes: Node[] = displayedMembers.map(member => {
      // Y position is determined by the member's generation, scaled by `generationSpacing`.
      // Default to generation 1 if not specified.
      const yPos = ((member.generation || 1) - 1) * generationSpacing;
      // nodeYPositions.set(member.id, yPos); // Unused

      // Determine if the node should be highlighted based on search query.
      const isHighlighted = searchQuery && member.name.toLowerCase().includes(searchQuery.toLowerCase());
      // Check if the member has any children that are also currently displayed (not collapsed).
      const hasVisibleChildren = displayedMembers.some(child => child.parents?.includes(member.id));
      
      return {
          id: member.id,
          type: 'familyMember', // Custom node type
          position: { x: 0, y: yPos }, // Initial X position is 0, Y is calculated
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
          sourcePosition: Position.Bottom, // For edges originating from this node
          targetPosition: Position.Top,   // For edges terminating at this node
      };
  });

  // Determine the maximum generation number among displayed members.
  const maxGeneration = Math.max(0, ...displayedMembers.map(m => (m.generation || 1))); 
  // `nodeXPositionsGlobal` will store the final X coordinate for each node after all adjustments.
  const nodeXPositionsGlobal = new Map<string, number>();

  // --- Node X-Position Calculation (Iterative per Generation) ---
  for (let g = 1; g <= maxGeneration; g++) {
      // Get all nodes belonging to the current generation `g`.
      let nodesInCurrentGen = currentLayoutNodes.filter(n => (n.data.member.generation || 1) === g); 

      // Stage 1: Initial X for Generation 1 members.
      if (g === 1) {
          // Sort Gen 1 members for consistent layout (e.g., by ID).
          const gen1MembersSorted = displayedMembers.filter(m => (m.generation || 1) === 1).sort((a,b) => a.id.localeCompare(b.id)); 
          const processedGen1NodeIds = new Set<string>(); // Keep track of nodes already positioned.

          if (gen1MembersSorted.length > 0) {
              const firstGen1MemberData = gen1MembersSorted[0];
              const firstNode = nodesInCurrentGen.find(n => n.id === firstGen1MemberData.id);
              if (firstNode) {
                  firstNode.position.x = 0; // Position the first Gen 1 member at X=0.
                  processedGen1NodeIds.add(firstNode.id);
                  // Attempt to position spouse next to the first member if they are also in Gen 1.
                  if (firstGen1MemberData.spouse && firstGen1MemberData.spouse !== firstGen1MemberData.id) {
                      const spouseMemberData = displayedMembers.find(m => m.id === firstGen1MemberData.spouse && (m.generation || 1) === 1); 
                      if (spouseMemberData) {
                          const spouseNode = nodesInCurrentGen.find(n => n.id === spouseMemberData.id);
                          if (spouseNode) {
                              spouseNode.position.x = memberSpacing; // Place spouse to the right.
                              processedGen1NodeIds.add(spouseNode.id);
                          }
                      }
                  }
              }
          }
          // Position any remaining Gen 1 members that weren't part of the initial pair.
          nodesInCurrentGen.forEach(node => {
              if (!processedGen1NodeIds.has(node.id)) {
                  node.position.x = (processedGen1NodeIds.size > 0 ? memberSpacing * processedGen1NodeIds.size : 0); 
                  processedGen1NodeIds.add(node.id); 
              }
          });
      } else { 
          // Stage 2: Parent-based X for subsequent generations.
          // Position nodes based on the average X coordinate of their parents.
          nodesInCurrentGen.forEach(node => {
              const member = node.data.member as FamilyMember;
              let calculatedX = 0;
              if (member.parents && member.parents.length > 0) {
                  const parentXCoords = member.parents
                      .map(parentId => nodeXPositionsGlobal.get(parentId)) // Get X of parents from previous generation's layout
                      .filter(x => x !== undefined) as number[];
                  if (parentXCoords.length > 0) {
                      calculatedX = parentXCoords.reduce((sum, xVal) => sum + xVal, 0) / parentXCoords.length;
                  }
              }
              node.position.x = calculatedX;
          });
      }

      // Stage 3: Sibling adjustment within the current generation.
      // Group children by their parent(s) to identify sibling groups.
      const childrenByParentKeyInCurrentGen = new Map<string, Node[]>();
      nodesInCurrentGen.forEach(node => {
          const member = node.data.member as FamilyMember;
          // Create a consistent key for parents (sorted IDs) or use node ID if no parents (e.g., for Gen 1 spouses not linked by parentage).
          const parentKey = member.parents && member.parents.length > 0 ? member.parents.sort().join('-') : node.id; 
          if (!childrenByParentKeyInCurrentGen.has(parentKey)) {
              childrenByParentKeyInCurrentGen.set(parentKey, []);
          }
          childrenByParentKeyInCurrentGen.get(parentKey)!.push(node);
      });

      // Adjust X positions for sibling groups to prevent overlap and distribute them.
      childrenByParentKeyInCurrentGen.forEach(siblingGroup => {
          if (siblingGroup.length > 1) {
              // Initial group center is based on the first sibling's parent-derived X.
              const groupCenterX = siblingGroup[0].position.x; 
              // Sort siblings by their current X position for consistent ordering.
              siblingGroup.sort((a, b) => (nodeXPositionsGlobal.get(a.id) ?? a.position.x) - (nodeXPositionsGlobal.get(b.id) ?? b.position.x)); 
              const totalSiblingWidth = (siblingGroup.length * nodeWidth) + ((siblingGroup.length - 1) * siblingSpacing);
              const startX = groupCenterX - (totalSiblingWidth / 2) + (nodeWidth / 2); // Calculate starting X for the group.
              // Distribute siblings horizontally.
              siblingGroup.forEach((node, index) => {
                  node.position.x = startX + (index * (nodeWidth + siblingSpacing));
              });
          }
      });
      
      // Store the calculated X positions for the current generation to be used by the next.
      nodesInCurrentGen.forEach(node => {
          nodeXPositionsGlobal.set(node.id, node.position.x);
      });
  }
  
  // --- Edge Creation ---
  const familyEdges: Edge[] = [];
  const displayedMemberIds = new Set(displayedMembers.map(m => m.id)); // Set for efficient lookup.
  displayedMembers.forEach(member => {
      if (member.parents && Array.isArray(member.parents)) {
          member.parents.forEach(parentId => {
              // Create an edge only if both parent and child are currently displayed.
              if (parentId && displayedMemberIds.has(parentId) && displayedMemberIds.has(member.id)) { 
                  familyEdges.push({
                      id: `edge-${parentId}-to-${member.id}`,
                      source: parentId,
                      target: member.id,
                      type: 'smoothstep', // Type of edge path
                      animated: true,     // Animate the edge
                      markerEnd: { type: MarkerType.ArrowClosed, color: '#059669', width: 22, height: 22 }, // Arrowhead style
                      style: { stroke: '#059669', strokeWidth: 3, strokeLinecap: 'round', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'}, // Edge style
                      pathOptions: { borderRadius: 30 }, // Edge path options
                  });
              }
          });
      }
  });

  // --- Viewport Centering Logic ---
  // Adjust all node X positions to center the tree (or the root generation) in the viewport.
  let centeredNodes = currentLayoutNodes; 
  if (currentLayoutNodes.length > 0) {
      // Calculate the horizontal extent of the current layout.
      // const allXPositions = currentLayoutNodes.map(n => n.position.x); // This variable is unused.
      // const minX = Math.min(...allXPositions); // Not directly used for centering but useful for understanding spread
      // const maxX = Math.max(...currentLayoutNodes.map(n => n.position.x + nodeWidth)); // Not directly used
      
      // Determine the center of the root generation (or all nodes if no distinct root generation).
      const rootNodes = currentLayoutNodes.filter(n => (n.data.member.generation || 1) === 1); 
      let rootGenCenterX = 0;
      if (rootNodes.length > 0) {
          rootGenCenterX = rootNodes.reduce((acc, n) => acc + n.position.x, 0) / rootNodes.length;
      } else if (currentLayoutNodes.length > 0) { 
          // Fallback if no generation 1 nodes (e.g., focused on a later generation without ancestors displayed).
          rootGenCenterX = currentLayoutNodes.reduce((acc, n) => acc + n.position.x, 0) / currentLayoutNodes.length;
      }

      // Assuming client-side execution for window.innerWidth.
      // This might need to be passed as a parameter if server-side rendering or if window is not guaranteed.
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000; // Default viewport width if window is undefined.
      // Calculate the shift needed to center the root generation's center (plus half a node width) in the viewport.
      const finalGlobalShiftX = (viewportWidth / 2) - (rootGenCenterX + nodeWidth / 2); 

      // Apply the calculated shift to all nodes.
      centeredNodes = currentLayoutNodes.map(node => ({
          ...node,
          position: {
              ...node.position,
              x: node.position.x + finalGlobalShiftX,
          },
      }));
  }

  // Final mapping for React Flow, primarily to ensure no stale data if nodes were mutated directly before this.
  const finalNodesForReactFlow = centeredNodes.map(node => {
      return { 
          ...node,
      };
  });
  
  return { nodes: finalNodesForReactFlow, edges: familyEdges };
}

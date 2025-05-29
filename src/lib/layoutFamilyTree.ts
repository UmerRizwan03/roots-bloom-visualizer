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
  config: LayoutConfig
): { nodes: Node[]; edges: Edge[] } {
  
  // --- Start of logic moved from FamilyTree.tsx's useEffect ---

  // Step 1: Determine initialSet.
  // (getDescendants is assumed to be imported and available)
  const initialSet: FamilyMember[] = focusedMemberId && allMembers.find(m => m.id === focusedMemberId)
    ? getDescendants(focusedMemberId, allMembers, 1)
    : allMembers.map(m => ({ ...m })); 

  // Create membersMapFromInitialSet (can be internal, no need for useMemo here as it's part of a single function execution)
  const membersMapFromInitialSet = new Map(initialSet.map(m => [m.id, m]));

  // Step 2: Filter initialSet based on collapsedStates to get finalDisplayedMembers.
  let finalDisplayedMembers: FamilyMember[] = [];
  for (const member of initialSet) { 
    let isVisible = true;
    let currentAncestorId = member.parents && member.parents.length > 0 ? member.parents[0] : null;
    
    while(currentAncestorId) {
      const ancestor = membersMapFromInitialSet.get(currentAncestorId); 
      if (!ancestor) break; 

      if (collapsedStates[ancestor.id]) {
        isVisible = false;
        break;
      }
      
      if (focusedMemberId && ancestor.id === focusedMemberId) {
        break; 
      }
      currentAncestorId = ancestor.parents && ancestor.parents.length > 0 ? ancestor.parents[0] : null;
    }
    
    if (isVisible) {
      finalDisplayedMembers.push(member);
    }
  }
  
  // Step 3 (Safeguard): If focusedMemberId is set, ensure the focused member itself is always in finalDisplayedMembers.
  if (focusedMemberId) {
      const focusedRootInInitialSet = initialSet.find(m => m.id === focusedMemberId); 
      if (focusedRootInInitialSet && !finalDisplayedMembers.find(m => m.id === focusedMemberId)) {
        finalDisplayedMembers.unshift(focusedRootInInitialSet); 
      }
  }
  
  const displayedMembers = finalDisplayedMembers; 

  // Use config values
  const { generationSpacing, memberSpacing, nodeWidth, siblingSpacing } = config;

  const nodeYPositions = new Map<string, number>();
  let currentLayoutNodes: Node[] = displayedMembers.map(member => {
      const yPos = ((member.generation || 1) - 1) * generationSpacing;
      nodeYPositions.set(member.id, yPos);
      const isHighlighted = searchQuery && member.name.toLowerCase().includes(searchQuery.toLowerCase());
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
              hasChildren: hasVisibleChildren
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
      };
  });

  const maxGeneration = Math.max(0, ...displayedMembers.map(m => (m.generation || 1))); 
  const nodeXPositionsGlobal = new Map<string, number>();

  for (let g = 1; g <= maxGeneration; g++) {
      let nodesInCurrentGen = currentLayoutNodes.filter(n => (n.data.member.generation || 1) === g); 
      if (g === 1) {
          const gen1MembersSorted = displayedMembers.filter(m => (m.generation || 1) === 1).sort((a,b) => a.id.localeCompare(b.id)); 
          const processedGen1NodeIds = new Set<string>();
          if (gen1MembersSorted.length > 0) {
              const firstGen1MemberData = gen1MembersSorted[0];
              const firstNode = nodesInCurrentGen.find(n => n.id === firstGen1MemberData.id);
              if (firstNode) {
                  firstNode.position.x = 0;
                  processedGen1NodeIds.add(firstNode.id);
                  if (firstGen1MemberData.spouse && firstGen1MemberData.spouse !== firstGen1MemberData.id) {
                      const spouseMemberData = displayedMembers.find(m => m.id === firstGen1MemberData.spouse && (m.generation || 1) === 1); 
                      if (spouseMemberData) {
                          const spouseNode = nodesInCurrentGen.find(n => n.id === spouseMemberData.id);
                          if (spouseNode) {
                              spouseNode.position.x = memberSpacing;
                              processedGen1NodeIds.add(spouseNode.id);
                          }
                      }
                  }
              }
          }
          nodesInCurrentGen.forEach(node => {
              if (!processedGen1NodeIds.has(node.id)) {
                  node.position.x = (processedGen1NodeIds.size > 0 ? memberSpacing * processedGen1NodeIds.size : 0); 
                  processedGen1NodeIds.add(node.id); 
              }
          });
      } else { 
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
              node.position.x = calculatedX;
          });
      }

      const childrenByParentKeyInCurrentGen = new Map<string, Node[]>();
      nodesInCurrentGen.forEach(node => {
          const member = node.data.member as FamilyMember;
          const parentKey = member.parents && member.parents.length > 0 ? member.parents.sort().join('-') : node.id; 
          if (!childrenByParentKeyInCurrentGen.has(parentKey)) {
              childrenByParentKeyInCurrentGen.set(parentKey, []);
          }
          childrenByParentKeyInCurrentGen.get(parentKey)!.push(node);
      });

      childrenByParentKeyInCurrentGen.forEach(siblingGroup => {
          if (siblingGroup.length > 1) {
              const groupCenterX = siblingGroup[0].position.x; 
              siblingGroup.sort((a, b) => (nodeXPositionsGlobal.get(a.id) ?? a.position.x) - (nodeXPositionsGlobal.get(b.id) ?? b.position.x)); 
              const totalSiblingWidth = (siblingGroup.length * nodeWidth) + ((siblingGroup.length - 1) * siblingSpacing);
              const startX = groupCenterX - (totalSiblingWidth / 2) + (nodeWidth / 2); 
              siblingGroup.forEach((node, index) => {
                  node.position.x = startX + (index * (nodeWidth + siblingSpacing));
              });
          }
      });
      
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
                      type: 'smoothstep', 
                      animated: true,
                      markerEnd: { type: MarkerType.ArrowClosed, color: '#059669', width: 22, height: 22 },
                      style: { stroke: '#059669', strokeWidth: 3, strokeLinecap: 'round', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'},
                      pathOptions: { borderRadius: 30 }, 
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

      // This viewportWidth calculation might need to be passed in if window is not available in this context (e.g. SSR)
      // For now, assuming client-side execution.
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1000; 
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

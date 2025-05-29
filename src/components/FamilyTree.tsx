import React, { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FamilyMember } from '../types/family';
import FamilyMemberNode from './FamilyMemberNode';

interface FamilyTreeProps {
  members: FamilyMember[];
  onMemberSelect: (member: FamilyMember) => void;
  searchQuery: string;
  onSetEditingMember: (member: FamilyMember) => void;
  onDeleteMember: (memberId: string) => void;
}

const nodeTypes = {
  familyMember: FamilyMemberNode,
};

const FamilyTree: React.FC<FamilyTreeProps> = ({ members, onMemberSelect, searchQuery, onSetEditingMember, onDeleteMember }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  useEffect(() => {
    // --- Overall Constants ---
    const generationSpacing = 320;
    const memberSpacing = 280; // For spouses in Gen 1 or other direct horizontal spacing needs
    const nodeWidth = 208;
    const siblingSpacing = 30;
    const minParentPadding = 20;
    const minFamilyBlockSpacing = 50;

    // ------ START: New Step 1 - Correct X-Coordinate Calculation and Propagation ------
    // A. Initialization
    const nodeYPositions = new Map<string, number>(); // Only for Y, X is handled iteratively
    let currentLayoutNodes: Node[] = members.map(member => {
        const yPos = (member.generation - 1) * generationSpacing;
        nodeYPositions.set(member.id, yPos);
        const isHighlighted = searchQuery && member.name.toLowerCase().includes(searchQuery.toLowerCase());
        return {
            id: member.id,
            type: 'familyMember',
            position: { x: 0, y: yPos }, // Initial X for all nodes is 0
            data: { // Callbacks will be refreshed at the very end
                member,
                onSelect: () => {}, 
                onEdit: () => {},
                onDelete: () => {},
                isHighlighted
            },
            sourcePosition: Position.Bottom,
            targetPosition: Position.Top,
        };
    });
    const maxGeneration = Math.max(0, ...members.map(m => m.generation));
    
    // This map stores the finalized X positions for nodes as each generation is processed.
    // It's crucial for subsequent generations to correctly position children under their parents.
    const nodeXPositionsGlobal = new Map<string, number>();

    // B. Iterative Processing by Generation
    for (let g = 1; g <= maxGeneration; g++) {
        let nodesInCurrentGen = currentLayoutNodes.filter(n => n.data.member.generation === g);

        // B1. Initial X for Nodes in Current Generation g
        if (g === 1) {
            const gen1MembersSorted = members.filter(m => m.generation === 1).sort((a,b) => a.id.localeCompare(b.id));
            const processedGen1NodeIds = new Set<string>();

            if (gen1MembersSorted.length > 0) {
                const firstGen1MemberData = gen1MembersSorted[0];
                const firstNode = nodesInCurrentGen.find(n => n.id === firstGen1MemberData.id);
                if (firstNode) {
                    firstNode.position.x = 0;
                    processedGen1NodeIds.add(firstNode.id);

                    if (firstGen1MemberData.spouse) {
                        const spouseMemberData = members.find(m => m.id === firstGen1MemberData.spouse && m.generation === 1);
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
            nodesInCurrentGen.forEach(node => { // Ensure all Gen 1 nodes get an X
                if (!processedGen1NodeIds.has(node.id)) {
                    node.position.x = 0; // Default for other Gen 1 nodes
                }
            });
        } else { // g > 1
            nodesInCurrentGen.forEach(node => {
                const member = node.data.member as FamilyMember;
                let calculatedX = 0;
                if (member.parents && member.parents.length > 0) {
                    const parentXCoords = member.parents
                        .map(parentId => nodeXPositionsGlobal.get(parentId)) // Use finalized X from previous generations
                        .filter(x => x !== undefined) as number[];
                    if (parentXCoords.length > 0) {
                        calculatedX = parentXCoords.reduce((sum, xVal) => sum + xVal, 0) / parentXCoords.length;
                    }
                }
                node.position.x = calculatedX;
            });
        }

        // B2. Sibling Spacing for Nodes in Current Generation g
        const childrenByParentKeyInCurrentGen = new Map<string, Node[]>();
        nodesInCurrentGen.forEach(node => {
            const member = node.data.member as FamilyMember;
            const parentKey = member.parents && member.parents.length > 0 ? member.parents.sort().join('-') : node.id; // Key by parent IDs or self if no parents
            if (!childrenByParentKeyInCurrentGen.has(parentKey)) {
                childrenByParentKeyInCurrentGen.set(parentKey, []);
            }
            childrenByParentKeyInCurrentGen.get(parentKey)!.push(node);
        });

        childrenByParentKeyInCurrentGen.forEach(siblingGroup => {
            if (siblingGroup.length > 1) {
                const groupCenterX = siblingGroup[0].position.x; 
                siblingGroup.sort((a, b) => a.id.localeCompare(b.id));

                const totalSiblingWidth = (siblingGroup.length * nodeWidth) + ((siblingGroup.length - 1) * siblingSpacing);
                const startX = groupCenterX - (totalSiblingWidth / 2) + (nodeWidth / 2);
                
                siblingGroup.forEach((node, index) => {
                    node.position.x = startX + (index * (nodeWidth + siblingSpacing));
                });
            }
        });
        
        // Update nodeXPositionsGlobal with finalized X for this generation's nodes
        nodesInCurrentGen.forEach(node => {
            nodeXPositionsGlobal.set(node.id, node.position.x);
        });
    }
    // ------ END: New Step 1 ------
    
    // --- LOGGING POINT 1: After NEW Initial Positioning and Iterative Sibling Spacing ---
    console.log("LOG: STAGE 1 - After NEW initial positioning & iterative sibling spacing (currentLayoutNodes):");
    currentLayoutNodes.forEach(n => {
      console.log(`  Node ${n.id} (${n.data.member.name}): x=${n.position.x.toFixed(2)}, y=${n.position.y}, gen=${n.data.member.generation}, parents=${n.data.member.parents ? n.data.member.parents.join(',') : 'N/A'}`);
    });
    console.log("LOG: STAGE 1 - FINAL nodeXPositionsGlobal after iterative layout:", JSON.stringify(Array.from(nodeXPositionsGlobal.entries()).map(([id, x]) => [id, x ? x.toFixed(2) : '0.00'])));
    // --- END LOGGING POINT 1 ---

    // C. adjustedNodes Preparation (Deep copy for subsequent mutable stages)
    let adjustedNodes: Node[] = JSON.parse(JSON.stringify(currentLayoutNodes));

    // D. nodeXPositions Map Update (Reflects final positions from Step 1, for use in Dynamic Parent Spacing if it looks up parent X)
    // Note: nodeXPositionsGlobal already holds these values. This is more for ensuring the named map is the one used downstream if code expects 'nodeXPositions'.
    // For clarity, downstream logic (Dynamic Parent Spacing) will use nodeXPositionsGlobal.
    // const nodeXPositions = new Map<string, number>(nodeXPositionsGlobal); // Make a copy if downstream modifies it, or pass nodeXPositionsGlobal

    // --- STAGE 2 LOGIC (Original Part A Sibling Spacing) IS NOW PART OF THE ITERATIVE STEP 1 (B2) ---
    // console.log("LOG: STAGE 2 - Sibling Spacing (Iterative, completed in STAGE 1 B2)");
    // adjustedNodes.forEach(n => {
    //   if (n.data.member.generation <= maxGeneration) { // Only log nodes processed by B2
    //      console.log(`  Node ${n.id} (${n.data.member.name}): x=${n.position.x.toFixed(2)} (gen ${n.data.member.generation})`);
    //   }
    // });
    // --- END LOGGING POINT 2 ---

    // Build childrenByParents map for Dynamic Parent Spacing & Family Block construction
    // This map uses original member data for relationships but will operate on 'adjustedNodes'
    const childrenByParents = new Map<string, string[]>();
    members.forEach(member => { 
      if (member.parents && member.parents.length > 0) {
        const parentKey = member.parents.sort().join('-');
        if (!childrenByParents.has(parentKey)) {
          childrenByParents.set(parentKey, []);
        }
        childrenByParents.get(parentKey)!.push(member.id);
      }
    });

    // Dynamic Parent Spacing
    childrenByParents.forEach((childNodeIds, parentKey) => {
        const parentIdsFromKey = parentKey.split('-');
        if (parentIdsFromKey.length === 2) { 
            const parent1Id = parentIdsFromKey[0];
            const parent2Id = parentIdsFromKey[1];

            const parent1Node = adjustedNodes.find(n => n.id === parent1Id);
            const parent2Node = adjustedNodes.find(n => n.id === parent2Id);

            if (parent1Node && parent2Node) {
                const currentParentSeparation = Math.abs(parent1Node.position.x - parent2Node.position.x);
                const currentChildrenBlockWidth = (childNodeIds.length * nodeWidth) + ((childNodeIds.length - 1) * siblingSpacing);
                const desiredParentSeparation = currentChildrenBlockWidth + (2 * minParentPadding) + nodeWidth; 
              
                // --- LOGGING POINT 3: During Dynamic Parent Spacing ---
                console.log(`LOG: STAGE 3 - DynamicParentSpacing for ${parent1Node.id}(gen ${parent1Node.data.member.generation})-${parent2Node.id}(gen ${parent2Node.data.member.generation}): currentSep=${currentParentSeparation.toFixed(2)}, childWidth=${currentChildrenBlockWidth.toFixed(2)}, desiredSep=${desiredParentSeparation.toFixed(2)}`);
                // --- END LOGGING POINT 3 ---

                if (currentParentSeparation < desiredParentSeparation && desiredParentSeparation > 0) {
                    const shiftNeeded = (desiredParentSeparation - currentParentSeparation) / 2;
                    
                    const leftParent = parent1Node.position.x < parent2Node.position.x ? parent1Node : parent2Node;
                    const rightParent = parent1Node.position.x < parent2Node.position.x ? parent2Node : parent1Node;

                    leftParent.position.x -= shiftNeeded;
                    rightParent.position.x += shiftNeeded;

                    nodeXPositionsGlobal.set(leftParent.id, leftParent.position.x); 
                    nodeXPositionsGlobal.set(rightParent.id, rightParent.position.x);

                    const newParentMidpointX = (leftParent.position.x + rightParent.position.x) / 2;
                    const startX_for_children = newParentMidpointX - (currentChildrenBlockWidth / 2) + (nodeWidth / 2);

                    // --- LOGGING POINT 3: During Dynamic Parent Spacing - If shifted ---
                    console.log(`  Parents shifted by ${shiftNeeded.toFixed(2)}. New P1(${leftParent.id}) X=${leftParent.position.x.toFixed(2)}, P2(${rightParent.id}) X=${rightParent.position.x.toFixed(2)}. New Midpoint=${newParentMidpointX.toFixed(2)}`);
                    console.log(`  Children (parentKey ${parentKey}) re-centered. New startX=${startX_for_children.toFixed(2)}`);
                    // --- END LOGGING POINT 3 ---
                    
                    const sortedChildNodeIdsForDPS = [...childNodeIds].sort(); 
                    sortedChildNodeIdsForDPS.forEach((childId, index) => {
                        const node = adjustedNodes.find(n => n.id === childId);
                        if (node) {
                            node.position.x = startX_for_children + (index * (nodeWidth + siblingSpacing));
                        }
                    });
                }
            }
        }
    });

    // Part B: Collision Avoidance for Family Blocks
    interface FamilyBlock {
      generation: number;
      parentKey: string; 
      minX: number;
      maxX: number;
      nodeIdsInBlock: string[]; 
    }
    let familyBlocks: FamilyBlock[] = [];
    const processedChildIds = new Set<string>();

    childrenByParents.forEach((childNodeIds, parentKey) => {
      const childNodesFromAdj = adjustedNodes.filter(n => childNodeIds.includes(n.id));
      if (childNodesFromAdj.length === 0) return;

      let minX = Infinity;
      let maxX = -Infinity;
      childNodesFromAdj.forEach(node => {
        minX = Math.min(minX, node.position.x);
        maxX = Math.max(maxX, node.position.x + nodeWidth);
        processedChildIds.add(node.id);
      });
      
      familyBlocks.push({
        generation: (childNodesFromAdj[0].data.member as FamilyMember).generation,
        parentKey: parentKey,
        minX: minX,
        maxX: maxX,
        nodeIdsInBlock: childNodeIds,
      });
    });

    adjustedNodes.forEach(node => {
      if (!processedChildIds.has(node.id)) {
        familyBlocks.push({
          generation: (node.data.member as FamilyMember).generation,
          parentKey: node.id, 
          minX: node.position.x,
          maxX: node.position.x + nodeWidth,
          nodeIdsInBlock: [node.id],
        });
      }
    });
    
    const blocksByGeneration = new Map<number, FamilyBlock[]>();
    familyBlocks.forEach(block => {
      if (!blocksByGeneration.has(block.generation)) {
        blocksByGeneration.set(block.generation, []);
      }
      blocksByGeneration.get(block.generation)!.push(block);
    });

    blocksByGeneration.forEach((currentGenerationBlocks, generationNumber) => {
      if (currentGenerationBlocks.length < 2) return;

      // --- LOGGING POINT 4: During Family Block Collision Avoidance (Part B) - Generation ---
      console.log(`LOG: STAGE 4 - Collision Avoidance for Generation ${generationNumber}:`);
      currentGenerationBlocks.forEach(block => {
        console.log(`  Block ${block.parentKey || block.nodeIdsInBlock[0]}: minX=${block.minX.toFixed(2)}, maxX=${block.maxX.toFixed(2)}, nodes=${block.nodeIdsInBlock.join(',')}`);
      });
      // --- END LOGGING POINT 4 ---

      currentGenerationBlocks.sort((a, b) => a.minX - b.minX);

      for (let i = 0; i < currentGenerationBlocks.length - 1; i++) {
        const blockA = currentGenerationBlocks[i];
        const blockB = currentGenerationBlocks[i + 1];

        if (blockA.maxX + minFamilyBlockSpacing > blockB.minX) {
          const shiftAmount = (blockA.maxX + minFamilyBlockSpacing) - blockB.minX;
          // --- LOGGING POINT 4: During Family Block Collision Avoidance (Part B) - Shift ---
          console.log(`  Shifting block ${blockB.parentKey || blockB.nodeIdsInBlock[0]} and subsequent by ${shiftAmount.toFixed(2)} because blockA ${blockA.parentKey || blockA.nodeIdsInBlock[0]} (maxX ${blockA.maxX.toFixed(2)}) collided with blockB (minX ${blockB.minX.toFixed(2)})`);
          // --- END LOGGING POINT 4 ---
          for (let j = i + 1; j < currentGenerationBlocks.length; j++) {
            const blockToShift = currentGenerationBlocks[j];
            blockToShift.nodeIdsInBlock.forEach(nodeId => {
              const node = adjustedNodes.find(n => n.id === nodeId);
              if (node) {
                node.position.x += shiftAmount;
              }
            });
            blockToShift.minX += shiftAmount;
            blockToShift.maxX += shiftAmount;
          }
        }
      }
    });

    // Create edges dynamically from members' parents field
    const familyEdges: Edge[] = [];
    const memberIds = new Set(members.map(m => m.id)); 

    members.forEach(member => {
      if (member.parents && Array.isArray(member.parents)) {
        member.parents.forEach(parentId => {
          if (parentId && memberIds.has(parentId) && memberIds.has(member.id)) {
            familyEdges.push({
              id: `edge-${parentId}-to-${member.id}`,
              source: parentId,
              target: member.id,
              type: 'bezier', 
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#059669', 
                width: 22,
                height: 22,
              },
              style: {
                stroke: '#059669', 
                strokeWidth: 3,
                strokeLinecap: 'round' as const,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
              },
              pathOptions: { 
                borderRadius: 30,
              },
            });
          }
        });
      }
    });

    // Global X Offset for Centering
    let centeredNodes = adjustedNodes; 
    if (adjustedNodes.length > 0) {
      const allXPositions = adjustedNodes.map(n => n.position.x);
      const minX = Math.min(...allXPositions);
      const maxX = Math.max(...adjustedNodes.map(n => n.position.x + nodeWidth)); 
      const treeContentCenterX = (minX + maxX) / 2;
      const globalShiftX = -treeContentCenterX;

      // --- LOGGING POINT 5: After Global X Offset for Centering ---
      console.log(`LOG: STAGE 5 - Global Centering: treeMinX=${minX.toFixed(2)}, treeMaxX=${maxX.toFixed(2)}, treeContentCenterX=${treeContentCenterX.toFixed(2)}, globalShiftX=${globalShiftX.toFixed(2)}`);
      // --- END LOGGING POINT 5 ---

      centeredNodes = adjustedNodes.map(node => ({
        ...node,
        position: { ...node.position, x: node.position.x + globalShiftX },
      }));
      
      // --- LOGGING POINT 5: After Global X Offset for Centering - Sample ---
      console.log("Nodes after global centering (sample):", JSON.stringify(centeredNodes.slice(0, 10).map(n => ({id: n.id, x: n.position.x.toFixed(2), gen: n.data.member.generation }))));
      // --- END LOGGING POINT 5 ---
    }

    // Re-map nodes to ensure fresh function references in their data object
    const nodesWithFreshData = centeredNodes.map(node => ({
      ...node,
      data: {
        ...node.data, 
        onSelect: onMemberSelect,    
        onEdit: onSetEditingMember,   
        onDelete: onDeleteMember,   
      }
    }));
    
    setNodes(nodesWithFreshData); 
    setEdges(familyEdges);
  }, [members, onMemberSelect, searchQuery, onSetEditingMember, onDeleteMember]);

  return (
    <div className="w-full h-screen relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        // fitViewOptions={{
        //   padding: 0.2,
        //   includeHiddenNodes: false,
        // }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        minZoom={0.1}
        maxZoom={1.5}
        style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f7fee7 100%)' }}
      >
        <Controls 
          position="top-right"
          className="!bg-white/90 !backdrop-blur-sm !border !border-emerald-200 !shadow-xl !rounded-xl"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderColor: '#a7f3d0',
            color: '#065f46',
          }}
        />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === 'generationAdd') return '#10b981';
            const member = (node.data as any).member as FamilyMember;
            return member?.gender === 'male' ? '#3b82f6' : '#ec4899';
          }}
          className="!bg-white/90 !backdrop-blur-sm !border !border-emerald-200 !shadow-xl !rounded-xl !overflow-hidden"
          position="bottom-right"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
          }}
        />
        <Background 
          variant={BackgroundVariant.Dots}
          gap={40} 
          size={2} 
          color="#a7f3d0"
          style={{
            opacity: 0.3,
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default FamilyTree;

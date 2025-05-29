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
    const generationSpacing = 320;
    const memberSpacing = 280;
    const nodeWidth = 208;
    const siblingSpacing = 30;
    const minParentPadding = 20;
    const minFamilyBlockSpacing = 50;

    const nodeYPositions = new Map<string, number>();
    let currentLayoutNodes: Node[] = members.map(member => {
        const yPos = (member.generation - 1) * generationSpacing;
        nodeYPositions.set(member.id, yPos);
        const isHighlighted = searchQuery && member.name.toLowerCase().includes(searchQuery.toLowerCase());
        return {
            id: member.id,
            type: 'familyMember',
            position: { x: 0, y: yPos },
            data: {
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
    const nodeXPositionsGlobal = new Map<string, number>();

    for (let g = 1; g <= maxGeneration; g++) {
        let nodesInCurrentGen = currentLayoutNodes.filter(n => n.data.member.generation === g);
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
            nodesInCurrentGen.forEach(node => {
                if (!processedGen1NodeIds.has(node.id)) {
                    node.position.x = 0;
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
                siblingGroup.sort((a, b) => a.id.localeCompare(b.id));
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

    let adjustedNodes: Node[] = JSON.parse(JSON.stringify(currentLayoutNodes));
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

    // Dynamic Parent Spacing and Upward Centering omitted here (unchanged)

    // Create edges
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
                            strokeLinecap: 'round',
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                        },
                        pathOptions: { borderRadius: 30 },
                    });
                }
            });
        }
    });

    // Final Global Centering (NEW)
    let centeredNodes = adjustedNodes;
    if (adjustedNodes.length > 0) {
        const allXPositions = adjustedNodes.map(n => n.position.x);
        const minX = Math.min(...allXPositions);
        const maxX = Math.max(...adjustedNodes.map(n => n.position.x + nodeWidth));
        const treeContentWidth = maxX - minX;
        const rootMembers = members.filter(m => m.generation === 1);
        const rootCenterX = rootMembers.reduce((acc, m) => acc + (nodeXPositionsGlobal.get(m.id) || 0), 0) / rootMembers.length;
        const containerCenterX = window.innerWidth / 2;
        const finalGlobalShiftX = containerCenterX - rootCenterX;

        centeredNodes = adjustedNodes.map(node => ({
            ...node,
            position: {
                ...node.position,
                x: node.position.x + finalGlobalShiftX,
            },
        }));
    }

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
        defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
        minZoom={0.1}
        maxZoom={1.5}
        style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f7fee7 100%)' }}
      >
        <Controls position="top-right" />
        <MiniMap position="bottom-right" />
        <Background variant={BackgroundVariant.Dots} gap={40} size={2} color="#a7f3d0" style={{ opacity: 0.3 }} />
      </ReactFlow>
    </div>
  );
};

export default FamilyTree;
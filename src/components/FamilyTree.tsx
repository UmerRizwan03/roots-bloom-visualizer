
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
import { familyMembers, familyConnections } from '../data/familyData';
import { FamilyMember } from '../types/family';
import FamilyMemberNode from './FamilyMemberNode';
import AddMemberForm from './AddMemberForm';
import EditMemberForm from './EditMemberForm';
import { Plus } from 'lucide-react';

interface FamilyTreeProps {
  onMemberSelect: (member: FamilyMember) => void;
  searchQuery: string;
}

const nodeTypes = {
  familyMember: FamilyMemberNode,
};

const FamilyTree: React.FC<FamilyTreeProps> = ({ onMemberSelect, searchQuery }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>(familyMembers);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleAddMember = (newMember: FamilyMember) => {
    setMembers(prev => [...prev, newMember]);
    setShowAddForm(false);
  };

  const handleEditMember = (updatedMember: FamilyMember) => {
    setMembers(prev => prev.map(member => 
      member.id === updatedMember.id ? updatedMember : member
    ));
    setEditingMember(null);
  };

  const handleDeleteMember = (memberId: string) => {
    setMembers(prev => prev.filter(member => member.id !== memberId));
  };

  useEffect(() => {
    // Increased spacing for better visual separation
    const generationSpacing = 280;
    const memberSpacing = 260;
    const generationCounts = new Map();
    
    // Count members per generation
    members.forEach(member => {
      const count = generationCounts.get(member.generation) || 0;
      generationCounts.set(member.generation, count + 1);
    });

    // Position members by generation
    const generationPositions = new Map();
    members.forEach(member => {
      if (!generationPositions.has(member.generation)) {
        generationPositions.set(member.generation, 0);
      }
    });

    const familyNodes: Node[] = members.map((member) => {
      const generationIndex = member.generation - 1;
      const positionInGeneration = generationPositions.get(member.generation);
      const generationSize = generationCounts.get(member.generation);
      
      generationPositions.set(member.generation, positionInGeneration + 1);
      
      const x = (positionInGeneration - (generationSize - 1) / 2) * memberSpacing;
      const y = generationIndex * generationSpacing;

      const isHighlighted = searchQuery && 
        member.name.toLowerCase().includes(searchQuery.toLowerCase());

      return {
        id: member.id,
        type: 'familyMember',
        position: { x, y },
        data: { 
          member,
          onSelect: onMemberSelect,
          onEdit: setEditingMember,
          onDelete: handleDeleteMember,
          isHighlighted
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };
    });

    // Create edges with modern styling
    const familyEdges: Edge[] = familyConnections
      .filter(connection => 
        members.some(m => m.id === connection.source) && 
        members.some(m => m.id === connection.target)
      )
      .map((connection) => ({
        id: connection.id,
        source: connection.source,
        target: connection.target,
        type: connection.type === 'spouse' ? 'straight' : 'smoothstep',
        style: {
          stroke: connection.type === 'spouse' ? '#f59e0b' : '#64748b',
          strokeWidth: connection.type === 'spouse' ? 3 : 2,
          strokeDasharray: connection.type === 'spouse' ? '5,5' : undefined,
        },
        animated: connection.type === 'parent',
        markerEnd: connection.type === 'parent' ? {
          type: MarkerType.ArrowClosed,
          color: '#64748b',
          width: 20,
          height: 20,
        } : undefined,
      }));

    setNodes(familyNodes);
    setEdges(familyEdges);
  }, [onMemberSelect, searchQuery, members]);

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{
          padding: 0.3,
          includeHiddenNodes: false,
        }}
        defaultViewport={{ x: 0, y: 0, zoom: 0.6 }}
        minZoom={0.1}
        maxZoom={1.5}
        style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}
      >
        <Controls 
          position="top-right"
          className="!bg-white/90 !backdrop-blur-sm !border !border-slate-200 !shadow-xl !rounded-xl"
          style={{
            backgroundColor: 'white',
            borderBottom: '1px solid #e2e8f0',
            color: '#475569',
          }}
        />
        <MiniMap 
          nodeColor={(node) => {
            const member = (node.data as any).member as FamilyMember;
            return member.gender === 'male' ? '#3b82f6' : '#ec4899';
          }}
          className="!bg-white/90 !backdrop-blur-sm !border !border-slate-200 !shadow-xl !rounded-xl !overflow-hidden"
          position="bottom-right"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
          }}
        />
        <Background 
          variant={BackgroundVariant.Dots}
          gap={30} 
          size={1.5} 
          color="#cbd5e1"
          style={{
            opacity: 0.4,
          }}
        />
      </ReactFlow>

      {/* Add Member Button */}
      <button
        onClick={() => setShowAddForm(true)}
        className="absolute top-4 left-4 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 transition-colors z-10"
      >
        <Plus className="w-4 h-4" />
        <span>Add Member</span>
      </button>

      {/* Add Member Form */}
      {showAddForm && (
        <AddMemberForm
          onAdd={handleAddMember}
          onCancel={() => setShowAddForm(false)}
          existingMembers={members}
        />
      )}

      {/* Edit Member Form */}
      {editingMember && (
        <EditMemberForm
          member={editingMember}
          onSave={handleEditMember}
          onCancel={() => setEditingMember(null)}
        />
      )}
    </div>
  );
};

export default FamilyTree;

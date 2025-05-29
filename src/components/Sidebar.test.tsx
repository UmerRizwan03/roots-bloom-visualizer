import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom'; // For extended matchers like .toBeInTheDocument()

import Sidebar from './Sidebar';
import { FamilyMember } from '../types/family';

// Mock family data for tests
const mockMembers: FamilyMember[] = [
  { id: '1', name: 'Johnathan Doe', generation: 1, gender: 'male' }, // Changed name slightly for better partial match testing
  { id: '2', name: 'Jane Doe', generation: 1, gender: 'female' },
  { id: '3', name: 'Peter Pan', generation: 2, gender: 'male' },
  { id: '4', name: 'Alice Wonderland', generation: 2, gender: 'female' },
];

// Mock functions for props
const mockOnMemberSelect = jest.fn();
const mockOnSearchQueryChange = jest.fn(); // Though not directly tested via its call, it's a required prop

describe('Sidebar Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockOnMemberSelect.mockClear();
    mockOnSearchQueryChange.mockClear();
  });

  it('should display prompt when searchQuery is empty', () => {
    render(
      <Sidebar 
        members={mockMembers} 
        searchQuery="" 
        onSearchQueryChange={mockOnSearchQueryChange} 
        onMemberSelect={mockOnMemberSelect} 
      />
    );
    expect(screen.getByText(/Start typing to search members.../i)).toBeInTheDocument();
    // Check that no member names are rendered when search query is empty
    expect(screen.queryByText(mockMembers[0].name)).not.toBeInTheDocument();
    expect(screen.queryByText(mockMembers[1].name)).not.toBeInTheDocument();
  });

  it('should filter and display members based on searchQuery', () => {
    render(
      <Sidebar 
        members={mockMembers} 
        searchQuery="Doe" 
        onSearchQueryChange={mockOnSearchQueryChange} 
        onMemberSelect={mockOnMemberSelect} 
      />
    );
    expect(screen.getByText('Johnathan Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.queryByText('Peter Pan')).not.toBeInTheDocument();
    expect(screen.queryByText('Alice Wonderland')).not.toBeInTheDocument();
  });

  it('should display "no members found" message for non-matching query', () => {
    render(
      <Sidebar 
        members={mockMembers} 
        searchQuery="NonExistentName" 
        onSearchQueryChange={mockOnSearchQueryChange} 
        onMemberSelect={mockOnMemberSelect} 
      />
    );
    expect(screen.getByText(/No members found matching your search./i)).toBeInTheDocument();
  });

  it('should handle case-insensitive search', () => {
    render(
      <Sidebar 
        members={mockMembers} 
        searchQuery="johnathan doe" // Lowercase search
        onSearchQueryChange={mockOnSearchQueryChange} 
        onMemberSelect={mockOnMemberSelect} 
      />
    );
    expect(screen.getByText('Johnathan Doe')).toBeInTheDocument(); // Original case name
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
  });

  it('should handle partial matches', () => {
    render(
      <Sidebar 
        members={mockMembers} 
        searchQuery="nath" // Partial match for Johnathan
        onSearchQueryChange={mockOnSearchQueryChange} 
        onMemberSelect={mockOnMemberSelect} 
      />
    );
    expect(screen.getByText('Johnathan Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Peter Pan')).not.toBeInTheDocument();
  });
  
  it('should handle partial matches for multiple members', () => {
    render(
      <Sidebar 
        members={mockMembers} 
        searchQuery="an" // Matches Johnathan, Jane, Pan, Wonderland
        onSearchQueryChange={mockOnSearchQueryChange} 
        onMemberSelect={mockOnMemberSelect} 
      />
    );
    expect(screen.getByText('Johnathan Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('Peter Pan')).toBeInTheDocument();
    expect(screen.getByText('Alice Wonderland')).toBeInTheDocument();
  });

  it('should call onMemberSelect with correct ID when a member is clicked', () => {
    render(
      <Sidebar 
        members={mockMembers} 
        searchQuery="John" // Ensure Johnathan Doe is displayed
        onSearchQueryChange={mockOnSearchQueryChange} 
        onMemberSelect={mockOnMemberSelect} 
      />
    );
    
    const memberToClick = screen.getByText('Johnathan Doe');
    fireEvent.click(memberToClick);
    
    expect(mockOnMemberSelect).toHaveBeenCalledTimes(1);
    expect(mockOnMemberSelect).toHaveBeenCalledWith('1'); // ID of Johnathan Doe
  });

  it('should still display prompt if members array is empty and searchQuery is empty', () => {
    render(
      <Sidebar 
        members={[]} 
        searchQuery="" 
        onSearchQueryChange={mockOnSearchQueryChange} 
        onMemberSelect={mockOnMemberSelect} 
      />
    );
    expect(screen.getByText(/Start typing to search members.../i)).toBeInTheDocument();
  });

  it('should display "no members found" if members array is empty and searchQuery is not empty', () => {
    render(
      <Sidebar 
        members={[]} 
        searchQuery="test" 
        onSearchQueryChange={mockOnSearchQueryChange} 
        onMemberSelect={mockOnMemberSelect} 
      />
    );
    expect(screen.getByText(/No members found matching your search./i)).toBeInTheDocument();
  });
});

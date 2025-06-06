import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import MemberCard from './MemberCard';
import { FamilyMember } from '../types/family';

// Mock Data
const fullMember: FamilyMember = {
  id: '1',
  name: 'John Michael Doe',
  gender: 'male',
  generation: 3,
  birthDate: '1990-01-15',
  deathDate: undefined,
  photo: 'http://example.com/john.jpg',
  bio: 'A software developer from New York.',
  occupation: 'Software Developer',
  contactInfo: { email: 'john.doe@example.com', phone: '123-456-7890' }, // Assuming contactInfo structure
  address: '123 Main St, Anytown, USA',
  education: 'BSc Computer Science',
  hobbies: ['coding', 'hiking'],
  socialMedia: { twitter: '@johndoe' },
  parents: [],
  spouse: undefined,
  partners: [],
  children: [],
  bloodType: 'O+',
  medicalHistory: ['None'],
  birthPlace: 'New York, USA',
  mobileNumber: '098-765-4321', // Direct properties also for testing
  email: 'john.personal@example.com',
};

const sparseMember: FamilyMember = {
  id: '2',
  name: 'Jane Minimal Doe',
  gender: 'female',
  generation: 2,
  // Most optional fields are undefined
  birthDate: '1985-05-20',
  deathDate: undefined,
  photo: undefined,
  bio: undefined,
  occupation: undefined,
  contactInfo: undefined,
  address: undefined,
  education: undefined,
  hobbies: undefined,
  socialMedia: undefined,
  parents: [],
  spouse: undefined,
  partners: [],
  children: [],
  bloodType: undefined,
  medicalHistory: undefined,
  birthPlace: undefined,
  mobileNumber: undefined,
  email: undefined,
};

const mockPartner1: FamilyMember = { ...fullMember, id: 'p1', name: 'Partner One Name', occupation: 'Designer' };
const mockPartner2: FamilyMember = { ...sparseMember, id: 'p2', name: 'Partner Two Name', bloodType: 'A-'};

const mockAge = 34;
const mockAgeNull = null;

describe('MemberCard Component', () => {
  describe('Basic Rendering with Full Data', () => {
    beforeEach(() => {
      render(<MemberCard member={fullMember} partners={[mockPartner1]} age={mockAge} />);
    });

    it('renders member name, generation, and age', () => {
      expect(screen.getByText(fullMember.name)).toBeInTheDocument();
      expect(screen.getByText(`Generation ${fullMember.generation}`)).toBeInTheDocument();
      expect(screen.getByText(new RegExp(`\\(${mockAge} years old\\)`))).toBeInTheDocument();
    });

    it('renders member photo with correct alt text', () => {
      const img = screen.getByRole('img', { name: fullMember.name });
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute('src', fullMember.photo);
    });

    it('renders birth date', () => {
        expect(screen.getByText(`Born: ${new Date(fullMember.birthDate!).toLocaleDateString()}`)).toBeInTheDocument();
    });

    it('renders occupation', () => {
      expect(screen.getByText(fullMember.occupation!)).toBeInTheDocument();
    });

    it('renders birth place', () => {
      expect(screen.getByText(fullMember.birthPlace!)).toBeInTheDocument();
    });

    it('renders blood type', () => {
      expect(screen.getByText(`Blood Type: ${fullMember.bloodType!}`)).toBeInTheDocument();
    });

    it('renders mobile number', () => {
      expect(screen.getByText(fullMember.mobileNumber!)).toBeInTheDocument();
    });

    it('renders email', () => {
      expect(screen.getByText(fullMember.email!)).toBeInTheDocument();
    });

    it('renders bio', () => {
      expect(screen.getByText(fullMember.bio!)).toBeInTheDocument();
    });

    it('renders partner information when partners are provided', () => {
      expect(screen.getByText('Partner')).toBeInTheDocument(); // Single partner
      expect(screen.getByText(mockPartner1.name)).toBeInTheDocument();
      expect(screen.getByText(mockPartner1.occupation!)).toBeInTheDocument();
    });
  });

  describe('Conditional Rendering with Sparse Data and Edge Cases', () => {
    beforeEach(() => {
      render(<MemberCard member={sparseMember} partners={[]} age={mockAgeNull} />);
    });

    it('renders member name and generation even with sparse data', () => {
      expect(screen.getByText(sparseMember.name)).toBeInTheDocument();
      expect(screen.getByText(`Generation ${sparseMember.generation}`)).toBeInTheDocument();
    });

    it('does not render age string when age is null', () => {
      // Check that " (X years old)" is NOT present
      // The birthdate itself will be there.
      const birthDateText = screen.getByText(`Born: ${new Date(sparseMember.birthDate!).toLocaleDateString()}`);
      expect(birthDateText).toBeInTheDocument();
      expect(screen.queryByText(/\(\d+ years old\)/)).not.toBeInTheDocument();
    });

    it('renders fallback user icon when photo is not provided', () => {
        // Check for the presence of the User icon via a more robust method if possible,
        // e.g., by checking for a class or a title if the icon component supports it.
        // For now, we assume the User icon is rendered if the img role is not found.
        expect(screen.queryByRole('img', { name: sparseMember.name })).not.toBeInTheDocument();
        // This requires the User icon to have a distinguishable characteristic.
        // If Lucide icons render as <svg>, you might query for 'svg' within specific containers.
        // Let's assume the parent div of the icon is identifiable
        const header = screen.getByText(sparseMember.name).closest('.flex.items-center.space-x-4');
        expect(header).not.toBeNull();
        const iconContainer = header!.querySelector('.w-16.h-16'); // The div wrapping the icon/image
        expect(iconContainer).not.toBeNull();
        expect(iconContainer!.querySelector('svg')).toBeInTheDocument(); // Assuming User icon is an SVG
    });

    it('does not render death date when not provided', () => {
      expect(screen.queryByText(/Died:/)).not.toBeInTheDocument();
    });

    it('renders death date when provided', () => {
        const memberWithDeathDate = { ...sparseMember, deathDate: '2022-01-01' };
        render(<MemberCard member={memberWithDeathDate} partners={[]} age={mockAge} />); // Re-render with new prop
        expect(screen.getByText(`Died: ${new Date(memberWithDeathDate.deathDate).toLocaleDateString()}`)).toBeInTheDocument();
    });

    it('does not render optional fields when data is missing', () => {
      expect(screen.queryByText(fullMember.occupation!)).not.toBeInTheDocument(); // Checking against fullMember's data to ensure it's not there
      expect(screen.queryByText(fullMember.birthPlace!)).not.toBeInTheDocument();
      expect(screen.queryByText(`Blood Type: ${fullMember.bloodType!}`)).not.toBeInTheDocument();
      expect(screen.queryByText(fullMember.mobileNumber!)).not.toBeInTheDocument(); // Direct mobile
      expect(screen.queryByText(fullMember.email!)).not.toBeInTheDocument(); // Direct email
      expect(screen.queryByText(fullMember.bio!)).not.toBeInTheDocument();
    });

    it('does not render partners section when partners array is empty', () => {
      expect(screen.queryByText('Partner')).not.toBeInTheDocument();
      expect(screen.queryByText('Partners')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Partners', () => {
    it('renders multiple partners correctly', () => {
      render(<MemberCard member={fullMember} partners={[mockPartner1, mockPartner2]} age={mockAge} />);
      expect(screen.getByText('Partners')).toBeInTheDocument(); // Multiple partners
      expect(screen.getByText(mockPartner1.name)).toBeInTheDocument();
      expect(screen.getByText(mockPartner2.name)).toBeInTheDocument();
      // Check for some details of partner2 to ensure its specific data is rendered
      const partner2CardContent = screen.getByText(mockPartner2.name).closest('div');
      expect(within(partner2CardContent!).getByText(`Blood Type: ${mockPartner2.bloodType!}`)).toBeInTheDocument();

    });
  });

  describe('High-level Structure and Styling', () => {
    it('renders the main Card component', () => {
      render(<MemberCard member={sparseMember} partners={[]} age={null} />);
      // Check for a role or class that indicates the main card container.
      // Shadcn Card often has role="article" or a specific class.
      // For now, let's assume it has a class that contains "card" as a basic check.
      // This is a weak test; a more specific selector would be better if available.
      const cardElement = screen.getByText(sparseMember.name).closest('div[class*="card"]'); // Find closest ancestor div with 'card' in class
      expect(cardElement).toBeInTheDocument();
    });

    it('applies gender-specific styling to header (conceptual check via class)', () => {
        // Male
        const { unmount } = render(<MemberCard member={{...fullMember, gender: 'male'}} partners={[]} age={mockAge} />);
        let header = screen.getByText(fullMember.name).closest('div[class*="pb-4"]'); // CardHeader has pb-4
        expect(header).toHaveClass(/bg-gradient-to-r from-blue-500 to-indigo-600/);
        unmount();

        // Female
        render(<MemberCard member={{...fullMember, gender: 'female'}} partners={[]} age={mockAge} />);
        header = screen.getByText(fullMember.name).closest('div[class*="pb-4"]');
        expect(header).toHaveClass(/bg-gradient-to-r from-rose-500 to-pink-600/);
    });
  });
});


export interface FamilyMember {
  id: string;
  name: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  occupation?: string;
  bio?: string;
  photo?: string;
  gender: 'male' | 'female';
  generation: number;
  parents?: string[];
  children?: string[];
  spouse?: string;
  partners?: string[]; // For multiple partners
  bloodType?: string;
  mobileNumber?: string;
  email?: string;
}

export interface FamilyConnection {
  id: string;
  source: string;
  target: string;
  type: 'parent' | 'spouse';
}

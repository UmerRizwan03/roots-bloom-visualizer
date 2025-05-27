import { FamilyMember, FamilyConnection } from '../types/family';

export const familyMembers: FamilyMember[] = [
  // Generation 1 (Oldest)
  {
    id: 'great-grandpa-john',
    name: 'John Anderson',
    birthDate: '1920-03-15',
    deathDate: '1998-07-22',
    birthPlace: 'Boston, MA',
    occupation: 'Railroad Engineer',
    bio: 'John was a dedicated railroad engineer who worked for 40 years. He loved fishing and woodworking.',
    gender: 'male',
    generation: 1,
    children: ['grandpa-robert', 'aunt-mary'],
    bloodType: 'A+',
    email: 'john.anderson@legacy.com'
  },
  {
    id: 'great-grandma-helen',
    name: 'Helen Anderson',
    birthDate: '1922-08-10',
    deathDate: '2005-12-03',
    birthPlace: 'Boston, MA',
    occupation: 'School Teacher',
    bio: 'Helen taught elementary school for 35 years and was known for her kindness and patience.',
    gender: 'female',
    generation: 1,
    spouse: 'great-grandpa-john',
    children: ['grandpa-robert', 'aunt-mary'],
    bloodType: 'O-',
    email: 'helen.anderson@legacy.com'
  },

  // Generation 2
  {
    id: 'grandpa-robert',
    name: 'Robert Anderson',
    birthDate: '1945-11-20',
    birthPlace: 'Boston, MA',
    occupation: 'Doctor',
    bio: 'Robert is a retired cardiologist who served his community for over 40 years.',
    gender: 'male',
    generation: 2,
    parents: ['great-grandpa-john', 'great-grandma-helen'],
    children: ['dad-michael', 'uncle-david'],
    bloodType: 'A+',
    mobileNumber: '+1-555-0101',
    email: 'robert.anderson@email.com'
  },
  {
    id: 'grandma-susan',
    name: 'Susan Anderson',
    birthDate: '1947-04-08',
    birthPlace: 'New York, NY',
    occupation: 'Nurse',
    bio: 'Susan worked as a pediatric nurse and is passionate about gardening and cooking.',
    gender: 'female',
    generation: 2,
    spouse: 'grandpa-robert',
    children: ['dad-michael', 'uncle-david'],
    bloodType: 'O+',
    mobileNumber: '+1-555-0102',
    email: 'susan.anderson@email.com'
  },
  {
    id: 'aunt-mary',
    name: 'Mary Johnson',
    birthDate: '1948-01-30',
    birthPlace: 'Boston, MA',
    occupation: 'Artist',
    bio: 'Mary is a talented painter whose works have been displayed in several galleries.',
    gender: 'female',
    generation: 2,
    parents: ['great-grandpa-john', 'great-grandma-helen'],
    children: ['cousin-sarah', 'cousin-james'],
    bloodType: 'B+',
    mobileNumber: '+1-555-0103',
    email: 'mary.johnson@art.com'
  },

  // Generation 3
  {
    id: 'dad-michael',
    name: 'Michael Anderson',
    birthDate: '1972-09-15',
    birthPlace: 'Boston, MA',
    occupation: 'Software Engineer',
    bio: 'Michael is a senior software engineer who loves hiking and photography.',
    gender: 'male',
    generation: 3,
    parents: ['grandpa-robert', 'grandma-susan'],
    children: ['me-alex', 'sister-emma'],
    bloodType: 'A+',
    mobileNumber: '+1-555-0201',
    email: 'michael.anderson@tech.com'
  },
  {
    id: 'mom-jennifer',
    name: 'Jennifer Anderson',
    birthDate: '1974-06-22',
    birthPlace: 'Chicago, IL',
    occupation: 'Marketing Manager',
    bio: 'Jennifer manages marketing for a tech startup and enjoys yoga and reading.',
    gender: 'female',
    generation: 3,
    spouse: 'dad-michael',
    children: ['me-alex', 'sister-emma'],
    bloodType: 'O+',
    mobileNumber: '+1-555-0202',
    email: 'jennifer.anderson@marketing.com'
  },
  {
    id: 'uncle-david',
    name: 'David Anderson',
    birthDate: '1970-12-05',
    birthPlace: 'Boston, MA',
    occupation: 'Architect',
    bio: 'David designs sustainable buildings and is passionate about environmental conservation.',
    gender: 'male',
    generation: 3,
    parents: ['grandpa-robert', 'grandma-susan'],
    children: ['cousin-ryan'],
    bloodType: 'A-',
    mobileNumber: '+1-555-0203',
    email: 'david.anderson@arch.com'
  },
  {
    id: 'cousin-sarah',
    name: 'Sarah Johnson',
    birthDate: '1975-03-18',
    birthPlace: 'Seattle, WA',
    occupation: 'Veterinarian',
    bio: 'Sarah runs her own veterinary clinic and volunteers at animal shelters.',
    gender: 'female',
    generation: 3,
    parents: ['aunt-mary'],
    bloodType: 'B+',
    mobileNumber: '+1-555-0301',
    email: 'sarah.johnson@vet.com'
  },
  {
    id: 'cousin-james',
    name: 'James Johnson',
    birthDate: '1977-07-11',
    birthPlace: 'Seattle, WA',
    occupation: 'Chef',
    bio: 'James owns a popular restaurant and is known for his innovative cuisine.',
    gender: 'male',
    generation: 3,
    parents: ['aunt-mary'],
    children: ['nephew-tommy'],
    bloodType: 'O-',
    mobileNumber: '+1-555-0302',
    email: 'james.johnson@restaurant.com'
  },

  // Generation 4 (Current)
  {
    id: 'me-alex',
    name: 'Alex Anderson',
    birthDate: '1998-04-10',
    birthPlace: 'San Francisco, CA',
    occupation: 'Web Developer',
    bio: 'Currently working as a web developer and studying computer science.',
    gender: 'male',
    generation: 4,
    parents: ['dad-michael', 'mom-jennifer'],
    bloodType: 'A+',
    mobileNumber: '+1-555-0401',
    email: 'alex.anderson@dev.com'
  },
  {
    id: 'sister-emma',
    name: 'Emma Anderson',
    birthDate: '2001-11-25',
    birthPlace: 'San Francisco, CA',
    occupation: 'Student',
    bio: 'Currently studying biology with plans to become a marine biologist.',
    gender: 'female',
    generation: 4,
    parents: ['dad-michael', 'mom-jennifer'],
    bloodType: 'O+',
    mobileNumber: '+1-555-0402',
    email: 'emma.anderson@student.edu'
  },
  {
    id: 'cousin-ryan',
    name: 'Ryan Anderson',
    birthDate: '1999-08-14',
    birthPlace: 'Portland, OR',
    occupation: 'Graphic Designer',
    bio: 'Freelance graphic designer who specializes in brand identity and illustration.',
    gender: 'male',
    generation: 4,
    parents: ['uncle-david'],
    bloodType: 'A-',
    mobileNumber: '+1-555-0403',
    email: 'ryan.anderson@design.com'
  },
  {
    id: 'nephew-tommy',
    name: 'Tommy Johnson',
    birthDate: '2003-02-28',
    birthPlace: 'Seattle, WA',
    occupation: 'High School Student',
    bio: 'Active in school theater and plans to study performing arts.',
    gender: 'male',
    generation: 4,
    parents: ['cousin-james'],
    bloodType: 'O-',
    mobileNumber: '+1-555-0404',
    email: 'tommy.johnson@student.edu'
  }
];

export const familyConnections: FamilyConnection[] = [
  // Marriages
  { id: 'marriage-1', source: 'great-grandpa-john', target: 'great-grandma-helen', type: 'spouse' },
  { id: 'marriage-2', source: 'grandpa-robert', target: 'grandma-susan', type: 'spouse' },
  { id: 'marriage-3', source: 'dad-michael', target: 'mom-jennifer', type: 'spouse' },

  // Parent-child relationships
  { id: 'parent-1', source: 'great-grandpa-john', target: 'grandpa-robert', type: 'parent' },
  { id: 'parent-2', source: 'great-grandma-helen', target: 'grandpa-robert', type: 'parent' },
  { id: 'parent-3', source: 'great-grandpa-john', target: 'aunt-mary', type: 'parent' },
  { id: 'parent-4', source: 'great-grandma-helen', target: 'aunt-mary', type: 'parent' },
  
  { id: 'parent-5', source: 'grandpa-robert', target: 'dad-michael', type: 'parent' },
  { id: 'parent-6', source: 'grandma-susan', target: 'dad-michael', type: 'parent' },
  { id: 'parent-7', source: 'grandpa-robert', target: 'uncle-david', type: 'parent' },
  { id: 'parent-8', source: 'grandma-susan', target: 'uncle-david', type: 'parent' },
  
  { id: 'parent-9', source: 'aunt-mary', target: 'cousin-sarah', type: 'parent' },
  { id: 'parent-10', source: 'aunt-mary', target: 'cousin-james', type: 'parent' },
  
  { id: 'parent-11', source: 'dad-michael', target: 'me-alex', type: 'parent' },
  { id: 'parent-12', source: 'mom-jennifer', target: 'me-alex', type: 'parent' },
  { id: 'parent-13', source: 'dad-michael', target: 'sister-emma', type: 'parent' },
  { id: 'parent-14', source: 'mom-jennifer', target: 'sister-emma', type: 'parent' },
  
  { id: 'parent-15', source: 'uncle-david', target: 'cousin-ryan', type: 'parent' },
  { id: 'parent-16', source: 'cousin-james', target: 'nephew-tommy', type: 'parent' }
];

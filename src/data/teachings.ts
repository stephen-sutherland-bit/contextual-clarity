// Type definitions for teachings - data now comes from Supabase

export interface Teaching {
  id: string;
  title: string;
  date: string;
  primaryTheme: string;
  secondaryThemes: string[];
  scriptures: string[];
  doctrines: string[];
  keywords: string[];
  questionsAnswered: string[];
  quickAnswer: string;
  fullContent: string;
  readingOrder?: number;
  phase: Phase;
  module?: string;
  moduleOrder?: number;
}

export type Phase = 'foundations' | 'essentials' | 'building-blocks' | 'moving-on' | 'advanced';

export interface PhaseInfo {
  slug: Phase;
  name: string;
  description: string;
}

export const phases: PhaseInfo[] = [
  {
    slug: 'foundations',
    name: 'Foundations',
    description: 'The basics of biblical interpretation and Covenantal Contextual Methodology'
  },
  {
    slug: 'essentials',
    name: 'Essentials',
    description: 'Covenant Basics'
  },
  {
    slug: 'building-blocks',
    name: 'Building Blocks',
    description: 'Transition from Mosaic Covenant to the New - Fulfilment in AD70'
  },
  {
    slug: 'moving-on',
    name: 'Moving-on',
    description: 'Life in the New Covenant'
  },
  {
    slug: 'advanced',
    name: 'Advanced',
    description: 'Doctrinal Deep Dives'
  }
];

export const themes = [
  "Covenant Theology",
  "Biblical Language",
  "Prophetic Literature",
  "Election & Calling",
  "Nature of God",
  "Hamartiology",
  "CCM Methodology",
  "Law and Grace",
  "Christology",
  "Eschatology"
];

// Mock data removed - teachings now fetched from Supabase
export const teachings: Teaching[] = [];

export const featuredQuestions: string[] = [];
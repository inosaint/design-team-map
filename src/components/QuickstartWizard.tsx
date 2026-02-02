import { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { DEFAULT_SETTINGS } from '../types';
import type { TeamNode, DesignerTypeConfig, LevelConfig } from '../types';
import { v4 as uuidv4 } from 'uuid';
import styles from './QuickstartWizard.module.css';
import {
  trackQuickstartStarted,
  trackQuickstartCompleted,
  trackQuickstartDismissed,
  trackQuickstartIndustrySelected,
  trackQuickstartTeamSizeSelected,
  trackQuickstartStructureSelected,
  trackQuickstartRoleTypeSelected,
} from '../utils/analytics';

type TeamSize = 'tiny' | 'small' | 'medium' | 'large';
type StructureType = 'flat' | 'hierarchical' | 'pods';
type IndustryType = 'design' | 'engineering' | 'product' | 'sales' | 'marketing' | 'hr' | 'finance' | 'healthcare' | 'legal' | 'construction' | 'education' | 'custom';

interface IndustryPreset {
  id: IndustryType;
  name: string;
  icon: string;
  description: string;
  teamName: string;
  roleTypes: DesignerTypeConfig[];
  levels: LevelConfig[];
  roleTerm: string; // e.g., "designer", "engineer", "manager"
  headTitle: string; // e.g., "Head of Design", "VP Engineering"
}

// Industry presets with levels and role types
const INDUSTRY_PRESETS: IndustryPreset[] = [
  {
    id: 'design',
    name: 'Design',
    icon: '🎨',
    description: 'UX, UI, Product Design teams',
    teamName: 'Design Team',
    roleTerm: 'Designer',
    headTitle: 'Head of Design',
    roleTypes: [
      { id: 'ux', name: 'UX Designer', abbreviation: 'UX' },
      { id: 'ui', name: 'UI Designer', abbreviation: 'UI' },
      { id: 'product', name: 'Product Designer', abbreviation: 'PD' },
      { id: 'visual', name: 'Visual Designer', abbreviation: 'VD' },
      { id: 'research', name: 'UX Researcher', abbreviation: 'UXR' },
      { id: 'content', name: 'Content Designer', abbreviation: 'CD' },
      { id: 'motion', name: 'Motion Designer', abbreviation: 'MD' },
    ],
    levels: [
      { id: 'level-1', level: 1, name: 'Designer I', color: '#FED7AA', minYearsFromPrevious: 0 },
      { id: 'level-2', level: 2, name: 'Designer II', color: '#FDBA74', minYearsFromPrevious: 1.5 },
      { id: 'level-3', level: 3, name: 'Designer III', color: '#FB923C', minYearsFromPrevious: 2 },
      { id: 'level-4-ic', level: 4, name: 'Senior Designer', color: '#F97316', minYearsFromPrevious: 3, track: 'ic' },
      { id: 'level-5-ic', level: 5, name: 'Staff Designer', color: '#EA580C', minYearsFromPrevious: 4, track: 'ic' },
      { id: 'level-4-manager', level: 4, name: 'Design Manager', color: '#86EFAC', minYearsFromPrevious: 3, track: 'manager' },
      { id: 'level-5-manager', level: 5, name: 'Senior Design Manager', color: '#4ADE80', minYearsFromPrevious: 4, track: 'manager' },
      { id: 'level-6-head', level: 6, name: 'Head of Design', color: '#22C55E', minYearsFromPrevious: 4, isMaxLevel: true },
    ],
  },
  {
    id: 'engineering',
    name: 'Engineering',
    icon: '💻',
    description: 'Software, DevOps, QA teams',
    teamName: 'Engineering Team',
    roleTerm: 'Engineer',
    headTitle: 'VP Engineering',
    roleTypes: [
      { id: 'frontend', name: 'Frontend Engineer', abbreviation: 'FE' },
      { id: 'backend', name: 'Backend Engineer', abbreviation: 'BE' },
      { id: 'fullstack', name: 'Full Stack Engineer', abbreviation: 'FS' },
      { id: 'mobile', name: 'Mobile Engineer', abbreviation: 'MOB' },
      { id: 'devops', name: 'DevOps Engineer', abbreviation: 'DO' },
      { id: 'qa', name: 'QA Engineer', abbreviation: 'QA' },
      { id: 'data', name: 'Data Engineer', abbreviation: 'DE' },
      { id: 'ml', name: 'ML Engineer', abbreviation: 'ML' },
    ],
    levels: [
      { id: 'level-1', level: 1, name: 'Junior Engineer', color: '#BFDBFE', minYearsFromPrevious: 0 },
      { id: 'level-2', level: 2, name: 'Engineer', color: '#93C5FD', minYearsFromPrevious: 1 },
      { id: 'level-3', level: 3, name: 'Senior Engineer', color: '#60A5FA', minYearsFromPrevious: 2 },
      { id: 'level-4-ic', level: 4, name: 'Staff Engineer', color: '#3B82F6', minYearsFromPrevious: 3, track: 'ic' },
      { id: 'level-5-ic', level: 5, name: 'Principal Engineer', color: '#2563EB', minYearsFromPrevious: 4, track: 'ic' },
      { id: 'level-4-manager', level: 4, name: 'Engineering Manager', color: '#86EFAC', minYearsFromPrevious: 3, track: 'manager' },
      { id: 'level-5-manager', level: 5, name: 'Senior EM', color: '#4ADE80', minYearsFromPrevious: 4, track: 'manager' },
      { id: 'level-6-head', level: 6, name: 'VP Engineering', color: '#22C55E', minYearsFromPrevious: 4, isMaxLevel: true },
    ],
  },
  {
    id: 'product',
    name: 'Product',
    icon: '📦',
    description: 'Product Management teams',
    teamName: 'Product Team',
    roleTerm: 'PM',
    headTitle: 'Chief Product Officer',
    roleTypes: [
      { id: 'core', name: 'Product Manager', abbreviation: 'PM' },
      { id: 'growth', name: 'Growth PM', abbreviation: 'GPM' },
      { id: 'platform', name: 'Platform PM', abbreviation: 'PPM' },
      { id: 'technical', name: 'Technical PM', abbreviation: 'TPM' },
      { id: 'data', name: 'Data PM', abbreviation: 'DPM' },
      { id: 'ops', name: 'Product Ops', abbreviation: 'PO' },
    ],
    levels: [
      { id: 'level-1', level: 1, name: 'Associate PM', color: '#DDD6FE', minYearsFromPrevious: 0 },
      { id: 'level-2', level: 2, name: 'Product Manager', color: '#C4B5FD', minYearsFromPrevious: 1.5 },
      { id: 'level-3', level: 3, name: 'Senior PM', color: '#A78BFA', minYearsFromPrevious: 2 },
      { id: 'level-4-ic', level: 4, name: 'Staff PM', color: '#8B5CF6', minYearsFromPrevious: 3, track: 'ic' },
      { id: 'level-5-ic', level: 5, name: 'Principal PM', color: '#7C3AED', minYearsFromPrevious: 4, track: 'ic' },
      { id: 'level-4-manager', level: 4, name: 'Group PM', color: '#86EFAC', minYearsFromPrevious: 3, track: 'manager' },
      { id: 'level-5-manager', level: 5, name: 'Director of Product', color: '#4ADE80', minYearsFromPrevious: 4, track: 'manager' },
      { id: 'level-6-head', level: 6, name: 'VP Product', color: '#22C55E', minYearsFromPrevious: 4, isMaxLevel: true },
    ],
  },
  {
    id: 'sales',
    name: 'Sales',
    icon: '💼',
    description: 'Sales & Business Development',
    teamName: 'Sales Team',
    roleTerm: 'Rep',
    headTitle: 'VP Sales',
    roleTypes: [
      { id: 'sdr', name: 'Sales Dev Rep', abbreviation: 'SDR' },
      { id: 'bdr', name: 'Business Dev Rep', abbreviation: 'BDR' },
      { id: 'ae', name: 'Account Executive', abbreviation: 'AE' },
      { id: 'am', name: 'Account Manager', abbreviation: 'AM' },
      { id: 'se', name: 'Sales Engineer', abbreviation: 'SE' },
      { id: 'cs', name: 'Customer Success', abbreviation: 'CS' },
    ],
    levels: [
      { id: 'level-1', level: 1, name: 'Sales Rep I', color: '#FED7AA', minYearsFromPrevious: 0 },
      { id: 'level-2', level: 2, name: 'Sales Rep II', color: '#FDBA74', minYearsFromPrevious: 1 },
      { id: 'level-3', level: 3, name: 'Senior Sales Rep', color: '#FB923C', minYearsFromPrevious: 2 },
      { id: 'level-4-ic', level: 4, name: 'Enterprise Rep', color: '#F97316', minYearsFromPrevious: 2, track: 'ic' },
      { id: 'level-5-ic', level: 5, name: 'Strategic Rep', color: '#EA580C', minYearsFromPrevious: 3, track: 'ic' },
      { id: 'level-4-manager', level: 4, name: 'Sales Manager', color: '#86EFAC', minYearsFromPrevious: 2, track: 'manager' },
      { id: 'level-5-manager', level: 5, name: 'Sales Director', color: '#4ADE80', minYearsFromPrevious: 3, track: 'manager' },
      { id: 'level-6-head', level: 6, name: 'VP Sales', color: '#22C55E', minYearsFromPrevious: 3, isMaxLevel: true },
    ],
  },
  {
    id: 'marketing',
    name: 'Marketing',
    icon: '📢',
    description: 'Marketing & Communications',
    teamName: 'Marketing Team',
    roleTerm: 'Marketer',
    headTitle: 'CMO',
    roleTypes: [
      { id: 'brand', name: 'Brand Marketing', abbreviation: 'BM' },
      { id: 'growth', name: 'Growth Marketing', abbreviation: 'GM' },
      { id: 'content', name: 'Content Marketing', abbreviation: 'CM' },
      { id: 'product', name: 'Product Marketing', abbreviation: 'PMM' },
      { id: 'demand', name: 'Demand Gen', abbreviation: 'DG' },
      { id: 'comms', name: 'Communications', abbreviation: 'PR' },
    ],
    levels: [
      { id: 'level-1', level: 1, name: 'Marketing Coordinator', color: '#FBCFE8', minYearsFromPrevious: 0 },
      { id: 'level-2', level: 2, name: 'Marketing Specialist', color: '#F9A8D4', minYearsFromPrevious: 1.5 },
      { id: 'level-3', level: 3, name: 'Senior Specialist', color: '#F472B6', minYearsFromPrevious: 2 },
      { id: 'level-4-ic', level: 4, name: 'Marketing Lead', color: '#EC4899', minYearsFromPrevious: 3, track: 'ic' },
      { id: 'level-5-ic', level: 5, name: 'Principal Marketer', color: '#DB2777', minYearsFromPrevious: 4, track: 'ic' },
      { id: 'level-4-manager', level: 4, name: 'Marketing Manager', color: '#86EFAC', minYearsFromPrevious: 3, track: 'manager' },
      { id: 'level-5-manager', level: 5, name: 'Marketing Director', color: '#4ADE80', minYearsFromPrevious: 4, track: 'manager' },
      { id: 'level-6-head', level: 6, name: 'VP Marketing', color: '#22C55E', minYearsFromPrevious: 4, isMaxLevel: true },
    ],
  },
  {
    id: 'hr',
    name: 'People/HR',
    icon: '👥',
    description: 'HR & People Operations',
    teamName: 'People Team',
    roleTerm: 'Specialist',
    headTitle: 'Chief People Officer',
    roleTypes: [
      { id: 'recruiting', name: 'Recruiter', abbreviation: 'REC' },
      { id: 'hrbp', name: 'HR Business Partner', abbreviation: 'HRBP' },
      { id: 'ops', name: 'People Ops', abbreviation: 'PO' },
      { id: 'comp', name: 'Compensation', abbreviation: 'COMP' },
      { id: 'learning', name: 'Learning & Dev', abbreviation: 'L&D' },
      { id: 'dei', name: 'DEI', abbreviation: 'DEI' },
    ],
    levels: [
      { id: 'level-1', level: 1, name: 'HR Coordinator', color: '#A5F3FC', minYearsFromPrevious: 0 },
      { id: 'level-2', level: 2, name: 'HR Specialist', color: '#67E8F9', minYearsFromPrevious: 1.5 },
      { id: 'level-3', level: 3, name: 'Senior Specialist', color: '#22D3EE', minYearsFromPrevious: 2 },
      { id: 'level-4-ic', level: 4, name: 'HR Lead', color: '#06B6D4', minYearsFromPrevious: 3, track: 'ic' },
      { id: 'level-5-ic', level: 5, name: 'Principal HR', color: '#0891B2', minYearsFromPrevious: 4, track: 'ic' },
      { id: 'level-4-manager', level: 4, name: 'HR Manager', color: '#86EFAC', minYearsFromPrevious: 3, track: 'manager' },
      { id: 'level-5-manager', level: 5, name: 'HR Director', color: '#4ADE80', minYearsFromPrevious: 4, track: 'manager' },
      { id: 'level-6-head', level: 6, name: 'VP People', color: '#22C55E', minYearsFromPrevious: 4, isMaxLevel: true },
    ],
  },
  {
    id: 'finance',
    name: 'Finance',
    icon: '💰',
    description: 'Finance & Accounting teams',
    teamName: 'Finance Team',
    roleTerm: 'Analyst',
    headTitle: 'CFO',
    roleTypes: [
      { id: 'fp&a', name: 'FP&A', abbreviation: 'FPA' },
      { id: 'accounting', name: 'Accounting', abbreviation: 'ACC' },
      { id: 'tax', name: 'Tax', abbreviation: 'TAX' },
      { id: 'treasury', name: 'Treasury', abbreviation: 'TRS' },
      { id: 'audit', name: 'Internal Audit', abbreviation: 'AUD' },
      { id: 'controller', name: 'Controller', abbreviation: 'CTL' },
    ],
    levels: [
      { id: 'level-1', level: 1, name: 'Financial Analyst I', color: '#BBF7D0', minYearsFromPrevious: 0 },
      { id: 'level-2', level: 2, name: 'Financial Analyst II', color: '#86EFAC', minYearsFromPrevious: 1.5 },
      { id: 'level-3', level: 3, name: 'Senior Analyst', color: '#4ADE80', minYearsFromPrevious: 2 },
      { id: 'level-4-ic', level: 4, name: 'Lead Analyst', color: '#22C55E', minYearsFromPrevious: 3, track: 'ic' },
      { id: 'level-5-ic', level: 5, name: 'Principal Analyst', color: '#16A34A', minYearsFromPrevious: 4, track: 'ic' },
      { id: 'level-4-manager', level: 4, name: 'Finance Manager', color: '#FDE047', minYearsFromPrevious: 3, track: 'manager' },
      { id: 'level-5-manager', level: 5, name: 'Finance Director', color: '#FACC15', minYearsFromPrevious: 4, track: 'manager' },
      { id: 'level-6-head', level: 6, name: 'VP Finance', color: '#EAB308', minYearsFromPrevious: 4, isMaxLevel: true },
    ],
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    icon: '🏥',
    description: 'Medical & Healthcare teams',
    teamName: 'Medical Team',
    roleTerm: 'Clinician',
    headTitle: 'Chief Medical Officer',
    roleTypes: [
      { id: 'physician', name: 'Physician', abbreviation: 'MD' },
      { id: 'nurse', name: 'Nurse', abbreviation: 'RN' },
      { id: 'specialist', name: 'Specialist', abbreviation: 'SPEC' },
      { id: 'therapist', name: 'Therapist', abbreviation: 'PT' },
      { id: 'technician', name: 'Technician', abbreviation: 'TECH' },
      { id: 'admin', name: 'Medical Admin', abbreviation: 'ADM' },
    ],
    levels: [
      { id: 'level-1', level: 1, name: 'Resident/Intern', color: '#BFDBFE', minYearsFromPrevious: 0 },
      { id: 'level-2', level: 2, name: 'Staff Clinician', color: '#93C5FD', minYearsFromPrevious: 2 },
      { id: 'level-3', level: 3, name: 'Senior Clinician', color: '#60A5FA', minYearsFromPrevious: 3 },
      { id: 'level-4-ic', level: 4, name: 'Attending/Lead', color: '#3B82F6', minYearsFromPrevious: 4, track: 'ic' },
      { id: 'level-5-ic', level: 5, name: 'Chief/Director', color: '#2563EB', minYearsFromPrevious: 5, track: 'ic' },
      { id: 'level-4-manager', level: 4, name: 'Unit Manager', color: '#86EFAC', minYearsFromPrevious: 3, track: 'manager' },
      { id: 'level-5-manager', level: 5, name: 'Department Director', color: '#4ADE80', minYearsFromPrevious: 4, track: 'manager' },
      { id: 'level-6-head', level: 6, name: 'CMO', color: '#22C55E', minYearsFromPrevious: 5, isMaxLevel: true },
    ],
  },
  {
    id: 'legal',
    name: 'Legal',
    icon: '⚖️',
    description: 'Law firms & Legal teams',
    teamName: 'Legal Team',
    roleTerm: 'Attorney',
    headTitle: 'General Counsel',
    roleTypes: [
      { id: 'corporate', name: 'Corporate Law', abbreviation: 'CORP' },
      { id: 'litigation', name: 'Litigation', abbreviation: 'LIT' },
      { id: 'ip', name: 'IP Law', abbreviation: 'IP' },
      { id: 'employment', name: 'Employment Law', abbreviation: 'EMP' },
      { id: 'contracts', name: 'Contracts', abbreviation: 'CON' },
      { id: 'paralegal', name: 'Paralegal', abbreviation: 'PL' },
    ],
    levels: [
      { id: 'level-1', level: 1, name: 'Paralegal/Clerk', color: '#E9D5FF', minYearsFromPrevious: 0 },
      { id: 'level-2', level: 2, name: 'Associate', color: '#D8B4FE', minYearsFromPrevious: 1 },
      { id: 'level-3', level: 3, name: 'Senior Associate', color: '#C084FC', minYearsFromPrevious: 3 },
      { id: 'level-4-ic', level: 4, name: 'Counsel', color: '#A855F7', minYearsFromPrevious: 4, track: 'ic' },
      { id: 'level-5-ic', level: 5, name: 'Senior Counsel', color: '#9333EA', minYearsFromPrevious: 5, track: 'ic' },
      { id: 'level-4-manager', level: 4, name: 'Practice Lead', color: '#86EFAC', minYearsFromPrevious: 4, track: 'manager' },
      { id: 'level-5-manager', level: 5, name: 'Partner', color: '#4ADE80', minYearsFromPrevious: 5, track: 'manager' },
      { id: 'level-6-head', level: 6, name: 'General Counsel', color: '#22C55E', minYearsFromPrevious: 6, isMaxLevel: true },
    ],
  },
  {
    id: 'construction',
    name: 'Construction',
    icon: '🏗️',
    description: 'Construction & Building teams',
    teamName: 'Construction Team',
    roleTerm: 'Worker',
    headTitle: 'Construction Director',
    roleTypes: [
      { id: 'carpenter', name: 'Carpenter', abbreviation: 'CARP' },
      { id: 'electrician', name: 'Electrician', abbreviation: 'ELEC' },
      { id: 'plumber', name: 'Plumber', abbreviation: 'PLMB' },
      { id: 'mason', name: 'Mason', abbreviation: 'MAS' },
      { id: 'operator', name: 'Equipment Operator', abbreviation: 'OPR' },
      { id: 'safety', name: 'Safety Officer', abbreviation: 'SAF' },
    ],
    levels: [
      { id: 'level-1', level: 1, name: 'Apprentice', color: '#FED7AA', minYearsFromPrevious: 0 },
      { id: 'level-2', level: 2, name: 'Journeyman', color: '#FDBA74', minYearsFromPrevious: 2 },
      { id: 'level-3', level: 3, name: 'Senior Tradesman', color: '#FB923C', minYearsFromPrevious: 3 },
      { id: 'level-4-ic', level: 4, name: 'Master Tradesman', color: '#F97316', minYearsFromPrevious: 4, track: 'ic' },
      { id: 'level-5-ic', level: 5, name: 'Specialist', color: '#EA580C', minYearsFromPrevious: 5, track: 'ic' },
      { id: 'level-4-manager', level: 4, name: 'Foreman', color: '#86EFAC', minYearsFromPrevious: 3, track: 'manager' },
      { id: 'level-5-manager', level: 5, name: 'Site Superintendent', color: '#4ADE80', minYearsFromPrevious: 4, track: 'manager' },
      { id: 'level-6-head', level: 6, name: 'Project Director', color: '#22C55E', minYearsFromPrevious: 5, isMaxLevel: true },
    ],
  },
  {
    id: 'education',
    name: 'Education',
    icon: '📚',
    description: 'Schools & Educational institutions',
    teamName: 'Faculty',
    roleTerm: 'Educator',
    headTitle: 'Dean',
    roleTypes: [
      { id: 'teacher', name: 'Teacher', abbreviation: 'TCH' },
      { id: 'professor', name: 'Professor', abbreviation: 'PROF' },
      { id: 'counselor', name: 'Counselor', abbreviation: 'COUN' },
      { id: 'admin', name: 'Administrator', abbreviation: 'ADM' },
      { id: 'specialist', name: 'Specialist', abbreviation: 'SPEC' },
      { id: 'assistant', name: 'Teaching Assistant', abbreviation: 'TA' },
    ],
    levels: [
      { id: 'level-1', level: 1, name: 'Teaching Assistant', color: '#A5F3FC', minYearsFromPrevious: 0 },
      { id: 'level-2', level: 2, name: 'Instructor', color: '#67E8F9', minYearsFromPrevious: 1 },
      { id: 'level-3', level: 3, name: 'Senior Instructor', color: '#22D3EE', minYearsFromPrevious: 3 },
      { id: 'level-4-ic', level: 4, name: 'Associate Professor', color: '#06B6D4', minYearsFromPrevious: 4, track: 'ic' },
      { id: 'level-5-ic', level: 5, name: 'Full Professor', color: '#0891B2', minYearsFromPrevious: 6, track: 'ic' },
      { id: 'level-4-manager', level: 4, name: 'Department Chair', color: '#86EFAC', minYearsFromPrevious: 4, track: 'manager' },
      { id: 'level-5-manager', level: 5, name: 'Associate Dean', color: '#4ADE80', minYearsFromPrevious: 5, track: 'manager' },
      { id: 'level-6-head', level: 6, name: 'Dean', color: '#22C55E', minYearsFromPrevious: 6, isMaxLevel: true },
    ],
  },
  {
    id: 'custom',
    name: 'Custom',
    icon: '⚙️',
    description: 'Start with a blank template',
    teamName: 'My Team',
    roleTerm: 'Member',
    headTitle: 'Head',
    roleTypes: [
      { id: 'type1', name: 'Role Type 1', abbreviation: 'T1' },
      { id: 'type2', name: 'Role Type 2', abbreviation: 'T2' },
      { id: 'type3', name: 'Role Type 3', abbreviation: 'T3' },
    ],
    levels: [
      { id: 'level-1', level: 1, name: 'Level 1', color: '#E5E7EB', minYearsFromPrevious: 0 },
      { id: 'level-2', level: 2, name: 'Level 2', color: '#D1D5DB', minYearsFromPrevious: 1.5 },
      { id: 'level-3', level: 3, name: 'Level 3', color: '#9CA3AF', minYearsFromPrevious: 2 },
      { id: 'level-4-ic', level: 4, name: 'Senior (IC)', color: '#6B7280', minYearsFromPrevious: 3, track: 'ic' },
      { id: 'level-5-ic', level: 5, name: 'Staff (IC)', color: '#4B5563', minYearsFromPrevious: 4, track: 'ic' },
      { id: 'level-4-manager', level: 4, name: 'Manager', color: '#86EFAC', minYearsFromPrevious: 3, track: 'manager' },
      { id: 'level-5-manager', level: 5, name: 'Senior Manager', color: '#4ADE80', minYearsFromPrevious: 4, track: 'manager' },
      { id: 'level-6-head', level: 6, name: 'Head', color: '#22C55E', minYearsFromPrevious: 4, isMaxLevel: true },
    ],
  },
];

interface QuickstartWizardProps {
  onClose: (completed: boolean) => void;
}

// SVG Illustrations for options
const TeamSizeIllustrations = {
  tiny: (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Lead card */}
      <rect x="45" y="12" width="30" height="20" rx="3" fill="#F97316" />
      {/* Connecting lines */}
      <path d="M60 32 L60 40 L40 40 L40 48" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      <path d="M60 32 L60 40 L80 40 L80 48" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      {/* Member cards */}
      <rect x="26" y="48" width="28" height="18" rx="2.5" fill="#FDBA74" />
      <rect x="66" y="48" width="28" height="18" rx="2.5" fill="#FDBA74" />
    </svg>
  ),
  small: (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head card */}
      <rect x="48" y="4" width="24" height="14" rx="3" fill="#22C55E" />
      {/* Connecting lines to managers */}
      <path d="M60 18 L60 24 L35 24 L35 30" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      <path d="M60 18 L60 24 L85 24 L85 30" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      {/* Manager cards */}
      <rect x="23" y="30" width="24" height="12" rx="2.5" fill="#F97316" />
      <rect x="73" y="30" width="24" height="12" rx="2.5" fill="#F97316" />
      {/* Connecting lines to ICs */}
      <path d="M35 42 L35 48 L17 48 L17 54" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      <path d="M35 42 L35 48 L53 48 L53 54" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      <path d="M85 42 L85 48 L67 48 L67 54" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      <path d="M85 42 L85 48 L103 48 L103 54" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      {/* IC cards - properly spaced */}
      <rect x="4" y="54" width="26" height="12" rx="2" fill="#FDBA74" />
      <rect x="33" y="54" width="26" height="12" rx="2" fill="#FDBA74" />
      <rect x="61" y="54" width="26" height="12" rx="2" fill="#FDBA74" />
      <rect x="90" y="54" width="26" height="12" rx="2" fill="#FDBA74" />
    </svg>
  ),
  medium: (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head card */}
      <rect x="50" y="10" width="20" height="12" rx="2.5" fill="#22C55E" />
      {/* Lines to managers */}
      <path d="M60 22 L60 26 L30 26 L30 30" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      <path d="M60 22 L60 30" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      <path d="M60 22 L60 26 L90 26 L90 30" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      {/* Manager cards at x=20, 50, 80 (width 20, centers at 30, 60, 90) */}
      <rect x="20" y="30" width="20" height="10" rx="2" fill="#4ADE80" />
      <rect x="50" y="30" width="20" height="10" rx="2" fill="#4ADE80" />
      <rect x="80" y="30" width="20" height="10" rx="2" fill="#4ADE80" />
      {/* Lines to ICs - 2 per manager, connecting to card centers */}
      <path d="M30 40 L30 44 L13 44 L13 48" stroke="#9CA3AF" strokeWidth="1" fill="none" />
      <path d="M30 40 L30 44 L33 44 L33 48" stroke="#9CA3AF" strokeWidth="1" fill="none" />
      <path d="M60 40 L60 44 L53 44 L53 48" stroke="#9CA3AF" strokeWidth="1" fill="none" />
      <path d="M60 40 L60 44 L67 44 L67 48" stroke="#9CA3AF" strokeWidth="1" fill="none" />
      <path d="M90 40 L90 44 L87 44 L87 48" stroke="#9CA3AF" strokeWidth="1" fill="none" />
      <path d="M90 40 L90 44 L107 44 L107 48" stroke="#9CA3AF" strokeWidth="1" fill="none" />
      {/* IC cards - 6 total, 2 per manager, properly spaced */}
      <rect x="4" y="48" width="18" height="9" rx="1.5" fill="#FDBA74" />
      <rect x="24" y="48" width="18" height="9" rx="1.5" fill="#FDBA74" />
      <rect x="44" y="48" width="18" height="9" rx="1.5" fill="#FDBA74" />
      <rect x="58" y="48" width="18" height="9" rx="1.5" fill="#FDBA74" />
      <rect x="78" y="48" width="18" height="9" rx="1.5" fill="#FDBA74" />
      <rect x="98" y="48" width="18" height="9" rx="1.5" fill="#FDBA74" />
      {/* Additional ICs row */}
      <rect x="8" y="61" width="14" height="7" rx="1.5" fill="#FED7AA" />
      <rect x="28" y="61" width="14" height="7" rx="1.5" fill="#FED7AA" />
      <rect x="53" y="61" width="14" height="7" rx="1.5" fill="#FED7AA" />
      <rect x="78" y="61" width="14" height="7" rx="1.5" fill="#FED7AA" />
      <rect x="98" y="61" width="14" height="7" rx="1.5" fill="#FED7AA" />
    </svg>
  ),
  large: (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head card - shifted down */}
      <rect x="52" y="8" width="16" height="10" rx="2" fill="#22C55E" />
      {/* Lines to directors */}
      <path d="M60 18 L60 22 L25 22 L25 26" stroke="#9CA3AF" strokeWidth="1" fill="none" />
      <path d="M60 18 L60 26" stroke="#9CA3AF" strokeWidth="1" fill="none" />
      <path d="M60 18 L60 22 L95 22 L95 26" stroke="#9CA3AF" strokeWidth="1" fill="none" />
      {/* Director cards */}
      <rect x="17" y="26" width="16" height="9" rx="1.5" fill="#4ADE80" />
      <rect x="52" y="26" width="16" height="9" rx="1.5" fill="#4ADE80" />
      <rect x="87" y="26" width="16" height="9" rx="1.5" fill="#4ADE80" />
      {/* Lines to managers */}
      <path d="M25 35 L25 39 L13 39 L13 43" stroke="#9CA3AF" strokeWidth="1" fill="none" />
      <path d="M25 35 L25 39 L37 39 L37 43" stroke="#9CA3AF" strokeWidth="1" fill="none" />
      <path d="M60 35 L60 39 L50 39 L50 43" stroke="#9CA3AF" strokeWidth="1" fill="none" />
      <path d="M60 35 L60 39 L70 39 L70 43" stroke="#9CA3AF" strokeWidth="1" fill="none" />
      <path d="M95 35 L95 39 L83 39 L83 43" stroke="#9CA3AF" strokeWidth="1" fill="none" />
      <path d="M95 35 L95 39 L107 39 L107 43" stroke="#9CA3AF" strokeWidth="1" fill="none" />
      {/* Manager cards - 6 properly spaced */}
      <rect x="4" y="43" width="18" height="8" rx="1.5" fill="#F97316" />
      <rect x="24" y="43" width="18" height="8" rx="1.5" fill="#F97316" />
      <rect x="44" y="43" width="12" height="8" rx="1.5" fill="#F97316" />
      <rect x="64" y="43" width="12" height="8" rx="1.5" fill="#F97316" />
      <rect x="78" y="43" width="18" height="8" rx="1.5" fill="#F97316" />
      <rect x="98" y="43" width="18" height="8" rx="1.5" fill="#F97316" />
      {/* IC cards row 1 - properly spaced */}
      <rect x="4" y="55" width="12" height="6" rx="1" fill="#FDBA74" />
      <rect x="18" y="55" width="12" height="6" rx="1" fill="#FDBA74" />
      <rect x="32" y="55" width="12" height="6" rx="1" fill="#FDBA74" />
      <rect x="46" y="55" width="12" height="6" rx="1" fill="#FDBA74" />
      <rect x="62" y="55" width="12" height="6" rx="1" fill="#FDBA74" />
      <rect x="76" y="55" width="12" height="6" rx="1" fill="#FDBA74" />
      <rect x="90" y="55" width="12" height="6" rx="1" fill="#FDBA74" />
      <rect x="104" y="55" width="12" height="6" rx="1" fill="#FDBA74" />
      {/* IC cards row 2 */}
      <rect x="8" y="65" width="10" height="5" rx="1" fill="#FED7AA" />
      <rect x="22" y="65" width="10" height="5" rx="1" fill="#FED7AA" />
      <rect x="38" y="65" width="10" height="5" rx="1" fill="#FED7AA" />
      <rect x="54" y="65" width="10" height="5" rx="1" fill="#FED7AA" />
      <rect x="68" y="65" width="10" height="5" rx="1" fill="#FED7AA" />
      <rect x="82" y="65" width="10" height="5" rx="1" fill="#FED7AA" />
      <rect x="96" y="65" width="10" height="5" rx="1" fill="#FED7AA" />
    </svg>
  ),
};

const StructureIllustrations = {
  flat: (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Manager card */}
      <rect x="48" y="8" width="24" height="18" rx="3" fill="#F97316" />
      {/* Connecting lines */}
      <path d="M60 26 L60 34 L20 34 L20 44" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      <path d="M60 26 L60 34 L45 34 L45 44" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      <path d="M60 26 L60 34 L75 34 L75 44" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      <path d="M60 26 L60 34 L100 34 L100 44" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      {/* IC cards */}
      <rect x="10" y="44" width="20" height="14" rx="2" fill="#FDBA74" />
      <rect x="35" y="44" width="20" height="14" rx="2" fill="#FDBA74" />
      <rect x="65" y="44" width="20" height="14" rx="2" fill="#FDBA74" />
      <rect x="90" y="44" width="20" height="14" rx="2" fill="#FDBA74" />
    </svg>
  ),
  hierarchical: (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Head card */}
      <rect x="48" y="4" width="24" height="14" rx="3" fill="#22C55E" />
      {/* Connecting lines to managers */}
      <path d="M60 18 L60 24 L35 24 L35 30" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      <path d="M60 18 L60 24 L85 24 L85 30" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      {/* Manager cards */}
      <rect x="23" y="30" width="24" height="12" rx="2.5" fill="#4ADE80" />
      <rect x="73" y="30" width="24" height="12" rx="2.5" fill="#4ADE80" />
      {/* Connecting lines to ICs */}
      <path d="M35 42 L35 48 L17 48 L17 54" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      <path d="M35 42 L35 48 L53 48 L53 54" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      <path d="M85 42 L85 48 L67 48 L67 54" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      <path d="M85 42 L85 48 L103 48 L103 54" stroke="#9CA3AF" strokeWidth="1.5" fill="none" />
      {/* IC cards - properly spaced with gaps */}
      <rect x="4" y="54" width="26" height="12" rx="2" fill="#F97316" />
      <rect x="33" y="54" width="26" height="12" rx="2" fill="#F97316" />
      <rect x="61" y="54" width="26" height="12" rx="2" fill="#F97316" />
      <rect x="90" y="54" width="26" height="12" rx="2" fill="#F97316" />
    </svg>
  ),
  pods: (
    <svg viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Pod 1 container */}
      <rect x="4" y="10" width="34" height="60" rx="6" fill="#FFF7ED" stroke="#FDBA74" strokeWidth="1.5" />
      {/* Pod 1 lead - center at x=21 */}
      <rect x="9" y="18" width="24" height="14" rx="2" fill="#F97316" />
      {/* Pod 1 connecting line - from bottom of lead (y=32) to top of member (y=44) */}
      <path d="M21 32 L21 44" stroke="#9CA3AF" strokeWidth="1" fill="none" />
      {/* Pod 1 member - center at x=21 */}
      <rect x="9" y="44" width="24" height="12" rx="1.5" fill="#FDBA74" />

      {/* Pod 2 container */}
      <rect x="43" y="10" width="34" height="60" rx="6" fill="#F0FDF4" stroke="#86EFAC" strokeWidth="1.5" />
      {/* Pod 2 lead - center at x=60 */}
      <rect x="48" y="18" width="24" height="14" rx="2" fill="#22C55E" />
      {/* Pod 2 connecting line */}
      <path d="M60 32 L60 44" stroke="#9CA3AF" strokeWidth="1" fill="none" />
      {/* Pod 2 member */}
      <rect x="48" y="44" width="24" height="12" rx="1.5" fill="#86EFAC" />

      {/* Pod 3 container */}
      <rect x="82" y="10" width="34" height="60" rx="6" fill="#EFF6FF" stroke="#93C5FD" strokeWidth="1.5" />
      {/* Pod 3 lead - center at x=99 */}
      <rect x="87" y="18" width="24" height="14" rx="2" fill="#3B82F6" />
      {/* Pod 3 connecting line */}
      <path d="M99 32 L99 44" stroke="#9CA3AF" strokeWidth="1" fill="none" />
      {/* Pod 3 member */}
      <rect x="87" y="44" width="24" height="12" rx="1.5" fill="#93C5FD" />
    </svg>
  ),
};

// Template generator
function generateTemplate(
  structure: StructureType,
  selectedTypes: string[],
  industry: IndustryPreset,
  teamCount: number
): { nodes: TeamNode[]; positions: Map<string, { x: number; y: number }> } {
  const nodes: TeamNode[] = [];
  const positions = new Map<string, { x: number; y: number }>();

  // Get the first selected type or default to first available
  const primaryType = selectedTypes[0] || industry.roleTypes[0]?.id || 'type1';

  // Get level names from industry
  const getLevelName = (level: number, track?: 'ic' | 'manager'): string => {
    if (level === 6) return industry.headTitle;
    const levelConfig = industry.levels.find(l => l.level === level && (level < 4 || l.track === track));
    return levelConfig?.name || `${industry.roleTerm} L${level}`;
  };

  // Helper to create a team member
  const createMember = (
    name: string,
    level: number,
    type: string,
    managerId: string | null,
    track?: 'ic' | 'manager'
  ): TeamNode => {
    const id = uuidv4();
    return {
      id,
      name,
      designerType: type,
      level,
      track: level >= 4 ? (track || 'ic') : undefined,
      yearsOfExperience: Math.max(0, (level - 1) * 2),
      joiningDate: new Date().toISOString().split('T')[0],
      managerId,
      isPlannedHire: false,
    };
  };

  const cardSpacing = 250; // Horizontal spacing between cards

  if (structure === 'flat') {
    // Flat structure: one lead with direct reports
    const leadLevel = teamCount <= 4 ? 4 : 5;
    const lead = createMember(getLevelName(leadLevel, 'ic'), leadLevel, primaryType, null, 'ic');
    nodes.push(lead);
    positions.set(lead.id, { x: 400, y: 50 });

    // All other members report to lead
    const memberCount = teamCount - 1;
    const totalWidth = (memberCount - 1) * cardSpacing;
    const startX = 400 - totalWidth / 2;

    for (let i = 0; i < memberCount; i++) {
      const type = selectedTypes[i % selectedTypes.length] || primaryType;
      const level = i < memberCount / 2 ? 3 : 2;
      const member = createMember(`${industry.roleTerm} ${i + 1}`, level, type, lead.id);
      nodes.push(member);
      positions.set(member.id, { x: startX + i * cardSpacing, y: 220 });
    }

  } else if (structure === 'hierarchical') {
    // Hierarchical: head -> managers -> ICs
    const head = createMember(industry.headTitle, 6, primaryType, null);
    nodes.push(head);
    positions.set(head.id, { x: 400, y: 50 });

    if (teamCount <= 4) {
      // Small team: head + direct reports
      const memberCount = teamCount - 1;
      const totalWidth = (memberCount - 1) * cardSpacing;
      const startX = 400 - totalWidth / 2;

      for (let i = 0; i < memberCount; i++) {
        const type = selectedTypes[i % selectedTypes.length] || primaryType;
        const member = createMember(`${industry.roleTerm} ${i + 1}`, 3, type, head.id);
        nodes.push(member);
        positions.set(member.id, { x: startX + i * cardSpacing, y: 220 });
      }
    } else {
      // Larger team: head -> managers -> ICs
      // Calculate managers needed (1 manager per 4-6 ICs)
      const icCount = teamCount - 1; // Subtract head
      const managerCount = Math.max(2, Math.min(4, Math.ceil(icCount / 5)));
      const actualIcCount = icCount - managerCount;
      const icsPerManager = Math.ceil(actualIcCount / managerCount);

      // Space managers based on IC group width (not fixed spacing)
      // Each manager needs enough space for their ICs
      const managerSpacing = Math.max(cardSpacing, icsPerManager * cardSpacing);
      const totalManagerWidth = (managerCount - 1) * managerSpacing;
      const managerStartX = 400 - totalManagerWidth / 2;

      let icIndex = 0;
      for (let m = 0; m < managerCount; m++) {
        const type = selectedTypes[m % selectedTypes.length] || primaryType;
        const manager = createMember(getLevelName(4, 'manager'), 4, type, head.id, 'manager');
        nodes.push(manager);
        const managerX = managerStartX + m * managerSpacing;
        positions.set(manager.id, { x: managerX, y: 200 });

        // ICs under this manager
        const thisManagerIcs = Math.min(icsPerManager, actualIcCount - icIndex);
        const icWidth = (thisManagerIcs - 1) * cardSpacing;
        const icStartX = managerX - icWidth / 2;

        for (let i = 0; i < thisManagerIcs && icIndex < actualIcCount; i++) {
          const icType = selectedTypes[(icIndex) % selectedTypes.length] || primaryType;
          const member = createMember(`${industry.roleTerm} ${icIndex + 1}`, 2 + (i % 2), icType, manager.id);
          nodes.push(member);
          positions.set(member.id, { x: icStartX + i * cardSpacing, y: 370 });
          icIndex++;
        }
      }
    }

  } else {
    // Pods structure
    // Calculate pods based on team count (2-4 people per pod)
    const podCount = Math.max(2, Math.min(4, Math.ceil(teamCount / 3)));
    const podNames = ['Alpha', 'Beta', 'Gamma', 'Delta'];

    // Members per pod (excluding lead)
    const membersWithoutLeads = teamCount - podCount;
    const hasHead = teamCount > 6;
    const actualMembers = hasHead ? membersWithoutLeads - 1 : membersWithoutLeads;
    // Use ceil to ensure spacing accounts for largest pod (last pod gets remainder)
    const membersPerPod = Math.max(1, Math.ceil(actualMembers / podCount));

    // Calculate positioning - ensure enough space for members in each pod
    const podSpacing = Math.max(cardSpacing, membersPerPod * cardSpacing);
    const totalWidth = (podCount - 1) * podSpacing;
    const startX = 400 - totalWidth / 2;

    // Optional head for larger teams
    let headId: string | null = null;
    if (hasHead) {
      const head = createMember(industry.headTitle, 6, primaryType, null);
      nodes.push(head);
      positions.set(head.id, { x: 400, y: 30 });
      headId = head.id;
    }

    let memberIndex = 0;
    for (let p = 0; p < podCount; p++) {
      const podType = selectedTypes[p % selectedTypes.length] || primaryType;
      const podCenterX = startX + p * podSpacing;

      // Pod lead
      const leadLevel = hasHead ? 5 : 4;
      const track = hasHead ? 'manager' : 'ic';
      const lead = createMember(`${podNames[p]} Lead`, leadLevel, podType, headId, track);
      nodes.push(lead);
      positions.set(lead.id, { x: podCenterX, y: headId ? 180 : 80 });

      // Pod members
      const thisPodMembers = p < podCount - 1 ? membersPerPod : Math.max(1, actualMembers - memberIndex);
      const memberWidth = (thisPodMembers - 1) * cardSpacing;
      const membersStartX = podCenterX - memberWidth / 2;

      for (let i = 0; i < thisPodMembers && memberIndex < actualMembers; i++) {
        const memberType = selectedTypes[(memberIndex) % selectedTypes.length] || podType;
        const level = i === 0 ? 3 : 2;
        const member = createMember(`${podNames[p]} ${industry.roleTerm} ${i + 1}`, level, memberType, lead.id);
        nodes.push(member);
        positions.set(member.id, { x: membersStartX + i * cardSpacing, y: headId ? 340 : 240 });
        memberIndex++;
      }
    }
  }

  return { nodes, positions };
}

// Get default team count for a size category
const getDefaultTeamCount = (size: TeamSize): number => {
  switch (size) {
    case 'tiny': return 3;
    case 'small': return 5;
    case 'medium': return 10;
    case 'large': return 18;
    default: return 5;
  }
};

// Get min/max for team size category
const getTeamCountRange = (size: TeamSize): { min: number; max: number } => {
  switch (size) {
    case 'tiny': return { min: 2, max: 4 };
    case 'small': return { min: 4, max: 10 };
    case 'medium': return { min: 8, max: 20 };
    case 'large': return { min: 15, max: 50 };
    default: return { min: 2, max: 50 };
  }
};

export default function QuickstartWizard({ onClose }: QuickstartWizardProps) {
  const { importData, updateNodePositions } = useStore();

  const [step, setStep] = useState(0);
  const [industry, setIndustry] = useState<IndustryType>('design');
  const [teamSize, setTeamSize] = useState<TeamSize>('small');
  const [structureType, setStructureType] = useState<StructureType>('hierarchical');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [teamCount, setTeamCount] = useState(getDefaultTeamCount('small'));

  // Track when wizard starts
  useEffect(() => {
    trackQuickstartStarted();
  }, []);

  // Get current industry preset
  const currentIndustry = useMemo(() =>
    INDUSTRY_PRESETS.find(p => p.id === industry) || INDUSTRY_PRESETS[0],
    [industry]
  );

  // Reset selected types when industry changes
  const handleIndustryChange = (newIndustry: IndustryType) => {
    setIndustry(newIndustry);
    trackQuickstartIndustrySelected(newIndustry);
    const preset = INDUSTRY_PRESETS.find(p => p.id === newIndustry);
    if (preset) {
      // Pre-select first 3 role types
      setSelectedTypes(preset.roleTypes.slice(0, 3).map(t => t.id));
    }
  };

  const handleDismiss = () => {
    trackQuickstartDismissed(step);
    onClose(false);
  };

  const steps = [
    { title: 'Welcome', subtitle: 'Get started quickly' },
    { title: 'Industry', subtitle: 'What type of team?' },
    { title: 'Team Size', subtitle: 'How big is your team?' },
    { title: 'Structure', subtitle: 'How is your team organized?' },
    { title: 'Roles', subtitle: `What types of ${currentIndustry.roleTerm.toLowerCase()}s?` },
    { title: 'Ready!', subtitle: 'Preview your org map' },
  ];

  const handleApply = () => {
    const { nodes, positions } = generateTemplate(structureType, selectedTypes, currentIndustry, teamCount);

    // Filter role types to only selected ones
    const filteredTypes: DesignerTypeConfig[] = currentIndustry.roleTypes.filter(t =>
      selectedTypes.includes(t.id)
    );

    // If no types selected, use industry defaults
    const typesToUse = filteredTypes.length > 0 ? filteredTypes : currentIndustry.roleTypes;

    // Import the generated data
    importData({
      nodes,
      verticals: [],
      settings: {
        ...DEFAULT_SETTINGS,
        levels: currentIndustry.levels,
        designerTypes: typesToUse,
        teamName: currentIndustry.teamName,
      },
    });

    // Update positions
    updateNodePositions(Array.from(positions.entries()).map(([id, pos]) => ({
      id,
      x: pos.x,
      y: pos.y,
    })));

    // Track completion
    trackQuickstartCompleted({
      industry,
      teamSize: teamCount,
      structure: structureType,
      roleTypes: selectedTypes,
    });

    onClose(true); // Completed the wizard
  };

  const handleTeamSizeChange = (size: TeamSize) => {
    setTeamSize(size);
    const newCount = getDefaultTeamCount(size);
    setTeamCount(newCount);
    trackQuickstartTeamSizeSelected(size, newCount);
  };

  const handleStructureChange = (structure: StructureType) => {
    setStructureType(structure);
    trackQuickstartStructureSelected(structure);
  };

  const handleTypeToggleWithTracking = (typeId: string) => {
    const newTypes = selectedTypes.includes(typeId)
      ? selectedTypes.filter(t => t !== typeId)
      : [...selectedTypes, typeId];
    setSelectedTypes(newTypes);
    trackQuickstartRoleTypeSelected(newTypes);
  };

  const teamSizeOptions: { value: TeamSize; label: string; description: string }[] = [
    { value: 'tiny', label: 'Tiny', description: '2-4 people' },
    { value: 'small', label: 'Small', description: '4-10 people' },
    { value: 'medium', label: 'Medium', description: '8-20 people' },
    { value: 'large', label: 'Large', description: '15+ people' },
  ];

  const structureOptions: { value: StructureType; label: string; description: string }[] = [
    { value: 'flat', label: 'Flat', description: 'Minimal hierarchy, one lead' },
    { value: 'hierarchical', label: 'Hierarchical', description: 'Clear levels & managers' },
    { value: 'pods', label: 'Pod-based', description: 'Small autonomous squads' },
  ];

  const teamCountRange = getTeamCountRange(teamSize);

  return (
    <div className={styles.overlay} onClick={handleDismiss}>
      <div className={styles.wizard} onClick={(e) => e.stopPropagation()}>
        {/* Header - only show on non-welcome steps */}
        {step === 0 ? (
          <div className={styles.headerMinimal}>
            <button className={styles.closeBtn} onClick={handleDismiss} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className={styles.header}>
            <div>
              <h2 className={styles.title}>{steps[step].title}</h2>
              <p className={styles.subtitle}>{steps[step].subtitle}</p>
            </div>
            <button className={styles.closeBtn} onClick={handleDismiss} aria-label="Close">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Content */}
        <div className={styles.content}>
          {step === 0 && (
            <div className={styles.welcomeStep}>
              <div className={styles.welcomeIcon}>
                <img src="/design-team-mapper.svg" alt="Org Mapper" />
              </div>
              <h3 className={styles.welcomeTitle}>Build your org map in seconds</h3>
              <p className={styles.welcomeDesc}>
                Answer a few quick questions and we'll create a starter org chart
                tailored to your team's industry, size, and structure. You can customize
                everything afterwards.
              </p>
              <ul className={styles.welcomeList}>
                <li>Choose your industry or field</li>
                <li>Select your team size</li>
                <li>Pick an organizational structure</li>
                <li>Get a ready-to-customize org map</li>
              </ul>
            </div>
          )}

          {step === 1 && (
            <div className={styles.industryGrid}>
              {INDUSTRY_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  className={`${styles.industryCard} ${industry === preset.id ? styles.selected : ''}`}
                  onClick={() => handleIndustryChange(preset.id)}
                >
                  <span className={styles.industryIcon}>{preset.icon}</span>
                  <div className={styles.industryInfo}>
                    <span className={styles.industryName}>{preset.name}</span>
                    <span className={styles.industryDesc}>{preset.description}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className={styles.optionsGrid}>
              {teamSizeOptions.map((option) => (
                <button
                  key={option.value}
                  className={`${styles.optionCard} ${teamSize === option.value ? styles.selected : ''}`}
                  onClick={() => handleTeamSizeChange(option.value)}
                >
                  <div className={styles.optionIllustration}>
                    {TeamSizeIllustrations[option.value]}
                  </div>
                  <div className={styles.optionInfo}>
                    <span className={styles.optionLabel}>{option.label}</span>
                    <span className={styles.optionDesc}>{option.description}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className={styles.optionsGrid}>
              {structureOptions.map((option) => (
                <button
                  key={option.value}
                  className={`${styles.optionCard} ${styles.wide} ${structureType === option.value ? styles.selected : ''}`}
                  onClick={() => handleStructureChange(option.value)}
                >
                  <div className={styles.optionIllustration}>
                    {StructureIllustrations[option.value]}
                  </div>
                  <div className={styles.optionInfo}>
                    <span className={styles.optionLabel}>{option.label}</span>
                    <span className={styles.optionDesc}>{option.description}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className={styles.typesStep}>
              <p className={styles.typesHint}>Select the role types in your team</p>
              <div className={styles.typesGrid}>
                {currentIndustry.roleTypes.map((type) => (
                  <button
                    key={type.id}
                    className={`${styles.typeChip} ${selectedTypes.includes(type.id) ? styles.selected : ''}`}
                    onClick={() => handleTypeToggleWithTracking(type.id)}
                  >
                    <span className={styles.typeAbbr}>{type.abbreviation}</span>
                    <span className={styles.typeName}>{type.name}</span>
                  </button>
                ))}
              </div>
              {selectedTypes.length === 0 && (
                <p className={styles.typesWarning}>Select at least one role type</p>
              )}
            </div>
          )}

          {step === 5 && (
            <div className={styles.previewStep}>
              {/* Left side: Illustration and team count */}
              <div className={styles.previewLeft}>
                <div className={styles.previewIllustration}>
                  {structureType === 'flat' && StructureIllustrations.flat}
                  {structureType === 'hierarchical' && StructureIllustrations.hierarchical}
                  {structureType === 'pods' && StructureIllustrations.pods}
                </div>
                <div className={styles.teamCountControl}>
                  <label className={styles.teamCountLabel}>Team size</label>
                  <div className={styles.teamCountStepper}>
                    <button
                      className={styles.stepperBtn}
                      onClick={() => setTeamCount(Math.max(teamCountRange.min, teamCount - 1))}
                      disabled={teamCount <= teamCountRange.min}
                    >
                      −
                    </button>
                    <span className={styles.teamCountValue}>{teamCount}</span>
                    <button
                      className={styles.stepperBtn}
                      onClick={() => setTeamCount(Math.min(teamCountRange.max, teamCount + 1))}
                      disabled={teamCount >= teamCountRange.max}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Right side: Summary */}
              <div className={styles.previewRight}>
                <div className={styles.previewSummaryItem}>
                  <span className={styles.summaryLabel}>Industry</span>
                  <span className={styles.summaryValue}>{currentIndustry.name}</span>
                </div>
                <div className={styles.previewSummaryItem}>
                  <span className={styles.summaryLabel}>Structure</span>
                  <span className={styles.summaryValue}>{structureOptions.find(o => o.value === structureType)?.label}</span>
                </div>
                <div className={styles.previewSummaryItem}>
                  <span className={styles.summaryLabel}>Roles</span>
                  <span className={styles.summaryValue}>
                    {selectedTypes.map(t => currentIndustry.roleTypes.find(rt => rt.id === t)?.abbreviation).join(', ')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer with progress dots between buttons */}
        <div className={styles.footer}>
          <div className={styles.footerActions}>
            {step > 0 ? (
              <button className={styles.backBtn} onClick={() => setStep(step - 1)}>
                Back
              </button>
            ) : (
              <div className={styles.footerSpacer} />
            )}

            {/* Progress dots in center */}
            <div className={styles.progress}>
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`${styles.progressDot} ${index <= step ? styles.active : ''} ${index < step ? styles.completed : ''}`}
                />
              ))}
            </div>

            {step < steps.length - 1 ? (
              <button
                className={styles.nextBtn}
                onClick={() => setStep(step + 1)}
                disabled={step === 4 && selectedTypes.length === 0}
              >
                {step === 0 ? "Let's go" : 'Next'}
              </button>
            ) : (
              <button className={styles.applyBtn} onClick={handleApply}>
                Create
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

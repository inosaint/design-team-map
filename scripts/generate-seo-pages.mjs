import { mkdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = process.env.SEO_SITE || 'https://mapyour.org';

// Full preset data (mirrors INDUSTRY_PRESETS in src/components/QuickstartWizard.tsx) -
// kept here in full (ids/colors/tracks) so we can both list roles/levels as text AND
// build a real example chart payload for the "Build your own..." CTA link.
const INDUSTRIES = [
  {
    slug: 'design', name: 'Design', icon: '🎨', description: 'UX, UI, Product Design teams',
    teamName: 'Design Team', roleTerm: 'Designer', headTitle: 'Head of Design',
    chartImage: { file: 'design-org-chart/design-org-chart', width: 960, height: 446 },
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
    slug: 'engineering', name: 'Engineering', icon: '💻', description: 'Software, DevOps, QA teams',
    teamName: 'Engineering Team', roleTerm: 'Engineer', headTitle: 'VP Engineering',
    chartImage: { file: 'engineering-org-chart/engineering-org-chart', width: 960, height: 585 },
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
    slug: 'product', name: 'Product', icon: '📦', description: 'Product Management teams',
    teamName: 'Product Team', roleTerm: 'PM', headTitle: 'Chief Product Officer',
    chartImage: { file: 'product-org-chart/product-org-chart', width: 960, height: 558 },
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
    slug: 'sales', name: 'Sales', icon: '💼', description: 'Sales & Business Development',
    teamName: 'Sales Team', roleTerm: 'Rep', headTitle: 'VP Sales',
    chartImage: { file: 'sales-org-chart/sales-org-chart', width: 960, height: 611 },
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
    slug: 'marketing', name: 'Marketing', icon: '📢', description: 'Marketing & Communications',
    teamName: 'Marketing Team', roleTerm: 'Marketer', headTitle: 'CMO',
    chartImage: { file: 'marketing-org-chart/marketing-org-chart', width: 960, height: 622 },
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
    slug: 'hr', name: 'People/HR', icon: '👥', description: 'HR & People Operations',
    teamName: 'People Team', roleTerm: 'Specialist', headTitle: 'Chief People Officer',
    chartImage: { file: 'hr-org-chart/hr-org-chart', width: 960, height: 615 },
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
    slug: 'finance', name: 'Finance', icon: '💰', description: 'Finance & Accounting teams',
    teamName: 'Finance Team', roleTerm: 'Analyst', headTitle: 'CFO',
    chartImage: { file: 'finance-org-chart/finance-org-chart', width: 960, height: 572 },
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
    slug: 'healthcare', name: 'Healthcare', icon: '🏥', description: 'Medical & Healthcare teams',
    teamName: 'Medical Team', roleTerm: 'Clinician', headTitle: 'Chief Medical Officer',
    chartImage: { file: 'healthcare-org-chart/healthcare-org-chart', width: 960, height: 556 },
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
    slug: 'legal', name: 'Legal', icon: '⚖️', description: 'Law firms & Legal teams',
    teamName: 'Legal Team', roleTerm: 'Attorney', headTitle: 'General Counsel',
    chartImage: { file: 'legal-org-chart/legal-org-chart', width: 960, height: 646 },
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
    slug: 'construction', name: 'Construction', icon: '🏗️', description: 'Construction & Building teams',
    teamName: 'Construction Team', roleTerm: 'Worker', headTitle: 'Construction Director',
    chartImage: { file: 'construction-org-chart/construction-org-chart', width: 960, height: 568 },
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
    slug: 'education', name: 'Education', icon: '📚', description: 'Schools & Educational institutions',
    teamName: 'Faculty', roleTerm: 'Educator', headTitle: 'Dean',
    chartImage: { file: 'education-org-chart/education-org-chart', width: 960, height: 599 },
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
];

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function encodeChartForUrl(data) {
  const bytes = Buffer.from(JSON.stringify(data), 'utf-8');
  return bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function buildExampleChart(ind) {
  const headLevel = ind.levels.find((l) => l.isMaxLevel);
  const report1Level = ind.levels.find((l) => l.level === 2) || ind.levels[1];
  const report2Level = ind.levels.find((l) => l.level === 3) || ind.levels[2] || ind.levels[1];

  return {
    nodes: [
      { id: 'head', name: 'Sample Lead', designerType: ind.roleTypes[0].id, level: headLevel.level, track: headLevel.track, yearsOfExperience: 8, managerId: null, isPlannedHire: false },
      { id: 'report-1', name: 'Sample Report 1', designerType: ind.roleTypes[0].id, level: report1Level.level, track: report1Level.track, yearsOfExperience: 2, managerId: 'head', isPlannedHire: false },
      { id: 'report-2', name: 'Sample Report 2', designerType: (ind.roleTypes[1] || ind.roleTypes[0]).id, level: report2Level.level, track: report2Level.track, yearsOfExperience: 1, managerId: 'head', isPlannedHire: false },
    ],
    verticals: [],
    settings: {
      levels: ind.levels,
      designerTypes: ind.roleTypes,
      spanOfControlThreshold: 6,
      trackSplitLevel: 4,
      teamName: ind.teamName,
    },
  };
}

function page(ind, all) {
  const url = `${SITE}/${ind.slug}-org-chart/`;
  const title = `${ind.name} Org Chart Template | Org Mapper`;
  const description = `Free ${ind.name.toLowerCase()} org chart template. See common ${ind.roleTerm.toLowerCase()} roles and career levels from entry level up to ${ind.headTitle}, then build your own in minutes.`;
  const others = all.filter((o) => o.slug !== ind.slug);
  const exampleChartUrl = `${SITE}/?chart=${encodeChartForUrl(buildExampleChart(ind))}`;

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${url}" />
    <link rel="icon" type="image/svg+xml" href="/org-mapper.svg" />
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${SITE}/${ind.chartImage ? `${ind.chartImage.file}.png` : 'design-team-mapper.png'}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 720px; margin: 0 auto; padding: 32px 20px 64px; color: #1f2933; line-height: 1.5; }
      h1 { font-size: 28px; margin-bottom: 8px; }
      .sub { color: #52606d; margin-top: 0; }
      p a { color: #f97316; font-weight: 600; text-decoration: none; }
      p a:hover { text-decoration: underline; }
      .chart-preview { text-align: left; margin: 28px 0; }
      .chart-preview img { border-radius: 12px; }
      .chart-preview img.icon { width: 160px; height: 160px; }
      .chart-preview img.screenshot { max-width: 460px; width: 100%; height: auto; border: 1px solid #e4e7eb; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
      .chart-preview p { font-size: 13px; color: #7b8794; margin-top: 8px; }
      h2 { font-size: 18px; margin-top: 32px; }
      ul { padding-left: 20px; }
      li { margin-bottom: 4px; }
      .cta-row { text-align: left; margin-top: 20px; }
      .cta { display: inline-block; padding: 12px 20px; background: #f97316; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; }
      .cta-secondary { display: inline-block; margin-left: 12px; padding: 12px 20px; color: #f97316; text-decoration: none; border-radius: 8px; font-weight: 600; border: 1px solid #f97316; }
      .columns { display: flex; gap: 40px; margin-top: 32px; }
      .columns > div { flex: 1; min-width: 0; }
      .columns h2 { margin-top: 0; }
      footer { margin-top: 56px; padding-top: 20px; border-top: 1px solid #e4e7eb; font-size: 13px; color: #7b8794; }
      footer a { color: #52606d; }
      .other-links { display: flex; flex-wrap: wrap; gap: 6px 14px; padding: 0; list-style: none; }
      @media (max-width: 520px) {
        .columns { flex-direction: column; gap: 0; }
      }
    </style>
  </head>
  <body>
    <p class="sub">${ind.icon} ${esc(ind.description)}</p>
    <h1>${esc(ind.name)} Org Chart Template</h1>
    <p>Mapping out a ${esc(ind.teamName.toLowerCase())}? Here's a typical reporting structure, from entry-level ${esc(ind.roleTerm.toLowerCase())} roles up to the ${esc(ind.headTitle)}, plus the ${esc(ind.roleTerm.toLowerCase())} specialties you'll usually find on a team like this.</p>
    <p>Use <a href="/">MapYour.org</a> to create and customize your own org chart for free. Your data stays in your browser &mdash; nothing is sent to a server, and you can export it anytime from Settings as a JSON file or a chart image.</p>

    <div class="chart-preview">
      ${ind.chartImage
        ? `<picture>
        <source srcset="/${ind.chartImage.file}.webp" type="image/webp" />
        <img class="screenshot" src="/${ind.chartImage.file}.png" alt="Example ${esc(ind.name.toLowerCase())} org chart showing ${esc(ind.headTitle)} with reports" width="${ind.chartImage.width}" height="${ind.chartImage.height}" loading="lazy" />
      </picture>`
        : `<img class="icon" src="/design-team-mapper.png" alt="Sample org chart preview for a ${esc(ind.name.toLowerCase())} team" width="160" height="160" />`}
    </div>

    <div class="cta-row">
      <a class="cta" href="${exampleChartUrl}">See a live ${esc(ind.name.toLowerCase())} example &rarr;</a>
      <a class="cta-secondary" href="/">Try for free</a>
    </div>

    <div class="columns">
      <div>
        <h2>Career levels</h2>
        <ul>
          ${ind.levels.map((l) => `<li>${esc(l.name)}</li>`).join('\n          ')}
        </ul>
      </div>
      <div>
        <h2>Common ${esc(ind.name)} roles</h2>
        <ul>
          ${ind.roleTypes.map((r) => `<li>${esc(r.name)}</li>`).join('\n          ')}
        </ul>
      </div>
    </div>

    <footer>
      <p>Other org chart templates:</p>
      <ul class="other-links">
        ${others.map((o) => `<li><a href="/${o.slug}-org-chart/">${esc(o.name)}</a></li>`).join('\n        ')}
      </ul>
    </footer>
  </body>
</html>
`;
}

for (const ind of INDUSTRIES) {
  const dir = join(REPO, 'public', `${ind.slug}-org-chart`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), page(ind, INDUSTRIES));
  console.log('wrote', dir);
}

const sitemapUrls = [
  `${SITE}/`,
  ...INDUSTRIES.map((i) => `${SITE}/${i.slug}-org-chart/`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;
writeFileSync(join(REPO, 'public', 'sitemap.xml'), sitemap);

const robots = `User-agent: *
Allow: /

Sitemap: ${SITE}/sitemap.xml
`;
writeFileSync(join(REPO, 'public', 'robots.txt'), robots);

console.log('done');

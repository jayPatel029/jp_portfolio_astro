export type ProjectCluster = 'vision' | 'document-ai' | 'llm-agents' | 'systems';

export interface ExternalLinkItem {
  label: string;
  href: string;
}

export interface Education {
  school: string;
  degree: string;
  location: string;
  start: string;
  end: string;
  grade: string;
}

export interface SkillGroup {
  layer: string;
  items: string[];
}

export interface Experience {
  role: string;
  company: string;
  location?: string;
  start: string;
  /** `null` means the role is current. */
  end: string | null;
  /** Model-card framing label shown above the role, e.g. "production". */
  stage: string;
  highlights: string[];
}

export interface Metric {
  value: string;
  label: string;
  source: string;
}

export interface Project {
  slug: string;
  title: string;
  cluster: ProjectCluster;
  origin: string;
  summary: string;
  highlights: string[];
  stack: string[];
  links: ExternalLinkItem[];
}

export interface ArchiveItem {
  title: string;
  description: string;
  stack: string[];
  href: string;
}

export interface Achievement {
  title: string;
  description: string;
}

export interface Profile {
  name: string;
  initials: string;
  role: string;
  headline: string;
  summary: string;
  location: string;
  status: string;
  email: string;
  cvUrl: string;
  socials: ExternalLinkItem[];
  education: Education;
  skills: SkillGroup[];
  experience: Experience[];
  metrics: Metric[];
  projects: Project[];
  archive: ArchiveItem[];
  achievements: Achievement[];
}

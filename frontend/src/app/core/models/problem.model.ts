export interface Problem {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard' | string;
  language: 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'csharp' | string;
  starterCode?: string;
  topics?: string[];
  createdAt?: string;
  updatedAt?: string;
}

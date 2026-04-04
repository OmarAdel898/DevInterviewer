export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'interviewer'|'user';
  createdAt?: string;
}
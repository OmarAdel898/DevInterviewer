import { User } from './user.model';

export interface AuthResponse {
  success: boolean;
  message: string;
  accessToken?: string;
  refreshToken?: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest extends Omit<User, 'id' | 'role'> {
  password: string;
  role?: 'admin' | 'interviewer';
}
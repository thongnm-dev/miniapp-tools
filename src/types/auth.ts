import { MenuItem } from "./menu";
import { RegisterCredentials } from "./user";

export interface User {
  id?: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  avatar?: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  menuItems: MenuItem[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  register: (credentials: RegisterCredentials) => Promise<boolean>;
} 
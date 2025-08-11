import React, { createContext, useContext, useReducer } from 'react';
import { User, LoginCredentials, AuthState, AuthContextType } from '../types/auth';
import { loginController } from '../controller/login-controller';
import { RegisterCredentials } from '../types/user';
import { MenuItem } from '../types/menu';

// define the action type
type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESTORE_SESSION'; payload: User }
  | { type: 'REGISTER_START' }
  | { type: 'REGISTER_SUCCESS'; payload: User }
  | { type: 'REGISTER_FAILURE'; payload: string };

// define the initial state
const initialState: AuthState = {
  user: null,
  menuItems: [] as MenuItem[],
  isAuthenticated: false,
  isLoading: false,
  error: null
};

// define the reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    case 'RESTORE_SESSION':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'REGISTER_START':
      return {
        ...state,
        isLoading: true,
        error: null
      };
    case 'REGISTER_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };
    case 'REGISTER_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };
    default:
      return state;
  }
};

// define the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// define the hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check for existing session on app load
  const login = async (credentials: LoginCredentials): Promise<boolean> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // Simulate API delay
      localStorage.removeItem("user");
      localStorage.removeItem("menuItems");
      const result = await loginController.login(credentials);
      if (result.success) {
        dispatch({ type: 'LOGIN_SUCCESS', payload: result.user as User });
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('menuItems', JSON.stringify(result.menuItems));
        return true;
      } else {
        dispatch({ type: 'LOGIN_FAILURE', payload: 'Tên đăng nhập hoặc mật khẩu không đúng.' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE', payload: 'Đăng nhập thất bại. Vui lòng thử lại.' });
      return false;
    }
  };

  const register = async (credentials: RegisterCredentials): Promise<boolean> => {
    dispatch({ type: 'REGISTER_START' });
    try {
      const result = await loginController.register(credentials);
      if (result.success && result.user) {
        dispatch({ type: 'REGISTER_SUCCESS', payload: result.user as User });
        localStorage.setItem('user', JSON.stringify(result.user));
        return true;
      } else {
        dispatch({ type: 'REGISTER_FAILURE', payload: result.message || 'Đăng ký tài khoản thất bại.' });
        return false;
      }
    } catch (error) {
      dispatch({ type: 'REGISTER_FAILURE', payload: 'Đăng ký tài khoản thất bại. Vui lòng thử lại.' });
      return false;
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    localStorage.removeItem('user');
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    register,
    clearError,
    isLoading: state.isLoading,
    error: state.error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
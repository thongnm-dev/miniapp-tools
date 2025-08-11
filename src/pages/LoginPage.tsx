import React, { useState, useEffect } from 'react';
import { useAuth } from '../stores/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { APP_CONFIG } from '../config/config';
import { ArrowRightEndOnRectangleIcon, EyeIcon, EyeSlashIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import Button from '../components/ui/Button';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  const [credentials, setCredentials] = useState({
    username: 'thongnm',
    password: '123'
    // username: 'nhudtq',
    // password: 'nhudtq#123'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    // Clear any existing errors when component mounts
    clearError();
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      return;
    }

    setIsSuccess(false);
    const success = await login(credentials);
    if (success) {
      setIsSuccess(true);
      // Small delay to show success message before redirect
      setTimeout(() => {
        const from = (location.state as any)?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }, 500);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-300 via-gray-200 to-secondary-300 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-lg mb-6">
            <div className="w-10 h-10rounded-lg flex items-center justify-center">
              <span className="font-bold text-lg">WS</span>
            </div>
          </div>
          <h2 className="text-3xl font-bold mb-2">
            Chào mừng bạn trở lại
          </h2>
          <p>
            Đăng nhập để truy cập ứng dụng {APP_CONFIG.name}.
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-secondary-700 mb-2">
                Tên đăng nhập
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className='h-5 w-5'/>
                </div>
                <input
                  id="username"
                  type="text"
                  value={credentials.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-organe-400 focus:border-transparent"
                  placeholder="Tên đăng nhập của bạn"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className='h-5 w-5'/>
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={credentials.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-organe-400 focus:border-transparent"
                  placeholder="Mật khẩu của bạn"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  <svg className="h-5 w-5 text-secondary-400 hover:text-secondary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showPassword ? (
                      <EyeIcon className='h-3 w-4'/>
                    ) : (
                      <EyeSlashIcon className='h-3 w-4'/>
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message */}
            {isSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-green-700">Đăng nhập thành công! Đang điều hướng...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading || !credentials.username || !credentials.password}
              className="w-full flex justify-center py-3 px-4 rounded-lg
                        font-medium disabled:cursor-not-allowed transition-colors gap-3">
              {isLoading ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang đăng nhập...
                </div>
              ) : (
                <React.Fragment>
                  <ArrowRightEndOnRectangleIcon className='h-5 w-5'/>
                  Đăng nhập
                </React.Fragment>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        {false && <div className="text-center mt-4">
          <span className="text-primary-200">Bạn đã có tài khoản chưa? </span>
          <Link to="/register" className="text-primary-600 hover:underline">Đăng ký ngay</Link>
        </div>}
        <div className="text-center">
          <p className="text-sm">
            © 2024 {APP_CONFIG.name}. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login; 
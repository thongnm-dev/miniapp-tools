import React, { useState } from 'react';
import { RegisterCredentials } from '../types/user';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../stores/AuthContext';
import { useLoading } from '../stores/LoadingContext';
import { showNotification } from '../components/notification';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const [form, setForm] = useState<RegisterCredentials>({
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    showLoading("Registering...");
    try {
      const { confirmPassword, ...registerData } = form;
      const result = await register(registerData as RegisterCredentials);
      if (result) {
        showNotification('Registration successful! Redirecting to login...', 'success');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        showNotification('Registration failed.', 'error');
      }
    } catch (err) {
      showNotification('Registration failed.', 'error');
    } finally {
      hideLoading();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 via-primary-700 to-secondary-800 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Register</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        {success && <div className="mb-4 text-green-500">{success}</div>}
        {/* <div className="mb-4">
          <label className="block mb-1">Name</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
        </div> */}
        <div className="mb-4">
          <label className="block mb-1">Username</label>
          <input type="text" name="username" value={form.username} onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
        </div>
        <div className="mb-4">
          <label className="block mb-1">Password</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
        </div>
        <div className="mb-6">
          <label className="block mb-1">Confirm Password</label>
          <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required className="w-full px-3 py-2 border rounded" />
        </div>
        <button type="submit" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-secondary-300 disabled:cursor-not-allowed transition-colors">
            Register
        </button>
        <div className="mt-4 text-center">
          <span>Already have an account? </span>
          <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
        </div>
      </form>
    </div>
  );
};

export default RegisterPage; 
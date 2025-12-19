import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login berhasil!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#064E3B] to-[#022C22] p-4">
      <div className="absolute inset-0 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1746173098263-8262c7725b1e?crop=entropy&cs=srgb&fm=jpg&q=85"
          alt="Luxury Office"
          className="w-full h-full object-cover opacity-10"
        />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="glass-card rounded-2xl p-8 lg:p-12">
          <div className="text-center mb-8">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#D4AF37] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              MBA
            </h1>
            <p className="text-[#6EE7B7]">Money Changer System</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-[#FEF3C7] font-medium mb-2">
                Email
              </label>
              <input
                id="email"
                data-testid="login-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-[#FEF3C7] placeholder:text-[#6EE7B7]/50 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 transition-all duration-300"
                placeholder="contoh@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-[#FEF3C7] font-medium mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  data-testid="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg text-[#FEF3C7] placeholder:text-[#6EE7B7]/50 focus:border-[#D4AF37]/50 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 transition-all duration-300"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6EE7B7] hover:text-[#FEF3C7] transition-colors duration-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              data-testid="login-submit-button"
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 hover:-translate-y-0.5"
            >
              {loading ? 'Masuk...' : 'Masuk'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[#6EE7B7] text-sm">
              Belum punya akun? Hubungi administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
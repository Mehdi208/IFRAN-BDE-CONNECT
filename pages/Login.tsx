
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Navbar from '../components/Navbar';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Vérification si Firebase Auth est configuré
    if (!auth) {
        // Fallback mode démo si Firebase mal configuré
        if (email === 'admin' && password === 'admin') {
            localStorage.setItem('isAuthenticated', 'true');
            navigate('/admin/dashboard');
        } else {
            setError("Firebase Auth non configuré. En mode démo, utilisez admin/admin.");
        }
        setLoading(false);
        return;
    }

    try {
        await signInWithEmailAndPassword(auth, email, password);
        // Si succès
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/admin/dashboard');
    } catch (err: any) {
        console.error("Erreur login:", err);
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
            setError('Email ou mot de passe incorrect.');
        } else if (err.code === 'auth/too-many-requests') {
            setError('Trop de tentatives. Veuillez patienter.');
        } else {
            setError('Erreur de connexion. Vérifiez votre connexion internet.');
        }
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto mb-6 flex justify-center items-center">
               <div className="w-24 h-24 bg-white rounded-full shadow-lg flex items-center justify-center overflow-hidden border-4 border-bde-navy/10 p-1">
                 {!logoError ? (
                    <img 
                        src="/logo.png?v=4" 
                        alt="Logo BDE" 
                        className="w-full h-full object-cover rounded-full"
                        onError={() => setLogoError(true)}
                    />
                 ) : (
                    <div className="bg-bde-navy w-full h-full flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">BDE</span>
                    </div>
                 )}
               </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Espace Administrateur</h2>
            <p className="text-gray-500 text-sm mt-2">Veuillez vous authentifier pour accéder au tableau de bord</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm text-center border border-red-100 flex items-center justify-center gap-2">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bde-rose focus:border-transparent outline-none transition"
                  placeholder="nom.prenom@ifran.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={18} className="text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bde-rose focus:border-transparent outline-none transition"
                  placeholder="••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-bde-navy hover:bg-blue-900 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center"
            >
              {loading ? (
                <span className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center">
             <button onClick={() => navigate('/')} className="text-sm text-gray-500 hover:text-bde-rose">
               Retour au site public
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

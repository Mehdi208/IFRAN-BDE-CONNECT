import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, ShieldCheck, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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
               <div className="bg-bde-navy p-5 rounded-full shadow-lg">
                 <ShieldCheck size={48} className="text-bde-rose" />
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
                  type="text" // Type text pour permettre "admin" en fallback, sinon "email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bde-rose focus:border-transparent outline-none transition"
                  placeholder="utilisateur@exemple.com"
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
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-bde-rose focus:border-transparent outline-none transition"
                  placeholder="••••••"
                  required
                />
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
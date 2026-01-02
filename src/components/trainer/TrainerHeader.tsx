import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, User, ChevronDown, Settings, Home } from 'lucide-react';

export function TrainerHeader() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName = profile?.full_name || user?.email || 'Utilisateur';
  const userInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo / Title */}
          <div className="flex items-center">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900">SCINNOVA - LMS</h1>
              <p className="text-xs text-gray-500 mt-0.5">La soif d'apprendre</p>
            </div>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center gap-3 rounded-lg px-4 py-2 hover:bg-gray-100"
            >
              {/* Avatar */}
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
                {userInitials}
              </div>

              {/* User info */}
              <div className="hidden text-left md:block">
                <p className="text-sm font-medium text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">
                  {profile?.role === 'admin' ? 'Administrateur' : 'Formateur'}
                </p>
              </div>

              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg">
                  <div className="p-4 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{displayName}</p>
                    <p className="text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <Link
                      to="/app"
                      onClick={() => setShowMenu(false)}
                      className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Home className="h-4 w-4" />
                      Portail principal
                    </Link>
                    <button
                      onClick={() => {
                        setShowMenu(false);
                        navigate('/app');
                      }}
                      className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <User className="h-4 w-4" />
                      Mon profil
                    </button>
                    {profile?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setShowMenu(false)}
                        className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="h-4 w-4" />
                        Administration
                      </Link>
                    )}
                    <div className="border-t border-gray-200 my-2" />
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Déconnexion
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}


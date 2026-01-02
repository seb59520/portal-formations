import { useState } from 'react';
import { AppHeader } from '../../components/AppHeader';
import { AdminCoursesContent } from './AdminCoursesContent';
import { AdminProgramsContent } from './AdminProgramsContent';
import { AdminUsersContent } from './AdminUsersContent';
import { AdminOrgsContent } from './AdminOrgsContent';
import { AdminItemsContent } from './AdminItemsContent';
import { BookOpen, Layers, Users, Building2, FileText } from 'lucide-react';
import '../../styles/admin-unified.css';

type AdminTab = 'courses' | 'programs' | 'users' | 'orgs' | 'items';

export function AdminUnified() {
  const [activeTab, setActiveTab] = useState<AdminTab>('courses');

  const tabs = [
    { id: 'courses' as AdminTab, label: 'Formations', icon: BookOpen },
    { id: 'programs' as AdminTab, label: 'Programmes', icon: Layers },
    { id: 'users' as AdminTab, label: 'Utilisateurs', icon: Users },
    { id: 'orgs' as AdminTab, label: 'Organisations', icon: Building2 },
    { id: 'items' as AdminTab, label: 'Éléments', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="SCINNOVA - LMS" />
      
      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      isActive
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="admin-unified">
        {activeTab === 'courses' && <AdminCoursesContent />}
        {activeTab === 'programs' && <AdminProgramsContent />}
        {activeTab === 'users' && <AdminUsersContent />}
        {activeTab === 'orgs' && <AdminOrgsContent />}
        {activeTab === 'items' && <AdminItemsContent />}
      </div>
    </div>
  );
}


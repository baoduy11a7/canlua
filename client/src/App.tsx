import React, { useState, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useConfigStore } from './store/configStore';
import { LoginPage } from './pages/LoginPage';
import { AppLayout } from './components/layout/AppLayout';
import { ActiveTab } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { WeighingStationPage } from './pages/WeighingStationPage';
import { SessionsListPage } from './pages/SessionsListPage';
import { HouseholdsPage } from './pages/HouseholdsPage';
import { WarehousePage } from './pages/WarehousePage';
import { FinancePage } from './pages/FinancePage';
import { RiceTypesPage } from './pages/RiceTypesPage';
import { UsersPage } from './pages/UsersPage';
import { NewSessionModal } from './components/modals/NewSessionModal';
import { Toaster } from 'sonner';

export const App: React.FC = () => {
  const { isAuthenticated, initAuth } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ActiveTab>('weighing');
  const [selectedSessionIdForWeighing, setSelectedSessionIdForWeighing] = useState<string | undefined>();
  const [isGlobalNewSessionModalOpen, setIsGlobalNewSessionModalOpen] = useState(false);

  useEffect(() => {
    initAuth();
    // Bỏ màn hình bóng tối, mặc định luôn ở chế độ sáng rõ ràng
    document.documentElement.classList.remove('dark');
    try {
      localStorage.removeItem('canlua_dark');
    } catch {
      //
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <>
        <Toaster position="top-right" richColors />
        <LoginPage />
      </>
    );
  }

  const handleSelectSessionToWeigh = (sessionId: string) => {
    setSelectedSessionIdForWeighing(sessionId);
    setActiveTab('weighing');
  };

  return (
    <>
      <Toaster position="top-right" richColors />

      <AppLayout
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
        }}
        onOpenNewSession={() => setIsGlobalNewSessionModalOpen(true)}
      >
        {activeTab === 'weighing' && (
          <WeighingStationPage initialSessionId={selectedSessionIdForWeighing} />
        )}

        {activeTab === 'dashboard' && (
          <DashboardPage
            onNavigateToWeighing={(sId) => {
              if (sId) setSelectedSessionIdForWeighing(sId);
              setActiveTab('weighing');
            }}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'sessions' && (
          <SessionsListPage
            onSelectSessionToWeigh={handleSelectSessionToWeigh}
            onOpenNewSession={() => setIsGlobalNewSessionModalOpen(true)}
          />
        )}

        {activeTab === 'households' && (
          <HouseholdsPage onSelectSessionToWeigh={handleSelectSessionToWeigh} />
        )}

        {activeTab === 'warehouse' && <WarehousePage />}

        {activeTab === 'finance' && <FinancePage />}

        {activeTab === 'rice-types' && <RiceTypesPage />}
        {activeTab === 'users' && <UsersPage />}
      </AppLayout>

      <NewSessionModal
        isOpen={isGlobalNewSessionModalOpen}
        onClose={() => setIsGlobalNewSessionModalOpen(false)}
        onSessionCreated={(session) => {
          setSelectedSessionIdForWeighing(session._id);
          setActiveTab('weighing');
        }}
      />
    </>
  );
};

export default App;

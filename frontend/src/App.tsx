import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WebSocketProvider, useWebSocket } from './context/WebSocketContext';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { api } from './services/api';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { BedManagementPage } from './pages/BedManagementPage';
import { HospitalBedMapPage } from './pages/HospitalBedMapPage';
import { PatientManagementPage } from './pages/PatientManagementPage';
import { PatientDetailsPage } from './pages/PatientDetailsPage';
import { BedRecommendationsPage } from './pages/BedRecommendationsPage';
import { AlertsCenterPage } from './pages/AlertsCenterPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SurgeSimulatorPage } from './pages/SurgeSimulatorPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { AdminLoginPage } from './pages/AdminLoginPage';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { lastEvent } = useWebSocket();
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [pageParams, setPageParams] = useState<any>({});
  const [activeAlertCount, setActiveAlertCount] = useState<number>(0);
  const [loginMode, setLoginMode] = useState<'staff' | 'admin'>('staff');

  // Poll / fetch active alerts count
  const fetchAlertCount = async () => {
    try {
      const alerts = await api.getAlerts({ status: 'Active' });
      setActiveAlertCount(alerts.length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchAlertCount();
  }, []);

  useEffect(() => {
    if (lastEvent) {
      fetchAlertCount();
    }
  }, [lastEvent]);

  const handleNavigate = (page: string, params: any = {}) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080d1a] flex items-center justify-center text-slate-400 font-mono text-xs">
        Initializing MediFlow Operations Node...
      </div>
    );
  }

  if (!user) {
    if (loginMode === 'admin') {
      return (
        <AdminLoginPage
          onLoginSuccess={() => setCurrentPage('dashboard')}
          onSwitchToStaffLogin={() => setLoginMode('staff')}
        />
      );
    }
    return (
      <LoginPage
        onLoginSuccess={() => setCurrentPage('dashboard')}
        onNavigateToAdminLogin={() => setLoginMode('admin')}
      />
    );
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage onNavigate={handleNavigate} />;
      case 'beds':
        return <BedManagementPage onNavigate={handleNavigate} />;
      case 'bed-map':
        return <HospitalBedMapPage onNavigate={handleNavigate} />;
      case 'patients':
        return <PatientManagementPage onNavigate={handleNavigate} initialOpenRegister={pageParams?.openRegister} />;
      case 'patient-details':
        return <PatientDetailsPage patientId={pageParams?.patientId || 'P-1024'} onNavigate={handleNavigate} />;
      case 'recommendations':
        return <BedRecommendationsPage initialPatientId={pageParams?.patientId} onNavigate={handleNavigate} />;
      case 'alerts':
        return <AlertsCenterPage onNavigate={handleNavigate} />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'simulation':
        return <SurgeSimulatorPage onNavigate={handleNavigate} />;
      case 'audit-logs':
        return <AuditLogsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'admin-login':
        return (
          <AdminLoginPage
            onLoginSuccess={() => setCurrentPage('dashboard')}
            onSwitchToStaffLogin={() => {
              setLoginMode('staff');
              setCurrentPage('dashboard');
            }}
          />
        );
      default:
        return <DashboardPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col font-sans">
      <Header activeAlertCount={activeAlertCount} onNavigate={handleNavigate} />
      
      <div className="flex flex-1">
        <Sidebar
          currentPage={currentPage}
          onNavigate={handleNavigate}
          activeAlertCount={activeAlertCount}
        />
        
        <main className="flex-1 overflow-x-hidden min-h-[calc(100vh-57px)]">
          {renderCurrentPage()}
        </main>
      </div>

      {/* Floating Real-Time Event Toasts */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <WebSocketProvider>
        <MainApp />
      </WebSocketProvider>
    </AuthProvider>
  );
}

// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './components/admin/Dashboard';
import CustomerManagement from './components/admin/CustomerManagement';
import ProjectManagement from './components/admin/ProjectManagement';
import PhaseManagement from './components/admin/PhaseManagement';
import AdminManagement from './components/admin/AdminManagement';
import ProjectTracking from './components/customer/ProjectTracking';
import OfferResponse from './components/customer/OfferResponse';
import CommentsManagement from './components/admin/CommentsManagement';

// Admin Layout Wrapper (Protected)
const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <div className="flex flex-1 min-h-0">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-secondary/60 scrollbar-thin">
        <div className="p-4 sm:p-6 lg:p-8 page-fade-in">
          {children}
        </div>
      </main>
    </div>
  </ProtectedRoute>
);

// Customer Layout Wrapper (Public)
const CustomerLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-1 min-h-0">
    <main className="flex-1 overflow-y-auto scrollbar-thin">
      <div className="p-6 lg:p-8 max-w-4xl mx-auto w-full page-fade-in">
        {children}
      </div>
    </main>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-background flex flex-col">
          <Routes>
            {/* Login Route (No Header) */}
            <Route path="/login" element={<Login />} />

            {/* Routes with Header */}
            <Route path="/*" element={
              <>
                <Header />
                <div className="flex flex-col flex-1 min-h-0">
                  <Routes>
                    {/* Admin Routes (Protected) */}
                    <Route path="/admin" element={<AdminLayout><Dashboard /></AdminLayout>} />
                    <Route path="/admin/dashboard" element={<AdminLayout><Dashboard /></AdminLayout>} />
                    <Route path="/admin/customers" element={<AdminLayout><CustomerManagement /></AdminLayout>} />
                    <Route path="/admin/projects" element={<AdminLayout><ProjectManagement /></AdminLayout>} />
                    <Route path="/admin/phases" element={<AdminLayout><PhaseManagement /></AdminLayout>} />
                    <Route path="/admin/comments" element={<AdminLayout><CommentsManagement /></AdminLayout>} />
                    <Route path="/admin/admins" element={<AdminLayout><AdminManagement /></AdminLayout>} />

                    {/* Customer Routes (Public) */}
                    <Route path="/kundenansicht" element={<CustomerLayout><ProjectTracking /></CustomerLayout>} />
                    <Route path="/angebot" element={<CustomerLayout><OfferResponse /></CustomerLayout>} />

                    {/* Default Route - redirect to customer view (public) */}
                    <Route path="/" element={<Navigate to="/kundenansicht" replace />} />
                  </Routes>
                </div>
              </>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

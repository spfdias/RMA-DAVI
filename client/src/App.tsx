import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import AcolhidosCadastro from './pages/AcolhidosCadastro';
import AcolhidosLista from './pages/AcolhidosLista';
import RelatorioMensal from './pages/RelatorioMensal';
import RelatorioLista from './pages/RelatorioLista';
import RelatorioVisualizar from './pages/RelatorioVisualizar';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminUsers from './pages/AdminUsers';
import AuditLog from './pages/AuditLog';

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '24px 32px', background: '#f5f5f5', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: '24px 32px', background: '#f5f5f5', overflowY: 'auto' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/acolhidos/cadastro" element={<AcolhidosCadastro />} />
          <Route path="/acolhidos/cadastro/:id" element={<AcolhidosCadastro />} />
          <Route path="/acolhidos/lista" element={<AcolhidosLista />} />
          <Route path="/relatorios" element={<RelatorioLista />} />
          <Route path="/relatorios/novo" element={<RelatorioMensal />} />
          <Route path="/relatorios/:mes/:ano" element={<RelatorioMensal />} />
          <Route path="/relatorios/:mes/:ano/visualizar" element={<RelatorioVisualizar />} />
          {user.role === 'admin' && (
            <>
              <Route path="/admin/usuarios" element={<AdminUsers />} />
              <Route path="/admin/auditoria" element={<AuditLog />} />
            </>
          )}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import ChangePassword from './ChangePassword';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showChangePwd, setShowChangePwd] = useState(false);

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: '📊', adminOnly: false },
    { path: '/acolhidos/cadastro', label: 'Cadastrar Acolhido', icon: '➕', adminOnly: false },
    { path: '/acolhidos/lista', label: 'Listar Acolhidos', icon: '👥', adminOnly: false },
    { path: '/relatorios/novo', label: 'Novo Relatório', icon: '📄', adminOnly: false },
    { path: '/relatorios', label: 'Relatórios', icon: '📁', adminOnly: false },
    { path: '/admin/usuarios', label: 'Gerenciar Usuários', icon: '🔐', adminOnly: true },
    { path: '/admin/auditoria', label: 'Auditoria', icon: '📋', adminOnly: true },
  ];

  return (
    <aside style={{
      width: 240,
      background: 'linear-gradient(180deg, #1a237e 0%, #283593 100%)',
      color: '#fff',
      padding: '24px 0',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.15)', marginBottom: 16 }}>
        <h1 style={{ fontSize: 20, margin: 0, lineHeight: 1.3 }}>RMA</h1>
        <p style={{ fontSize: 12, opacity: 0.7, margin: '4px 0 0' }}>Relatório Mensal de Atendimento</p>
      </div>

      <nav style={{ flex: 1 }}>
        {menuItems
          .filter((item) => !item.adminOnly || user?.role === 'admin')
          .map((item) => {
            const isActive = item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path);

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '10px 20px',
                  border: 'none',
                  background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: '#fff',
                  fontSize: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.2s',
                  borderLeft: isActive ? '3px solid #64b5f6' : '3px solid transparent',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
      </nav>

      <div style={{
        padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.15)',
      }}>
        <div style={{ fontSize: 12, opacity: 0.8, marginBottom: 4 }}>
          {user?.nome}
        </div>
        <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 10 }}>
          {user?.role === 'admin' ? 'Administrador' : 'Colaborador'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button onClick={() => setShowChangePwd(true)} style={{
            background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)',
            padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
          }}>
            🔑 Alterar Senha
          </button>
          <button onClick={() => { logout(); navigate('/login'); }} style={{
            background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)',
            padding: '6px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 12,
          }}>
            Sair
          </button>
        </div>
      </div>

      {showChangePwd && <ChangePassword onClose={() => setShowChangePwd(false)} />}
    </aside>
  );
}

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_URL + '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: (email: string, senha: string) =>
    api.post('/auth/login', { email, senha }).then((r) => r.data),
  register: (nome: string, email: string, senha: string) =>
    api.post('/auth/register', { nome, email, senha }).then((r) => r.data),
  listUsers: () =>
    api.get('/auth/users').then((r) => r.data),
  approveUser: (id: number) =>
    api.post(`/auth/users/${id}/approve`).then((r) => r.data),
  deleteUser: (id: number) =>
    api.delete(`/auth/users/${id}`),
  changeRole: (id: number, role: string) =>
    api.put(`/auth/users/${id}/role`, { role }).then((r) => r.data),
  resetPassword: (id: number, senha: string) =>
    api.put(`/auth/users/${id}/reset-password`, { senha }).then((r) => r.data),
  changeMyPassword: (senhaAtual: string, novaSenha: string) =>
    api.put('/auth/change-password', { senhaAtual, novaSenha }).then((r) => r.data),
};

export const acolhidosApi = {
  listar: (params?: { status?: string; busca?: string }) =>
    api.get('/acolhidos', { params }).then((r) => r.data),
  buscar: (id: number) =>
    api.get(`/acolhidos/${id}`).then((r) => r.data),
  criar: (data: any) =>
    api.post('/acolhidos', data).then((r) => r.data),
  atualizar: (id: number, data: any) =>
    api.put(`/acolhidos/${id}`, data).then((r) => r.data),
  excluir: (id: number) =>
    api.delete(`/acolhidos/${id}`),
  desligar: (id: number, data: { data_desligamento: string; motivo: string; observacoes?: string }) =>
    api.post(`/acolhidos/${id}/desligar`, data).then((r) => r.data),
};

export const relatoriosApi = {
  listar: (params?: { mes?: number; ano?: number }) =>
    api.get('/relatorios', { params }).then((r) => r.data),
  buscar: (id: number) =>
    api.get(`/relatorios/${id}`).then((r) => r.data),
  salvar: (data: { mes: number; ano: number; dados: any; changeSummary?: string }) =>
    api.post('/relatorios', data).then((r) => r.data),
  uploadImagens: (relatorioId: number, categoria: string, files: File[]) => {
    const formData = new FormData();
    formData.append('categoria', categoria);
    files.forEach((f) => formData.append('imagens', f));
    return api.post(`/relatorios/${relatorioId}/imagens`, formData).then((r) => r.data);
  },
  removerImagem: (imagemId: number) =>
    api.delete(`/relatorios/imagens/${imagemId}`),
  rotacionarImagem: (imagemId: number, rotation: number) =>
    api.put(`/relatorios/imagens/${imagemId}/rotate`, { rotation }).then((r) => r.data),
  removerTodasImagens: (relatorioId: number | string) =>
    api.delete(`/relatorios/${relatorioId}/imagens`).then((r) => r.data),
  excluir: (id: number) =>
    api.delete(`/relatorios/${id}`),
  listarAudit: () =>
    api.get('/relatorios/audit').then((r) => r.data),
};

export const categoriasApi = {
  listar: () =>
    api.get('/categorias').then((r) => r.data),
  criar: (data: { value: string; label: string; icon?: string }) =>
    api.post('/categorias', data).then((r) => r.data),
  excluir: (id: number) =>
    api.delete(`/categorias/${id}`),
};

export const storageApi = {
  status: () =>
    api.get('/storage').then((r) => r.data),
};

export default api;

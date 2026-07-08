import { useEffect, useState } from 'react';
import { storageApi } from '../api';

interface StorageInfo {
  usedBytes: number;
  limitBytes: number;
  usedFormatted: string;
  limitFormatted: string;
  percentage: number;
  alert: boolean;
  imageCount: number;
}

export default function StorageAlert() {
  const [storage, setStorage] = useState<StorageInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    storageApi.status().then(setStorage).catch(() => {});
  }, []);

  if (!storage || !storage.alert || dismissed) return null;

  return (
    <div style={{
      background: '#fff3e0', border: '1px solid #ff9800', borderRadius: 8,
      padding: '10px 16px', marginBottom: 16, display: 'flex',
      alignItems: 'center', gap: 12, fontSize: 13,
    }}>
      <span style={{ fontSize: 20 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <strong style={{ color: '#e65100' }}>Armazenamento próximo do limite!</strong>
        <span style={{ color: '#555', marginLeft: 8 }}>
          {storage.usedFormatted} usado de {storage.limitFormatted} ({storage.percentage}% — {storage.imageCount} imagens).
          Remova imagens antigas nos relatórios para liberar espaço.
        </span>
      </div>
      <button onClick={() => setDismissed(true)} style={{
        background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#999', padding: '0 4px',
      }}>×</button>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { AreaType, AreaDialogResult } from './types';
import { useTranslate } from './useLocale';

interface AreaNameDialogProps {
  position: { x: number; y: number };
  onConfirm: (result: AreaDialogResult) => void;
  onCancel: () => void;
  externalError?: string;
  initialType?: AreaType;
}

export function AreaNameDialog({ position, onConfirm, onCancel, externalError, initialType }: AreaNameDialogProps) {
  const t = useTranslate();
  const defaultName = initialType === 'B' ? 'Same Team' : 'Balance';
  const [name, setName] = useState(defaultName);
  const type: AreaType = initialType ?? 'A';
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (externalError) setError(externalError);
  }, [externalError]);

  function handleConfirm() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('Name is required'));
      return;
    }
    setError('');
    onConfirm({ name: trimmed, type });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleConfirm();
    if (e.key === 'Escape') onCancel();
  }

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        background: '#1e1e2e',
        border: '1px solid #555',
        borderRadius: 8,
        padding: '12px 16px',
        zIndex: 100,
        minWidth: 200,
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        color: '#eee',
        fontFamily: 'sans-serif',
        fontSize: 13,
      }}
      onKeyDown={handleKeyDown}
    >
      <div style={{ marginBottom: 8, fontWeight: 'bold' }}>{t('Name this area')}</div>
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t('Area name')}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: '#2a2a3a',
          color: '#eee',
          border: '1px solid #555',
          borderRadius: 4,
          padding: '4px 8px',
          fontSize: 13,
          marginBottom: 8,
        }}
      />
      {error && (
        <div style={{ color: '#f88', marginBottom: 6, fontSize: 12 }}>{error}</div>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{ background: '#333', color: '#ccc', border: '1px solid #555', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}
        >
          {t('Cancel')}
        </button>
        <button
          onClick={handleConfirm}
          style={{ background: '#4466cc', color: '#fff', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer' }}
        >
          {t('Add')}
        </button>
      </div>
    </div>
  );
}

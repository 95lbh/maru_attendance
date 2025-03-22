// pages/admin/login.tsx

import { useState } from 'react';
import { useRouter } from 'next/router';

const ADMIN_PASSWORD = '1234'; // ✅ 간단한 하드코딩 비밀번호

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem('isAdmin', 'true');
      router.push('/admin/payments');
    } else {
      alert('비밀번호가 틀렸습니다!');
    }
  };

  return (
    <main style={{ padding: '2rem', maxWidth: 400, margin: 'auto' }}>
      <h1>🔐 관리자 로그인</h1>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="비밀번호"
        style={{
          width: '100%',
          padding: '0.5rem',
          fontSize: '1rem',
          marginBottom: '1rem',
          borderRadius: '8px',
          border: '1px solid #ccc',
        }}
      />
      <button
        onClick={handleLogin}
        style={{
          width: '100%',
          padding: '0.75rem',
          fontSize: '1rem',
          backgroundColor: '#1976d2',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
        }}
      >
        로그인
      </button>
    </main>
  );
}

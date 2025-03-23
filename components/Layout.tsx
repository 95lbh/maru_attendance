import { useRouter } from 'next/router';
import { ReactNode, useEffect, useState } from 'react';

export default function Layout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const isHome = router.pathname === '/';
  const [darkMode, setDarkMode] = useState(false);

  // 다크모드 설정 초기화
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    setDarkMode(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  // 토글 핸들러
  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', next);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-100 transition-colors duration-300">
      <header className="p-4 border-b mb-6 flex justify-between items-center max-w-4xl mx-auto">
        <h1 className="text-lg font-bold">🎓 Maru Attendance</h1>

        <div className="flex items-center gap-2">
          {!isHome && (
            <button
              onClick={() => router.push('/')}
              className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
            >
              🏠 홈
            </button>
          )}
          <button
            onClick={toggleDarkMode}
            className="text-sm border px-2 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            {darkMode ? '🌞 밝게' : '🌙 어둡게'}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4">{children}</main>
    </div>
  );
}

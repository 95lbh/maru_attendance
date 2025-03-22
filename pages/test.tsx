// pages/test.tsx

import { useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function TestPage() {
  useEffect(() => {
    const addTestData = async () => {
      try {
        await addDoc(collection(db, 'users'), {
          name: '김철수',
          paid: false,
        });
        console.log('✅ Firestore에 데이터가 추가되었습니다!');
      } catch (error) {
        console.error('❌ 데이터 추가 실패:', error);
      }
    };

    addTestData();
  }, []);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>📌 Firestore 테스트 중...</h1>
      <p>콘솔을 확인해보세요! Firestore에 "김철수"가 추가됩니다.</p>
    </main>
  );
}

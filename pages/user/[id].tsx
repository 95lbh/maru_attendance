import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export default function UserHistoryPage() {
  const router = useRouter();
  const { id } = router.query;
  const [userName, setUserName] = useState('');
  const [dates, setDates] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const fetchData = async () => {
      setLoading(true);

      const userSnap = await getDoc(doc(db, 'users', id));
      if (userSnap.exists()) {
        setUserName(userSnap.data().name || '(이름 없음)');
      }

      const attendanceSnap = await getDocs(collection(db, 'attendance'));
      const attendedDates: string[] = [];

      attendanceSnap.forEach((doc) => {
        const users: string[] = doc.data().users || [];
        if (users.includes(id)) {
          attendedDates.push(doc.id);
        }
      });

      attendedDates.sort((a, b) => (a > b ? -1 : 1)); // 최신 날짜가 위로
      setDates(attendedDates);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  return (
    <main className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">
        📅 {userName}님의 출석 이력
      </h1>

      {loading ? (
        <p className="text-center text-gray-500">로딩 중...</p>
      ) : dates.length === 0 ? (
        <p className="text-center text-gray-400">출석 기록이 없습니다.</p>
      ) : (
        <ul className="space-y-2">
          {dates.map((date) => (
            <li
              key={date}
              className="p-3 bg-white shadow rounded text-center text-gray-700 font-medium"
            >
              {date}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

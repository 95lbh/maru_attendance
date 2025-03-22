import { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';

interface User {
  id: string;
  name: string;
}

const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - offset);
  return localDate.toISOString().split('T')[0];
};

export default function TodayAttendancePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const today = getToday();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const attendanceDoc = await getDoc(doc(db, 'attendance', today));
      const attendedIds: string[] = attendanceDoc.exists()
        ? attendanceDoc.data().users || []
        : [];

      const userSnapshot = await getDocs(collection(db, 'users'));
      const allUsers: User[] = [];
      userSnapshot.forEach((docSnap) => {
        allUsers.push({
          id: docSnap.id,
          name: docSnap.data().name,
        });
      });

      const attendedUsers = allUsers.filter((u) =>
        attendedIds.includes(u.id)
      );

      setUsers(attendedUsers);
      setLoading(false);
    };

    fetchData();
  }, [today]);

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-center text-blue-600 mb-4">
        ✅ 오늘 출석한 사람
      </h1>

      {loading ? (
        <p className="text-center text-gray-500">로딩 중...</p>
      ) : users.length === 0 ? (
        <p className="text-center text-gray-400">출석자가 없습니다.</p>
      ) : (
        <>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-2 font-bold">
            총 {users.length}명 출석
          </p>
          <ul className="space-y-2">
            {users.map((user) => (
              <li
                key={user.id}
                className="p-3 bg-white dark:bg-gray-800 dark:text-white rounded shadow text-center"
              >
                {user.name}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}

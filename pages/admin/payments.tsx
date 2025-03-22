import { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';

const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - offset);
  return localDate.toISOString().split('T')[0];
};

interface User {
  id: string;
  name: string;
}

export default function PaymentsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [payMap, setPayMap] = useState<Record<string, boolean>>({});
  const [today] = useState(getToday());

  useEffect(() => {
    const fetchData = async () => {
      const userSnap = await getDocs(collection(db, 'users'));
      const userList: User[] = [];
      userSnap.forEach((docSnap) => {
        userList.push({ id: docSnap.id, name: docSnap.data().name });
      });

      const attendSnap = await getDoc(doc(db, 'attendance', today));
      const ids = attendSnap.exists() ? attendSnap.data().users || [] : [];

      const payMap: Record<string, boolean> = {};
      ids.forEach((id: string) => {
        payMap[id] = attendSnap.data()?.paid?.[id] ?? false;
      });

      setUsers(userList.filter((u) => ids.includes(u.id)));
      setPayMap(payMap);
    };

    fetchData();
  }, [today]);

  const togglePayment = async (userId: string) => {
    const current = payMap[userId];
    const updated = { ...payMap, [userId]: !current };

    await updateDoc(doc(db, 'attendance', today), {
      paid: updated,
    });

    setPayMap(updated);
  };

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-4 text-center text-green-600">
        💸 오늘 입장료 확인
      </h1>

      {users.length === 0 ? (
        <p className="text-center text-gray-500">출석자가 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 shadow rounded"
            >
              <span className="font-medium">{user.name}</span>
              <button
                onClick={() => togglePayment(user.id)}
                className={`px-3 py-1 rounded text-white ${
                  payMap[user.id]
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-gray-400 hover:bg-gray-500'
                }`}
              >
                {payMap[user.id] ? '✅ 납부' : '❌ 미납'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <footer className="mt-10 pt-6 border-t text-center">
        <button
          onClick={() => (window.location.href = '/')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🏠 메인으로
        </button>
      </footer>
    </main>
  );
}

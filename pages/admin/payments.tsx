import { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  setDoc,
} from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - offset);
  return localDate.toISOString().split('T')[0];
};

export default function PaymentsPage() {
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [paid, setPaid] = useState<Record<string, boolean>>({});
  const [date, setDate] = useState(getToday());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsersAndPayments = async () => {
      setLoading(true);

      const userSnap = await getDocs(collection(db, 'users'));
      const userList: { id: string; name: string }[] = [];
      userSnap.forEach((doc) => {
        userList.push({ id: doc.id, name: doc.data().name });
      });

      const attendSnap = await getDoc(doc(db, 'attendance', date));
      const ids: string[] = attendSnap.exists()
        ? attendSnap.data().users || []
        : [];

      const payMap: Record<string, boolean> = {};
      ids.forEach((id: string) => {
        payMap[id] = attendSnap.data().paid?.[id] || false;
      });

      setUsers(userList.filter((u) => ids.includes(u.id)));
      setPaid(payMap);
      setLoading(false);
    };

    fetchUsersAndPayments();
  }, [date]);

  const togglePaid = async (userId: string) => {
    const ref = doc(db, 'attendance', date);
    await updateDoc(ref, {
      [`paid.${userId}`]: !paid[userId],
    });
    setPaid((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  return (
    <main className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-center text-green-700 mb-6">
        💰 입장료 납부 관리
      </h1>

      <div className="flex justify-center mb-6">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="border border-gray-300 px-4 py-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      </div>

      {loading ? (
        <p className="text-center text-gray-500">로딩 중...</p>
      ) : users.length === 0 ? (
        <p className="text-center text-gray-400">출석한 사용자가 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {users.map((user) => (
            <li
              key={user.id}
              className="flex justify-between items-center bg-white p-4 rounded shadow"
            >
              <span className="font-medium">{user.name}</span>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={paid[user.id] || false}
                  onChange={() => togglePaid(user.id)}
                  className="w-4 h-4 accent-green-600"
                />
                납부
              </label>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

// pages/admin/dashboard.tsx

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { useRouter } from 'next/router';

interface User {
  id: string;
  name: string;
  paid: boolean;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    if (isAdmin !== 'true') {
      alert('접근 권한이 없습니다.');
      router.push('/admin/login');
      return;
    }

    const fetchUsers = async () => {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const list: User[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          name: data.name,
          paid: data.paid,
        });
      });
      setUsers(list);
    };

    fetchUsers();
  }, []);

  const togglePaid = async (userId: string, currentStatus: boolean) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      paid: !currentStatus,
    });
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, paid: !currentStatus } : u))
    );
  };

  return (
    <main style={{ padding: '2rem', maxWidth: 500, margin: 'auto' }}>
      <h1>🛠 사용자 관리</h1>
      {users.length === 0 ? (
        <p>사용자가 없습니다.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', paddingBottom: '0.5rem' }}>이름</th>
              <th style={{ textAlign: 'left', paddingBottom: '0.5rem' }}>회비 납부</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{ padding: '0.5rem 0' }}>{user.name}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={user.paid}
                    onChange={() => togglePaid(user.id, user.paid)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}

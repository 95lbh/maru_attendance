import { useEffect, useState } from "react";
import {
  getDocs,
  collection,
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

interface User {
  id: string;
  name: string;
  paid: boolean;
}

export default function PaymentsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [paidCount, setPaidCount] = useState(0);
  const [allUnpaidUsers, setAllUnpaidUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchDates = async () => {
      const snapshot = await getDocs(collection(db, "attendance"));
      const dates = snapshot.docs.map((doc) => doc.id).sort().reverse();
      setAvailableDates(dates);
      if (dates.length > 0) {
        setSelectedDate(dates[0]);
        fetchUsers(dates[0]);
        fetchAllUnpaid(dates);
      }
    };

    fetchDates();
  }, []);

  const fetchUsers = async (date: string) => {
    const attendanceRef = doc(db, "attendance", date);
    const attendanceSnap = await getDoc(attendanceRef);

    let attended: string[] = [];
    let paid: string[] = [];

    if (attendanceSnap.exists()) {
      attended = attendanceSnap.data().users || [];
      paid = attendanceSnap.data().paid || [];
    } else {
      await setDoc(attendanceRef, { users: [], paid: [] });
    }

    const userSnapshot = await getDocs(collection(db, "users"));
    const userList: User[] = [];
    let count = 0;
    userSnapshot.forEach((docSnap) => {
      if (attended.includes(docSnap.id)) {
        const data = docSnap.data();
        const isPaid = paid.includes(docSnap.id);
        userList.push({
          id: docSnap.id,
          name: data.name,
          paid: isPaid,
        });
        if (isPaid) count++;
      }
    });

    setUsers(userList);
    setPaidCount(count);
  };

  const fetchAllUnpaid = async (dates: string[]) => {
    const userSnapshot = await getDocs(collection(db, "users"));
    const allUsers: User[] = userSnapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      name: docSnap.data().name,
      paid: false,
    }));

    const paidUsersSet = new Set<string>();

    for (const date of dates) {
      const snap = await getDoc(doc(db, "attendance", date));
      const paid: string[] = snap.exists() ? snap.data().paid || [] : [];
      paid.forEach((id) => paidUsersSet.add(id));
    }

    const unpaidUsers = allUsers.filter((user) => !paidUsersSet.has(user.id));
    setAllUnpaidUsers(unpaidUsers);
  };

  const handleDateChange = (date: string) => {
    const formatted = date.toISOString().split("T")[0];
    setSelectedDate(formatted);
    fetchUsers(formatted);
  };

  const togglePayment = async (userId: string, paid: boolean) => {
    try {
      const attendRef = doc(db, "attendance", selectedDate);
      const attendDoc = await getDoc(attendRef);
      if (!attendDoc.exists()) return;

      const currentPaid = attendDoc.data().paid || [];
      let newPaid: string[] = [];

      if (paid) {
        newPaid = currentPaid.filter((id: string) => id !== userId);
      } else {
        if (!currentPaid.includes(userId)) {
          newPaid = [...currentPaid, userId];
        } else {
          newPaid = [...currentPaid];
        }
      }

      await updateDoc(attendRef, { paid: newPaid });
      await updateDoc(doc(db, "users", userId), { paid: !paid });

      setUsers((prev) => {
        const updated = prev.map((u) =>
          u.id === userId ? { ...u, paid: !paid } : u
        );
        setPaidCount(updated.filter((u) => u.paid).length);
        return updated;
      });

      fetchAllUnpaid(availableDates);
    } catch (error) {
      console.error("입장료 상태 변경 오류:", error);
    }
  };

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">💰 입장료 납부 관리</h1>

      <div className="mb-6">
        <label className="block mb-2 font-medium">날짜 선택</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => handleDateChange(new Date(e.target.value))}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <p className="text-sm text-gray-600 mb-2">
        납부자 수: <strong>{paidCount}</strong>명 / 총 <strong>{users.length}</strong>명
      </p>

      <ul className="space-y-3">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex justify-between items-center p-3 bg-white rounded shadow dark:bg-gray-800 dark:text-white"
          >
            <span>{user.name}</span>
            <button
              onClick={() => togglePayment(user.id, user.paid)}
              className={`px-3 py-1 rounded text-white hover:opacity-90 ${
                user.paid ? "bg-green-500" : "bg-gray-500"
              }`}
            >
              {user.paid ? "납부" : "미납"}
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">📋 전체 기간 미납자 목록</h2>
          <button
            onClick={() => fetchAllUnpaid(availableDates)}
            className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
          >
            🔄 새로고침
          </button>
        </div>
        <ul className="list-disc list-inside text-sm text-red-600">
          {allUnpaidUsers.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      </div>

      <footer className="mt-10 pt-6 border-t text-center space-x-4">
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🏠 메인으로
        </button>
        <button
          onClick={() => (window.location.href = "/today")}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          📅 오늘 출석자
        </button>
        <button
          onClick={() => (window.location.href = "/ranking")}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
        >
          🏆 출석 랭킹
        </button>
      </footer>
    </main>
  );
}

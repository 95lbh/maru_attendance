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
  unpaidDates?: string[];
}

export default function PaymentsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [paidCount, setPaidCount] = useState(0);
  const [allUnpaidUsers, setAllUnpaidUsers] = useState<User[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const fetchDates = async () => {
      const snapshot = await getDocs(collection(db, "attendance"));
      const dates = snapshot.docs
        .map((doc) => doc.id)
        .sort()
        .reverse();
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
      unpaidDates: [],
    }));

    const unpaidUserMap: Record<string, string[]> = {};

    for (const date of dates) {
      const snap = await getDoc(doc(db, "attendance", date));
      if (!snap.exists()) continue;
      const users: string[] = snap.data().users || [];
      const paid: string[] = snap.data().paid || [];
      users.forEach((uid) => {
        if (!paid.includes(uid)) {
          if (!unpaidUserMap[uid]) unpaidUserMap[uid] = [];
          unpaidUserMap[uid].push(date);
        }
      });
    }

    const unpaidUsers = allUsers
      .filter((user) => unpaidUserMap[user.id])
      .map((user) => ({ ...user, unpaidDates: unpaidUserMap[user.id] }));

    setAllUnpaidUsers(unpaidUsers);
  };

  const handleDateChange = (date: string | Date) => {
    const formatted =
      typeof date === "string"
        ? date
        : new Date(date).toISOString().split("T")[0];
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

  const getTodayKST = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const kst = new Date(now.getTime() - offset + 9 * 60 * 60 * 1000); // KST 보정
    return kst.toISOString().split("T")[0];
  };

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        💰 입장료 납부 관리
      </h1>

      <div className="mb-6">
        <label className="block mb-2 font-medium">날짜 선택</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
        <button
          onClick={() => handleDateChange(getTodayKST())}
          className="mt-2 px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded"
        >
          📅 오늘 날짜로 이동
        </button>
      </div>

      <p className="text-sm text-gray-600 mb-2">
        납부자 수: <strong>{paidCount}</strong>명 / 총{" "}
        <strong>{users.length}</strong>명
      </p>

      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="이름 검색"
        className="w-full border px-4 py-2 mb-4 rounded"
      />

      <ul className="space-y-3">
        {filteredUsers.map((user) => (
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
            <li key={user.id}>
              {user.name} -{" "}
              {user.unpaidDates?.map((date, idx) => (
                <button
                  key={idx}
                  onClick={() => handleDateChange(date)}
                  className="underline text-blue-700 hover:text-blue-900 mr-1"
                >
                  {date}
                </button>
              ))}
            </li>
          ))}
        </ul>
      </div>

      <footer className="mt-10 pt-6 border-t text-center space-x-4">
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🏠 홈
        </button>
        <button
          onClick={() => (window.location.href = "/today")}
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
        >
          📅 오늘 출석자
        </button>
      </footer>
    </main>
  );
}

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  getDocs,
  getDoc,
  doc,
  deleteDoc,
  updateDoc,
  arrayRemove,
  collection,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

interface User {
  id: string;
  name: string;
  attendanceCount: number;
  lastAttendanceDate: string | null;
}

export default function InactiveMembersPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [cutoffDate, setCutoffDate] = useState("");
  const [maxAttendance, setMaxAttendance] = useState<number>(0);

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("admin") === "true") {
      setIsAdmin(true);
    } else {
      alert("관리자만 접근할 수 있습니다.");
      router.push("/admin/login");
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const userSnap = await getDocs(collection(db, "users"));
      const attendanceSnap = await getDocs(collection(db, "attendance"));

      const attendanceMap: Record<string, string[]> = {};

      attendanceSnap.forEach((docSnap) => {
        const date = docSnap.id;
        const users: string[] = docSnap.data().users || [];
        users.forEach((id) => {
          if (!attendanceMap[id]) attendanceMap[id] = [];
          attendanceMap[id].push(date);
        });
      });

      const userList: User[] = userSnap.docs.map((docSnap) => {
        const id = docSnap.id;
        const name = docSnap.data().name;
        const attendanceDates = attendanceMap[id] || [];
        const sortedDates = [...attendanceDates].sort().reverse(); // 최신순
        return {
          id,
          name,
          attendanceCount: attendanceDates.length,
          lastAttendanceDate: sortedDates[0] || null,
        };
      });

      setUsers(userList);
      setFilteredUsers(userList);
    };

    fetchData();
  }, []);

  const handleFilter = () => {
    const result = users.filter((u) => {
      const tooOld =
        cutoffDate && (!u.lastAttendanceDate || u.lastAttendanceDate < cutoffDate);
      const tooFew = maxAttendance > 0 && u.attendanceCount <= maxAttendance;
      return tooOld || tooFew;
    });
    setFilteredUsers(result);
  };

  const handleDelete = async (userId: string) => {
    const confirmed = window.confirm("정말 이 사용자를 삭제할까요?");
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, "users", userId));

      const attendanceSnap = await getDocs(collection(db, "attendance"));
      const batch = attendanceSnap.docs.map((snap) =>
        updateDoc(doc(db, "attendance", snap.id), {
          users: arrayRemove(userId),
        })
      );

      await Promise.all(batch);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setFilteredUsers((prev) => prev.filter((u) => u.id !== userId));
      alert("삭제되었습니다.");
    } catch (err) {
      console.error("삭제 실패:", err);
      alert("삭제 중 오류 발생");
    }
  };

  if (!isAdmin) return null;

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center text-red-600">
        ⚠️ 저조한 출석자 관리
      </h1>

      <div className="mb-6 space-y-4">
        <div>
          <label className="block mb-1 font-medium">📅 기준 날짜 (이후 출석 없는 사람)</label>
          <input
            type="date"
            value={cutoffDate}
            onChange={(e) => setCutoffDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">📉 최대 출석 횟수 (이하 필터링)</label>
          <input
            type="number"
            value={maxAttendance}
            onChange={(e) => setMaxAttendance(Number(e.target.value))}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <button
          onClick={handleFilter}
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
        >
          🔍 필터 적용
        </button>
      </div>

      {filteredUsers.length === 0 ? (
        <p className="text-center text-gray-400">조건에 맞는 사용자가 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {filteredUsers.map((user) => (
            <li
              key={user.id}
              className="flex justify-between items-center p-3 bg-white rounded shadow"
            >
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm text-gray-500">
                  출석: {user.attendanceCount}회 / 마지막:{" "}
                  {user.lastAttendanceDate || "없음"}
                </p>
              </div>
              <button
                onClick={() => handleDelete(user.id)}
                className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
              >
                🗑 삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

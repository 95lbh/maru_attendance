import { useEffect, useState } from "react";
import {
  getDocs,
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import type { Timestamp } from "firebase/firestore";

interface User {
  id: string;
  name: string;
  createdAt?: Timestamp;
}

const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - offset);
  return localDate.toISOString().split("T")[0];
};

const rainbowColors = [
  "bg-red-300",
  "bg-orange-300",
  "bg-yellow-300",
  "bg-lime-300",
  "bg-cyan-300",
  "bg-blue-300",
  "bg-purple-300",
];

export default function AttendancePage() {
  const [users, setUsers] = useState<User[]>([]);
  const [attendedIds, setAttendedIds] = useState<string[]>([]);
  const [newName, setNewName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [top7Map, setTop7Map] = useState<Record<string, number>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isAdmin, setIsAdmin] = useState(false);
  const usersPerPage = 10;

  const today = getToday();

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("admin") === "true") {
      setIsAdmin(true);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // 🔽 등록 순으로 정렬된 유저 목록 가져오기
      const q = query(collection(db, "users"), orderBy("createdAt"));
      const userSnapshot = await getDocs(q);
      const userList: User[] = [];
      userSnapshot.forEach((docSnap) => {
        userList.push({
          id: docSnap.id,
          name: docSnap.data().name,
        });
      });
      setUsers(userList);

      // 오늘 출석 여부
      const attendanceDoc = await getDoc(doc(db, "attendance", today));
      if (attendanceDoc.exists()) {
        const data = attendanceDoc.data();
        setAttendedIds(data.users || []);
      } else {
        setAttendedIds([]);
      }

      // 상위 랭킹 계산
      const attendanceSnapshot = await getDocs(collection(db, "attendance"));
      const countMap: Record<string, number> = {};
      attendanceSnapshot.forEach((docSnap) => {
        const userIds: string[] = docSnap.data().users || [];
        userIds.forEach((userId) => {
          countMap[userId] = (countMap[userId] || 0) + 1;
        });
      });

      const sorted = Object.entries(countMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7);

      const topMap: Record<string, number> = {};
      sorted.forEach(([userId], index) => {
        topMap[userId] = index;
      });
      setTop7Map(topMap);

      setLoading(false);
    };

    fetchData();
  }, [today]);

  const handleAttendance = async (userId: string) => {
    setSubmittingId(userId);
    const attendanceRef = doc(db, "attendance", today);
    const attendanceDoc = await getDoc(attendanceRef);

    if (attendanceDoc.exists()) {
      await updateDoc(attendanceRef, {
        users: arrayUnion(userId),
      });
    } else {
      await setDoc(attendanceRef, {
        users: [userId],
        paid: [],
      });
    }

    setAttendedIds((prev) => [...prev, userId]);
    setSubmittingId(null);
  };

  const removeAttendance = async (userId: string) => {
    const attendanceRef = doc(db, "attendance", today);
    await updateDoc(attendanceRef, {
      users: arrayRemove(userId),
    });
    setAttendedIds((prev) => prev.filter((id) => id !== userId));
  };

  const deleteUser = async (userId: string) => {
    if (!window.confirm("정말 이 사용자를 삭제할까요?")) return;

    try {
      await deleteDoc(doc(db, "users", userId));

      const attendanceSnapshot = await getDocs(collection(db, "attendance"));
      const batch = attendanceSnapshot.docs.map((snap) => {
        return updateDoc(doc(db, "attendance", snap.id), {
          users: arrayRemove(userId),
        });
      });

      await Promise.all(batch);

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setAttendedIds((prev) => prev.filter((id) => id !== userId));
      alert("삭제되었습니다.");
    } catch (err) {
      alert("삭제 중 오류 발생");
      console.error(err);
    }
  };

  const handleAddUser = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return alert("이름을 입력하세요.");
    if (users.find((u) => u.name === trimmed)) return alert("이미 등록된 이름입니다.");

    const docRef = await addDoc(collection(db, "users"), {
      name: trimmed,
      paid: false,
      createdAt: new Date(),
    });

    await handleAttendance(docRef.id);
    setUsers((prev) => [...prev, { id: docRef.id, name: trimmed }]);
    setNewName("");
    setSearchTerm("");
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const paginatedUsers = searchTerm
    ? filteredUsers
    : filteredUsers.slice(startIndex, startIndex + usersPerPage);

  return (
    <main className="max-w-lg mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-4">
        📋 출석 체크
      </h1>

      <div className="bg-yellow-100 text-left font-bold text-gray-800 p-3 rounded mb-6 whitespace-pre-line shadow">
        ❤ 마루 스포츠 출석부입니당{"\n"}
        🧡 셔틀콕 제출 & 입장료 입금 후 게임 하기{"\n"}
        💛 국민은행 415602 96 116296 (송호영)
      </div>

      <h3 className="font-semibold mb-2">🙋‍♂️ 이름 검색</h3>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="이름 검색"
        className="w-full border rounded px-4 py-2 mb-4 focus:ring-2 focus:ring-blue-400"
      />

      <div className="mb-6">
        <h3 className="font-semibold mb-2">🙋‍♀️ 처음 오셨다면 이름 등록!</h3>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="이름 입력"
          className="w-full border rounded px-4 py-2 mb-2 dark:bg-gray-800 dark:text-white"
        />
        <button
          onClick={handleAddUser}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          이름 등록 후 출석하기
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">로딩 중...</p>
      ) : (
        <>
          <ul className="space-y-3">
            {paginatedUsers.map((user) => {
              const isAttended = attendedIds.includes(user.id);
              const rank = top7Map[user.id];
              const bgColor =
                rank !== undefined ? rainbowColors[rank] : "bg-gray-100";

              return (
                <li
                  key={user.id}
                  className={`flex justify-between items-center p-3 rounded shadow ${bgColor} dark:bg-gray-800 dark:text-white`}
                >
                  <span className="font-medium">{user.name}</span>
                  <div className="flex gap-2">
                    {isAttended ? (
                      <button
                        onClick={() => removeAttendance(user.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        출석 취소
                      </button>
                    ) : (
                      <button
                        disabled={submittingId === user.id}
                        onClick={() => handleAttendance(user.id)}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        출석
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                      >
                        🗑
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          {!searchTerm && totalPages > 1 && (
            <div className="flex justify-center mt-6 gap-2 flex-wrap">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                ◀ 이전
              </button>

              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 rounded ${
                    currentPage === i + 1
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              >
                다음 ▶
              </button>
            </div>
          )}
        </>
      )}

      <footer className="mt-10 pt-6 border-t text-center space-x-4">
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
        <div className="mt-4 space-x-4">
          <button
            onClick={() => (window.location.href = "/admin/login")}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            🔐 관리자
          </button>
          {isAdmin && (
            <button
              onClick={() => (window.location.href = "/admin/payments")}
              className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
            >
              💰 입장료 관리
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-6 text-right">
          Made by <span className="font-semibold">🏸Byeong Heon</span> v1.0.3
        </p>
      </footer>
    </main>
  );
}

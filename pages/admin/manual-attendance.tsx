import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  doc,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";

interface User {
  id: string;
  name: string;
}

const getTodayKST = () => {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTC → KST
  const year = kst.getUTCFullYear();
  const month = String(kst.getUTCMonth() + 1).padStart(2, "0");
  const day = String(kst.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function ManualAttendancePage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [manualDate, setManualDate] = useState<string>(getTodayKST());

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [isAttended, setIsAttended] = useState<boolean>(false);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      localStorage.getItem("admin") === "true"
    ) {
      setIsAdmin(true);
    } else {
      alert("관리자만 접근할 수 있습니다.");
      router.push("/admin/login");
    }
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      const userSnapshot = await getDocs(collection(db, "users"));
      const userList: User[] = userSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        name: docSnap.data().name,
      }));
      setUsers(userList);
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter((user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  useEffect(() => {
    const checkAttendance = async () => {
      if (!selectedUserId || !manualDate) return;
      const snap = await getDoc(doc(db, "attendance", manualDate));
      if (!snap.exists()) {
        setIsAttended(false);
        return;
      }
      const users: string[] = snap.data().users || [];
      setIsAttended(users.includes(selectedUserId));
    };

    checkAttendance();
  }, [selectedUserId, manualDate]);

  const handleManualAttendance = async () => {
    if (!manualDate || !selectedUserId) {
      alert("날짜와 사용자를 모두 선택하세요.");
      return;
    }

    try {
      const attendanceRef = doc(db, "attendance", manualDate);
      const attendanceSnap = await getDoc(attendanceRef);

      if (attendanceSnap.exists()) {
        await updateDoc(attendanceRef, {
          users: arrayUnion(selectedUserId),
        });
      } else {
        await setDoc(attendanceRef, {
          users: [selectedUserId],
          paid: [],
        });
      }

      alert("✅ 출석 처리 완료!");
      setIsAttended(true);
    } catch (err) {
      console.error("출석 처리 중 오류:", err);
      alert("출석 처리 중 오류가 발생했습니다.");
    }
  };
  const handleRemoveAttendance = async () => {
    if (!manualDate || !selectedUserId) {
      alert("날짜와 사용자를 모두 선택하세요.");
      return;
    }

    const confirmed = window.confirm("정말 출석을 취소하시겠습니까?");
    if (!confirmed) return;

    try {
      const attendanceRef = doc(db, "attendance", manualDate);
      const attendanceSnap = await getDoc(attendanceRef);

      if (!attendanceSnap.exists()) return;

      await updateDoc(attendanceRef, {
        users: arrayRemove(selectedUserId),
      });

      alert("❌ 출석 취소 완료!");
      setIsAttended(false);
    } catch (err) {
      console.error("출석 취소 중 오류:", err);
      alert("출석 취소 중 오류가 발생했습니다.");
    }
  };

  if (!isAdmin) return null;

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">
        ✅ 관리자 수동 출석 처리
      </h1>

      <div className="mb-6">
        <label className="block mb-2 font-medium">출석 날짜</label>
        <input
          type="date"
          value={manualDate}
          onChange={(e) => setManualDate(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
      </div>

      <div className="mb-6">
        <label className="block mb-2 font-medium">사용자 검색</label>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="이름 입력"
          className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
        />

        {filteredUsers.length > 0 && (
          <ul className="border rounded bg-white max-h-48 overflow-y-auto shadow">
            {filteredUsers.map((user) => (
              <li
                key={user.id}
                onClick={() => {
                  setSelectedUserId(user.id);
                  setSearchTerm(user.name);
                  setFilteredUsers([]);
                }}
                className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
              >
                {user.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedUserId && (
        <p className="text-sm text-green-600 mb-4">
          선택된 사용자 ID: <strong>{selectedUserId}</strong>
          <br />
          현재 상태: {isAttended ? "✅ 출석됨" : "❌ 출석 안됨"}
        </p>
      )}

      {selectedUserId &&
        (isAttended ? (
          <button
            onClick={handleRemoveAttendance}
            className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700"
          >
            출석 취소
          </button>
        ) : (
          <button
            onClick={handleManualAttendance}
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
          >
            출석 처리
          </button>
        ))}

      <footer className="mt-10 pt-6 border-t text-center space-x-4">
        <button
          onClick={() => (window.location.href = "/")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          🏠 홈
        </button>
        {isAdmin && (
          <button
            onClick={() => (window.location.href = "/admin/payments")}
            className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
          >
            💰 입장료 관리
          </button>
        )}
      </footer>
    </main>
  );
}

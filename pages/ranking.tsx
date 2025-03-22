import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { useRouter } from "next/router";

interface User {
  id: string;
  name: string;
}

type RangeType = "all" | "7days" | "30days";

const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - offset);
  return localDate.toISOString().split("T")[0];
};

const getDateNDaysAgo = (n: number) => {
  const now = new Date();
  now.setDate(now.getDate() - n);
  const offset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - offset);
  return localDate.toISOString().split("T")[0];
};

export default function RankingPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [rankData, setRankData] = useState<Record<string, number>>({});
  const [range, setRange] = useState<RangeType>("all");
  const [loading, setLoading] = useState(true);

  const today = getToday();
  const rangeStartDate =
    range === "7days"
      ? getDateNDaysAgo(7)
      : range === "30days"
      ? getDateNDaysAgo(30)
      : null;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const userSnap = await getDocs(collection(db, "users"));
      const userList: User[] = [];
      userSnap.forEach((doc) =>
        userList.push({ id: doc.id, name: doc.data().name })
      );
      setUsers(userList);

      const attendanceSnap = await getDocs(collection(db, "attendance"));
      const countMap: Record<string, number> = {};

      attendanceSnap.forEach((doc) => {
        const docDate = doc.id;
        if (rangeStartDate && docDate < rangeStartDate) return;

        const users: string[] = doc.data().users || [];
        users.forEach((userId) => {
          countMap[userId] = (countMap[userId] || 0) + 1;
        });
      });

      setRankData(countMap);
      setLoading(false);
    };

    fetchData();
  }, [range]);
  const sortedUsers = Object.entries(rankData)
    .sort((a, b) => b[1] - a[1])
    .map(([userId, count]) => {
      const user = users.find((u) => u.id === userId);
      return {
        id: userId,
        name: user?.name || "(알 수 없음)",
        count,
      };
    })
    .filter((u) => u.name);

  return (
    <main className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-center text-blue-600 mb-6">
        🏆 출석 랭킹
      </h1>

      {/* 랭킹 필터 버튼 */}
      <div className="flex justify-center gap-2 mb-6">
        <button
          onClick={() => setRange("all")}
          className={`px-4 py-2 rounded ${
            range === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          전체
        </button>
        <button
          onClick={() => setRange("7days")}
          className={`px-4 py-2 rounded ${
            range === "7days"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          최근 7일
        </button>
        <button
          onClick={() => setRange("30days")}
          className={`px-4 py-2 rounded ${
            range === "30days"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800"
          }`}
        >
          최근 30일
        </button>
      </div>

      {loading ? (
        <p className="text-center text-gray-500">로딩 중...</p>
      ) : sortedUsers.length === 0 ? (
        <p className="text-center text-gray-500">출석 기록이 없습니다.</p>
      ) : (
        <ul className="space-y-3">
          {sortedUsers.map((user, index) => {
            const rankBg =
              index === 0
                ? "bg-yellow-200"
                : index === 1
                ? "bg-gray-200"
                : index === 2
                ? "bg-orange-200"
                : "bg-white";

            return (
              <li
                key={user.id}
                className={`flex justify-between items-center p-4 rounded shadow ${rankBg}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl font-bold text-gray-700">
                    {index + 1}
                  </span>
                  <span
                    onClick={() => router.push(`/user/${user.id}`)}
                    className="font-medium text-blue-700 hover:underline cursor-pointer"
                  >
                    {user.name}
                  </span>
                </div>
                <span className="text-sm text-gray-600">{user.count}회</span>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

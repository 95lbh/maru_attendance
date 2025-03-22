// pages/history.tsx

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";

const getToday = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  const localDate = new Date(now.getTime() - offset);
  return localDate.toISOString().split("T")[0];
};

export default function HistoryPage() {
  const [date, setDate] = useState(getToday());
  const [attendeeNames, setAttendeeNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAttendance = async (selectedDate: string) => {
    setLoading(true);
    setAttendeeNames([]);
    try {
      const attendanceDoc = await getDoc(doc(db, "attendance", selectedDate));
      if (!attendanceDoc.exists()) {
        setLoading(false);
        return;
      }

      const userIds = attendanceDoc.data().users || [];

      const names: string[] = [];

      for (const userId of userIds) {
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
          names.push(userDoc.data().name);
        }
      }

      setAttendeeNames(names);
    } catch (error) {
      console.error("출석 정보 불러오기 실패:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance(date);
  }, [date]);

  return (
    <main style={{ padding: "2rem", maxWidth: 500, margin: "auto" }}>
      <h1>📋 출석 현황</h1>
      <label style={{ display: "block", marginBottom: "1rem" }}>
        날짜 선택:{" "}
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{
            padding: "0.5rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
          }}
        />
      </label>

      {loading ? (
        <p>로딩 중...</p>
      ) : attendeeNames.length === 0 ? (
        <p>출석한 사람이 없습니다.</p>
      ) : (
        <ul>
          {attendeeNames.map((name, idx) => (
            <li key={idx} style={{ marginBottom: "0.5rem" }}>
              ✅ {name}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

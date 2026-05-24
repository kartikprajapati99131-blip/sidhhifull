"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminAttendance() {
  const [data, setData] = useState([]);
  const router = useRouter();



  useEffect(() => {
    fetch("/api/attendance/get")
      .then((res) => res.json())
      .then(setData);
  }, []);
  // group by user
  const grouped = data.reduce((acc, item) => {
    if (!acc[item.userId]) {
      acc[item.userId] = {
        userName: item.userName,
      };
    }
    return acc;
  }, {});

  return (
    <div className="p-5">
      <h1 className="text-xl font-bold mb-4">
        Attendance Dashboard
      </h1>

      {Object.entries(grouped).map(([userId, user]) => (
        <div
          key={userId}
          onClick={() => router.push(`/allattendance/${userId}`)}
          className="p-3 border mb-2 cursor-pointer hover:bg-gray-100 rounded"
        >
          {user.userName || "User"}
        </div>
      ))}
    </div>
  );
}
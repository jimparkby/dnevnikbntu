"use client";

import { useState } from "react";
import HomeworkModal from "@/frontend/components/HomeworkModal";

export default function TeacherHomeworkAction({
  groupId,
  groupName,
  subjectId,
  subjectName,
}: {
  groupId: string;
  groupName: string;
  subjectId: string;
  subjectName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mx-4 mb-3.5 flex items-center justify-between rounded-card bg-primary-light px-3.5 py-3"
      >
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1B4F91" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
          </svg>
          <span className="text-[13.5px] font-semibold text-primary">Задать ДЗ группе {groupName}</span>
        </div>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#1B4F91" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 6 6 6-6 6" />
        </svg>
      </button>

      {open && (
        <HomeworkModal
          groupId={groupId}
          groupName={groupName}
          subjectId={subjectId}
          subjectName={subjectName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

"use client";

import { useState } from "react";
import GradeChip from "@/components/GradeChip";
import HomeworkModal from "@/components/HomeworkModal";

const TYPE_LABELS = { LECTURE: "Лекция", PRACTICE: "Практика", LAB: "Лабораторная" } as const;

interface Props {
  scheduleEntryId: string;
  startTime: string;
  endTime: string;
  type: keyof typeof TYPE_LABELS;
  subjectId: string;
  subjectName: string;
  room: string | null;
  groupId: string;
  groupName: string;
  homeworkText: string | null;
  homeworkDeadline: string | null; // yyyy-mm-dd
  grade: number | null;
  canEditHomework: boolean;
}

export default function LessonCard(props: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-card border border-[#EEF0F2] bg-card p-3.5">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <div className="text-xs font-semibold text-primary">
            {props.startTime}–{props.endTime} · {TYPE_LABELS[props.type]}
          </div>
          <div className="text-base font-semibold text-text">{props.subjectName}</div>
          {props.room && <div className="text-[13px] text-text-muted">{props.room}</div>}
        </div>
        {props.grade !== null && <GradeChip value={props.grade} />}
      </div>

      <div className="flex items-center justify-between gap-1.5 border-t border-[#F1F2F4] pt-1.5">
        {props.homeworkText ? (
          <div className="flex items-center gap-1.5">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9AA5B1" strokeWidth="2" strokeLinecap="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
            </svg>
            <span className="text-[13px] leading-snug text-[#516175]">ДЗ: {props.homeworkText}</span>
          </div>
        ) : (
          <span className="text-[13px] text-[#B4BCC4]">Домашнее задание не задано</span>
        )}

        {props.canEditHomework &&
          (props.homeworkText ? (
            <button onClick={() => setEditing(true)} className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-lg bg-[#F0F2F5]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#516175" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
          ) : (
            <button onClick={() => setEditing(true)} className="flex flex-shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="text-[12.5px] font-semibold text-white">Добавить ДЗ</span>
            </button>
          ))}
      </div>

      {editing && (
        <HomeworkModal
          groupId={props.groupId}
          groupName={props.groupName}
          subjectId={props.subjectId}
          subjectName={props.subjectName}
          scheduleEntryId={props.scheduleEntryId}
          initialText={props.homeworkText ?? undefined}
          initialDeadline={props.homeworkDeadline ?? undefined}
          onClose={() => setEditing(false)}
        />
      )}
    </div>
  );
}

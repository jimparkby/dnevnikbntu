"use client";

import { useState } from "react";
import GradeChip from "@/frontend/components/GradeChip";
import GradeModal from "@/frontend/components/GradeModal";

interface Student {
  id: string;
  name: string;
}
interface GradeCell {
  studentId: string;
  date: string; // yyyy-mm-dd
  value: number | null;
}

interface Props {
  groupId: string;
  subjectId: string;
  subjectName: string;
  students: Student[];
  dates: string[]; // yyyy-mm-dd, ascending
  grades: GradeCell[];
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
}

export default function TeacherJournalTable({ groupId, subjectId, subjectName, students, dates, grades }: Props) {
  const [target, setTarget] = useState<{ studentId: string; studentName: string; date: string } | null>(null);

  function gradeFor(studentId: string, date: string) {
    return grades.find((g) => g.studentId === studentId && g.date === date)?.value ?? null;
  }

  function formatDate(d: string) {
    const [, m, day] = d.split("-");
    return `${day}.${m}`;
  }

  return (
    <div className="overflow-hidden rounded-card border border-[#EEF0F2] bg-card">
      <div className="flex items-center bg-[#F7F8FA] px-2.5 py-2.5">
        <div className="w-[108px] flex-shrink-0 text-[11px] font-bold uppercase text-text-muted">Студент</div>
        {dates.map((d) => (
          <div key={d} className="flex-1 text-center text-[11px] font-bold text-text-muted">
            {formatDate(d)}
          </div>
        ))}
        <div className="w-[34px] flex-shrink-0 text-center text-[11px] font-bold text-text-muted">Ср.</div>
      </div>

      {students.map((student, i) => {
        const rowValues = dates.map((d) => gradeFor(student.id, d)).filter((v): v is number => v !== null);
        return (
          <div key={student.id} className={`flex items-center px-2.5 py-2.5 ${i < students.length - 1 ? "border-b border-[#F4F5F6]" : ""}`}>
            <div className="w-[108px] flex-shrink-0 text-[13px] font-medium text-text">{student.name}</div>
            {dates.map((d) => {
              const value = gradeFor(student.id, d);
              return (
                <div key={d} className="flex flex-1 justify-center">
                  {value !== null ? (
                    <GradeChip value={value} size="sm" />
                  ) : (
                    <button
                      onClick={() => setTarget({ studentId: student.id, studentName: student.name, date: d })}
                      className="flex h-[26px] w-[26px] items-center justify-center rounded-lg border-[1.5px] border-dashed border-[#C6CBD1]"
                      aria-label={`Выставить оценку ${student.name} за ${formatDate(d)}`}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#B4BCC4" strokeWidth="3" strokeLinecap="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  )}
                </div>
              );
            })}
            <div className="w-[34px] flex-shrink-0 text-center text-[13px] font-bold text-text">{average(rowValues) ?? "—"}</div>
          </div>
        );
      })}

      {target && (
        <GradeModal
          studentId={target.studentId}
          studentName={target.studentName}
          groupId={groupId}
          subjectId={subjectId}
          subjectName={subjectName}
          date={target.date}
          onClose={() => setTarget(null)}
        />
      )}
    </div>
  );
}

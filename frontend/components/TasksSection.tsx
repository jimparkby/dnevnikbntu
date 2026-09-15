"use client";

import { useState } from "react";
import HomeworkModal from "@/frontend/components/HomeworkModal";

interface TaskItem {
  id: string;
  subjectId: string;
  subjectName: string;
  text: string;
  deadline: string; // yyyy-mm-dd
}

interface TasksSectionProps {
  tasks: TaskItem[];
  canEdit: boolean;
  groupId: string;
  groupName: string;
  subjects: { id: string; name: string }[];
}

function fmtDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

export default function TasksSection({ tasks, canEdit, groupId, groupName, subjects }: TasksSectionProps) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<TaskItem | null>(null);

  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Задания</div>
        {canEdit && subjects.length > 0 && (
          <button
            onClick={() => setAdding(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-2.5 py-1.5 [touch-action:manipulation]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span className="text-[12.5px] font-semibold text-white">Добавить задание</span>
          </button>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="rounded-card border border-[#EEF0F2] bg-card p-3.5 text-sm text-text-muted">
          Заданий пока нет{canEdit ? " — добавьте первое" : " — их добавляют староста и преподаватель"}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => canEdit && setEditing(task)}
              className={`rounded-card border border-[#EEF0F2] bg-card p-3.5 text-left [touch-action:manipulation] ${canEdit ? "active:bg-[#F7F8FA]" : "cursor-default"}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] font-semibold text-primary">{task.subjectName}</span>
                <span className="text-[12.5px] text-text-muted">до {fmtDate(task.deadline)}</span>
              </div>
              <div className="mt-1 text-[14px] leading-snug text-text">{task.text}</div>
            </button>
          ))}
        </div>
      )}

      {canEdit && (
        <p className="pb-1 pt-2.5 text-center text-xs text-text-muted">Задания может добавлять староста группы и преподаватель</p>
      )}

      {adding && (
        <HomeworkModal
          groupId={groupId}
          groupName={groupName}
          subjectOptions={subjects}
          onClose={() => setAdding(false)}
        />
      )}

      {editing && (
        <HomeworkModal
          groupId={groupId}
          groupName={groupName}
          subjectId={editing.subjectId}
          subjectName={editing.subjectName}
          homeworkId={editing.id}
          initialText={editing.text}
          initialDeadline={editing.deadline}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  );
}
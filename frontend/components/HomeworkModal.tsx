"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  groupId: string;
  groupName: string;
  subjectId?: string;
  subjectName?: string;
  subjectOptions?: { id: string; name: string }[];
  homeworkId?: string;
  scheduleEntryId?: string;
  initialText?: string;
  initialDeadline?: string; // yyyy-mm-dd
  onClose: () => void;
}

export default function HomeworkModal({
  groupId,
  groupName,
  subjectId,
  subjectName,
  subjectOptions,
  homeworkId,
  scheduleEntryId,
  initialText,
  initialDeadline,
  onClose,
}: Props) {
  const router = useRouter();
  const [text, setText] = useState(initialText ?? "");
  const [deadline, setDeadline] = useState(initialDeadline ?? new Date().toISOString().slice(0, 10));
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjectId ?? subjectOptions?.[0]?.id ?? "");
  const selectedSubject = subjectOptions?.find((s) => s.id === selectedSubjectId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId, subjectId: selectedSubjectId || subjectId, scheduleEntryId, text, deadline, homeworkId }),
    });

    if (!res.ok) {
      setError("Не получилось сохранить. Проверь права доступа.");
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    router.refresh();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/45" onClick={onClose}>
      <div className="flex max-h-[80vh] flex-col rounded-t-[20px] bg-bg" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pb-1 pt-2.5">
          <div className="h-1 w-9 rounded-full bg-border" />
        </div>

        <div className="flex items-center justify-between px-4 pb-3.5 pt-1.5">
          <div>
            <div className="text-[17px] font-bold text-text">{initialText ? "Изменить задание" : "Новое задание"}</div>
            <div className="text-[13px] text-text-secondary">{selectedSubject?.name ?? subjectName ?? ""} · {groupName}</div>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E9EBEE]" aria-label="Закрыть">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7B8794" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-5">
          {subjectOptions && (
            <label className="flex flex-col gap-1.5">
              <span className="text-[12.5px] font-semibold uppercase tracking-wide text-text-secondary">Предмет</span>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="rounded-control border border-border bg-white px-3.5 py-3 text-[15px] text-text"
              >
                {subjectOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold uppercase tracking-wide text-text-secondary">Срок сдачи</span>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded-control border border-border bg-white px-3.5 py-3 text-[15px] text-text"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold uppercase tracking-wide text-text-secondary">Описание задания</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              placeholder="Например: №4.12–4.15, гл. 4"
              className="rounded-control border border-border bg-white px-3.5 py-3 text-[15px] text-text"
            />
          </label>

          {error && <p className="text-sm text-accent">{error}</p>}
        </div>

        <div className="px-4 pb-6 pt-1">
          <button
            onClick={handleSubmit}
            disabled={submitting || !text.trim()}
            className="w-full rounded-control bg-primary py-3.5 text-center text-base font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Сохраняем…" : "Сохранить задание"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { gradeTier } from "@/components/GradeChip";

interface Props {
  studentId: string;
  studentName: string;
  groupId: string;
  subjectId: string;
  subjectName: string;
  date: string; // yyyy-mm-dd
  onClose: () => void;
}

const TYPES: { value: "CURRENT" | "TEST" | "HOMEWORK" | "EXAM"; label: string }[] = [
  { value: "CURRENT", label: "Текущая" },
  { value: "TEST", label: "Контрольная" },
  { value: "HOMEWORK", label: "ДЗ" },
  { value: "EXAM", label: "Экзамен" },
];

export default function GradeModal({ studentId, studentName, groupId, subjectId, subjectName, date, onClose }: Props) {
  const router = useRouter();
  const [value, setValue] = useState<number | null>(null);
  const [type, setType] = useState<(typeof TYPES)[number]["value"]>("CURRENT");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (value === null || submitting) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/grades", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, groupId, subjectId, date, value, type, comment: comment || undefined }),
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
      <div className="flex max-h-[85vh] flex-col rounded-t-[20px] bg-bg" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pb-1 pt-2.5">
          <div className="h-1 w-9 rounded-full bg-border" />
        </div>

        <div className="flex items-center justify-between px-4 pb-1 pt-1.5">
          <div>
            <div className="text-[17px] font-bold text-text">Выставить оценку</div>
            <div className="text-[13px] text-text-secondary">{studentName} · {subjectName}</div>
          </div>
          <button onClick={onClose} className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E9EBEE]" aria-label="Закрыть">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7B8794" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex flex-col gap-4 overflow-y-auto px-4 pb-5 pt-3.5">
          <div className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold uppercase tracking-wide text-text-secondary">Тип работы</span>
            <div className="flex gap-1.5">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={`flex-1 rounded-[10px] py-2.5 text-[12.5px] font-medium ${
                    type === t.value ? "bg-primary font-semibold text-white" : "border border-border bg-white text-text-secondary"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold uppercase tracking-wide text-text-secondary">Оценка (10-балльная шкала)</span>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                const selected = value === n;
                const tier = gradeTier(n);
                return (
                  <button
                    key={n}
                    onClick={() => setValue(n)}
                    className={`flex h-11 w-10 items-center justify-center rounded-[11px] text-[15px] font-bold ${
                      selected ? "bg-primary text-white shadow-md" : `border border-border bg-white ${tier.text}`
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold uppercase tracking-wide text-text-secondary">Комментарий (необязательно)</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Например: не сдал вовремя"
              className="rounded-control border border-border bg-white px-3.5 py-3 text-[14px] text-text"
            />
          </label>

          {error && <p className="text-sm text-accent">{error}</p>}
        </div>

        <div className="px-4 pb-6 pt-1">
          <button
            onClick={handleSubmit}
            disabled={submitting || value === null}
            className="w-full rounded-control bg-primary py-3.5 text-center text-base font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Сохраняем…" : value ? `Выставить оценку ${value}` : "Выберите оценку"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@prisma/client";

interface Group {
  id: string;
  name: string;
}
interface Faculty {
  id: string;
  name: string;
  shortName: string;
  groups: Group[];
}
interface Subject {
  id: string;
  name: string;
}

const ROLES: { value: Role; title: string; description: string }[] = [
  { value: "STUDENT", title: "Студент", description: "Просмотр расписания, домашних заданий и оценок" },
  { value: "STAROSTA", title: "Староста", description: "Всё как у студента, плюс добавление домашних заданий группе" },
  { value: "TEACHER", title: "Преподаватель", description: "Добавляет задания и выставляет оценки своим группам" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [role, setRole] = useState<Role>("STUDENT");
  const [facultyId, setFacultyId] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [teaching, setTeaching] = useState<{ subjectId: string; groupId: string }[]>([{ subjectId: "", groupId: "" }]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/faculties")
      .then((r) => r.json())
      .then((data) => {
        setFaculties(data.faculties);
        setSubjects(data.subjects);
        if (data.faculties[0]) setFacultyId(data.faculties[0].id);
      });
  }, []);

  const selectedFaculty = useMemo(() => faculties.find((f) => f.id === facultyId) ?? null, [faculties, facultyId]);

  useEffect(() => {
    setGroupId(selectedFaculty?.groups[0]?.id ?? null);
  }, [selectedFaculty]);

  const canSubmit =
    role === "TEACHER"
      ? teaching.every((t) => t.subjectId && t.groupId)
      : Boolean(groupId);

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);

    const body = role === "TEACHER" ? { role, teaching } : { role, groupId };

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      setError("Не получилось сохранить профиль. Попробуй ещё раз.");
      setSubmitting(false);
      return;
    }

    router.push(role === "TEACHER" ? "/journal" : "/diary");
    router.refresh();
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <div className="flex-shrink-0 px-4 pb-2.5 pt-3.5">
        <h1 className="text-xl font-bold tracking-tight text-text">Добро пожаловать</h1>
        <p className="text-sm text-text-secondary">Настройка профиля · Дневник БНТУ</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <section className="flex flex-col gap-2.5">
          <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Шаг 1 · Кто вы?</div>
          {ROLES.map((r) => {
            const selected = role === r.value;
            return (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`flex items-start gap-3 rounded-card border p-3.5 text-left ${
                  selected ? "border-[1.5px] border-primary bg-primary-light" : "border-border bg-card"
                }`}
              >
                <div className="flex-1">
                  <div className="text-[15px] font-semibold text-text">{r.title}</div>
                  <div className="text-[13px] leading-snug text-text-secondary">{r.description}</div>
                </div>
                <div
                  className={`mt-0.5 h-[22px] w-[22px] flex-shrink-0 rounded-full ${
                    selected ? "bg-primary" : "border-[1.5px] border-border"
                  }`}
                />
              </button>
            );
          })}
        </section>

        {role !== "TEACHER" ? (
          <>
            <section className="mt-5 flex flex-col gap-2.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Шаг 2 · Факультет</div>
              <div className="flex flex-wrap gap-2">
                {faculties.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFacultyId(f.id)}
                    className={`rounded-control px-4 py-2.5 text-sm font-medium ${
                      f.id === facultyId ? "bg-primary text-white font-semibold" : "border border-border bg-card text-text"
                    }`}
                  >
                    {f.shortName}
                  </button>
                ))}
              </div>
            </section>

            <section className="mt-5 flex flex-col gap-2.5">
              <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Шаг 3 · Группа</div>
              <div className="flex flex-wrap gap-2">
                {selectedFaculty?.groups.length ? (
                  selectedFaculty.groups.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => setGroupId(g.id)}
                      className={`rounded-control px-4 py-2.5 text-sm font-medium ${
                        g.id === groupId ? "bg-primary text-white font-semibold" : "border border-border bg-card text-text"
                      }`}
                    >
                      {g.name}
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-text-muted">На этом факультете пока нет групп в системе — обратись к администратору.</p>
                )}
              </div>
            </section>
          </>
        ) : (
          <section className="mt-5 flex flex-col gap-2.5">
            <div className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Шаг 2 · Какие предметы и группы вы ведёте?</div>
            {teaching.map((row, i) => (
              <div key={i} className="flex gap-2 rounded-card border border-border bg-card p-3">
                <select
                  className="flex-1 rounded-control border border-border bg-white px-2 py-2 text-sm"
                  value={row.subjectId}
                  onChange={(e) => {
                    const next = [...teaching];
                    next[i] = { ...next[i], subjectId: e.target.value };
                    setTeaching(next);
                  }}
                >
                  <option value="">Предмет…</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  className="flex-1 rounded-control border border-border bg-white px-2 py-2 text-sm"
                  value={row.groupId}
                  onChange={(e) => {
                    const next = [...teaching];
                    next[i] = { ...next[i], groupId: e.target.value };
                    setTeaching(next);
                  }}
                >
                  <option value="">Группа…</option>
                  {faculties.flatMap((f) => f.groups).map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setTeaching([...teaching, { subjectId: "", groupId: "" }])}
              className="self-start text-sm font-medium text-primary"
            >
              + Добавить ещё предмет/группу
            </button>
          </section>
        )}

        {error && <p className="mt-4 text-sm text-accent">{error}</p>}
      </div>

      <div className="flex-shrink-0 border-t border-border px-4 pb-6 pt-3">
        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={handleSubmit}
          className="w-full rounded-control bg-primary py-3.5 text-center text-base font-semibold text-white disabled:opacity-50"
        >
          {submitting ? "Сохраняем…" : "Продолжить"}
        </button>
      </div>
    </div>
  );
}

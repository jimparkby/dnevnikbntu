"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";

const ICONS = {
  book: (
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
  ),
  calendar: <path d="M3 4h18v18H3zM3 10h18M8 2v4M16 2v4" />,
  chart: <path d="M3 3v18h18M7 15l4-5 3 3 5-7" />,
  people: <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM19 8v6M22 11h-6" />,
  person: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21c0-4 3.6-7 8-7s8 3 8 7" />,
};

function Icon({ name, active }: { name: keyof typeof ICONS; active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "#1B4F91" : "#9AA5B1"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

export default function BottomNav({ role }: { role: Role }) {
  const pathname = usePathname();

  const primary =
    role === "TEACHER"
      ? { href: "/journal", label: "Журнал", icon: "book" as const }
      : { href: "/diary", label: "Дневник", icon: "book" as const };

  const third =
    role === "TEACHER"
      ? { href: "/groups", label: "Группы", icon: "people" as const }
      : { href: "/grades", label: "Оценки", icon: "chart" as const };

  const items = [primary, { href: "/schedule", label: "Расписание", icon: "calendar" as const }, third, { href: "/profile", label: "Профиль", icon: "person" as const }];

  return (
    <nav className="flex flex-shrink-0 border-t border-[#EEF0F2] bg-white px-2 pb-[22px] pt-2">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className="flex flex-1 flex-col items-center gap-[3px]">
            <Icon name={item.icon} active={active} />
            <span className={`text-[11px] ${active ? "font-semibold text-primary" : "text-text-muted"}`}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

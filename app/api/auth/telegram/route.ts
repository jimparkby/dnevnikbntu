import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateTelegramInitData } from "@/lib/telegram";
import { createSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }

  const { initData } = (await req.json()) as { initData?: string };
  if (!initData) {
    return NextResponse.json({ error: "missing_init_data" }, { status: 400 });
  }

  const validated = validateTelegramInitData(initData, botToken);
  if (!validated) {
    return NextResponse.json({ error: "invalid_init_data" }, { status: 401 });
  }

  const { user: tgUser } = validated;

  const user = await prisma.user.upsert({
    where: { telegramId: BigInt(tgUser.id) },
    update: {
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      username: tgUser.username,
    },
    create: {
      telegramId: BigInt(tgUser.id),
      firstName: tgUser.first_name,
      lastName: tgUser.last_name,
      username: tgUser.username,
    },
  });

  await createSession({ userId: user.id });

  return NextResponse.json({ ok: true, needsOnboarding: !user.role });
}

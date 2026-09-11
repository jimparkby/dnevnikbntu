import { getCurrentUser } from "@/backend/lib/currentUser";
import OnboardingForm from "@/frontend/components/OnboardingForm";

export default async function OnboardingPage() {
  const user = await getCurrentUser();
  const isEditing = Boolean(user?.role);

  return (
    <OnboardingForm
      heading={isEditing ? "Смена группы" : "Добро пожаловать"}
      subheading={isEditing ? "Профиль · Дневник БНТУ" : "Настройка профиля · Дневник БНТУ"}
      submitLabel={isEditing ? "Сохранить" : "Продолжить"}
      redirectTo={isEditing ? "/profile" : "/diary"}
      initialRole={user?.role ?? "STUDENT"}
      initialFacultyId={user?.group?.facultyId ?? null}
      initialGroupId={user?.groupId ?? null}
    />
  );
}

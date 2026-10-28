import { getPublicSettings } from "@/lib/settings";
import { isDemo } from "@/lib/demo";
import { PageHead } from "../ui";
import { SettingsForm, PasswordForm } from "./SettingsForms";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const s = await getPublicSettings();
  return (
    <>
      <PageHead title="Settings" sub="Your WhatsApp number, contact details and admin password." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <SettingsForm settings={s} />
        <PasswordForm locked={isDemo()} />
      </div>
    </>
  );
}

import { redirect } from "next/navigation";

export const metadata = {
  title: "今日指引",
  description: "选牌已合并至今日指引主页。"
};

export default function DailyPickRedirectPage() {
  redirect("/daily");
}

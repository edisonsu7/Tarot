import { redirect } from "next/navigation";

export const metadata = {
  title: "说明",
  description: "关于抽牌规则、数据存储与免责声明。"
};

export default function AboutPage() {
  redirect("/privacy");
}

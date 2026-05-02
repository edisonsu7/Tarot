import { AskQuestionForm } from "@/components/AskQuestionForm";

export const metadata = {
  title: "灵感问牌",
  description: "写下你心中的问题，随机抽一张塔罗牌，获得一个方向性提示。",
};

export default function AskPage() {
  return <AskQuestionForm />;
}

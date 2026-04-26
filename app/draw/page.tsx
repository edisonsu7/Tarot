import { DrawSetup } from "@/components/DrawSetup";

export const metadata = {
  title: "灵感问牌",
  description: "写下你的问题，让牌给你一个方向性的提示。"
};

export default function DrawPage() {
  return (
    <div className="home-cream-root mx-auto w-full px-1 pb-4 sm:px-2 sm:pb-6">
      <DrawSetup />
    </div>
  );
}

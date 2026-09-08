import { toast } from "sonner";

export async function copyText(text: string, message = "已复制") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
    return true;
  } catch {
    toast.error("复制失败，请检查浏览器剪贴板权限");
    return false;
  }
}

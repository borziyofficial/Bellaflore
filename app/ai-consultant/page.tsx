"use client";
import { useRouter } from "next/navigation";
import { AiFloristChatWithSummary } from "@/components/aiSalesAgent/AiFloristChatWithSummary";
import styles from "./page.module.css";
export default function AiConsultantPage() {
  const router = useRouter();
  return <main className={styles.main}><div className={styles.container}><AiFloristChatWithSummary onExit={() => router.back()} /></div></main>;
}

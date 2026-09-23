import { AiFloristChatWithSummary } from "@/components/aiSalesAgent/AiFloristChatWithSummary";
import styles from "./page.module.css";

export const metadata = {
  title: "AI-консультант | BellaFlore",
  description: "Интеллектуальный подбор букетов",
};

export default function AiConsultantPage() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <AiFloristChatWithSummary />
      </div>
    </main>
  );
}

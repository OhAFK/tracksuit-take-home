import { useEffect, useState } from "react";
import { Header } from "../components/header/header.tsx";
import { Insights } from "../components/insights/insights.tsx";
import styles from "./app.module.css";
import { Insight } from "../schemas/insight.ts";

export const App = () => {
  const [loadState, setLoadState] = useState<
    | { status: "loading" }
    | { status: "success"; insights: Insight[] }
    | { status: "error" }
  >({ status: "loading" });

  useEffect(() => {
    let active = true;

    const loadInsights = async () => {
      const response = await fetch("/api/insights");
      if (!response.ok) {
        throw new Error(`Failed to load insights: ${response.status}`);
      }

      const insights = Insight.array().parse(await response.json());
      if (active) setLoadState({ status: "success", insights });
    };

    loadInsights().catch((error: unknown) => {
      console.error("Failed to load insights", error);
      if (active) setLoadState({ status: "error" });
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className={styles.main}>
      <Header
        onInsightCreated={(insight) =>
          setLoadState((current) => ({
            status: "success",
            insights: current.status === "success"
              ? [...current.insights, insight]
              : [insight],
          }))}
      />
      {loadState.status === "loading"
        ? (
          <p className={styles.stateMessage} role="status">
            Loading insights...
          </p>
        )
        : loadState.status === "error"
        ? (
          <p className={styles.stateMessage} role="alert">
            Unable to load insights. Please try again later.
          </p>
        )
        : (
          <Insights
            insights={loadState.insights}
            onInsightDeleted={(id) =>
              setLoadState((current) =>
                current.status === "success"
                  ? {
                    ...current,
                    insights: current.insights.filter((insight) =>
                      insight.id !== id
                    ),
                  }
                  : current
              )}
            className={styles.insights}
          />
        )}
    </main>
  );
};

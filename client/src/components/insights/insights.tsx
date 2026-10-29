import { useState } from "react";
import { Trash2Icon } from "lucide-react";
import { cx } from "../../lib/cx.ts";
import styles from "./insights.module.css";
import type { Insight } from "../../schemas/insight.ts";

type InsightsProps = {
  insights: Insight[];
  onInsightDeleted(id: number): void;
  className?: string;
};

export const Insights = ({
  insights,
  onInsightDeleted,
  className,
}: InsightsProps) => {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState(false);

  const deleteInsight = async (id: number) => {
    setDeletingId(id);
    setDeleteError(false);

    try {
      const response = await fetch(`/api/insights?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`Failed to delete insight: ${response.status}`);
      }

      onInsightDeleted(id);
    } catch (error: unknown) {
      console.error("Failed to delete insight", error);
      setDeleteError(true);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className={cx(className)}>
      <h1 className={styles.heading}>Insights</h1>
      <div className={styles.list}>
        {insights?.length ? (
          insights.map(({ id, text, date, brandId }) => (
            <div className={styles.insight} key={id}>
              <div className={styles["insight-meta"]}>
                <span>{brandId}</span>
                <div className={styles["insight-meta-details"]}>
                  <span>{date.toString()}</span>
                  <button
                    className={styles["insight-delete"]}
                    type="button"
                    aria-label={`Delete insight ${id}`}
                    disabled={deletingId !== null}
                    onClick={() => deleteInsight(id)}
                  >
                    <Trash2Icon aria-hidden="true" />
                  </button>
                </div>
              </div>
              <p className={styles["insight-content"]}>{text}</p>
            </div>
          ))
        ) : (
          <p>We have no insight!</p>
        )}
      </div>
      {deleteError && (
        <p role="alert">Unable to delete insight. Please try again.</p>
      )}
    </div>
  );
};

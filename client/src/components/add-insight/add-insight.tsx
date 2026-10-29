import { type FormEvent, useState } from "react";
import { BRANDS } from "../../lib/consts.ts";
import { Insight } from "../../schemas/insight.ts";
import { Button } from "../button/button.tsx";
import { Modal, type ModalProps } from "../modal/modal.tsx";
import styles from "./add-insight.module.css";

type AddInsightProps = ModalProps & {
  onCreated(insight: Insight): void;
};

export const AddInsight = ({ onCreated, ...modalProps }: AddInsightProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  const addInsight = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(undefined);

    try {
      const formData = new FormData(event.currentTarget);
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandId: Number(formData.get("brandId")),
          text: formData.get("text"),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create insight: ${response.status}`);
      }

      const insight = Insight.parse(await response.json());
      onCreated(insight);
      modalProps.onClose();
    } catch (submitError: unknown) {
      console.error("Failed to create insight", submitError);
      setError("Unable to add insight. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal {...modalProps}>
      <h1 className={styles.heading}>Add a new insight</h1>
      <form className={styles.form} onSubmit={addInsight}>
        <label className={styles.field}>
          Brand
          <select
            className={styles["field-input"]}
            name="brandId"
            required
            disabled={isSubmitting}
          >
            {BRANDS.map(({ id, name }) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          Insight
          <textarea
            className={styles["field-input"]}
            name="text"
            rows={5}
            placeholder="Something insightful..."
            required
            disabled={isSubmitting}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <Button
          className={styles.submit}
          type="submit"
          label={isSubmitting ? "Adding..." : "Add insight"}
          disabled={isSubmitting}
        />
      </form>
    </Modal>
  );
};

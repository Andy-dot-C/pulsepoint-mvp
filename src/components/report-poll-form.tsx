 "use client";

import { useState } from "react";
import { submitPollReportAction } from "@/app/actions/reports";
import { REPORT_REASONS } from "@/lib/report-reasons";

type ReportPollFormProps = {
  pollId: string;
  returnTo: string;
  statusType?: string;
  statusMessage?: string;
};

export function ReportPollForm({ pollId, returnTo, statusType, statusMessage }: ReportPollFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="report-panel">
      <button className="ghost-btn" type="button" onClick={() => setIsOpen((current) => !current)}>
        {isOpen ? "Hide report form" : "Report this poll"}
      </button>

      {isOpen ? (
        <form action={submitPollReportAction} className="submit-form" style={{ marginTop: 10 }}>
          <input type="hidden" name="pollId" value={pollId} />
          <input type="hidden" name="returnTo" value={returnTo} />

          <label>
            Reason
            <select name="reason" required>
              {REPORT_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            Details (optional)
            <textarea name="details" rows={3} placeholder="Add context for moderators" />
          </label>

          <button className="ghost-btn" type="submit">
            Submit report
          </button>
        </form>
      ) : null}
      {statusMessage ? (
        <p className={statusType === "error" ? "auth-error" : "auth-success"}>
          {statusMessage}
        </p>
      ) : null}
      {isOpen ? (
        <p className="submit-hint">
          Please report only clear issues (misleading wording, duplicate, abuse, or factual errors).
        </p>
      ) : null}
    </section>
  );
}

import { ACTIVITY_SUBTYPES } from "@/lib/constants";
import type { ActivityDetails } from "@/lib/types";
import { format } from "date-fns";

export interface DepositTermDetails {
  interestStartDate: Date;
  maturityDate: Date;
  interestRate?: number | null;
}

function parseDateValue(value: unknown): Date | null {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T12:00:00` : trimmed;
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getDepositTermDetails(
  activity?: Pick<ActivityDetails, "subtype" | "metadata"> | null,
): DepositTermDetails | null {
  if (!activity) return null;

  const subtype = activity.subtype?.trim().toUpperCase();
  const termDeposit = activity.metadata?.term_deposit;
  if (subtype !== ACTIVITY_SUBTYPES.FIXED_TERM && !termDeposit) {
    return null;
  }

  if (!termDeposit || typeof termDeposit !== "object") {
    return null;
  }

  const termRecord = termDeposit as Record<string, unknown>;
  const interestStartDate = parseDateValue(termRecord.interest_start_date);
  const maturityDate = parseDateValue(termRecord.maturity_date);
  if (!interestStartDate || !maturityDate) {
    return null;
  }

  const interestRateRaw = termRecord.interest_rate;
  const interestRate =
    typeof interestRateRaw === "string"
      ? Number(interestRateRaw)
      : typeof interestRateRaw === "number"
        ? interestRateRaw
        : null;

  return {
    interestStartDate,
    maturityDate,
    interestRate: Number.isFinite(interestRate as number) ? interestRate : null,
  };
}

export function formatDepositTermRange(details: DepositTermDetails | null): string | null {
  if (!details) return null;

  return `${format(details.interestStartDate, "PP")} ~ ${format(details.maturityDate, "PP")}`;
}

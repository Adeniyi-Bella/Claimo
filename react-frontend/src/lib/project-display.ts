
import { itemTotals } from "@/utils";
import type { PaymentItem } from "@/api/dto/responseDto";

export function getJobStatusLabel(status: PaymentItem["jobStatus"] | undefined) {
  switch (status ?? "NOT_STARTED") {
    case "COMPLETED":
      return "Completed";
    case "IN_PROGRESS":
      return "In Progress";
    default:
      return "Not Started";
  }
}

export function getJobStatusClass(status: PaymentItem["jobStatus"] | undefined) {
  switch (status ?? "NOT_STARTED") {
    case "COMPLETED":
      return "bg-status-approved text-status-approved-fg border-status-approved-fg/20";
    case "IN_PROGRESS":
      return "bg-status-submitted text-status-submitted-fg border-status-submitted-fg/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function getPaymentStatusLabel(
  status: PaymentItem["paymentStatus"] | undefined,
) {
  const value = status ?? "NONE";
  return value.charAt(0) + value.slice(1).toLowerCase();
}

export function getPaymentStatusClass(
  status: PaymentItem["paymentStatus"] | undefined,
) {
  switch (status ?? "NONE") {
    case "APPROVED":
      return "bg-status-approved text-status-approved-fg border-status-approved-fg/20";
    case "PAID":
      return "bg-status-submitted text-status-submitted-fg border-status-submitted-fg/20";
    case "REJECTED":
      return "bg-status-rejected text-status-rejected-fg border-status-rejected-fg/20";
    default:
      return "bg-muted text-muted-foreground border-border";
  }
}

export function getSubmittedOrApprovedAmount(item: PaymentItem) {
  const totals = itemTotals(item);
  return totals.pending > 0
    ? totals.pending
    : totals.approved > 0
      ? totals.approved
      : null;
}

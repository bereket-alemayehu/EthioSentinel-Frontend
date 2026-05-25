import { CheckCircle2, Trash2, Undo2, XCircle } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { Button } from "@/shared/components/ui/button";

type AlertActionsProps = {
  variant: "alert";
  status: "Draft" | "Approved";
  isPending: boolean;
  pendingAction?: "approve" | "reject";
  onApprove: () => void;
  onReject: () => void;
  approveLabel: string;
  rejectLabel: string;
};

type AdvisoryActionsProps = {
  variant: "advisory";
  status: string;
  isPending: boolean;
  pendingAction?: "approve" | "reject" | "withdraw";
  onApprove: () => void;
  onReject: () => void;
  onWithdraw?: () => void;
  approveLabel: string;
  rejectLabel: string;
  withdrawLabel: string;
};

type AdminApprovalActionsProps = AlertActionsProps | AdvisoryActionsProps;

export function AdminApprovalActions(props: AdminApprovalActionsProps) {
  const { isPending, pendingAction } = props;

  if (props.variant === "alert") {
    if (props.status !== "Draft") {
      return null;
    }

    return (
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={props.onApprove}
          disabled={isPending}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          {isPending && pendingAction === "approve" ? (
            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
          {props.approveLabel}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={props.onReject}
          disabled={isPending}
          className="gap-2 border-red-200 text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          {isPending && pendingAction === "reject" ? (
            <span className="h-4 w-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {props.rejectLabel}
        </Button>
      </div>
    );
  }

  const isDraft = props.status === "DRAFT";

  if (!isDraft) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={props.onWithdraw}
        disabled={isPending || !props.onWithdraw}
        className="gap-2 border-orange-200 text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30"
      >
        {isPending && pendingAction === "withdraw" ? (
          <span className="h-4 w-4 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
        ) : (
          <Undo2 className="h-4 w-4" />
        )}
        {props.withdrawLabel}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        type="button"
        onClick={props.onApprove}
        disabled={isPending}
        className="gap-2 bg-teal-600 hover:bg-teal-700"
      >
        {isPending && pendingAction === "approve" ? (
          <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        {props.approveLabel}
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={props.onReject}
        disabled={isPending}
        className={cn(
          "gap-2 border-slate-200 text-slate-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/30",
        )}
      >
        {isPending && pendingAction === "reject" ? (
          <span className="h-4 w-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
        {props.rejectLabel}
      </Button>
    </div>
  );
}

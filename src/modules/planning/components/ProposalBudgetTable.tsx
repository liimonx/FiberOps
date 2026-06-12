import type { BudgetLineItem } from "@/types/domain";

type ProposalBudgetTableProps = {
  lineItems: BudgetLineItem[];
  totalUsd: number;
};

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ProposalBudgetTable({
  lineItems,
  totalUsd,
}: ProposalBudgetTableProps) {
  if (lineItems.length === 0) {
    return (
      <p className="u-text-sm u-text-secondary-emphasis u-mb-0">
        No budget line items defined. Total estimate: {formatUsd(totalUsd)}.
      </p>
    );
  }

  return (
    <div className="u-overflow-x-auto">
      <table className="u-w-100 u-text-sm">
        <thead>
          <tr className="u-border-bottom u-border-secondary-subtle">
            <th className="u-text-start u-pb-2 u-font-bold">Category</th>
            <th className="u-text-end u-pb-2 u-font-bold">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item, index) => (
            <tr
              key={`${item.category}-${index}`}
              className="u-border-bottom u-border-secondary-subtle"
            >
              <td className="u-py-2">
                <div>{item.category}</div>
                {item.notes && (
                  <div className="u-text-xs u-text-secondary-emphasis">
                    {item.notes}
                  </div>
                )}
              </td>
              <td className="u-py-2 u-text-end u-font-mono">
                {formatUsd(item.amountUsd)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="u-pt-3 u-font-bold">Total</td>
            <td className="u-pt-3 u-text-end u-font-bold u-font-mono">
              {formatUsd(totalUsd)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

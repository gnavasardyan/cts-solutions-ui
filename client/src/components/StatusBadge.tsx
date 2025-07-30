import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
}

const statusConfig = {
  production: {
    label: "Производство",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  ready_to_ship: {
    label: "Готов к отправке",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
  in_transit: {
    label: "В пути",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
  in_storage: {
    label: "На хранении",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  in_assembly: {
    label: "В монтаже",
    className: "bg-purple-100 text-purple-800 border-purple-200",
  },
  in_operation: {
    label: "В эксплуатации",
    className: "bg-green-100 text-green-800 border-green-200",
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    className: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className
      )}
    >
      {config.label}
    </span>
  );
}

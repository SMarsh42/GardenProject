import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  iconBgColor: string;
  iconColor: string;
  footerLabel?: string;
  footerValue?: string | number;
  footerElement?: ReactNode;
  progressValue?: number;
  progressColor?: string;
}

export function StatCard({
  title,
  value,
  icon,
  iconBgColor,
  iconColor,
  footerLabel,
  footerValue,
  footerElement,
  progressValue,
  progressColor = "bg-primary"
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <h3 className="text-2xl font-bold text-gray-800">{value}</h3>
        </div>
        <div className={`${iconBgColor} rounded-full p-3`}>
          <span className={`material-icons ${iconColor}`}>{icon}</span>
        </div>
      </div>
      <div className="mt-4">
        {footerLabel && footerValue && (
          <div className="flex items-center">
            <span className="text-xs text-gray-500">{footerLabel}:</span>
            <span className="ml-1 text-xs font-medium">{footerValue}</span>
          </div>
        )}
        {progressValue !== undefined && (
          <div className="mt-2 relative pt-1">
            <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
              <div 
                style={{ width: `${progressValue}%` }} 
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${progressColor}`}
              ></div>
            </div>
          </div>
        )}
        {footerElement && (
          <div className="mt-2">
            {footerElement}
          </div>
        )}
      </div>
    </div>
  );
}

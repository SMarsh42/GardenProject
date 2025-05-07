import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(dateObj);
}

export function formatDateTime(date: Date | string): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  }).format(dateObj);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function getMonthName(date: Date | string): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(dateObj).toUpperCase();
}

export function getDayOfMonth(date: Date | string): string {
  if (!date) return "";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  return dateObj.getDate().toString();
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "available":
      return "#e5f5e0";
    case "assigned":
      return "#a1d99b";
    case "paid":
      return "#31a354";
    case "unavailable":
      return "#f0f0f0";
    case "pending":
      return "#ffecb3";
    case "approved":
      return "#c8e6c9";
    case "rejected":
      return "#ffcdd2";
    default:
      return "#f0f0f0";
  }
}

export function calculatePriorityLevel(priority: number): { text: string, color: string, percentage: number } {
  if (priority >= 8) {
    return { text: "High", color: "#4caf50", percentage: 90 };
  } else if (priority >= 5) {
    return { text: "Medium", color: "#2196f3", percentage: 50 };
  } else {
    return { text: "Low", color: "#ff9800", percentage: 25 };
  }
}

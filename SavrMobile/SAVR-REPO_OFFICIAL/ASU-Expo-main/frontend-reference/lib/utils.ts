import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (dateString?: string | null): string => {
  if (!dateString) {
    return 'N/A'; 
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  } catch (e) {
    console.error("Error formatting date:", dateString, e);
    return 'Date Error';
  }
};

export const formatPrice = (price?: number | null): string => {
  if (price === null || price === undefined) {
    return 'N/A';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD' // Or your desired currency
  }).format(price);
};

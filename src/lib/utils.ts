import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates the age of a person given their birth date and optional death date.
 * Provides a more accurate age by considering the month and day, not just the year.
 * If the birthday for the current year has not occurred yet, it subtracts one year.
 *
 * @param {string} [birthDate] - The birth date of the person in a string format recognizable by `new Date()`.
 * @param {string} [deathDate] - The death date of the person in a string format recognizable by `new Date()`.
 *                               If not provided, the current date is used as the end date.
 * @returns {number | null} The calculated age in years, or `null` if the birthDate is not provided.
 */
export const calculateAge = (birthDate?: string, deathDate?: string): number | null => {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const end = deathDate ? new Date(deathDate) : new Date(); // Use death date or current date as the end point.

  let age = end.getFullYear() - birth.getFullYear();

  // Check if the birthday for the end year has occurred yet.
  // If the birth month is later than the end month, or if it's the same month but a later day,
  // then the birthday hasn't passed yet in the end year, so subtract 1 from the age.
  const monthDiff = end.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && end.getDate() < birth.getDate())) {
    age--;
  }

  return age;
};

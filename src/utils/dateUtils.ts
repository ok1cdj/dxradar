/**
 * Determines the urgency of an expedition based on its date string.
 * Returns 'last-day' if today is the last day, 
 * 'last-2-days' if today is the second to last day,
 * or 'none' otherwise.
 */
export function getExpeditionUrgency(dates: string): 'none' | 'last-2-days' | 'last-day' {
  if (!dates) return 'none';
  
  const now = new Date();
  // Set to start of day for comparison
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  try {
    // Extract year
    const yearMatch = dates.match(/(\d{4})/);
    const year = yearMatch ? parseInt(yearMatch[1]) : now.getFullYear();
    
    let endDate: Date | null = null;
    
    // Handle format: "Mar 3-20, 2026"
    const singleMonthRange = dates.match(/([A-Z][a-z]{2})\s+(\d+)-(\d+)/i);
    if (singleMonthRange) {
      const monthStr = singleMonthRange[1];
      const endDay = parseInt(singleMonthRange[3]);
      endDate = new Date(`${monthStr} ${endDay}, ${year}`);
    }
    
    // Handle format: "Feb 26-Mar 20, 2026"
    const multiMonthRange = dates.match(/([A-Z][a-z]{2})\s+(\d+)-([A-Z][a-z]{2})\s+(\d+)/i);
    if (multiMonthRange) {
      const endMonth = multiMonthRange[3];
      const endDay = multiMonthRange[4];
      endDate = new Date(`${endMonth} ${endDay}, ${year}`);
    }

    if (!endDate || isNaN(endDate.getTime())) return 'none';
    
    // Set endDate to start of day for comparison
    const endDayDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
    
    const diffTime = endDayDate.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'last-day';
    if (diffDays === 1) return 'last-2-days';
    
    return 'none';
  } catch (e) {
    return 'none';
  }
}

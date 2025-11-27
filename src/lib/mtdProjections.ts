import { Deal } from '@/types/dashboard';
import { startOfMonth, endOfMonth, differenceInDays, eachDayOfInterval, isWeekend } from 'date-fns';

/**
 * US Bank Holidays (days when wire transfers cannot be sent)
 * These are the Federal Reserve holidays
 */
function getUSBankHolidays(year: number): Date[] {
  const holidays: Date[] = [];
  
  // New Year's Day (January 1)
  holidays.push(new Date(year, 0, 1));
  
  // Martin Luther King Jr. Day (3rd Monday in January)
  const mlkDay = getNthWeekdayOfMonth(year, 0, 1, 3);
  holidays.push(mlkDay);
  
  // Presidents' Day (3rd Monday in February)
  const presidentsDay = getNthWeekdayOfMonth(year, 1, 1, 3);
  holidays.push(presidentsDay);
  
  // Memorial Day (Last Monday in May)
  const memorialDay = getLastWeekdayOfMonth(year, 4, 1);
  holidays.push(memorialDay);
  
  // Juneteenth (June 19)
  holidays.push(new Date(year, 5, 19));
  
  // Independence Day (July 4)
  holidays.push(new Date(year, 6, 4));
  
  // Labor Day (1st Monday in September)
  const laborDay = getNthWeekdayOfMonth(year, 8, 1, 1);
  holidays.push(laborDay);
  
  // Columbus Day (2nd Monday in October)
  const columbusDay = getNthWeekdayOfMonth(year, 9, 1, 2);
  holidays.push(columbusDay);
  
  // Veterans Day (November 11)
  holidays.push(new Date(year, 10, 11));
  
  // Thanksgiving Day (4th Thursday in November)
  const thanksgiving = getNthWeekdayOfMonth(year, 10, 4, 4);
  holidays.push(thanksgiving);
  
  // Christmas Day (December 25)
  holidays.push(new Date(year, 11, 25));
  
  // If holiday falls on Saturday, observed on Friday
  // If holiday falls on Sunday, observed on Monday
  return holidays.map(holiday => {
    const day = holiday.getDay();
    if (day === 0) { // Sunday
      return new Date(holiday.getFullYear(), holiday.getMonth(), holiday.getDate() + 1);
    } else if (day === 6) { // Saturday
      return new Date(holiday.getFullYear(), holiday.getMonth(), holiday.getDate() - 1);
    }
    return holiday;
  });
}

/**
 * Get the nth occurrence of a weekday in a month
 */
function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const offset = (weekday - firstWeekday + 7) % 7;
  const date = 1 + offset + (n - 1) * 7;
  return new Date(year, month, date);
}

/**
 * Get the last occurrence of a weekday in a month
 */
function getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const lastDay = new Date(year, month + 1, 0);
  const lastWeekday = lastDay.getDay();
  const offset = (lastWeekday - weekday + 7) % 7;
  const date = lastDay.getDate() - offset;
  return new Date(year, month, date);
}

/**
 * Check if a date is a US bank holiday
 */
function isUSBankHoliday(date: Date, holidays: Date[]): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return holidays.some(holiday => holiday.toISOString().split('T')[0] === dateStr);
}

/**
 * Calculate business days between two dates (excluding weekends and US bank holidays)
 */
function calculateBusinessDays(startDate: Date, endDate: Date): number {
  const holidays = getUSBankHolidays(startDate.getFullYear());
  const nextYearHolidays = startDate.getFullYear() !== endDate.getFullYear()
    ? getUSBankHolidays(endDate.getFullYear())
    : [];
  const allHolidays = [...holidays, ...nextYearHolidays];
  
  const days = eachDayOfInterval({ start: startDate, end: endDate });
  
  return days.filter(day => {
    if (isWeekend(day)) return false;
    if (isUSBankHoliday(day, allHolidays)) return false;
    return true;
  }).length;
}

export interface MTDMetrics {
  // Current performance
  mtdFunded: number;
  mtdDeals: number;
  mtdAvgTicket: number;
  
  // Target tracking
  monthlyTarget: number;
  targetProgress: number;
  remainingToTarget: number;
  
  // Time metrics
  daysElapsed: number;
  daysRemaining: number;
  businessDaysElapsed: number;
  businessDaysRemaining: number;
  monthProgress: number;
  
  // Projections
  projectedMonthEnd: number;
  projectedVsTarget: number;
  projectionConfidence: 'High' | 'Medium' | 'Low';
  
  // Burn rate
  dailyBurnRate: number;
  businessDailyBurnRate: number;
  targetDailyBurnRate: number;
  burnRateStatus: 'Ahead' | 'On Track' | 'Behind';
  
  // Pace metrics
  requiredDailyPace: number;
  currentPaceVsRequired: number;
  paceStatus: 'Ahead' | 'On Track' | 'Behind';
}

/**
 * Calculate MTD metrics and projections
 */
export function calculateMTDMetrics(deals: Deal[], annualTarget: number = 360000000): MTDMetrics {
  const today = new Date();
  const firstDayOfMonth = startOfMonth(today);
  const lastDayOfMonth = endOfMonth(today);
  
  // Filter deals for MTD
  const mtdDeals = deals.filter(deal => {
    const dealDate = deal.fundingDate;
    return dealDate >= firstDayOfMonth && dealDate <= today;
  });
  
  // Current MTD performance
  const mtdFunded = mtdDeals.reduce((sum, deal) => sum + deal.fundedAmount, 0);
  const mtdDealsCount = mtdDeals.length;
  const mtdAvgTicket = mtdDealsCount > 0 ? mtdFunded / mtdDealsCount : 0;
  
  // Target calculations
  const monthlyTarget = annualTarget / 12;
  const targetProgress = (mtdFunded / monthlyTarget) * 100;
  const remainingToTarget = Math.max(0, monthlyTarget - mtdFunded);
  
  // Time metrics
  const daysElapsed = differenceInDays(today, firstDayOfMonth) + 1; // +1 to include today
  const daysRemaining = differenceInDays(lastDayOfMonth, today);
  const totalDaysInMonth = differenceInDays(lastDayOfMonth, firstDayOfMonth) + 1;
  const monthProgress = (daysElapsed / totalDaysInMonth) * 100;
  
  // Business days (Mon-Fri, excluding US bank holidays)
  const businessDaysElapsed = calculateBusinessDays(firstDayOfMonth, today);
  const businessDaysRemaining = calculateBusinessDays(today, lastDayOfMonth);
  const totalBusinessDaysInMonth = calculateBusinessDays(firstDayOfMonth, lastDayOfMonth);
  
  // Burn rate calculations (based on business days)
  const dailyBurnRate = businessDaysElapsed > 0 ? mtdFunded / businessDaysElapsed : 0;
  const businessDailyBurnRate = businessDaysElapsed > 0 ? mtdFunded / businessDaysElapsed : 0;
  const targetDailyBurnRate = totalBusinessDaysInMonth > 0 ? monthlyTarget / totalBusinessDaysInMonth : 0;
  
  // Determine burn rate status
  let burnRateStatus: 'Ahead' | 'On Track' | 'Behind';
  const burnRateDiff = targetDailyBurnRate > 0 
    ? ((dailyBurnRate - targetDailyBurnRate) / targetDailyBurnRate) * 100 
    : 0;
  if (burnRateDiff > 10) {
    burnRateStatus = 'Ahead';
  } else if (burnRateDiff < -10) {
    burnRateStatus = 'Behind';
  } else {
    burnRateStatus = 'On Track';
  }
  
  // Projection calculations (based on business days)
  const projectedMonthEnd = businessDaysElapsed >= 3 
    ? dailyBurnRate * totalBusinessDaysInMonth // Project based on current pace
    : monthlyTarget * (monthProgress / 100); // Early month: use linear projection
  
  const projectedVsTarget = projectedMonthEnd - monthlyTarget;
  
  // Projection confidence (more data = higher confidence)
  let projectionConfidence: 'High' | 'Medium' | 'Low';
  if (businessDaysElapsed >= 10) {
    projectionConfidence = 'High';
  } else if (businessDaysElapsed >= 5) {
    projectionConfidence = 'Medium';
  } else {
    projectionConfidence = 'Low';
  }
  
  // Required pace to hit target (based on business days)
  const requiredDailyPace = businessDaysRemaining > 0 
    ? remainingToTarget / businessDaysRemaining 
    : 0;
  
  const currentPaceVsRequired = requiredDailyPace > 0 
    ? ((dailyBurnRate - requiredDailyPace) / requiredDailyPace) * 100 
    : 0;
  
  // Determine pace status
  let paceStatus: 'Ahead' | 'On Track' | 'Behind';
  if (targetProgress >= monthProgress + 5) {
    paceStatus = 'Ahead';
  } else if (targetProgress < monthProgress - 5) {
    paceStatus = 'Behind';
  } else {
    paceStatus = 'On Track';
  }
  
  return {
    // Current performance
    mtdFunded,
    mtdDeals: mtdDealsCount,
    mtdAvgTicket,
    
    // Target tracking
    monthlyTarget,
    targetProgress,
    remainingToTarget,
    
    // Time metrics
    daysElapsed,
    daysRemaining,
    businessDaysElapsed,
    businessDaysRemaining,
    monthProgress,
    
    // Projections
    projectedMonthEnd,
    projectedVsTarget,
    projectionConfidence,
    
    // Burn rate
    dailyBurnRate,
    businessDailyBurnRate,
    targetDailyBurnRate,
    burnRateStatus,
    
    // Pace metrics
    requiredDailyPace,
    currentPaceVsRequired,
    paceStatus
  };
}

/**
 * Format number as compact currency (e.g., $2.5M)
 */
export function formatCompactCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
}

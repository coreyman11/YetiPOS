/**
 * Utility functions for calculating loyalty points values and redemptions
 */

export interface LoyaltyProgram {
  id: number;
  points_per_dollar: number;
  minimum_points_redeem: number;
  points_value_cents: number;
  is_active?: boolean;
}

/**
 * Calculate the dollar value of loyalty points
 */
export function calculatePointsValue(points: number, program: LoyaltyProgram): number {
  if (!program || points <= 0) return 0;
  return (points * program.points_value_cents) / 100;
}

/**
 * Calculate the maximum points that can be used for a given amount
 */
export function calculateMaxUsablePoints(
  availablePoints: number,
  maxAmount: number,
  program: LoyaltyProgram
): number {
  if (!program || availablePoints <= 0 || maxAmount <= 0) return 0;
  
  // Calculate max points based on dollar value limit
  const maxPointsByValue = Math.floor((maxAmount * 100) / program.points_value_cents);
  
  // Return the minimum of available points and max points by value
  return Math.min(availablePoints, maxPointsByValue);
}

/**
 * Validate if a loyalty points redemption is valid
 */
export function validateRedemption(
  pointsToRedeem: number,
  availablePoints: number,
  program: LoyaltyProgram
): { isValid: boolean; error?: string } {
  if (!program) {
    return { isValid: false, error: "No loyalty program found" };
  }
  
  if (pointsToRedeem <= 0) {
    return { isValid: false, error: "Points to redeem must be greater than 0" };
  }
  
  if (pointsToRedeem > availablePoints) {
    return { isValid: false, error: "Insufficient points balance" };
  }
  
  if (pointsToRedeem < program.minimum_points_redeem) {
    return { isValid: false, error: `Minimum redemption is ${program.minimum_points_redeem} points` };
  }
  
  return { isValid: true };
}

/**
 * Calculate loyalty points earned for a transaction amount
 */
export function calculatePointsEarned(amount: number, program: LoyaltyProgram): number {
  if (!program || amount <= 0) return 0;
  return Math.floor(amount * program.points_per_dollar);
}
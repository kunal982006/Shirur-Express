// How money moves on a restaurant or street food order delivered by a partner.
//
// Shirur Express is the restaurant's customer: the delivery partner pays the
// restaurant its own menu price at pickup. The partner earns a fixed amount per
// order. On a cash order he collects the order total from the customer; on an
// online order he collects nothing. What is left over is settled with Shirur
// Express at the end of the day.

export const PARTNER_EARNING = 40;
export const PARTNER_EARNING_YASH_BIRYANI = 50;

/** What the delivery partner earns for one order from this restaurant. */
export function partnerEarningFor(restaurantName: string | null | undefined): number {
  return /yash\s*biryani/i.test(restaurantName || "") ? PARTNER_EARNING_YASH_BIRYANI : PARTNER_EARNING;
}

export interface OrderSettlement {
  /** Order total the customer pays (online or cash). */
  customerTotal: number;
  isCod: boolean;
  /** What the partner pays the restaurant at pickup. */
  restaurantBill: number;
  /** Dishes on the order with no restaurant price entered yet; the bill leaves them out. */
  missingPrices: number;
  /** Cash the partner takes from the customer (0 when paid online). */
  collectFromCustomer: number;
  partnerEarning: number;
  /** Positive: the partner gives this to Shirur Express. Negative: Shirur Express pays the partner. */
  partnerOwes: number;
  /** Customer total minus the restaurant bill and the partner's earning. */
  shirurProfit: number;
}

export function settleOrder(input: {
  customerTotal: number;
  isCod: boolean;
  restaurantBill: number;
  missingPrices: number;
  restaurantName: string | null | undefined;
}): OrderSettlement {
  const partnerEarning = partnerEarningFor(input.restaurantName);
  const collectFromCustomer = input.isCod ? input.customerTotal : 0;
  return {
    customerTotal: input.customerTotal,
    isCod: input.isCod,
    restaurantBill: input.restaurantBill,
    missingPrices: input.missingPrices,
    collectFromCustomer,
    partnerEarning,
    partnerOwes: collectFromCustomer - input.restaurantBill - partnerEarning,
    shirurProfit: input.customerTotal - input.restaurantBill - partnerEarning,
  };
}

export interface SettlementTotals {
  orders: number;
  cashOrders: number;
  onlineOrders: number;
  customerTotal: number;
  collectedFromCustomers: number;
  paidToRestaurants: number;
  partnerEarnings: number;
  /** Positive: the partner gives this to Shirur Express. Negative: Shirur Express pays the partner. */
  partnerOwes: number;
  shirurProfit: number;
  /** Orders whose restaurant bill is incomplete because some dish prices are missing. */
  ordersMissingPrices: number;
}

export function addUpSettlements(list: OrderSettlement[]): SettlementTotals {
  const totals: SettlementTotals = {
    orders: 0, cashOrders: 0, onlineOrders: 0, customerTotal: 0, collectedFromCustomers: 0,
    paidToRestaurants: 0, partnerEarnings: 0, partnerOwes: 0, shirurProfit: 0, ordersMissingPrices: 0,
  };
  for (const s of list) {
    totals.orders += 1;
    if (s.isCod) totals.cashOrders += 1; else totals.onlineOrders += 1;
    totals.customerTotal += s.customerTotal;
    totals.collectedFromCustomers += s.collectFromCustomer;
    totals.paidToRestaurants += s.restaurantBill;
    totals.partnerEarnings += s.partnerEarning;
    totals.partnerOwes += s.partnerOwes;
    totals.shirurProfit += s.shirurProfit;
    if (s.missingPrices > 0) totals.ordersMissingPrices += 1;
  }
  return totals;
}

/** Today's date in India as YYYY-MM-DD. */
export function istToday(now = new Date()): string {
  return new Date(now.getTime() + 5.5 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

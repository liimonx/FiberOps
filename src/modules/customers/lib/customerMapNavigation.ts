export const CUSTOMER_MAP_QUERY_PARAM = "customer";

export function getCustomerMapUrl(customerId: string): string {
  return `/network-map?${CUSTOMER_MAP_QUERY_PARAM}=${encodeURIComponent(customerId)}`;
}

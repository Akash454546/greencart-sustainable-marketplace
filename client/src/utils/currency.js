// Currency conversion utility
const USD_TO_INR = 80;

export function formatPrice(priceInUSD) {
  const priceInINR = priceInUSD * USD_TO_INR;
  return `₹${priceInINR.toFixed(0)}`;
}

export function formatPriceWithDecimals(priceInUSD) {
  const priceInINR = priceInUSD * USD_TO_INR;
  return `₹${priceInINR.toFixed(2)}`;
}

export function convertToINR(priceInUSD) {
  return priceInUSD * USD_TO_INR;
}

export const formatMoney = (value: number): string =>
  `Rs ${value.toLocaleString("en-IN")}`;

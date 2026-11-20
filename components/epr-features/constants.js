export const WASTE_CATEGORIES = [
  { key: "plastic", label: "Plastic", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
  { key: "ewaste", label: "E-Waste", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300" },
  { key: "battery", label: "Battery", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  { key: "tyre", label: "Tyre", color: "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
  { key: "usedoil", label: "Used Oil", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" },
  { key: "elv", label: "ELV", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
];

export const CATEGORY_MULTIPLIERS = {
  plastic: 0.05,
  ewaste: 0.03,
  battery: 0.04,
  tyre: 0.06,
  usedoil: 0.04,
  elv: 0.02,
};

export const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan",
  "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
];

export function getCategoryByKey(key) {
  return WASTE_CATEGORIES.find((c) => c.key === key);
}

export function CategoryBadge({ categoryKey }) {
  const cat = getCategoryByKey(categoryKey);
  if (!cat) return null;
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${cat.color}`}>
      {cat.label}
    </span>
  );
}

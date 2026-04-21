"use client";
export default function LocaleSwitcher({ locale }: { locale: string }) {
  return (
    <select
      defaultValue={locale}
      onChange={(e) => {
        window.location.href = `/${e.target.value}`;
      }}
      className="text-sm border border-gray-200 rounded-full px-3 py-1.5 text-gray-700 outline-none cursor-pointer"
    >
      <option value="en">EN</option>
      <option value="ru">RU</option>
      <option value="tj">TJ</option>
    </select>
  );
}
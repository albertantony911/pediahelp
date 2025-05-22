'use client';

import clsx from 'clsx';

interface Category {
  _id: string;
  title: string;
}

interface BlogCategoryFilterProps {
  categories: Category[];
  selected: string;
  onSelect: (categoryId: string) => void;
}

export default function BlogCategoryFilter({
  categories,
  selected,
  onSelect,
}: BlogCategoryFilterProps) {
  return (
<div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 my-6">
  {categories.map((cat) => (
    <button
  key={cat._id}
  onClick={() => onSelect(cat._id)}
  aria-pressed={selected === cat._id}
  className={clsx(
    'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mid-shade)] focus-visible:ring-offset-1',
    selected === cat._id
      ? 'bg-[var(--mid-shade)] text-white shadow-md scale-105'
      : 'bg-transparent text-white/70 ring-1 ring-inset ring-[var(--mid-shade)] hover:bg-[var(--mid-shade)]/10 active:scale-95'
  )}
>
  {cat.title}
</button>

  ))}
</div>

  );
}
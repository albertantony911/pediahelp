'use client';

import clsx from 'clsx';
import { Category } from '@/types';

interface BlogCategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelect: (categoryId: string | null) => void;
  onReset: () => void; // 👈 Add this back
}

export default function BlogCategoryFilter({
  categories,
  selectedCategory,
  onSelect,
  onReset,
}: BlogCategoryFilterProps) {
  return (
    <div className="flex gap-2 flex-wrap mb-6 justify-center">
      <button
        className={clsx(
          'px-4 py-2 rounded-full border text-sm font-medium transition',
          selectedCategory === null
            ? 'bg-gray-900 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        )}
        onClick={onReset}
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat._id}
          className={clsx(
            'px-4 py-2 rounded-full border text-sm font-medium transition',
            selectedCategory === cat._id
              ? 'bg-gray-900 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          )}
          onClick={() => onSelect(cat._id)}
        >
          {cat.title}
        </button>
      ))}
    </div>
  );
}
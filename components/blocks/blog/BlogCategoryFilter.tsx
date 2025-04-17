'use client';
import clsx from 'clsx';
import { Category } from '@/types'; // Import the Category type

export default function BlogCategoryFilter({
  categories,
  selectedCategory,
  onSelect,
  onReset,
}: {
  categories: Category[]; // Use the imported Category type
  selectedCategory: string | null;
  onSelect: (categoryId: string | null) => void;
  onReset: () => void;
}) {
  return (
    <div className="flex gap-2 flex-wrap mb-6 justify-center">
      <button
        className={clsx(
          'px-4 py-2 rounded-full border text-sm font-medium',
          selectedCategory === null
            ? 'bg-gray-900 text-white'
            : 'bg-white text-gray-700 hover:bg-gray-100'
        )}
        onClick={() => onReset()} // Use onReset instead of onSelect(null)
      >
        All
      </button>
      {categories.map((cat) => (
        <button
          key={cat._id}
          className={clsx(
            'px-4 py-2 rounded-full border text-sm font-medium',
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
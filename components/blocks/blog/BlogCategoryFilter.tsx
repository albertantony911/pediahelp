'use client';

import clsx from 'clsx';
import { useRefinementList } from 'react-instantsearch';

interface Category {
  _id: string;
  title: string;
}

interface BlogCategoryFilterProps {
  categories: Category[];
}

// Define the type for refinement items
interface RefinementItem {
  value: string;
  label: string;
  isRefined: boolean;
  count: number;
}

export default function BlogCategoryFilter({ categories }: BlogCategoryFilterProps) {
  const { items, refine } = useRefinementList({ attribute: 'categoryIds' });

  // Map Algolia items to selected state
  const selectedCategory = items.find((item: RefinementItem) => item.isRefined)?.value || 'all';

  // Debug logging
  console.log('Categories Passed:', categories);
  console.log('Selected Category:', selectedCategory);
  console.log('Refinement Items:', items);

  const handleSelect = (categoryId: string) => {
    console.log('Selecting Category ID:', categoryId);
    // Unrefine all items first to simulate "All" behavior
    items.forEach((item: RefinementItem) => {
      if (item.isRefined) {
        console.log('Unrefining:', item.value);
        refine(item.value); // Toggle off
      }
    });
    if (categoryId !== 'all') {
      console.log('Refining:', categoryId);
      refine(categoryId); // Toggle on
    }
  };

  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-2.5 my-6">
      {categories.map((cat) => (
        <button
          key={cat._id}
          onClick={() => handleSelect(cat._id)}
          aria-pressed={selectedCategory === cat._id}
          className={clsx(
            'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mid-shade)] focus-visible:ring-offset-1',
            selectedCategory === cat._id
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
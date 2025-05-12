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
    <div className="flex gap-1.5 flex-wrap my-6 justify-center px-4">
      {categories.map((cat) => (
        <button
          key={cat._id}
          onClick={() => onSelect(cat._id)}
          className={clsx(
            'px-3 py-1.5 rounded-full border text-xs font-normal transition-colors duration-200',
            selected === cat._id
              ? 'bg-light-shade text-white border-light-shade hover:bg-light-shade/80 active:bg-light-shade'
              : 'bg-muted text-muted-foreground border-border hover:bg-accent'
          )}
        >
          {cat.title}
        </button>
      ))}
    </div>
  );
}
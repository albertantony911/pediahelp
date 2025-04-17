'use client';

import { useState, useEffect } from 'react';
import { groq } from 'next-sanity';
import { client } from '@/sanity/lib/client';
import BlogCategoryFilter from '@/components/blocks/blog/BlogCategoryFilter';
import PostCard from '@/components/blocks/blog/PostCard';
import BlogSearch from '@/components/blocks/blog/BlogSearch';
import { PostWithDoctor, Category } from '@/types';

async function getPosts(): Promise<PostWithDoctor[]> {
  try {
    const posts = await client.fetch<PostWithDoctor[]>(
      groq`*[_type == "post"] | order(publishedAt desc) {
        _id,
        title,
        slug,
        mainImage { asset->{ _id, url } },
        categories[]->{
          _id,
          title
        },
        doctor->{
          _id,
          name,
          specialty,
          photo { asset->{ _id, url } }
        },
        publishedAt,
        body,
        searchKeywords,
        excerpt
      }`
    );
    console.log('Fetched posts:', posts);
    return posts;
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
}

async function getCategories(): Promise<Category[]> {
  try {
    const categories = await client.fetch<Category[]>(
      groq`*[_type == "category"] | order(title asc) {
        _id,
        title
      }`
    );
    return categories;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

export default function BlogPageWrapper() {
  const [allPosts, setAllPosts] = useState<PostWithDoctor[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<PostWithDoctor[] | undefined>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const [posts, fetchedCategories] = await Promise.all([getPosts(), getCategories()]);
      setAllPosts(posts);
      setCategories(fetchedCategories);
      setLoading(false);
    }
    loadData();
  }, []);

const handleCategoryFilter = (categoryId: string | null) => {
  setSelectedCategory(categoryId);
  if (!categoryId) {
    setFilteredPosts(undefined);
    return;
  }

  const filtered = allPosts.filter((post) =>
    post.categories?.some((cat) => cat._id === categoryId)
  );
  setFilteredPosts(filtered);
};

  const resetCategoryFilter = () => {
    setSelectedCategory(null);
    setFilteredPosts(undefined);
  };

  const handleSearchFilter = (filteredPosts: PostWithDoctor[]) => {
    setFilteredPosts(
  selectedCategory
    ? filteredPosts.filter((post) =>
        post.categories?.some((cat) => cat._id === selectedCategory)
      )
    : filteredPosts
);
  };

  if (loading) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-center">Our Blog</h1>
        <div className="text-center py-8 text-gray-500">Loading posts...</div>
      </section>
    );
  }

  if (!allPosts.length) {
    return (
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-center">Our Blog</h1>
        <div className="text-center py-8 text-red-400">
          Failed to load posts. Please try again later.
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Our Blog</h1>
      <BlogSearch allPosts={allPosts} onFilterChange={handleSearchFilter} />
      <BlogCategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelect={handleCategoryFilter}
        onReset={resetCategoryFilter}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {(filteredPosts || allPosts).map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>
    </section>
  );
}
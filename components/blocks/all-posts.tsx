import SectionContainer from "@/components/ui/section-container";
import PostCard from "@/components/blocks/blog/PostCard"; // ✅ this should import the new one
import { stegaClean } from "next-sanity";
import { fetchSanityPosts } from "@/sanity/lib/fetch";
import { PAGE_QUERYResult } from "@/sanity.types";

type AllPostsProps = Extract<
  NonNullable<NonNullable<PAGE_QUERYResult>["blocks"]>[number],
  { _type: "all-posts" }
>;

export default async function AllPosts({
  padding,
  colorVariant,
}: AllPostsProps) {
  const color = stegaClean(colorVariant);
  const posts = await fetchSanityPosts();

  return (
    <SectionContainer color={color} padding={padding}>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {posts.map((post) => (
          <PostCard key={post?._id} post={post} />
        ))}
      </div>
    </SectionContainer>
  );
}
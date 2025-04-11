import Link from "next/link";
import Image from "next/image";

export default function BlogCard({ post }: { post: any }) {
  return (
    <div className="bg-white rounded-[40px] px-4 py-6 shadow-md text-[#1F2F30]">
      <Link href={`/blog/${post.slug.current}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-full aspect-[2/1] rounded-[30px] overflow-hidden bg-[#1F2F30] flex justify-center items-center">
            {post.coverImage?.asset?.url ? (
              <Image
                src={post.coverImage.asset.url}
                alt={post.title}
                width={800}
                height={400}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-white">No image</span>
            )}
          </div>
          <h3 className="text-lg font-semibold text-center">{post.title}</h3>
        </div>
      </Link>
    </div>
  );
}
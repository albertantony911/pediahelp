// components/blocks/index.tsx

// 1. Explicit union of _type values to avoid TS2590
const BLOCK_TYPES = [
  "hero-1",
  "hero-2",
  "section-header",
  "split-row",
  "grid-row",
  "carousel-1",
  "carousel-2",
  "timeline-row",
  "cta-1",
  "logo-cloud-1",
  "faqs",
  "form-newsletter",
  "all-posts",
  "section-block",
  "specialty-card",
  "contact-form",
  "career-form",
  "waveDivider",
] as const;

type BlockType = (typeof BLOCK_TYPES)[number];

// 2. Define a generic base for Sanity blocks (you can extend this)
interface BaseBlock {
  _type: BlockType;
  _key: string;
  [key: string]: any;
}

// 3. Components
import Hero1 from "@/components/blocks/hero/hero-1";
import Hero2 from "@/components/blocks/hero/hero-2";
import SectionHeader from "@/components/blocks/section-header";
import SplitRow from "@/components/blocks/split/split-row";
import GridRow from "@/components/blocks/grid/grid-row";
import Carousel1 from "@/components/blocks/carousel/carousel-1";
import Carousel2 from "@/components/blocks/carousel/carousel-2";
import TimelineRow from "@/components/blocks/timeline/timeline-row";
import Cta1 from "@/components/blocks/cta/cta-1";
import LogoCloud1 from "@/components/blocks/logo-cloud/logo-cloud-1";
import FAQs from "@/components/blocks/faqs";
import FormNewsletter from "@/components/blocks/forms/newsletter";
import AllPosts from "@/components/blocks/all-posts";
import SectionBlock from "@/components/ui/section-block";
import SpecialtyCard from "@/components/blocks/specialty-card";
import ContactForm from "@/components/blocks/forms/contact-form";
import CareerForm from "@/components/blocks/forms/career-form";
import WaveDivider from "@/components/blocks/wave-divider";

// 4. Component mapping with type-safe keys
const componentMap: Record<BlockType, React.ComponentType<any>> = {
  "hero-1": Hero1,
  "hero-2": Hero2,
  "section-header": SectionHeader,
  "split-row": SplitRow,
  "grid-row": GridRow,
  "carousel-1": Carousel1,
  "carousel-2": Carousel2,
  "timeline-row": TimelineRow,
  "cta-1": Cta1,
  "logo-cloud-1": LogoCloud1,
  faqs: FAQs,
  "form-newsletter": FormNewsletter,
  "all-posts": AllPosts,
  "section-block": SectionBlock,
  "specialty-card": SpecialtyCard,
  "contact-form": ContactForm,
  "career-form": CareerForm,
  waveDivider: WaveDivider,
};

// 5. Final Block Renderer
export default function Blocks({ blocks }: { blocks: BaseBlock[] }) {
  return (
    <div className="overflow-x-hidden"> {/* Added wrapper to prevent overflow */}
      {blocks.map((block) => {
        const Component = componentMap[block._type as BlockType];

        if (!Component) {
          console.warn(`No component implemented for block type: ${block._type}`);
          return <div key={block._key} data-type={block._type} />;
        }

        if (block._type === "waveDivider") {
          return (
            <div className="w-screen -mx-[calc(50vw-50%)]" key={block._key}>
              <Component {...block} />
            </div>
          );
        }

        return <Component {...block} key={block._key} />;
      })}
    </div>
  );
}
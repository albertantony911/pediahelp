import { type SchemaTypeDefinition } from "sanity";
// documents
import page from "./schemas/documents/page";
import post from "./schemas/documents/post";
import author from "./schemas/documents/author";
import category from "./schemas/documents/category";
import faq from "./schemas/documents/faq";
import testimonial from "./schemas/documents/testimonial";
import doctor from './schemas/documents/doctor';
import review from './schemas/documents/review';
import comment from './schemas/documents/comment';
import { blogQuestion } from './schemas/documents/blogQuestion';
import specialities from './schemas/documents/specialities';

// Schema UI shared objects
import blockContent from "./schemas/blocks/shared/block-content";
import link from "./schemas/blocks/shared/link";
import { colorVariant } from "./schemas/blocks/shared/color-variant";
import { buttonVariant } from "./schemas/blocks/shared/button-variant";
import sectionPadding from "./schemas/blocks/shared/section-padding";
// Schema UI objects
import hero1 from "./schemas/blocks/hero/hero-1";
import hero2 from "./schemas/blocks/hero/hero-2";
import sectionHeader from "./schemas/blocks/section-header";
import splitRow from "./schemas/blocks/split/split-row";
import splitContent from "./schemas/blocks/split/split-content";
import splitCardsList from "./schemas/blocks/split/split-cards-list";
import splitCard from "./schemas/blocks/split/split-card";
import splitImage from "./schemas/blocks/split/split-image";
import splitInfoList from "./schemas/blocks/split/split-info-list";
import splitInfo from "./schemas/blocks/split/split-info";
import gridCard from "./schemas/blocks/grid/grid-card";
import pricingCard from "./schemas/blocks/grid/pricing-card";
import gridPost from "./schemas/blocks/grid/grid-post";
import gridRow from "./schemas/blocks/grid/grid-row";
import carousel1 from "./schemas/blocks/carousel/carousel-1";
import carousel2 from "./schemas/blocks/carousel/carousel-2";
import timelineRow from "./schemas/blocks/timeline/timeline-row";
import timelinesOne from "./schemas/blocks/timeline/timelines-1";
import cta1 from "./schemas/blocks/cta/cta-1";
import logoCloud1 from "./schemas/blocks/logo-cloud/logo-cloud-1";
import faqs from "./schemas/blocks/faqs";
import newsletter from "./schemas/blocks/forms/newsletter";
import allPosts from "./schemas/blocks/all-posts";
import sectionBlock from './schemas/blocks/section-block';
import specialtyCard from "./schemas/blocks/specialty-card";
import contactForm from './schemas/blocks/forms/contact-form';
import waveDivider from './schemas/blocks/wave-divider';
import waveDividerVariant from './schemas/blocks/wave-divider-variant';

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [
    // documents
    page,
    post,
    author,
    category,
    faq,
    testimonial,
    doctor,
    review,
    comment,
    blogQuestion,
    waveDividerVariant, // Add waveDividerVariant document
    specialities, 
    // shared objects
    blockContent,
    link,
    colorVariant,
    buttonVariant,
    sectionPadding,
    // blocks
    hero1,
    hero2,
    sectionHeader,
    splitRow,
    splitContent,
    splitCardsList,
    splitCard,
    splitImage,
    splitInfoList,
    splitInfo,
    gridCard,
    pricingCard,
    gridPost,
    gridRow,
    carousel1,
    carousel2,
    timelineRow,
    timelinesOne,
    cta1,
    logoCloud1,
    faqs,
    newsletter,
    allPosts,
    sectionBlock,
    specialtyCard,
    contactForm,
    waveDivider, // Add waveDivider block
  ],
};
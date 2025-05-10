import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';
import {
  Files,
  BookA,
  Tag,
  User,
  ListCollapse,
  Quote,
  Stethoscope,
  FileText,
  FolderKanban,
  MessageCircle,
  Waves,
} from 'lucide-react';

export const structure = (S: any, context: any) =>
  S.list()
    .title('Content')
    .items([
      // 📝 Pages
      orderableDocumentListDeskItem({
        type: 'page',
        title: 'Pages',
        icon: Files,
        S,
        context,
      }),

      // 🔖 Specialities
      orderableDocumentListDeskItem({
        type: 'specialities',
        title: 'Specialities',
        icon: Tag,
        S,
        context,
      }),

      // 📰 Blog
      S.divider(),
      S.listItem()
        .title('Blog')
        .icon(FolderKanban)
        .child(
          S.list()
            .title('Blog Management')
            .items([
              S.listItem()
                .title('Posts')
                .schemaType('post')
                .icon(FileText)
                .child(
                  S.documentTypeList('post')
                    .title('Posts')
                    .defaultOrdering([{ field: '_createdAt', direction: 'desc' }])
                ),
              orderableDocumentListDeskItem({
                type: 'category',
                title: 'Categories',
                icon: BookA,
                S,
                context,
              }),
            ])
        ),

      // 👩‍⚕️ Doctors
      S.divider(),
      orderableDocumentListDeskItem({
        type: 'doctor',
        title: 'Doctors',
        icon: Stethoscope,
        S,
        context,
      }),

      // 💬 Reviews
      orderableDocumentListDeskItem({
        type: 'review',
        title: 'Doctor Reviews',
        icon: MessageCircle,
        S,
        context,
      }),

      // 🤝 Testimonials
      orderableDocumentListDeskItem({
        type: 'testimonial',
        title: 'Testimonials',
        icon: Quote,
        S,
        context,
      }),

      // ❓ FAQs
      orderableDocumentListDeskItem({
        type: 'faq',
        title: 'FAQs',
        icon: ListCollapse,
        S,
        context,
      }),

      // 🌊 Wave Divider Variants
      S.divider(),
      S.listItem()
        .title('Wave Divider Variants')
        .icon(Waves)
        .schemaType('waveDividerVariant')
        .child(S.documentTypeList('waveDividerVariant').title('Wave Divider Variants')),
    ]);
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';
import {
  Files,
  BookA,
  Tag,
  User,
  Clock3,
  CalendarX2,
  CalendarCheck2,
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
      // 🗓 Doctor Dashboard
      S.listItem()
      .title('Doctor Dashboard')
      .icon(Stethoscope) // or another icon you prefer
      .child(
        S.list()
          .title('Doctor Dashboard')
          .items([
            S.listItem()
              .title('Weekly Availability')
              .icon(Clock3)
              .schemaType('availability')
              .child(S.documentTypeList('availability').title('Weekly Availability')),

            S.listItem()
              .title('Leave Dates')
              .icon(CalendarX2)
              .schemaType('leave')
              .child(S.documentTypeList('leave').title('Doctor Leave Dates')),

            S.listItem()
              .title('Bookings')
              .icon(CalendarCheck2)
              .schemaType('booking')
              .child(S.documentTypeList('booking').title('All Bookings')),
          ])
      ),

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
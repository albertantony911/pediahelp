// sanity/structure.ts
import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';
import {
  Files, BookA, Tag, CalendarCheck2, ListCollapse, Quote,
  Stethoscope, FileText, FolderKanban, MessageCircle, Waves,
  Calendar, MessageSquare
} from 'lucide-react';

export const structure = (S: any, context: any) =>
  S.list()
    .title('Content')
    .items([
      orderableDocumentListDeskItem({ type: 'page', title: 'Pages', icon: Files, S, context }),
      orderableDocumentListDeskItem({ type: 'specialities', title: 'Specialities', icon: Tag, S, context }),

      S.divider(),
      S.listItem()
        .title('Blog')
        .icon(FolderKanban)
        .child(
          S.list().title('Blog Management').items([
            S.listItem()
              .title('Posts').schemaType('post').icon(FileText)
              .child(
                S.documentTypeList('post')
                  .title('Posts')
                  .defaultOrdering([{ field: '_createdAt', direction: 'desc' }])
              ),
            orderableDocumentListDeskItem({ type: 'category', title: 'Categories', icon: BookA, S, context }),

            // ✅ Blog comments moderation
            S.listItem()
              .title('Comments')
              .icon(MessageSquare)
              .child(
                S.list().title('Comments').items([
                  S.listItem()
                    .title('Pending')
                    .icon(MessageSquare)
                    .child(
                      S.documentTypeList('blogComment')
                        .title('Pending Comments')
                        .filter('_type == "blogComment" && approved != true')
                        .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }])
                    ),
                  S.listItem()
                    .title('All')
                    .icon(MessageSquare)
                    .child(
                      S.documentTypeList('blogComment')
                        .title('All Comments')
                        .defaultOrdering([{ field: 'submittedAt', direction: 'desc' }])
                    ),
                ])
              ),
          ])
        ),

      // 👩‍⚕️ Doctors
      S.divider(),
      orderableDocumentListDeskItem({ type: 'doctor', title: 'Doctors', icon: Stethoscope, S, context }),

      // 🗓 Appointments Control
      S.listItem()
        .title('Appointments Control')
        .icon(Calendar)
        .child(
          S.documentTypeList('appointment')
            .title('Appointments Control')
            .filter('_type == "appointment"')
        ),

      // 📅 Bookings panel
      S.listItem()
        .title('Bookings')
        .icon(CalendarCheck2)
        .schemaType('booking')
        .child(
          S.list().title('Bookings Panel').items([
            S.listItem().title('All Bookings')
              .child(S.documentTypeList('booking').title('All Bookings')),
            S.listItem().title('Recent (7 days)')
              .child(
                S.documentTypeList('booking')
                  .title('Recent (7 days)')
                  .filter('_type == "booking" && now() - slot < 604800000')
                  .defaultOrdering([{ field: 'slot', direction: 'desc' }])
              ),
          ])
        ),

      // 💬 Reviews
      orderableDocumentListDeskItem({ type: 'review', title: 'Doctor Reviews', icon: MessageCircle, S, context }),

      // 🤝 Testimonials
      orderableDocumentListDeskItem({ type: 'testimonial', title: 'Testimonials', icon: Quote, S, context }),

      // ❓ FAQs
      orderableDocumentListDeskItem({ type: 'faq', title: 'FAQs', icon: ListCollapse, S, context }),

      S.divider(),
      S.listItem()
        .title('Wave Divider Variants')
        .icon(Waves)
        .schemaType('waveDividerVariant')
        .child(S.documentTypeList('waveDividerVariant').title('Wave Divider Variants')),
    ]);
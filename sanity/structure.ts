import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';
import {
  Files,
  BookA,
  Tag,
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
  Filter as FilterIcon,
} from 'lucide-react';

export const structure = (S: any, context: any) =>
  S.list()
    .title('Content')
    .items([
      // 🔖 Pages
      orderableDocumentListDeskItem({ type: 'page', title: 'Pages', icon: Files, S, context }),
      orderableDocumentListDeskItem({ type: 'specialities', title: 'Specialities', icon: Tag, S, context }),

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
              orderableDocumentListDeskItem({ type: 'category', title: 'Categories', icon: BookA, S, context }),
            ])
        ),

      // 👩‍⚕️ Doctors
      S.divider(),
      orderableDocumentListDeskItem({ type: 'doctor', title: 'Doctors', icon: Stethoscope, S, context }),

      // 🗓 Doctor Dashboard
      S.listItem()
        .title('Doctor Dashboard')
        .icon(Stethoscope)
        .child(
          S.list()
            .title('Doctor Dashboard')
            .items([
              S.listItem()
                .title('Weekly Availability')
                .icon(Clock3)
                .schemaType('availability')
                .child(
                  S.documentTypeList('availability')
                    .title('All Availability')
                    .filter('_type == "availability"')
                ),

              S.listItem()
                .title('Leave Dates')
                .icon(CalendarX2)
                .schemaType('leave')
                .child(
                  S.documentTypeList('leave')
                    .title('All Leave Dates')
                    .defaultOrdering([{ field: 'date', direction: 'asc' }])
                ),

              S.listItem()
                .title('Bookings')
                .icon(CalendarCheck2)
                .schemaType('booking')
                .child(
                  S.list()
                    .title('Bookings Panel')
                    .items([
                      S.listItem()
                        .title('All Bookings')
                        .child(
                          S.documentTypeList('booking')
                            .title('All Bookings')
                        ),
                      S.listItem()
                        .title('Recent Bookings')
                        .child(
                          S.documentTypeList('booking')
                            .title('Recent (7 days)')
                            .filter('_type == "booking" && now() - slot < 604800000')
                            .defaultOrdering([{ field: 'slot', direction: 'desc' }])
                        ),
                      S.listItem()
                        .title('Filter by Status')
                        .icon(FilterIcon)
                        .child(
                          S.list()
                            .title('Booking Status Filters')
                            .items([
                              S.listItem()
                                .title('Paid Bookings')
                                .child(S.documentTypeList('booking').title('Paid').filter('_type == "booking" && status == "paid"')),
                              S.listItem()
                                .title('Pending Bookings')
                                .child(S.documentTypeList('booking').title('Pending').filter('_type == "booking" && status == "pending"')),
                              S.listItem()
                                .title('Cancelled Bookings')
                                .child(S.documentTypeList('booking').title('Cancelled').filter('_type == "booking" && status == "cancelled"')),
                            ])
                        ),
                    ])
                ),
            ])
        ),

      // 💬 Reviews
      orderableDocumentListDeskItem({ type: 'review', title: 'Doctor Reviews', icon: MessageCircle, S, context }),

      // 🤝 Testimonials
      orderableDocumentListDeskItem({ type: 'testimonial', title: 'Testimonials', icon: Quote, S, context }),

      // ❓ FAQs
      orderableDocumentListDeskItem({ type: 'faq', title: 'FAQs', icon: ListCollapse, S, context }),

      // 🌊 Wave Divider
      S.divider(),
      S.listItem()
        .title('Wave Divider Variants')
        .icon(Waves)
        .schemaType('waveDividerVariant')
        .child(S.documentTypeList('waveDividerVariant').title('Wave Divider Variants')),
    ]);
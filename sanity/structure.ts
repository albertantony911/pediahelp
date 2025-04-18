import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import {
  Files,
  BookA,
  User,
  ListCollapse,
  Quote,
  Stethoscope,
  FileText,
  FolderKanban,
  MessageCircle,
} from "lucide-react";

export const structure = (S: any, context: any) =>
  S.list()
    .title("Content")
    .items([
      // 📝 Pages
      orderableDocumentListDeskItem({
        type: "page",
        title: "Pages",
        icon: Files,
        S,
        context,
      }),

      // 📰 Blog
      S.divider(),
      S.listItem()
        .title("Blog")
        .icon(FolderKanban)
        .child(
          S.list()
            .title("Blog Management")
            .items([
              S.listItem()
                .title("Posts")
                .schemaType("post")
                .icon(FileText)
                .child(
                  S.documentTypeList("post")
                    .title("Posts")
                    .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
                ),
              orderableDocumentListDeskItem({
                type: "category",
                title: "Categories",
                icon: BookA,
                S,
                context,
              }),
            ])
        ),

      // 👩‍⚕️ Doctors
      S.divider(),
      orderableDocumentListDeskItem({
        type: "doctor",
        title: "Doctors",
        icon: Stethoscope,
        S,
        context,
      }),

      // 💬 Doctor Reviews (normal list, sorted by submittedAt)
      S.listItem()
        .title("Doctor Reviews")
        .schemaType("review")
        .icon(MessageCircle)
        .child(
          S.documentTypeList("review")
            .title("Doctor Reviews")
            .defaultOrdering([{ field: "submittedAt", direction: "desc" }])
        ),

      // 🌟 Testimonials
      S.listItem()
        .title("Testimonials")
        .schemaType("testimonial")
        .icon(Quote)
        .child(
          S.documentTypeList("testimonial")
            .title("Testimonials")
            .defaultOrdering([{ field: "submittedAt", direction: "desc" }])
        ),

      // ❓ FAQs
      S.listItem()
        .title("FAQs")
        .schemaType("faq")
        .icon(ListCollapse)
        .child(
          S.documentTypeList("faq")
            .title("FAQs")
            .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
        ),
    ]);
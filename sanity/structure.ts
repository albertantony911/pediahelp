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
} from "lucide-react"; // icons

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

      // 💬 Reviews (for doctors)
      orderableDocumentListDeskItem({
        type: "review",
        title: "Doctor Reviews",
        icon: MessageCircle,
        S,
        context,
      }),

      // 🤝 Testimonials
      orderableDocumentListDeskItem({
        type: "testimonial",
        title: "Testimonials",
        icon: Quote,
        S,
        context,
      }),

      // ❓ FAQs
      orderableDocumentListDeskItem({
        type: "faq",
        title: "FAQs",
        icon: ListCollapse,
        S,
        context,
      }),
    ]);
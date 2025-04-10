import { orderableDocumentListDeskItem } from "@sanity/orderable-document-list";
import { Files, BookA, User, ListCollapse, Quote, Stethoscope } from "lucide-react"; // 👈 add icon

export const structure = (S: any, context: any) =>
  S.list()
    .title("Content")
    .items([
      orderableDocumentListDeskItem({
        type: "page",
        title: "Pages",
        icon: Files,
        S,
        context,
      }),
      S.listItem()
        .title("Posts")
        .schemaType("post")
        .child(
          S.documentTypeList("post")
            .title("Post")
            .defaultOrdering([{ field: "_createdAt", direction: "desc" }])
        ),
      orderableDocumentListDeskItem({
        type: "category",
        title: "Categories",
        icon: BookA,
        S,
        context,
      }),
      orderableDocumentListDeskItem({
        type: "author",
        title: "Authors",
        icon: User,
        S,
        context,
      }),
      orderableDocumentListDeskItem({
        type: "faq",
        title: "FAQs",
        icon: ListCollapse,
        S,
        context,
      }),
      orderableDocumentListDeskItem({
        type: "testimonial",
        title: "Testimonials",
        icon: Quote,
        S,
        context,
      }),

      // ✅ Add this for Doctors
      orderableDocumentListDeskItem({
        type: "doctor",
        title: "Doctors",
        icon: Stethoscope, // optional, pick any
        S,
        context,
      }),

      // ✅ Add the Reviews section correctly
      orderableDocumentListDeskItem({
        type: "review",
        title: "Reviews",
        icon: Stethoscope, // optional, pick any icon you prefer
        S,
        context,
      }),
    ]);
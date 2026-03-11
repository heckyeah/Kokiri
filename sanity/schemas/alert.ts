import { defineType, defineField } from "sanity";

export const alertType = defineType({
  name: "alert",
  title: "Alert",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      description: "e.g. 7.2 Earthquake in Coromandel",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "subtitle",
      title: "Subtitle",
      type: "text",
      description: "Extra information",
    }),
    defineField({
      name: "createdAt",
      title: "Created At",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
    }),
    defineField({
      name: "createdBy",
      title: "Created By",
      type: "reference",
      to: [{ type: "member" }],
    }),
    defineField({
      name: "status",
      title: "Status",
      type: "string",
      options: {
        list: [
          { title: "Active", value: "active" },
          { title: "Closed", value: "closed" },
        ],
        layout: "radio",
      },
      initialValue: "active",
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: "title", status: "status" },
    prepare({ title, status }) {
      return {
        title: title || "Untitled Alert",
        subtitle: status,
      };
    },
  },
});

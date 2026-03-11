import { defineType, defineField } from "sanity";

export const memberType = defineType({
  name: "member",
  title: "Member",
  type: "document",
  fields: [
    defineField({
      name: "fullName",
      title: "Full Name",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      validation: (Rule) => Rule.required().email(),
    }),
    defineField({
      name: "phone",
      title: "Phone",
      type: "string",
    }),
    defineField({
      name: "address",
      title: "Address",
      type: "string",
    }),
    defineField({
      name: "medicalConditions",
      title: "Medical conditions we should know about if you need help",
      type: "text",
      description: "Optional. Any medical conditions or needs that responders should be aware of when assisting you.",
    }),
    defineField({
      name: "passwordHash",
      title: "Password Hash",
      type: "string",
      hidden: true,
    }),
    defineField({
      name: "role",
      title: "Role",
      type: "string",
      options: {
        list: [
          { title: "Admin", value: "admin" },
          { title: "Member", value: "member" },
        ],
        layout: "radio",
      },
      initialValue: "member",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "lastKnownLat",
      title: "Last Known Latitude",
      type: "number",
      hidden: true,
    }),
    defineField({
      name: "lastKnownLng",
      title: "Last Known Longitude",
      type: "number",
      hidden: true,
    }),
  ],
  preview: {
    select: { fullName: "fullName", email: "email" },
    prepare({ fullName, email }) {
      return {
        title: fullName || "Unnamed",
        subtitle: email,
      };
    },
  },
});

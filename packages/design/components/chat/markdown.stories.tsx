import type { Meta, StoryObj } from "@storybook/react";
import EasyMarkdown from "./markdown";

const meta: Meta<typeof EasyMarkdown> = {
  title: "UI/Chat/Markdown",
  component: EasyMarkdown,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EasyMarkdown>;

export const Default: Story = {
  args: {
    children: "Hello, how can I help you today?",
  },
};

export const WithFormatting: Story = {
  args: {
    children: "Hello, **how can** I help you today?",
  },
};

export const WithComplexMarkdown: Story = {
  args: {
    children: `# Heading 1
## Heading 2

This is a paragraph with **bold** and *italic* text.


double new lines

[link](https://www.google.com)

- List item 1
- List item 2
  - Nested item
  
> This is a blockquote

This is code:

\`\`\`typescript
const hello = "world";
console.log(hello);
\`\`\`

| Column 1 | Column 2 |
|----------|----------|
| Cell 1   | Cell 2   |
`,
  },
};

export const WithMarkdownText: Story = {
  args: {
    children: `
Abneesh is dedicated to innovation in the tech space, particularly in areas that combine hardware and software.
Markdown for **Abneesh Patel**, also known as **abneesh447**, is a software developer with a strong passion for improving people's lives through software solutions. 

### Key Highlights:
- **Experience**: Professional software development and engineering.

### Online Presence:
- **GitHub**: [abneesh447 GitHub](http://github.com/abneesh447)

Abneesh is dedicated to innovation in the tech space, particularly in areas that combine hardware and software.
    `,
  },
};

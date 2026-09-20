import type { Post } from "./types";

export const fallbackPosts: Post[] = [
  {
    id: 9001,
    title: "The internet weighs less than a strawberry",
    slug: "internet-weighs-less-than-a-strawberry",
    content: "Every bit of data needs energy to exist. If you add up the tiny mass-equivalent of all that energy, the information flowing through the internet at any moment weighs only a few dozen grams. The exact estimate varies, but the surprising lesson is solid: information can feel enormous while its physical footprint is remarkably small.",
    author_username: "tfacts desk", view_count: 2840, featured_img: null, short_code: "NET01",
    tags: ["Internet", "Physics"], created_at: "2026-08-11T08:00:00Z", updated_at: "2026-08-11T08:00:00Z",
  },
  {
    id: 9002, title: "Why your phone knows which way is up", slug: "why-your-phone-knows-which-way-is-up",
    content: "A microscopic accelerometer inside your phone measures motion along three axes. Gravity provides a constant reference, letting the software infer orientation and rotate the interface before you notice.",
    author_username: "Mira Chen", view_count: 1320, featured_img: null, short_code: "MOB02", tags: ["Mobile", "Sensors"], created_at: "2026-08-09T10:30:00Z", updated_at: "2026-08-09T10:30:00Z",
  },
  {
    id: 9003, title: "The first computer bug was an actual bug", slug: "the-first-computer-bug-was-an-actual-bug",
    content: "In 1947, operators working on the Harvard Mark II found a moth trapped in a relay. Engineers had used the word bug before, but the taped-in moth made debugging history memorable.",
    author_username: "Noah Park", view_count: 2140, featured_img: null, short_code: "HIS03", tags: ["History", "Computing"], created_at: "2026-08-07T14:10:00Z", updated_at: "2026-08-07T14:10:00Z",
  },
  {
    id: 9004, title: "A password manager changes the security equation", slug: "password-manager-security-equation",
    content: "Strong, unique passwords stop one leaked account from unlocking every other service. A password manager makes that habit practical by remembering the complexity for you.",
    author_username: "Ava Stone", view_count: 980, featured_img: null, short_code: "SEC04", tags: ["Security", "Privacy"], created_at: "2026-08-05T09:00:00Z", updated_at: "2026-08-05T09:00:00Z",
  },
  {
    id: 9005, title: "AI does not store a tiny copy of the web", slug: "ai-does-not-store-a-copy-of-the-web",
    content: "Language models learn statistical relationships from training examples. They generate text from patterns encoded in parameters rather than searching a hidden library of copied pages.",
    author_username: "tfacts desk", view_count: 1675, featured_img: null, short_code: "AI005", tags: ["AI", "Machine learning"], created_at: "2026-08-03T11:45:00Z", updated_at: "2026-08-03T11:45:00Z",
  },
  {
    id: 9006, title: "The cloud is still someone else’s computer", slug: "the-cloud-is-still-a-computer",
    content: "Cloud services feel abstract, but every file and calculation ultimately runs on physical machines in data centers. The abstraction makes those resources flexible, not imaginary.",
    author_username: "Leo Grant", view_count: 1104, featured_img: null, short_code: "CLD06", tags: ["Cloud", "Infrastructure"], created_at: "2026-08-01T07:20:00Z", updated_at: "2026-08-01T07:20:00Z",
  },
];

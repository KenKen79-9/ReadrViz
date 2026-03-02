import { PrismaClient, Pace, ShelfType, Format, Ownership, EventType, MemberRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// ─── Book data ────────────────────────────────────────────────────────────────

const BOOKS = [
  {
    title: "The Name of the Wind",
    author: "Patrick Rothfuss",
    isbn: "9780756404079",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780756404079-L.jpg",
    synopsis: "A legendary figure known as Kvothe recounts his extraordinary life beginning with his childhood as a brilliant student, his years as a street urchin, and his time at the University where he learns all manner of arcane knowledge.",
    pageCount: 662,
    genre: ["Fantasy", "Epic Fantasy"],
    tags: ["magic", "music", "coming-of-age", "inn", "university", "revenge"],
    mood: ["immersive", "melancholic", "adventurous"],
    pace: Pace.SLOW,
    avgRating: 4.5,
    ratingCount: 1842,
    completionRate: 0.71,
    dnfRate: 0.12,
    polarizationScore: 0.8,
    publishedAt: new Date("2007-03-27"),
  },
  {
    title: "Tomorrow, and Tomorrow, and Tomorrow",
    author: "Gabrielle Zevin",
    isbn: "9780593321201",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780593321201-L.jpg",
    synopsis: "Two friends meet as children in a hospital waiting room, and the spark of a creative collaboration ignites their careers across decades of making video games together.",
    pageCount: 416,
    genre: ["Literary Fiction", "Contemporary"],
    tags: ["friendship", "creativity", "video-games", "love", "ambition", "loss"],
    mood: ["bittersweet", "nostalgic", "hopeful"],
    pace: Pace.MEDIUM,
    avgRating: 4.3,
    ratingCount: 2104,
    completionRate: 0.83,
    dnfRate: 0.07,
    polarizationScore: 0.5,
    publishedAt: new Date("2022-07-05"),
  },
  {
    title: "Piranesi",
    author: "Susanna Clarke",
    isbn: "9781526622426",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781526622426-L.jpg",
    synopsis: "Piranesi lives in the House. The House is his world. Its halls contain statues; its tides rise and fall. Piranesi has always thought he was alone in this strange place — until he discovers a dead body.",
    pageCount: 272,
    genre: ["Fantasy", "Mystery", "Literary Fiction"],
    tags: ["labyrinth", "mystery", "identity", "surreal", "strange", "isolation"],
    mood: ["atmospheric", "mysterious", "haunting"],
    pace: Pace.MEDIUM,
    avgRating: 4.6,
    ratingCount: 987,
    completionRate: 0.89,
    dnfRate: 0.04,
    polarizationScore: 0.3,
    publishedAt: new Date("2020-09-15"),
  },
  {
    title: "Project Hail Mary",
    author: "Andy Weir",
    isbn: "9780593135204",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780593135204-L.jpg",
    synopsis: "Ryland Grace is the sole survivor on a desperate, last-chance mission to save humanity. He doesn't remember who he is or how he got there — and he's just made an unexpected friend.",
    pageCount: 476,
    genre: ["Science Fiction", "Hard Sci-Fi"],
    tags: ["space", "survival", "aliens", "science", "problem-solving", "friendship"],
    mood: ["optimistic", "thrilling", "funny"],
    pace: Pace.FAST,
    avgRating: 4.7,
    ratingCount: 3201,
    completionRate: 0.92,
    dnfRate: 0.03,
    polarizationScore: 0.2,
    publishedAt: new Date("2021-05-04"),
  },
  {
    title: "Demon Copperhead",
    author: "Barbara Kingsolver",
    isbn: "9780063251984",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780063251984-L.jpg",
    synopsis: "A boy born to a teenaged single mother in a rural Virginia holler retells the story of David Copperfield through the lens of the opioid epidemic.",
    pageCount: 560,
    genre: ["Literary Fiction", "Historical Fiction"],
    tags: ["opioid-crisis", "poverty", "foster-care", "americana", "survival", "coming-of-age"],
    mood: ["devastating", "raw", "hopeful", "darkly funny"],
    pace: Pace.MEDIUM,
    avgRating: 4.4,
    ratingCount: 1567,
    completionRate: 0.74,
    dnfRate: 0.11,
    polarizationScore: 0.6,
    publishedAt: new Date("2022-10-18"),
  },
  {
    title: "Fourth Wing",
    author: "Rebecca Yarros",
    isbn: "9781649374042",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781649374042-L.jpg",
    synopsis: "Violet Sorrengail was supposed to enter the Scribes Quadrant. Instead, she's forced into the riders quadrant — where students train to bond with war dragons or die trying.",
    pageCount: 528,
    genre: ["Fantasy", "Romance"],
    tags: ["dragons", "romance", "war", "magic", "enemies-to-lovers", "military"],
    mood: ["thrilling", "romantic", "action-packed"],
    pace: Pace.FAST,
    avgRating: 4.2,
    ratingCount: 4102,
    completionRate: 0.80,
    dnfRate: 0.10,
    polarizationScore: 1.2,
    publishedAt: new Date("2023-05-02"),
  },
  {
    title: "The Covenant of Water",
    author: "Abraham Verghese",
    isbn: "9780802162175",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780802162175-L.jpg",
    synopsis: "Set in South India and spanning the years 1900 to 1977, this multigenerational saga follows a family afflicted by a peculiar condition — at least one person in each generation dies by drowning.",
    pageCount: 736,
    genre: ["Literary Fiction", "Historical Fiction"],
    tags: ["india", "family-saga", "medicine", "colonialism", "faith", "identity"],
    mood: ["epic", "lyrical", "immersive"],
    pace: Pace.SLOW,
    avgRating: 4.5,
    ratingCount: 892,
    completionRate: 0.68,
    dnfRate: 0.14,
    polarizationScore: 0.4,
    publishedAt: new Date("2023-05-02"),
  },
  {
    title: "Holly",
    author: "Stephen King",
    isbn: "9781668016138",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781668016138-L.jpg",
    synopsis: "Holly Gibney — one of King's most compelling characters — faces her most dangerous adversaries yet: a pair of chillingly ordinary academics with a shocking and murderous hobby.",
    pageCount: 464,
    genre: ["Thriller", "Mystery", "Horror"],
    tags: ["detective", "serial-killer", "small-town", "pandemic", "suspense"],
    mood: ["suspenseful", "dark", "gripping"],
    pace: Pace.FAST,
    avgRating: 4.1,
    ratingCount: 1234,
    completionRate: 0.85,
    dnfRate: 0.06,
    polarizationScore: 0.7,
    publishedAt: new Date("2023-09-05"),
  },
  {
    title: "Intermezzo",
    author: "Sally Rooney",
    isbn: "9780374614553",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780374614553-L.jpg",
    synopsis: "Two brothers, both grieving their father's death, navigate very different relationships and reveal more about each other than they expected.",
    pageCount: 448,
    genre: ["Literary Fiction", "Contemporary"],
    tags: ["grief", "brothers", "chess", "relationships", "age-gap", "ireland"],
    mood: ["introspective", "romantic", "melancholic"],
    pace: Pace.SLOW,
    avgRating: 3.9,
    ratingCount: 2891,
    completionRate: 0.64,
    dnfRate: 0.18,
    polarizationScore: 1.4,
    publishedAt: new Date("2024-09-24"),
  },
  {
    title: "The Women",
    author: "Kristin Hannah",
    isbn: "9781250178602",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781250178602-L.jpg",
    synopsis: "Women can be heroes. When twenty-year-old nursing student Frankie McGrath hears these words, it starts her on a journey to Vietnam and a life she could never have imagined.",
    pageCount: 480,
    genre: ["Historical Fiction", "Literary Fiction"],
    tags: ["vietnam-war", "nurses", "ptsd", "women", "1960s", "sacrifice"],
    mood: ["emotional", "inspiring", "devastating"],
    pace: Pace.MEDIUM,
    avgRating: 4.6,
    ratingCount: 3445,
    completionRate: 0.88,
    dnfRate: 0.05,
    polarizationScore: 0.3,
    publishedAt: new Date("2024-02-06"),
  },
  {
    title: "James",
    author: "Percival Everett",
    isbn: "9780385550369",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780385550369-L.jpg",
    synopsis: "A reimagining of Adventures of Huckleberry Finn told from the perspective of the enslaved man Jim — renamed James — who traverses the antebellum South seeking freedom.",
    pageCount: 320,
    genre: ["Literary Fiction", "Historical Fiction"],
    tags: ["slavery", "freedom", "america", "reimagining", "race", "identity"],
    mood: ["powerful", "challenging", "darkly funny"],
    pace: Pace.MEDIUM,
    avgRating: 4.7,
    ratingCount: 1892,
    completionRate: 0.86,
    dnfRate: 0.05,
    polarizationScore: 0.3,
    publishedAt: new Date("2024-03-19"),
  },
  {
    title: "All the Light We Cannot See",
    author: "Anthony Doerr",
    isbn: "9781476746586",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781476746586-L.jpg",
    synopsis: "A blind French girl and a German boy whose paths collide in occupied France as both try to survive the devastation of World War II.",
    pageCount: 544,
    genre: ["Historical Fiction", "Literary Fiction"],
    tags: ["wwii", "blind-protagonist", "radio", "france", "germany", "dual-narrative"],
    mood: ["lyrical", "devastating", "beautiful"],
    pace: Pace.SLOW,
    avgRating: 4.4,
    ratingCount: 5678,
    completionRate: 0.77,
    dnfRate: 0.09,
    polarizationScore: 0.6,
    publishedAt: new Date("2014-05-06"),
  },
  {
    title: "Lessons in Chemistry",
    author: "Bonnie Garmus",
    isbn: "9780385547345",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780385547345-L.jpg",
    synopsis: "Chemist Elizabeth Zott is not your average woman. And her cooking show, Supper at Six, has become a cultural phenomenon — turning the most stoic housewives into women with ambitions.",
    pageCount: 390,
    genre: ["Literary Fiction", "Historical Fiction"],
    tags: ["feminism", "science", "cooking", "1960s", "humor", "single-mother"],
    mood: ["funny", "inspiring", "heartwarming"],
    pace: Pace.MEDIUM,
    avgRating: 4.3,
    ratingCount: 6234,
    completionRate: 0.84,
    dnfRate: 0.06,
    polarizationScore: 0.5,
    publishedAt: new Date("2022-04-05"),
  },
  {
    title: "The Atlas Six",
    author: "Olivie Blake",
    isbn: "9781250886781",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781250886781-L.jpg",
    synopsis: "Six magicians are selected to compete for a place in the Alexandrian Society — an ancient secret library. To earn membership, they must survive each other.",
    pageCount: 448,
    genre: ["Fantasy", "Dark Academia"],
    tags: ["magic", "academia", "competition", "morally-grey", "dark", "ensemble"],
    mood: ["dark", "atmospheric", "cerebral"],
    pace: Pace.SLOW,
    avgRating: 4.0,
    ratingCount: 2341,
    completionRate: 0.70,
    dnfRate: 0.15,
    polarizationScore: 1.1,
    publishedAt: new Date("2022-03-01"),
  },
  {
    title: "Same as Ever",
    author: "Morgan Housel",
    isbn: "9780593719978",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780593719978-L.jpg",
    synopsis: "A collection of short stories about the things that never change — and what they tell us about ourselves, our world, and our money.",
    pageCount: 256,
    genre: ["Nonfiction", "Business", "Psychology"],
    tags: ["investing", "human-nature", "finance", "behavior", "wisdom", "short-essays"],
    mood: ["insightful", "calming", "thought-provoking"],
    pace: Pace.FAST,
    avgRating: 4.4,
    ratingCount: 1456,
    completionRate: 0.91,
    dnfRate: 0.03,
    polarizationScore: 0.3,
    publishedAt: new Date("2023-11-07"),
  },
  {
    title: "Babel",
    author: "R.F. Kuang",
    isbn: "9780063021426",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780063021426-L.jpg",
    synopsis: "A dark academia fantasy set at the University of Oxford's Royal Institute of Translation in 1830s England, exploring colonialism through the magic of translation.",
    pageCount: 560,
    genre: ["Fantasy", "Historical Fiction", "Dark Academia"],
    tags: ["colonialism", "translation", "oxford", "magic", "revolution", "academia"],
    mood: ["dark", "challenging", "atmospheric", "angry"],
    pace: Pace.SLOW,
    avgRating: 4.2,
    ratingCount: 3012,
    completionRate: 0.69,
    dnfRate: 0.16,
    polarizationScore: 1.0,
    publishedAt: new Date("2022-08-23"),
  },
  {
    title: "The Secret History",
    author: "Donna Tartt",
    isbn: "9781400031702",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781400031702-L.jpg",
    synopsis: "A small clique of exceptional students, seduced by their charismatic classics professor, unravel the mystery of their own dark act that has led to murder.",
    pageCount: 544,
    genre: ["Literary Fiction", "Mystery", "Dark Academia"],
    tags: ["murder", "classics", "academia", "privilege", "obsession", "greek"],
    mood: ["atmospheric", "dark", "addictive"],
    pace: Pace.SLOW,
    avgRating: 4.5,
    ratingCount: 4567,
    completionRate: 0.81,
    dnfRate: 0.08,
    polarizationScore: 0.5,
    publishedAt: new Date("1992-09-16"),
  },
  {
    title: "Iron Flame",
    author: "Rebecca Yarros",
    isbn: "9781649374172",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781649374172-L.jpg",
    synopsis: "Violet Sorrengail's next chapter — now that the war has truly begun, will she survive the year? The dragons, the rebels, the secrets — everything changes.",
    pageCount: 640,
    genre: ["Fantasy", "Romance"],
    tags: ["dragons", "war", "romance", "magic", "military", "rebellion"],
    mood: ["thrilling", "romantic", "action-packed"],
    pace: Pace.FAST,
    avgRating: 4.1,
    ratingCount: 2876,
    completionRate: 0.78,
    dnfRate: 0.12,
    polarizationScore: 1.2,
    publishedAt: new Date("2023-11-07"),
  },
  {
    title: "Poverty, by America",
    author: "Matthew Desmond",
    isbn: "9780593239919",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9780593239919-L.jpg",
    synopsis: "The Pulitzer Prize-winning author argues that America doesn't just have poor people — it has poverty. And in a rich nation, this is a choice.",
    pageCount: 288,
    genre: ["Nonfiction", "Sociology", "Politics"],
    tags: ["poverty", "america", "inequality", "housing", "systemic", "solutions"],
    mood: ["urgent", "challenging", "eye-opening"],
    pace: Pace.FAST,
    avgRating: 4.5,
    ratingCount: 876,
    completionRate: 0.82,
    dnfRate: 0.06,
    polarizationScore: 0.8,
    publishedAt: new Date("2023-03-21"),
  },
  {
    title: "A Court of Thorns and Roses",
    author: "Sarah J. Maas",
    isbn: "9781619634442",
    coverUrl: "https://covers.openlibrary.org/b/isbn/9781619634442-L.jpg",
    synopsis: "A huntress kills a wolf in the forest — and pays a steep price: banishment to a magical land where she discovers that her captor may not be the monster she believed.",
    pageCount: 419,
    genre: ["Fantasy", "Romance"],
    tags: ["fae", "romance", "fairy-tale", "magic", "enemies-to-lovers", "beauty-and-the-beast"],
    mood: ["romantic", "adventurous", "escapist"],
    pace: Pace.MEDIUM,
    avgRating: 4.1,
    ratingCount: 8923,
    completionRate: 0.79,
    dnfRate: 0.11,
    polarizationScore: 1.3,
    publishedAt: new Date("2015-05-05"),
  },
];

// ─── Users ────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding ReadrViz database...\n");

  // Hash password for all seed users
  const hash = await bcrypt.hash("password123", 10);

  // Create users
  const users = await Promise.all([
    db.user.upsert({
      where: { email: "alice@readrviz.dev" },
      update: {},
      create: {
        email: "alice@readrviz.dev",
        username: "alice_reads",
        name: "Alice Chen",
        password: hash,
        bio: "Literary fiction devotee. Slow reader, deep feeler. 📚 Tea > coffee.",
        image: "https://api.dicebear.com/9.x/avataaars/svg?seed=alice",
      },
    }),
    db.user.upsert({
      where: { email: "bob@readrviz.dev" },
      update: {},
      create: {
        email: "bob@readrviz.dev",
        username: "bob_speeder",
        name: "Bob Martinez",
        password: hash,
        bio: "50+ books/year. Sci-fi & nonfiction. Data engineer by day.",
        image: "https://api.dicebear.com/9.x/avataaars/svg?seed=bob",
      },
    }),
    db.user.upsert({
      where: { email: "sara@readrviz.dev" },
      update: {},
      create: {
        email: "sara@readrviz.dev",
        username: "sara_fantasy",
        name: "Sara Johnson",
        password: hash,
        bio: "Fantasy & romance. If there are dragons, I'm reading it. 🐉",
        image: "https://api.dicebear.com/9.x/avataaars/svg?seed=sara",
      },
    }),
    db.user.upsert({
      where: { email: "demo@readrviz.dev" },
      update: {},
      create: {
        email: "demo@readrviz.dev",
        username: "demo_user",
        name: "Demo User",
        password: hash,
        bio: "Try ReadrViz! Login: demo@readrviz.dev / password123",
        image: "https://api.dicebear.com/9.x/avataaars/svg?seed=demo",
      },
    }),
    db.user.upsert({
      where: { email: "max@readrviz.dev" },
      update: {},
      create: {
        email: "max@readrviz.dev",
        username: "max_dark_academia",
        name: "Max Okonkwo",
        password: hash,
        bio: "Dark academia, classics, and literary horror. Oxford comma defender.",
        image: "https://api.dicebear.com/9.x/avataaars/svg?seed=max",
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create books
  const books = await Promise.all(
    BOOKS.map((b) =>
      db.book.upsert({
        where: { isbn: b.isbn },
        update: {},
        create: b,
      })
    )
  );

  console.log(`✅ Created ${books.length} books`);

  // Create default shelves for each user
  const shelfTypes = [
    { name: "Want to Read", type: ShelfType.WANT_TO_READ, isDefault: true },
    { name: "Currently Reading", type: ShelfType.CURRENTLY_READING, isDefault: true },
    { name: "Read", type: ShelfType.READ, isDefault: true },
    { name: "Did Not Finish", type: ShelfType.DNF, isDefault: true },
  ];

  for (const user of users) {
    await Promise.all(
      shelfTypes.map((s) =>
        db.shelf.upsert({
          where: { userId_name: { userId: user.id, name: s.name } },
          update: {},
          create: { ...s, userId: user.id },
        })
      )
    );
  }

  console.log("✅ Created default shelves");

  // Seed Alice's reading history (power reader, literary fiction)
  const alice = users[0];
  const aliceShelves = await db.shelf.findMany({ where: { userId: alice.id } });
  const aliceRead = aliceShelves.find((s) => s.type === ShelfType.READ)!;
  const aliceReading = aliceShelves.find((s) => s.type === ShelfType.CURRENTLY_READING)!;
  const aliceWant = aliceShelves.find((s) => s.type === ShelfType.WANT_TO_READ)!;

  // Books Alice has read
  const aliceReadBooks = [books[1], books[2], books[4], books[9], books[10], books[11], books[12], books[16]];
  for (const book of aliceReadBooks) {
    const start = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    const finish = new Date(start.getTime() + (book.pageCount ?? 300) * 0.4 * 60 * 60 * 1000);
    await db.shelfBook.upsert({
      where: { shelfId_bookId: { shelfId: aliceRead.id, bookId: book.id } },
      update: {},
      create: {
        shelfId: aliceRead.id,
        bookId: book.id,
        userId: alice.id,
        startDate: start,
        finishDate: finish,
        pagesRead: book.pageCount ?? 300,
        progress: 100,
        format: Format.PHYSICAL,
        ownership: Ownership.PURCHASED,
        costPaid: Math.round(Math.random() * 15 + 10),
      },
    });
  }

  // Alice currently reading
  await db.shelfBook.upsert({
    where: { shelfId_bookId: { shelfId: aliceReading.id, bookId: books[6].id } },
    update: {},
    create: {
      shelfId: aliceReading.id,
      bookId: books[6].id,
      userId: alice.id,
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      pagesRead: 180,
      progress: 24,
      format: Format.EBOOK,
      ownership: Ownership.LIBRARY,
    },
  });

  // Seed Bob's reading history (speed reader, sci-fi + nonfiction)
  const bob = users[1];
  const bobShelves = await db.shelf.findMany({ where: { userId: bob.id } });
  const bobRead = bobShelves.find((s) => s.type === ShelfType.READ)!;

  const bobReadBooks = [books[3], books[7], books[14], books[18], books[15]];
  for (const book of bobReadBooks) {
    const start = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    const finish = new Date(start.getTime() + (book.pageCount ?? 300) * 0.2 * 60 * 60 * 1000);
    await db.shelfBook.upsert({
      where: { shelfId_bookId: { shelfId: bobRead.id, bookId: book.id } },
      update: {},
      create: {
        shelfId: bobRead.id,
        bookId: book.id,
        userId: bob.id,
        startDate: start,
        finishDate: finish,
        pagesRead: book.pageCount ?? 300,
        progress: 100,
        format: Format.EBOOK,
        ownership: Ownership.SUBSCRIPTION,
        costPaid: 0,
      },
    });
  }

  // Seed Sara's reading (fantasy + romance)
  const sara = users[2];
  const saraShelves = await db.shelf.findMany({ where: { userId: sara.id } });
  const saraRead = saraShelves.find((s) => s.type === ShelfType.READ)!;

  const saraReadBooks = [books[5], books[17], books[19], books[0], books[13]];
  for (const book of saraReadBooks) {
    const start = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    const finish = new Date(start.getTime() + (book.pageCount ?? 300) * 0.3 * 60 * 60 * 1000);
    await db.shelfBook.upsert({
      where: { shelfId_bookId: { shelfId: saraRead.id, bookId: book.id } },
      update: {},
      create: {
        shelfId: saraRead.id,
        bookId: book.id,
        userId: sara.id,
        startDate: start,
        finishDate: finish,
        pagesRead: book.pageCount ?? 300,
        progress: 100,
        format: Format.PHYSICAL,
        ownership: Ownership.PURCHASED,
        costPaid: Math.round(Math.random() * 15 + 14),
      },
    });
  }

  console.log("✅ Seeded reading history");

  // Create some reviews
  const reviewData = [
    {
      userId: alice.id,
      bookId: books[1].id,
      rating: 5,
      text: "This book broke me in the best way. Zevin writes about creativity and love with such precise clarity — I haven't stopped thinking about it. The video game references land perfectly even if you're not a gamer.",
      tags: ["emotional", "beautifully-written", "character-driven"],
      themes: ["creativity", "friendship", "loss", "ambition"],
      sentimentScore: 0.92,
    },
    {
      userId: alice.id,
      bookId: books[2].id,
      rating: 5,
      text: "Piranesi is unlike anything I've ever read. Short but absolutely devastating in how clever it is. The mystery unravels perfectly. Read it in one sitting.",
      tags: ["unique", "magical", "mysterious"],
      themes: ["identity", "isolation", "beauty"],
      sentimentScore: 0.88,
    },
    {
      userId: bob.id,
      bookId: books[3].id,
      rating: 5,
      text: "Andy Weir did it again. The science feels real, the alien first contact is handled brilliantly, and I laughed out loud multiple times. Rocky is an all-time great character.",
      tags: ["page-turner", "funny", "scientifically-accurate"],
      themes: ["survival", "science", "friendship", "hope"],
      sentimentScore: 0.95,
    },
    {
      userId: sara.id,
      bookId: books[5].id,
      rating: 4,
      text: "Fourth Wing was so much fun. Yes, it's tropey. Yes, I didn't care. Dragons and enemies-to-lovers and a protagonist who's actually physically vulnerable — sign me up. Not high literature, high entertainment.",
      tags: ["fun", "escapist", "romance"],
      themes: ["war", "loyalty", "love"],
      sentimentScore: 0.78,
    },
    {
      userId: users[4].id,
      bookId: books[16].id,
      rating: 5,
      text: "The Secret History is the dark academia novel. Every reread reveals something new. Tartt's prose is luxurious and slow in the best possible way. The inverted mystery structure is genius.",
      tags: ["atmospheric", "literary", "obsession-worthy"],
      themes: ["privilege", "secrets", "aestheticism", "guilt"],
      sentimentScore: 0.9,
    },
    {
      userId: users[3].id,
      bookId: books[9].id,
      rating: 5,
      text: "I cried through the last 100 pages. Kristin Hannah does not miss. The Women is essential reading — these nurses deserved so much better and this book makes sure we know it.",
      tags: ["emotional", "important", "historical"],
      themes: ["sacrifice", "recognition", "trauma", "resilience"],
      sentimentScore: 0.85,
    },
  ];

  for (const r of reviewData) {
    await db.review.upsert({
      where: { userId_bookId: { userId: r.userId, bookId: r.bookId } },
      update: {},
      create: r,
    });
  }

  console.log("✅ Created reviews");

  // Create follows
  await Promise.all([
    db.follow.upsert({
      where: { followerId_followingId: { followerId: alice.id, followingId: bob.id } },
      update: {},
      create: { followerId: alice.id, followingId: bob.id },
    }),
    db.follow.upsert({
      where: { followerId_followingId: { followerId: bob.id, followingId: alice.id } },
      update: {},
      create: { followerId: bob.id, followingId: alice.id },
    }),
    db.follow.upsert({
      where: { followerId_followingId: { followerId: sara.id, followingId: alice.id } },
      update: {},
      create: { followerId: sara.id, followingId: alice.id },
    }),
    db.follow.upsert({
      where: { followerId_followingId: { followerId: users[3].id, followingId: alice.id } },
      update: {},
      create: { followerId: users[3].id, followingId: alice.id },
    }),
  ]);

  console.log("✅ Created follows");

  // Create a book club
  const club = await db.bookClub.upsert({
    where: { id: "seed-club-1" },
    update: {},
    create: {
      id: "seed-club-1",
      name: "Literary Fiction Society",
      description: "We read literary fiction that moves us. Monthly picks, weekly discussions. All paces welcome — we discuss spoiler-free until everyone's caught up.",
      ownerId: alice.id,
      isPrivate: false,
    },
  });

  await Promise.all([
    db.clubMember.upsert({
      where: { clubId_userId: { clubId: club.id, userId: alice.id } },
      update: {},
      create: { clubId: club.id, userId: alice.id, role: MemberRole.OWNER },
    }),
    db.clubMember.upsert({
      where: { clubId_userId: { clubId: club.id, userId: users[3].id } },
      update: {},
      create: { clubId: club.id, userId: users[3].id, role: MemberRole.MEMBER },
    }),
    db.clubMember.upsert({
      where: { clubId_userId: { clubId: club.id, userId: users[4].id } },
      update: {},
      create: { clubId: club.id, userId: users[4].id, role: MemberRole.ADMIN },
    }),
  ]);

  const reading = await db.clubReading.upsert({
    where: { id: "seed-reading-1" },
    update: {},
    create: {
      id: "seed-reading-1",
      clubId: club.id,
      bookId: books[4].id, // Demon Copperhead
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  await db.discussion.upsert({
    where: { id: "seed-disc-1" },
    update: {},
    create: {
      id: "seed-disc-1",
      readingId: reading.id,
      userId: alice.id,
      milestone: "general",
      content: "Starting this one with high expectations after Kingsolver's Pulitzer. The voice is immediately arresting — anyone else feeling the Dickens parallels already?",
    },
  });

  console.log("✅ Created book club with discussion");

  // Seed events (analytics pipeline)
  const eventData: Array<{
    userId: string;
    bookId: string;
    type: EventType;
    properties: object;
    createdAt: Date;
  }> = [];

  // Generate realistic events for the past 6 months
  for (const user of users) {
    for (let i = 0; i < 30; i++) {
      const book = books[Math.floor(Math.random() * books.length)];
      const date = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000);
      eventData.push({
        userId: user.id,
        bookId: book.id,
        type: EventType.VIEW_BOOK,
        properties: {},
        createdAt: date,
      });
    }

    // Start/finish events
    for (const book of [books[1], books[2], books[3]]) {
      const startDate = new Date(Date.now() - Math.random() * 120 * 24 * 60 * 60 * 1000);
      eventData.push(
        { userId: user.id, bookId: book.id, type: EventType.ADD_TO_SHELF, properties: { shelf: "READ" }, createdAt: startDate },
        { userId: user.id, bookId: book.id, type: EventType.START_READING, properties: {}, createdAt: new Date(startDate.getTime() + 1000 * 60) },
        { userId: user.id, bookId: book.id, type: EventType.UPDATE_PROGRESS, properties: { progress: 25 }, createdAt: new Date(startDate.getTime() + 3 * 24 * 60 * 60 * 1000) },
        { userId: user.id, bookId: book.id, type: EventType.UPDATE_PROGRESS, properties: { progress: 50 }, createdAt: new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000) },
        { userId: user.id, bookId: book.id, type: EventType.UPDATE_PROGRESS, properties: { progress: 75 }, createdAt: new Date(startDate.getTime() + 9 * 24 * 60 * 60 * 1000) },
        { userId: user.id, bookId: book.id, type: EventType.FINISH_BOOK, properties: {}, createdAt: new Date(startDate.getTime() + 12 * 24 * 60 * 60 * 1000) }
      );
    }
  }

  await db.event.createMany({ data: eventData, skipDuplicates: true });
  console.log(`✅ Created ${eventData.length} analytics events`);

  // Seed UserMetrics
  await Promise.all(
    users.map((user) =>
      db.userMetrics.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          totalBooksRead: Math.floor(Math.random() * 40 + 5),
          totalPagesRead: Math.floor(Math.random() * 15000 + 2000),
          totalDnf: Math.floor(Math.random() * 5),
          avgDaysToFinish: Math.random() * 20 + 5,
          currentStreak: Math.floor(Math.random() * 30),
          longestStreak: Math.floor(Math.random() * 90 + 10),
          dnfRate: Math.random() * 0.2,
          booksThisYear: Math.floor(Math.random() * 25 + 3),
          pagesThisMonth: Math.floor(Math.random() * 1200 + 200),
          pagesThisYear: Math.floor(Math.random() * 12000 + 1000),
          genreDistribution: { "Literary Fiction": 14, "Fantasy": 8, "Nonfiction": 6, "Thriller": 4 },
          completionByGenre: { "Literary Fiction": 0.78, "Fantasy": 0.82, "Nonfiction": 0.91, "Thriller": 0.87 },
          dnfByGenre: { "Literary Fiction": 0.12, "Fantasy": 0.10, "Nonfiction": 0.05, "Thriller": 0.08 },
          totalSpent: Math.random() * 200 + 50,
          costPerBook: Math.random() * 12 + 5,
          libraryRatio: Math.random() * 0.5,
          avgPagesPerDay: Math.random() * 40 + 20,
        },
      })
    )
  );

  console.log("✅ Seeded user metrics");
  console.log("\n🎉 Seeding complete!\n");
  console.log("Demo credentials:");
  console.log("  Email:    demo@readrviz.dev");
  console.log("  Password: password123\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

-- Authentication tables for Better Auth on Supabase PostgreSQL.
create table if not exists "user" (
  "id" text not null primary key,
  "name" text not null,
  "email" text not null unique,
  "emailVerified" boolean not null default false,
  "image" text,
  "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
  "updatedAt" timestamptz default CURRENT_TIMESTAMP not null
);
create table if not exists "session" (
  "id" text not null primary key,
  "expiresAt" timestamptz not null,
  "token" text not null unique,
  "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
  "updatedAt" timestamptz not null,
  "ipAddress" text,
  "userAgent" text,
  "userId" text not null references "user" ("id") on delete cascade
);
create table if not exists "account" (
  "id" text not null primary key,
  "accountId" text not null,
  "providerId" text not null,
  "userId" text not null references "user" ("id") on delete cascade,
  "accessToken" text,
  "refreshToken" text,
  "idToken" text,
  "accessTokenExpiresAt" timestamptz,
  "refreshTokenExpiresAt" timestamptz,
  "scope" text,
  "password" text,
  "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
  "updatedAt" timestamptz not null
);
create table if not exists "verification" (
  "id" text not null primary key,
  "identifier" text not null,
  "value" text not null,
  "expiresAt" timestamptz not null,
  "createdAt" timestamptz default CURRENT_TIMESTAMP not null,
  "updatedAt" timestamptz default CURRENT_TIMESTAMP not null
);
create index if not exists "session_userId_idx" on "session" ("userId");
create index if not exists "account_userId_idx" on "account" ("userId");
create index if not exists "verification_identifier_idx" on "verification" ("identifier");
create table if not exists brands (
  id serial primary key,
  name text not null,
  slug text not null unique,
  description text not null default '',
  image_url text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists products (
  id serial primary key,
  brand_id integer not null references brands(id),
  name text not null,
  slug text not null unique,
  collection text not null check (collection in ('men', 'women')),
  short_description text not null default '',
  full_description text not null default '',
  price numeric(12,2) not null,
  discount_percent integer not null default 0,
  stock integer not null default 1,
  images text not null default '[]',
  video_url text,
  video_poster_url text,
  featured boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists products_brand_id_idx on products (brand_id);
create index if not exists products_collection_idx on products (collection);
create index if not exists products_featured_idx on products (featured);

create table if not exists orders (
  id serial primary key,
  order_number text not null unique,
  user_id text not null,
  customer_email text not null,
  total numeric(12,2) not null,
  status text not null default 'pending',
  shipping_name text not null default '',
  shipping_phone text not null default '',
  shipping_address text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists orders_user_id_idx on orders (user_id);
create index if not exists orders_status_idx on orders (status);

create table if not exists order_items (
  id serial primary key,
  order_id integer not null references orders(id) on delete cascade,
  product_id integer not null,
  product_name text not null,
  unit_price numeric(12,2) not null,
  quantity integer not null,
  image_url text not null default ''
);

create table if not exists refunds (
  id serial primary key,
  order_id integer not null references orders(id),
  user_id text not null,
  amount numeric(12,2) not null,
  reason text not null,
  status text not null default 'requested',
  created_at timestamptz not null default now()
);

create index if not exists refunds_order_id_idx on refunds (order_id);

create table if not exists reviews (
  id serial primary key,
  product_id integer not null references products(id) on delete cascade,
  user_id text not null,
  author_name text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index if not exists reviews_product_id_idx on reviews (product_id);

insert into brands (id, name, slug, description, image_url) values
  (1, 'Meridian', 'meridian', 'The house line. Integrated steel, quiet finishing, built to be worn every day.', '/brands/meridian.svg'),
  (2, 'Nocturne', 'nocturne', 'Dark ceramics and night-diver instruments. Made for after hours.', '/brands/nocturne.svg'),
  (3, 'Velora', 'velora', 'Fine mesh and warm metals. Jewellery that happens to tell the time.', '/brands/velora.svg'),
  (4, 'Sable', 'sable', 'Open works and field tools. Texture, grit, and visible craft.', '/brands/sable.svg'),
  (5, 'Lumière', 'lumiere', 'Light on the wrist. Pearl, ceramic, and snow-white cases.', '/brands/lumiere.svg'),
  (6, 'Kairos', 'kairos', 'The right moment, held. Dress pieces with a thin voice.', '/brands/kairos.svg'),
  (7, 'Atlas', 'atlas', 'Two time zones, one intention. Travel instruments with a calm dial.', '/brands/atlas.svg')
on conflict (slug) do nothing;

select setval('brands_id_seq', (select coalesce(max(id), 1) from brands));

insert into products (
  id, brand_id, name, slug, collection, short_description, full_description,
  price, discount_percent, stock, images, video_url, video_poster_url, featured
) values
  (1, 2, 'Midnight Chronograph', 'midnight-chronograph', 'men',
   'Ceramic night. Three counters, one glance.',
   'A matte-black ceramic chronograph built for the hours after dark. Three counters sit in a quiet layout. The bracelet is integrated. Nothing extra on the dial.',
   54900, 10, 14,
   '["/watches/midnight-chrono.jpg","/watches/midnight-chrono-2.jpg"]',
   '/films/midnight-chrono.mp4', '/films/midnight-chrono.jpg', true),
  (2, 7, 'Atlas GMT', 'atlas-gmt', 'men',
   'Home and away, on one bezel.',
   'A dual-time instrument with a navy sunburst dial and a bidirectional steel-and-black bezel. Travel without noise.',
   62400, 0, 11,
   '["/watches/atlas-gmt.jpg","/watches/atlas-gmt-2.jpg"]',
   '/films/atlas-gmt.mp4', '/films/atlas-gmt.jpg', true),
  (3, 4, 'Carbon Field', 'carbon-field', 'men',
   'Titanium. Lume. Ready.',
   'Sandblasted titanium with an olive dial and cathedral hands. A field watch that does not pretend to be a tool it is not — it simply works.',
   38900, 0, 5,
   '["/watches/carbon-field.jpg"]',
   null, null, true),
  (4, 6, 'Heritage Automatic', 'heritage-automatic', 'men',
   'Thin steel. Cream dial. Enough.',
   'An ultra-thin automatic with an opaline cream dial and dauphine hands. The bracelet is slim. The finishing is the point.',
   45900, 15, 18,
   '["/watches/heritage-auto.jpg"]',
   null, null, true),
  (5, 4, 'Sable Skeleton', 'sable-skeleton', 'men',
   'The movement is the design.',
   'Open-worked bridges in anthracite, gears left visible under smoked sapphire. A watch that shows its work.',
   72900, 0, 9,
   '["/watches/sable-skeleton.jpg","/watches/sable-skeleton-2.jpg"]',
   '/films/sable-skeleton.mp4', '/films/sable-skeleton.jpg', true),
  (6, 2, 'Deep Diver', 'deep-diver', 'men',
   'Black ceramic. Orange pip. Depth.',
   'A professional diver with a unidirectional ceramic bezel and a lume plot you can find in the dark. Steel bracelet, no theatre.',
   49900, 0, 16,
   '["/watches/deep-diver.jpg"]',
   null, null, true),
  (7, 1, 'Meridian Sport', 'meridian-sport', 'men',
   'Integrated steel, house finishing.',
   'The house sports watch. Vertical brushing, a slate dial, a date that sits where it should. Designed to disappear on the wrist and appear in the room.',
   41900, 0, 22,
   '["/watches/meridian-sport.jpg","/watches/meridian-sport-2.jpg"]',
   null, null, true),
  (8, 5, 'Lumière Pearl', 'lumiere-pearl', 'women',
   'Mother-of-pearl, cut quiet.',
   'A round steel case around a white mother-of-pearl dial. Diamond-cut indices catch light without asking for it. The bracelet is slim.',
   36900, 0, 13,
   '["/watches/lumiere-pearl.jpg","/watches/lumiere-pearl-2.jpg"]',
   '/films/lumiere-pearl.mp4', '/films/lumiere-pearl.jpg', true),
  (9, 3, 'Velora Mesh', 'velora-mesh', 'women',
   'Warm metal. Almost jewellery.',
   'A rose-tone case on a fine mesh bracelet. The champagne dial is a soft field. Made to be worn with almost nothing else.',
   28900, 12, 10,
   '["/watches/rose-mesh.jpg"]',
   null, null, true),
  (10, 5, 'Blanc Ceramic', 'blanc-ceramic', 'women',
   'White ceramic. Snow dial.',
   'High-gloss white ceramic case and bracelet. A snow dial. Silver hands. Clean as a well-set table.',
   33400, 0, 15,
   '["/watches/blanc-ceramic.jpg","/watches/blanc-ceramic-2.jpg"]',
   null, null, true),
  (11, 7, 'Atlas Moon', 'atlas-moon', 'women',
   'A night dial, held small.',
   'Midnight navy mother-of-pearl with a moonphase at six. Slim steel. A travel house, after dark.',
   41200, 0, 8,
   '["/watches/nocturne-moon.jpg"]',
   null, null, true),
  (12, 1, 'Meridian Ice', 'meridian-ice', 'women',
   'Cool ceramic. House line.',
   'The house ceramic in ice. A cooler reading of white, for wrists that want less warmth and more light.',
   27800, 0, 19,
   '["/watches/aurora-ice.jpg"]',
   null, null, true),
  (13, 6, 'Kairos Oval', 'kairos-oval', 'women',
   'An oval case. The moment, elongated.',
   'A jewellery watch in an elongated oval. Crystal-like indices, a slender bracelet, a dial that stays quiet on purpose.',
   35400, 0, 7,
   '["/watches/crystal-oval.jpg"]',
   null, null, true),
  (14, 3, 'Velora Cuff', 'velora-cuff', 'women',
   'A bangle that keeps time.',
   'Sculptural mesh, worn as a cuff. The dial is small and ivory. Fashion first, time second — on purpose.',
   24600, 8, 3,
   '["/watches/silk-cuff.jpg"]',
   null, null, true)
on conflict (slug) do nothing;

select setval('products_id_seq', (select coalesce(max(id), 1) from products));

insert into reviews (product_id, user_id, author_name, rating, body) values
  (1, 'seed-arjun', 'Arjun Mehta', 5, 'The black ceramic wears quieter than it looks. Weight is right. I stopped checking other chronographs.'),
  (2, 'seed-neha', 'Neha Kapoor', 5, 'Two time zones without a crowded dial. The navy catches light in a room, not on a billboard.'),
  (8, 'seed-ria', 'Ria Sharma', 5, 'Pearl that does not shout. Bracelet sits flat. I wear it with a white shirt and nothing else.'),
  (5, 'seed-kabir', 'Kabir Lal', 4, 'You see the movement. That is the whole argument. Finishing on the bridges is cleaner than I expected.'),
  (9, 'seed-anya', 'Anya Bose', 5, 'Mesh like fabric. The rose tone is warm, not costume. People ask what it is. I like that.'),
  (7, 'seed-dev', 'Dev Malhotra', 5, 'Daily steel. I forget it is there, which is the highest compliment I have for a watch.'),
  (10, 'seed-meera', 'Meera Iyer', 5, 'White ceramic stays white. The dial is snow. It feels considered.'),
  (4, 'seed-vikram', 'Vikram Shah', 4, 'Thin enough for a cuff. Cream dial looks like paper. This is the one I wear to dinner.')
on conflict (product_id, user_id) do nothing;
-- Supabase security hardening.
-- The Better Auth table name must be quoted because user is a PostgreSQL keyword.
-- No public policies are created: the application uses its private DATABASE_URL
-- server connection, while anonymous Supabase API access remains blocked.

alter table "user" enable row level security;
alter table "session" enable row level security;
alter table "account" enable row level security;
alter table "verification" enable row level security;
alter table brands enable row level security;
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table refunds enable row level security;
alter table reviews enable row level security;

revoke all on table "user", "session", "account", "verification", brands, products, orders, order_items, refunds, reviews from anon, authenticated;

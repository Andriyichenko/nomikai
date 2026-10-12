export type MenuItem = { name: string; price: string; note?: string };
export type Review = { author: string; rating: number | null; body: string; date?: string };

export type Shop = {
  id: string;
  name: string;
  genre: string;
  summary: string;
  logo_url: string | null;
  cover_url: string | null;
  budget: string;
  address: string;
  access: string;
  hours: string;
  phone: string;
  lat: number | null;
  lng: number | null;
  rating: number | null;
  review_count: number | null;
  reviews: Review[];
  menu: MenuItem[];
  photos: string[];
  source: "tabelog" | "hotpepper" | "manual" | "other";
  source_url: string | null;
};

/** Shop fields an admin edits / the importer fills in. */
export type ShopDraft = Omit<Shop, "id">;

export type EventStatus = "draft" | "open" | "closed" | "decided";

export type EventRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  area: string;
  start_time: string;
  budget_note: string;
  dates: string[];
  deadline: string | null;
  status: EventStatus;
  decided_shop_id: string | null;
  decided_date: string | null;
  created_at: string;
};

export type Profile = {
  id: string;
  email: string | null;
  display_name: string;
  avatar_url: string | null;
  is_admin: boolean;
};

export type Response = {
  event_id: string;
  profile_id: string;
  shop_ids: string[];
  dates: string[];
  comment: string;
  updated_at: string;
};

export type Voter = { name: string; avatar: string | null };
export type EventResults = {
  respondents: number;
  shops: { shop_id: string; count: number; voters: Voter[] }[];
  dates: { date: string; count: number; voters: Voter[] }[];
  people: (Voter & { comment: string; shops: string[]; dates: string[] })[];
};

export type Tagline = {
  id: string;
  line_ja: string;
  line_zh: string;
  caption_ja: string;
  caption_zh: string;
  is_active: boolean;
  position: number;
};

export type SiteSettings = {
  brand: string;
  brand_sub: string;
  notice_title: string;
  notice_body: string;
  notice_updated_at: string | null;
  contact_url: string;
};

export type ArchiveEntry = {
  id: string;
  title: string;
  held_on: string | null;
  place: string;
  body: string;
  images: string[];
  position: number;
};

/** Error code from setAttendance when the daily join/decline cap (attendees_limit_changes trigger) is hit. */
export const ATTEND_LIMIT = "attend_limit";

/** Error code when the daily submit/withdraw cap (responses_limit_changes trigger) is hit. */
export const RESPONSE_LIMIT = "response_limit";

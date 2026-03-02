export type Course = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  state: string;
  zip: string | null;
  image_url: string | null;
  tee_time_url: string;
  website_url: string | null;
  phone: string | null;
  is_public: boolean;
  clicks: number;
  updated_at: string;
};

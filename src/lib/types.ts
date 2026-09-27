export type SpotMarker = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type Spot = SpotMarker & {
  description: string | null;
  address: string | null;
  google_place_id: string | null;
  created_by: string;
  created_at: string;
};

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  facebook_profile_url: string | null;
  role: "member" | "admin";
  is_banned: boolean;
};

// A spot being created, before it is saved.
export type SpotDraft = {
  lat: number;
  lng: number;
  name: string;
  address: string | null;
  placeId: string | null;
};

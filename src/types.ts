export interface Movie {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  poster_path: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  overview?: string;
  genre_ids?: number[];
}
// Thin client over the GoodForFree WordPress REST API.
export const WP_URL = 'https://goodforfree.com/wp-json/wp/v2';
export const WP_BASE_URL = 'https://goodforfree.com';

export interface Article {
  id: number;
  title: string;
  excerpt: string; // plain-ish text for the list
  contentHtml: string; // full HTML for the detail view
  date: string; // ISO string
  link: string;
  imageUrl: string | null;
  author: string | null;
  categories: string[];
}

export interface Category {
  id: number;
  name: string;
  count: number;
}

// WordPress wraps a lot of fields in { rendered: "<p>...</p>" } and embeds HTML
// entities. This strips tags/entities for the short excerpt in the list.
function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]+>/g, '')
    .replace(/&hellip;/g, '…')
    .replace(/&#8217;/g, '’')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#038;|&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mapPost(post: any): Article {
  const embedded = post._embedded || {};
  const media = embedded['wp:featuredmedia'];
  const author = embedded.author;
  const terms = embedded['wp:term'];

  let imageUrl: string | null = null;
  if (Array.isArray(media) && media[0]) {
    const sizes = media[0]?.media_details?.sizes;
    imageUrl =
      sizes?.medium_large?.source_url ||
      sizes?.large?.source_url ||
      sizes?.medium?.source_url ||
      media[0]?.source_url ||
      null;
  }

  const categories: string[] = [];
  if (Array.isArray(terms)) {
    terms.flat().forEach((t: any) => {
      if (t?.taxonomy === 'category' && t?.name) categories.push(t.name);
    });
  }

  return {
    id: post.id,
    title: stripHtml(post.title?.rendered ?? ''),
    excerpt: stripHtml(post.excerpt?.rendered ?? ''),
    contentHtml: post.content?.rendered ?? '',
    date: post.date,
    link: post.link,
    imageUrl,
    author: Array.isArray(author) && author[0]?.name ? author[0].name : null,
    categories,
  };
}

export interface FetchPostsParams {
  page?: number;
  perPage?: number;
  search?: string;
  categoryId?: number;
  signal?: AbortSignal;
}

export interface PostsResult {
  articles: Article[];
  totalPages: number;
}

export async function fetchPosts({
  page = 1,
  perPage = 10,
  search,
  categoryId,
  signal,
}: FetchPostsParams = {}): Promise<PostsResult> {
  const params = new URLSearchParams({
    _embed: '1',
    per_page: String(perPage),
    page: String(page),
    orderby: 'date',
    order: 'desc',
  });
  if (search) params.set('search', search);
  if (categoryId) params.set('categories', String(categoryId));

  const res = await fetch(`${WP_URL}/posts?${params.toString()}`, { signal });

  if (!res.ok) {
    // WP returns 400 with rest_post_invalid_page_number when you page past the end.
    if (res.status === 400) return { articles: [], totalPages: page };
    throw new Error(`WordPress request failed (${res.status})`);
  }

  const totalPages = Number(res.headers.get('X-WP-TotalPages') || '1');
  const data = await res.json();
  return { articles: (data as any[]).map(mapPost), totalPages };
}

export async function fetchPost(id: number, signal?: AbortSignal): Promise<Article> {
  const res = await fetch(`${WP_URL}/posts/${id}?_embed=1`, { signal });
  if (!res.ok) throw new Error(`WordPress request failed (${res.status})`);
  return mapPost(await res.json());
}

export async function fetchCategories(signal?: AbortSignal): Promise<Category[]> {
  const res = await fetch(
    `${WP_URL}/categories?per_page=50&orderby=count&order=desc&hide_empty=true`,
    { signal }
  );
  if (!res.ok) throw new Error(`WordPress request failed (${res.status})`);
  const data = await res.json();
  return (data as any[])
    .filter((c) => c.count > 0)
    .map((c) => ({ id: c.id, name: stripHtml(c.name), count: c.count }));
}

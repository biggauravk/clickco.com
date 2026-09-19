export const PRODUCT_SELECT = `
  p.id, p.brand_id, b.name as brand_name, b.slug as brand_slug,
  p.name, p.slug, p.collection, p.short_description, p.full_description,
  p.price, p.discount_percent, p.stock, p.images, p.video_url, p.video_poster_url,
  p.featured, p.created_at,
  (select ma.aspect_ratio from media_assets ma where ma.public_url = p.video_url limit 1) as video_aspect_ratio
`;

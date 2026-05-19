import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  image?: string;
  type?: 'website' | 'music.song' | 'music.album' | 'music.playlist' | 'profile';
  jsonLd?: object;
}

const DEFAULT_TITLE = 'GT Music - Your Personal Music Universe';
const DEFAULT_DESC = 'A premium, ad-free personal music streaming experience. Stream your own library anywhere.';

export function SEO({ title, description, path = '/', image = '/og-image.jpg', type = 'website', jsonLd }: SEOProps) {
  const fullTitle = title ? `${title} · GT Music` : DEFAULT_TITLE;
  const desc = description || DEFAULT_DESC;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={path} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={path} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={image} />
      {jsonLd ? (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      ) : null}
    </Helmet>
  );
}

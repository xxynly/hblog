import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { Container } from '../components/container';
import { Layout } from '../components/layout';
import { AppProvider } from '../components/contexts/appContext';
import { request } from 'graphql-request';
import { PublicationFragment, UrlPattern } from '../generated/graphql';
import Head from 'next/head';
import { useRouter } from 'next/router';

const GQL_ENDPOINT = process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT!;

interface SearchResult {
  id: string;
  title: string;
  brief: string;
  slug: string;
  publishedAt: string;
  url: string;
  coverImage?: {
    url: string;
  };
}

interface Props {
  publication: PublicationFragment;
  results: SearchResult[];
  query: string;
  error?: string;
}

interface PublicationResponse {
  publication: PublicationFragment | null;
}

interface SearchResponse {
  searchPostsOfPublication: {
    edges: Array<{
      node: SearchResult;
    }>;
  };
}

export default function Search({ publication, results, query, error }: Props) {
  const [searchQuery, setSearchQuery] = useState(query);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <AppProvider publication={publication}>
      <Layout>
        <Head>
          <title>Search - {publication?.title || 'Blog'}</title>
        </Head>
        <Container className="mx-auto max-w-2xl px-5 py-10">
          {/* Search Form */}
          <div className="mb-12 text-center">
            <h1 className="mb-8 text-3xl font-bold text-slate-900 dark:text-white">Search Articles</h1>
            <form onSubmit={handleSearch}>
              <div className="relative mx-auto max-w-xl">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type to search..."
                  className="w-full rounded-full border border-slate-200 bg-white px-6 py-3 pr-12 text-lg focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
                <button
                  type="submit"
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-blue-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                    <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-900 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Search Results */}
          {query && !error && results.length > 0 && (
            <div className="mb-6 text-sm text-slate-600 dark:text-slate-400">
              {results.length} {results.length === 1 ? 'result' : 'results'} for &ldquo;{query}&rdquo;
            </div>
          )}

          <div className="space-y-4">
            {results.map((result) => (
              <article key={result.id} className="group flex items-baseline justify-between gap-2 py-2">
                <h2 className="text-lg font-medium">
                  <a
                    href={result.url}
                    className="text-slate-900 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400"
                  >
                    {result.title}
                  </a>
                </h2>
                <time
                  dateTime={result.publishedAt}
                  className="shrink-0 text-sm text-slate-600 dark:text-slate-400"
                >
                  {new Date(result.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
              </article>
            ))}
          </div>

          {/* No Results */}
          {query && !error && results.length === 0 && (
            <div className="text-center text-slate-600 dark:text-slate-400">
              No results found for &ldquo;{query}&rdquo;
            </div>
          )}
        </Container>
      </Layout>
    </AppProvider>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async ({ query }) => {
  const searchQuery = query.q as string;
  const host = process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST;
  console.log('Search query:', searchQuery);
  console.log('Host:', host);

  const emptyPublication: PublicationFragment = {
    __typename: 'Publication',
    id: '',
    title: '',
    url: '',
    urlPattern: UrlPattern.Default,
    isTeam: false,
    features: {
      __typename: 'PublicationFeatures',
      newsletter: { __typename: 'NewsletterFeature', isEnabled: false },
      readTime: { __typename: 'ReadTimeFeature', isEnabled: false },
      textSelectionSharer: { __typename: 'TextSelectionSharerFeature', isEnabled: false }
    },
    ogMetaData: { __typename: 'OpenGraphMetaData' },
    author: {
      __typename: 'User',
      id: '',
      name: '',
      username: '',
    },
    preferences: {
      __typename: 'Preferences',
      navbarItems: [],
    },
  };

  try {
    // Get publication data
    const data = await request<PublicationResponse>(
      GQL_ENDPOINT,
      `
      query Publication($host: String!) {
        publication(host: $host) {
          id
          title
          displayTitle
          descriptionSEO
          about {
            html
          }
          author {
            name
            profilePicture
            tagline
            bio {
              html
            }
          }
          links {
            twitter
            github
            linkedin
            website
            hashnode
          }
        }
      }
      `,
      { host }
    );

    if (!data.publication) {
      return {
        props: {
          publication: emptyPublication,
          results: [],
          query: searchQuery || '',
          error: 'Publication not found'
        }
      };
    }

    const { publication } = data;

    // If no search query, return empty results
    if (!searchQuery) {
      return {
        props: {
          publication,
          results: [],
          query: '',
        },
      };
    }

    // Search posts
    const searchData = await request<SearchResponse>(
      GQL_ENDPOINT,
      `
      query SearchPosts($filter: SearchPostsOfPublicationFilter!, $first: Int!) {
        searchPostsOfPublication(filter: $filter, first: $first) {
          edges {
            node {
              id
              title
              brief
              slug
              publishedAt
              url
              coverImage {
                url
              }
            }
          }
        }
      }
      `,
      {
        filter: {
          publicationId: publication.id,
          query: searchQuery,
        },
        first: 10,
      }
    );

    console.log('Search response:', JSON.stringify(searchData, null, 2));

    const results = searchData.searchPostsOfPublication.edges.map((edge) => edge.node);

    return {
      props: {
        publication,
        results,
        query: searchQuery,
      },
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      props: {
        publication: emptyPublication,
        results: [],
        query: searchQuery || '',
        error: error instanceof Error ? error.message : 'An error occurred'
      }
    };
  }
};

import { Container } from '../../components/container';
import { Layout } from '../../components/layout';
import { PersonalHeader } from '../../components/personal-theme-header';
import { Footer } from '../../components/footer';
import { AppProvider } from '../../components/contexts/appContext';
import { PostFragment, PublicationFragment } from '../../generated/graphql';
import { GetStaticProps } from 'next';
import request from 'graphql-request';
import { PostsByPublicationDocument } from '../../generated/graphql';
import Head from 'next/head';
import Link from 'next/link';

type Props = {
  posts: PostFragment[];
  publication: PublicationFragment;
};

// 从文章中提取所有标签并统计数量
const getTagsWithCount = (posts: PostFragment[]) => {
  const tagCount: Record<string, { count: number; slug: string }> = {};
  
  posts.forEach(post => {
    const tags = post.tags || [];
    tags.forEach(tag => {
      const tagName = tag.name;
      if (!tagCount[tagName]) {
        tagCount[tagName] = { count: 0, slug: tag.slug };
      }
      tagCount[tagName].count += 1;
    });
  });

  // 按标签数量降序排序
  return Object.entries(tagCount)
    .sort(([, a], [, b]) => b.count - a.count)
    .map(([name, data]) => ({
      name,
      count: data.count,
      slug: data.slug
    }));
};

export default function Tags({ posts, publication }: Props) {
  const tags = getTagsWithCount(posts);

  return (
    <AppProvider publication={publication}>
      <Layout>
        <Head>
          <title>Tags - {publication.title}</title>
          <meta
            name="description"
            content={`All tags from ${publication.title}`}
          />
        </Head>
        <Container className="mx-auto flex max-w-3xl flex-col items-stretch gap-10 px-5 py-10">
          <PersonalHeader />
          <main>
            <h1 className="mb-8 text-3xl font-bold text-slate-900 dark:text-white">Tags</h1>
            <div className="flex flex-wrap gap-4">
              {tags.map(({ name, count, slug }) => (
                <Link
                  key={slug}
                  href={`/tags/${slug}`}
                  className="group inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                >
                  <span className="text-base">{name}</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    ({count})
                  </span>
                </Link>
              ))}
              {tags.length === 0 && (
                <p className="text-center text-slate-500 dark:text-slate-400">
                  No tags found.
                </p>
              )}
            </div>
          </main>
          <Footer />
        </Container>
      </Layout>
    </AppProvider>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const data = await request(
    process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT,
    PostsByPublicationDocument,
    {
      first: 0,
      host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST,
    }
  );

  if (!data.publication) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      posts: data.publication.posts.edges.map((edge) => edge.node),
      publication: data.publication,
    },
    revalidate: 60,
  };
};

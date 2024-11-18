import { Container } from '../components/container';
import { Layout } from '../components/layout';
import { PersonalHeader } from '../components/personal-theme-header';
import { Footer } from '../components/footer';
import { AppProvider } from '../components/contexts/appContext';
import { PostFragment, PublicationFragment } from '../generated/graphql';
import { GetStaticProps } from 'next';
import request from 'graphql-request';
import { PostsByPublicationDocument } from '../generated/graphql';
import Head from 'next/head';
import Link from 'next/link';
import { DateFormatter } from '../components/date-formatter';

type Props = {
  posts: PostFragment[];
  publication: PublicationFragment;
};

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// 按年份和月份分组文章
const groupPostsByYearAndMonth = (posts: PostFragment[]) => {
  const groups: Record<number, Record<number, PostFragment[]>> = {};
  
  posts.forEach(post => {
    const date = new Date(post.publishedAt);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    if (!groups[year]) {
      groups[year] = {};
    }
    if (!groups[year][month]) {
      groups[year][month] = [];
    }
    groups[year][month].push(post);
  });

  // 对每个月份内的文章按日期降序排序
  Object.values(groups).forEach(yearGroup => {
    Object.values(yearGroup).forEach(posts => {
      posts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    });
  });

  // 返回按年份和月份降序排序的数组
  return Object.entries(groups)
    .map(([year, months]) => ({
      year: parseInt(year),
      months: Object.entries(months)
        .map(([month, posts]) => ({
          month: parseInt(month),
          monthName: MONTHS[parseInt(month)],
          posts,
          postCount: posts.length
        }))
        .sort((a, b) => b.month - a.month)
    }))
    .sort((a, b) => b.year - a.year);
};

export default function Archive({ posts, publication }: Props) {
  const postsByYearAndMonth = groupPostsByYearAndMonth(posts);

  return (
    <AppProvider publication={publication}>
      <Layout>
        <Head>
          <title>Archive - {publication.title}</title>
          <meta
            name="description"
            content={`Archive of all posts from ${publication.title}`}
          />
        </Head>
        <Container className="mx-auto flex max-w-3xl flex-col items-stretch gap-10 px-5 py-10">
          <PersonalHeader />
          <main>
            <h1 className="mb-8 text-3xl font-bold text-slate-900 dark:text-white">Archive</h1>
            <div className="space-y-12">
              {postsByYearAndMonth.map(({ year, months }) => (
                <section key={year}>
                  <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">{year}</h2>
                  <div className="space-y-8">
                    {months.map(({ month, monthName, posts, postCount }) => (
                      <div key={month} className="space-y-3">
                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                          {monthName} <span className="text-slate-500">({postCount})</span>
                        </h3>
                        <ul className="space-y-4">
                          {posts.map((post) => (
                            <li key={post.id} className="group">
                              <Link
                                href={`/${post.slug}`}
                                className="flex flex-col space-y-1"
                              >
                                <span className="text-base text-slate-900 group-hover:text-blue-600 dark:text-slate-200 dark:group-hover:text-blue-400">
                                  {post.title}
                                </span>
                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                  Date: <DateFormatter dateString={post.publishedAt} formatStr="MMMM d, yyyy" /> | 
                                  Estimated Reading Time: {post.readTimeInMinutes} min | 
                                  Author: {publication.title}
                                </div>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
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

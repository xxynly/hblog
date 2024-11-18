import { Container } from '../components/container';
import { Layout } from '../components/layout';
import { PersonalHeader } from '../components/personal-theme-header';
import { Footer } from '../components/footer';
import { AppProvider } from '../components/contexts/appContext';
import { PublicationFragment } from '../generated/graphql';
import { GetStaticProps } from 'next';
import request from 'graphql-request';
import { PageByPublicationDocument } from '../generated/graphql';
import Head from 'next/head';
import { useEffect } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-docker';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-rust';

type Props = {
  publication: PublicationFragment;
  page: {
    title: string;
    content: {
      markdown: string;
    };
  } | null;
};

export default function About({ publication, page }: Props) {
  useEffect(() => {
    Prism.highlightAll();
  }, [page?.content.markdown]);

  return (
    <AppProvider publication={publication}>
      <Layout>
        <Head>
          <title>About - {publication.title}</title>
          <meta
            name="description"
            content={`About ${publication.title}`}
          />
        </Head>
        <Container className="mx-auto flex max-w-3xl flex-col items-stretch gap-10 px-5 py-10">
          <PersonalHeader />
          <main>
            <h1 className="mb-8 text-3xl font-bold text-slate-900 dark:text-white">
              {page?.title || 'About'}
            </h1>
            {page ? (
              <article
                className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-img:rounded-lg prose-pre:bg-slate-900"
                dangerouslySetInnerHTML={{ __html: page.content.markdown }}
              />
            ) : (
              <p className="text-center text-slate-500 dark:text-slate-400">
                No about page content found. Please create an about page in your Hashnode dashboard.
              </p>
            )}
          </main>
          <Footer />
        </Container>
      </Layout>
    </AppProvider>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const data = await request(
    process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT!,
    PageByPublicationDocument,
    {
      slug: 'about',
      host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST,
    }
  );

  if (!data.publication) {
    return {
      notFound: true,
    };
  }

  const staticPage = data.publication.staticPage;
  
  return {
    props: {
      publication: data.publication,
      page: staticPage ? {
        title: staticPage.title,
        content: {
          markdown: staticPage.content.markdown
        }
      } : null
    },
    revalidate: 60,
  };
};

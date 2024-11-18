import { Container } from '../../components/container';
import { Layout } from '../../components/layout';
import { PersonalHeader } from '../../components/personal-theme-header';
import { Footer } from '../../components/footer';
import { AppProvider } from '../../components/contexts/appContext';
import { PublicationFragment, SeriesFragment } from '../../generated/graphql';
import { GetStaticProps } from 'next';
import request from 'graphql-request';
import { SeriesByPublicationDocument } from '../../generated/graphql';
import Head from 'next/head';
import { SeriesFilters } from '../../components/series/series-filters';
import { SeriesCard } from '../../components/series/series-card';
import { useState } from 'react';

type Props = {
  publication: PublicationFragment;
  series: SeriesFragment[];
};

export default function SeriesIndex({ publication, series }: Props) {
  const [filteredSeries, setFilteredSeries] = useState(series);

  return (
    <AppProvider publication={publication}>
      <Layout>
        <Head>
          <title>Series - {publication.title}</title>
          <meta
            name="description"
            content={`Article series from ${publication.title}`}
          />
        </Head>
        <Container className="mx-auto flex max-w-3xl flex-col items-stretch gap-10 px-5 py-10">
          <PersonalHeader />
          <main>
            <div className="mb-8 flex items-center justify-between">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Series
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {series.length} {series.length === 1 ? 'series' : 'series'}
              </p>
            </div>

            <SeriesFilters series={series} onFilter={setFilteredSeries} />

            {filteredSeries.length > 0 ? (
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                {filteredSeries.map((s) => (
                  <SeriesCard key={s.id} series={s} />
                ))}
              </div>
            ) : (
              <p className="text-center text-slate-500 dark:text-slate-400">
                {series.length > 0
                  ? 'No series match your search criteria.'
                  : 'No series found. Create your first series in the Hashnode dashboard.'}
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
    process.env.NEXT_PUBLIC_HASHNODE_GQL_ENDPOINT,
    SeriesByPublicationDocument,
    {
      host: process.env.NEXT_PUBLIC_HASHNODE_PUBLICATION_HOST,
    }
  );

  if (!data.publication) {
    return {
      notFound: true,
    };
  }

  const series = data.publication.seriesList?.edges.map((edge) => edge.node) || [];

  return {
    props: {
      publication: data.publication,
      series,
    },
    revalidate: 60,
  };
};

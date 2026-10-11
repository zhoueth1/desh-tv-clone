import React, { useCallback, useRef } from 'react';
import Navbar from '../src/components/Navbar';
import styled from 'styled-components';
import IndexMainArticles from '../src/components/IndexMainArticles';
import useMediaQuery from '../src/hooks/useMediaQuery';
import MobileNav from '../src/components/MobileNav';
import { client } from '../src/utils/graphqlRequest';
import useOnScreen from '../src/hooks/useOnScreen';
import { gql } from 'graphql-request';
import { Articles } from '../src/types/data';
import useInfiniteList from '../src/hooks/useInfiniteList';

const PageWrapper = styled.div``;

export default function Home({ data }: { data: { articles: Articles } }) {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref);

  const loadMore = useCallback(async (skip: number, signal: AbortSignal) => {
    const data = await client.request<{ articles: Articles }>({
      document: gql`
        query MoreArticles($skip: Int!, $take: Int!) {
          articles(skip: $skip, take: $take, orderBy: { created_at: desc }) {
            id
            image_data
            slug
            title
            translated_date
            category { name slug }
          }
        }
      `,
      variables: { skip, take: 10 },
      signal,
    });
    return data.articles;
  }, []);
  const articles = useInfiniteList(data.articles, isVisible, 10, loadMore);
  return (
    <PageWrapper>
      {isMobile ? <MobileNav /> : <Navbar />}
      <IndexMainArticles
        pageTitle="Top Stories"
        articles={articles.items}
        spinnerRef={ref}
        hasMore={articles.hasMore}
      />
    </PageWrapper>
  );
}

export async function getServerSideProps() {
  const data = await client.request<{ articles: Articles }>(
    gql`
      query Query($orderBy: [ArticleOrderByInput!]!, $take: Int) {
        articles(orderBy: $orderBy, take: $take) {
          id
          slug
          image_data
          title
          translated_date
          created_at
          content {
            document
          }
          category {
            name
            slug
          }
        }
      }
    `,
    {
      orderBy: [
        {
          created_at: 'desc',
        },
      ],
      take: 10,
    }
  );

  return { props: { data } };
}

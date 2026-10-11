import React, { useCallback, useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import MobileNav from '../../src/components/MobileNav';
import useMediaQuery from '../../src/hooks/useMediaQuery';
import Navbar from '../../src/components/Navbar';
import IndexMainArticles from '../../src/components/IndexMainArticles';
import { upperCase } from 'lodash';
import useOnScreen from '../../src/hooks/useOnScreen';
import { client } from '../../src/utils/graphqlRequest';
import { gql } from 'graphql-request';
import { Articles } from '../../src/types/data';
import useInfiniteList from '../../src/hooks/useInfiniteList';

const fadeIn = keyframes`
  0% {opacity: 0}
  100% {opacity: 1}
`;

const fadeOut = keyframes`
  0% {opacity: 1}
  100% {opacity: 0}
`;
const PageWrapper = styled.div<{ $leavingScreen: boolean }>`
  font-family: Teko;
  animation-name: ${({ $leavingScreen }) => ($leavingScreen ? fadeOut : fadeIn)};
  animation-duration: 2.5s;
`;

const CategoryPage = ({
  data,
  slug,
}: {
  data: {
    articles: Articles;
  };
  slug: string;
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref);
  const [pageData, setPageData] = useState(data);
  const [currentSlug, setSlug] = useState(slug);
  const [leavingScreen, setLeavingScreen] = useState(false);

  useEffect(() => {
    if (slug === currentSlug && pageData === data) return;
    setLeavingScreen(true);
    const timeout = setTimeout(() => {
      setPageData(data);
      setSlug(slug);
      setLeavingScreen(false);
    }, 2500);
    return () => clearTimeout(timeout);
  }, [data, slug, currentSlug, pageData]);

  const loadMore = useCallback(async (skip: number, signal: AbortSignal) => {
    const result = await client.request<{ articles: Articles }>({
      document: gql`
        query MoreCategoryArticles($skip: Int!, $equals: String!) {
          articles(
            skip: $skip
            take: 10
            where: { category: { name: { equals: $equals } } }
            orderBy: { created_at: desc }
          ) {
            created_at
            id
            image_data
            slug
            title
            category { name slug }
          }
        }
      `,
      variables: { skip, equals: currentSlug },
      signal,
    });
    return result.articles;
  }, [currentSlug]);
  const articles = useInfiniteList(pageData.articles, isVisible && !leavingScreen, 10, loadMore);
  return (
    <PageWrapper key={slug} $leavingScreen={leavingScreen}>
      {isMobile ? <MobileNav /> : <Navbar />}
      <IndexMainArticles
        pageTitle={upperCase(currentSlug.replace('-', ' '))}
        articles={articles.items}
        spinnerRef={ref}
        hasMore={articles.hasMore}
        categories
      />
    </PageWrapper>
  );
};

export async function getServerSideProps(context) {
  const data = await client.request(
    gql`
      query MyQuery($equals: String, $take: Int) {
        articles(
          where: { category: { name: { equals: $equals } } }
          take: $take
          orderBy: { created_at: desc }
        ) {
          category {
            name
          }
          id
          title
          slug
          image_data
        }
      }
    `,
    {
      equals: context.query.slug,
      take: 10,
    }
  );

  return {
    props: {
      data,
      slug: context.query.slug,
    },
  };
}

export default CategoryPage;

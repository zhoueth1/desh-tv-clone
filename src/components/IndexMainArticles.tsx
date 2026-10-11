import React, { useEffect, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import useMediaQuery from '../hooks/useMediaQuery';
import IndexMainArticle from './IndexMainArticle';

const IndexMainArticlesWrapper = styled.div`
  margin: 4vh auto 0 auto;
  display: flex;
  flex-direction: row;
  justify-content: center;
  height: auto;
`;

const MainArticlesWrapper = styled.div`
  flex-direction: column;
  width: 1000px;
  @media (max-width: 576px) {
    align-items: center;
    margin: 25px 3vw;
    width: 94vw;
    height: 100%;
  }

  @media (max-width: 1200px) {
    margin: 0px 7.5vw;
    width: 85vw;
  }
`;

const TopStories = styled.h2`
  font-size: 72px;
  font-family: Teko;
  margin: 0;
`;

const RecommendationWrapper = styled.div`
  flex-direction: column;
  display: flex;
  margin: 0 0 0 30px;
  align-self: start;
  position: sticky;
  top: 0;
  width: 170px;
  overflow-y: auto;
  height: 100%;
`;

const RecommendedText = styled.h3`
  font-size: 40px;
  margin: 20px 0 0 0;
`;

const Spinner = styled.span`
  width: 48px;
  height: 48px;
  display: inline-block;
  position: relative;

  &::after,
  &::before {
    content: '';
    box-sizing: border-box;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgb(0, 140, 117);
    position: absolute;
    left: 0;
    top: 0;
    animation: animloader 2s linear infinite;
  }
  &::after {
    animation-delay: 1s;
  }

  @keyframes animloader {
    0% {
      transform: scale(0);
      opacity: 1;
    }
    100% {
      transform: scale(1);
      opacity: 0;
    }
  }
`;

const SpinnerWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: start;
  transform: translateY(-24px);
`;

const IndexMainArticles = ({
  pageTitle,
  articles,
  spinnerRef,
  categories = false,
  infiniteScrollTrigger = null,
  targetArticleIndex = null,
  hasMore = true,
  ...rest
}) => {
  const isMobile = useMediaQuery('(max-width: 1200px)');

  return (
    <IndexMainArticlesWrapper>
      <MainArticlesWrapper>
        <TopStories>{pageTitle}</TopStories>
        {articles &&
          (categories
            ? articles.map((article, index) => (
                <IndexMainArticle
                  title={article.title}
                  slug={article.slug}
                  imageData={article.image_data}
                  orientation={index % 2 == 0 ? 'left' : 'right'}
                  category={article.category?.name}
                  id={`article-${article.id}`}
                  infiniteScrollTrigger={
                    index == targetArticleIndex ? infiniteScrollTrigger : null
                  }
                  key={article.id || article.slug}
                />
              ))
            : articles.map((article, index) => {
                return (
                  <IndexMainArticle
                    title={article.title}
                    slug={article.slug}
                    imageData={article.image_data}
                    orientation={'left'}
                    category={
                      article.category
                        ? article.category.name
                        : 'no category lulz'
                    }
                    id={`article-${article.id}`}
                    infiniteScrollTrigger={
                      index == targetArticleIndex ? infiniteScrollTrigger : null
                    }
                    key={article.id || article.slug}
                  />
                );
              }))}
        <SpinnerWrapper ref={spinnerRef}>
          {hasMore && <Spinner />}
        </SpinnerWrapper>
      </MainArticlesWrapper>
      {/* {!categories && !isMobile && (
        <RecommendationWrapper>
          <RecommendedText>See also:</RecommendedText>
          <RecommendedArticles
            articleTitles={titles.slice(21, 25)}
            articleLinks={urls.slice(21, 25)}
            articleThumbnails={rest.imageData.slice(21, 25)}
          />
        </RecommendationWrapper>
      )} */}
    </IndexMainArticlesWrapper>
  );
};

export default IndexMainArticles;

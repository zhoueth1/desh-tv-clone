import Link from 'next/link';
import React from 'react';
import styled from 'styled-components';
import getArticleSlug from '../utils/getArticleSlug';
import _ from 'lodash';

const RecommendedArticle = styled.div`
  display: flex;
  margin: 20px 0;
  flex-direction: column;
  text-align: center;
  font-size: 24px;
  transition: 0.3s ease-out;
  &:hover {
    color: rgb(0, 140, 117);
    cursor: pointer;
    background-color: rgba(0, 140, 117, 0.1);
  }
`;

const RecommendedArticleImage = styled.img`
  width: 100%;
`;
const FilterDiv = styled.div`
  background: rgba(0, 0, 0, 0.05);
  width: 100%;
  z-index: 1;
  transition: 0.3s ease-out;
`;

const ImageFilter = styled.div`
  position: relative;
  width: 100%;
  height: 100px;
`;
const RecommendedArticleImageWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
`;

const RecommendedArticleTitle = styled.p`
  margin: 20px 0 0 0;
`;

const RecommendedArticles = ({ data }) => {
  return (
    <React.Fragment>
      {data.map((article, i) => {
        return (
          <Link style={{ display: 'contents', color: 'inherit', textDecoration: 'none' }} href={`${article.slug}`} key={article.slug}>
            <RecommendedArticle>
              <ImageFilter>
                <RecommendedArticleImageWrapper>
                  <RecommendedArticleImage src={article.image_data} />
                </RecommendedArticleImageWrapper>
                <FilterDiv />
              </ImageFilter>
              <RecommendedArticleTitle>
                {_.unescape(article.title)}
              </RecommendedArticleTitle>
            </RecommendedArticle>
          </Link>
        );
      })}
    </React.Fragment>
  );
};

export default RecommendedArticles;

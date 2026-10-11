import React from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import { capitalize, upperCase } from 'lodash';
import _ from 'lodash';

const ArticleTitleWrapper = styled.h3<{ $orientation: string }>`
  font-family: Teko;
  text-align: ${(prop) => (prop.$orientation == 'left' ? 'left' : 'right')};
  margin: 0 30px;
  display: flex;
  flex-direction: column;
  &::before {
    ${(prop) => (prop.$orientation == 'left' ? '' : 'align-self: end;')}
    content: '';
    background-color: black;
    height: 8px;
    width: 80px;
    display: block;
    margin: 8px 0;
    transition: 0.3s ease-out;
  }
  max-width: 50%;
  @media (max-width: 576px) {
    text-align: center;
    max-width: 75%;
    &::before {
      align-self: center;
    }
  } ;
`;

const ArticleWrapper = styled.div<{ $orientation: string }>`
  display: flex;
  ${(prop) =>
    `flex-direction: ${prop.$orientation == 'left' ? 'row;' : 'row-reverse;'}`}
  transition: 0.3s ease-out;
  cursor: pointer;
  &:hover {
    color: rgb(0, 140, 117);
    ${ArticleTitleWrapper} {
      &::before {
        background-color: rgb(0, 140, 117);
      }
    }
    background-color: rgba(0, 140, 117, 0.1);
  }
  margin: 40px 0;
  width: 100%;
  height: 250px;
  @media (max-width: 576px) {
    flex-direction: column;
    width: 100%;
    align-items: center;
    height: 100%;
  } ;
`;

const ArticleImage = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
  height: 100%;
`;

const ImageFilter = styled.div`
  position: relative;
  width: 42%;
  @media (max-width: 576px) {
    width: 80%;
  } ;
`;

const FilterDiv = styled.div`
  background: rgba(0, 0, 0, 0.05);
  padding-top: 250px;
  width: 100%;
  z-index: 1;
  transition: 0.3s ease-out;
`;

const ArticleCategory = styled.span``;

const ArticleTitle = styled.span`
  font-size: 30px;
`;

const StyledImage = styled.img`
  width: 100%;
  height: 100%;
  border-radius: 10px;
`;

const IndexMainArticle = ({
  title,
  slug,
  imageData,
  orientation,
  category,
  id,
  infiniteScrollTrigger,
}) => {
  return (
    <Link style={{ display: 'contents', color: 'inherit', textDecoration: 'none' }} href={`${decodeURI(slug)}`}>
      <ArticleWrapper
        $orientation={orientation}
        id={id}
        ref={infiniteScrollTrigger}
      >
        {imageData && (
          <ImageFilter>
            <ArticleImage>
              <StyledImage src={imageData} />
            </ArticleImage>
            <FilterDiv />
          </ImageFilter>
        )}
        <ArticleTitleWrapper $orientation={orientation}>
          {category && (
            <ArticleCategory>
              {capitalize(category.replace('-', ' '))}
            </ArticleCategory>
          )}
          <ArticleTitle>{_.unescape(title)}</ArticleTitle>
        </ArticleTitleWrapper>
      </ArticleWrapper>
    </Link>
  );
};

export default IndexMainArticle;

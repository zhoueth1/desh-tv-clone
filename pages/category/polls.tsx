import React, { useCallback, useEffect, useRef, useState } from 'react';
import { client } from '../../src/utils/graphqlRequest';
import { gql } from 'graphql-request';
import { Polls } from '../../src/types/data';
import MobileNav from '../../src/components/MobileNav';
import Navbar from '../../src/components/Navbar';
import styled, { keyframes } from 'styled-components';
import useMediaQuery from '../../src/hooks/useMediaQuery';
import PollBlock from '../../src/components/PollBlock';
import useOnScreen from '../../src/hooks/useOnScreen';
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
  animation-duration: 0.5s;
  width: 100%;
`;

const TopStories = styled.h2`
  font-size: 72px;
  font-family: Teko;
  margin: 0 5%;
`;

const ContentWrapper = styled.div`
  margin: 4vh auto 0 auto;
  height: auto;
  display: flex;
  flex-direction: column;
  width: 80%;

  @media (max-width: 576px) {
    align-items: center;
    margin: 25px 3vw;
    width: 94vw;
    height: 100%;
  }

  @media (max-width: 1200px) {
    margin: 0px 2vw;
    width: 85vw;
  }
`;

const MainArticlesWrapper = styled.div`
  flex-direction: column;
  width: 90%;
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

const PollsAreaWrapper = styled.div`
  display: flex;
  justify-content: center;
  margin: 4vh auto 0 auto;
`;

const PollsWrapper = styled.div`
  display: grid;
  grid-template-columns: auto auto auto;
  @media (max-width: 1200px) {
    grid-template-columns: auto auto;
  }

  @media (max-width: 576px) {
    grid-template-columns: auto;
  }

  width: 100%;
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

const poll = ({ data }: { data: { polls: Polls } }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useOnScreen(ref);
  const [pageData, setPageData] = useState(data);
  const [leavingScreen, setLeavingScreen] = useState(false);

  useEffect(() => {
    if (pageData === data) return;
    setLeavingScreen(true);
    const timeout = setTimeout(() => {
      setPageData(data);
      setLeavingScreen(false);
    }, 500);
    return () => clearTimeout(timeout);
  }, [data, pageData]);

  const loadMore = useCallback(async (skip: number, signal: AbortSignal) => {
    const result = await client.request<{ polls: Polls }>({
      document: gql`
        query MorePolls($skip: Int!) {
          polls(take: 9, orderBy: { translated_date: desc }, skip: $skip) {
            image_data
            desh_no_comment_count
            desh_no_count
            desh_yes_count
            yes_count
            no_count
            no_comment_count
            slug
            title
            translated_date
          }
        }
      `,
      variables: { skip },
      signal,
    });
    return result.polls;
  }, []);
  const polls = useInfiniteList(pageData.polls, isVisible && !leavingScreen, 9, loadMore);
  return (
    <PageWrapper key="polls" $leavingScreen={leavingScreen}>
      {isMobile ? <MobileNav /> : <Navbar />}
      <ContentWrapper>
        <MainArticlesWrapper>
          <TopStories>POLLS</TopStories>
          <PollsAreaWrapper>
            <PollsWrapper>
              {polls &&
                polls.items.map((poll) => (
                  <PollBlock
                    key={poll.slug}
                    slug={poll.slug}
                    date={poll.translated_date}
                    title={poll.title}
                    imageData={poll.image_data}
                    yesCount={poll.yes_count}
                    noCount={poll.no_count}
                    noCommentCount={poll.no_comment_count}
                    deshYesCount={poll.desh_yes_count}
                    deshNoCount={poll.desh_no_count}
                    deshNoCommentCount={poll.desh_no_comment_count}
                  />
                ))}
            </PollsWrapper>
          </PollsAreaWrapper>
        </MainArticlesWrapper>
      </ContentWrapper>
      <SpinnerWrapper ref={ref}>
        {polls.hasMore && <Spinner />}
      </SpinnerWrapper>
    </PageWrapper>
  );
};

export async function getServerSideProps(context) {
  const data = await client.request(
    gql`
      query MyQuery {
        polls(take: 9, orderBy: { translated_date: desc }) {
          image_data
          desh_no_comment_count
          desh_no_count
          desh_yes_count
          yes_count
          no_count
          no_comment_count
          slug
          title
          translated_date
        }
      }
    `
  );

  return {
    props: {
      data,
    },
  };
}

export default poll;

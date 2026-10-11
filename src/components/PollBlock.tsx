import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { client } from '../utils/graphqlRequest';
import { gql } from 'graphql-request';
import { PollData } from '../types/data';
import PollDataBar from './PollDataBar';

const PollBlockWrapper = styled.div`
  width: 80%;
  padding: 20px;
  margin: 5%;
  display: flex;
  flex-direction: column;
  background-color: #d6d8d7;
  border-radius: 12px;
  justify-content: space-between;
`;

const ImageWrapper = styled.img`
  max-width: 100%;
`;

const Title = styled.h2`
  font-size: 20px;
  text-align: justify;
`;

const SelectionDiv = styled.div<{
  $isSelected: boolean;
}>`
  width: 90%;
  height: 30px;
  margin: 10px 0;
  cursor: pointer;
  outline: none;
  border-radius: 10px;
  border: 5px solid #008c75;
  transition: 0.5s ease-out;
  padding: 3px 5%;
  font-size: 20px;
  &:hover {
    background: #008c75;
    color: #fff;
  }
  background: ${(props) => (props.$isSelected ? '#008c75' : '#d6d8d7')};
`;

const SubmissionWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const SubmitButton = styled.button`
  font-family: Teko;
  font-size: 20px;
  width: 30%;
  cursor: pointer;
  outline: none;
  border-radius: 10px;
  border: 5px solid #008c75;
  transition: 0.5s ease-out;
  &:hover {
    background: #008c75;
    color: #fff;
  }
`;

const MediaWrapper = styled.div`
  display: flex;
  flex-direction: column;
`;

const PollDataDiv = styled.div`
  width: 90%;
  height: 30px;
  margin: 10px 0;
  cursor: pointer;
  outline: none;
  border-radius: 10px;
  border: 5px solid #008c75;
  transition: 0.5s ease-out;
  padding: 3px 5%;
  font-size: 20px;
`;

const TotalVotesDisplay = styled.div`
  height: 41px;
  font-size: 100%;
`;

const PollBlock = ({
  slug,
  date,
  title,
  imageData,
  yesCount,
  noCount,
  noCommentCount,
  deshYesCount,
  deshNoCount,
  deshNoCommentCount,
}) => {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitting = useRef(false);
  const [pollData, setPollData] = useState({
    yesCount: (yesCount ?? 0) + (deshYesCount ?? 0),
    noCount: (noCount ?? 0) + (deshNoCount ?? 0),
    noCommentCount: (noCommentCount ?? 0) + (deshNoCommentCount ?? 0),
    totalVotes: (yesCount ?? 0) + (noCount ?? 0) + (noCommentCount ?? 0) +
      (deshYesCount ?? 0) + (deshNoCount ?? 0) + (deshNoCommentCount ?? 0),
  });
  const [selection, setSelection] = useState<'yes' | 'no' | 'no-comment' | null>(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting.current || submitted) return;
    if (!selection) {
      alert('Please select a poll option.');
      return;
    }
    submitting.current = true;
    setIsSubmitting(true);
    try {
      const { votePoll } = await client.request<{ votePoll: PollData }>(
        gql`
          mutation VotePoll($slug: String!, $option: String!) {
            votePoll(slug: $slug, option: $option) {
              yes_count
              no_count
              no_comment_count
              desh_yes_count
              desh_no_comment_count
              desh_no_count
            }
          }
        `,
        { slug, option: selection }
      );
      if (!votePoll) throw new Error('The poll no longer exists.');
      const yes = (votePoll.yes_count ?? 0) + (votePoll.desh_yes_count ?? 0);
      const no = (votePoll.no_count ?? 0) + (votePoll.desh_no_count ?? 0);
      const noComment = (votePoll.no_comment_count ?? 0) + (votePoll.desh_no_comment_count ?? 0);
      setPollData({ yesCount: yes, noCount: no, noCommentCount: noComment, totalVotes: yes + no + noComment });
      setSubmitted(true);
    } catch (error) {
      console.error('Unable to submit vote', error);
      alert('Unable to submit your vote. Please try again.');
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };
  return (
    <PollBlockWrapper>
      <MediaWrapper>
        <ImageWrapper src={imageData} />
        <Title>{title}</Title>
      </MediaWrapper>
      <SubmissionWrapper>
        {submitted ? (
          <>
            <PollDataBar
              voteName="yes"
              completed={(pollData.yesCount * 100) / (pollData.totalVotes || 1)}
            />
            <PollDataBar
              voteName="no"
              completed={(pollData.noCount * 100) / (pollData.totalVotes || 1)}
            />
            <PollDataBar
              voteName="noComment"
              completed={(pollData.noCommentCount * 100) / (pollData.totalVotes || 1)}
            />

            <TotalVotesDisplay>
              <span>Total Votes: {pollData.totalVotes}</span>
            </TotalVotesDisplay>
          </>
        ) : (
          <>
            <SelectionDiv
              className="yes"
              $isSelected={selection === 'yes'}
              onClick={() => setSelection('yes')}
            >
              YES
            </SelectionDiv>
            <SelectionDiv
              className="no"
              $isSelected={selection === 'no'}
              onClick={() => setSelection('no')}
            >
              NO
            </SelectionDiv>
            <SelectionDiv
              className="noc"
              $isSelected={selection === 'no-comment'}
              onClick={() => setSelection('no-comment')}
            >
              NO COMMENT
            </SelectionDiv>

            <SubmitButton type="button" disabled={isSubmitting} onClick={handleSubmit}>SUBMIT</SubmitButton>
          </>
        )}
      </SubmissionWrapper>
    </PollBlockWrapper>
  );
};

export default PollBlock;

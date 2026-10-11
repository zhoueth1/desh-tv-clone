import _, { capitalize, upperCase } from 'lodash';
import React from 'react';
import styled from 'styled-components';

const StyledContainer = styled.div`
  background-color: #e0e0de;
  transition: 0.3s ease-out;
  width: 100%;
  height: 36px;
  margin: 10px 0;
  cursor: pointer;
  outline: none;
  border-radius: 10px;
  border: 5px solid #008c75;
  transition: 0.5s ease-out;
  font-size: 20px;
`;

const StyledFiller = styled.div<{
  $completed: string;
}>`
  height: 100%;
  width: ${(props) => props.$completed}%;
  background-color: #008c75;
  display: flex;
  align-items: center;
  justify-content: right;
`;

const StyledLabel = styled.div<{ $align: string }>`
  position: absolute;
  color: black;
  align-self: center;
  ${({ $align }) => ($align === 'right' ? 'right: 5%' : 'left : 5%')};
  z-index: 1;
`;

const InlineWrapper = styled.div`
  position: relative;
  width: 100%;
  display: flex;
  height: 100%;
`;

const PollDataBar = ({ completed, voteName }) => {
  return (
    <StyledContainer>
      <InlineWrapper>
        <StyledLabel $align="left">{upperCase(voteName)}</StyledLabel>
        <StyledFiller $completed={_.toString(completed)}></StyledFiller>
        <StyledLabel $align="right">{`${Math.round(completed)}%`}</StyledLabel>
      </InlineWrapper>
    </StyledContainer>
  );
};

export default PollDataBar;

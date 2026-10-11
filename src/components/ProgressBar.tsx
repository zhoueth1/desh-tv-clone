import _ from 'lodash';
import React from 'react';
import styled from 'styled-components';

const StyledContainer = styled.div<{ $showBar: boolean }>`
  height: 20px;
  width: ${(props) => (props.$showBar ? '100%' : '0%')};
  opacity: ${(props) => (props.$showBar ? '1' : '0')};
  background-color: #e0e0de;
  border-radius: 50px;
  margin: 25px;
  transition: 0.3s ease-out;
`;

const StyledFiller = styled.div<{
  $completed: string;
  $bgcolor: string;
  $showBar: boolean;
}>`
  height: 100%;
  width: ${(props) => props.$completed}%;
  background-color: ${(props) => props.$bgcolor};
  border-radius: inherit;
  text-align: right;
`;

const StyledLabel = styled.span<{ $showBar: boolean }>`
  padding: 5px;
  color: white;
  font-weight: bold;
`;

const ProgressBar = ({ bgcolor, completed, showBar }) => {
  return (
    <StyledContainer $showBar={showBar}>
      <StyledFiller
        $completed={_.toString(completed)}
        $bgcolor={bgcolor}
        $showBar={showBar}
      >
        <StyledLabel $showBar={showBar}>{`${Math.round(
          completed
        )}%`}</StyledLabel>
      </StyledFiller>
    </StyledContainer>
  );
};

export default ProgressBar;

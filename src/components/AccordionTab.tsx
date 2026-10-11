import React, { useId, useState } from 'react';
import styled from 'styled-components';

const Tab = styled.div`
  width: 100%;
  color: white;
  overflow: hidden;
`;

const TabLabel = styled.label<{
  $isChecked: boolean;
}>`
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  padding: 1em;
  font-weight: bold;
  cursor: pointer;
  background: ${({ $isChecked }) => ($isChecked ? '#008c75' : ' #008c75')};
  &:hover {
    background: #008c75;
  }
  &::after {
    color: #fcb43c;
    content: '\\276F';
    width: 1em;
    height: 1em;
    text-align: center;
    transition: all 0.35s;
    ${({ $isChecked }) => ($isChecked ? 'transform: rotate(90deg)' : '')};
  }
`;

const TabContent = styled.div<{
  $isChecked: boolean;
}>`
  padding: ${({ $isChecked }) => ($isChecked ? '1em' : '0 1em')};
  color: black;
  background: #d6d8d7;
  transition: all 0.35s;
  max-height: ${({ $isChecked }) => ($isChecked ? '100vh' : '0')};
`;

const CheckBox = styled.input`
  position: absolute;
  opacity: 0;
  z-index: -1;
`;

const AccordionTab = ({ labelName, children }) => {
  const [isChecked, setIsChecked] = useState(false);
  const htmlId = useId();

  return (
    <Tab>
      <CheckBox
        type="checkbox"
        id={htmlId}
        checked={isChecked}
        onChange={() => setIsChecked((previous) => !previous)}
      />
      <TabLabel htmlFor={htmlId} $isChecked={isChecked}>
        {labelName}
      </TabLabel>
      <TabContent $isChecked={isChecked}>{children}</TabContent>
    </Tab>
  );
};

export default AccordionTab;

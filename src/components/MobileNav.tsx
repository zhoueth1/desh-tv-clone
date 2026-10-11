import React, { useState } from 'react';
import styled from 'styled-components';
import { GiHamburgerMenu } from 'react-icons/gi';
import MobilePopoutMenu from './MobilePopoutMenu';

const NavWrapper = styled.div`
  background-color: #dcdcdc;
  width: 100%;
  justify-content: end;
  display: flex;
  align-items: center;
`;

const BurgerButton = styled.button`
  border: none;
  font-size: 32px;
  border-radius: 10px;
  background-color: #dcdcdc;
  transition: 0.3s ease-out;
  height: 32px;
  cursor: pointer;
  padding: 0;
  margin: 0 16px 0 0;
  &:hover {
    color: rgb(0, 140, 117);
  }
`;

const BurgerWrapper = styled.div`
  height: 60px;
  display: flex;
  justify-content: end;
  align-items: center;
`;

const MobileNav = () => {
  const [openPopout, changeOpenPopout] = useState(false);

  return (
    <NavWrapper>
      <BurgerWrapper>
        <BurgerButton
          onClick={() => {
            changeOpenPopout((prev) => !prev);
          }}
        >
          <GiHamburgerMenu />
        </BurgerButton>
      </BurgerWrapper>
      <MobilePopoutMenu
        openPopout={openPopout}
        changeOpenPopout={changeOpenPopout}
      />
    </NavWrapper>
  );
};

export default MobileNav;

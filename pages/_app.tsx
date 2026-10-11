import { SessionProvider } from 'next-auth/react';
import { useEffect, useState } from 'react';
import styled, { keyframes, StyleSheetManager } from 'styled-components';
import type { AppProps } from 'next/app';

const fadeIn = keyframes`
  0% {opacity: 0}
  100% {opacity: 1}
`;

const fadeOut = keyframes`
  0% {opacity: 1}
  100% {opacity: 0}
`;

const StyledWrapper = styled.div<{ $leavingScreen: boolean }>`
  animation-name: ${({ $leavingScreen }) => ($leavingScreen ? fadeOut : fadeIn)};
  animation-duration: 0.5s;
`;

export default function App({
  Component,
  pageProps: { session, ...pageProps },
}: AppProps) {
  const [leavingScreen, setLeavingScreen] = useState(false);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    if (counter == 0) {
      setLeavingScreen(true);
      const timeout = setTimeout(() => {
        setLeavingScreen(false);
        setCounter(1);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [pageProps]);

  return (
    <StyleSheetManager enableVendorPrefixes>
      <SessionProvider session={session}>
        <StyledWrapper $leavingScreen={leavingScreen}>
          <Component {...pageProps} />
        </StyledWrapper>
      </SessionProvider>
    </StyleSheetManager>
  );
}

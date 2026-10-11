import React, { useEffect } from 'react';
import styled from 'styled-components';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import DashboardNav from '../src/components/DashboardNav';
import transferCategories from '../src/utils/transferCategories';
import transferRecommendedArticles from '../src/utils/transferRecommendedArticles';
import FetchForm from '../src/components/FetchForm';
import useTestApi from '../src/hooks/useTestApi';

const DashbaordPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const dashboard = () => {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/coolkidsonly');
    }
  }, [router, status]);

  const handleOperation = async (event, operation) => {
    event.preventDefault();
    try {
      await operation();
    } catch (error) {
      alert(error.response?.data?.error || 'Unable to complete this request.');
    }
  };

  if (status === 'authenticated' && session?.user) {
    return (
      <DashbaordPageWrapper>
        <DashboardNav annotations={`Hello, ${session.user.email || session.user.name}`} />
        <FetchForm creationObject="polls" />
        <FetchForm creationObject="articles" />
        <button onClick={(event) => handleOperation(event, transferCategories)}>transfer categories</button>
        <button onClick={(event) => handleOperation(event, transferRecommendedArticles)}>
          transfer recommended articles
        </button>
        <button onClick={(event) => handleOperation(event, useTestApi)}>Test api</button>
      </DashbaordPageWrapper>
    );
  }

  return null;
};

export default dashboard;

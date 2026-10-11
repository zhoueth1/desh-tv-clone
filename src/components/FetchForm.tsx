import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import CreateArticlesSummary from './CreateArticlesSummary';
import useCreateArticles from '../hooks/useCreateArticles';

import ProgressBar from './ProgressBar';
import useCreatePolls from '../hooks/useCreatePolls';

const FetchAllArticlesForm = styled.form`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 30%;
  height: 100%;
  background: #b5dec8;
  border-radius: 20px;
  margin: 120px;
  padding: 20px;
`;

const StyledInputFields = styled.input`
  width: 80%;
  padding: 12px 20px;
  box-sizing: border-box;
  font-family: Teko;
  font-size: 28px;
  border-radius: 10px;
  border: 3px solid #b5dec8;
  transition: 0.5s ease-out;
  outline: none;
  &:focus {
    border: 3px solid #008c75;
  }
`;

const StyledButton = styled.button`
  font-family: Teko;
  font-size: 28px;
  width: 30%;
  cursor: pointer;
  outline: none;
  border-radius: 10px;
  border: 3px solid #b5dec8;
  transition: 0.5s ease-out;
  &:hover {
    background: #008c75;
    color: #fff;
  }
`;

const StyledStopButton = styled.button`
  font-family: Teko;
  font-size: 24px;
  margin: 10px 0;
  padding: 0;
  height: 50px;
  width: 50px;
  border-radius: 25px;
  background-color: rgb(255, 0, 0);
  cursor: pointer;
  border: 2px solid #fff;
  color: #fff;
  outline: none;
  transition: 0.2s linear;
  &:hover {
    background-color: rgb(139, 0, 0);
  }
`;

const Text = styled.div`
  font-family: Teko;
  font-size: 48px;
`;

const FetchForm = ({ creationObject }) => {
  const [pagesFetched, setPagesFetched] = useState(0);
  const [startingNumber, setStartingNumber] = useState(0);
  const [endingNumber, setEndingNumber] = useState(0);
  const [showBar, setShowBar] = useState(false);
  const initialStatuses = () => ({
    completed: 0,
    attempts: 0,
    fetchingErrors: 0,
    creationErrors: 0,
    errors: {},
  });
  const [statuses, setStatuses] = useState(initialStatuses);
  const [startFetching, setStartFetching] = useState(false);
  const [controller, setController] = useState<AbortController | null>(null);

  useCreateArticles(
    'https://www.desh.tv/templates/desh-web/all_news_page/more_news_ajax.php',
    startingNumber, endingNumber, setPagesFetched, controller?.signal,
    setStatuses, pagesFetched, startFetching && creationObject === 'articles'
  );
  useCreatePolls(
    'https://www.desh.tv/templates/desh-web/opinion_poll/parent_content_list_ajax_new.php',
    startingNumber, endingNumber, setPagesFetched, controller?.signal,
    setStatuses, pagesFetched, startFetching && creationObject === 'polls'
  );

  useEffect(() => {
    if (startFetching && pagesFetched >= endingNumber - startingNumber + 1) {
      setStartFetching(false);
    }
  }, [startFetching, pagesFetched, endingNumber, startingNumber]);

  useEffect(() => () => controller?.abort(), [controller]);

  const handleFetchAllArticles = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const start = Number(formData.get('starting-number'));
    const end = formData.get('ending-number') ? Number(formData.get('ending-number')) : 500000;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start) {
      alert('Please enter a valid starting and ending page number.');
      return;
    }
    if (!confirm(`Are you sure you want to create all ${creationObject}`)) return;
    controller?.abort();
    setController(new AbortController());
    setPagesFetched(0);
    setStatuses(initialStatuses());
    setStartingNumber(start);
    setEndingNumber(end);
    setStartFetching(true);
    setShowBar(true);
  };

  const handleStopFetchAllArticles = (event) => {
    event.preventDefault();
    controller?.abort();
    setStartFetching(false);
    setShowBar(false);
    alert('ALL API CALLS HAVE BEEN ABORTED');
  };
  return (
    <FetchAllArticlesForm onSubmit={handleFetchAllArticles}>
      <Text>Fetch All {creationObject}:</Text>
      <StyledStopButton type="button" onClick={handleStopFetchAllArticles}>
        STOP
      </StyledStopButton>
      <br />
      <StyledInputFields
        type="number"
        name="starting-number"
        placeholder="Starting Page Number"
        required
      />
      <br />
      <StyledInputFields
        type="number"
        name="ending-number"
        placeholder="Ending Page Number"
      />
      <br />
      <StyledButton type="submit">Fetch</StyledButton>
      <ProgressBar
        bgcolor="#008c75"
        completed={(pagesFetched * 100) / (endingNumber - startingNumber + 1)}
        showBar={showBar}
      />
      <CreateArticlesSummary statuses={statuses} />
    </FetchAllArticlesForm>
  );
};

export default FetchForm;

import React, { useState } from 'react';
import styled from 'styled-components';
import AccordionTab from './AccordionTab';

const SummaryWrapper = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
`;

const TabsWrapper = styled.div`
  flex: 1;
  background: #008c75;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 4px -2px rgba(0, 0, 0, 0.5);
`;

const CreateArticlesSummary = ({ statuses }) => {
  const insertLinksIntoErrors = (endResult, currentLink, errorNames) => {
    return (errorNames || []).reduce(
      (acc, errorName) => {
        if (Object.keys(acc).includes(errorName)) {
          return {
            ...acc,
            [errorName]: [...acc[errorName], currentLink],
          };
        } else {
          return {
            ...acc,
            [errorName]: [currentLink],
          };
        }
      },
      {
        ...endResult,
      }
    );
  };

  const fetchingErrors = Object.keys(statuses.errors).reduce(
    (endResult, currentLink) => {
      const errorNames = statuses.errors[currentLink].fetching;
      return insertLinksIntoErrors(endResult, currentLink, errorNames);
    },
    {}
  );

  const creationErrors = Object.keys(statuses.errors).reduce(
    (endResult, currentLink) => {
      const errorNames = statuses.errors[currentLink].creation;
      return insertLinksIntoErrors(endResult, currentLink, errorNames);
    },
    {}
  );

  console.log('Fetching Errors: ', fetchingErrors);
  console.log('Creation Errors: ', creationErrors);
  // console.log('statuses', statuses);

  // errorMap = {
  //   fetchingErrors: {
  //     error1: [...]
  //   },
  //   creationErrors: {
  //     error2: [...]
  //   }
  // }

  return (
    <>
      {statuses.attempts > 0 && (
        <SummaryWrapper>
          <TabsWrapper>
            <AccordionTab labelName="Summary">
              <div>
                <b>Total Created Articles: {statuses.completed}</b>
              </div>
              <div>Total Attempted Articles {statuses.attempts}</div>
              {(statuses.creationErrors > 0 || statuses.fetchingErrors > 0) && (
                <AccordionTab labelName="Errors">
                  <div>
                    <b>Total Errors {Object.keys(statuses.errors).length} </b>
                  </div>
                  <div>Total Fetching Errors {statuses.fetchingErrors}</div>
                  {statuses.fetchingErrors > 0 && (
                    <AccordionTab labelName="Fetching Errors">
                      {Object.keys(fetchingErrors).map((errorName) => (
                        <AccordionTab labelName={`${errorName}:`} key={errorName}>
                          {fetchingErrors[errorName].map((link, i) => (
                            <span key={link}>
                              <a href={link}> {i + 1} </a>
                            </span>
                          ))}
                        </AccordionTab>
                      ))}
                    </AccordionTab>
                  )}
                  <div>Total Creation Errors {statuses.creationErrors}</div>
                  {statuses.creationErrors > 0 && (
                    <AccordionTab labelName="Creation Errors">
                      {Object.keys(creationErrors).map((errorName) => (
                        <AccordionTab labelName={`${errorName}:`} key={errorName}>
                          {creationErrors[errorName].map((link, i) => (
                            <span key={link}>
                              <a href={link}> {i + 1} </a>
                            </span>
                          ))}
                        </AccordionTab>
                      ))}
                    </AccordionTab>
                  )}
                </AccordionTab>
              )}
            </AccordionTab>
          </TabsWrapper>
        </SummaryWrapper>
      )}
    </>
  );
};

export default CreateArticlesSummary;

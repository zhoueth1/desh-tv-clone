import React from 'react';
import styled from 'styled-components';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import DashboardNav from '../src/components/DashboardNav';

const LoginPageWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: 100%;
`;

const StyledForm = styled.form`
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

const Text = styled.div`
  margin: 0 0 40px 0;
  font-family: Teko;
  font-size: 48px;
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

const coolKidsOnly = () => {
  const router = useRouter();
  const { status } = useSession();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const username = formData.get('username');
    const password = formData.get('password');
    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    });
    if (!result || result.error) {
      alert(result?.error || 'Unable to sign in. Please try again.');
    } else {
      router.push('/dashboard');
    }
  };

  React.useEffect(() => {
    if (router && status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [router, status]);

  if (status !== 'authenticated') {
    return (
      <LoginPageWrapper>
        <DashboardNav annotations="Cool Kids Only" />
        <StyledForm onSubmit={handleSubmit}>
          <Text>Account Login:</Text>
          <StyledInputFields
            type="text"
            name="username"
            placeholder="Username"
          />
          <br />
          <StyledInputFields
            type="password"
            name="password"
            placeholder="Password"
          />
          <br />
          <StyledButton type="submit">Sign In</StyledButton>
        </StyledForm>
      </LoginPageWrapper>
    );
  }

  return <div>you are already loggged in</div>;
};

export default coolKidsOnly;

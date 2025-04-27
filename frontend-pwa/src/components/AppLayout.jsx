// src/components/AppLayout.jsx
import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import styled from 'styled-components';
import Sidebar from './Sidebar';

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
`;

const MainContent = styled.main`
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const AppLayout = () => {
  const { conversationId } = useParams();
  
  return (
    <LayoutContainer>
      <Sidebar activeConversationId={conversationId} />
      <MainContent>
        <Outlet />
      </MainContent>
    </LayoutContainer>
  );
};

export default AppLayout;
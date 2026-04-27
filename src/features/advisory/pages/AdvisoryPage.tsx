import React from 'react';
import { Chatbot } from '../components/Chatbot';

const AdvisoryPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">Advisory & Chatbot</h1>
      <Chatbot />
    </div>
  );
};

export default AdvisoryPage;

import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';

import { getUsers } from 'modules/common/services/UserService';

const Dashboard: React.FC = () => {
  const { accountId } = useParams();

  useEffect(() => {
    getUsers({ accountId });
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      <Link to="/pipeline-studio">Pipeline Studio</Link>
    </div>
  );
};

export default Dashboard;

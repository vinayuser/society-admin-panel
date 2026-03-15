import React from 'react';
import { useSelector } from 'react-redux';
import { ROLES } from '../../../constants';
import PaymentsList from './List';
import SocietyPayments from './SocietyPayments';

const PaymentsPage = () => {
  const user = useSelector((state) => state.auth.user);
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN;
  return isSuperAdmin ? <PaymentsList /> : <SocietyPayments />;
};

export default PaymentsPage;

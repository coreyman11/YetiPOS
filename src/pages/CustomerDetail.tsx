import { useParams, useNavigate } from "react-router-dom";
import { CustomerDetailContent } from "@/components/customers/CustomerDetailContent";

const CustomerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    navigate('/customers');
    return null;
  }

  return <CustomerDetailContent customerId={id} />;
};

export default CustomerDetail;
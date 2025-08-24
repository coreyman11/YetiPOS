
import { Navigate } from 'react-router-dom';
import Layout from "@/components/Layout";
import { createLazyComponent } from '@/utils/lazyLoadHelper';

// Lazily load pages with retry logic
const Dashboard = createLazyComponent(() => import('@/pages/Dashboard'), 'Dashboard');
const Inventory = createLazyComponent(() => import('@/pages/Inventory'), 'Inventory');
const Services = createLazyComponent(() => import('@/pages/Services'), 'Services');
const Customers = createLazyComponent(() => import('@/pages/Customers'), 'Customers');
const Register = createLazyComponent(() => import('@/pages/Register'), 'Register');
const Reports = createLazyComponent(() => import('@/pages/Reports'), 'Reports');
const Transactions = createLazyComponent(() => import('@/pages/Transactions'), 'Transactions');
const Login = createLazyComponent(() => import('@/pages/Login'), 'Login');
const GiftCards = createLazyComponent(() => import('@/pages/GiftCards'), 'GiftCards');
const Portal = createLazyComponent(() => import('@/pages/Portal'), 'Portal');
const StoreFront = createLazyComponent(() => import('@/pages/StoreFront'), 'StoreFront');
const Settings = createLazyComponent(() => import('@/pages/Settings'), 'Settings');
const NotFound = createLazyComponent(() => import('@/pages/NotFound'), 'NotFound');
const TaxConfiguration = createLazyComponent(() => import('@/pages/TaxConfiguration'), 'TaxConfiguration');
const LoyaltyProgram = createLazyComponent(() => import('@/pages/LoyaltyProgram'), 'LoyaltyProgram');
const HardwareConfiguration = createLazyComponent(() => import('@/pages/HardwareConfiguration'), 'HardwareConfiguration');
const UserManagement = createLazyComponent(() => import('@/pages/UserManagement'), 'UserManagement');
const ShiftManagement = createLazyComponent(() => import('@/pages/ShiftManagement'), 'ShiftManagement');
const LocationsConfiguration = createLazyComponent(() => import('@/pages/LocationsConfiguration'), 'LocationsConfiguration');
const DiscountsConfiguration = createLazyComponent(() => import('@/pages/configuration/DiscountsConfiguration'), 'DiscountsConfiguration');
const ReceiptsConfiguration = createLazyComponent(() => import('@/pages/ReceiptsConfiguration'), 'ReceiptsConfiguration');
const LabelGenerator = createLazyComponent(() => import('@/pages/LabelGenerator'), 'LabelGenerator');
const CustomerDetail = createLazyComponent(() => import('@/pages/CustomerDetail'), 'CustomerDetail');
const Memberships = createLazyComponent(() => import('@/pages/Memberships'), 'Memberships');
const Billing = createLazyComponent(() => import('@/pages/Billing'), 'Billing');
const StoreEditor = createLazyComponent(() => import('@/pages/StoreEditor'), 'StoreEditor');
const AccountSetup = createLazyComponent(() => import('@/pages/AccountSetup'), 'AccountSetup');

// Vendor Admin pages (restricted access)
const VendorLayout = createLazyComponent(() => import('@/components/vendor-admin/VendorLayout'), 'VendorLayout');
const VendorOverview = createLazyComponent(() => import('@/pages/vendor-admin/VendorOverview'), 'VendorOverview');
const CustomerManagement = createLazyComponent(() => import('@/pages/vendor-admin/CustomerManagement'), 'CustomerManagement');
const FeatureManagement = createLazyComponent(() => import('@/pages/vendor-admin/FeatureManagement'), 'FeatureManagement');
const AuditLogs = createLazyComponent(() => import('@/pages/vendor-admin/AuditLogs'), 'AuditLogs');
const VendorSettings = createLazyComponent(() => import('@/pages/vendor-admin/VendorSettings'), 'VendorSettings');

const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: '/', element: <Dashboard /> },
      { path: '/inventory', element: <Inventory /> },
      { path: '/services', element: <Services /> },
      { path: '/customers', element: <Customers /> },
      { path: '/customers/:id', element: <CustomerDetail /> },
      { path: '/memberships', element: <Memberships /> },
      { path: '/billing', element: <Billing /> },
      { path: '/register', element: <Register /> },
      { path: '/reports', element: <Reports /> },
      { path: '/transactions', element: <Transactions /> },
      { path: '/gift-cards', element: <GiftCards /> },
      { path: '/portal', element: <Portal /> },
      { path: '/portal/store/:id/edit', element: <StoreEditor /> },
      { path: '/settings', element: <Settings /> },
      
      // Configuration routes
      { path: '/configuration/loyalty-program', element: <LoyaltyProgram /> },
      { path: '/configuration/tax', element: <TaxConfiguration /> },
      { path: '/configuration/hardware', element: <HardwareConfiguration /> },
      { path: '/configuration/users', element: <UserManagement /> },
      { path: '/configuration/shifts', element: <ShiftManagement /> },
      { path: '/configuration/locations', element: <LocationsConfiguration /> },
      { path: '/configuration/discounts', element: <DiscountsConfiguration /> },
      { path: '/configuration/receipts', element: <ReceiptsConfiguration /> },
      { path: '/configuration/labels', element: <LabelGenerator /> },
      
      // Fallback
      { path: '*', element: <NotFound /> }
    ],
  },
  // Vendor Admin Routes (separate layout, restricted access)
  {
    path: '/vendor-admin',
    element: <VendorLayout />,
    children: [
      { path: '', element: <VendorOverview /> },
      { path: 'overview', element: <VendorOverview /> },
      { path: 'customers', element: <CustomerManagement /> },
      { path: 'features', element: <FeatureManagement /> },
      { path: 'audit', element: <AuditLogs /> },
      { path: 'settings', element: <VendorSettings /> },
    ],
  },
  // Move Login route out of AuthLayout to directly under the root routes
  { path: '/login', element: <Login /> },
  // Add the StoreFront route at the root level, outside the protected Layout
  { path: '/store/:slug', element: <StoreFront /> },
  // Account setup route (outside protected layout)
  { path: '/account-setup/:token', element: <AccountSetup /> }
];

export default routes;

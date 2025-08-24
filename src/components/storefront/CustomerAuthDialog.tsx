import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStorefrontAuth } from '@/contexts/storefront-auth-context';
import { toast } from 'sonner';
import { Loader2, User, Gift } from 'lucide-react';

interface CustomerAuthDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerAuthDialog = ({ isOpen, onClose }: CustomerAuthDialogProps) => {
  const { login, loginLegacy, register, requestPasswordReset, isLoading } = useStorefrontAuth();
  const [activeTab, setActiveTab] = useState('login');
  const [loginMode, setLoginMode] = useState<'password' | 'legacy'>('password');
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    phone: '',
    password: ''
  });
  
  // Register form state
  const [registerData, setRegisterData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loginMode === 'password') {
      if (!loginData.email || !loginData.password) {
        toast.error('Please fill in all fields');
        return;
      }
      const result = await login(loginData.email, loginData.password);
      if (result.success) {
        toast.success('Welcome back!');
        onClose();
      } else {
        toast.error(result.error || 'Login failed');
      }
    } else {
      if (!loginData.email || !loginData.phone) {
        toast.error('Please fill in all fields');
        return;
      }
      const result = await loginLegacy(loginData.email, loginData.phone);
      if (result.success) {
        toast.success('Welcome back!');
        onClose();
      } else {
        toast.error(result.error || 'Login failed');
      }
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email) {
      toast.error('Please enter your email address');
      return;
    }

    const result = await requestPasswordReset(loginData.email);
    if (result.success) {
      toast.success('Password reset email sent! Check your inbox.');
      setShowPasswordReset(false);
    } else {
      toast.error(result.error || 'Failed to send reset email');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerData.email || !registerData.phone || !registerData.firstName || !registerData.lastName || !registerData.password) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (registerData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    const name = `${registerData.firstName} ${registerData.lastName}`.trim();
    const result = await register({
      name,
      email: registerData.email,
      phone: registerData.phone,
      first_name: registerData.firstName,
      last_name: registerData.lastName,
      password: registerData.password
    });

    if (result.success) {
      toast.success('Account created successfully! Welcome!');
      onClose();
    } else {
      toast.error(result.error || 'Registration failed');
    }
  };

  const resetForms = () => {
    setLoginData({ email: '', phone: '', password: '' });
    setRegisterData({ firstName: '', lastName: '', email: '', phone: '', password: '', confirmPassword: '' });
    setLoginMode('password');
    setShowPasswordReset(false);
  };

  const handleClose = () => {
    resetForms();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Customer Account
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700">
            <Gift className="h-4 w-4" />
            <span className="text-sm font-medium">Loyalty Benefits</span>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Sign in or create an account to earn and redeem loyalty points on your purchases!
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="register">Create Account</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="space-y-4">
            {showPasswordReset ? (
              <form onSubmit={handlePasswordReset} className="space-y-4">
                <div className="text-center mb-4">
                  <h3 className="font-medium">Reset Password</h3>
                  <p className="text-sm text-muted-foreground">Enter your email to receive a password reset link</p>
                </div>
                <div>
                  <Label htmlFor="reset-email">Email</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowPasswordReset(false)} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Button
                    type="button"
                    variant={loginMode === 'password' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLoginMode('password')}
                  >
                    Password
                  </Button>
                  <Button
                    type="button"
                    variant={loginMode === 'legacy' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setLoginMode('legacy')}
                  >
                    Phone
                  </Button>
                </div>
                
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  {loginMode === 'password' ? (
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        value={loginData.password}
                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <Label htmlFor="login-phone">Phone Number</Label>
                      <Input
                        id="login-phone"
                        type="tel"
                        value={loginData.phone}
                        onChange={(e) => setLoginData({ ...loginData, phone: e.target.value })}
                        required
                      />
                    </div>
                  )}
                  
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                  
                  {loginMode === 'password' && (
                    <div className="text-center">
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => setShowPasswordReset(true)}
                      >
                        Forgot password?
                      </Button>
                    </div>
                  )}
                </form>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="register" className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="register-firstName">First Name</Label>
                  <Input
                    id="register-firstName"
                    value={registerData.firstName}
                    onChange={(e) => setRegisterData({ ...registerData, firstName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="register-lastName">Last Name</Label>
                  <Input
                    id="register-lastName"
                    value={registerData.lastName}
                    onChange={(e) => setRegisterData({ ...registerData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="register-phone">Phone Number</Label>
                <Input
                  id="register-phone"
                  type="tel"
                  value={registerData.phone}
                  onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="register-password">Password</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <div>
                <Label htmlFor="register-confirm-password">Confirm Password</Label>
                <Input
                  id="register-confirm-password"
                  type="password"
                  value={registerData.confirmPassword}
                  onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
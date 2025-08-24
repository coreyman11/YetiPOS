
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { authApi } from "@/services/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { StoreSelector } from "@/components/auth/StoreSelector"
import { useAuth } from "@/contexts/auth-context"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [userProfile, setUserProfile] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<'credentials' | 'store'>('credentials')
  const navigate = useNavigate()
  const { session, isAuthenticated } = useAuth()
  
  useEffect(() => {
    // Check if user is already authenticated
    const checkAuthStatus = async () => {
      if (isAuthenticated && session) {
        const storedUser = localStorage.getItem('selectedUser');
        const storedStore = localStorage.getItem('selectedStore');
        
        // If user is authenticated and has a store selected, redirect to dashboard
        if (storedUser && storedStore) {
          console.log('User already authenticated and has store, redirecting to dashboard');
          navigate('/', { replace: true });
          return;
        }
        
        // If user is authenticated but doesn't have a store selected,
        // try to get their profile and show the store selection screen
        try {
          const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) throw error;
          
          setUserProfile(profile);
          setStep('store');
        } catch (error) {
          console.error("Error fetching profile:", error);
          // If we can't get the profile, stay on login screen
        }
      }
    };
    
    checkAuthStatus();
  }, [isAuthenticated, session, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      console.log('Attempting to sign in...');
      await authApi.signIn(email, password)
      
      // Get fresh session after sign in
      const { data: sessionData } = await supabase.auth.getSession()
      
      if (!sessionData.session) throw new Error("No session found after sign in")
      
      const userId = sessionData.session.user.id
      console.log('Sign in successful, user ID:', userId);
      
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching user profile:', error);
        // If profile fetch fails, still continue to store selection
        setStep('store');
        return;
      }
      
      console.log('User profile loaded:', profile);
      setUserProfile(profile)
      setStep('store')
    } catch (error) {
      console.error("Sign in error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to sign in")
    } finally {
      setIsLoading(false)
    }
  }

  const handleStoreSelected = () => {
    console.log('Store selected, navigating to dashboard');
    navigate("/", { replace: true })
  }

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[400px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold">Timber</CardTitle>
          {step === 'store' && (
            <CardDescription>
              Select your store
            </CardDescription>
          )}
        </CardHeader>
        {step === 'credentials' ? (
          <form onSubmit={handleSignIn}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  required
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Input
                  required
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
              <p className="text-xs text-muted-foreground text-center">25.8.1</p>
            </CardFooter>
          </form>
        ) : (
          <StoreSelector 
            userId={userProfile?.id} 
            userProfile={userProfile} 
            onComplete={handleStoreSelected} 
          />
        )}
      </Card>
    </div>
  )
}

export default Login

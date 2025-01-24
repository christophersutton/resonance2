import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const API_URL = import.meta.env.VITE_API_URL;

export const MagicLinkCallback = () => {
  const [searchParams] = useSearchParams();
  const { setToken } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token');
      if (!token) {
        toast({
          title: "Error",
          description: "Invalid magic link",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      try {
        const response = await fetch(`${API_URL}/auth/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error('Invalid or expired token');
        }

        const { accessToken } = await response.json();
        setToken(accessToken);
        toast({
          title: "Success",
          description: "Successfully logged in",
          variant: "success"
        });
        navigate('/clients');
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to verify magic link. Please try again.",
          variant: "destructive"
        });
        navigate('/');
      }
    };

    verifyToken();
  }, [searchParams, setToken, navigate, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center p-4">
      <div className="text-white text-xl">Verifying your magic link...</div>
    </div>
  );
}; 
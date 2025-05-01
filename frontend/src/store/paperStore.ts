// frontend/src/store/paperStore.ts
import { create } from 'zustand';
import { useAuthStore } from '@/store/authStore';

interface PaperResult {
  position: number;
  title: string;
  link: string;
  snippet?: string;
  doi?: string;
  publication_info?: {
    summary: string;
    authors?: string[];
    journal?: string;
    year?: number;
  };
  resources?: {
    title: string;
    file_format: string;
    link: string;
  }[];
  inline_links?: {
    cited_by?: {
      total: number;
      link: string;
    };
    versions?: {
      total: number;
      link: string;
    };
    related_pages_link?: string;
  };
  unpaywall?: {
    is_oa: boolean;
    oa_status?: string;
    oa_url?: string;
    pdf_url?: string;
    journal?: string;
    year?: number;
    publisher?: string;
  };
}

interface PaperState {
  query: string;
  results: PaperResult[];
  isLoading: boolean;
  error: string | null;
  cooldownActive: boolean;
  
  // Actions
  setQuery: (query: string) => void;
  search: () => Promise<void>;
  clearResults: () => void;
}

export const usePaperStore = create<PaperState>()((set, get) => ({
  query: '',
  results: [],
  isLoading: false,
  error: null,
  cooldownActive: false,
  
  setQuery: (query) => set({ query }),
  
  search: async () => {
    const { query, cooldownActive } = get();
    const { token } = useAuthStore.getState();
    
    if (cooldownActive) {
      return;
    }
    
    if (!query.trim()) {
      set({ error: 'Please enter a search query' });
      return;
    }
    
    if (!token) {
      set({ error: 'You must be logged in to search' });
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const response = await fetch(`/api/papers/search?query=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.status === 429) {
        set({ 
          isLoading: false, 
          cooldownActive: true,
          error: 'Please wait a moment before searching again.'
        });
        
        // reset cooldown after 5 seconds
        setTimeout(() => {
          set({ cooldownActive: false });
        }, 5000);
        
        return;
      }
      
      if (response.status === 401) {
        // try to refresh the token
        try {
          await useAuthStore.getState().refreshToken();
          const newToken = useAuthStore.getState().token;
          
          if (newToken) {
            // retry with the new token
            const retryResponse = await fetch(`/api/papers/search?query=${encodeURIComponent(query)}`, {
              headers: {
                'Authorization': `Bearer ${newToken}`
              }
            });
            
            if (!retryResponse.ok) {
              throw new Error('Authentication failed. Please log in again.');
            }
            
            const data = await retryResponse.json();
            set({ 
              results: data.organic_results || [], 
              isLoading: false 
            });
            return;
          }
        } catch (refreshError) {
          set({ 
            isLoading: false, 
            error: 'Your session has expired. Please log in again.',
            results: []
          });
          return;
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to search');
      }
      
      const data = await response.json();
      set({ 
        results: data.organic_results || [], 
        isLoading: false 
      });
      
    } catch (err: any) {
      set({ 
        isLoading: false, 
        error: err.message || 'An error occurred',
        results: []
      });
    }
  },
  
  clearResults: () => set({ results: [], error: null }),
}));
// Giphy API integration for GIF search
// Note: For production, you should add VITE_GIPHY_API_KEY to your .env

const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || 'demo'; // Use demo key for development

export interface GiphyGif {
  id: string;
  title: string;
  url: string;
  images: {
    fixed_height: {
      url: string;
      width: string;
      height: string;
    };
    fixed_width_small: {
      url: string;
      width: string;
      height: string;
    };
  };
}

export const searchGifs = async (query: string, limit: number = 20): Promise<GiphyGif[]> => {
  try {
    const response = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=${limit}&rating=g`
    );
    
    if (!response.ok) throw new Error('Failed to fetch GIFs');
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching GIFs:', error);
    return [];
  }
};

export const getTrendingGifs = async (limit: number = 20): Promise<GiphyGif[]> => {
  try {
    const response = await fetch(
      `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&rating=g`
    );
    
    if (!response.ok) throw new Error('Failed to fetch trending GIFs');
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching trending GIFs:', error);
    return [];
  }
};
import { Product } from '../types';
import { Sparkles, Eye } from 'lucide-react';

interface RecommendationEngineProps {
  products: Product[];
  browsingHistory: string[];
  onSelectProduct: (product: Product) => void;
  primaryColor: string;
}

export default function RecommendationEngine({
  products,
  browsingHistory,
  onSelectProduct,
  primaryColor,
}: RecommendationEngineProps) {
  // Compute recommended items based on browsing patterns
  const getPersonalizedRecommendations = (): Product[] => {
    if (browsingHistory.length === 0) {
      // Fallback: Show premium trending or discounted items
      return products
        .slice()
        .sort((a, b) => (b.promoPrice ? 1 : -1)) // prioritize promo items
        .slice(0, 4);
    }

    // Determine user's favorite categories from browsing history
    const viewedProducts = products.filter(p => browsingHistory.includes(p.id));
    const categoryCounts: { [cat: string]: number } = {};
    
    viewedProducts.forEach(p => {
      categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
    });

    // Find the category with maximum views
    let favoriteCategory = '';
    let maxViews = 0;
    Object.entries(categoryCounts).forEach(([cat, count]) => {
      if (count > maxViews) {
        maxViews = count;
        favoriteCategory = cat;
      }
    });

    // Filter products from favorite category that might interest the user, excluding only currently viewed
    let recommendations = products.filter(p => p.category === favoriteCategory);
    
    // If not enough from the favorite category, pad with other highly rated items
    if (recommendations.length < 4) {
      const otherItems = products.filter(p => p.category !== favoriteCategory);
      recommendations = [...recommendations, ...otherItems];
    }

    // Limit to 4 unique items
    return Array.from(new Set(recommendations)).slice(0, 4);
  };

  const recommendedItems = getPersonalizedRecommendations();

  if (recommendedItems.length === 0) return null;

  return (
    <div id="recommendations_section" className="border-t border-[#1a1a1a]/10 pt-8 mt-12 bg-[#ebe7df]/10 p-6 rounded-none border">
      <div className="flex items-center gap-2 mb-6">
        <div>
          <h3 className="font-serif italic font-black text-[#1a1a1a] tracking-tight text-xl sm:text-2xl">Selected For You</h3>
          <p className="text-[10px] uppercase tracking-[0.12em] text-gray-450 mt-1">Automatic garments curated based on viewing behaviors.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recommendedItems.map(item => (
          <div 
            id={`rec_item_card_${item.id}`}
            key={item.id}
            onClick={() => onSelectProduct(item)}
            className="group cursor-pointer bg-[#fdfcf9] border border-black/10 rounded-none overflow-hidden hover:shadow-2xs transition-all duration-300 flex flex-col justify-between"
          >
            <div className="relative aspect-square bg-[#ebe7df]/20 overflow-hidden">
              <img 
                src={item.images[0]} 
                alt={item.title} 
                className="w-full h-full object-cover group-hover:scale-101 transition-all duration-500"
                referrerPolicy="no-referrer"
              />
              {item.promoPrice && (
                <span className="absolute top-2 left-2 text-[8px] font-bold bg-[#c5a059] text-white py-0.5 px-2 uppercase tracking-wider">
                  PROMO
                </span>
              )}
            </div>

            <div className="p-3.5 space-y-1 flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[8px] font-bold text-gray-450 uppercase tracking-[0.15em] block">{item.category}</span>
                <h4 className="text-sm font-serif font-black italic text-[#1a1a1a] group-hover:text-amber-700 leading-tight transition-all line-clamp-1">
                  {item.title}
                </h4>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-black/5 mt-1">
                <p className="text-[11px] font-bold text-gray-900 font-serif">
                  Tk {(item.promoPrice || item.price).toLocaleString()}
                </p>
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#1a1a1a] flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all">
                  Specs&rarr;
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

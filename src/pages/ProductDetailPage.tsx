import React, { useState, useEffect } from 'react';
import { Product, Review } from '../types';
import { useStore } from '../context/StoreContext';
import { ProductCard } from '../components/ProductCard';
import { Heart, ShoppingBag, Zap, ShieldCheck, Truck, RefreshCw, MessageCircle, Star, Check, Plus, Minus, ArrowLeft } from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { pageParams, navigate, addToCart, toggleWishlist, isWishlisted, settings, showToast } = useStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);

  // Review submission state
  const [reviewName, setReviewName] = useState('');
  const [reviewPhone, setReviewPhone] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const identifier = pageParams.slug || pageParams.id;

  useEffect(() => {
    if (!identifier) return;
    setLoading(true);

    import('../services/api').then(({ ApiService }) => {
      ApiService.getProduct(identifier).then(p => {
        if (p) {
          setProduct(p);
          setSelectedImage(p.primary_image);
          setReviews([]);
          ApiService.getProducts().then(all => {
            setRelated(all.filter(x => x.id !== p.id).slice(0, 4));
          });
          if (p.variants && p.variants.length > 0) {
            const defaults: Record<string, string> = {};
            p.variants.forEach((v: any) => {
              if (v.options && v.options.length > 0) {
                defaults[v.label] = v.options[0];
              }
            });
            setSelectedVariants(defaults);
          }
        } else {
          setProduct(null);
        }
      }).finally(() => setLoading(false));
    });
  }, [identifier]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-[4/3] bg-slate-900 rounded-2xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-slate-900 rounded w-3/4 animate-pulse" />
            <div className="h-4 bg-slate-900 rounded w-1/3 animate-pulse" />
            <div className="h-24 bg-slate-900 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-xl font-bold text-white">Product Not Found</h2>
        <p className="text-xs text-slate-400 mt-2">The gadget you are looking for may have been moved or archived.</p>
        <button
          onClick={() => navigate('products')}
          className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
        >
          Back to Catalog
        </button>
      </div>
    );
  }

  const wishlisted = isWishlisted(product.id);
  const discountPercent = product.original_price > product.selling_price
    ? Math.round(((product.original_price - product.selling_price) / product.original_price) * 100)
    : 0;

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariants);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedVariants);
    navigate('checkout');
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) {
      showToast('Please provide your name and review comments', 'error');
      return;
    }

    setSubmittingReview(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          customerName: reviewName,
          customerPhone: reviewPhone,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('Review submitted successfully!', 'success');
        setReviews(prev => [
          {
            id: data.reviewId,
            product_id: product.id,
            customer_name: reviewName,
            customer_phone: reviewPhone,
            rating: reviewRating,
            comment: reviewComment,
            is_verified_purchase: 1,
            status: 'approved',
            created_at: new Date().toISOString(),
          },
          ...prev,
        ]);
        setReviewComment('');
        setReviewName('');
        setReviewPhone('');
      } else {
        showToast(data.error || 'Failed to submit review', 'error');
      }
    } catch {
      showToast('Error communicating with review server', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  // WhatsApp inquiry URL for this specific product
  const rawWhatsApp = settings.whatsapp_number || '01577215469';
  const cleanWhatsApp = rawWhatsApp.replace(/\D/g, '').replace(/^0/, '');
  const productWhatsAppUrl = `https://wa.me/880${cleanWhatsApp}?text=${encodeURIComponent(
    `Hello NEXORA TECH! I want to inquire about "${product.title}" (SKU: ${product.sku}, Price: ৳${product.selling_price}). Is this currently available?`
  )}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      
      {/* Breadcrumb & Back */}
      <button
        onClick={() => navigate('products')}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to All Products</span>
      </button>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Left: Product Images Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/3] rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden relative shadow-xl">
            <img
              src={selectedImage}
              alt={product.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/src/assets/images/hero_gadgets_showcase_1791985482814.jpg';
              }}
            />
            {discountPercent > 0 && (
              <div className="absolute top-4 left-4 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded shadow-md">
                -{discountPercent}% OFF
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.gallery_images && product.gallery_images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.gallery_images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(img)}
                  className={`w-20 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${selectedImage === img ? 'border-blue-500 scale-102' : 'border-slate-800 hover:border-slate-600'}`}
                >
                  <img
                    src={img}
                    alt={`${product.title} view ${i + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Contiguous Purchase Module */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-6 shadow-xl">
          
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold uppercase tracking-wider text-blue-400">
                {product.brand} · SKU: {product.sku}
              </span>
              <div className="flex items-center gap-1 text-slate-300">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="font-semibold">4.9</span>
                <span className="text-slate-500">({reviews.length} reviews)</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
              {product.title}
            </h1>
          </div>

          {/* Price Strip */}
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Offer Price</span>
              <div className="flex items-baseline gap-2.5">
                <span className="text-2xl font-extrabold text-white tabular-nums">
                  ৳{product.selling_price.toLocaleString('en-BD')}
                </span>
                {product.original_price > product.selling_price && (
                  <span className="text-sm text-slate-500 line-through tabular-nums">
                    ৳{product.original_price.toLocaleString('en-BD')}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              {product.stock_quantity > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                  <Check className="w-3.5 h-3.5" />
                  <span>In Stock ({product.stock_quantity})</span>
                </span>
              ) : (
                <span className="text-xs font-semibold text-rose-400">Sold Out</span>
              )}
              <span className="text-[11px] text-slate-500 block mt-0.5">Cash on Delivery</span>
            </div>
          </div>

          {/* Variants Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4">
              {product.variants.map((v, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{v.label}</span>
                    <span className="text-blue-400">{selectedVariants[v.label]}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {v.options.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setSelectedVariants(prev => ({ ...prev, [v.label]: opt }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedVariants[v.label] === opt
                            ? 'bg-blue-600 text-white font-semibold shadow-sm'
                            : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quantity Selector & Actions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400">Quantity:</span>
              <div className="flex items-center border border-slate-700 rounded-lg bg-slate-900">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-3 text-xs font-semibold tabular-nums text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="p-2 text-slate-400 hover:text-white transition-colors"
                  disabled={quantity >= product.stock_quantity}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={product.stock_quantity <= 0}
                className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Bag</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock_quantity <= 0}
                className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Zap className="w-4 h-4" />
                <span>Buy Now</span>
              </button>
            </div>

            {/* Secondary actions: Wishlist & Direct WhatsApp Inquiry */}
            <div className="flex items-center gap-3 pt-1">
              <button
                onClick={() => toggleWishlist(product.id)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-medium transition-colors ${
                  wishlisted
                    ? 'border-rose-500/50 bg-rose-500/10 text-rose-400'
                    : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-current' : ''}`} />
                <span>{wishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
              </button>

              <a
                href={productWhatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-emerald-800/40 bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 text-xs font-medium transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Ask on WhatsApp</span>
              </a>
            </div>

          </div>

          {/* Delivery & Warranty Trust Strip */}
          <div className="border-t border-slate-800 pt-4 space-y-2.5 text-xs text-slate-400">
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-blue-400 shrink-0" />
              <span><strong>Dhaka Delivery:</strong> 24–48 Hours (৳70) · <strong>Outside Dhaka:</strong> 2–4 Days (৳130)</span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span><strong>Warranty:</strong> {product.warranty_info || '1 Year Brand Warranty'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <RefreshCw className="w-4 h-4 text-indigo-400 shrink-0" />
              <span><strong>Replacement:</strong> 7-Day Easy Replacement for Manufacturing Defects</span>
            </div>
          </div>

        </div>

      </div>

      {/* Specifications & Description */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight">Product Overview &amp; Features</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Reviews List & Submission */}
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-base font-bold text-white">Customer Reviews</h3>
                <p className="text-xs text-slate-400 mt-0.5">Verified feedback from real customers</p>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm font-bold text-white">4.9 / 5.0</span>
              </div>
            </div>

            {/* List */}
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No reviews yet. Be the first to share your experience!</p>
              ) : (
                reviews.map(rev => (
                  <div key={rev.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200">{rev.customer_name}</span>
                        {rev.is_verified_purchase === 1 && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                      <div className="flex text-amber-400">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{rev.comment}</p>
                    <span className="text-[10px] text-slate-500 block">
                      {new Date(rev.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Submission Form */}
            <form onSubmit={handleReviewSubmit} className="pt-4 border-t border-slate-800 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Write a Review</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Your Name *"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  required
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Bangladesh Mobile Number (Optional)"
                  value={reviewPhone}
                  onChange={(e) => setReviewPhone(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">Your Rating:</span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 text-slate-500 hover:text-amber-400 focus:outline-none"
                    >
                      <Star className={`w-4 h-4 ${star <= reviewRating ? 'text-amber-400 fill-amber-400' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={3}
                placeholder="Share your experience with build quality, battery life, and delivery..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                disabled={submittingReview}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
              >
                {submittingReview ? 'Submitting...' : 'Post Review'}
              </button>
            </form>

          </div>
        </div>

        {/* Right: Technical Specifications */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
            <h2 className="text-base font-bold text-white tracking-tight">Technical Specifications</h2>
            <div className="divide-y divide-slate-800 text-xs">
              {product.specs && Object.keys(product.specs).length > 0 ? (
                Object.entries(product.specs).map(([specKey, specVal]) => (
                  <div key={specKey} className="py-2.5 flex justify-between gap-4">
                    <span className="text-slate-400 font-medium">{specKey}</span>
                    <span className="text-slate-200 text-right font-semibold">{specVal}</span>
                  </div>
                ))
              ) : (
                <div className="py-3 text-slate-500">Standard specifications apply.</div>
              )}
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-slate-400 font-medium">Model Code</span>
                <span className="text-slate-200 text-right font-semibold">{product.model || product.sku}</span>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-slate-400 font-medium">Warranty</span>
                <span className="text-slate-200 text-right font-semibold">{product.warranty_info || '1 Year Brand Warranty'}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="pt-8 border-t border-slate-800">
          <h2 className="text-xl font-bold text-white mb-6">Related Gadgets You May Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {related.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

    </div>
  );
};

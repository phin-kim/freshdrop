interface SkeletonLoaderProps {
  type?: "product" | "category" | "history" | "cart" | "home" | "list";
  count?: number;
}

export default function SkeletonLoader({ type = "product", count = 4 }: SkeletonLoaderProps) {
  // Helper for rendering multiple elements
  const items = Array.from({ length: count });

  const renderProductSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {items.map((_, idx) => (
        <div
          key={idx}
          className="bg-surface-container-lowest rounded-2xl border border-outline-variant/20 overflow-hidden flex flex-col justify-between h-[300px] shadow-sm"
        >
          {/* Image Skeleton */}
          <div className="relative aspect-square w-full bg-surface-container-high animate-pulse"></div>

          {/* Details Skeleton */}
          <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              {/* Category tag */}
              <div className="h-2.5 w-1/3 bg-surface-container-high rounded animate-pulse"></div>
              {/* Product title */}
              <div className="h-4 w-4/5 bg-surface-container-high rounded animate-pulse"></div>
              {/* Quantity text */}
              <div className="h-2.5 w-1/2 bg-surface-container-high rounded animate-pulse"></div>
            </div>

            {/* Price and Button */}
            <div className="flex items-center justify-between pt-2">
              <div className="space-y-1">
                <div className="h-2 w-10 bg-surface-container bg-surface-container-high rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-surface-container bg-surface-container-high rounded animate-pulse"></div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-container-high animate-pulse"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderCategorySkeleton = () => (
    <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-none">
      {Array.from({ length: 5 }).map((_, idx) => (
        <div key={idx} className="flex-none w-24 flex flex-col items-center gap-2">
          {/* Circle Icon */}
          <div className="w-16 h-16 rounded-full bg-surface-container-high animate-pulse"></div>
          {/* Name Label */}
          <div className="h-3 w-12 bg-surface-container-high rounded animate-pulse"></div>
        </div>
      ))}
    </div>
  );

  const renderCartSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* List (2 cols) */}
      <div className="lg:col-span-2 space-y-6 bg-white p-6 rounded-2xl border border-outline-variant/15 shadow-sm">
        <div className="flex justify-between items-center pb-4 border-b border-outline-variant/15">
          <div className="h-8 w-1/3 bg-surface-container-high rounded animate-pulse"></div>
          <div className="h-5 w-16 bg-surface-container-high rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="flex gap-4 py-4 items-center border-b border-slate-50 last:border-none">
              <div className="w-16 h-16 rounded-xl bg-surface-container-high animate-pulse shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 bg-surface-container-high rounded animate-pulse"></div>
                <div className="h-3 w-1/4 bg-surface-container-high rounded animate-pulse"></div>
              </div>
              <div className="w-20 h-8 rounded-xl bg-surface-container-high animate-pulse"></div>
              <div className="w-12 h-6 rounded bg-surface-container-high animate-pulse text-right"></div>
            </div>
          ))}
        </div>
      </div>
      {/* Sidebar (1 col) */}
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-outline-variant/15 shadow-sm space-y-5">
          <div className="h-5 w-1/2 bg-surface-container-high rounded animate-pulse border-b pb-3"></div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <div className="h-4 w-1/3 bg-surface-container-high rounded animate-pulse"></div>
              <div className="h-4 w-1/4 bg-surface-container-high rounded animate-pulse"></div>
            </div>
            <div className="h-20 w-full bg-surface-container rounded-xl animate-pulse"></div>
            <div className="flex justify-between pt-3 border-t">
              <div className="h-5 w-1/3 bg-surface-container-high rounded animate-pulse"></div>
              <div className="h-5 w-1/4 bg-surface-container-high rounded animate-pulse"></div>
            </div>
          </div>
          <div className="h-12 w-full bg-surface-container-high rounded-xl animate-pulse"></div>
        </div>
      </div>
    </div>
  );

  const renderHistorySkeleton = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center py-2 border-b border-outline-variant/25 pb-4">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-surface-container-high rounded animate-pulse font-caveat"></div>
          <div className="h-3.5 w-40 bg-surface-container-high rounded animate-pulse"></div>
        </div>
        <div className="h-9 w-28 bg-surface-container-high rounded-xl animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-outline-variant/15 shadow-sm space-y-4">
          <div className="h-5 w-1/2 bg-surface-container-high rounded animate-pulse"></div>
          <div className="flex flex-col items-center p-4 space-y-3">
            <div className="w-20 h-20 rounded-full bg-surface-container-high animate-pulse"></div>
            <div className="h-5 w-32 bg-surface-container-high rounded animate-pulse"></div>
            <div className="h-3.5 w-40 bg-surface-container-high rounded animate-pulse"></div>
          </div>
          <div className="space-y-2 border-t pt-4">
            <div className="h-3 w-full bg-surface-container-high rounded animate-pulse"></div>
            <div className="h-3 w-5/6 bg-surface-container-high rounded animate-pulse"></div>
          </div>
        </div>

        {/* Previous Orders */}
        <div className="lg:col-span-2 space-y-4 bg-white p-6 rounded-2xl border border-outline-variant/15 shadow-sm">
          <div className="h-5 w-1/3 bg-surface-container-high rounded animate-pulse pb-3"></div>
          <div className="space-y-6 pt-4">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="space-y-3">
                <div className="flex justify-between">
                  <div className="h-4 w-32 bg-surface-container-high rounded animate-pulse"></div>
                  <div className="h-5 w-24 bg-surface-container-high rounded-full animate-pulse"></div>
                </div>
                <div className="h-12 w-full bg-surface-container/30 rounded-xl animate-pulse"></div>
                <div className="flex justify-between pt-2">
                  <div className="h-3 w-48 bg-surface-container-high rounded animate-pulse"></div>
                  <div className="h-4 w-16 bg-surface-container-high rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderHomeSkeleton = () => (
    <div className="space-y-6">
      {/* Delivery widget skeleton */}
      <div className="bg-white rounded-2xl border border-outline-variant/20 p-5 shadow-sm space-y-4">
        <div className="h-7 w-48 bg-surface-container-high rounded animate-pulse"></div>
        <div className="space-y-3">
          <div className="h-11 w-full bg-surface-container-high rounded-xl animate-pulse"></div>
          <div className="h-11 w-full bg-surface-container-high rounded-xl animate-pulse"></div>
        </div>
      </div>

      {/* Greeting row */}
      <div className="flex justify-between items-center py-2 border-b border-slate-100 pb-4">
        <div className="space-y-2">
          <div className="h-9 w-48 bg-surface-container-high rounded animate-pulse"></div>
          <div className="h-3.5 w-72 bg-surface-container-high rounded animate-pulse"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-28 bg-surface-container-high rounded-xl animate-pulse"></div>
          <div className="h-8 w-24 bg-surface-container-high rounded-xl animate-pulse"></div>
        </div>
      </div>

      {/* Search Input */}
      <div className="h-12 max-w-2xl bg-surface-container-high rounded-full animate-pulse"></div>

      {/* Categories skeleton section */}
      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="h-5 w-24 bg-surface-container-high rounded animate-pulse"></div>
          <div className="h-3 w-12 bg-surface-container-high rounded animate-pulse"></div>
        </div>
        {renderCategorySkeleton()}
      </div>

      {/* Product highlights banner */}
      <div className="space-y-4">
        <div className="flex justify-between">
          <div className="h-5 w-36 bg-surface-container-high rounded animate-pulse"></div>
          <div className="h-4 w-28 bg-surface-container-high rounded-full animate-pulse"></div>
        </div>
        {renderProductSkeleton()}
      </div>
    </div>
  );

  switch (type) {
    case "category":
      return renderCategorySkeleton();
    case "cart":
      return renderCartSkeleton();
    case "history":
      return renderHistorySkeleton();
    case "home":
      return renderHomeSkeleton();
    case "product":
    default:
      return renderProductSkeleton();
  }
}

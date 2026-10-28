"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "./sell.css";

interface Product {
  id: number;
  title: string;
  author: string | null;
  isbn: string | null;
  sku: string | null;
  category: string | null;
  price: string;
  quantity: number; // current stock
  reorderThreshold: number;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface SaleReceipt {
  sale: {
    id: number;
    cashierId: number;
    cashierName: string;
    total: string;
    createdAt: string;
  };
  items: Array<{
    id: number;
    productId: number;
    title: string;
    author: string | null;
    isbn: string | null;
    sku: string | null;
    quantity: number;
    unitPrice: string;
    lineTotal: string;
  }>;
  paymentMethod?: string;
  tendered?: string;
  change?: string;
}

export default function SellPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartHistory, setCartHistory] = useState<CartItem[][]>([]);

  // Catalog & Products state (shown under search bar)
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);

  // Search & Scanner state
  const [searchQuery, setSearchQuery] = useState("");
  const [recentScannedNotice, setRecentScannedNotice] = useState<string | null>(null);

  // Payment & Checkout state
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [cashTendered, setCashTendered] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<SaleReceipt | null>(null);

  // Checkout History state
  const [checkoutHistory, setCheckoutHistory] = useState<SaleReceipt[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  // Map of product ID to quantity currently in the cart
  const cartQtyMap = useMemo(() => {
    const map: Record<number, number> = {};
    for (const item of cart) {
      map[item.product.id] = (map[item.product.id] || 0) + item.quantity;
    }
    return map;
  }, [cart]);

  // Load active inventory catalog
  async function loadCatalog() {
    setCatalogLoading(true);
    try {
      const res = await fetch("/api/products?status=active");
      if (res.ok) {
        const data = await res.json();
        const items: Product[] = data.products || [];
        setCatalogProducts(items);
        if (data.categories && Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      }
    } catch (err) {
      console.error("Failed to load catalog:", err);
    } finally {
      setCatalogLoading(false);
    }
  }

  // Load checkout history
  async function loadCheckoutHistory() {
    setHistoryLoading(true);
    try {
      const res = await fetch("/api/sales?limit=50");
      if (res.ok) {
        const data = await res.json();
        const rawList = data.sales || [];
        const normalized: SaleReceipt[] = rawList.map((s: any) => {
          if (s.sale && s.sale.id) return s;
          return {
            sale: {
              id: s.id,
              cashierId: s.cashierId,
              cashierName: s.cashierName || "Cashier",
              total: s.total,
              createdAt: s.createdAt,
            },
            items: s.items || [],
            paymentMethod: s.paymentMethod || "CASH",
          };
        });
        setCheckoutHistory(normalized);
      }
    } catch (err) {
      console.error("Failed to load checkout history:", err);
    } finally {
      setHistoryLoading(false);
    }
  }

  useEffect(() => {
    loadCheckoutHistory();
    loadCatalog();
  }, []);

  // Focus & element refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeBufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);

  // Update cart helper that records undo history
  function updateCartWithHistory(newCart: CartItem[]) {
    setCartHistory((prev) => [...prev.slice(-15), cart]);
    setCart(newCart);
  }

  // 1. Add product to cart (or increment quantity if already present)
  function addToCart(product: Product, quantityToAdd = 1) {
    if (product.quantity <= 0) {
      triggerNotice(`"${product.title}" is out of stock!`, "error");
      return;
    }

    const existingIndex = cart.findIndex((item) => item.product.id === product.id);

    if (existingIndex > -1) {
      const existing = cart[existingIndex];
      const newQty = existing.quantity + quantityToAdd;

      if (newQty > product.quantity) {
        triggerNotice(
          `Cannot add more. Only ${product.quantity} in stock for "${product.title}"`,
          "error"
        );
        return;
      }

      const updatedCart = [...cart];
      updatedCart[existingIndex] = {
        ...existing,
        quantity: newQty,
      };
      updateCartWithHistory(updatedCart);
      triggerNotice(`Updated "${product.title}" quantity to ${newQty}`);
    } else {
      if (quantityToAdd > product.quantity) {
        triggerNotice(
          `Cannot add ${quantityToAdd}. Only ${product.quantity} in stock!`,
          "error"
        );
        return;
      }

      const updatedCart = [...cart, { product, quantity: quantityToAdd }];
      updateCartWithHistory(updatedCart);
      triggerNotice(`Added "${product.title}" to cart`);
    }

    setCheckoutError(null);
  }

  // Adjust item quantity in cart
  function updateItemQuantity(productId: number, targetQty: number) {
    if (targetQty <= 0) {
      removeItem(productId);
      return;
    }

    const index = cart.findIndex((item) => item.product.id === productId);
    if (index === -1) return;

    const currentItem = cart[index];
    if (targetQty > currentItem.product.quantity) {
      triggerNotice(
        `Max stock reached (${currentItem.product.quantity}) for "${currentItem.product.title}"`,
        "error"
      );
      return;
    }

    const updated = [...cart];
    updated[index] = { ...currentItem, quantity: targetQty };
    updateCartWithHistory(updated);
  }

  // Remove item from cart
  function removeItem(productId: number) {
    const updated = cart.filter((item) => item.product.id !== productId);
    updateCartWithHistory(updated);
  }

  // Undo last cart modification
  function handleUndo() {
    if (cartHistory.length === 0) return;
    const previous = cartHistory[cartHistory.length - 1];
    setCartHistory((prev) => prev.slice(0, -1));
    setCart(previous);
    triggerNotice("Undid last cart action");
  }

  // Clear entire cart
  function handleClearCart() {
    if (cart.length === 0) return;
    if (window.confirm("Are you sure you want to clear all items in the cart?")) {
      updateCartWithHistory([]);
      setCashTendered("");
      setCheckoutError(null);
      triggerNotice("Cart cleared");
    }
  }

  // Temporary notice banner
  function triggerNotice(msg: string, type: "info" | "error" = "info") {
    setRecentScannedNotice(`${type === "error" ? "⚠️ " : "✓ "} ${msg}`);
    setTimeout(() => {
      setRecentScannedNotice(null);
    }, 3500);
  }

  // 2. Exact Barcode Lookup via Scanner
  async function handleBarcodeLookup(scannedCode: string) {
    const trimmed = scannedCode.trim();
    if (!trimmed) return;

    try {
      const res = await fetch(`/api/products/lookup?barcode=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        if (res.status === 404) {
          triggerNotice(`Barcode "${trimmed}" not found in inventory`, "error");
        } else {
          triggerNotice(`Scanner error: failed to lookup barcode`, "error");
        }
        return;
      }

      const data = await res.json();
      if (data.product) {
        addToCart(data.product);
      }
    } catch (err: any) {
      console.error("Barcode lookup failure:", err);
      triggerNotice("Network error during barcode lookup", "error");
    }
  }

  // 3. Global Keydown Listener for Barcode Scanner
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Allow Ctrl+Z for undo
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (cartHistory.length > 0) {
          e.preventDefault();
          handleUndo();
          return;
        }
      }

      // Allow '/' or 'F2' to focus search input
      if ((e.key === "/" || e.key === "F2") && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      // Allow Ctrl+Enter to checkout
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (cart.length > 0 && !isSubmitting) {
          e.preventDefault();
          handleCheckout();
          return;
        }
      }

      // Ignore pure control keys
      if (["Shift", "Control", "Alt", "Meta", "CapsLock", "Tab", "Escape"].includes(e.key)) {
        return;
      }

      const now = Date.now();
      const timeDelta = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // Scanners send keystrokes < 60-80ms apart. If slower, it's manual typing, so reset buffer.
      if (timeDelta > 90) {
        barcodeBufferRef.current = "";
      }

      if (e.key === "Enter") {
        const buffered = barcodeBufferRef.current.trim();
        if (buffered.length >= 3) {
          e.preventDefault();
          handleBarcodeLookup(buffered);
          barcodeBufferRef.current = "";
          return;
        }
        barcodeBufferRef.current = "";
      } else if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, cartHistory, isSubmitting]);

  // Category icon helper
  function getCategoryIcon(cat: string | null) {
    if (!cat) return "🏷️";
    const lower = cat.toLowerCase();
    if (lower.includes("book") || lower.includes("cr") || lower.includes("b5") || lower.includes("xe")) return "📘";
    if (lower.includes("pen") || lower.includes("pencil") || lower.includes("writing")) return "🖊️";
    if (lower.includes("food") || lower.includes("snack") || lower.includes("biscuit")) return "🍪";
    if (lower.includes("beverage") || lower.includes("drink")) return "🥤";
    if (lower.includes("stationery") || lower.includes("craft") || lower.includes("office")) return "📐";
    return "📦";
  }

  // Filter products by selected category and search input
  const displayedProducts = useMemo(() => {
    return catalogProducts.filter((product) => {
      // 1. Category filter
      if (selectedCategory !== "all" && product.category !== selectedCategory) {
        return false;
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (product.title || "").toLowerCase().includes(q);
        const matchAuthor = (product.author || "").toLowerCase().includes(q);
        const matchIsbn = (product.isbn || "").toLowerCase().includes(q);
        const matchSku = (product.sku || "").toLowerCase().includes(q);
        const matchCategory = (product.category || "").toLowerCase().includes(q);
        return matchTitle || matchAuthor || matchIsbn || matchSku || matchCategory;
      }

      return true;
    });
  }, [catalogProducts, selectedCategory, searchQuery]);

  // Enter key in manual search input: immediately add top match to cart
  function handleSearchKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (displayedProducts.length > 0) {
        const firstAvailable = displayedProducts.find((p) => p.quantity > 0) || displayedProducts[0];
        addToCart(firstAvailable);
        setSearchQuery("");
      } else if (searchQuery.trim()) {
        // Try searching barcode directly
        handleBarcodeLookup(searchQuery.trim());
        setSearchQuery("");
      }
    }
  }

  // Cart Totals calculation (server will re-verify from DB)
  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = cart.reduce((sum, item) => {
    return sum + parseFloat(item.product.price) * item.quantity;
  }, 0);

  const tenderedNum = parseFloat(cashTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - totalAmount);

  // 5. Checkout Execution
  async function handleCheckout() {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    setCheckoutError(null);

    // Unique idempotency key to prevent double-submit
    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `sale-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const payload = {
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        idempotencyKey,
      };

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed. Please try again.");
      }

      // Success: populate completed sale receipt
      const receipt: SaleReceipt = {
        ...data,
        paymentMethod: paymentMethod.toUpperCase(),
        tendered: paymentMethod === "cash" && tenderedNum > 0 ? tenderedNum.toFixed(2) : undefined,
        change: paymentMethod === "cash" && tenderedNum > 0 ? changeDue.toFixed(2) : undefined,
      };

      setCompletedSale(receipt);
      setCheckoutHistory((prev) => [receipt, ...prev]);
      setCart([]);
      setCartHistory([]);
      setCashTendered("");
      loadCatalog(); // Refresh catalog stock counts immediately
    } catch (err: any) {
      console.error("Checkout failed:", err);
      setCheckoutError(err.message || "An unexpected error occurred during checkout.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 gap-6">
      {/* Top Bar: Title & Scanner Status */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 dark:border-white/10 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            <span>Cashier Checkout</span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#1ecbe1]/15 text-[#0891b2] dark:text-[#1ecbe1] border border-[#1ecbe1]/30 shadow-sm shadow-[#1ecbe1]/10">
              Live Terminal
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-300 mt-1">
            Scan barcodes directly or click items below to build the cart.
          </p>
        </div>

        {/* Actions & Scanner Status */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setHistoryOpen(true);
              loadCheckoutHistory();
            }}
            className="flex items-center gap-2 rounded-xl border border-slate-300 dark:border-white/10 bg-white/80 dark:bg-white/5 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-white hover:border-[#0891b2] dark:hover:border-[#1ecbe1]/50 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-[#0891b2] dark:hover:text-[#1ecbe1] active:scale-95 transition-all shadow-sm cursor-pointer backdrop-blur-md"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="h-4 w-4 text-[#0891b2] dark:text-[#1ecbe1]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Checkout History</span>
            {checkoutHistory.length > 0 && (
              <span className="rounded-full bg-[#1ecbe1]/20 px-2 py-0.5 text-[10px] font-bold text-[#0891b2] dark:text-[#1ecbe1] border border-[#1ecbe1]/40">
                {checkoutHistory.length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-2 rounded-full border border-[#1ecbe1]/30 bg-[#1ecbe1]/10 px-3.5 py-1.5 text-xs text-[#0891b2] dark:text-[#1ecbe1]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0891b2] dark:bg-[#1ecbe1] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0891b2] dark:bg-[#1ecbe1]"></span>
            </span>
            <span className="font-bold">Scanner Active:</span>
            <span className="text-slate-500 dark:text-slate-300 hidden sm:inline">Aim and pull trigger</span>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 bg-white/70 dark:bg-white/5 backdrop-blur-md hidden md:block">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-[#0891b2] dark:text-[#1ecbe1] font-mono text-[10px] border border-slate-300 dark:border-white/10">
              /
            </kbd>{" "}
            Search &bull;{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-200 font-mono text-[10px] border border-slate-300 dark:border-white/10">
              Ctrl+Z
            </kbd>{" "}
            Undo &bull;{" "}
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-200 font-mono text-[10px] border border-slate-300 dark:border-white/10">
              Ctrl+Enter
            </kbd>{" "}
            Pay
          </div>
        </div>
      </div>

      {/* Floating Notice / Toast */}
      {recentScannedNotice && (
        <div className="p-3.5 rounded-xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-[#1ecbe1]/40 text-slate-900 dark:text-white text-xs shadow-xl shadow-[#1ecbe1]/10 flex items-center justify-between animate-fade-in">
          <span className="font-semibold text-[#0891b2] dark:text-[#1ecbe1]">{recentScannedNotice}</span>
          <button
            onClick={() => setRecentScannedNotice(null)}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-base ml-4"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Grid: Left Catalog / Search & Right Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
        {/* Left Column: Product Catalog & Quick Add (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-4 sm:p-5 shadow-xl dark:shadow-2xl backdrop-blur-2xl space-y-4">
            {/* Header with Title and Keyboard Shortcut Tip */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Product Catalog</span>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-[#0891b2] dark:text-[#1ecbe1] border border-[#1ecbe1]/30">
                    {displayedProducts.length} {displayedProducts.length === 1 ? "item" : "items"}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Click any item card to add to cart, or filter by category.
                </p>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono hidden sm:inline-block bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-white/10">
                Press <kbd className="text-[#0891b2] dark:text-[#1ecbe1] font-bold">/</kbd> to search
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-4 h-4 text-[#0891b2] dark:text-[#1ecbe1]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search items by name, brand (Atlas, Munchee), barcode, or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-950/60 pl-10 pr-16 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-[#0891b2] dark:focus:border-[#1ecbe1] focus:outline-none focus:ring-1 focus:ring-[#1ecbe1] transition-all shadow-inner backdrop-blur-md"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-3 top-2 px-2 py-0.5 rounded-lg text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 transition-all active:scale-95"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pos-scrollbar pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all active:scale-95 ${
                  selectedCategory === "all"
                    ? "bg-gradient-to-r from-[#1ecbe1] to-[#06b6d4] text-slate-950 shadow-md shadow-[#1ecbe1]/30"
                    : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 hover:border-[#1ecbe1]/40"
                }`}
              >
                🏷️ All ({catalogProducts.length})
              </button>
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                const count = catalogProducts.filter((p) => p.category === cat).length;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 ${
                      isSelected
                        ? "bg-gradient-to-r from-[#1ecbe1] to-[#06b6d4] text-slate-950 shadow-md shadow-[#1ecbe1]/30"
                        : "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/10 hover:border-[#1ecbe1]/40"
                    }`}
                  >
                    <span>{getCategoryIcon(cat)}</span>
                    <span>{cat}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        isSelected ? "bg-slate-950/20 text-slate-950" : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Filter status header */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-0.5">
              <span>
                Showing <strong className="text-slate-900 dark:text-white">{displayedProducts.length}</strong> items
                {selectedCategory !== "all" && ` in ${selectedCategory}`}
                {searchQuery && ` matching "${searchQuery}"`}
              </span>
              {(searchQuery || selectedCategory !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="text-[#0891b2] dark:text-[#1ecbe1] hover:underline font-bold text-[11px]"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {/* Items Grid Appearing Directly Under Search Bar */}
            <div className="max-h-[520px] overflow-y-auto pos-scrollbar pr-1">
              {catalogLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3">
                  {[1, 2, 3, 4, 5, 6].map((n) => (
                    <div
                      key={n}
                      className="h-28 rounded-2xl bg-slate-100 dark:bg-white/[0.03] animate-pulse border border-slate-200 dark:border-white/10"
                    />
                  ))}
                </div>
              ) : displayedProducts.length === 0 ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center rounded-2xl bg-slate-100/60 dark:bg-white/[0.02] border border-dashed border-slate-300 dark:border-white/10">
                  <div className="text-3xl mb-2">🔍</div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">No items found</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                    {searchQuery
                      ? `No products match "${searchQuery}".`
                      : "No products available in this category."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                    className="mt-3 px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-white/10 text-xs text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-all font-semibold active:scale-95 cursor-pointer"
                  >
                    Show All Items
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {displayedProducts.map((item) => {
                    const isOutOfStock = item.quantity <= 0;
                    const isLowStock = !isOutOfStock && item.quantity <= item.reorderThreshold;
                    const inCartCount = cartQtyMap[item.id] || 0;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          if (!isOutOfStock) addToCart(item);
                        }}
                        className={`group pos-item-card text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                          isOutOfStock
                            ? "bg-slate-100/50 dark:bg-white/[0.02] border-slate-200 dark:border-white/5 opacity-50 cursor-not-allowed"
                            : "bg-white/75 dark:bg-white/[0.03] backdrop-blur-md border-slate-200/80 dark:border-white/10 hover:border-[#1ecbe1] hover:bg-white dark:hover:bg-white/[0.07] hover:shadow-lg hover:shadow-[#1ecbe1]/15 cursor-pointer active:scale-[0.98]"
                        }`}
                      >
                        <div>
                          {/* Top: Category & Stock Status */}
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                              {item.category || item.author || "General"}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                isOutOfStock
                                  ? "bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30"
                                  : isLowStock
                                  ? "bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30"
                                  : "bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30"
                              }`}
                            >
                              {isOutOfStock ? "Out of Stock" : `${item.quantity} in stock`}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-cyan-600 dark:group-hover:text-[#1ecbe1] transition-colors leading-snug">
                            {item.title}
                          </h3>

                          {/* Code / Barcode / Author */}
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                            {item.isbn
                              ? `Barcode: ${item.isbn}`
                              : item.sku
                              ? `SKU: ${item.sku}`
                              : item.author || ""}
                          </div>
                        </div>

                        {/* Bottom: Price, In-Cart Badge & Add Button */}
                        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200 dark:border-white/10">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs sm:text-sm font-extrabold text-cyan-700 dark:text-[#1ecbe1]">
                              Rs. {parseFloat(item.price).toFixed(2)}
                            </span>
                            {inCartCount > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-100 dark:bg-[#1ecbe1]/20 text-cyan-800 dark:text-[#1ecbe1] border border-cyan-300 dark:border-[#1ecbe1]/40">
                                In cart: {inCartCount}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={isOutOfStock}
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart(item);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all active:scale-95 ${
                              isOutOfStock
                                ? "bg-slate-200 dark:bg-white/5 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                                : "bg-gradient-to-r from-[#1ecbe1] to-[#06b6d4] text-slate-950 hover:brightness-110 shadow-md shadow-[#1ecbe1]/20 hover:shadow-[#1ecbe1]/35 cursor-pointer"
                            }`}
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick Scanner & Shortcuts Tip Footer */}
            <div className="p-3 rounded-xl bg-slate-100/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 text-[11px] text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-[#1ecbe1] animate-pulse shadow-[0_0_8px_#1ecbe1]"></span>
                <span className="text-slate-800 dark:text-slate-300 font-semibold">Barcode Scanner Active (any barcode auto-adds)</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <span>
                  <kbd className="text-cyan-600 dark:text-[#1ecbe1] font-bold">Enter</kbd> adds top match
                </span>
                <span>•</span>
                <span>
                  <kbd className="text-slate-800 dark:text-slate-200 font-semibold">Ctrl+Z</kbd> undo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Active Cart & Checkout (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-4 sm:p-6 shadow-xl dark:shadow-2xl backdrop-blur-2xl flex flex-col min-h-[580px]">
            {/* Cart Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3 mb-4">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Current Cart</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-50 dark:bg-white/5 text-cyan-700 dark:text-[#1ecbe1] border border-cyan-300 dark:border-[#1ecbe1]/30 font-bold">
                    {totalItemsCount} {totalItemsCount === 1 ? "item" : "items"}
                  </span>
                </h2>
              </div>

              {/* Cart Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleUndo}
                  disabled={cartHistory.length === 0}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white hover:border-[#1ecbe1]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                  title="Undo last cart action (Ctrl+Z)"
                >
                  ↩ Undo
                </button>
                <button
                  onClick={handleClearCart}
                  disabled={cart.length === 0}
                  className="px-2.5 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {checkoutError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2 backdrop-blur-md">
                <span className="text-base leading-none">⚠️</span>
                <div className="flex-1 font-semibold">{checkoutError}</div>
                <button
                  onClick={() => setCheckoutError(null)}
                  className="text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-200 font-bold ml-2"
                >
                  &times;
                </button>
              </div>
            )}

            {/* Cart Items Table */}
            <div className="flex-1 overflow-y-auto pos-scrollbar max-h-[340px] border border-slate-200 dark:border-white/10 rounded-xl bg-slate-50/50 dark:bg-white/[0.02]">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.25"
                    stroke="currentColor"
                    className="w-12 h-12 text-slate-400 dark:text-slate-600 mb-3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                    />
                  </svg>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Cart is empty</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Scan a barcode or click items from the catalog on the left.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100/95 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-2 text-right">Price</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Subtotal</th>
                      <th className="py-2.5 px-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200/80 dark:divide-white/5">
                    {cart.map((item) => {
                      const lineTotal = (parseFloat(item.product.price) * item.quantity).toFixed(2);
                      const isNearStockLimit = item.quantity >= item.product.quantity;

                      return (
                        <tr key={item.product.id} className="hover:bg-slate-100/60 dark:hover:bg-white/[0.04] transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold text-slate-900 dark:text-white">{item.product.title}</div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {item.product.isbn ? `Barcode: ${item.product.isbn}` : item.product.sku || "No Code"}
                            </div>
                            {isNearStockLimit && (
                              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                                Max stock ({item.product.quantity})
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-2 text-right font-medium text-slate-700 dark:text-slate-300">
                            Rs. {parseFloat(item.product.price).toFixed(2)}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => updateItemQuantity(item.product.id, item.quantity - 1)}
                                className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/15 active:scale-95 flex items-center justify-center text-sm font-bold transition-all"
                              >
                                &minus;
                              </button>
                              <span className="w-8 text-center font-bold text-slate-900 dark:text-white">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateItemQuantity(item.product.id, item.quantity + 1)}
                                disabled={item.quantity >= item.product.quantity}
                                className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/15 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-sm font-bold transition-all"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-cyan-600 dark:text-[#1ecbe1]">
                            Rs. {lineTotal}
                          </td>
                          <td className="py-3 px-2 text-center">
                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg p-1 text-sm font-bold transition-all"
                              title="Remove item"
                            >
                              &times;
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Bottom Checkout Section */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/10 space-y-4">
              {/* Totals Breakdown */}
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Grand Total:</span>
                <span className="text-3xl sm:text-4xl font-extrabold text-cyan-600 dark:text-[#1ecbe1] tracking-tight drop-shadow-[0_0_12px_rgba(30,203,225,0.35)]">
                  Rs. {totalAmount.toFixed(2)}
                </span>
              </div>

              {/* Payment Method Selector & Cash Tender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["cash", "card", "transfer"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold capitalize transition-all active:scale-95 ${
                          paymentMethod === method
                            ? "bg-gradient-to-r from-[#1ecbe1] to-[#06b6d4] text-slate-950 shadow-md shadow-[#1ecbe1]/30 font-extrabold"
                            : "bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {paymentMethod === "cash" && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                      Cash Tendered
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="10"
                        placeholder="Amount received..."
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/70 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-[#1ecbe1] focus:outline-none backdrop-blur-md"
                      />
                    </div>
                    {tenderedNum > 0 && (
                      <div className="flex justify-between text-[11px] mt-1 px-1">
                        <span className="text-slate-500 dark:text-slate-400">Change Due:</span>
                        <span
                          className={`font-bold ${
                            tenderedNum >= totalAmount ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                          }`}
                        >
                          Rs. {changeDue.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Complete Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full py-4 px-4 rounded-2xl font-extrabold text-base tracking-wide bg-gradient-to-r from-[#1ecbe1] via-[#38d8ec] to-[#06b6d4] text-slate-950 hover:brightness-110 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed shadow-xl shadow-[#1ecbe1]/30 hover:shadow-[#1ecbe1]/50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-slate-950"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span>Processing Sale Transaction...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Sale &bull; Rs. {totalAmount.toFixed(2)}</span>
                    <span className="text-xs opacity-75 font-normal">(Ctrl+Enter)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation & Printable Receipt Modal */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-3xl border border-slate-200 dark:border-white/15 bg-white/95 dark:bg-slate-950/85 backdrop-blur-2xl p-6 shadow-2xl dark:shadow-cyan-950/40 animate-fade-in text-slate-900 dark:text-slate-100">
            {/* Header / Success Icon */}
            <div className="text-center pb-4 border-b border-slate-200 dark:border-white/10 no-print">
              <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1ecbe1]/15 text-[#1ecbe1] border border-[#1ecbe1]/30 shadow-lg shadow-[#1ecbe1]/20">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  className="w-7 h-7"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">Sale Completed Successfully!</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Inventory updated and audit movement logged.</p>
            </div>

            {/* Receipt Card (Printed via #printable-receipt) */}
            <div
              id="printable-receipt"
              className="my-4 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/40 font-mono text-xs text-slate-800 dark:text-slate-200 space-y-3 backdrop-blur-sm"
            >
              <div className="text-center border-b border-dashed border-slate-300 dark:border-white/15 pb-3">
                <h4 className="text-sm font-extrabold tracking-wider uppercase text-slate-900 dark:text-white">
                  Sharthri Bookshop
                </h4>
                <p className="text-[10px] text-cyan-600 dark:text-[#1ecbe1] font-bold">Point of Sale Receipt</p>
                <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 flex justify-between">
                  <span>Sale #{completedSale.sale.id}</span>
                  <span>{new Date(completedSale.sale.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 flex justify-between">
                  <span>Cashier: {completedSale.sale.cashierName}</span>
                  <span>Payment: {completedSale.paymentMethod || "CASH"}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-dashed divide-slate-200 dark:divide-white/10 py-1">
                {completedSale.items.map((item) => (
                  <div key={item.id} className="py-1.5 flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900 dark:text-white">{item.title}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {item.quantity} &times; Rs. {parseFloat(item.unitPrice).toFixed(2)}
                      </div>
                    </div>
                    <div className="font-bold text-cyan-600 dark:text-[#1ecbe1]">Rs. {item.lineTotal}</div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-dashed border-slate-300 dark:border-white/15 pt-2 space-y-1">
                <div className="flex justify-between font-extrabold text-sm text-cyan-700 dark:text-[#1ecbe1] pt-1 border-t border-slate-200 dark:border-white/10">
                  <span>TOTAL:</span>
                  <span>Rs. {parseFloat(completedSale.sale.total).toFixed(2)}</span>
                </div>
                {completedSale.tendered && (
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Cash Tendered:</span>
                    <span>Rs. {completedSale.tendered}</span>
                  </div>
                )}
                {completedSale.change && (
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Change Due:</span>
                    <span>Rs. {completedSale.change}</span>
                  </div>
                )}
              </div>

              <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-dashed border-slate-200 dark:border-white/10">
                Thank you for your purchase!
              </div>
            </div>

            {/* Actions: Print and New Sale */}
            <div className="grid grid-cols-2 gap-3 pt-2 no-print">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-3 px-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-800 dark:text-white hover:bg-slate-200 dark:hover:bg-white/10 hover:border-[#1ecbe1]/40 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="w-4 h-4 text-cyan-600 dark:text-[#1ecbe1]"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.75A2.25 2.25 0 0015.75 1.5h-7.5A2.25 2.25 0 006 3.75v3.456"
                  />
                </svg>
                <span>Print Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCompletedSale(null);
                  searchInputRef.current?.focus();
                }}
                className="py-3 px-3 rounded-xl bg-gradient-to-r from-[#1ecbe1] to-[#06b6d4] text-xs font-extrabold text-slate-950 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#1ecbe1]/30 cursor-pointer"
              >
                <span>New Sale</span>
                <span className="text-[10px] opacity-80">(Space)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout History Modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 dark:bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl rounded-3xl border border-slate-200 dark:border-white/15 bg-white/95 dark:bg-slate-950/85 backdrop-blur-2xl p-6 shadow-2xl dark:shadow-cyan-950/40 animate-fade-in text-slate-900 dark:text-slate-100 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Cashier Checkout History</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-[#1ecbe1]/20 text-cyan-800 dark:text-[#1ecbe1] font-bold border border-cyan-300 dark:border-[#1ecbe1]/40 shadow-sm shadow-[#1ecbe1]/10">
                    {checkoutHistory.length} Recorded
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  View past completed sales transactions, details, and reprint receipts.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={loadCheckoutHistory}
                  disabled={historyLoading}
                  className="p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 hover:border-[#1ecbe1]/40 active:scale-95 transition-all text-xs cursor-pointer"
                  title="Refresh history"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                    className={`h-4 w-4 text-cyan-600 dark:text-[#1ecbe1] ${historyLoading ? "animate-spin" : ""}`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/10 dark:hover:text-white transition-all cursor-pointer"
                >
                  <span className="text-xl leading-none">&times;</span>
                </button>
              </div>
            </div>

            {/* Filter Input */}
            <div className="mt-4 mb-3">
              <input
                type="text"
                placeholder="Filter by Sale ID, item title, or Cashier..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100/70 dark:bg-white/[0.04] px-3.5 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-[#1ecbe1] focus:outline-none backdrop-blur-md"
              />
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto pos-scrollbar space-y-3 pr-1 min-h-[240px]">
              {historyLoading ? (
                <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1ecbe1] border-t-transparent" />
                  <span>Loading checkout records...</span>
                </div>
              ) : checkoutHistory.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-500 dark:text-slate-400">
                  No checkouts recorded yet. Process sales in the terminal to view history here.
                </div>
              ) : (
                (() => {
                  const query = historySearch.toLowerCase().trim();
                  const filtered = checkoutHistory.filter((s) => {
                    const sale = s.sale || (s as any);
                    if (!sale || !sale.id) return false;
                    if (!query) return true;
                    if (`#${sale.id}`.includes(query) || `${sale.id}`.includes(query)) return true;
                    if ((sale.cashierName || "").toLowerCase().includes(query)) return true;
                    return (s.items || []).some(
                      (item) =>
                        (item.title || "").toLowerCase().includes(query) ||
                        (item.isbn && item.isbn.includes(query))
                    );
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                        No checkouts matched "{historySearch}".
                      </div>
                    );
                  }

                  return filtered.map((record) => {
                    const sale = record.sale || (record as any);
                    const items = record.items || [];
                    const itemCount = items.reduce((acc, it) => acc + (it.quantity || 1), 0);
                    return (
                      <div
                        key={sale.id}
                        className="rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.03] backdrop-blur-md p-4 hover:border-[#1ecbe1]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-full bg-cyan-100 dark:bg-[#1ecbe1]/15 text-cyan-800 dark:text-[#1ecbe1] border border-cyan-300 dark:border-[#1ecbe1]/30">
                              Sale #{sale.id}
                            </span>
                            <span className="text-xs text-slate-900 dark:text-white font-semibold">
                              Cashier: {sale.cashierName || "Cashier"}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {sale.createdAt ? new Date(sale.createdAt).toLocaleString() : ""}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 dark:text-slate-300 truncate">
                            <span className="text-slate-900 dark:text-white font-semibold">{itemCount} items:</span>{" "}
                            {items.map((it) => `${it.title} (x${it.quantity})`).join(", ")}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-extrabold text-cyan-600 dark:text-[#1ecbe1]">
                              Rs. {parseFloat(sale.total || "0").toFixed(2)}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                              {record.paymentMethod || "CASH"}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setCompletedSale({
                                sale,
                                items,
                                paymentMethod: record.paymentMethod || "CASH",
                              });
                              setHistoryOpen(false);
                            }}
                            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 text-xs font-bold text-slate-800 dark:text-white hover:bg-gradient-to-r hover:from-[#1ecbe1] hover:to-[#06b6d4] hover:text-slate-950 hover:border-transparent transition-all flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                              stroke="currentColor"
                              className="h-3.5 w-3.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.75A2.25 2.25 0 0015.75 1.5h-7.5A2.25 2.25 0 006 3.75v3.456"
                              />
                            </svg>
                            <span>Receipt</span>
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 dark:border-white/10 pt-3 mt-3 flex justify-end">
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                className="py-2 px-4 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-white/10 dark:text-white dark:hover:bg-white/20 active:scale-95 transition-all cursor-pointer font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


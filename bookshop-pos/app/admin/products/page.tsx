"use client";

import { useEffect, useState, useTransition } from "react";
import "./products.css";

interface Product {
  id: number;
  title: string;
  author: string | null;
  isbn: string | null;
  sku: string | null;
  category: string | null;
  price: string;
  cost: string | null;
  quantity: number;
  reorderThreshold: number;
  createdAt: string;
  updatedAt: string;
}

interface StockMovement {
  id: number;
  productId: number;
  change: number;
  reason: "sale" | "restock" | "adjustment" | "return";
  note: string | null;
  relatedSaleId: number | null;
  createdAt: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form states & errors
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    isbn: "",
    sku: "",
    category: "",
    price: "",
    cost: "",
    quantity: 0,
    reorderThreshold: 3,
  });

  const [adjustData, setAdjustData] = useState<{
    change: number;
    reason: "restock" | "adjustment" | "return";
    note: string;
  }>({
    change: 1,
    reason: "restock",
    note: "",
  });

  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }

  // Fetch products
  async function fetchProducts() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
      if (lowStockOnly) params.set("lowStock", "true");

      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load products");
      const data = await res.json();
      setProducts(data.products || []);
      setCategories(data.categories || []);
    } catch (err: any) {
      console.error(err);
      showToast("Error loading products: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, lowStockOnly]);

  // Open Add Modal
  function handleOpenAdd() {
    setFormData({
      title: "",
      author: "",
      isbn: "",
      sku: "",
      category: "",
      price: "",
      cost: "",
      quantity: 0,
      reorderThreshold: 3,
    });
    setFormError("");
    setShowAddModal(true);
  }

  // Open Edit Modal
  function handleOpenEdit(product: Product) {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      author: product.author || "",
      isbn: product.isbn || "",
      sku: product.sku || "",
      category: product.category || "",
      price: product.price,
      cost: product.cost || "",
      quantity: product.quantity,
      reorderThreshold: product.reorderThreshold,
    });
    setFormError("");
  }

  // Open Adjust Modal
  function handleOpenAdjust(product: Product) {
    setAdjustingProduct(product);
    setAdjustData({
      change: 1,
      reason: "restock",
      note: "",
    });
    setFormError("");
  }

  // Open History Modal
  async function handleOpenHistory(product: Product) {
    setHistoryProduct(product);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/products/${product.id}`);
      if (!res.ok) throw new Error("Failed to fetch history");
      const data = await res.json();
      setMovements(data.movements || []);
    } catch (err: any) {
      showToast("Error fetching history: " + err.message);
    } finally {
      setHistoryLoading(false);
    }
  }

  // Submit Add Product
  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          author: formData.author || null,
          isbn: formData.isbn || null,
          sku: formData.sku || null,
          category: formData.category || null,
          price: formData.price,
          cost: formData.cost || null,
          quantity: Number(formData.quantity) || 0,
          reorderThreshold: Number(formData.reorderThreshold) || 3,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      showToast(`Product "${formData.title}" added successfully!`);
      setShowAddModal(false);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Submit Edit Product
  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct) return;
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          author: formData.author || null,
          isbn: formData.isbn || null,
          sku: formData.sku || null,
          category: formData.category || null,
          price: formData.price,
          cost: formData.cost || null,
          reorderThreshold: Number(formData.reorderThreshold) || 3,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update product");
      }

      showToast(`Product "${formData.title}" updated successfully!`);
      setEditingProduct(null);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  // Submit Stock Adjustment
  async function handleAdjustSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustingProduct) return;
    setFormError("");
    setSubmitting(true);

    try {
      const res = await fetch(`/api/products/${adjustingProduct.id}/adjust-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          change: Number(adjustData.change),
          reason: adjustData.reason,
          note: adjustData.note || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to adjust stock");
      }

      showToast(
        `Stock updated! New quantity for ${adjustingProduct.title}: ${data.product.quantity}`
      );
      setAdjustingProduct(null);
      fetchProducts();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => p.quantity <= p.reorderThreshold).length;

  return (
    <div className="products-page space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-amber-500/30 bg-slate-900/95 px-4 py-3 text-sm font-medium text-amber-200 shadow-xl shadow-black/50 backdrop-blur-md animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Header & Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            Inventory & Stock Management
            <span className="rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-300 border border-slate-700">
              {totalProducts} products
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor on-hand quantities, adjust stock audit trails, and manage book catalogue.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-primary self-start sm:self-auto cursor-pointer"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
          </svg>
          Add New Product
        </button>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/20 text-red-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-white">
                {lowStockCount} {lowStockCount === 1 ? "product requires" : "products require"} reordering
              </p>
              <p className="text-xs text-red-300">
                Stock is at or below defined reorder thresholds. Restock soon to prevent stockouts.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className="rounded-lg border border-red-500/40 bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-500/30 transition-colors"
          >
            {lowStockOnly ? "Show All Items" : "Filter Low Stock"}
          </button>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="card-glass p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, author, ISBN, or SKU..."
              className="input-dark pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-dark w-auto min-w-[150px] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Low stock toggle */}
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
                lowStockOnly
                  ? "border-red-500/50 bg-red-500/20 text-red-200"
                  : "border-white/10 bg-slate-800/60 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  lowStockOnly ? "bg-red-400 animate-pulse" : "bg-slate-500"
                }`}
              />
              Low Stock Only
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card-glass overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-white/10 bg-slate-900/80 text-xs uppercase font-semibold tracking-wider text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">ISBN / SKU</th>
                <th className="px-5 py-3.5 text-right">Price (LKR)</th>
                <th className="px-5 py-3.5 text-center">Stock Level</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                      <span>Loading products...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="h-8 w-8 text-slate-500"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                        />
                      </svg>
                      <span className="text-base font-semibold text-slate-300">No products found</span>
                      <span className="text-xs text-slate-500">
                        {searchQuery || selectedCategory !== "all" || lowStockOnly
                          ? "Try adjusting your search or filters."
                          : "Start by adding your first product to the catalogue."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isLowStock = product.quantity <= product.reorderThreshold;

                  return (
                    <tr
                      key={product.id}
                      className={`table-row-hover ${
                        isLowStock ? "table-row-lowstock" : ""
                      }`}
                    >
                      {/* Product Title & Author */}
                      <td className="px-5 py-4">
                        <div className="font-semibold text-white">{product.title}</div>
                        <div className="text-xs text-slate-400">
                          {product.author ? `by ${product.author}` : "—"}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4">
                        {product.category ? (
                          <span className="badge-category rounded-md px-2 py-0.5 text-xs font-medium">
                            {product.category}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>

                      {/* ISBN / SKU */}
                      <td className="px-5 py-4">
                        {product.isbn && (
                          <div className="font-mono text-xs text-slate-300">
                            <span className="text-slate-500 mr-1">ISBN:</span>
                            {product.isbn}
                          </div>
                        )}
                        {product.sku && (
                          <div className="font-mono text-xs text-slate-400">
                            <span className="text-slate-500 mr-1">SKU:</span>
                            {product.sku}
                          </div>
                        )}
                        {!product.isbn && !product.sku && (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>

                      {/* Price & Cost */}
                      <td className="px-5 py-4 text-right">
                        <div className="font-semibold text-white">
                          Rs. {parseFloat(product.price).toFixed(2)}
                        </div>
                        {product.cost && (
                          <div className="text-[11px] text-slate-400">
                            Cost: Rs. {parseFloat(product.cost).toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Stock Level */}
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              isLowStock ? "badge-lowstock" : "badge-instock"
                            }`}
                          >
                            {product.quantity} in stock
                          </span>
                          <span className="mt-1 text-[10px] text-slate-400">
                            Alert at ≤ {product.reorderThreshold}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Adjust Stock */}
                          <button
                            onClick={() => handleOpenAdjust(product)}
                            className="btn-action-sm bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25"
                            title="Adjust inventory quantity"
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
                                d="M12 6v12m6-6H6"
                              />
                            </svg>
                            Adjust Stock
                          </button>

                          {/* Edit Details */}
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="btn-action-sm bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700"
                            title="Edit product details"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.75"
                              stroke="currentColor"
                              className="h-3.5 w-3.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                              />
                            </svg>
                            Edit
                          </button>

                          {/* History */}
                          <button
                            onClick={() => handleOpenHistory(product)}
                            className="btn-action-sm bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800 hover:text-slate-200"
                            title="View stock history log"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                              strokeWidth="1.75"
                              stroke="currentColor"
                              className="h-3.5 w-3.5"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            History
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ADD PRODUCT MODAL */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-panel p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Add New Product</h2>
                <p className="text-xs text-slate-400">Fill in product information and pricing</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-lg bg-red-500/15 border border-red-500/30 p-3 text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Book / Product Title <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Harry Potter and the Philosopher's Stone"
                  className="input-dark"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Author</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    placeholder="e.g. J.K. Rowling"
                    className="input-dark"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Fiction, Education"
                    className="input-dark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    ISBN (Barcode)
                  </label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    placeholder="e.g. 9780747532699"
                    className="input-dark font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    SKU (Internal Code)
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. BK-FIC-001"
                    className="input-dark font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Selling Price (LKR) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="1500.00"
                    className="input-dark"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Purchase Cost (LKR)
                  </label>
                  <input
                    type="text"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="950.00 (optional)"
                    className="input-dark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Stock Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                    }
                    className="input-dark"
                  />
                  <span className="text-[10px] text-slate-500">
                    Logged automatically as initial restock movement.
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Reorder Alert Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.reorderThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reorderThreshold: parseInt(e.target.value) || 0,
                      })
                    }
                    className="input-dark"
                  />
                  <span className="text-[10px] text-slate-500">Triggers low-stock alert</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EDIT PRODUCT MODAL */}
      {/* ========================================================= */}
      {editingProduct && (
        <div className="modal-backdrop">
          <div className="modal-panel p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Edit Product Details</h2>
                <p className="text-xs text-slate-400">{editingProduct.title}</p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-lg bg-red-500/15 border border-red-500/30 p-3 text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Book / Product Title <span className="text-amber-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-dark"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Author</label>
                  <input
                    type="text"
                    value={formData.author}
                    onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                    className="input-dark"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-dark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ISBN</label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="input-dark font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="input-dark font-mono text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Selling Price (LKR) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input-dark"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Purchase Cost (LKR)
                  </label>
                  <input
                    type="text"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="input-dark"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reorder Threshold
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.reorderThreshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      reorderThreshold: parseInt(e.target.value) || 0,
                    })
                  }
                  className="input-dark"
                />
              </div>

              <div className="rounded-lg border border-white/10 bg-slate-800/40 p-3 text-xs text-slate-400">
                💡 <span className="font-semibold text-slate-300">Note:</span> Stock quantity cannot be edited directly here. Use the <strong className="text-amber-400">"Adjust Stock"</strong> button on the inventory table to maintain the audit trail.
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADJUST STOCK MODAL */}
      {/* ========================================================= */}
      {adjustingProduct && (
        <div className="modal-backdrop">
          <div className="modal-panel p-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Adjust Stock Quantity</h2>
                <p className="text-xs text-slate-400">{adjustingProduct.title}</p>
              </div>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 rounded-lg bg-red-500/15 border border-red-500/30 p-3 text-xs text-red-300">
                {formError}
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-4">
              {/* Current vs New preview */}
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-white/10 bg-slate-800/50 p-3.5 text-center">
                <div>
                  <span className="block text-[11px] uppercase font-semibold text-slate-400">
                    Current Stock
                  </span>
                  <span className="text-xl font-bold text-white">
                    {adjustingProduct.quantity}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] uppercase font-semibold text-slate-400">
                    New Stock Preview
                  </span>
                  <span
                    className={`text-xl font-bold ${
                      adjustingProduct.quantity + (adjustData.change || 0) < 0
                        ? "text-red-400"
                        : "text-amber-400"
                    }`}
                  >
                    {adjustingProduct.quantity + (adjustData.change || 0)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Reason for Adjustment <span className="text-amber-400">*</span>
                </label>
                <select
                  value={adjustData.reason}
                  onChange={(e) =>
                    setAdjustData({
                      ...adjustData,
                      reason: e.target.value as "restock" | "adjustment" | "return",
                    })
                  }
                  className="input-dark cursor-pointer"
                >
                  <option value="restock">Restock (New inventory received)</option>
                  <option value="adjustment">Manual Adjustment (Damage / Loss / Count Fix)</option>
                  <option value="return">Customer Return</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Quantity Delta (+ or -) <span className="text-amber-400">*</span>
                </label>
                <input
                  type="number"
                  required
                  value={adjustData.change}
                  onChange={(e) =>
                    setAdjustData({
                      ...adjustData,
                      change: parseInt(e.target.value) || 0,
                    })
                  }
                  className="input-dark"
                />
                <span className="text-[10px] text-slate-400">
                  Enter positive number (e.g. 10) to add stock, or negative (e.g. -2) to reduce stock.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Audit Note (Optional)
                </label>
                <input
                  type="text"
                  value={adjustData.note}
                  onChange={(e) => setAdjustData({ ...adjustData, note: e.target.value })}
                  placeholder="e.g. Batch #498 received from publisher, or Water damage on 1 copy"
                  className="input-dark"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={
                    submitting ||
                    adjustData.change === 0 ||
                    adjustingProduct.quantity + adjustData.change < 0
                  }
                >
                  {submitting ? "Processing..." : "Confirm Stock Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STOCK MOVEMENT HISTORY MODAL */}
      {/* ========================================================= */}
      {historyProduct && (
        <div className="modal-backdrop">
          <div className="modal-panel p-6 max-w-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Stock Movement History</h2>
                <p className="text-xs text-slate-400">{historyProduct.title}</p>
              </div>
              <button
                onClick={() => setHistoryProduct(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              {historyLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" />
                    <span>Loading audit log...</span>
                  </div>
                </div>
              ) : movements.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-sm">No stock movements recorded for this product yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {movements.map((m) => {
                    const isPositive = m.change > 0;
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-slate-800/40 p-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded px-2 py-0.5 font-bold uppercase text-[10px] ${
                                m.reason === "sale"
                                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                                  : m.reason === "restock"
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : m.reason === "return"
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                  : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              }`}
                            >
                              {m.reason}
                            </span>
                            {m.relatedSaleId && (
                              <span className="text-slate-400 font-mono text-[11px]">
                                Sale #{m.relatedSaleId}
                              </span>
                            )}
                            <span className="text-slate-500 text-[11px]">
                              {new Date(m.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {m.note && <div className="text-slate-300 italic">{m.note}</div>}
                        </div>

                        <div
                          className={`text-sm font-bold font-mono ${
                            isPositive ? "text-emerald-400" : "text-red-400"
                          }`}
                        >
                          {isPositive ? `+${m.change}` : m.change}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-end pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setHistoryProduct(null)}
                className="btn-secondary"
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

"use client";

import { useEffect, useState, useTransition } from "react";
import "./products.css";

interface Product {
  id: number;
  title: string;
  author: string | null; // Used for Brand / Manufacturer (e.g. Atlas, Munchee, Nataraj)
  isbn: string | null; // Used for Barcode (EAN / UPC / Barcode)
  sku: string | null; // Internal SKU / Code
  category: string | null;
  price: string;
  cost: string | null;
  quantity: number;
  reorderThreshold: number;
  isActive?: boolean;
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

const COMMON_CATEGORIES = [
  "Writing Books",
  "Pens & Writing",
  "Stationery Supplies",
  "Food & Snacks",
  "Beverages",
  "General",
];

const COMMON_BRANDS = [
  "Atlas",
  "Promate",
  "Nataraj",
  "Cello",
  "Pilot",
  "DSI",
  "Munchee",
  "Maliban",
  "Elephant House",
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"active" | "archived" | "all">("active");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [historyProduct, setHistoryProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Form states & errors
  const [formData, setFormData] = useState({
    title: "",
    author: "", // Brand / Manufacturer
    isbn: "", // Barcode
    sku: "",
    category: "Writing Books",
    price: "",
    cost: "",
    quantity: 0,
    reorderThreshold: 5,
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
      params.set("status", statusFilter);

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
  }, [searchQuery, selectedCategory, lowStockOnly, statusFilter]);

  // Open Add Modal
  function handleOpenAdd() {
    setFormData({
      title: "",
      author: "",
      isbn: "",
      sku: "",
      category: "Writing Books",
      price: "",
      cost: "",
      quantity: 0,
      reorderThreshold: 5,
    });
    setFormError("");
    setShowAddModal(true);
  }

  // Quick Preset Helper for Add Form
  function applyPreset(
    type: "CR" | "B5" | "XE" | "PEN" | "SNACK" | "DRINK"
  ) {
    if (type === "CR") {
      setFormData((prev) => ({
        ...prev,
        category: "Writing Books",
        author: prev.author || "Atlas",
        title: prev.title ? prev.title : "CR Book 120 Pages Single Rule",
        sku: prev.sku || "CR-120-SR",
        price: prev.price || "280.00",
        cost: prev.cost || "220.00",
      }));
    } else if (type === "B5") {
      setFormData((prev) => ({
        ...prev,
        category: "Writing Books",
        author: prev.author || "Atlas",
        title: prev.title ? prev.title : "B5 Book 120 Pages Single Rule",
        sku: prev.sku || "B5-120-SR",
        price: prev.price || "220.00",
        cost: prev.cost || "170.00",
      }));
    } else if (type === "XE") {
      setFormData((prev) => ({
        ...prev,
        category: "Writing Books",
        author: prev.author || "Atlas",
        title: prev.title ? prev.title : "Exercise Book (XE) 80 Pages Single Rule",
        sku: prev.sku || "XE-80-SR",
        price: prev.price || "140.00",
        cost: prev.cost || "105.00",
      }));
    } else if (type === "PEN") {
      setFormData((prev) => ({
        ...prev,
        category: "Pens & Writing",
        author: prev.author || "Atlas",
        title: prev.title ? prev.title : "Chooty Ballpoint Pen (Blue)",
        sku: prev.sku || "PEN-BLUE-01",
        price: prev.price || "30.00",
        cost: prev.cost || "22.00",
      }));
    } else if (type === "SNACK") {
      setFormData((prev) => ({
        ...prev,
        category: "Food & Snacks",
        author: prev.author || "Munchee",
        title: prev.title ? prev.title : "Chocolate Puff 100g",
        sku: prev.sku || "SNK-CHOC-100",
        price: prev.price || "180.00",
        cost: prev.cost || "150.00",
      }));
    } else if (type === "DRINK") {
      setFormData((prev) => ({
        ...prev,
        category: "Beverages",
        author: prev.author || "Elephant House",
        title: prev.title ? prev.title : "Ginger Beer (EGB) 300ml",
        sku: prev.sku || "BEV-EGB-300",
        price: prev.price || "150.00",
        cost: prev.cost || "120.00",
      }));
    }
  }

  // Append specification tag into Title (e.g. "CR", "160 Pages", "Square Rule")
  function appendSpecToTitle(spec: string) {
    setFormData((prev) => {
      const current = prev.title.trim();
      if (!current) return { ...prev, title: spec };
      if (current.includes(spec)) return prev;
      return { ...prev, title: `${current} ${spec}` };
    });
  }

  // Open Edit Modal
  function handleOpenEdit(product: Product) {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      author: product.author || "",
      isbn: product.isbn || "",
      sku: product.sku || "",
      category: product.category || "Writing Books",
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

  // Delete / Remove Product
  async function handleDeleteProduct() {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${deletingProduct.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove product");
      showToast(data.message || `Item "${deletingProduct.title}" removed.`);
      setDeletingProduct(null);
      fetchProducts();
    } catch (err: any) {
      showToast("Error: " + err.message);
    } finally {
      setIsDeleting(false);
    }
  }

  // Restore Product
  async function handleRestoreProduct(product: Product) {
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: product.title,
          author: product.author,
          isbn: product.isbn,
          sku: product.sku,
          category: product.category,
          price: product.price,
          cost: product.cost,
          reorderThreshold: product.reorderThreshold,
          isActive: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to restore product");
      showToast(`Item "${product.title}" restored to active inventory.`);
      fetchProducts();
    } catch (err: any) {
      showToast("Error: " + err.message);
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

      showToast(`Item "${formData.title}" added to inventory!`);
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

      showToast(`Item "${formData.title}" updated successfully!`);
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
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-[#1ecbe1]/40 bg-slate-900/95 px-5 py-3 text-sm font-bold text-[#1ecbe1] shadow-2xl shadow-[#1ecbe1]/20 backdrop-blur-xl animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* Header & Stats */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
            Stationery & Inventory Items
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {totalProducts} items
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Writing books (CR, B5, XE), pens, office supplies, food & beverages.
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
          Add New Item
        </button>
      </div>

      {/* Low Stock Warning Banner if any */}
      {lowStockCount > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-800 dark:text-red-200">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/20 text-red-500 dark:text-red-400">
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
              <p className="font-semibold text-slate-900 dark:text-white">
                {lowStockCount} {lowStockCount === 1 ? "item requires" : "items require"} reordering
              </p>
              <p className="text-xs text-red-600 dark:text-red-300">
                Stock is at or below reorder threshold. Restock to prevent inventory depletion.
              </p>
            </div>
          </div>
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className="rounded-lg border border-red-500/40 bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-900 dark:text-white hover:bg-red-500/30 transition-colors cursor-pointer"
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
              placeholder="Search by item name, brand (Atlas, Munchee...), barcode, or SKU..."
              className="input-dark pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="input-dark w-auto min-w-[130px] cursor-pointer"
            >
              <option value="active">Active Items</option>
              <option value="archived">Archived / Removed</option>
              <option value="all">All Items</option>
            </select>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-dark w-auto min-w-[170px] cursor-pointer"
            >
              <option value="all">All Categories</option>
              {Array.from(new Set([...COMMON_CATEGORIES, ...categories])).map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Low stock toggle */}
            <button
              onClick={() => setLowStockOnly(!lowStockOnly)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${lowStockOnly
                  ? "border-red-500/50 bg-red-500/20 text-red-700 dark:text-red-200 font-bold"
                  : "border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${lowStockOnly ? "bg-red-500 animate-pulse" : "bg-slate-400"
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
          <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
            <thead className="border-b border-slate-200 dark:border-white/10 bg-slate-100/90 dark:bg-slate-900/80 text-xs uppercase font-semibold tracking-wider text-slate-600 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Item Name & Brand</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Barcode / Code</th>
                <th className="px-5 py-3.5 text-right">Price (Rs.)</th>
                <th className="px-5 py-3.5 text-center">Stock Level</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1ecbe1] border-t-transparent" />
                      <span>Loading inventory...</span>
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
                        className="h-8 w-8 text-slate-400 dark:text-slate-500"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"
                        />
                      </svg>
                      <span className="text-base font-semibold text-slate-700 dark:text-slate-300">No items found</span>
                      <span className="text-xs text-slate-500">
                        {searchQuery || selectedCategory !== "all" || lowStockOnly
                          ? "Try adjusting your search or filters."
                          : "Start by adding your first stationery or food item."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isLowStock = product.quantity <= product.reorderThreshold;
                  const isArchived = product.isActive === false;

                  return (
                    <tr
                      key={product.id}
                      className={`table-row-hover ${isLowStock ? "table-row-lowstock" : ""
                        } ${isArchived ? "opacity-60 bg-slate-200/50 dark:bg-slate-950/40" : ""}`}
                    >
                      {/* Item Name & Brand */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">{product.title}</span>
                          {isArchived && (
                            <span className="rounded bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/30 px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider">
                              Archived
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {product.author ? `Brand: ${product.author}` : "Generic / Unbranded"}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4">
                        {product.category ? (
                          <span className="badge-category rounded-md px-2 py-0.5 text-xs font-medium">
                            {product.category}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Barcode / SKU */}
                      <td className="px-5 py-4">
                        {product.isbn && (
                          <div className="font-mono text-xs text-slate-700 dark:text-slate-300">
                            <span className="text-slate-400 mr-1">Barcode:</span>
                            {product.isbn}
                          </div>
                        )}
                        {product.sku && (
                          <div className="font-mono text-xs text-slate-500 dark:text-slate-400">
                            <span className="text-slate-400 mr-1">Code:</span>
                            {product.sku}
                          </div>
                        )}
                        {!product.isbn && !product.sku && (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      {/* Price & Cost */}
                      <td className="px-5 py-4 text-right">
                        <div className="font-extrabold text-cyan-700 dark:text-[#1ecbe1]">
                          Rs. {parseFloat(product.price).toFixed(2)}
                        </div>
                        {product.cost && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Cost: Rs. {parseFloat(product.cost).toFixed(2)}
                          </div>
                        )}
                      </td>

                      {/* Stock Level */}
                      <td className="px-5 py-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${isLowStock ? "badge-lowstock" : "badge-instock"
                              }`}
                          >
                            {product.quantity} in stock
                          </span>
                          <span className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                            Alert at ≤ {product.reorderThreshold}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {/* Adjust Stock */}
                          {!isArchived && (
                            <button
                              onClick={() => handleOpenAdjust(product)}
                              className="btn-action-sm bg-cyan-100 dark:bg-[#1ecbe1]/15 text-cyan-800 dark:text-[#1ecbe1] border border-cyan-300 dark:border-[#1ecbe1]/30 hover:bg-cyan-200 dark:hover:bg-[#1ecbe1]/25 active:scale-95 transition-all"
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
                              Adjust
                            </button>
                          )}

                          {/* Edit Details */}
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="btn-action-sm bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                            title="Edit item details"
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
                            className="btn-action-sm bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
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

                          {/* Remove / Restore Action */}
                          {!isArchived ? (
                            <button
                              onClick={() => setDeletingProduct(product)}
                              className="btn-action-sm bg-rose-100 dark:bg-red-500/10 text-rose-700 dark:text-red-300 border border-rose-300 dark:border-red-500/30 hover:bg-rose-200 dark:hover:bg-red-500/20"
                              title="Remove item"
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
                                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                                />
                              </svg>
                              Remove
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRestoreProduct(product)}
                              className="btn-action-sm bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 hover:bg-emerald-200 dark:hover:bg-emerald-500/20"
                              title="Restore to active inventory"
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
                                  d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3"
                                />
                              </svg>
                              Restore
                            </button>
                          )}
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
      {/* REMOVE / DELETE CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {deletingProduct && (
        <div className="modal-backdrop">
          <div className="modal-panel p-6 max-w-md">
            <div className="flex items-center gap-3 text-red-400 mb-3">
              <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Remove Item</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Confirm inventory removal</p>
              </div>
            </div>

            <div className="rounded-xl bg-slate-100 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-3.5 my-4 text-xs space-y-1.5">
              <div className="font-semibold text-slate-900 dark:text-slate-200">{deletingProduct.title}</div>
              <div className="text-slate-500 dark:text-slate-400">
                {deletingProduct.author ? `Brand: ${deletingProduct.author}` : "Generic"} &bull; Stock: {deletingProduct.quantity}
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
              Are you sure you want to remove this item? If it has previous sales transactions, it will be safely deactivated and archived so that sales history and receipts remain intact.
            </p>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 dark:border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {isDeleting ? "Removing..." : "Confirm Remove"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD ITEM MODAL */}
      {/* ========================================================= */}
      {showAddModal && (
        <div className="modal-backdrop">
          <div className="modal-panel p-6 max-w-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Add New Stationery / Item</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">Writing books (CR, B5, XE), pens, food & snacks</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick Presets Bar */}
            <div className="my-4 p-3.5 rounded-2xl border border-[#1ecbe1]/25 bg-[#1ecbe1]/5 backdrop-blur-md">
              <div className="text-[11px] font-bold text-[#1ecbe1] uppercase tracking-wider mb-2">
                Quick Category Templates:
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => applyPreset("CR")}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:bg-gradient-to-r hover:from-[#1ecbe1] hover:to-[#06b6d4] hover:text-slate-950 transition-all border border-slate-200 dark:border-white/10 active:scale-95 cursor-pointer"
                >
                  📘 CR Book
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("B5")}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:bg-gradient-to-r hover:from-[#1ecbe1] hover:to-[#06b6d4] hover:text-slate-950 transition-all border border-slate-200 dark:border-white/10 active:scale-95 cursor-pointer"
                >
                  📗 B5 Book
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("XE")}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:bg-gradient-to-r hover:from-[#1ecbe1] hover:to-[#06b6d4] hover:text-slate-950 transition-all border border-slate-200 dark:border-white/10 active:scale-95 cursor-pointer"
                >
                  📙 XE (Exercise)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("PEN")}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:bg-gradient-to-r hover:from-[#1ecbe1] hover:to-[#06b6d4] hover:text-slate-950 transition-all border border-slate-200 dark:border-white/10 active:scale-95 cursor-pointer"
                >
                  🖊️ Pen / Pencil
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("SNACK")}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:bg-gradient-to-r hover:from-[#1ecbe1] hover:to-[#06b6d4] hover:text-slate-950 transition-all border border-slate-200 dark:border-white/10 active:scale-95 cursor-pointer"
                >
                  🍪 Food / Snack
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset("DRINK")}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:bg-gradient-to-r hover:from-[#1ecbe1] hover:to-[#06b6d4] hover:text-slate-950 transition-all border border-slate-200 dark:border-white/10 active:scale-95 cursor-pointer"
                >
                  🥤 Beverage
                </button>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300 backdrop-blur-md">
                  {formError}
                </div>
              )}

              {/* Category */}
              <div>
                <label className="label-dark">Category *</label>
                <div className="flex gap-2">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-dark cursor-pointer flex-1"
                  >
                    {COMMON_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="Other">Other / Custom</option>
                  </select>
                </div>
              </div>

              {/* Writing Book Specification Helper Chips */}
              {formData.category.includes("Writing Books") && (
                <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 space-y-2 text-xs backdrop-blur-md">
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-300">
                    Click to add specification to Item Name:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 py-1 mr-1 font-semibold">Book Type:</span>
                    {["CR Book", "B5 Book", "XE Exercise", "Drawing Book"].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => appendSpecToTitle(chip)}
                        className="px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-white/5 text-cyan-700 dark:text-[#1ecbe1] hover:bg-slate-300 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 text-[11px] active:scale-95 transition-all font-semibold cursor-pointer"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 py-1 mr-1 font-semibold">Pages:</span>
                    {["80 Pages", "120 Pages", "160 Pages", "200 Pages", "300 Pages", "400 Pages"].map(
                      (chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => appendSpecToTitle(chip)}
                          className="px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 text-[11px] active:scale-95 transition-all cursor-pointer"
                        >
                          + {chip}
                        </button>
                      )
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 py-1 mr-1 font-semibold">Ruling:</span>
                    {["Single Rule", "Square Rule", "Blank", "Four Rule"].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => appendSpecToTitle(chip)}
                        className="px-2.5 py-1 rounded-lg bg-slate-200/80 dark:bg-white/5 text-slate-800 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-white/10 border border-slate-300 dark:border-white/10 text-[11px] active:scale-95 transition-all cursor-pointer"
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Item Name */}
              <div>
                <label className="label-dark">Item / Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. CR Book 120 Pages Single Rule, Chooty Blue Pen, Munchee Ti-Ti"
                  className="input-dark"
                />
              </div>

              {/* Brand / Maker */}
              <div>
                <label className="label-dark">Brand / Manufacturer</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="e.g. Atlas, Nataraj, Cello, Munchee, Maliban"
                  className="input-dark"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {COMMON_BRANDS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, author: b }))}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/5 text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-[#1ecbe1] hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 active:scale-95 transition-all cursor-pointer"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {/* Barcode & SKU */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-dark">Barcode (EAN / Barcode)</label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    placeholder="Scan barcode or type code"
                    className="input-dark"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Printed barcode on pen, snack packet, or book.
                  </p>
                </div>
                <div>
                  <label className="label-dark">Item Code / Internal SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. CR-120-SR, PEN-01"
                    className="input-dark"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    For items without barcodes (short eats, loose stationery).
                  </p>
                </div>
              </div>

              {/* Price & Cost */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-dark">Selling Price (Rs.) *</label>
                  <input
                    type="text"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="280.00"
                    className="input-dark"
                  />
                </div>
                <div>
                  <label className="label-dark">Cost Price (Rs.)</label>
                  <input
                    type="text"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    placeholder="220.00"
                    className="input-dark"
                  />
                </div>
              </div>

              {/* Initial Quantity & Reorder Threshold */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-dark">Initial Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
                    }
                    className="input-dark"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Will record an initial restock movement.
                  </p>
                </div>
                <div>
                  <label className="label-dark">Reorder Alert Threshold *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.reorderThreshold}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        reorderThreshold: parseInt(e.target.value) || 0,
                      })
                    }
                    className="input-dark"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">
                    Alerts when stock falls to or below this level.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Adding..." : "Add Item"}
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
          <div className="modal-panel p-6 max-w-lg">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Edit Item Details</h2>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                  {formError}
                </div>
              )}

              <div>
                <label className="label-dark">Item / Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-dark"
                />
              </div>

              <div>
                <label className="label-dark">Brand / Manufacturer</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  placeholder="e.g. Atlas, Munchee, Nataraj"
                  className="input-dark"
                />
              </div>

              <div>
                <label className="label-dark">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-dark cursor-pointer"
                >
                  {COMMON_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="Other">Other / Custom</option>
                </select>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-dark">Barcode (EAN / Barcode)</label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => setFormData({ ...formData, isbn: e.target.value })}
                    className="input-dark"
                  />
                </div>
                <div>
                  <label className="label-dark">Item Code / SKU</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    className="input-dark"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label-dark">Selling Price (Rs.) *</label>
                  <input
                    type="text"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input-dark"
                  />
                </div>
                <div>
                  <label className="label-dark">Cost Price (Rs.)</label>
                  <input
                    type="text"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="input-dark"
                  />
                </div>
              </div>

              <div>
                <label className="label-dark">Reorder Alert Threshold *</label>
                <input
                  type="number"
                  min="0"
                  required
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

              <div className="rounded-xl bg-[#1ecbe1]/10 border border-[#1ecbe1]/20 p-3 text-xs text-[#1ecbe1] backdrop-blur-md">
                <span className="font-bold">Note on stock:</span> To adjust current stock ({editingProduct.quantity} on hand), use the dedicated "Adjust" action so audit movements are preserved.
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : "Save Changes"}
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
          <div className="modal-panel p-6 max-w-md">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Adjust Item Stock</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{adjustingProduct.title}</p>
              </div>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="mt-4 space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-700 dark:text-red-300">
                  {formError}
                </div>
              )}

              {/* Current Quantity Card */}
              <div className="rounded-xl bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 p-3.5 flex items-center justify-between backdrop-blur-md">
                <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Current On Hand</span>
                <span className="font-mono text-base font-extrabold text-cyan-700 dark:text-[#1ecbe1]">
                  {adjustingProduct.quantity} units
                </span>
              </div>

              {/* Adjustment Reason */}
              <div>
                <label className="label-dark">Reason *</label>
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
                  <option value="restock">Restock (New batch arrived)</option>
                  <option value="adjustment">Manual Adjustment (Damage, expired, loss, count fix)</option>
                  <option value="return">Customer Return (Restock returned item)</option>
                </select>
              </div>

              {/* Quantity Change Delta */}
              <div>
                <label className="label-dark">Quantity Change (Delta) *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={adjustData.change}
                    onChange={(e) =>
                      setAdjustData({ ...adjustData, change: parseInt(e.target.value) || 0 })
                    }
                    className="input-dark font-mono text-base"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Use positive numbers (e.g. 24) to add stock; negative (e.g. -2) to deduct.
                </p>
              </div>

              {/* Result Preview */}
              <div className="rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5 p-3 flex items-center justify-between text-xs">
                <span className="text-slate-600 dark:text-slate-400">New Resulting Stock:</span>
                <span
                  className={`font-mono font-bold ${
                    adjustingProduct.quantity + adjustData.change < 0
                      ? "text-red-600 dark:text-red-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  }`}
                >
                  {adjustingProduct.quantity + adjustData.change} units
                </span>
              </div>

              {/* Note / Memo */}
              <div>
                <label className="label-dark">Audit Memo / Note</label>
                <input
                  type="text"
                  value={adjustData.note}
                  onChange={(e) => setAdjustData({ ...adjustData, note: e.target.value })}
                  placeholder="e.g. Atlas delivery batch #12, damaged in transit"
                  className="input-dark"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
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
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Stock Movement History</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{historyProduct.title}</p>
              </div>
              <button
                onClick={() => setHistoryProduct(null)}
                className="text-slate-400 hover:text-slate-800 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              {historyLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#1ecbe1] border-t-transparent" />
                    <span>Loading audit log...</span>
                  </div>
                </div>
              ) : movements.length === 0 ? (
                <div className="py-12 text-center text-slate-500 dark:text-slate-400">
                  <p className="text-sm">No stock movements recorded for this item yet.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                  {movements.map((m) => {
                    const isPositive = m.change > 0;
                    return (
                      <div
                        key={m.id}
                        className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-white/5 bg-slate-100/70 dark:bg-slate-800/40 p-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded px-2 py-0.5 font-bold uppercase text-[10px] ${
                                m.reason === "sale"
                                  ? "bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-500/30"
                                  : m.reason === "restock"
                                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30"
                                  : m.reason === "return"
                                  ? "bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30"
                                  : "bg-cyan-100 dark:bg-[#1ecbe1]/20 text-cyan-800 dark:text-[#1ecbe1] border border-cyan-300 dark:border-[#1ecbe1]/30"
                              }`}
                            >
                              {m.reason}
                            </span>
                            {m.relatedSaleId && (
                              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                                Sale #{m.relatedSaleId}
                              </span>
                            )}
                            <span className="text-slate-500 text-[11px]">
                              {new Date(m.createdAt).toLocaleString()}
                            </span>
                          </div>
                          {m.note && <div className="text-slate-700 dark:text-slate-300 italic">{m.note}</div>}
                        </div>

                        <div
                          className={`text-sm font-bold font-mono ${
                            isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-red-400"
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

            <div className="mt-6 flex items-center justify-end pt-4 border-t border-slate-200 dark:border-white/10">
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

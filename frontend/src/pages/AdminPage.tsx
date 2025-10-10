import { useState } from "react";

const AdminPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    imageFile: null as File | null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        imageFile: file,
      }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.price) {
      setMessage({ type: "error", text: "Name and price are required" });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);

      let imageBase64 = "";
      if (formData.imageFile) {
        imageBase64 = await convertFileToBase64(formData.imageFile);
      }

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        imageBase64: imageBase64,
      };

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: "success", text: "Product created successfully!" });
        // Reset form
        setFormData({
          name: "",
          description: "",
          price: "",
          imageFile: null,
        });
        setImagePreview(null);
        // Reset file input
        const fileInput = document.getElementById("image") as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        throw new Error(result.error || "Failed to create product");
      }
    } catch (error) {
      console.error("Error creating product:", error);
      setMessage({
        type: "error",
        text:
          error instanceof Error ? error.message : "Failed to create product",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div className="card-header">
          <h1 className="card-title">Admin Panel</h1>
          <p>Create new products</p>
        </div>

        <div className="card-content">
          {message && (
            <div className={`alert alert-${message.type}`}>{message.text}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Product Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description" className="form-label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                className="form-textarea"
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter product description..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="price" className="form-label">
                Price ($) *
              </label>
              <input
                type="number"
                id="price"
                name="price"
                className="form-input"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="image" className="form-label">
                Product Image
              </label>
              <input
                type="file"
                id="image"
                name="image"
                className="form-input"
                accept="image/*"
                onChange={handleFileChange}
              />
              {imagePreview && (
                <div style={{ marginTop: "1rem" }}>
                  <p>Image Preview:</p>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: "200px",
                      maxHeight: "200px",
                      objectFit: "cover",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div
                    className="spinner"
                    style={{ width: "1rem", height: "1rem" }}
                  ></div>
                  Creating...
                </>
              ) : (
                "Create Product"
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginTop: "2rem" }}>
        <div className="card-header">
          <h2 className="card-title">Security Notice</h2>
        </div>
        <div className="card-content">
          <div className="alert alert-warning">
            <h4>⚠️ Vulnerability Testing Mode</h4>
            <p>
              This admin panel may contain intentional security vulnerabilities
              for testing purposes:
            </p>
            <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
              <li>File upload validation bypasses</li>
              <li>Input sanitization issues</li>
              <li>Privilege escalation opportunities</li>
              <li>Cross-site scripting (XSS) vectors</li>
            </ul>
            <p style={{ marginTop: "1rem" }}>
              <strong>
                Only use this application for authorized security testing!
              </strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;

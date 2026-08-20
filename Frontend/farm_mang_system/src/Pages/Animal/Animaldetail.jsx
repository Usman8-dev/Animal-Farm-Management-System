import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  Star,
  X as XIcon,
  PawPrint,
  Upload,
  GitBranch,
} from "lucide-react";
import api, { API_BASE_URL } from "../../apis/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import AnimalFormDialog from "./AnimalFormDialog";

function AnimalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const { user } = useAuth();
  const canManage =
    user?.role === "owner" || user?.role === "manager" || user?.role === "worker";
  const canDelete = user?.role === "owner" || user?.role === "manager";

  const [animal, setAnimal] = useState(null);
  const [offspring, setOffspring] = useState([]);
  const [loading, setLoading] = useState(true);

  const [animalTypes, setAnimalTypes] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [genders, setGenders] = useState([]);
  const [allAnimals, setAllAnimals] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newImageUrl, setNewImageUrl] = useState("");
  const [addingImage, setAddingImage] = useState(false);
  const fileInputRef = useRef(null);

  const resolveImageUrl = (url) =>
    url && url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

  const fetchAnimal = useCallback(async () => {
    try {
      setLoading(true);
      const [animalRes, offspringRes] = await Promise.all([
        api.get(`/animal/api/animals/${id}`),
        api.get(`/animal/api/animals/${id}/offspring`),
      ]);

      const data = animalRes.data.data;
      setAnimal({
        ...data,
        images: (data.images || []).filter((img) => !img.deleted_at),
      });
      setOffspring(offspringRes.data.data);
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail: err.response?.data?.message || "Could not load this animal",
      });
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  const fetchRefData = useCallback(async () => {
    try {
      const [typesRes, breedsRes, gendersRes, animalsRes] = await Promise.all([
        api.get("/animal/api/animal-types"),
        api.get("/animal/api/breeds"),
        api.get("/animal/api/genders"),
        api.get("/animal/api/animals", { params: { limit: 50 } }),
      ]);
      setAnimalTypes(typesRes.data.data);
      setBreeds(breedsRes.data.data);
      setGenders(gendersRes.data.data);
      setAllAnimals(animalsRes.data.data);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchAnimal();
    fetchRefData();
  }, [fetchAnimal, fetchRefData]);

  const handleSubmitForm = async (payload, editingId) => {
    try {
      setSaving(true);
      await api.put(`/animal/api/animals/${editingId}`, payload);
      showToast({ severity: "success", summary: "Updated", detail: "Animal updated." });
      setDialogOpen(false);
      fetchAnimal();
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Save failed",
        detail:
          err.response?.data?.message ||
          err.response?.data?.errors?.[0] ||
          "Something went wrong",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setAddingImage(true);
      const formData = new FormData();
      formData.append("image", file);
      if (animal.images.length === 0) {
        formData.append("is_primary", "true");
      }
      await api.post(`/animal/api/animals/${id}/images`, formData);
      showToast({ severity: "success", summary: "Uploaded", detail: "Image added." });
      fetchAnimal();
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Upload failed",
        detail: err.response?.data?.message || "Could not upload this image",
      });
    } finally {
      setAddingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteAnimal = () => {
    confirmDialog({
      message: `Delete "${animal.tag_number}"? This can't be undone.`,
      header: "Confirm deletion",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "!bg-[var(--danger)] !border-[var(--danger)]",
      accept: async () => {
        try {
          await api.delete(`/animal/api/animals/${animal.id}`);
          showToast({ severity: "success", summary: "Deleted", detail: "Animal removed." });
          navigate("/animals");
        } catch (err) {
          showToast({
            severity: "error",
            summary: "Delete failed",
            detail: err.response?.data?.message || "Could not delete this animal",
          });
        }
      },
    });
  };

  const handleAddImage = async () => {
    if (!newImageUrl.trim()) return;
    try {
      setAddingImage(true);
      await api.post(`/animal/api/animals/${id}/images`, {
        url: newImageUrl.trim(),
        is_primary: animal.images.length === 0,
      });
      setNewImageUrl("");
      fetchAnimal();
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Failed to add image",
        detail: err.response?.data?.message || "Could not add this image",
      });
    } finally {
      setAddingImage(false);
    }
  };

  const handleSetPrimary = async (imageId) => {
    const previousImages = animal.images;
    setAnimal((prev) => ({
      ...prev,
      images: prev.images.map((img) => ({
        ...img,
        is_primary: img.id === imageId,
      })),
    }));

    try {
      await api.put(`/animal/api/animals/${id}/images/${imageId}/primary`);
      fetchAnimal();
    } catch (err) {
      setAnimal((prev) => ({ ...prev, images: previousImages }));
      showToast({
        severity: "error",
        summary: "Failed",
        detail: err.response?.data?.message || "Could not set primary image",
      });
    }
  };

  const handleDeleteImage = async (imageId) => {
    const previousImages = animal.images;
    setAnimal((prev) => ({
      ...prev,
      images: prev.images.filter((img) => img.id !== imageId),
    }));

    try {
      await api.delete(`/animal/api/animals/${id}/images/${imageId}`);
    } catch (err) {
      setAnimal((prev) => ({ ...prev, images: previousImages }));
      showToast({
        severity: "error",
        summary: "Failed",
        detail: err.response?.data?.message || "Could not delete this image",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2"
          style={{
            borderColor: "var(--border)",
            borderTopColor: "var(--primary)",
          }}
        />
      </div>
    );
  }

  if (!animal) return null;

  const visibleImages = (animal.images || []).filter((img) => !img.deleted_at);
  const primaryImage =
    visibleImages.find((img) => img.is_primary) || visibleImages[0];

  return (
    <div className="font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Fraunces', serif; }
        .field-input {
          background: var(--bg-card);
          border: 1px solid var(--border);
          color: var(--text);
        }
        .field-input::placeholder { color: var(--text-muted); }
        .field-input:focus {
          outline: none;
          border-color: var(--primary-hover) !important;
          box-shadow: 0 0 0 3px rgba(60, 102, 80, 0.14) !important;
        }
        html.dark .field-input:focus {
          box-shadow: 0 0 0 3px rgba(74, 124, 98, 0.25) !important;
        }
      `}</style>

      <ConfirmDialog />

      {/* Back link */}
      <button
        onClick={() => navigate("/animals")}
        className="mb-5 flex items-center gap-1.5 text-sm font-medium transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <ArrowLeft size={16} />
        Back to Animals
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl"
            style={{ backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)" }}
          >
            {primaryImage ? (
              <img
                src={resolveImageUrl(primaryImage.url)}
                alt={animal.tag_number}
                className="h-full w-full object-contain"
              />
            ) : (
              <PawPrint size={26} style={{ color: "var(--primary)", opacity: 0.4 }} />
            )}
          </div>
          <div>
            <h1
              className="font-display mb-0.5 text-2xl font-semibold"
              style={{ color: "var(--text-heading)" }}
            >
              {animal.name || animal.tag_number}
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Tag #{animal.tag_number} · {animal.animalType?.name} · {animal.breed?.name}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            label="Family Tree"
            icon={<GitBranch size={15} className="mr-1.5" />}
            onClick={() => navigate(`/animals/${id}/family-tree`)}
            className="!rounded-lg !px-3.5 !py-2 !text-sm !font-semibold !text-white"
            style={{
              backgroundColor: "var(--primary)",
              borderColor: "var(--primary)",
            }}
          />
          {canManage && (
            <>
              <Button
                label="Edit"
                icon={<Pencil size={15} className="mr-1.5" />}
                onClick={() => setDialogOpen(true)}
                className="!rounded-lg !px-3.5 !py-2 !text-sm !font-semibold"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                }}
              />
              {canDelete && (
                <Button
                  label="Delete"
                  icon={<Trash2 size={15} className="mr-1.5" />}
                  onClick={handleDeleteAnimal}
                  className="!rounded-lg !px-3.5 !py-2 !text-sm !font-semibold"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border)",
                    color: "var(--danger)",
                  }}
                />
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left column */}
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Overview */}
          <div
            className="rounded-2xl border p-6"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
          >
            <h2
              className="font-display mb-4 text-lg font-semibold"
              style={{ color: "var(--text-heading)" }}
            >
              Overview
            </h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              {[
                { label: "Gender", value: animal.gender?.name },
                {
                  label: "Birth Date",
                  value: animal.birth_date
                    ? new Date(animal.birth_date).toLocaleDateString()
                    : null,
                },
                {
                  label: "Acquisition",
                  value:
                    animal.acquisition_type === "BORN_IN_FARM"
                      ? "Born in Farm"
                      : "Purchased",
                },
                {
                  label: "Acquired On",
                  value: animal.acquired_on
                    ? new Date(animal.acquired_on).toLocaleDateString()
                    : null,
                },
              ].map((item) => (
                <div key={item.label}>
                  <dt className="mb-0.5" style={{ color: "var(--text-muted)" }}>
                    {item.label}
                  </dt>
                  <dd className="font-medium" style={{ color: "var(--text)" }}>
                    {item.value || "—"}
                  </dd>
                </div>
              ))}
            </dl>

            {animal.notes && (
              <div
                className="mt-5 border-t pt-5"
                style={{ borderColor: "var(--border)" }}
              >
                <dt className="mb-1 text-sm" style={{ color: "var(--text-muted)" }}>
                  Notes
                </dt>
                <p
                  className="whitespace-pre-line text-sm leading-relaxed"
                  style={{ color: "var(--text)" }}
                >
                  {animal.notes}
                </p>
              </div>
            )}
          </div>

          {/* Lineage */}
          <div
            className="rounded-2xl border p-6"
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border)",
            }}
          >
            <h2
              className="font-display mb-4 text-lg font-semibold"
              style={{ color: "var(--text-heading)" }}
            >
              Lineage
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  Mother
                </p>
                {animal.mother ? (
                  <Link
                    to={`/animals/${animal.mother.id}`}
                    className="block rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--primary)",
                    }}
                  >
                    {animal.mother.tag_number}
                    {animal.mother.name ? ` — ${animal.mother.name}` : ""}
                  </Link>
                ) : (
                  <p
                    className="rounded-lg border border-dashed px-3 py-2.5 text-sm"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    Unknown
                  </p>
                )}
              </div>
              <div>
                <p className="mb-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
                  Father
                </p>
                {animal.father ? (
                  <Link
                    to={`/animals/${animal.father.id}`}
                    className="block rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--primary)",
                    }}
                  >
                    {animal.father.tag_number}
                    {animal.father.name ? ` — ${animal.father.name}` : ""}
                  </Link>
                ) : (
                  <p
                    className="rounded-lg border border-dashed px-3 py-2.5 text-sm"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    Unknown
                  </p>
                )}
              </div>
            </div>

            {offspring.length > 0 && (
              <div
                className="mt-5 border-t pt-5"
                style={{ borderColor: "var(--border)" }}
              >
                <p className="mb-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  Offspring ({offspring.length})
                </p>
                <div className="flex flex-col gap-1.5">
                  {offspring.map((o) => (
                    <Link
                      key={o.id}
                      to={`/animals/${o.id}`}
                      className="rounded-lg border px-3 py-2 text-sm transition-colors"
                      style={{
                        borderColor: "var(--border)",
                        color: "var(--text)",
                      }}
                    >
                      {o.tag_number}
                      {o.name ? ` — ${o.name}` : ""}
                      {o.birth_date && (
                        <span style={{ color: "var(--text-muted)" }}>
                          {" "}
                          · born {new Date(o.birth_date).toLocaleDateString()}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Photos */}
        <div
          className="h-fit rounded-2xl border p-6"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border)",
          }}
        >
          <h2
            className="font-display mb-4 text-lg font-semibold"
            style={{ color: "var(--text-heading)" }}
          >
            Photos
          </h2>

          {visibleImages.length > 0 ? (
            <div className="mb-4 grid grid-cols-2 gap-2">
              {visibleImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square overflow-hidden rounded-lg border"
                  style={{ borderColor: "var(--border)" }}
                >
                  <img
                    src={resolveImageUrl(img.url)}
                    alt={img.caption || animal.tag_number}
                    className="h-full w-full object-contain"
                  />
                  {img.is_primary && (
                    <span
                      className="absolute left-1.5 top-1.5 rounded-full p-1"
                      style={{ backgroundColor: "var(--primary)" }}
                    >
                      <Star size={11} className="text-[#e3c55c]" fill="#e3c55c" />
                    </span>
                  )}
                  {canManage && (
                    <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                      {!img.is_primary && (
                        <button
                          onClick={() => handleSetPrimary(img.id)}
                          className="rounded-full bg-white/90 p-1.5 hover:bg-white"
                          style={{ color: "var(--primary)" }}
                          title="Set as primary"
                        >
                          <Star size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        className="rounded-full bg-white/90 p-1.5 hover:bg-white"
                        style={{ color: "var(--danger)" }}
                        title="Delete image"
                      >
                        <XIcon size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
              No photos yet.
            </p>
          )}

          {canManage && (
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <InputText
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="Paste image URL"
                  className="field-input flex-1 rounded-lg px-3 py-2 text-sm"
                />
                <Button
                  icon={<Plus size={16} />}
                  onClick={handleAddImage}
                  loading={addingImage}
                  className="!rounded-lg !px-3 !text-white"
                  style={{
                    backgroundColor: "var(--primary)",
                    borderColor: "var(--primary)",
                  }}
                />
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUploadImage}
              />
              <Button
                label="Upload from device"
                icon={<Upload size={16} />}
                onClick={() => fileInputRef.current?.click()}
                loading={addingImage}
                className="!w-full !justify-center !rounded-lg !text-sm !font-medium"
                style={{
                  backgroundColor: "var(--bg-card)",
                  borderColor: "var(--border)",
                  color: "var(--primary)",
                }}
              />
            </div>
          )}
        </div>
      </div>

      <AnimalFormDialog
        visible={dialogOpen}
        onHide={() => setDialogOpen(false)}
        editingAnimal={animal}
        animalTypes={animalTypes}
        breeds={breeds}
        genders={genders}
        allAnimals={allAnimals}
        saving={saving}
        onSubmitForm={handleSubmitForm}
      />
    </div>
  );
}

export default AnimalDetail;
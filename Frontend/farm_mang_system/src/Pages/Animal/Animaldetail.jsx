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
  const canManage = user?.role === "owner" || user?.role === "manager" || user?.role === "worker";
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

  // Uploaded images are stored as relative paths (/uploads/...) and
  // pasted URLs are absolute — resolve both to a displayable src.
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
    // Ignore soft-deleted images even if API still sends them
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
      // silent — only blocks the edit dialog, not the page itself
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
        detail: err.response?.data?.message || err.response?.data?.errors?.[0] || "Something went wrong",
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
      // First image on the animal automatically becomes the primary one
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
      acceptClassName: "!bg-[#b3452d] !border-[#b3452d]",
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

  // Remove immediately
  setAnimal((prev) => ({
    ...prev,
    images: prev.images.filter((img) => img.id !== imageId),
  }));

  try {
    await api.delete(`/animal/api/animals/${id}/images/${imageId}`);
    // Do NOT call fetchAnimal() here — it can bring soft-deleted images back
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
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e6e2d6] border-t-[#1f3d2e]" />
      </div>
    );
  }

  if (!animal) return null;

//   const primaryImage = animal.images.find((img) => img.is_primary) || animal.images[0];
const visibleImages = (animal.images || []).filter((img) => !img.deleted_at);
const primaryImage =
  visibleImages.find((img) => img.is_primary) || visibleImages[0];

  return (
    <div className="font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Fraunces', serif; }
        .field-input { background: #fdfcf9; border: 1px solid #e6e2d6; }
        .field-input:focus { outline: none; border-color: #3c6650 !important; box-shadow: 0 0 0 3px rgba(60,102,80,0.14) !important; }
      `}</style>

      <ConfirmDialog />

      {/* Back link */}
      <button
        onClick={() => navigate("/animals")}
        className="mb-5 flex items-center gap-1.5 text-sm font-medium text-[#66716a] hover:text-[#1f3d2e] transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Animals
      </button>

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#1f3d2e]/8">
            {primaryImage ? (
              <img src={resolveImageUrl(primaryImage.url)} alt={animal.tag_number} className="h-full w-full object-contain" />
            ) : (
              <PawPrint size={26} className="text-[#1f3d2e]/40" />
            )}
          </div>
          <div>
            <h1 className="font-display font-semibold text-2xl text-[#14261d] mb-0.5">
              {animal.name || animal.tag_number}
            </h1>
            <p className="text-sm text-[#66716a]">
              Tag #{animal.tag_number} · {animal.animalType?.name} · {animal.breed?.name}
            </p>
          </div>
        </div>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              label="Edit"
              icon={<Pencil size={15} className="mr-1.5" />}
              onClick={() => setDialogOpen(true)}
              className="!bg-white !border-[#e6e2d6] !text-[#1b241d] hover:!bg-[#faf8f2] !rounded-lg !text-sm !font-semibold !px-3.5 !py-2"
            />
            {canDelete && (
              <Button
                label="Delete"
                icon={<Trash2 size={15} className="mr-1.5" />}
                onClick={handleDeleteAnimal}
                className="!bg-white !border-[#e6e2d6] !text-[#b3452d] hover:!bg-[#b3452d]/5 !rounded-lg !text-sm !font-semibold !px-3.5 !py-2"
              />
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left column: overview + lineage ─────────────────── */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Overview card */}
          <div className="rounded-2xl border border-[#e6e2d6] bg-white p-6">
            <h2 className="font-display font-semibold text-lg text-[#14261d] mb-4">Overview</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
              <div>
                <dt className="text-[#66716a] mb-0.5">Gender</dt>
                <dd className="font-medium text-[#1b241d]">{animal.gender?.name || "—"}</dd>
              </div>
              <div>
                <dt className="text-[#66716a] mb-0.5">Birth Date</dt>
                <dd className="font-medium text-[#1b241d]">
                  {animal.birth_date ? new Date(animal.birth_date).toLocaleDateString() : "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[#66716a] mb-0.5">Acquisition</dt>
                <dd className="font-medium text-[#1b241d]">
                  {animal.acquisition_type === "BORN_IN_FARM" ? "Born in Farm" : "Purchased"}
                </dd>
              </div>
              <div>
                <dt className="text-[#66716a] mb-0.5">Acquired On</dt>
                <dd className="font-medium text-[#1b241d]">
                  {animal.acquired_on ? new Date(animal.acquired_on).toLocaleDateString() : "—"}
                </dd>
              </div>
            </dl>

            {animal.notes && (
              <div className="mt-5 pt-5 border-t border-[#e6e2d6]">
                <dt className="text-[#66716a] text-sm mb-1">Notes</dt>
                <p className="text-sm text-[#1b241d] leading-relaxed whitespace-pre-line">{animal.notes}</p>
              </div>
            )}
          </div>

          {/* Lineage card */}
          <div className="rounded-2xl border border-[#e6e2d6] bg-white p-6">
            <h2 className="font-display font-semibold text-lg text-[#14261d] mb-4">Lineage</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-[#66716a] mb-1.5">Mother</p>
                {animal.mother ? (
                  <Link
                    to={`/animals/${animal.mother.id}`}
                    className="block rounded-lg border border-[#e6e2d6] px-3 py-2.5 text-sm font-medium text-[#1f3d2e] hover:bg-[#faf8f2] transition-colors"
                  >
                    {animal.mother.tag_number}
                    {animal.mother.name ? ` — ${animal.mother.name}` : ""}
                  </Link>
                ) : (
                  <p className="rounded-lg border border-dashed border-[#e6e2d6] px-3 py-2.5 text-sm text-[#66716a]">
                    Unknown
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs text-[#66716a] mb-1.5">Father</p>
                {animal.father ? (
                  <Link
                    to={`/animals/${animal.father.id}`}
                    className="block rounded-lg border border-[#e6e2d6] px-3 py-2.5 text-sm font-medium text-[#1f3d2e] hover:bg-[#faf8f2] transition-colors"
                  >
                    {animal.father.tag_number}
                    {animal.father.name ? ` — ${animal.father.name}` : ""}
                  </Link>
                ) : (
                  <p className="rounded-lg border border-dashed border-[#e6e2d6] px-3 py-2.5 text-sm text-[#66716a]">
                    Unknown
                  </p>
                )}
              </div>
            </div>

            {offspring.length > 0 && (
              <div className="mt-5 pt-5 border-t border-[#e6e2d6]">
                <p className="text-xs text-[#66716a] mb-2">Offspring ({offspring.length})</p>
                <div className="flex flex-col gap-1.5">
                  {offspring.map((o) => (
                    <Link
                      key={o.id}
                      to={`/animals/${o.id}`}
                      className="rounded-lg border border-[#e6e2d6] px-3 py-2 text-sm text-[#1b241d] hover:bg-[#faf8f2] transition-colors"
                    >
                      {o.tag_number}
                      {o.name ? ` — ${o.name}` : ""}
                      {o.birth_date && (
                        <span className="text-[#66716a]"> · born {new Date(o.birth_date).toLocaleDateString()}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: images ─────────────────────────────── */}
        <div className="rounded-2xl border border-[#e6e2d6] bg-white p-6 h-fit">
          <h2 className="font-display font-semibold text-lg text-[#14261d] mb-4">Photos</h2>

          {animal.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 mb-4">
              {animal.images.map((img) => (
                <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-[#e6e2d6]">
                  <img src={resolveImageUrl(img.url)} alt={img.caption || animal.tag_number} className="h-full w-full object-contain" />
                  {img.is_primary && (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-[#1f3d2e] p-1">
                      <Star size={11} className="text-[#e3c55c]" fill="#e3c55c" />
                    </span>
                  )}
                  {canManage && (
                    <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!img.is_primary && (
                        <button
                          onClick={() => handleSetPrimary(img.id)}
                          className="rounded-full bg-white/90 p-1.5 text-[#1f3d2e] hover:bg-white"
                          title="Set as primary"
                        >
                          <Star size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        className="rounded-full bg-white/90 p-1.5 text-[#b3452d] hover:bg-white"
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
            <p className="mb-4 text-sm text-[#66716a]">No photos yet.</p>
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
                  className="!bg-[#1f3d2e] !border-[#1f3d2e] hover:!bg-[#3c6650] !rounded-lg !px-3"
                />
              </div>

              {/* Hidden file picker — opened by the "Upload from device" button */}
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
                className="!w-full !justify-center !bg-white !border-[#e6e2d6] !text-[#1f3d2e] hover:!bg-[#FAF8F2] !rounded-lg !text-sm !font-medium"
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
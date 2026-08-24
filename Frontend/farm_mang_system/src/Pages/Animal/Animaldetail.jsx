import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import ChangeStatusDialog from "../../Pages/Lifecycle/Changestatusdialog";
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
  History,
  FileDown,
  Tag,
  Calendar,
} from "lucide-react";
import api, { API_BASE_URL } from "../../apis/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import AnimalFormDialog from "./AnimalFormDialog";

const CATEGORY_STYLE = {
  PRESENCE: { bg: "color-mix(in srgb, var(--primary) 14%, transparent)", color: "var(--primary)" },
  REPRODUCTIVE: { bg: "rgba(201, 162, 39, 0.15)", color: "#8a6d1a" },
  HEALTH: { bg: "color-mix(in srgb, var(--danger) 12%, transparent)", color: "var(--danger)" },
};

function AnimalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();
  const { user } = useAuth();
  const canManage = user?.role === "owner" || user?.role === "manager";
  const canDelete = user?.role === "owner";

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

  const [statuses, setStatuses] = useState([]);
  const [statusHistory, setStatusHistory] = useState([]);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);

  const resolveImageUrl = (url) =>
    url && url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

  const fetchAnimal = useCallback(async () => {
    try {
      setLoading(true);
      const [animalRes, offspringRes, statusesRes, historyRes] = await Promise.all([
        api.get(`/animal/api/animals/${id}`),
        api.get(`/animal/api/animals/${id}/offspring`),
        api.get("/status/api/animal-statuses"),
        api.get(`/status/api/animals/${id}/status-history`),
      ]);

      const data = animalRes.data.data;
      setAnimal({
        ...data,
        images: (data.images || []).filter((img) => !img.deleted_at),
      });
      setOffspring(offspringRes.data.data || []);
      setStatuses(statusesRes.data.data || []);
      setStatusHistory(historyRes.data.data || []);
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

  const currentStatuses = useMemo(
    () => (statusHistory || []).filter((e) => !e.effective_to && !e.deleted_at),
    [statusHistory]
  );

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

  const handleStatusSubmit = async (payload) => {
  try {
    setSavingStatus(true);

    const body = {
      status_id: Number(payload.status_id),
      reason: payload.reason?.trim() || null,
      // backend needs ISO string for effective_from
      effective_from: payload.effective_from
        ? new Date(payload.effective_from).toISOString()
        : new Date().toISOString(),
    };

    await api.post(`/status/api/animals/${id}/status`, body);
    showToast({ severity: "success", summary: "Updated", detail: "Status recorded." });
    setStatusDialogOpen(false);
    fetchAnimal();
  } catch (err) {
    showToast({
      severity: "error",
      summary: "Failed",
      detail: err.response?.data?.message || "Could not update status",
    });
  } finally {
    setSavingStatus(false);
  }
};

  const handleUploadImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setAddingImage(true);
      const formData = new FormData();
      formData.append("image", file);
      if (animal.images.length === 0) formData.append("is_primary", "true");
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
      <div className="flex min-h-[50vh] items-center justify-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-[3px]"
          style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }}
        />
      </div>
    );
  }

  if (!animal) return null;

  const visibleImages = (animal.images || []).filter((img) => !img.deleted_at);
  const primaryImage =
    visibleImages.find((img) => img.is_primary) || visibleImages[0];
  const displayName = animal.name || animal.tag_number;

  return (
    <div className="font-sans pb-10">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap');
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
      `}</style>

      <ConfirmDialog />

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

      {/* Hero */}
      <div
        className="relative mb-6 overflow-hidden rounded-3xl border p-6 sm:p-8"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse at top right, color-mix(in srgb, var(--primary) 12%, transparent), transparent 55%)",
          }}
        />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <div
              className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 shadow-md sm:h-32 sm:w-32"
              style={{
                borderColor: "var(--bg-card)",
                backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)",
              }}
            >
              {primaryImage ? (
                <img
                  src={resolveImageUrl(primaryImage.url)}
                  alt={displayName}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <PawPrint size={36} style={{ color: "var(--primary)", opacity: 0.35 }} />
                </div>
              )}
            </div>

            <div className="min-w-0 text-center sm:text-left">
              <h1
                className="font-display text-3xl font-semibold tracking-tight sm:text-4xl"
                style={{ color: "var(--text-heading)" }}
              >
                {displayName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
                    color: "var(--primary)",
                  }}
                >
                  <Tag size={12} />#{animal.tag_number}
                </span>
                {animal.animalType?.name && (
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-muted)" }}
                  >
                    {animal.animalType.name}
                  </span>
                )}
                {animal.breed?.name && (
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-muted)" }}
                  >
                    {animal.breed.name}
                  </span>
                )}
                {animal.gender?.name && (
                  <span
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ backgroundColor: "var(--bg-muted)", color: "var(--text-muted)" }}
                  >
                    {animal.gender.name}
                  </span>
                )}
              </div>

              {/* Current statuses */}
              {currentStatuses.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                  {currentStatuses.map((entry) => {
                    const cat = entry.status?.category || "PRESENCE";
                    const style = CATEGORY_STYLE[cat] || CATEGORY_STYLE.PRESENCE;
                    return (
                      <span
                        key={entry.id}
                        className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{ backgroundColor: style.bg, color: style.color }}
                        title={entry.status?.category}
                      >
                        {entry.status?.name}
                      </span>
                    );
                  })}
                </div>
              )}

              {animal.birth_date && (
                <p
                  className="mt-2 flex items-center justify-center gap-1.5 text-sm sm:justify-start"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Calendar size={14} />
                  Born {new Date(animal.birth_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-center gap-2 lg:justify-end">
            <Button
              label="Family Tree"
              icon={<GitBranch size={15} className="mr-1.5" />}
              onClick={() => navigate(`/animals/${id}/family-tree`)}
              className="!rounded-xl !px-3.5 !py-2.5 !text-sm !font-semibold"
              style={{
                backgroundColor: "var(--bg-muted)",
                borderColor: "var(--border)",
                color: "var(--text)",
              }}
            />
            {canManage && (
              <>
                <Button
                  label="Change Status"
                  icon={<History size={15} className="mr-1.5" />}
                  onClick={() => setStatusDialogOpen(true)}
                  className="!rounded-xl !px-3.5 !py-2.5 !text-sm !font-semibold"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border)",
                    color: "var(--text)",
                  }}
                />
                <Button
                  label="Edit"
                  icon={<Pencil size={15} className="mr-1.5" />}
                  onClick={() => setDialogOpen(true)}
                  className="!rounded-xl !px-3.5 !py-2.5 !text-sm !font-semibold"
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
                    className="!rounded-xl !px-3.5 !py-2.5 !text-sm !font-semibold"
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
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="flex flex-col gap-5 lg:col-span-2">
          {/* Overview tiles */}
          <div
            className="rounded-2xl border p-6"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <h2
              className="font-display mb-4 text-lg font-semibold"
              style={{ color: "var(--text-heading)" }}
            >
              Overview
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <div
                  key={item.label}
                  className="rounded-xl px-4 py-3"
                  style={{ backgroundColor: "var(--bg-muted)" }}
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {item.value || "—"}
                  </p>
                </div>
              ))}
            </div>
            {animal.notes && (
              <div
                className="mt-4 rounded-xl border border-dashed p-4"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-muted)" }}
              >
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Notes
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                  {animal.notes}
                </p>
              </div>
            )}
          </div>

          {/* Lineage */}
          <div
            className="rounded-2xl border p-6"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <h2 className="font-display mb-4 text-lg font-semibold" style={{ color: "var(--text-heading)" }}>
              Lineage
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: "Mother", rel: animal.mother },
                { label: "Father", rel: animal.father },
              ].map(({ label, rel }) => (
                <div key={label}>
                  <p className="mb-1.5 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {label}
                  </p>
                  {rel ? (
                    <Link
                      to={`/animals/${rel.id}`}
                      className="flex items-center gap-3 rounded-xl border px-3 py-3 transition-colors"
                      style={{ borderColor: "var(--border)", color: "var(--primary)" }}
                    >
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg"
                        style={{ backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)" }}
                      >
                        <PawPrint size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{rel.tag_number}</p>
                        {rel.name && (
                          <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                            {rel.name}
                          </p>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <p
                      className="rounded-xl border border-dashed px-3 py-3 text-sm"
                      style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                    >
                      Unknown
                    </p>
                  )}
                </div>
              ))}
            </div>

            {offspring.length > 0 && (
              <div className="mt-5 border-t pt-5" style={{ borderColor: "var(--border)" }}>
                <p className="mb-2 text-xs font-medium uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Offspring ({offspring.length})
                </p>
                <div className="flex flex-col gap-1.5">
                  {offspring.map((o) => (
                    <Link
                      key={o.id}
                      to={`/animals/${o.id}`}
                      className="rounded-xl border px-3 py-2.5 text-sm transition-colors"
                      style={{ borderColor: "var(--border)", color: "var(--text)" }}
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

          {/* Status history timeline */}
          <div
            className="rounded-2xl border p-6"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >

            {statusHistory.length > 0 ? (
              <div className="relative space-y-0">
                {statusHistory.map((entry, idx) => {
                  const isCurrent = !entry.effective_to;
                  const cat = entry.status?.category || "PRESENCE";
                  const style = CATEGORY_STYLE[cat] || CATEGORY_STYLE.PRESENCE;
                  return (
                    <div key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
                      {idx < statusHistory.length - 1 && (
                        <div
                          className="absolute left-[7px] top-4 bottom-0 w-px"
                          style={{ backgroundColor: "var(--border)" }}
                        />
                      )}
                      <div
                        className="relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ring-4"
                        style={{
                          backgroundColor: isCurrent ? "var(--primary)" : "var(--border)",
                          ringColor: "var(--bg-card)",
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                            {entry.status?.name}
                          </p>
                          {isCurrent && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                              style={{
                                backgroundColor: "color-mix(in srgb, var(--primary) 14%, transparent)",
                                color: "var(--primary)",
                              }}
                            >
                              Current
                            </span>
                          )}
                          {entry.status?.category && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                              style={{ backgroundColor: style.bg, color: style.color }}
                            >
                              {entry.status.category}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                          {new Date(entry.effective_from).toLocaleDateString()}
                          {entry.effective_to
                            ? ` – ${new Date(entry.effective_to).toLocaleDateString()}`
                            : " – present"}
                        </p>
                        {entry.reason && (
                          <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
                            {entry.reason}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                No status recorded yet.
              </p>
            )}
          </div>
        </div>

        {/* Photos */}
        <div
          className="h-fit rounded-2xl border p-6 lg:sticky lg:top-6"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <h2 className="font-display mb-4 text-lg font-semibold" style={{ color: "var(--text-heading)" }}>
            Photos
            {visibleImages.length > 0 && (
              <span
                className="ml-2 rounded-full px-2 py-0.5 text-xs font-semibold"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
                  color: "var(--primary)",
                }}
              >
                {visibleImages.length}
              </span>
            )}
          </h2>

          {visibleImages.length > 0 ? (
            <div className="mb-4 grid grid-cols-2 gap-2.5">
              {visibleImages.map((img) => (
                <div
                  key={img.id}
                  className="group relative aspect-square overflow-hidden rounded-xl border"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-muted)" }}
                >
                  <img
                    src={resolveImageUrl(img.url)}
                    alt={img.caption || animal.tag_number}
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                  {img.is_primary && (
                    <span
                      className="absolute left-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-[#e3c55c]"
                      style={{ backgroundColor: "var(--primary)" }}
                    >
                      <Star size={10} fill="#e3c55c" />
                      Primary
                    </span>
                  )}
                  {canManage && (
                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
                      {!img.is_primary && (
                        <button
                          onClick={() => handleSetPrimary(img.id)}
                          className="rounded-full bg-white p-2 shadow"
                          style={{ color: "var(--primary)" }}
                          title="Set as primary"
                        >
                          <Star size={14} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        className="rounded-full bg-white p-2 shadow"
                        style={{ color: "var(--danger)" }}
                        title="Delete"
                      >
                        <XIcon size={14} />
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
                  className="field-input flex-1 rounded-xl px-3 py-2 text-sm"
                />
                <Button
                  icon={<Plus size={16} />}
                  onClick={handleAddImage}
                  loading={addingImage}
                  className="!rounded-xl !px-3 !text-white"
                  style={{ backgroundColor: "var(--primary)", borderColor: "var(--primary)" }}
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
                className="!w-full !justify-center !rounded-xl !text-sm !font-medium"
                style={{
                  backgroundColor: "var(--bg-muted)",
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
      <ChangeStatusDialog
        visible={statusDialogOpen}
        onHide={() => setStatusDialogOpen(false)}
        statuses={statuses}
        saving={savingStatus}
        onSubmitForm={handleStatusSubmit}
      />
    </div>
  );
}

export default AnimalDetail;
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, PawPrint } from "lucide-react";
import api from "../../apis/axios";
import { useToast } from "../../context/ToastContext";
import FamilyTreeSection from "./FamilyTreeSection";

function FamilyTreePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const showToast = useToast();

  const [animal, setAnimal] = useState(null);
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [animalRes, treeRes] = await Promise.all([
        api.get(`/animal/api/animals/${id}`),
        api.get(`/animal/api/animals/${id}/family-tree`),
      ]);
      setAnimal(animalRes.data.data);
      setTree(treeRes.data.data);
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail:
          err.response?.data?.message || "Could not load the family tree",
      });
    } finally {
      setLoading(false);
    }
  }, [id, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div className="font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Fraunces', serif; }
      `}</style>

      {/* Back link */}
      <button
        onClick={() => navigate(`/animals/${id}`)}
        className="mb-5 flex items-center gap-1.5 text-sm font-medium transition-colors"
        style={{ color: "var(--text-muted)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
      >
        <ArrowLeft size={16} />
        Back to Animal
      </button>

      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--primary) 12%, transparent)",
          }}
        >
          <PawPrint size={22} style={{ color: "var(--primary)", opacity: 0.4 }} />
        </div>
        <div>
          <h1
            className="font-display mb-0.5 text-2xl font-semibold"
            style={{ color: "var(--text-heading)" }}
          >
            Family Tree
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            {animal
              ? `${animal.name || animal.tag_number} · Tag #${animal.tag_number}`
              : "Loading…"}
          </p>
        </div>
      </div>

      <FamilyTreeSection tree={tree} loading={loading} />
    </div>
  );
}

export default FamilyTreePage;
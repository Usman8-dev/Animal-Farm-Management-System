import { Link } from "react-router-dom";
import { PawPrint, Users } from "lucide-react";
import { API_BASE_URL } from "../../apis/axios";

// Uploaded images are stored as relative paths (/uploads/...) and
// pasted URLs are absolute — resolve both to a displayable src.
const resolveImageUrl = (url) =>
  url && url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

function TreeNode({ animal, highlight = false, role }) {
  if (!animal) {
    return (
      <div className="flex w-[140px] flex-col items-center">
        {role && (
          <span className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[#8a938c]">
            {role}
          </span>
        )}
        <div className="flex h-[72px] w-[140px] items-center justify-center rounded-xl border border-dashed border-[#e6e2d6] bg-[#faf8f2]/60 text-xs text-[#8a938c]">
          Unknown
        </div>
      </div>
    );
  }

  const genderName = (animal.gender?.name || "").toLowerCase();
  const isMale = genderName.includes("male") && !genderName.includes("female");
  const isFemale = genderName.includes("female");
  const photo = animal.images?.[0]?.url
    ? resolveImageUrl(animal.images[0].url)
    : null;
  const label = animal.name || animal.tag_number;

  return (
    <div className="flex w-[140px] flex-col items-center">
      {role && (
        <span className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[#8a938c]">
          {role}
        </span>
      )}
      <Link
        to={`/animals/${animal.id}`}
        className={`group relative flex w-full flex-col items-center rounded-xl border bg-white p-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
          highlight
            ? "border-[#1f3d2e] ring-2 ring-[#1f3d2e]/20"
            : "border-[#e6e2d6] hover:border-[#1f3d2e]/40"
        }`}
      >
        <div className="relative mb-2 h-12 w-12 overflow-hidden rounded-full bg-[#1f3d2e]/8 ring-2 ring-white">
          {photo ? (
            <img src={photo} alt={label} className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PawPrint size={18} className="text-[#1f3d2e]/35" />
            </div>
          )}
          {(isMale || isFemale) && (
            <span
              className={`absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white shadow ${
                isMale ? "bg-sky-600" : "bg-rose-500"
              }`}
              title={animal.gender?.name}
            >
              {isMale ? "♂" : "♀"}
            </span>
          )}
        </div>
        <p className="w-full truncate text-center text-xs font-semibold text-[#14261d] group-hover:text-[#1f3d2e]">
          {label}
        </p>
        <p className="w-full truncate text-center text-[10px] text-[#66716a]">
          #{animal.tag_number}
        </p>
        {animal.birth_date && (
          <p className="mt-0.5 text-[10px] text-[#8a938c]">
            {new Date(animal.birth_date).toLocaleDateString()}
          </p>
        )}
      </Link>
    </div>
  );
}

function ConnectorVertical({ className = "" }) {
  return <div className={`mx-auto h-6 w-px bg-[#d4cfc3] ${className}`} />;
}

function ConnectorHorizontal() {
  return <div className="h-px flex-1 bg-[#d4cfc3]" />;
}

// Generation label for a descendant at the given depth (1 = direct child).
function generationLabel(depth) {
  if (depth <= 1) return "Offspring";
  if (depth === 2) return "Grandchild";
  if (depth === 3) return "Great-grandchild";
  const n = depth - 2;
  const lastTwo = n % 100;
  const suffix =
    lastTwo >= 11 && lastTwo <= 13
      ? "th"
      : ["th", "st", "nd", "rd"][n % 10] || "th";
  return `${n}${suffix} great-grandchild`;
}

// Recursively renders an offspring branch so the tree keeps going for every
// generation (grandchildren → great-grandchildren → and so on).
function DescendantBranch({ node, depth = 1 }) {
  if (!node) return null;
  const kids = node.children || [];

  return (
    <div className="flex flex-col items-center">
      <ConnectorVertical className="!h-4" />
      <TreeNode animal={node} role={generationLabel(depth)} />
      {kids.length > 0 && (
        <>
          <ConnectorVertical />
          <div className="relative flex items-start justify-center gap-2">
            {/* top horizontal connector across this generation */}
            {kids.length > 1 && (
              <div
                className="absolute left-0 right-0 top-0 mx-auto h-px bg-[#d4cfc3]"
                style={{
                  width: `calc(100% - 140px)`,
                  top: 0,
                }}
              />
            )}
            {kids.map((kid) => (
              <DescendantBranch key={kid.id} node={kid} depth={depth + 1} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}



function FamilyTreeSection({ tree, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-[#e6e2d6] bg-white p-6">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#e6e2d6] border-t-[#1f3d2e]" />
        </div>
      </div>
    );
  }

  if (!tree) return null;

  const {
    animal,
    mother,
    father,
    maternalGrandmother,
    maternalGrandfather,
    paternalGrandmother,
    paternalGrandfather,
    children = [],
  } = tree;

  const hasGrandparents =
    maternalGrandmother || maternalGrandfather || paternalGrandmother || paternalGrandfather;
  const hasParents = mother || father;
  const hasChildren = children.length > 0;

  return (
    <section className="rounded-2xl border border-[#e6e2d6] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="font-display flex items-center gap-2 text-lg font-semibold text-[#14261d]">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1f3d2e]/8">
            <Users size={16} className="text-[#1f3d2e]" />
          </span>
          Family Tree
        </h2>
        <div className="flex items-center gap-3 text-[11px] text-[#66716a]">
          <span className="inline-flex items-center gap-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-sky-600 text-[9px] font-bold text-white">
              ♂
            </span>
            Male
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
              ♀
            </span>
            Female
          </span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="mx-auto flex min-w-max flex-col items-center gap-0 px-4">
          {/* ── Grandparents ───────────────────────── */}
          {hasGrandparents && (
            <>
              <div className="flex items-start justify-center gap-10">
                {/* Maternal */}
                <div className="flex flex-col items-center">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#8a938c]">
                    Maternal
                  </p>
                  <div className="flex items-start gap-3">
                    <TreeNode animal={maternalGrandmother} role="Grandmother" />
                    <TreeNode animal={maternalGrandfather} role="Grandfather" />
                  </div>
                </div>
                {/* Paternal */}
                <div className="flex flex-col items-center">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-[#8a938c]">
                    Paternal
                  </p>
                  <div className="flex items-start gap-3">
                    <TreeNode animal={paternalGrandmother} role="Grandmother" />
                    <TreeNode animal={paternalGrandfather} role="Grandfather" />
                  </div>
                </div>
              </div>
              <ConnectorVertical />
              {/* horizontal bar under grandparents */}
              <div className="flex w-full max-w-lg items-center px-8">
                <ConnectorHorizontal />
                <div className="h-2 w-2 rounded-full bg-[#c5c0b5]" />
                <ConnectorHorizontal />
              </div>
              <ConnectorVertical />
            </>
          )}

          {/* ── Parents ────────────────────────────── */}
          {hasParents && (
            <>
              <div className="flex items-start justify-center gap-6">
                <TreeNode animal={mother} role="Mother" />
                <TreeNode animal={father} role="Father" />
              </div>
              <ConnectorVertical />
              <div className="flex w-40 items-center">
                <ConnectorHorizontal />
                <div className="h-2 w-2 rounded-full bg-[#1f3d2e]/40" />
                <ConnectorHorizontal />
              </div>
              <ConnectorVertical />
            </>
          )}

          {/* ── This animal ────────────────────────── */}
          <TreeNode animal={animal} highlight role="This animal" />

          {/* ── Descendants (continuous: children → grandchildren → …) ── */}
          {hasChildren && (
            <>
              <ConnectorVertical />
              <div className="relative flex items-start justify-center gap-4">
                {/* top horizontal connector across children */}
                {children.length > 1 && (
                  <div
                    className="absolute left-0 right-0 top-0 mx-auto h-px bg-[#d4cfc3]"
                    style={{
                      width: `calc(100% - 140px)`,
                      top: 0,
                    }}
                  />
                )}
                {children.map((child) => (
                  <DescendantBranch key={child.id} node={child} depth={1} />
                ))}
              </div>
            </>
          )}

          {!hasGrandparents && !hasParents && !hasChildren && (
            <p className="mt-2 text-center text-sm text-[#66716a]">
              No family links yet. Set mother/father on edit to grow the tree.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default FamilyTreeSection;
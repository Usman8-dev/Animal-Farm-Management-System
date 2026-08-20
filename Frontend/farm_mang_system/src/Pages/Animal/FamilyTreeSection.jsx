import { Link } from "react-router-dom";
import { PawPrint, Users } from "lucide-react";
import { API_BASE_URL } from "../../apis/axios";

const resolveImageUrl = (url) =>
  url && url.startsWith("http") ? url : `${API_BASE_URL}${url}`;

function TreeNode({ animal, highlight = false, role }) {
  if (!animal) {
    return (
      <div className="flex w-[140px] flex-col items-center">
        {role && (
          <span
            className="mb-1 text-[10px] font-medium uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            {role}
          </span>
        )}
        <div
          className="flex h-[72px] w-[140px] items-center justify-center rounded-xl border border-dashed text-xs"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "color-mix(in srgb, var(--bg-muted) 60%, transparent)",
            color: "var(--text-muted)",
          }}
        >
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
        <span
          className="mb-1 text-[10px] font-medium uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          {role}
        </span>
      )}
      <Link
        to={`/animals/${animal.id}`}
        className="group relative flex w-full flex-col items-center rounded-xl border p-2.5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: highlight ? "var(--primary)" : "var(--border)",
          boxShadow: highlight
            ? "0 0 0 2px color-mix(in srgb, var(--primary) 20%, transparent)"
            : undefined,
        }}
      >
        <div
          className="relative mb-2 h-12 w-12 overflow-hidden rounded-full ring-2"
          style={{
            backgroundColor: "color-mix(in srgb, var(--primary) 10%, transparent)",
            ringColor: "var(--bg-card)",
          }}
        >
          {photo ? (
            <img
              src={photo}
              alt={label}
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <PawPrint size={18} style={{ color: "var(--primary)", opacity: 0.35 }} />
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
        <p
          className="w-full truncate text-center text-xs font-semibold transition-colors"
          style={{ color: "var(--text-heading)" }}
        >
          {label}
        </p>
        <p
          className="w-full truncate text-center text-[10px]"
          style={{ color: "var(--text-muted)" }}
        >
          #{animal.tag_number}
        </p>
        {animal.birth_date && (
          <p className="mt-0.5 text-[10px]" style={{ color: "var(--text-muted)" }}>
            {new Date(animal.birth_date).toLocaleDateString()}
          </p>
        )}
      </Link>
    </div>
  );
}

function ConnectorVertical({ className = "" }) {
  return (
    <div
      className={`mx-auto h-6 w-px ${className}`}
      style={{ backgroundColor: "var(--border)" }}
    />
  );
}

function ConnectorHorizontal() {
  return (
    <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
  );
}

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
            {kids.length > 1 && (
              <div
                className="absolute left-0 right-0 top-0 mx-auto h-px"
                style={{
                  width: "calc(100% - 140px)",
                  top: 0,
                  backgroundColor: "var(--border)",
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
      <div
        className="rounded-2xl border p-6"
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border)",
        }}
      >
        <div className="flex items-center justify-center py-12">
          <div
            className="h-8 w-8 animate-spin rounded-full border-2"
            style={{
              borderColor: "var(--border)",
              borderTopColor: "var(--primary)",
            }}
          />
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
    maternalGrandmother ||
    maternalGrandfather ||
    paternalGrandmother ||
    paternalGrandfather;
  const hasParents = mother || father;
  const hasChildren = children.length > 0;

  return (
    <section
      className="rounded-2xl border p-6 shadow-sm"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2
          className="font-display flex items-center gap-2 text-lg font-semibold"
          style={{ color: "var(--text-heading)" }}
        >
          <span
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)",
            }}
          >
            <Users size={16} style={{ color: "var(--primary)" }} />
          </span>
          Family Tree
        </h2>
        <div
          className="flex items-center gap-3 text-[11px]"
          style={{ color: "var(--text-muted)" }}
        >
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
          {hasGrandparents && (
            <>
              <div className="flex items-start justify-center gap-10">
                <div className="flex flex-col items-center">
                  <p
                    className="mb-2 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Maternal
                  </p>
                  <div className="flex items-start gap-3">
                    <TreeNode animal={maternalGrandmother} role="Grandmother" />
                    <TreeNode animal={maternalGrandfather} role="Grandfather" />
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <p
                    className="mb-2 text-[10px] font-semibold uppercase tracking-widest"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Paternal
                  </p>
                  <div className="flex items-start gap-3">
                    <TreeNode animal={paternalGrandmother} role="Grandmother" />
                    <TreeNode animal={paternalGrandfather} role="Grandfather" />
                  </div>
                </div>
              </div>
              <ConnectorVertical />
              <div className="flex w-full max-w-lg items-center px-8">
                <ConnectorHorizontal />
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: "var(--border)" }}
                />
                <ConnectorHorizontal />
              </div>
              <ConnectorVertical />
            </>
          )}

          {hasParents && (
            <>
              <div className="flex items-start justify-center gap-6">
                <TreeNode animal={mother} role="Mother" />
                <TreeNode animal={father} role="Father" />
              </div>
              <ConnectorVertical />
              <div className="flex w-40 items-center">
                <ConnectorHorizontal />
                <div
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor:
                      "color-mix(in srgb, var(--primary) 40%, transparent)",
                  }}
                />
                <ConnectorHorizontal />
              </div>
              <ConnectorVertical />
            </>
          )}

          <TreeNode animal={animal} highlight role="This animal" />

          {hasChildren && (
            <>
              <ConnectorVertical />
              <div className="relative flex items-start justify-center gap-4">
                {children.length > 1 && (
                  <div
                    className="absolute left-0 right-0 top-0 mx-auto h-px"
                    style={{
                      width: "calc(100% - 140px)",
                      top: 0,
                      backgroundColor: "var(--border)",
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
            <p
              className="mt-2 text-center text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              No family links yet. Set mother/father on edit to grow the tree.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export default FamilyTreeSection;
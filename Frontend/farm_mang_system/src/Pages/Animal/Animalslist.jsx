// import { useEffect, useState, useCallback, useRef } from "react";
// import { yupResolver } from "@hookform/resolvers/yup";
// import { useForm, Controller } from "react-hook-form";
// import { DataTable } from "primereact/datatable";
// import { Column } from "primereact/column";
// import { Dialog } from "primereact/dialog";
// import { InputText } from "primereact/inputtext";
// import { Dropdown } from "primereact/dropdown";
// import { Calendar } from "primereact/calendar";
// import { InputTextarea } from "primereact/inputtextarea";
// import { Button } from "primereact/button";
// import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
// import { Pencil, Trash2, Plus, Search } from "lucide-react";
// import api from "../../apis/axios";
// import { useToast } from "../../context/ToastContext";
// import { useAuth } from "../../context/AuthContext";
// import { AnimalSchema } from "../../validations/AnimalSchema";

// const ACQUISITION_OPTIONS = [
//   { label: "Born in Farm", value: "BORN_IN_FARM" },
//   { label: "Purchased", value: "PURCHASED" },
// ];

// function AnimalsList() {
//   const showToast = useToast();
//   const { user } = useAuth();
//   const canDelete = user?.role === "owner" || user?.role === "manager";

//   const [rows, setRows] = useState([]);
//   const [totalRecords, setTotalRecords] = useState(0);
//   const [loading, setLoading] = useState(true);
//   const [page, setPage] = useState(1);
//   const [limit] = useState(10);
//   const [search, setSearch] = useState("");
//   const searchDebounce = useRef(null);

//   const [animalTypes, setAnimalTypes] = useState([]);
//   const [breeds, setBreeds] = useState([]);
//   const [genders, setGenders] = useState([]);
//   const [allAnimals, setAllAnimals] = useState([]);

//   const [dialogOpen, setDialogOpen] = useState(false);
//   const [editingId, setEditingId] = useState(null);
//   const [saving, setSaving] = useState(false);

//   const {
//     control,
//     register,
//     handleSubmit,
//     reset,
//     watch,
//     formState: { errors },
//   } = useForm({
//     resolver: yupResolver(AnimalSchema),
//     defaultValues: {
//       tag_number: "",
//       name: "",
//       animal_type_id: null,
//       breed_id: null,
//       gender_id: null,
//       birth_date: null,
//       acquisition_type: "BORN_IN_FARM",
//       acquired_on: null,
//       mother_id: null,
//       father_id: null,
//       notes: "",
//     },
//   });

//   const watchedTypeId = watch("animal_type_id");
//   const watchedAcquisition = watch("acquisition_type");

//   const fetchAnimals = useCallback(async () => {
//     try {
//       setLoading(true);
//       const res = await api.get("/animal/api/animals", {
//         params: { page, limit, ...(search ? { search } : {}) },
//       });
//       setRows(res.data.data);
//       setTotalRecords(res.data.pagination.total);
//     } catch (err) {
//       showToast({
//         severity: "error",
//         summary: "Failed to load",
//         detail: err.response?.data?.message || "Could not load animals",
//       });
//     } finally {
//       setLoading(false);
//     }
//   }, [page, limit, search, showToast]);

//   useEffect(() => {
//     fetchAnimals();
//   }, [fetchAnimals]);

//   useEffect(() => {
//     const fetchRefData = async () => {
//       try {
//         const [typesRes, breedsRes, gendersRes, animalsRes] = await Promise.all([
//           api.get("/animal/api/animal-types"),
//           api.get("/animal/api/breeds"),
//           api.get("/animal/api/genders"),
//           api.get("/animal/api/animals", { params: { limit: 100 } }),
//         ]);
//         setAnimalTypes(typesRes.data.data);
//         setBreeds(breedsRes.data.data);
//         setGenders(gendersRes.data.data);
//         setAllAnimals(animalsRes.data.data);
//       } catch (err) {
//         showToast({
//           severity: "error",
//           summary: "Failed to load",
//           detail: "Could not load reference data",
//         });
//       }
//     };
//     fetchRefData();
//   }, [showToast]);

//   const handleSearchChange = (value) => {
//     clearTimeout(searchDebounce.current);
//     searchDebounce.current = setTimeout(() => {
//       setPage(1);
//       setSearch(value);
//     }, 400);
//   };

//   const typeOptions = animalTypes.map((t) => ({ label: t.name, value: t.id }));
//   const breedOptions = breeds
//     .filter((b) => b.animal_type_id === watchedTypeId)
//     .map((b) => ({ label: b.name, value: b.id }));
//   const genderOptions = genders.map((g) => ({ label: g.name, value: g.id }));
//   const animalOptions = (excludeId) =>
//     allAnimals
//       .filter((a) => a.id !== excludeId)
//       .map((a) => ({ label: `${a.tag_number}${a.name ? ` — ${a.name}` : ""}`, value: a.id }));

//   const openCreate = () => {
//     setEditingId(null);
//     reset({
//       tag_number: "",
//       name: "",
//       animal_type_id: null,
//       breed_id: null,
//       gender_id: null,
//       birth_date: null,
//       acquisition_type: "BORN_IN_FARM",
//       acquired_on: null,
//       mother_id: null,
//       father_id: null,
//       notes: "",
//     });
//     setDialogOpen(true);
//   };

//   const openEdit = (row) => {
//     setEditingId(row.id);
//     reset({
//       tag_number: row.tag_number,
//       name: row.name || "",
//       animal_type_id: row.animal_type_id,
//       breed_id: row.breed_id,
//       gender_id: row.gender_id,
//       birth_date: row.birth_date ? new Date(row.birth_date) : null,
//       acquisition_type: row.acquisition_type,
//       acquired_on: row.acquired_on ? new Date(row.acquired_on) : null,
//       mother_id: row.mother_id,
//       father_id: row.father_id,
//       notes: row.notes || "",
//     });
//     setDialogOpen(true);
//   };

//   const onSubmit = async (data) => {
//     try {
//       setSaving(true);
//       const payload = {
//         ...data,
//         birth_date: data.birth_date ? data.birth_date.toISOString() : null,
//         acquired_on: data.acquired_on ? data.acquired_on.toISOString() : null,
//         mother_id: data.acquisition_type === "PURCHASED" ? null : data.mother_id,
//         father_id: data.acquisition_type === "PURCHASED" ? null : data.father_id,
//       };

//       if (editingId) {
//         await api.put(`/animal/api/animals/${editingId}`, payload);
//         showToast({ severity: "success", summary: "Updated", detail: "Animal updated." });
//       } else {
//         await api.post("/animal/api/animals", payload);
//         showToast({ severity: "success", summary: "Created", detail: "Animal registered." });
//       }
//       setDialogOpen(false);
//       fetchAnimals();
//     } catch (err) {
//       showToast({
//         severity: "error",
//         summary: "Save failed",
//         detail: err.response?.data?.message || err.response?.data?.errors?.[0] || "Something went wrong",
//       });
//     } finally {
//       setSaving(false);
//     }
//   };

//   const confirmDelete = (row) => {
//     confirmDialog({
//       message: `Delete "${row.tag_number}"? This can't be undone.`,
//       header: "Confirm deletion",
//       icon: "pi pi-exclamation-triangle",
//       acceptClassName: "!bg-[#b3452d] !border-[#b3452d]",
//       accept: async () => {
//         try {
//           await api.delete(`/animal/api/animals/${row.id}`);
//           showToast({ severity: "success", summary: "Deleted", detail: "Animal removed." });
//           fetchAnimals();
//         } catch (err) {
//           showToast({
//             severity: "error",
//             summary: "Delete failed",
//             detail: err.response?.data?.message || "Could not delete this animal",
//           });
//         }
//       },
//     });
//   };

//   return (
//     <div className="font-sans">
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
//         * { font-family: 'Inter', sans-serif; }
//         .font-display { font-family: 'Fraunces', serif; }

//         .p-datatable .p-datatable-thead > tr > th {
//           background: #faf8f2; color: #66716a; font-size: 0.78rem;
//           text-transform: uppercase; letter-spacing: 0.03em; border-color: #e6e2d6; padding: 0.75rem 1rem;
//         }
//         .p-datatable .p-datatable-tbody > tr > td { border-color: #e6e2d6; padding: 0.75rem 1rem; font-size: 0.88rem; color: #1b241d; }
//         .p-datatable .p-datatable-tbody > tr:hover { background: #faf8f2; }
//         .p-paginator { background: transparent; border: none; padding-top: 1rem; }
//         .field-input, .field-input.p-inputtextarea { background: #fdfcf9; border: 1px solid #e6e2d6; }
//         .field-input:focus { outline: none; border-color: #3c6650 !important; box-shadow: 0 0 0 3px rgba(60,102,80,0.14) !important; }
//         .field-invalid { border-color: #b3452d !important; }
//         .dropdown-field.p-dropdown, .p-calendar .p-inputtext { background: #fdfcf9; border: 1px solid #e6e2d6; border-radius: 0.5rem; }
//         .dropdown-field.p-dropdown.p-focus, .p-calendar.p-inputwrapper-focus .p-inputtext { border-color: #3c6650 !important; box-shadow: 0 0 0 3px rgba(60,102,80,0.14) !important; }
//         .dropdown-field .p-dropdown-label { padding: 0.625rem 0.75rem; font-size: 0.875rem; color: #1b241d; }
//       `}</style>

//       <ConfirmDialog />

//       <div className="mb-6 flex items-center justify-between">
//         <div>
//           <h1 className="font-display font-semibold text-2xl text-[#14261d] mb-1">Animals</h1>
//           <p className="text-sm text-[#66716a]">All animals registered on your farm.</p>
//         </div>
//         <Button
//           label="Add Animal"
//           icon={<Plus size={16} className="mr-1.5" />}
//           onClick={openCreate}
//           className="!bg-[#1f3d2e] !border-[#1f3d2e] hover:!bg-[#3c6650] !rounded-lg !text-sm !font-semibold !px-4 !py-2"
//         />
//       </div>

//       <div className="relative mb-4 max-w-xs">
//         {/* <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#66716a]" /> */}
//         <InputText
//           onChange={(e) => handleSearchChange(e.target.value)}
//           placeholder="Search by tag or name…"
//           className="field-input w-full rounded-lg pl-9 pr-3 py-2.5 text-sm"
//         />
//       </div>

//       <DataTable
//         value={rows}
//         loading={loading}
//         // lazy
//         // paginator
//         // rows={limit}
//         // totalRecords={totalRecords}
//         // first={(page - 1) * limit}
//         // onPage={(e) => setPage(e.page + 1)}
//         paginator
//         rows={10}
//         rowsPerPageOptions={[5, 10, 25, 50]}
//         emptyMessage="No animals registered yet."
//       >
//         <Column field="tag_number" header="Tag #" sortable style={{ width: "12%" }} />
//         <Column field="name" header="Name" sortable body={(row) => row.name || "—"} />
//         <Column field="animalType.name" header="Type" style={{ width: "14%" }} />
//         <Column field="breed.name" header="Breed" style={{ width: "14%" }} />
//         <Column field="gender.name" header="Gender" style={{ width: "12%" }} />
//         <Column
//           field="acquisition_type"
//           header="Acquired"
//           style={{ width: "14%" }}
//           body={(row) => (
//             <span
//               className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
//                 row.acquisition_type === "BORN_IN_FARM"
//                   ? "bg-[#1f3d2e]/10 text-[#1f3d2e]"
//                   : "bg-[#c9a227]/15 text-[#8a6d1a]"
//               }`}
//             >
//               {row.acquisition_type === "BORN_IN_FARM" ? "Born in Farm" : "Purchased"}
//             </span>
//           )}
//         />
//         <Column
//           header="Actions"
//           style={{ width: "90px" }}
//           body={(row) => (
//             <div className="flex items-center gap-1">
//               <button onClick={() => openEdit(row)} className="p-1.5 text-[#66716a] hover:text-[#1f3d2e] transition-colors">
//                 <Pencil size={16} />
//               </button>
//               {canDelete && (
//                 <button onClick={() => confirmDelete(row)} className="p-1.5 text-[#66716a] hover:text-[#b3452d] transition-colors">
//                   <Trash2 size={16} />
//                 </button>
//               )}
//             </div>
//           )}
//         />
//       </DataTable>

//       <Dialog
//         header={editingId ? "Edit Animal" : "Add Animal"}
//         visible={dialogOpen}
//         onHide={() => setDialogOpen(false)}
//         style={{ width: "36rem" }}
//       >
//         <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-2">
//           <div className="grid grid-cols-2 gap-3">
//             <div className="flex flex-col gap-1.5">
//               <label className="text-[0.8rem] font-semibold text-[#1b241d]">Tag Number</label>
//               <InputText
//                 placeholder="e.g. G-0142"
//                 {...register("tag_number")}
//                 className={`field-input w-full rounded-lg px-3 py-2.5 text-sm ${errors.tag_number ? "field-invalid" : ""}`}
//               />
//               {errors.tag_number && <small className="text-[#b3452d] text-xs">{errors.tag_number.message}</small>}
//             </div>
//             <div className="flex flex-col gap-1.5">
//               <label className="text-[0.8rem] font-semibold text-[#1b241d]">Name (optional)</label>
//               <InputText
//                 placeholder="e.g. Bella"
//                 {...register("name")}
//                 className="field-input w-full rounded-lg px-3 py-2.5 text-sm"
//               />
//             </div>
//           </div>

//           <div className="grid grid-cols-3 gap-3">
//             <div className="flex flex-col gap-1.5">
//               <label className="text-[0.8rem] font-semibold text-[#1b241d]">Animal Type</label>
//               <Controller
//                 name="animal_type_id"
//                 control={control}
//                 render={({ field }) => (
//                   <Dropdown
//                     value={field.value}
//                     onChange={(e) => field.onChange(e.value)}
//                     options={typeOptions}
//                     placeholder="Select"
//                     className={`dropdown-field w-full ${errors.animal_type_id ? "field-invalid" : ""}`}
//                   />
//                 )}
//               />
//               {errors.animal_type_id && <small className="text-[#b3452d] text-xs">{errors.animal_type_id.message}</small>}
//             </div>

//             <div className="flex flex-col gap-1.5">
//               <label className="text-[0.8rem] font-semibold text-[#1b241d]">Breed</label>
//               <Controller
//                 name="breed_id"
//                 control={control}
//                 render={({ field }) => (
//                   <Dropdown
//                     value={field.value}
//                     onChange={(e) => field.onChange(e.value)}
//                     options={breedOptions}
//                     placeholder={watchedTypeId ? "Select" : "Pick type first"}
//                     disabled={!watchedTypeId}
//                     className={`dropdown-field w-full ${errors.breed_id ? "field-invalid" : ""}`}
//                   />
//                 )}
//               />
//               {errors.breed_id && <small className="text-[#b3452d] text-xs">{errors.breed_id.message}</small>}
//             </div>

//             <div className="flex flex-col gap-1.5">
//               <label className="text-[0.8rem] font-semibold text-[#1b241d]">Gender</label>
//               <Controller
//                 name="gender_id"
//                 control={control}
//                 render={({ field }) => (
//                   <Dropdown
//                     value={field.value}
//                     onChange={(e) => field.onChange(e.value)}
//                     options={genderOptions}
//                     placeholder="Select"
//                     className={`dropdown-field w-full ${errors.gender_id ? "field-invalid" : ""}`}
//                   />
//                 )}
//               />
//               {errors.gender_id && <small className="text-[#b3452d] text-xs">{errors.gender_id.message}</small>}
//             </div>
//           </div>

//           <div className="grid grid-cols-2 gap-3">
//             <div className="flex flex-col gap-1.5">
//               <label className="text-[0.8rem] font-semibold text-[#1b241d]">Birth Date (optional)</label>
//               <Controller
//                 name="birth_date"
//                 control={control}
//                 render={({ field }) => (
//                   <Calendar
//                     value={field.value}
//                     onChange={(e) => field.onChange(e.value)}
//                     dateFormat="yy-mm-dd"
//                     maxDate={new Date()}
//                     showIcon
//                     placeholder="Select date"
//                   />
//                 )}
//               />
//               {errors.birth_date && <small className="text-[#b3452d] text-xs">{errors.birth_date.message}</small>}
//             </div>

//             <div className="flex flex-col gap-1.5">
//               <label className="text-[0.8rem] font-semibold text-[#1b241d]">Acquisition Type</label>
//               <Controller
//                 name="acquisition_type"
//                 control={control}
//                 render={({ field }) => (
//                   <Dropdown
//                     value={field.value}
//                     onChange={(e) => field.onChange(e.value)}
//                     options={ACQUISITION_OPTIONS}
//                     className={`dropdown-field w-full ${errors.acquisition_type ? "field-invalid" : ""}`}
//                   />
//                 )}
//               />
//               {errors.acquisition_type && <small className="text-[#b3452d] text-xs">{errors.acquisition_type.message}</small>}
//             </div>
//           </div>

//           {watchedAcquisition === "PURCHASED" ? (
//             <div className="flex flex-col gap-1.5">
//               <label className="text-[0.8rem] font-semibold text-[#1b241d]">Acquired On</label>
//               <Controller
//                 name="acquired_on"
//                 control={control}
//                 render={({ field }) => (
//                   <Calendar
//                     value={field.value}
//                     onChange={(e) => field.onChange(e.value)}
//                     dateFormat="yy-mm-dd"
//                     maxDate={new Date()}
//                     showIcon
//                     placeholder="Select date"
//                   />
//                 )}
//               />
//             </div>
//           ) : (
//             <div className="grid grid-cols-2 gap-3">
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-[0.8rem] font-semibold text-[#1b241d]">Mother (optional)</label>
//                 <Controller
//                   name="mother_id"
//                   control={control}
//                   render={({ field }) => (
//                     <Dropdown
//                       value={field.value}
//                       onChange={(e) => field.onChange(e.value)}
//                       options={animalOptions(editingId)}
//                       placeholder="None"
//                       showClear
//                       filter
//                       className="dropdown-field w-full"
//                     />
//                   )}
//                 />
//               </div>
//               <div className="flex flex-col gap-1.5">
//                 <label className="text-[0.8rem] font-semibold text-[#1b241d]">Father (optional)</label>
//                 <Controller
//                   name="father_id"
//                   control={control}
//                   render={({ field }) => (
//                     <Dropdown
//                       value={field.value}
//                       onChange={(e) => field.onChange(e.value)}
//                       options={animalOptions(editingId)}
//                       placeholder="None"
//                       showClear
//                       filter
//                       className="dropdown-field w-full"
//                     />
//                   )}
//                 />
//               </div>
//             </div>
//           )}

//           <div className="flex flex-col gap-1.5">
//             <label className="text-[0.8rem] font-semibold text-[#1b241d]">Notes (optional)</label>
//             <InputTextarea
//               rows={3}
//               {...register("notes")}
//               className="field-input w-full rounded-lg px-3 py-2.5 text-sm"
//             />
//           </div>

//           <Button
//             type="submit"
//             label={saving ? "Saving…" : editingId ? "Save Changes" : "Register Animal"}
//             loading={saving}
//             className="!mt-2 !w-full !justify-center !bg-[#1f3d2e] !border-[#1f3d2e] hover:!bg-[#3c6650] !rounded-lg !py-2.5 !font-semibold !text-sm"
//           />
//         </form>
//       </Dialog>
//     </div>
//   );
// }

// export default AnimalsList;

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import { Pencil, Trash2, Plus, Search, Eye } from "lucide-react";
import api from "../../apis/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import AnimalFormDialog from "./Animalformdialog";

function AnimalsList() {
  const showToast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const canDelete = user?.role === "owner" || user?.role === "manager";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");

  const [animalTypes, setAnimalTypes] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [genders, setGenders] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchAnimals = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/animal/api/animals", { params: { limit: 50 } });
      setRows(res.data.data);
    } catch (err) {
      showToast({
        severity: "error",
        summary: "Failed to load",
        detail: err.response?.data?.message || "Could not load animals",
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchRefData = useCallback(async () => {
    try {
      const [typesRes, breedsRes, gendersRes] = await Promise.all([
        api.get("/animal/api/animal-types"),
        api.get("/animal/api/breeds"),
        api.get("/animal/api/genders"),
      ]);
      setAnimalTypes(typesRes.data.data);
      setBreeds(breedsRes.data.data);
      setGenders(gendersRes.data.data);
    } catch {
      showToast({ severity: "error", summary: "Failed to load", detail: "Could not load reference data" });
    }
  }, [showToast]);

  useEffect(() => {
    fetchAnimals();
    fetchRefData();
  }, [fetchAnimals, fetchRefData]);

  const openCreate = () => {
    setEditingAnimal(null);
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditingAnimal(row);
    setDialogOpen(true);
  };

  const handleSubmitForm = async (payload, editingId) => {
    try {
      setSaving(true);
      if (editingId) {
        await api.put(`/animal/api/animals/${editingId}`, payload);
        showToast({ severity: "success", summary: "Updated", detail: "Animal updated." });
      } else {
        await api.post("/animal/api/animals", payload);
        showToast({ severity: "success", summary: "Created", detail: "Animal registered." });
      }
      setDialogOpen(false);
      fetchAnimals();
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

  const confirmDelete = (row) => {
    confirmDialog({
      message: `Delete "${row.tag_number}"? This can't be undone.`,
      header: "Confirm deletion",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "!bg-[#b3452d] !border-[#b3452d]",
      accept: async () => {
        try {
          await api.delete(`/animal/api/animals/${row.id}`);
          showToast({ severity: "success", summary: "Deleted", detail: "Animal removed." });
          fetchAnimals();
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

  return (
    <div className="font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .font-display { font-family: 'Fraunces', serif; }

        .p-datatable .p-datatable-thead > tr > th {
          background: #faf8f2; color: #66716a; font-size: 0.78rem;
          text-transform: uppercase; letter-spacing: 0.03em; border-color: #e6e2d6; padding: 0.75rem 1rem;
        }
        .p-datatable .p-datatable-tbody > tr > td { border-color: #e6e2d6; padding: 0.75rem 1rem; font-size: 0.88rem; color: #1b241d; }
        .p-datatable .p-datatable-tbody > tr:hover { background: #faf8f2; }
        .p-paginator { background: transparent; border: none; padding-top: 1rem; }
        .field-input { background: #fdfcf9; border: 1px solid #e6e2d6; }
        .field-input:focus { outline: none; border-color: #3c6650 !important; box-shadow: 0 0 0 3px rgba(60,102,80,0.14) !important; }
      `}</style>

      <ConfirmDialog />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display font-semibold text-2xl text-[#14261d] mb-1">Animals</h1>
          <p className="text-sm text-[#66716a]">All animals registered on your farm.</p>
        </div>
        <Button
          label="Add Animal"
          icon={<Plus size={16} className="mr-1.5" />}
          onClick={openCreate}
          className="!bg-[#1f3d2e] !border-[#1f3d2e] hover:!bg-[#3c6650] !rounded-lg !text-sm !font-semibold !px-4 !py-2"
        />
      </div>

      <div className="relative mb-4 max-w-xs">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#66716a]" />
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search by tag or name…"
          className="field-input w-full rounded-lg pl-9 pr-3 py-2.5 text-sm"
        />
      </div>

      <DataTable
        value={rows}
        loading={loading}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 100]}
        globalFilter={globalFilter}
        globalFilterFields={["tag_number", "name"]}
        emptyMessage="No animals registered yet."
        onRowClick={(e) => navigate(`/animals/${e.data.id}`)}
        rowClassName={() => "cursor-pointer"}
      >
        <Column field="tag_number" header="Tag #" sortable style={{ width: "12%" }} />
        <Column field="name" header="Name" sortable body={(row) => row.name || "—"} />
        <Column field="animalType.name" header="Type" sortable style={{ width: "14%" }} />
        <Column field="breed.name" header="Breed" sortable style={{ width: "14%" }} />
        <Column field="gender.name" header="Gender" sortable style={{ width: "12%" }} />
        <Column
          field="acquisition_type"
          header="Acquired"
          sortable
          style={{ width: "14%" }}
          body={(row) => (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                row.acquisition_type === "BORN_IN_FARM"
                  ? "bg-[#1f3d2e]/10 text-[#1f3d2e]"
                  : "bg-[#c9a227]/15 text-[#8a6d1a]"
              }`}
            >
              {row.acquisition_type === "BORN_IN_FARM" ? "Born in Farm" : "Purchased"}
            </span>
          )}
        />
        <Column
          header=""
          style={{ width: "110px" }}
          body={(row) => (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => navigate(`/animals/${row.id}`)} className="p-1.5 text-[#66716a] hover:text-[#1f3d2e] transition-colors">
                <Eye size={16} />
              </button>
              <button onClick={() => openEdit(row)} className="p-1.5 text-[#66716a] hover:text-[#1f3d2e] transition-colors">
                <Pencil size={16} />
              </button>
              {canDelete && (
                <button onClick={() => confirmDelete(row)} className="p-1.5 text-[#66716a] hover:text-[#b3452d] transition-colors">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}
        />
      </DataTable>

      <AnimalFormDialog
        visible={dialogOpen}
        onHide={() => setDialogOpen(false)}
        editingAnimal={editingAnimal}
        animalTypes={animalTypes}
        breeds={breeds}
        genders={genders}
        allAnimals={rows}
        saving={saving}
        onSubmitForm={handleSubmitForm}
      />
    </div>
  );
}

export default AnimalsList;
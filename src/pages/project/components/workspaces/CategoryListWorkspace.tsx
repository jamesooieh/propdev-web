import React, { useMemo, useState, useEffect } from 'react';
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_SortingState,
    type MRT_PaginationState
} from 'material-react-table';
import {
    Box, IconButton, Tooltip, Chip, Button, Dialog, DialogTitle,
    DialogContent, DialogContentText, DialogActions, TextField,
    Typography, Alert, CircularProgress,
    Grid,
    Divider,
    Collapse
} from '@mui/material';
import { Edit, Delete, FolderOpen, Refresh, Add, Warning, RemoveCircleOutline, ExpandMore, ExpandLess } from '@mui/icons-material';

// Services & Enums
import { CategoryService, Category } from '../../../../services/category';
import { CategoryStatus, CategoryStatusLabels } from '../../../../enums';

// 🆕 Interface for Level 3: Types (Only Title required per backend)
interface LocalTypeState {
    id?: string;
    title: string;
}

// 🆕 Interface for the local group state inside the dialog
interface LocalGroupState {
    id?: string; // Existing groups have IDs
    title: string;
    types: LocalTypeState[]; // 🆕 Nested Types Array
    isExpanded?: boolean;    // 🆕 UI State for collapsing
}

interface CategoryListWorkspaceProps {
    projectId: string;
    onCategoryChange: () => void;
    onSelectCategory: (category: Category) => void;
}

const CategoryListWorkspace: React.FC<CategoryListWorkspaceProps> = ({ projectId, onCategoryChange, onSelectCategory }) => {
    // --- Server-Side Data State ---
    const [data, setData] = useState<Category[]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- MRT Table State ---
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<MRT_SortingState>([{ id: 'title', desc: false }]);
    const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });

    // --- 🔧 Unified Dialog State ---
    // We consolidate Create/Edit states here to handle nested data easier
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    // 🆕 Form Data State (Used for both Create and Edit)
    const [formTitle, setFormTitle] = useState('');
    const [formGroups, setFormGroups] = useState<LocalGroupState[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null); // To track which ID we are editing
    const [isSubmitting, setIsSubmitting] = useState(false);

    // // --- Create Dialog State ---
    // const [createDialogOpen, setCreateDialogOpen] = useState(false);
    // const [newCategoryTitle, setNewCategoryTitle] = useState('');
    // const [isCreating, setIsCreating] = useState(false);

    // // --- Edit Dialog State ---
    // const [editDialogOpen, setEditDialogOpen] = useState(false);
    // const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    // const [editTitle, setEditTitle] = useState('');

    // --- Delete Dialog State ---
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- Fetch Data ---
    const fetchCategories = async () => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = {
                project_id: projectId,
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
                search: globalFilter || undefined,
                sort: sorting.length > 0 ? sorting[0].id : 'created_at',
                direction: (sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc') as 'asc' | 'desc',
                get_all_groups: true // 🆕 Hint to backend to return groups
            };

            const res = await CategoryService.getAll(queryParams);
            setData(res.data || []);
            setTotalRows(res.meta?.total || res.total || 0);

        } catch (e) {
            console.error(e);
            setError("Failed to load categories.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCategories(); }, [projectId, pagination.pageIndex, pagination.pageSize, sorting, globalFilter]);

    // 🆕 --- Nested Group Logic (Local Form Actions) ---

    // 🔧 Updated to initialize types array and expanded state
    const handleAddGroupRow = () => {
        setFormGroups([...formGroups, { title: '', types: [], isExpanded: true }]);
    };

    const handleRemoveGroupRow = (index: number) => {
        const updated = [...formGroups];
        updated.splice(index, 1);
        setFormGroups(updated);
    };

    // 🆕 Toggle Group Expansion
    const handleToggleGroupExpand = (index: number) => {
        const updated = [...formGroups];
        updated[index].isExpanded = !updated[index].isExpanded;
        setFormGroups(updated);
    };

    // 🔧 Generic handler for Group fields
    const handleGroupChange = (index: number, field: keyof LocalGroupState, val: any) => {
        const updated = [...formGroups];
        // @ts-ignore
        updated[index][field] = val;
        setFormGroups(updated);
    };

    // 🆕 Add Type Row
    const handleAddTypeRow = (groupIndex: number) => {
        const updatedGroups = [...formGroups];
        updatedGroups[groupIndex].types.push({ title: '' });
        setFormGroups(updatedGroups);
    };

    // 🆕 Remove Type Row
    const handleRemoveTypeRow = (groupIndex: number, typeIndex: number) => {
        const updatedGroups = [...formGroups];
        updatedGroups[groupIndex].types.splice(typeIndex, 1);
        setFormGroups(updatedGroups);
    };

    // 🆕 Handle Type Title Change
    const handleTypeTitleChange = (groupIndex: number, typeIndex: number, val: string) => {
        const updatedGroups = [...formGroups];
        updatedGroups[groupIndex].types[typeIndex].title = val;
        setFormGroups(updatedGroups);
    };

    // --- Create Logic ---
    const handleOpenCreate = () => {
        // 🔧 Reset unified form state
        setFormTitle('');
        setFormGroups([]);
        setEditingId(null);
        setCreateDialogOpen(true);
    };

    const handleCreate = async () => {
        if (!formTitle.trim()) return;
        setIsSubmitting(true); // 🔧 Renamed from isCreating
        try {
            await CategoryService.create({
                project_id: projectId,
                title: formTitle,

                // 🔧 Send Groups AND Nested Types
                groups: formGroups
                    .filter(g => g.title.trim() !== '')
                    .map(g => ({
                        title: g.title,
                        types: g.types.filter(t => t.title.trim() !== '') // 🆕 Filter valid types
                    })),
            });
            setCreateDialogOpen(false);
            fetchCategories();
            onCategoryChange();
        } catch (e) {
            alert("Failed to create category");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Edit Logic ---
    const handleOpenEdit = (category: Category) => {
        // 🔧 Populate unified form state
        setFormTitle(category.title);
        setEditingId(category.id);

        // 🔧 Map existing Groups AND Types from API to local state
        const existingGroups: LocalGroupState[] = category.groups?.map(g => ({
            id: g.id,
            title: g.title,
            isExpanded: false, // Default collapsed
            // 🆕 Map nested types (Assuming backend loads 'types' on group object)
            // @ts-ignore 
            types: g.types?.map((t: any) => ({
                id: t.id,
                title: t.title
            })) || []
        })) || [];

        setFormGroups(existingGroups);
        setEditDialogOpen(true);
        setError(null);
    };

    const handleSaveEdit = async () => {
        if (!editingId || !formTitle.trim()) return;
        setIsSubmitting(true);

        try {
            await CategoryService.update(projectId, editingId, {
                title: formTitle,

                // 🔧 Send deep structure
                groups: formGroups
                    .filter(g => g.title.trim() !== '')
                    .map(g => ({
                        id: g.id,
                        title: g.title,
                        types: g.types.filter(t => t.title.trim() !== '') // 🆕 Nested Types
                    })),
            });
            setEditDialogOpen(false);
            fetchCategories();
            onCategoryChange();
        } catch (e) {
            setError("Failed to update category.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // // --- Create Logic ---
    // const handleCreate = async () => {
    //     if (!newCategoryTitle.trim()) return;
    //     setIsCreating(true);
    //     try {
    //         await CategoryService.create({
    //             project_id: projectId,
    //             title: newCategoryTitle,
    //             status: CategoryStatus.ACTIVE
    //         });
    //         setCreateDialogOpen(false);
    //         setNewCategoryTitle('');

    //         // Refresh local list AND sidebar
    //         fetchCategories();
    //         onCategoryChange();
    //     } catch (e) {
    //         alert("Failed to create category");
    //     } finally {
    //         setIsCreating(false);
    //     }
    // };

    // // --- Edit Logic ---
    // const openEditDialog = (category: Category) => {
    //     setEditingCategory(category);
    //     setEditTitle(category.title);
    //     setEditDialogOpen(true);
    //     setError(null);
    // };

    // const handleSaveEdit = async () => {
    //     if (!editingCategory || !editTitle.trim()) return;

    //     try {
    //         await CategoryService.update(projectId, editingCategory.id, {
    //             title: editTitle,
    //             status: editingCategory.status
    //         });
    //         setEditDialogOpen(false);

    //         // Refresh local list AND sidebar (in case title changed)
    //         fetchCategories();
    //         onCategoryChange();
    //     } catch (e) {
    //         setError("Failed to update category.");
    //     }
    // };

    // --- Delete Logic ---
    const handleDeleteClick = (category: Category) => {
        setCategoryToDelete(category);
        setDeleteDialogOpen(true);
        setError(null);
    };

    const confirmDelete = async () => {
        if (!categoryToDelete) return;

        setIsDeleting(true);
        setError(null);

        try {
            await CategoryService.delete(projectId, categoryToDelete.id);
            setDeleteDialogOpen(false);
            setCategoryToDelete(null);

            // Refresh local list AND sidebar
            fetchCategories();
            onCategoryChange();
        } catch (err: any) {
            console.error(err);
            setDeleteDialogOpen(false);

            if (err.response && err.response.status === 422) {
                setError(err.response.data.message || "Cannot delete this category because it is in use.");
            } else {
                setError("An unexpected error occurred while deleting the category.");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Columns ---
    const columns = useMemo<MRT_ColumnDef<Category>[]>(
        () => [
            {
                accessorKey: 'title',
                header: 'Category Title',
                size: 200,
                Cell: ({ cell }) => <strong>{cell.getValue<string>()}</strong>
            },
            {
                accessorKey: 'status',
                header: 'Status',
                size: 100,
                Cell: ({ cell }) => (
                    <Chip
                        label={CategoryStatusLabels[cell.getValue<CategoryStatus>()]}
                        color={cell.getValue<string>() === 'A' ? 'success' : 'default'}
                        size="small"
                        variant="outlined"
                    />
                )
            },
            {
                id: 'groups_count',
                header: 'Groups',
                size: 100,
                Cell: ({ row }) => {
                    const count = row.original.groups?.length || 0;
                    return <Chip label={count} size="small" />;
                }
            },
        ],
        []
    );

    const table = useMaterialReactTable({
        columns,
        data,
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true,
        rowCount: totalRows,
        state: { isLoading: loading, showProgressBars: loading, pagination, sorting, globalFilter },
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        enableRowActions: true,
        positionActionsColumn: 'last',
        enableColumnFilters: false,
        enableDensityToggle: false,
        initialState: { density: 'compact' },

        renderRowActions: ({ row }) => (
            <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                <Tooltip title="View Groups">
                    <IconButton color="info" onClick={() => onSelectCategory(row.original)}>
                        <FolderOpen />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Edit">
                    {/* <IconButton color="primary" onClick={() => openEditDialog(row.original)}>
                        <Edit />
                    </IconButton> */}
                    <IconButton color="primary" onClick={() => handleOpenEdit(row.original)}>
                        <Edit />
                    </IconButton>
                </Tooltip>

                <Tooltip title="Delete">
                    <IconButton color="error" onClick={() => handleDeleteClick(row.original)}>
                        <Delete />
                    </IconButton>
                </Tooltip>
            </Box>
        ),

        renderTopToolbarCustomActions: () => (
            <Button startIcon={<Refresh />} onClick={fetchCategories} size="small">
                Refresh
            </Button>
        ),
    });

    // 🔧 Helper to render the form content (Shared by Create & Edit)
    const renderDialogContent = () => (
        <Box sx={{ mt: 1 }}>
            <TextField
                autoFocus margin="dense" label="Category Title" fullWidth
                value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
            />

            {/* Groups Section Header */}
            <Box sx={{ mt: 3, mb: 1 }}>
                <Grid container justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" color="primary">Groups & Types Hierarchy</Typography>
                    <Button size="small" startIcon={<Add />} onClick={handleAddGroupRow}>
                        Add Group
                    </Button>
                </Grid>
                <Divider sx={{ my: 1 }} />
            </Box>

            {/* Groups List */}
            <Box sx={{ maxHeight: '400px', overflowY: 'auto', pr: 1 }}>
                {formGroups.map((group, gIndex) => (
                    // 🔧 Wrapped in a Box with border
                    <Box key={gIndex} sx={{ mb: 2, border: '1px solid #eee', borderRadius: 1, p: 1 }}>
                        <Grid container spacing={1} alignItems="center">
                            {/* 🆕 Expand Button */}
                            <Grid size={{ xs: 1 }}>
                                <IconButton 
                                    size="small" 
                                    onClick={() => handleToggleGroupExpand(gIndex)}
                                >
                                    {group.isExpanded ? <ExpandLess /> : <ExpandMore />}
                                </IconButton>
                            </Grid>
                            <Grid size={{ xs: 9 }}>
                                <TextField
                                    placeholder="Group Title (e.g. Residential)"
                                    fullWidth
                                    size="small"
                                    value={group.title}
                                    onChange={(e) => handleGroupChange(gIndex, 'title', e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 2 }} sx={{ textAlign: 'center' }}>
                                <IconButton size="small" color="error" onClick={() => handleRemoveGroupRow(gIndex)}>
                                    <RemoveCircleOutline fontSize="small" />
                                </IconButton>
                            </Grid>
                        </Grid>

                        {/* 🆕 Level 3: Nested Types (Collapsible) */}
                        <Collapse in={group.isExpanded} unmountOnExit>
                             <Box sx={{ pl: 2, mt: 1, borderLeft: '3px solid #f0f0f0', ml: 2, py: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, pr: 1 }}>
                                    <Typography variant="caption" color="textSecondary" sx={{ fontWeight: 'bold', mt: 0.5 }}>
                                        TYPES
                                    </Typography>
                                    <Button 
                                        size="small" 
                                        sx={{ fontSize: '0.7rem', py: 0, minWidth: 'auto' }} 
                                        startIcon={<Add sx={{ fontSize: '1rem !important' }} />} 
                                        onClick={() => handleAddTypeRow(gIndex)}
                                    >
                                        Add Type
                                    </Button>
                                </Box>

                                {group.types.map((type, tIndex) => (
                                    <Grid container spacing={1} key={tIndex} alignItems="center" sx={{ mb: 1 }}>
                                        <Grid size={{ xs: 10 }}>
                                            <TextField 
                                                placeholder="Type Title (e.g. Type A)"
                                                fullWidth 
                                                size="small"
                                                variant="standard" // 🆕 Visual distinction
                                                value={type.title}
                                                onChange={(e) => handleTypeTitleChange(gIndex, tIndex, e.target.value)}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 2 }} sx={{ textAlign: 'center' }}>
                                            <IconButton size="small" onClick={() => handleRemoveTypeRow(gIndex, tIndex)}>
                                                <RemoveCircleOutline fontSize="small" color="action" />
                                            </IconButton>
                                        </Grid>
                                    </Grid>
                                ))}

                                {group.types.length === 0 && (
                                    <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic', display: 'block' }}>
                                        No types added.
                                    </Typography>
                                )}
                            </Box>
                        </Collapse>
                    </Box>
                ))}
                
                {formGroups.length === 0 && (
                    <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic', display: 'block', textAlign: 'center' }}>
                        No groups added yet.
                    </Typography>
                )}
            </Box>
        </Box>
    );

    return (
        <Box>
            {/* Header Area */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">Manage Categories</Typography>

                <Button
                    variant="contained"
                    startIcon={<Add />}
                    // onClick={() => setCreateDialogOpen(true)}
                    onClick={handleOpenCreate} // 🔧 Switched to handleOpenCreate
                >
                    Add Category
                </Button>
            </Box>

            {/* Display Errors Here */}
            {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                    {error}
                </Alert>
            )}

            <MaterialReactTable table={table} />

            {/* --- Create Dialog --- */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Add New Category</DialogTitle>
                <DialogContent>
                    {/* <TextField
                        autoFocus margin="dense" label="Category Title" fullWidth
                        value={newCategoryTitle} onChange={(e) => setNewCategoryTitle(e.target.value)}
                    /> */}
                    {renderDialogContent()} {/* 🆕 Render Shared Form */}
                </DialogContent>
                {/* <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)} disabled={isCreating}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreate} disabled={isCreating}>
                        {isCreating ? 'Creating...' : 'Create'}
                    </Button>
                </DialogActions> */}
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreate} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- Edit Dialog --- */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Edit Category</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>Update the category details below.</DialogContentText>
                    {/* <TextField
                        autoFocus margin="dense" label="Category Title" fullWidth
                        value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                    /> */}
                    {renderDialogContent()} {/* 🆕 Render Shared Form */}
                </DialogContent>
                {/* <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveEdit} variant="contained">Save Changes</Button>
                </DialogActions> */}
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveEdit} variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- Delete Confirmation Dialog --- */}
            <Dialog open={deleteDialogOpen} onClose={() => !isDeleting && setDeleteDialogOpen(false)}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="error" /> Confirm Deletion
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the category <strong>{categoryToDelete?.title}</strong>?
                        <br /><br />
                        This action will remove the category from the project.
                        <br />
                        <Typography variant="caption" color="text.secondary">
                            (Note: Deletion will be blocked if this category still contains active groups.)
                        </Typography>
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmDelete}
                        color="error"
                        variant="contained"
                        disabled={isDeleting}
                        startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : <Delete />}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CategoryListWorkspace;
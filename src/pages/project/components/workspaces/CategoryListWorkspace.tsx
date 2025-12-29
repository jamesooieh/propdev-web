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
    Typography, Alert, CircularProgress
} from '@mui/material';
import { Edit, Delete, FolderOpen, Refresh, Add, Warning } from '@mui/icons-material';

// Services & Enums
import { CategoryService, Category } from '../../../../services/category';
import { CategoryStatus, CategoryStatusLabels } from '../../../../enums';

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

    // --- Create Dialog State ---
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newCategoryTitle, setNewCategoryTitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // --- Edit Dialog State ---
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editTitle, setEditTitle] = useState('');

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

    // --- Create Logic ---
    const handleCreate = async () => {
        if (!newCategoryTitle.trim()) return;
        setIsCreating(true);
        try {
            await CategoryService.create({
                project_id: projectId,
                title: newCategoryTitle,
                status: CategoryStatus.ACTIVE
            });
            setCreateDialogOpen(false);
            setNewCategoryTitle('');

            // Refresh local list AND sidebar
            fetchCategories();
            onCategoryChange();
        } catch (e) {
            alert("Failed to create category");
        } finally {
            setIsCreating(false);
        }
    };

    // --- Edit Logic ---
    const openEditDialog = (category: Category) => {
        setEditingCategory(category);
        setEditTitle(category.title);
        setEditDialogOpen(true);
        setError(null);
    };

    const handleSaveEdit = async () => {
        if (!editingCategory || !editTitle.trim()) return;

        try {
            await CategoryService.update(projectId, editingCategory.id, {
                title: editTitle,
                status: editingCategory.status
            });
            setEditDialogOpen(false);

            // Refresh local list AND sidebar (in case title changed)
            fetchCategories();
            onCategoryChange();
        } catch (e) {
            setError("Failed to update category.");
        }
    };

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
                    <IconButton color="primary" onClick={() => openEditDialog(row.original)}>
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

    return (
        <Box>
            {/* Header Area */}
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">Manage Categories</Typography>

                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => setCreateDialogOpen(true)}
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
                    <TextField
                        autoFocus margin="dense" label="Category Title" fullWidth
                        value={newCategoryTitle} onChange={(e) => setNewCategoryTitle(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)} disabled={isCreating}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreate} disabled={isCreating}>
                        {isCreating ? 'Creating...' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- Edit Dialog --- */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Edit Category</DialogTitle>
                <DialogContent>
                    <DialogContentText sx={{ mb: 2 }}>Update the category details below.</DialogContentText>
                    <TextField
                        autoFocus margin="dense" label="Category Title" fullWidth
                        value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveEdit} variant="contained">Save Changes</Button>
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
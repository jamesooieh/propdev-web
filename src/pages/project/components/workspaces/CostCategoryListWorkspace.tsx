import React, { useMemo, useState, useEffect } from 'react';
import { 
    MaterialReactTable, 
    useMaterialReactTable, 
    type MRT_ColumnDef, 
    type MRT_SortingState, 
    type MRT_PaginationState,
    type MRT_Row,
} from 'material-react-table';
import { 
    Box, IconButton, Tooltip, Button, Dialog, DialogTitle, 
    DialogContent, DialogActions, TextField, 
    Typography, Alert, Grid
} from '@mui/material';
import { Edit, Delete, Refresh, Add, FolderOpen, MonetizationOn } from '@mui/icons-material';

// Services
import { CostCategoryService, CostCategory } from '../../../../services/costCategory';

interface CostCategoryListWorkspaceProps {
    projectId: string;
    // Optional: Callback when a user clicks "Open" to view groups inside this category
    onSelectCategory?: (category: CostCategory) => void;
}

const CostCategoryListWorkspace: React.FC<CostCategoryListWorkspaceProps> = ({ projectId, onSelectCategory }) => {
    
    // --- State ---
    const [data, setData] = useState<CostCategory[]>([]);
    const [totalRows, setTotalRows] = useState(0); 
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // MRT State
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<MRT_SortingState>([{ id: 'position', desc: false }]);
    const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });

    // Dialogs
    const [dialogOpen, setDialogOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<Partial<CostCategory>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Fetch Data ---
    const fetchData = async () => {
        if (!projectId) return;

        setLoading(true);
        setError(null);
        try {
            const res = await CostCategoryService.getAll({
                project_id: projectId,
                // page: pagination.pageIndex + 1,
                // per_page: pagination.pageSize,
                // search: globalFilter || undefined,
                // sort: sorting.length > 0 ? sorting[0].id : 'position',
                // direction: (sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc') as 'asc' | 'desc',
                get_all: true,
                sort: 'position', 
                direction: 'asc',
            });
            setData(res.data || []);
            setTotalRows(res.meta?.total || res.total || 0);
        } catch (e) {
            console.error(e);
            setError("Failed to load cost categories.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [projectId, pagination.pageIndex, pagination.pageSize, sorting, globalFilter]);

    // --- Actions ---
    const handleOpenCreate = () => {
        setCurrentCategory({ title: '' });
        setIsEditMode(false);
        setDialogOpen(true);
    };

    const handleOpenEdit = (cat: CostCategory) => {
        setCurrentCategory({ ...cat });
        setIsEditMode(true);
        setDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (!currentCategory.title) return alert("Title is required");

        setIsSubmitting(true);
        try {
            if (isEditMode && currentCategory.id) {
                await CostCategoryService.update(projectId, currentCategory.id, { title: currentCategory.title });
            } else {
                await CostCategoryService.create({ project_id: projectId, title: currentCategory.title! });
            }
            setDialogOpen(false);
            fetchData();
        } catch (e) {
            console.error(e);
            alert("Operation failed.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!currentCategory.id) return;
        setIsSubmitting(true);
        try {
            await CostCategoryService.delete(projectId, currentCategory.id);
            setDeleteDialogOpen(false);
            fetchData();
        } catch (e) {
            alert("Failed to delete.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- REORDER HANDLER ---
    const handleRowDrop = async (draggingRow: MRT_Row<CostCategory>, targetRow: MRT_Row<CostCategory>) => {
        // 1. Reorder locally (Optimistic Update)
        const newData = [...data];
        const draggedItem = newData.splice(draggingRow.index, 1)[0];
        newData.splice(targetRow.index, 0, draggedItem);
        setData(newData);

        // 2. Prepare Payload
        const orderedIds = newData.map(item => item.id);

        // 3. Send to Backend
        try {
            await CostCategoryService.reorder(projectId, orderedIds);
        } catch (e) {
            console.error("Reorder failed", e);
            alert("Failed to save new order.");
            fetchData(); // Revert on error
        }
    };

    // --- Columns ---
    const columns = useMemo<MRT_ColumnDef<CostCategory>[]>(
        () => [
            {
                accessorKey: 'title',
                header: 'Cost Category Title',
                size: 250,
                Cell: ({ cell }) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MonetizationOn color="action" fontSize="small" />
                        <Typography variant="body2" fontWeight="bold">
                            {cell.getValue<string>()}
                        </Typography>
                    </Box>
                ),
            },
            {
                accessorKey: 'groups_count', // Assuming backend sends this via withCount
                header: 'Groups',
                size: 100,
                Cell: ({ cell }) => cell.getValue<number>() || 0,
            },
            {
                accessorKey: 'created_at',
                header: 'Created',
                size: 150,
                Cell: ({ cell }) => new Date(cell.getValue<string>()).toLocaleDateString(),
            },
        ],
        []
    );

    const table = useMaterialReactTable({
        columns,
        data,
        // 1. Disable Sorting & Pagination (Essential for Drag & Drop)
        enableSorting: false,
        enablePagination: false,
        enableBottomToolbar: false,
        
        // 2. Manual Logic
        manualPagination: false,
        manualSorting: false, // Not needed since sorting is disabled, but harmless
        manualFiltering: false,
        rowCount: totalRows,

        // 3. State Management
        state: { 
            isLoading: loading, 
            showProgressBars: loading, 
            // pagination, 
            sorting, // Ensures table knows the current sort order (position)
            // globalFilter 
        },
        onPaginationChange: setPagination,
        onGlobalFilterChange: setGlobalFilter, // <--- UNCOMMENTED THIS so search works

        // 4. Drag & Drop Configuration
        enableRowOrdering: true, 
        muiRowDragHandleProps: ({ table }) => ({
            onDragEnd: () => {
                const { draggingRow, hoveredRow } = table.getState();
                if (draggingRow && hoveredRow) {
                    handleRowDrop(
                        draggingRow as MRT_Row<CostCategory>, 
                        hoveredRow as MRT_Row<CostCategory>
                    );
                }
            },
        }),

        // 5. Initial State (Good practice)
        initialState: { 
            sorting: [{ id: 'position', desc: false }],
            density: 'compact' // Usually looks better for lists
        },

        // 6. Actions Column
        enableRowActions: true,
        positionActionsColumn: 'last',
        renderRowActions: ({ row }) => (
            <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                {onSelectCategory && (
                    <Tooltip title="View Groups">
                        <IconButton color="info" onClick={() => onSelectCategory(row.original)}>
                            <FolderOpen />
                        </IconButton>
                    </Tooltip>
                )}
                
                <Tooltip title="Edit">
                    <IconButton color="primary" onClick={() => handleOpenEdit(row.original)}>
                        <Edit />
                    </IconButton>
                </Tooltip>
                
                <Tooltip title="Delete">
                    <IconButton color="error" onClick={() => { setCurrentCategory(row.original); setDeleteDialogOpen(true); }}>
                        <Delete />
                    </IconButton>
                </Tooltip>
            </Box>
        ),
        
        renderTopToolbarCustomActions: () => (
            <Button startIcon={<Refresh />} onClick={fetchData} size="small">Refresh</Button>
        ),
    });

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                    <Typography variant="h5" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MonetizationOn color="primary" /> Cost Categories
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        Manage main cost headers (e.g. Land, Construction, Professional Fees)
                    </Typography>
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
                    Add Category
                </Button>
            </Box>
            
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            
            <MaterialReactTable table={table} />

            {/* --- CREATE / EDIT DIALOG --- */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{isEditMode ? 'Edit Cost Category' : 'Add Cost Category'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <TextField 
                            autoFocus
                            label="Title" fullWidth required 
                            placeholder="e.g. Construction Cost"
                            value={currentCategory.title || ''} 
                            onChange={(e) => setCurrentCategory({...currentCategory, title: e.target.value})}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* --- DELETE DIALOG --- */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography>Are you sure you want to delete <strong>{currentCategory.title}</strong>?</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleDelete} color="error" variant="contained" disabled={isSubmitting}>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CostCategoryListWorkspace;
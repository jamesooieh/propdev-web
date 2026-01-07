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
    DialogContent, DialogContentText, DialogActions, TextField,
    Typography, Alert
} from '@mui/material';
import { Edit, Delete, Refresh, Add, Warning, FolderOpen, ReceiptLong } from '@mui/icons-material';

// Services
import { CostCategory } from '../../../../services/costCategory';
import { CostGroupService, CostGroup } from '../../../../services/costGroup';

interface CostGroupListWorkspaceProps {
    projectId: string;
    costCategory: CostCategory; // Parent Context
    onSelectCostGroup: (group: CostGroup) => void; // Drill down to Cost List
}

const CostGroupListWorkspace: React.FC<CostGroupListWorkspaceProps> = ({
    projectId,
    costCategory,
    onSelectCostGroup
}) => {
    // --- Data State ---
    const [data, setData] = useState<CostGroup[]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- MRT Table State ---
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<MRT_SortingState>([{ id: 'title', desc: false }]);
    const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });

    // --- Create Dialog ---
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // --- Edit Dialog ---
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingGroup, setEditingGroup] = useState<CostGroup | null>(null);
    const [editTitle, setEditTitle] = useState('');

    // --- Delete Dialog ---
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<CostGroup | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- Fetch Data ---
    const fetchGroups = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await CostGroupService.getGroups({
                project_id: projectId,
                cost_category_id: costCategory.id,
                // page: pagination.pageIndex + 1,
                // per_page: pagination.pageSize,
                // search: globalFilter || undefined,
                get_all: true,
                sort: 'position',
                direction: 'asc',
            });
            setData(res.data || []);
            setTotalRows(res.meta?.total || res.total || 0);
        } catch (e) {
            console.error(e);
            setError("Failed to load cost groups.");
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch when category changes
    useEffect(() => {
        fetchGroups();
    }, [projectId, costCategory.id, pagination.pageIndex, pagination.pageSize, sorting, globalFilter]);

    // --- Reorder Logic ---
    const handleRowDrop = async (draggingRow: MRT_Row<CostGroup>, targetRow: MRT_Row<CostGroup>) => {
        // 1. Optimistic Update
        const newData = [...data];
        const draggedItem = newData.splice(draggingRow.index, 1)[0];
        newData.splice(targetRow.index, 0, draggedItem);
        setData(newData);

        // 2. API Call
        try {
            const orderedIds = newData.map(item => item.id);
            await CostGroupService.reorderGroups(projectId, costCategory.id, orderedIds);
        } catch (e) {
            console.error("Reorder failed", e);
            fetchGroups(); // Revert
        }
    };

    // --- Create Logic ---
    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        setIsCreating(true);
        try {
            await CostGroupService.createGroup({
                project_id: projectId,
                cost_category_id: costCategory.id,
                title: newTitle,
            });
            setCreateDialogOpen(false);
            setNewTitle('');
            fetchGroups();
        } catch (e) {
            alert("Failed to create cost group");
        } finally {
            setIsCreating(false);
        }
    };

    // --- Edit Logic ---
    const openEditDialog = (group: CostGroup) => {
        setEditingGroup(group);
        setEditTitle(group.title);
        setEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingGroup || !editTitle.trim()) return;
        try {
            await CostGroupService.updateGroup(
                projectId,
                costCategory.id,
                editingGroup.id,
                { title: editTitle }
            );
            setEditDialogOpen(false);
            fetchGroups();
        } catch (e) {
            setError("Failed to update cost group.");
        }
    };

    // --- Delete Logic ---
    const handleDeleteClick = (group: CostGroup) => {
        setGroupToDelete(group);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!groupToDelete) return;
        setIsDeleting(true);
        try {
            await CostGroupService.deleteGroup(projectId, costCategory.id, groupToDelete.id);
            setDeleteDialogOpen(false);
            fetchGroups();
        } catch (e) {
            setError("Failed to delete cost group. Ensure it has no cost items first.");
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Columns ---
    const columns = useMemo<MRT_ColumnDef<CostGroup>[]>(
        () => [
            {
                accessorKey: 'title',
                header: 'Cost Group Title',
                size: 250,
                Cell: ({ cell }) => (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReceiptLong color="action" fontSize="small" />
                        <Typography variant="body2" fontWeight="bold">
                            {cell.getValue<string>()}
                        </Typography>
                    </Box>
                ),
            },
            {
                accessorKey: 'costs_count', // Assuming backend sends this
                header: 'Items',
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

        // --- 1. DISABLE STANDARD SORTING & PAGINATION ---
        enableSorting: false,       // Drag & drop requires fixed sorting
        enablePagination: false,    // Drag & drop works best with the full list
        enableBottomToolbar: false, // Hide the pagination bar

        // --- 2. MANUAL LOGIC ---
        manualPagination: false,    // Changed from true
        manualSorting: false,       // Changed from true
        manualFiltering: true,      // Keep filtering active
        rowCount: totalRows,

        // --- 3. STATE ---
        state: {
            isLoading: loading,
            showProgressBars: loading,
            sorting,       // Use the fixed sorting state
            globalFilter
            // REMOVED: pagination
        },
        // REMOVED: onPaginationChange, onSortingChange
        onGlobalFilterChange: setGlobalFilter,

        // --- 4. DRAG & DROP CONFIGURATION ---
        enableRowOrdering: true,
        muiRowDragHandleProps: ({ table }) => ({
            onDragEnd: () => {
                const { draggingRow, hoveredRow } = table.getState();
                if (draggingRow && hoveredRow) {
                    handleRowDrop(
                        draggingRow as MRT_Row<CostGroup>,
                        hoveredRow as MRT_Row<CostGroup>,
                    );
                }
            },
        }),

        // --- 5. INITIAL STATE ---
        initialState: {
            density: 'compact',
            sorting: [{ id: 'position', desc: false }] // Force sorting by position
        },

        // --- 6. ACTIONS (Unchanged) ---
        enableRowActions: true,
        positionActionsColumn: 'last',
        enableColumnFilters: false,

        renderRowActions: ({ row }) => (
            <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                <Tooltip title="View Cost Items">
                    <IconButton color="info" onClick={() => onSelectCostGroup(row.original)}>
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
            <Button startIcon={<Refresh />} onClick={fetchGroups} size="small">
                Refresh
            </Button>
        ),
    });

    return (
        <Box>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h5">Cost Groups</Typography>
                    <Typography variant="caption" color="textSecondary">
                        Category: <strong>{costCategory.title}</strong>
                    </Typography>
                </Box>

                <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
                    Add Cost Group
                </Button>
            </Box>

            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}

            <MaterialReactTable table={table} />

            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Add New Cost Group</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus margin="dense" label="Group Title" fullWidth
                        placeholder="e.g. Substructure / Superstructure"
                        value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreate} disabled={isCreating}>Create</Button>
                </DialogActions>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Edit Cost Group</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus margin="dense" label="Group Title" fullWidth
                        value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveEdit} variant="contained">Save</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Dialog */}
            <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Warning color="error" /> Confirm Deletion
                </DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Delete group <strong>{groupToDelete?.title}</strong>?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                    <Button onClick={confirmDelete} color="error" variant="contained" disabled={isDeleting}>Delete</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default CostGroupListWorkspace;
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
import { Edit, Delete, Refresh, Add, Warning, FolderOpen } from '@mui/icons-material';

// Services & Enums
import { GroupService, Group } from '../../../../services/group';
import { Category } from '../../../../services/category';
import { GroupStatus } from '../../../../enums'; // Define GroupStatusLabels similar to Category

// Define labels locally if not in enums yet
const GroupStatusLabels: Record<string, string> = {
    'A': 'Active',
    'I': 'Inactive'
};

interface GroupListWorkspaceProps {
    projectId: string;
    category: Category; // We need the full category object context
    onSelectGroup: (group: Group) => void;
}

const GroupListWorkspace: React.FC<GroupListWorkspaceProps> = ({ projectId, category, onSelectGroup }) => {
    // --- Data State ---
    const [data, setData] = useState<Group[]>([]);
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
    const [editingGroup, setEditingGroup] = useState<Group | null>(null);
    const [editTitle, setEditTitle] = useState('');

    // --- Delete Dialog ---
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<Group | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- Fetch Data ---
    const fetchGroups = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await GroupService.getAll({
                project_id: projectId,
                category_id: category.id,
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
                search: globalFilter || undefined,
                sort: sorting.length > 0 ? sorting[0].id : 'created_at',
                direction: (sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc') as 'asc' | 'desc',
            });
            setData(res.data || []);
            setTotalRows(res.meta?.total || res.total || 0);
        } catch (e) {
            console.error(e);
            setError("Failed to load groups.");
        } finally {
            setLoading(false);
        }
    };

    // Re-fetch when category changes
    useEffect(() => { 
        fetchGroups(); 
    }, [projectId, category.id, pagination.pageIndex, pagination.pageSize, sorting, globalFilter]);

    // --- Create Logic ---
    const handleCreate = async () => {
        if (!newTitle.trim()) return;
        setIsCreating(true);
        try {
            await GroupService.create({
                project_id: projectId,
                category_id: category.id,
                title: newTitle,
                status: 'A' as GroupStatus // Default status
            });
            setCreateDialogOpen(false);
            setNewTitle('');
            fetchGroups();
        } catch (e) {
            alert("Failed to create group");
        } finally {
            setIsCreating(false);
        }
    };

    // --- Edit Logic ---
    const openEditDialog = (group: Group) => {
        setEditingGroup(group);
        setEditTitle(group.title);
        setEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingGroup || !editTitle.trim()) return;
        try {
            await GroupService.update(projectId, category.id, editingGroup.id, {
                title: editTitle,
                status: 'A' as GroupStatus // Default status
            });
            setEditDialogOpen(false);
            fetchGroups();
        } catch (e) {
            setError("Failed to update group.");
        }
    };

    // --- Delete Logic ---
    const handleDeleteClick = (group: Group) => {
        setGroupToDelete(group);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!groupToDelete) return;
        setIsDeleting(true);
        try {
            await GroupService.delete(projectId, category.id, groupToDelete.id);
            setDeleteDialogOpen(false);
            fetchGroups();
        } catch (e) {
            setError("Failed to delete group.");
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Columns ---
    const columns = useMemo<MRT_ColumnDef<Group>[]>(
        () => [
            {
                accessorKey: 'title',
                header: 'Group Title',
                size: 200,
                Cell: ({ cell }) => <strong>{cell.getValue<string>()}</strong>
            },
            {
                accessorKey: 'status',
                header: 'Status',
                size: 100,
                Cell: ({ cell }) => (
                    <Chip 
                        label={GroupStatusLabels[cell.getValue<string>()] || cell.getValue<string>()} 
                        color={cell.getValue<string>() === 'A' ? 'success' : 'default'} 
                        size="small" 
                        variant="outlined"
                    />
                )
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
        initialState: { density: 'compact' },
        
        renderRowActions: ({ row }) => (
            <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                <Tooltip title="View Types">
                    <IconButton color="info" onClick={() => onSelectGroup(row.original)}>
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
                    <Typography variant="h5">Groups</Typography>
                    <Typography variant="caption" color="textSecondary">
                        Category: <strong>{category.title}</strong>
                    </Typography>
                </Box>
                
                <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
                    Add Group
                </Button>
            </Box>
            
            {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
            
            <MaterialReactTable table={table} />

            {/* Create Dialog */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle>Add New Group</DialogTitle>
                <DialogContent>
                    <TextField 
                        autoFocus margin="dense" label="Group Title" fullWidth 
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
                <DialogTitle>Edit Group</DialogTitle>
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

export default GroupListWorkspace;
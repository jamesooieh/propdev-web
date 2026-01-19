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
    Grid, Divider,
} from '@mui/material';
import { Edit, Delete, Refresh, Add, Warning, FolderOpen, RemoveCircleOutline } from '@mui/icons-material';

// Services & Enums
import { GroupService, Group } from '../../../../services/group';
import { Category } from '../../../../services/category';
import { GroupStatus } from '../../../../enums'; // Define GroupStatusLabels similar to Category

// Define labels locally if not in enums yet
const GroupStatusLabels: Record<string, string> = {
    'A': 'Active',
    'I': 'Inactive'
};

// 🆕 Interface for Level 3: Types (Local State)
interface LocalTypeState {
    id?: string;
    title: string;
}

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

    // --- 🔧 Unified Dialog State ---
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    
    // 🆕 Form Data State (Shared for Create/Edit)
    const [formTitle, setFormTitle] = useState('');
    const [formTypes, setFormTypes] = useState<LocalTypeState[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    // 🆕 --- Nested Type Logic (Local Form Actions) ---
    const handleAddTypeRow = () => {
        setFormTypes([...formTypes, { title: '' }]);
    };

    const handleRemoveTypeRow = (index: number) => {
        const updated = [...formTypes];
        updated.splice(index, 1);
        setFormTypes(updated);
    };

    const handleTypeChange = (index: number, field: keyof LocalTypeState, val: any) => {
        const updated = [...formTypes];
        // @ts-ignore
        updated[index][field] = val;
        setFormTypes(updated);
    };

    // --- Create Logic ---
    const handleOpenCreate = () => {
        // 🔧 Reset form
        setFormTitle('');
        setFormTypes([]);
        setEditingId(null);
        setCreateDialogOpen(true);
    };

    // --- Create Logic ---
    const handleCreate = async () => {
        if (!formTitle.trim()) return;
        setIsSubmitting(true); // 🔧 Renamed from isCreating
        try {
            await GroupService.create({
                project_id: projectId,
                category_id: category.id,
                title: formTitle,
                status: 'A' as GroupStatus,
                // 🆕 Send Nested Types
                types: formTypes.filter(t => t.title.trim() !== '')
            });
            setCreateDialogOpen(false);
            fetchGroups();
        } catch (e) {
            alert("Failed to create group");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Edit Logic ---
    const handleOpenEdit = (group: Group) => {
        // 🔧 Populate form
        setFormTitle(group.title);
        setEditingId(group.id);
        
        // 🆕 Map existing types to local state
        // @ts-ignore - Assuming backend returns 'types'
        const existingTypes = group.types?.map((t: any) => ({
            id: t.id,
            title: t.title,
        })) || [];
        
        setFormTypes(existingTypes);
        setEditDialogOpen(true);
    };

    const handleSaveEdit = async () => {
        if (!editingId || !formTitle.trim()) return;
        setIsSubmitting(true);
        try {
            await GroupService.update(projectId, category.id, editingId, {
                title: formTitle,
                status: 'A' as GroupStatus,
                // 🆕 Send Nested Types
                types: formTypes.filter(t => t.title.trim() !== '')
            });
            setEditDialogOpen(false);
            fetchGroups();
        } catch (e) {
            setError("Failed to update group.");
        } finally {
            setIsSubmitting(false);
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

            {
                id: 'types_count',
                header: 'Types',
                size: 100,
                Cell: ({ row }) => {
                    // @ts-ignore
                    const count = row.original.types?.length || 0;
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
        initialState: { density: 'compact' },
        
        renderRowActions: ({ row }) => (
            <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                <Tooltip title="View Types">
                    <IconButton color="info" onClick={() => onSelectGroup(row.original)}>
                        <FolderOpen />
                    </IconButton>
                </Tooltip>
                
                <Tooltip title="Edit">
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
            <Button startIcon={<Refresh />} onClick={fetchGroups} size="small">
                Refresh
            </Button>
        ),
    });

    // 🆕 Helper to render the Dialog Form
    const renderDialogContent = () => (
        <Box sx={{ mt: 1 }}>
            <TextField
                autoFocus margin="dense" label="Group Title" fullWidth
                value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
            />

            {/* Types Header */}
            <Box sx={{ mt: 3, mb: 1 }}>
                <Grid container justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle2" color="primary">Associated Types</Typography>
                    <Button size="small" startIcon={<Add />} onClick={handleAddTypeRow}>
                        Add Type
                    </Button>
                </Grid>
                <Divider sx={{ my: 1 }} />
            </Box>

            {/* Types List */}
            <Box sx={{ maxHeight: '300px', overflowY: 'auto', pr: 1 }}>
                {formTypes.map((type, index) => (
                    <Grid container spacing={1} key={index} alignItems="center" sx={{ mb: 1 }}>
                        <Grid size={{ xs: 10 }}>
                            <TextField 
                                placeholder="Type Title (e.g. Type A)"
                                fullWidth 
                                size="small"
                                value={type.title}
                                onChange={(e) => handleTypeChange(index, 'title', e.target.value)}
                            />
                        </Grid>
                        <Grid size={{ xs: 2 }} sx={{ textAlign: 'center' }}>
                            <IconButton size="small" color="error" onClick={() => handleRemoveTypeRow(index)}>
                                <RemoveCircleOutline fontSize="small" />
                            </IconButton>
                        </Grid>
                    </Grid>
                ))}
                
                {formTypes.length === 0 && (
                    <Typography variant="caption" color="textSecondary" sx={{ fontStyle: 'italic', display: 'block', textAlign: 'center' }}>
                        No types added yet.
                    </Typography>
                )}
            </Box>
        </Box>
    );

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

            {/* Create Dialog 🔧 */}
            <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Add New Group</DialogTitle>
                <DialogContent>
                    {renderDialogContent()} {/* 🆕 Render Shared Form */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                    <Button variant="contained" onClick={handleCreate} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Edit Dialog 🔧 */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Edit Group</DialogTitle>
                <DialogContent>
                    {renderDialogContent()} {/* 🆕 Render Shared Form */}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveEdit} variant="contained" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
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
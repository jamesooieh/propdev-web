import React, { useMemo, useState, useEffect } from 'react';
import {
    IonContent, IonPage, useIonViewWillEnter
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { DeveloperService, Developer, DeveloperParams } from '../../services/developer';
import {
    DeveloperStatus, DeveloperStatusLabels, getCountryLabel
} from '../../enums';
import { usePermission } from '../../hooks/usePermission'; // <--- Permission Hook
import PageHeader from '../../components/common/PageHeader';

// MRT Imports
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_SortingState,
    type MRT_PaginationState,
} from 'material-react-table';

// MUI Imports
import {
    Container, Box, Typography, Button, Alert, IconButton, Chip, Tooltip,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, CircularProgress
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Warning } from '@mui/icons-material';

const DeveloperList: React.FC = () => {
    const history = useHistory();
    const { can } = usePermission(); // Initialize Permission Hook

    // --- SERVER-SIDE STATE MANAGEMENT ---
    const [data, setData] = useState<Developer[]>([]);
    const [totalRows, setTotalRows] = useState(0); 

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // MRT States
    const [globalFilter, setGlobalFilter] = useState(''); 
    const [sorting, setSorting] = useState<MRT_SortingState>([
        { id: 'name', desc: false } 
    ]);
    const [pagination, setPagination] = useState<MRT_PaginationState>({
        pageIndex: 0, 
        pageSize: 10,
    });

    // Delete Dialog States
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [developerToDelete, setDeveloperToDelete] = useState<Developer | null>(null); // Track full object
    const [isDeleting, setIsDeleting] = useState(false);

    // 1. Fetch Data Function
    const fetchDevelopers = async () => {
        // Basic permission guard for fetching
        if (!can('view-developers')) return;

        setLoading(true);
        setError(null);
        try {
            const queryParams: DeveloperParams = { 
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
                search: globalFilter || undefined,
                sort: sorting.length > 0 ? sorting[0].id : 'created_at',
                direction: (sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc') as 'asc' | 'desc',
            };

            const res = await DeveloperService.getAll(queryParams);
            setData(res.data);
            setTotalRows(res.meta?.total || res.total || 0);

        } catch (err: any) {
            console.error(err);
            if (err.response?.status === 403) {
                setError("Access Denied.");
            } else {
                setError("Failed to load developers.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDevelopers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.pageIndex, pagination.pageSize, sorting, globalFilter]);

    useIonViewWillEnter(() => {
        fetchDevelopers();
    });

    // --- Delete Logic ---

    const handleDeleteClick = (developer: Developer) => {
        setDeveloperToDelete(developer);
        setDeleteDialogOpen(true);
        setError(null); // Clear previous errors
    };

    const confirmDelete = async () => {
        if (!developerToDelete) return;
        setIsDeleting(true);
        setError(null);

        try {
            await DeveloperService.delete(developerToDelete.id);
            setDeleteDialogOpen(false);
            setDeveloperToDelete(null);
            fetchDevelopers();
        } catch (err: any) {
            console.error(err);
            setDeleteDialogOpen(false); // Close dialog

            // Handle specific 422 Integrity Error (e.g., active projects)
            if (err.response && err.response.status === 422) {
                setError(err.response.data.message || "Cannot delete this developer because they have active projects.");
            } else {
                setError("An unexpected error occurred while deleting the developer.");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    // 3. Define Columns
    const columns = useMemo<MRT_ColumnDef<Developer>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Developer', 
                size: 250,
                Cell: ({ row }) => (
                    <Box>
                        <Typography variant="body2" fontWeight="bold">
                            {row.original.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            {row.original.city}, {row.original.country ? getCountryLabel(row.original.country) : ''}
                        </Typography>
                    </Box>
                ),
            },
            {
                accessorKey: 'license_no',
                header: 'License No',
                size: 160,
            },
            {
                accessorKey: 'contact_person',
                header: 'Contact Person',
                size: 120,
            },
            {
                accessorKey: 'email', 
                header: 'Email',
                size: 150,
            },
            {
                accessorKey: 'phone_mobile', 
                header: 'Contact No',
                size: 130,
            },
            {
                accessorKey: 'status',
                header: 'Status',
                size: 100,
                Cell: ({ cell }) => {
                    const status = cell.getValue<DeveloperStatus>();
                    return (
                        <Chip
                            label={DeveloperStatusLabels[status] || status}
                            size="small"
                            color={status === DeveloperStatus.ACTIVE ? 'success' : 'default'}
                            variant="outlined"
                        />
                    );
                },
            },
        ],
        [],
    );

    // 4. Configure Table
    const table = useMaterialReactTable({
        columns,
        data,
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true, 
        rowCount: totalRows, 
        state: {
            isLoading: loading,
            showProgressBars: loading,
            pagination,
            sorting,
            globalFilter,
        },
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,
        enableRowActions: true,
        positionActionsColumn: 'last',
        renderRowActions: ({ row }) => (
            <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                {/* CHECK PERMISSION: Update */}
                {can('update-developers') && (
                    <Tooltip title="Edit">
                        <IconButton color="primary" onClick={() => history.push(`/developers/edit/${row.original.id}`)}>
                            <Edit />
                        </IconButton>
                    </Tooltip>
                )}
                
                {/* CHECK PERMISSION: Delete */}
                {can('delete-developers') && (
                    <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => handleDeleteClick(row.original)}>
                            <Delete />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        ),
        renderTopToolbarCustomActions: () => (
            <Button startIcon={<Refresh />} onClick={fetchDevelopers} size="small">
                Refresh
            </Button>
        ),
        muiTablePaperProps: { elevation: 2, sx: { borderRadius: '8px' } },
        enableColumnFilters: false, 
    });

    return (
        <IonPage>
            <IonContent fullscreen>
                <PageHeader title="Developer Management" />

                <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
                    <Container maxWidth="xl">
                        
                        {/* Header Actions */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h5" fontWeight="bold">Developer Management</Typography>
                            
                            {/* CHECK PERMISSION: Create */}
                            {can('create-developers') && (
                                <Button variant="contained" startIcon={<Add />} onClick={() => history.push('/developers/create')}>
                                    New Developer
                                </Button>
                            )}
                        </Box>

                        {/* Permission Error or Table */}
                        {!can('view-developers') ? (
                             <Alert severity="error">You do not have permission to view this data.</Alert>
                        ) : (
                            <>
                                {error && (
                                    <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
                                        {error}
                                    </Alert>
                                )}
                                <MaterialReactTable table={table} />
                            </>
                        )}

                        {/* --- Delete Confirmation Dialog --- */}
                        <Dialog open={deleteDialogOpen} onClose={() => !isDeleting && setDeleteDialogOpen(false)}>
                            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Warning color="error" /> Confirm Deletion
                            </DialogTitle>
                            <DialogContent>
                                <DialogContentText>
                                    Are you sure you want to delete the developer <strong>{developerToDelete?.name}</strong>?
                                    <br /><br />
                                    This action will remove the developer account and credentials.
                                    <br />
                                    <Typography variant="caption" color="text.secondary">
                                        (Note: Deletion will be blocked if this developer owns any active projects or land.)
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

                    </Container>
                </Box>
            </IonContent>
        </IonPage>
    );
};

export default DeveloperList;
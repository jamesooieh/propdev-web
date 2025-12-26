import React, { useMemo, useState, useEffect } from 'react';
import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { LandService, Land, LandParams } from '../../services/land';
import { LandStatus, LandStatusLabels, LandTenureTypeLabels, MalaysiaStateLabels, MalaysiaState, LandTenureType } from '../../enums';
import { usePermission } from '../../hooks/usePermission';

// UI Components
import PageHeader from '../../components/common/PageHeader';
import {
    MaterialReactTable,
    useMaterialReactTable,
    type MRT_ColumnDef,
    type MRT_SortingState,
    type MRT_PaginationState,
} from 'material-react-table';
import {
    Container, Box, Typography, Button, Alert, IconButton, Chip, Tooltip,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, CircularProgress
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Warning } from '@mui/icons-material';

const LandList: React.FC = () => {
    const history = useHistory();
    const { can } = usePermission();

    // --- State ---
    const [data, setData] = useState<Land[]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // MRT State
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<MRT_SortingState>([{ id: 'lot', desc: false }]);
    const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });

    // Delete Dialog State
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [landToDelete, setLandToDelete] = useState<Land | null>(null); // Track full object
    const [isDeleting, setIsDeleting] = useState(false);

    // --- Fetch Data ---
    const fetchLands = async () => {
        if (!can('view-lands')) return;

        setLoading(true);
        setError(null);
        try {
            const queryParams: LandParams = {
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
                search: globalFilter || undefined,
                sort: sorting.length > 0 ? sorting[0].id : 'created_at',
                direction: (sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc') as 'asc' | 'desc',
            };
            const res = await LandService.getAll(queryParams);
            setData(res.data);
            setTotalRows(res.meta?.total || res.total || 0);
        } catch (err: any) {
            console.error(err);
            setError("Failed to load lands.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchLands(); }, [pagination.pageIndex, pagination.pageSize, sorting, globalFilter]);
    useIonViewWillEnter(() => { fetchLands(); });

    // --- Delete Logic ---

    const handleDeleteClick = (land: Land) => {
        setLandToDelete(land);
        setDeleteDialogOpen(true);
        setError(null); // Clear previous errors
    };

    const confirmDelete = async () => {
        if (!landToDelete) return;
        setIsDeleting(true);
        setError(null);

        try {
            await LandService.delete(landToDelete.id);
            setDeleteDialogOpen(false);
            setLandToDelete(null);
            fetchLands();
        } catch (err: any) {
            console.error(err);
            setDeleteDialogOpen(false); // Close dialog to show error on main screen

            // Handle specific 422 Integrity Error (e.g., land assigned to projects)
            if (err.response && err.response.status === 422) {
                setError(err.response.data.message || "Cannot delete this land because it is currently assigned to a project.");
            } else {
                setError("An unexpected error occurred while deleting the land record.");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Columns ---
    const columns = useMemo<MRT_ColumnDef<Land>[]>(
        () => [
            {
                accessorKey: 'lot',
                header: 'Lot No.',
                size: 120,
                Cell: ({ cell }) => <strong>{cell.getValue<string>()}</strong>
            },
            {
                accessorKey: 'state',
                header: 'State',
                size: 120,
                Cell: ({ cell }) => (
                    <Typography variant="body2">
                        {MalaysiaStateLabels[cell.getValue<MalaysiaState>()] || cell.getValue<string>()}
                    </Typography>
                ),
            },
            {
                accessorKey: 'district',
                header: 'District',
                size: 120,
                Cell: ({ cell }) => (
                    <Typography variant="body2">
                        {cell.getValue<string>() || '-'}
                    </Typography>
                ),
            },
            {
                accessorKey: 'town',
                header: 'Mukim / Town',
                size: 120,
            },
            {
                accessorKey: 'tenure_type',
                header: 'Tenure',
                size: 120,
                Cell: ({ cell, row }) => (
                    <Box>
                        <Typography variant="body2">
                            {LandTenureTypeLabels[cell.getValue<LandTenureType>()]}
                        </Typography>
                        {cell.getValue<string>() === 'leasehold' && row.original.lease_expiry && (
                            <Typography variant="caption" color="textSecondary">
                                Exp: {row.original.lease_expiry}
                            </Typography>
                        )}
                    </Box>
                )
            },
            {
                accessorKey: 'status',
                header: 'Status',
                size: 100,
                Cell: ({ cell }) => {
                    const status = cell.getValue<LandStatus>();
                    const statusColors: Record<LandStatus, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
                        [LandStatus.ACQUIRED]: 'info',
                        [LandStatus.DEVELOPED]: 'success',
                        [LandStatus.DISPOSED]: 'default',
                    };

                    return (
                        <Chip
                            label={LandStatusLabels[status] || status}
                            size="small"
                            color={statusColors[status] || 'default'}
                            variant="outlined"
                        />
                    );
                },
            },
        ],
        [],
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
        renderRowActions: ({ row }) => (
            <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                {can('update-lands') && (
                    <Tooltip title="Edit">
                        <IconButton color="primary" onClick={() => history.push(`/lands/edit/${row.original.id}`)}>
                            <Edit />
                        </IconButton>
                    </Tooltip>
                )}
                {can('delete-lands') && (
                    <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => handleDeleteClick(row.original)}>
                            <Delete />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        ),
        renderTopToolbarCustomActions: () => (
            <Button startIcon={<Refresh />} onClick={fetchLands} size="small">Refresh</Button>
        ),
        muiTablePaperProps: { elevation: 2, sx: { borderRadius: '8px' } },
        enableColumnFilters: false,
    });

    return (
        <IonPage>
            <IonContent fullscreen>
                <PageHeader title="Land Bank" />
                <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
                    <Container maxWidth="xl">

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                            {can('create-lands') && (
                                <Button variant="contained" startIcon={<Add />} onClick={() => history.push('/lands/create')}>
                                    Add Land
                                </Button>
                            )}
                        </Box>

                        {!can('view-lands') ? (
                            <Alert severity="error">You do not have permission to view this data.</Alert>
                        ) : (
                            <>
                                {/* Display Errors Here */}
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
                                    Are you sure you want to delete the land Lot No. <strong>{landToDelete?.lot}</strong>?
                                    <br /><br />
                                    This action will remove the land record from the system.
                                    <br />
                                    <Typography variant="caption" color="text.secondary">
                                        (Note: Deletion will be blocked if this land is currently assigned to any projects.)
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

export default LandList;
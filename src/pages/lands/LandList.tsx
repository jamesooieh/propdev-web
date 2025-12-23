import React, { useMemo, useState, useEffect } from 'react';
import { IonContent, IonPage, useIonViewWillEnter } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { LandService, Land, LandParams } from '../../services/land';
import { LandStatus, LandStatusLabels, LandTenureTypeLabels, MalaysiaStateLabels, MalaysiaState, LandTenureType } from '../../enums';
import { usePermission } from '../../hooks/usePermission'; // <--- Your new hook

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
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle
} from '@mui/material';
import { Add, Edit, Delete, Refresh, Warning } from '@mui/icons-material';

const LandList: React.FC = () => {
    const history = useHistory();
    const { can } = usePermission(); // Initialize Permission Hook

    // --- State ---
    const [data, setData] = useState<Land[]>([]);
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // MRT State
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState<MRT_SortingState>([{ id: 'created_at', desc: true }]);
    const [pagination, setPagination] = useState<MRT_PaginationState>({ pageIndex: 0, pageSize: 10 });

    // Delete Dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- Fetch Data ---
    const fetchLands = async () => {
        if (!can('view-lands')) return; // Basic guard

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
    const confirmDelete = async () => {
        if (!idToDelete) return;
        setIsDeleting(true);
        try {
            await LandService.delete(idToDelete);
            setDeleteDialogOpen(false);
            setIdToDelete(null);
            fetchLands();
        } catch (err) {
            alert("Failed to delete.");
        } finally {
            setIsDeleting(false);
        }
    };

    // --- Columns ---
    const columns = useMemo<MRT_ColumnDef<Land>[]>(
        () => [
            {
                accessorKey: 'lot',
                header: 'Land Details',
                size: 250,
                Cell: ({ row }) => (
                    <Box>
                        <Typography variant="body2" fontWeight="bold">Lot {row.original.lot}</Typography>
                        <Typography variant="caption" color="textSecondary">
                            {row.original.town}, {MalaysiaStateLabels[row.original.state as MalaysiaState]}
                        </Typography>
                    </Box>
                ),
            },
            {
                accessorKey: 'tenure_type',
                header: 'Tenure',
                size: 150,
                Cell: ({ cell, row }) => (
                    <Box>
                        <Typography variant="body2">
                            {LandTenureTypeLabels[cell.getValue<LandTenureType>()]}
                        </Typography>
                        {/* Show expiry if Leasehold */}
                        {cell.getValue<string>() === 'leasehold' && row.original.lease_expiry && (
                            <Typography variant="caption" color="textSecondary">
                                Exp: {row.original.lease_expiry}
                            </Typography>
                        )}
                    </Box>
                )
            },
            {
                accessorKey: 'zoning',
                header: 'Zoning',
                size: 120,
            },
            {
                accessorKey: 'status',
                header: 'Status',
                size: 100,
                Cell: ({ cell }) => {
                    const status = cell.getValue<LandStatus>();

                    // Define color mapping for your specific statuses
                    const statusColors: Record<LandStatus, "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning"> = {
                        [LandStatus.ACQUIRED]: 'info',      // Blue (In possession)
                        [LandStatus.DEVELOPED]: 'success',  // Green (Completed)
                        [LandStatus.DISPOSED]: 'default',   // Grey (No longer active)
                    };

                    return (
                        <Chip
                            // Use the label map, fallback to the raw code if missing
                            label={LandStatusLabels[status] || status}
                            size="small"
                            // Look up the color, default to 'default' if undefined
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

                {/* CHECK PERMISSION: Update */}
                {can('update-lands') && (
                    <Tooltip title="Edit">
                        <IconButton color="primary" onClick={() => history.push(`/lands/edit/${row.original.id}`)}>
                            <Edit />
                        </IconButton>
                    </Tooltip>
                )}

                {/* CHECK PERMISSION: Delete */}
                {can('delete-lands') && (
                    <Tooltip title="Delete">
                        <IconButton color="error" onClick={() => { setIdToDelete(row.original.id); setDeleteDialogOpen(true); }}>
                            <Delete />
                        </IconButton>
                    </Tooltip>
                )}
            </Box>
        ),
        renderTopToolbarCustomActions: () => (
            <Button startIcon={<Refresh />} onClick={fetchLands} size="small">Refresh</Button>
        ),
        muiTablePaperProps: { elevation: 2, sx: { borderRadius: '8px' } }
    });

    return (
        <IonPage>
            <IonContent fullscreen>
                <PageHeader title="Land Bank" />
                <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
                    <Container maxWidth="xl">

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                            {/* CHECK PERMISSION: Create */}
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
                                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                                <MaterialReactTable table={table} />
                            </>
                        )}

                        {/* Delete Dialog */}
                        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Warning color="warning" /> Confirm Delete
                            </DialogTitle>
                            <DialogContent>
                                <DialogContentText>Are you sure you want to delete this land record?</DialogContentText>
                            </DialogContent>
                            <DialogActions sx={{ p: 2 }}>
                                <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                                <Button onClick={confirmDelete} color="error" variant="contained" disabled={isDeleting}>
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
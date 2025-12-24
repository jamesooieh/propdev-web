import React, { useMemo, useState, useEffect } from 'react';
import {
    IonContent, IonPage, useIonViewWillEnter
} from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { DeveloperService, Developer, DeveloperParams } from '../../services/developer';
import {
    DeveloperStatus, DeveloperStatusLabels, getCountryLabel
} from '../../enums';
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

    // --- SERVER-SIDE STATE MANAGEMENT ---
    const [data, setData] = useState<Developer[]>([]);
    const [totalRows, setTotalRows] = useState(0); // For Pagination

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // MRT States
    const [globalFilter, setGlobalFilter] = useState(''); // Search
    const [sorting, setSorting] = useState<MRT_SortingState>([
        { id: 'name', desc: false } // 'id' must match the accessorKey in your columns
    ]);
    const [pagination, setPagination] = useState<MRT_PaginationState>({
        pageIndex: 0, // MRT uses 0-based index
        pageSize: 10,
    });

    // Dialog States
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [developerToDelete, setDeveloperToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // 1. Fetch Data Function
    const fetchDevelopers = async () => {
        setLoading(true);
        setError(null);
        try {
            // Prepare Query Params for Laravel
            const queryParams: DeveloperParams = { // <--- Explicitly type this object
                page: pagination.pageIndex + 1,
                per_page: pagination.pageSize,
                search: globalFilter || undefined,
                sort: sorting.length > 0 ? sorting[0].id : 'created_at',
                // Fix: Cast the result to the specific type
                direction: (sorting.length > 0 ? (sorting[0].desc ? 'desc' : 'asc') : 'desc') as 'asc' | 'desc',
            };

            const res = await DeveloperService.getAll(queryParams);

            // Handle Laravel Resource Collection Structure
            // Usually: { data: [...], meta: { total: 100, ... } }
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

    // 2. React to State Changes
    // Whenever pagination, sorting, or search changes, refetch data.
    useEffect(() => {
        fetchDevelopers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.pageIndex, pagination.pageSize, sorting, globalFilter]);

    // Initial Load handled by useEffect, but we keep this for navigation return
    useIonViewWillEnter(() => {
        fetchDevelopers();
    });

    // ... (handleDelete logic remains the same) ...
    const clickDeleteIcon = (id: string) => {
        setDeveloperToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!developerToDelete) return;
        setIsDeleting(true);
        try {
            await DeveloperService.delete(developerToDelete);
            setDeleteDialogOpen(false);
            setDeveloperToDelete(null);
            fetchDevelopers();
        } catch (err) {
            alert("Failed to delete.");
        } finally {
            setIsDeleting(false);
        }
    };

    // 3. Define Columns
    const columns = useMemo<MRT_ColumnDef<Developer>[]>(
        () => [
            {
                accessorKey: 'name',
                header: 'Developer', // Changed from 'Company Name'
                size: 250,
                Cell: ({ row }) => (
                    <Box>
                        <Typography variant="body2" fontWeight="bold">
                            {row.original.name}
                        </Typography>
                        {/* Kept the city/country subtitle as it's useful context */}
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
                accessorKey: 'email', // New Column
                header: 'Email',
                size: 150,
            },
            {
                accessorKey: 'phone_mobile', // New Column
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

    // 4. Configure Table for Server-Side Mode
    const table = useMaterialReactTable({
        columns,
        data, // Use the fetched data

        // Server-Side Flags
        manualPagination: true,
        manualSorting: true,
        manualFiltering: true, // If using global filter

        // State Mapping
        rowCount: totalRows, // Tell MRT how many rows exist in total (from backend)
        state: {
            isLoading: loading,
            showProgressBars: loading,
            pagination,
            sorting,
            globalFilter,
        },

        // State Updaters
        onPaginationChange: setPagination,
        onSortingChange: setSorting,
        onGlobalFilterChange: setGlobalFilter,

        enableRowActions: true,
        positionActionsColumn: 'last',
        renderRowActions: ({ row }) => (
            <Box sx={{ display: 'flex', gap: '0.5rem' }}>
                <Tooltip title="Edit">
                    <IconButton color="primary" onClick={() => history.push(`/developers/edit/${row.original.id}`)}>
                        <Edit />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Delete">
                    <IconButton color="error" onClick={() => clickDeleteIcon(row.original.id)}>
                        <Delete />
                    </IconButton>
                </Tooltip>
            </Box>
        ),
        renderTopToolbarCustomActions: () => (
            <Button startIcon={<Refresh />} onClick={fetchDevelopers} size="small">
                Refresh
            </Button>
        ),
        muiTablePaperProps: { elevation: 2, sx: { borderRadius: '8px' } },

        // --- DISABLE FILTERS ---
        enableColumnFilters: false, // Hides inputs under column headers
    });

    return (
        <IonPage>
            <IonContent fullscreen>
                {/* Header */}
                <PageHeader title="Developer Management" />

                <Box sx={{ p: 3, bgcolor: '#f5f5f5', minHeight: 'calc(100vh - 64px)' }}>
                    <Container maxWidth="xl">
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h5" fontWeight="bold">Developer Management</Typography>
                            <Button variant="contained" startIcon={<Add />} onClick={() => history.push('/developers/create')}>
                                New Developer
                            </Button>
                        </Box>

                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                        <MaterialReactTable table={table} />

                        {/* Dialog Component (Same as before) */}
                        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
                            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Warning color="warning" /> Confirm Delete
                            </DialogTitle>
                            <DialogContent>
                                <DialogContentText>Are you sure? This cannot be undone.</DialogContentText>
                            </DialogContent>
                            <DialogActions sx={{ p: 2 }}>
                                <Button onClick={() => setDeleteDialogOpen(false)} disabled={isDeleting}>Cancel</Button>
                                <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={isDeleting}>
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